#!/usr/bin/env python3
"""Локальный сервер: python serve.py [порт]  →  http://localhost:8000"""
import http.server, socketserver, sys, webbrowser, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript"}
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", port), H) as s:
    url = f"http://localhost:{port}/"; print("Redshift:", url, "(Ctrl+C — стоп)")
    webbrowser.open(url)
    try: s.serve_forever()
    except KeyboardInterrupt: pass
