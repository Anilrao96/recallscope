import neo4j from "neo4j-driver";

let driver;

export function configured() {
  return Boolean(process.env.COGNODB_URI && process.env.COGNODB_USERNAME && process.env.COGNODB_PASSWORD);
}

export function getDriver() {
  if (!configured()) return null;
  if (!driver) {
    driver = neo4j.driver(
      process.env.COGNODB_URI,
      neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD)
    );
  }
  return driver;
}

// Parameterized, multi-hop traversal: a recalled batch -> unit -> customer.
export async function getAffectedUnits(batchId) {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH path = (batch:PartBatch {id: $batchId})-[:INSTALLED_IN]->(unit:ProductUnit)-[:SOLD_TO]->(customer:Customer)
       OPTIONAL MATCH (customer)-[:LOCATED_IN]->(region:Region)
       RETURN DISTINCT unit.id AS id, unit.model AS model, customer.name AS owner, region.name AS city,
              coalesce(unit.status, 'in_use') AS state,
              CASE WHEN customer.activeVehicle = true THEN 'Urgent' ELSE 'Priority' END AS risk,
              [node IN nodes(path) | CASE WHEN node:Customer THEN node.name ELSE coalesce(node.id, node.name) END] AS path
       ORDER BY customer.name`,
      { batchId }
    );
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
}

export async function getRecallDashboard(batchId) {
  const units = await getAffectedUnits(batchId);
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (batch:PartBatch {id: $batchId})
       RETURN batch.id AS id, coalesce(batch.name, 'Part batch recall') AS title,
              coalesce(batch.risk, 'critical') AS severity,
              CASE WHEN batch.receivedAt IS NULL THEN ''
                   ELSE toString(batch.receivedAt.year) + '-' + toString(batch.receivedAt.month) + '-' + toString(batch.receivedAt.day) END AS detectedAt`,
      { batchId }
    );
    if (!result.records.length) return null;
    return { batch: result.records[0].toObject(), units };
  } finally {
    await session.close();
  }
}

export async function createRecallPlan(batchId) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (batch:PartBatch {id: $batchId})
       MERGE (plan:RecallPlan {batchId: $batchId})
       ON CREATE SET plan.createdAt = datetime(), plan.status = 'draft'
       SET plan.updatedAt = datetime()
       RETURN plan.status AS status, toString(plan.updatedAt) AS updatedAt`,
      { batchId }
    );
    if (!result.records.length) return null;
    return result.records[0].toObject();
  } finally {
    await session.close();
  }
}
