const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  const store = getStore("ph-research");
  const status = await store.get("status.json", { type: "json" }) || { days: {}, papers: {}, paperNotes: {} };
  status.days = status.days || {};
  status.papers = status.papers || {};
  status.paperNotes = status.paperNotes || {};
  return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify(status) };
};
