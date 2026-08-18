import "dotenv/config";
import neo4j from "neo4j-driver";

const required = ["COGNODB_URI", "COGNODB_USERNAME", "COGNODB_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing ${missing.join(", ")}. Copy .env.example to .env and add your CognoDB connection details.`);
  process.exit(1);
}

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD)
);
const session = driver.session();

const constraints = [
  "CREATE CONSTRAINT part_batch_id IF NOT EXISTS FOR (n:PartBatch) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT product_unit_id IF NOT EXISTS FOR (n:ProductUnit) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (n:Customer) REQUIRE n.id IS UNIQUE"
];

const cypher = `
  MERGE (batch:PartBatch {id: 'RB-2107'})
    SET batch.name = 'VoltCore V2 lithium battery', batch.supplier = 'Radian Battery Works', batch.risk = 'critical', batch.receivedAt = date('2026-08-03')
  MERGE (blr:Region {name: 'Bengaluru'})
  MERGE (hyd:Region {name: 'Hyderabad'})
  MERGE (che:Region {name: 'Chennai'})
  MERGE (pune:Region {name: 'Pune'})
  MERGE (priya:Customer {id: 'C-1001'}) SET priya.name = 'Priya Menon', priya.activeVehicle = true
  MERGE (arjun:Customer {id: 'C-1002'}) SET arjun.name = 'Arjun Rao', arjun.activeVehicle = true
  MERGE (kavya:Customer {id: 'C-1003'}) SET kavya.name = 'Kavya Shah', kavya.activeVehicle = false
  MERGE (aman:Customer {id: 'C-1004'}) SET aman.name = 'Aman Singh', aman.activeVehicle = false
  MERGE (u1:ProductUnit {id: 'S-4381'}) SET u1.model = 'Velo One', u1.status = 'in_use'
  MERGE (u2:ProductUnit {id: 'S-4492'}) SET u2.model = 'Velo One', u2.status = 'in_use'
  MERGE (u3:ProductUnit {id: 'S-4568'}) SET u3.model = 'Velo City', u3.status = 'in_use'
  MERGE (u4:ProductUnit {id: 'S-4620'}) SET u4.model = 'Velo City', u4.status = 'in_use'
  MERGE (batch)-[r1:INSTALLED_IN]->(u1) SET r1.installedAt = date('2026-08-06')
  MERGE (batch)-[r2:INSTALLED_IN]->(u2) SET r2.installedAt = date('2026-08-06')
  MERGE (batch)-[r3:INSTALLED_IN]->(u3) SET r3.installedAt = date('2026-08-07')
  MERGE (batch)-[r4:INSTALLED_IN]->(u4) SET r4.installedAt = date('2026-08-07')
  MERGE (u1)-[s1:SOLD_TO]->(priya) SET s1.soldAt = date('2026-08-09')
  MERGE (u2)-[s2:SOLD_TO]->(arjun) SET s2.soldAt = date('2026-08-10')
  MERGE (u3)-[s3:SOLD_TO]->(kavya) SET s3.soldAt = date('2026-08-11')
  MERGE (u4)-[s4:SOLD_TO]->(aman) SET s4.soldAt = date('2026-08-12')
  MERGE (priya)-[:LOCATED_IN]->(blr)
  MERGE (arjun)-[:LOCATED_IN]->(hyd)
  MERGE (kavya)-[:LOCATED_IN]->(che)
  MERGE (aman)-[:LOCATED_IN]->(pune)
`;

try {
  for (const constraint of constraints) await session.run(constraint);
  await session.run(cypher);
  console.log("RecallScope seed data loaded successfully.");
} finally {
  await session.close();
  await driver.close();
}
