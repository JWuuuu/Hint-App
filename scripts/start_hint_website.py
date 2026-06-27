#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import urllib.error
import urllib.request
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = PROJECT_ROOT / "artifacts" / "hint" / "dist" / "public"
INDEX_FILE = PUBLIC_DIR / "index.html"
DEFAULT_PORT = 5173
START_PATH = "/#today"
API_PROXY_TARGET = os.environ.get("API_PROXY_TARGET", "http://localhost:5050").rstrip("/")
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}


def can_bind(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(("127.0.0.1", port))
        except OSError:
            return False
    return True


def hint_site_is_running(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://localhost:{port}/", timeout=0.8) as response:
            body = response.read(8192)
            return b"<title>Hint</title>" in body or b"Hint" in body
    except Exception:
        return False


def find_port(preferred: int) -> int:
    if can_bind(preferred):
        return preferred

    for port in range(preferred + 1, preferred + 30):
        if can_bind(port):
            return port

    raise RuntimeError("No open local port found from 5173 to 5202.")


class HintSpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def log_message(self, format: str, *args) -> None:
        print(f"[Hint] {self.address_string()} - {format % args}")

    def _use_spa_fallback_if_needed(self) -> None:
        parsed = urlsplit(self.path)
        requested = unquote(parsed.path.lstrip("/"))
        target = (PUBLIC_DIR / requested).resolve()

        try:
            target.relative_to(PUBLIC_DIR)
        except ValueError:
            self.path = "/index.html"
            return

        if target.is_dir():
            target = target / "index.html"

        if not target.exists():
            self.path = "/index.html"

    def _is_api_request(self) -> bool:
        parsed = urlsplit(self.path)
        return parsed.path == "/api" or parsed.path.startswith("/api/")

    def _proxy_api_request(self) -> None:
        parsed = urlsplit(self.path)
        target_url = f"{API_PROXY_TARGET}{parsed.path}"
        if parsed.query:
            target_url = f"{target_url}?{parsed.query}"

        body = None
        if self.command not in {"GET", "HEAD"}:
            length = int(self.headers.get("content-length", "0") or "0")
            body = self.rfile.read(length) if length else b""

        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in HOP_BY_HOP_HEADERS and key.lower() != "host"
        }
        request = urllib.request.Request(target_url, data=body, method=self.command, headers=headers)

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = response.read()
                self.send_response(response.status)
                for key, value in response.headers.items():
                    if key.lower() in HOP_BY_HOP_HEADERS:
                        continue
                    self.send_header(key, value)
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(payload)
        except urllib.error.HTTPError as error:
            payload = error.read()
            self.send_response(error.code)
            for key, value in error.headers.items():
                if key.lower() in HOP_BY_HOP_HEADERS:
                    continue
                self.send_header(key, value)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(payload)
        except Exception as error:
            payload = json.dumps({
                "error": "API proxy unavailable.",
                "detail": str(error),
                "target": API_PROXY_TARGET,
            }).encode("utf-8")
            self.send_response(502)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(payload)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(payload)

    def do_GET(self) -> None:
        if self._is_api_request():
            self._proxy_api_request()
            return
        self._use_spa_fallback_if_needed()
        super().do_GET()

    def do_HEAD(self) -> None:
        if self._is_api_request():
            self._proxy_api_request()
            return
        self._use_spa_fallback_if_needed()
        super().do_HEAD()

    def do_POST(self) -> None:
        if self._is_api_request():
            self._proxy_api_request()
            return
        self.send_error(404, "Not found")


def main() -> int:
    parser = argparse.ArgumentParser(description="Start the local Hint website.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--no-open", action="store_true", help="Start without opening the browser.")
    args = parser.parse_args()

    if not INDEX_FILE.exists():
        print("Could not find the built website:")
        print(f"  {INDEX_FILE}")
        print()
        print("Ask Codex to rebuild the website once, then use this launcher again.")
        return 1

    if hint_site_is_running(args.port):
        url = f"http://localhost:{args.port}{START_PATH}"
        print(f"Hint is already running at {url}")
        if not args.no_open:
            webbrowser.open(url)
        return 0

    port = find_port(args.port)
    url = f"http://localhost:{port}{START_PATH}"

    os.chdir(PUBLIC_DIR)
    server = ThreadingHTTPServer(("0.0.0.0", port), HintSpaHandler)

    print("Starting Hint website...")
    print(f"Project: {PROJECT_ROOT}")
    print(f"Serving: {PUBLIC_DIR}")
    print(f"URL:     {url}")
    print()
    print("Keep this Terminal window open while using the site.")
    print("Press Control-C here when you want to stop it.")

    if not args.no_open:
        webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Hint website.")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
