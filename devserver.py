#!/usr/bin/env python3
"""Local preview server for the launch page.

Development only — Vercel serves the static files and runs api/subscribe.js in
production. This exists so the whole page, signup included, can be exercised
without deploying. Signups are appended to subscribers.local.jsonl.

    python3 devserver.py          # then open http://127.0.0.1:8899
"""

import json
import re
import os
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8899"))
ROOT = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(ROOT, "subscribers.local.jsonl")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def load():
    if not os.path.exists(STORE):
        return []
    with open(STORE, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        pass  # the signup log below is the only output worth reading

    def send_json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/subscribers":
            rows = load()
            return self.send_json(200, {"count": len(rows), "subscribers": rows})
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/subscribe":
            return self.send_json(404, {"success": False, "error": "Not found."})

        length = int(self.headers.get("Content-Length") or 0)
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            return self.send_json(400, {"success": False, "error": "Could not read that request."})

        name = (payload.get("name") or "").strip()[:120]
        email = (payload.get("email") or "").strip()[:200].lower()

        if not name:
            return self.send_json(400, {"success": False, "error": "Add your name so we know who to greet."})

        if not EMAIL_RE.match(email):
            return self.send_json(400, {"success": False, "error": "That email address doesn’t look right."})

        if any(row["email"] == email for row in load()):
            return self.send_json(200, {"success": True})  # already on the list; stay quiet about it

        row = {"name": name, "email": email, "at": datetime.now(timezone.utc).isoformat()}
        with open(STORE, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(row) + "\n")

        print(f"  signup: {name} <{email}>", flush=True)
        return self.send_json(200, {"success": True})


if __name__ == "__main__":
    print(f"Launch page      http://127.0.0.1:{PORT}")
    print(f"Signup list      http://127.0.0.1:{PORT}/api/subscribers")
    print(f"Stored in        {STORE}\n")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
