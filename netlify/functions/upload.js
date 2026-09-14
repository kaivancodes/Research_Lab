const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return {statusCode:405, body:"Method Not Allowed"};
    const payload = JSON.parse(event.body || "{}");
    const { day, filename, mime, data } = payload;
    if (!/^(?:[1-9]|1[0-9]|20)$/.test(String(day))) return {statusCode:400, body:"Invalid day"};
    const ext = mime === "application/pdf" ? ".pdf" : mime === "image/png" ? ".png" : mime === "image/jpeg" ? ".jpg" : null;
    if (!ext) return {statusCode:400, body:"Only PDF, PNG or JPG accepted"};
    const finalName = `day_${day}_work${ext}`;
    const bytes = Buffer.from(data, "base64");
    const store = getStore("ph-research");
    await store.set(`submissions/${finalName}`, bytes, { metadata: { contentType: mime, originalName: filename || "" }});
    const status = await store.get("status.json", {type:"json"}) || {days:{},papers:{}};
    status.days[String(day)] = {submitted:true,name:finalName,uploadedAt:new Date().toISOString()};
    await store.setJSON("status.json", status);
    return {statusCode:200, headers:{"Content-Type":"application/json"}, body:JSON.stringify({ok:true,name:finalName})};
  } catch(e) { return {statusCode:500, body:JSON.stringify({error:e.message})}; }
};
