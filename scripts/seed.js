import "dotenv/config";
import neo4j from "neo4j-driver";

const required = ["COGNODB_URI", "COGNODB_USERNAME", "COGNODB_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing ${missing.join(", ")}. Copy .env.example to .env and add your CognoDB connection details.`);
  process.exit(1);
}

const driver = neo4j.driver(process.env.COGNODB_URI, neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD));
const session = driver.session();

const constraints = [
  "CREATE CONSTRAINT part_batch_id IF NOT EXISTS FOR (n:PartBatch) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT product_unit_id IF NOT EXISTS FOR (n:ProductUnit) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (n:Customer) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT warehouse_id IF NOT EXISTS FOR (n:Warehouse) REQUIRE n.id IS UNIQUE",
  "CREATE CONSTRAINT service_center_id IF NOT EXISTS FOR (n:ServiceCenter) REQUIRE n.id IS UNIQUE"
];

const cypher = `
  MERGE (batch:PartBatch {id: 'RB-2107'}) SET batch.name = 'VoltCore V2 lithium battery', batch.supplier = 'Radian Battery Works', batch.risk = 'critical', batch.receivedAt = date('2026-08-03')
  MERGE (secondary:PartBatch {id: 'RB-2081'}) SET secondary.name = 'VoltCore V2 lithium battery', secondary.supplier = 'Radian Battery Works', secondary.risk = 'monitor', secondary.receivedAt = date('2026-07-28')
  MERGE (blr:Region {name: 'Bengaluru'}) MERGE (hyd:Region {name: 'Hyderabad'}) MERGE (che:Region {name: 'Chennai'}) MERGE (pune:Region {name: 'Pune'})
  MERGE (w1:Warehouse {id: 'WH-BLR-01'}) SET w1.name = 'Bengaluru fulfilment hub', w1.city = 'Bengaluru'
  MERGE (w2:Warehouse {id: 'WH-HYD-01'}) SET w2.name = 'Hyderabad fulfilment hub', w2.city = 'Hyderabad'
  MERGE (sc1:ServiceCenter {id: 'SC-BLR'}) SET sc1.name = 'Koramangala service centre'
  MERGE (sc2:ServiceCenter {id: 'SC-HYD'}) SET sc2.name = 'Banjara Hills service centre'
  MERGE (sc3:ServiceCenter {id: 'SC-CHE'}) SET sc3.name = 'Velachery service centre'
  MERGE (sc4:ServiceCenter {id: 'SC-PUN'}) SET sc4.name = 'Koregaon Park service centre'
  MERGE (sc1)-[:SERVES]->(blr) MERGE (sc2)-[:SERVES]->(hyd) MERGE (sc3)-[:SERVES]->(che) MERGE (sc4)-[:SERVES]->(pune)
  MERGE (c1:Customer {id: 'C-1001'}) SET c1.name = 'Priya Menon', c1.activeVehicle = true
  MERGE (c2:Customer {id: 'C-1002'}) SET c2.name = 'Arjun Rao', c2.activeVehicle = true
  MERGE (c3:Customer {id: 'C-1003'}) SET c3.name = 'Kavya Shah', c3.activeVehicle = false
  MERGE (c4:Customer {id: 'C-1004'}) SET c4.name = 'Aman Singh', c4.activeVehicle = false
  MERGE (c5:Customer {id: 'C-1005'}) SET c5.name = 'Neha Kulkarni', c5.activeVehicle = true
  MERGE (c6:Customer {id: 'C-1006'}) SET c6.name = 'Rohit Iyer', c6.activeVehicle = false
  MERGE (c7:Customer {id: 'C-1007'}) SET c7.name = 'Divya Nair', c7.activeVehicle = true
  MERGE (c8:Customer {id: 'C-1008'}) SET c8.name = 'Sahil Mehta', c8.activeVehicle = false
  MERGE (c1)-[:LOCATED_IN]->(blr) MERGE (c2)-[:LOCATED_IN]->(hyd) MERGE (c3)-[:LOCATED_IN]->(che) MERGE (c4)-[:LOCATED_IN]->(pune)
  MERGE (c5)-[:LOCATED_IN]->(blr) MERGE (c6)-[:LOCATED_IN]->(hyd) MERGE (c7)-[:LOCATED_IN]->(che) MERGE (c8)-[:LOCATED_IN]->(pune)
  MERGE (u1:ProductUnit {id: 'S-4381'}) SET u1.model = 'Velo One', u1.status = 'in_use'
  MERGE (u2:ProductUnit {id: 'S-4492'}) SET u2.model = 'Velo One', u2.status = 'in_use'
  MERGE (u3:ProductUnit {id: 'S-4568'}) SET u3.model = 'Velo City', u3.status = 'in_use'
  MERGE (u4:ProductUnit {id: 'S-4620'}) SET u4.model = 'Velo City', u4.status = 'in_use'
  MERGE (u5:ProductUnit {id: 'S-4714'}) SET u5.model = 'Velo One', u5.status = 'in_use'
  MERGE (u6:ProductUnit {id: 'S-4728'}) SET u6.model = 'Velo Cargo', u6.status = 'in_use'
  MERGE (u7:ProductUnit {id: 'S-4752'}) SET u7.model = 'Velo City', u7.status = 'in_use'
  MERGE (u8:ProductUnit {id: 'S-4781'}) SET u8.model = 'Velo Cargo', u8.status = 'in_use'
  MERGE (u9:ProductUnit {id: 'S-4810'}) SET u9.model = 'Velo One', u9.status = 'warehouse'
  MERGE (u10:ProductUnit {id: 'S-4816'}) SET u10.model = 'Velo City', u10.status = 'warehouse'
  MERGE (u11:ProductUnit {id: 'S-4822'}) SET u11.model = 'Velo Cargo', u11.status = 'warehouse'
  MERGE (u12:ProductUnit {id: 'S-4830'}) SET u12.model = 'Velo One', u12.status = 'warehouse'
  MERGE (u13:ProductUnit {id: 'S-4901'}) SET u13.model = 'Velo One', u13.status = 'in_use'
  MERGE (batch)-[:INSTALLED_IN]->(u1) MERGE (batch)-[:INSTALLED_IN]->(u2) MERGE (batch)-[:INSTALLED_IN]->(u3) MERGE (batch)-[:INSTALLED_IN]->(u4)
  MERGE (batch)-[:INSTALLED_IN]->(u5) MERGE (batch)-[:INSTALLED_IN]->(u6) MERGE (batch)-[:INSTALLED_IN]->(u7) MERGE (batch)-[:INSTALLED_IN]->(u8)
  MERGE (batch)-[:INSTALLED_IN]->(u9) MERGE (batch)-[:INSTALLED_IN]->(u10) MERGE (batch)-[:INSTALLED_IN]->(u11) MERGE (batch)-[:INSTALLED_IN]->(u12)
  MERGE (u1)-[:SOLD_TO]->(c1) MERGE (u2)-[:SOLD_TO]->(c2) MERGE (u3)-[:SOLD_TO]->(c3) MERGE (u4)-[:SOLD_TO]->(c4)
  MERGE (u5)-[:SOLD_TO]->(c5) MERGE (u6)-[:SOLD_TO]->(c6) MERGE (u7)-[:SOLD_TO]->(c7) MERGE (u8)-[:SOLD_TO]->(c8)
  MERGE (u9)-[:STORED_AT]->(w1) MERGE (u10)-[:STORED_AT]->(w1) MERGE (u11)-[:STORED_AT]->(w2) MERGE (u12)-[:STORED_AT]->(w2)
  MERGE (secondary)-[:INSTALLED_IN]->(u13)
`;

try {
  for (const constraint of constraints) await session.run(constraint);
  await session.run(cypher);
  console.log("RecallScope seed data loaded successfully: 2 batches, 12 affected units, 8 owners, 2 warehouses, and 4 service centres.");
} finally {
  await session.close();
  await driver.close();
}
