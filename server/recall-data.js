export const demoRecall = {
  recall: { id: "RB-2107", title: "Lithium battery thermal variance", severity: "Critical", status: "Investigation active", detectedAt: "Today, 09:42" },
  summary: { customers: 142, warehouseUnits: 38, urgent: 17, serviceCenters: 4 },
  regions: [
    { name: "Bengaluru", customers: 58, stock: 16, priority: "High" },
    { name: "Hyderabad", customers: 41, stock: 12, priority: "High" },
    { name: "Chennai", customers: 28, stock: 7, priority: "Medium" },
    { name: "Pune", customers: 15, stock: 3, priority: "Medium" }
  ],
  actions: [
    { title: "Quarantine remaining stock", detail: "38 units across 4 warehouses can be held before dispatch.", count: "38 units", tone: "danger" },
    { title: "Contact high-priority owners", detail: "17 active units need same-day service outreach.", count: "17 owners", tone: "warning" },
    { title: "Prepare customer notification", detail: "142 verified owners can receive a recall notice.", count: "142 owners", tone: "primary" }
  ],
  affectedUnits: [
    { id: "S-4381", owner: "Priya Menon", city: "Bengaluru", state: "In use", risk: "Urgent", recordType: "customer", path: ["RB-2107", "VoltCore V2 battery", "S-4381", "Priya Menon"] },
    { id: "S-4492", owner: "Arjun Rao", city: "Hyderabad", state: "In use", risk: "Urgent", recordType: "customer", path: ["RB-2107", "VoltCore V2 battery", "S-4492", "Arjun Rao"] },
    { id: "S-4568", owner: "Kavya Shah", city: "Chennai", state: "In use", risk: "Priority", recordType: "customer", path: ["RB-2107", "VoltCore V2 battery", "S-4568", "Kavya Shah"] },
    { id: "S-4620", owner: "Aman Singh", city: "Pune", state: "In use", risk: "Priority", recordType: "customer", path: ["RB-2107", "VoltCore V2 battery", "S-4620", "Aman Singh"] },
    { id: "S-4810", owner: "Bengaluru fulfilment hub", city: "Bengaluru", state: "warehouse", risk: "Contain", recordType: "warehouse", path: ["RB-2107", "S-4810", "Bengaluru fulfilment hub"] },
    { id: "S-4822", owner: "Hyderabad fulfilment hub", city: "Hyderabad", state: "warehouse", risk: "Contain", recordType: "warehouse", path: ["RB-2107", "S-4822", "Hyderabad fulfilment hub"] }
  ]
};
