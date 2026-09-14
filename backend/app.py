from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pathlib import Path
from datetime import datetime
import json, re, base64

BASE = Path(__file__).resolve().parent
FRONTEND = BASE.parent / "frontend"
SUBMISSIONS = BASE / "submissions"
DATA = BASE / "data"
STATUS_FILE = DATA / "status.json"
SUBMISSIONS.mkdir(exist_ok=True)
DATA.mkdir(exist_ok=True)

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
CORS(app)

def load_status():
    if not STATUS_FILE.exists():
        return {"days": {}, "papers": {}, "paperNotes": {}}
    try:
        return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"days": {}, "papers": {}, "paperNotes": {}}

def save_status(status):
    STATUS_FILE.write_text(json.dumps(status, indent=2), encoding="utf-8")

@app.get("/api/status")
def status():
    return jsonify(load_status())

@app.post("/api/upload")
def upload():
    allowed = {"application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg"}
    day = ""
    mime = ""
    data = None
    if request.is_json:
        payload = request.get_json(silent=True) or {}
        day = str(payload.get("day", ""))
        mime = str(payload.get("mime", ""))
        encoded = payload.get("data")
        if encoded:
            try: data = base64.b64decode(encoded)
            except Exception: return jsonify({"error": "Invalid base64 file data"}), 400
    elif "file" in request.files:
        file = request.files["file"]
        day = request.form.get("day", "")
        mime = file.mimetype
        data = file.read()
    else:
        return jsonify({"error": "No file supplied"}), 400
    if not re.fullmatch(r"(?:[1-9]|1[0-9]|20)", day):
        return jsonify({"error": "day must be 1-20"}), 400
    ext = allowed.get(mime)
    if not ext or data is None:
        return jsonify({"error": "Only PDF, PNG or JPG files are accepted"}), 400
    filename = f"day_{day}_work{ext}"
    path = SUBMISSIONS / filename
    path.write_bytes(data)
    st = load_status(); st.setdefault("days", {})
    st["days"][day] = {"submitted": True, "name": filename, "uploadedAt": datetime.now().isoformat()}
    save_status(st)
    return jsonify({"ok": True, "name": filename})

@app.post("/api/reading")
def reading():
    payload = request.get_json(silent=True) or {}
    paper_id = str(payload.get("paper_id", ""))
    if not paper_id.isdigit() or not 1 <= int(paper_id) <= 25:
        return jsonify({"error": "paper_id must be 1-25"}), 400
    st = load_status(); st.setdefault("papers", {}); st.setdefault("paperNotes", {})
    if "read" in payload:
        st["papers"][paper_id] = {**st["papers"].get(paper_id, {}), "read": bool(payload.get("read")), "completedAt": datetime.now().isoformat()}
    if isinstance(payload.get("notes"), list):
        st["paperNotes"][paper_id] = [{"text": str(n.get("text", ""))[:5000], "createdAt": n.get("createdAt") or datetime.now().isoformat()} for n in payload["notes"][:100] if isinstance(n, dict)]
    save_status(st)
    return jsonify({"ok": True})

@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "Perceptual Hashing Research API"})

@app.route("/")
def index():
    return send_from_directory(FRONTEND, "index.html")

@app.route("/<path:path>")
def frontend_file(path):
    file = FRONTEND / path
    if file.exists() and file.is_file():
        return send_from_directory(FRONTEND, path)
    return send_from_directory(FRONTEND, "index.html")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
