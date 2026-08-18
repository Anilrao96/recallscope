import "dotenv/config";
import express from "express";
import { demoRecall } from "./recall-data.js";
import { configured, createRecallPlan, getAffectedUnits, getRecallDashboard } from "./graph.js";

const app = express();
const port = process.env.PORT || 3001;

app.get("/api/health", async (_req, res) => {
  if (!configured()) return res.json({ mode: "demo", database: "not-configured" });
  try {
    await getAffectedUnits("RB-2107");
    res.json({ mode: "live", database: "connected" });
  } catch (error) {
    res.status(503).json({ mode: "error", database: "unreachable", message: error.message });
  }
});

app.get("/api/recalls/:batchId", async (req, res) => {
  if (!configured()) return res.json({ ...demoRecall, mode: "demo" });
  try {
    const dashboard = await getRecallDashboard(req.params.batchId);
    if (!dashboard) return res.status(404).json({ error: "RECALL_NOT_FOUND" });
    const { batch, units } = dashboard;
    const regions = Object.values(units.reduce((groups, unit) => {
      const name = unit.city || "Unassigned";
      const group = groups[name] || { name, customers: 0, priority: "Medium" };
      group.customers += 1;
      if (unit.risk === "Urgent") group.priority = "High";
      groups[name] = group;
      return groups;
    }, {})).sort((a, b) => b.customers - a.customers);
    const urgent = units.filter((unit) => unit.risk === "Urgent").length;
    const warehouseUnits = units.filter((unit) => ["warehouse", "in_stock", "stored"].includes(String(unit.state).toLowerCase())).length;
    const serviceCenters = new Set(units.map((unit) => unit.city).filter(Boolean)).size;
    res.json({
      recall: { id: batch.id, title: batch.title, severity: String(batch.severity).replace(/^./, (c) => c.toUpperCase()), status: "Investigation active", detectedAt: batch.detectedAt || "Recorded in graph" },
      summary: { customers: units.length, warehouseUnits, urgent, serviceCenters },
      regions,
      actions: [
        { title: "Quarantine remaining stock", detail: warehouseUnits ? `${warehouseUnits} traced units are currently awaiting dispatch.` : "No traced units are marked as warehouse stock.", count: `${warehouseUnits} units`, tone: "danger", filter: "warehouse" },
        { title: "Contact high-priority owners", detail: `${urgent} active units need same-day service outreach.`, count: `${urgent} owners`, tone: "warning", filter: "urgent" },
        { title: "Prepare customer notification", detail: `${units.length} verified owners can receive a recall notice.`, count: `${units.length} owners`, tone: "primary", filter: "all" }
      ],
      affectedUnits: units,
      trace: { lots: new Set(units.map((unit) => unit.model).filter(Boolean)).size, units: units.length, owners: units.length },
      mode: "live"
    });
  } catch (error) {
    res.status(503).json({ error: "DATABASE_UNAVAILABLE", message: "RecallScope cannot reach CognoDB right now." });
  }
});

app.post("/api/recalls/:batchId/plans", async (req, res) => {
  if (!configured()) return res.status(409).json({ error: "DEMO_MODE", message: "Connect CognoDB to save a recall plan." });
  try {
    const plan = await createRecallPlan(req.params.batchId);
    if (!plan) return res.status(404).json({ error: "RECALL_NOT_FOUND" });
    res.status(201).json({ plan });
  } catch (_error) {
    res.status(503).json({ error: "DATABASE_UNAVAILABLE", message: "RecallScope cannot save a recall plan right now." });
  }
});

app.listen(port, "0.0.0.0", () => console.log(`RecallScope API running on ${port}`));
