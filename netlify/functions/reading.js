const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return {statusCode:405, body:"Method Not Allowed"};
    const payload = JSON.parse(event.body || "{}");
    const id = Number(payload.paper_id);
    if (!Number.isInteger(id) || id < 1 || id > 25) return {statusCode:400, body:"Invalid paper_id"};
    const store = getStore("ph-research");
    const status = await store.get("status.json", {type:"json"}) || {days:{},papers:{},paperNotes:{}};
    status.days = status.days || {};
    status.papers = status.papers || {};
    status.paperNotes = status.paperNotes || {};
    if (Object.prototype.hasOwnProperty.call(payload,"read")) {
      status.papers[String(id)] = {...(status.papers[String(id)] || {}), read:Boolean(payload.read), completedAt:new Date().toISOString()};
    }
    if (Array.isArray(payload.notes)) {
      status.paperNotes[String(id)] = payload.notes.slice(0,100).map(n => ({text:String(n.text || "").slice(0,5000), createdAt:n.createdAt || new Date().toISOString()}));
    }
    await store.setJSON("status.json", status);
    return {statusCode:200,headers:{"Content-Type":"application/json"},body:JSON.stringify({ok:true})};
  } catch(e) { return {statusCode:500,body:JSON.stringify({error:e.message})}; }
};
