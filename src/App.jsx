import { useEffect, useState } from "react";

function Metric({ value, label, emphasis }) {
  return <div className={`metric ${emphasis || ""}`}><strong>{value}</strong><span>{label}</span></div>;
}

function App() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("loading");
  const [queueFilter, setQueueFilter] = useState("all");
  const [planStatus, setPlanStatus] = useState("");

  useEffect(() => {
    fetch("/api/recalls/RB-2107")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => { setData(payload); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return <main className="loading"><div className="pulse-logo">R</div><p>Tracing the recall network...</p></main>;
  if (status === "error") return <main className="loading"><div className="pulse-logo">!</div><h1>We could not reach the recall network.</h1><p>Check the database connection and try again.</p><button onClick={() => location.reload()}>Try again</button></main>;

  const { recall, summary, regions, actions, affectedUnits, mode, trace } = data;
  const visibleUnits = affectedUnits.filter((unit) => queueFilter !== "urgent" || unit.risk === "Urgent");
  const exportBrief = () => {
    const lines = ["RecallScope recall brief", `Batch: ${recall.id}`, `Issue: ${recall.title}`, `Affected owners: ${summary.customers}`, `Urgent cases: ${summary.urgent}`, "", "Priority outreach queue", ...affectedUnits.map((unit) => `${unit.owner} - ${unit.id} - ${unit.city || "Unassigned"} - ${unit.risk}`)];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    link.download = `${recall.id}-recall-brief.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const createPlan = async () => {
    setPlanStatus("Creating plan...");
    try {
      const response = await fetch(`/api/recalls/${recall.id}/plans`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to create plan.");
      setPlanStatus("Recall plan saved as a draft.");
    } catch (error) { setPlanStatus(error.message); }
  };

  const maxRegion = Math.max(...regions.map((region) => region.customers), 1);
  return <div className="shell">
    <aside className="sidebar"><div className="brand"><span>R</span><div>RecallScope<small>RECALL INTELLIGENCE</small></div></div><nav><a className="active">Recall workspace</a><a>Recall history</a><a>Supply network</a><a>Action plans</a></nav><div className="sidebar-note"><span className="signal"/> LIVE WATCH<br/><strong>1 active investigation</strong></div><div className="profile"><div className="avatar">AM</div><div><strong>Anil Menon</strong><small>Operations lead</small></div></div></aside>
    <main className="content">
      <header><div className="crumb">RECALL WORKSPACE <span>/</span> ACTIVE INVESTIGATION</div><button className="outline" onClick={exportBrief}>Export brief</button></header>
      {mode === "demo" && <div className="demo-banner">Demo mode - connect CognoDB to run this investigation against your live graph.</div>}
      <section className="hero"><div><div className="eyebrow"><span className="critical-dot"/> {recall.severity} · {recall.status}</div><h1>{recall.title}</h1><p>Batch <b>{recall.id}</b> was flagged at {recall.detectedAt}. RecallScope has traced every known downstream impact.</p></div><div className="hero-action"><button className="primary" onClick={createPlan}>Create recall plan</button>{planStatus && <small className="plan-status">{planStatus}</small>}</div></section>
      <section className="metrics"><Metric value={summary.customers} label="customers need outreach" emphasis="red" /><Metric value={summary.warehouseUnits} label="units to quarantine" /><Metric value={summary.urgent} label="same-day service cases" emphasis="amber" /><Metric value={summary.serviceCenters} label="service centres engaged" /></section>
      <section className="grid-top"><article className="card trace-card"><div className="card-heading"><div><span className="eyebrow">TRACE RESULT</span><h2>Where the batch travelled</h2></div></div><div className="trace-flow"><div className="trace-node batch"><b>{recall.id}</b><small>Defective batch</small></div><i>→</i><div className="trace-node"><b>{trace?.lots ?? 0} product lots</b><small>Assembly records</small></div><i>→</i><div className="trace-node"><b>{trace?.units ?? 0} units</b><small>Physical products</small></div><i>→</i><div className="trace-node customer"><b>{trace?.owners ?? summary.customers} owners</b><small>Verified customers</small></div></div><div className="legend"><span><i className="legend-dot red-dot"/> Immediate action</span><span><i className="legend-dot blue-dot"/> Traceable relationship</span><span className="muted">Multi-hop traversal · 3 relationships</span></div></article><article className="card regions"><div className="card-heading"><div><span className="eyebrow">GEOGRAPHIC IMPACT</span><h2>Affected by region</h2></div></div><div className="region-list">{regions.map((region) => <div className="region" key={region.name}><div className="region-name"><span className={`risk ${region.priority.toLowerCase()}`}/><b>{region.name}</b></div><div className="region-count"><strong>{region.customers}</strong><small>owners</small></div><div className="mini-bar"><i style={{ width: `${region.customers / maxRegion * 100}%` }}/></div></div>)}</div></article></section>
      <section className="grid-bottom"><article className="card actions"><div className="card-heading"><div><span className="eyebrow">RECOMMENDED NEXT STEPS</span><h2>Turn insight into action</h2></div></div>{actions.map((action) => <div className="action" key={action.title}><div className={`action-icon ${action.tone}`}>!</div><div><b>{action.title}</b><p>{action.detail}</p></div><strong className="action-count">{action.count}</strong><button onClick={() => setQueueFilter(action.filter === "urgent" ? "urgent" : "all")} aria-label={`Open ${action.title}`}>→</button></div>)}</article><article className="card units"><div className="card-heading"><div><span className="eyebrow">AFFECTED OWNERS</span><h2>{queueFilter === "urgent" ? "Urgent outreach queue" : "Priority outreach queue"}</h2></div><button className="text-btn" onClick={() => setQueueFilter("all")}>View all</button></div><div className="unit-list">{visibleUnits.length ? visibleUnits.map((unit) => <button className="unit" onClick={() => setSelected(unit)} key={unit.id}><div className="unit-mark">S</div><div><b>{unit.owner}</b><p>{unit.id} · {unit.city || "Unknown region"} · {unit.state || "In use"}</p></div><span className={`tag ${(unit.risk || "Priority").toLowerCase()}`}>{unit.risk || "Priority"}</span></button>) : <p className="empty-queue">No units match this action.</p>}</div></article></section>
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><aside className="path-panel" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><span className="eyebrow">EXPLAINABLE IMPACT</span><h2>Why {selected.owner} is affected</h2><p>This owner is connected to the recalled batch through a verified product-assembly and purchase record.</p><ol>{selected.path.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol><button className="primary full" onClick={() => setSelected(null)}>Close</button></aside></div>}
  </div>;
}

export default App;
