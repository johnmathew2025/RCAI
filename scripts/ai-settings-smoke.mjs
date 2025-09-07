import assert from "node:assert/strict";

const base = process.env.API_BASE ?? "http://localhost:5000";
const get = (p)=>fetch(base+p).then(r=>r.json());
const post = (p,b)=>fetch(base+p,{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());

console.log("Testing AI Settings contract...");

const list = await get("/api/ai/providers");
assert.ok(Array.isArray(list), "list should be an array");
console.log(`✅ GET /api/ai/providers returned ${list.length} providers`);

const created = await post("/api/ai/providers", {provider:"probe", model_id:"probe-model", api_key:"sk-probe"});
assert.ok(created.id, "create should return id");
console.log(`✅ POST /api/ai/providers created provider with id ${created.id}`);

const after = await get("/api/ai/providers");
assert.ok(after.some(x=>x.provider==="probe"), "created row should exist");
console.log(`✅ Created provider appears in list (${after.length} total providers)`);

// Test meta endpoint
const meta = await get("/api/meta");
assert.ok(meta.apiVersion, "meta should have apiVersion");
console.log(`✅ GET /api/meta returned version ${meta.apiVersion}`);

console.log("AI Settings contract OK");