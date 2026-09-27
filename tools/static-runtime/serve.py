from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    """Static-file handler for the local Filomatia preview."""

    package_version = "unknown"

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("X-Filomatia-Package", self.package_version)
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[{self.log_date_time_string()}] {self.address_string()} - {fmt % args}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Filomatia local static preview server")
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--directory", required=True)
    parser.add_argument("--package-version", default="unknown")
    args = parser.parse_args()

    directory = str(Path(args.directory).resolve())
    PreviewHandler.package_version = args.package_version

    def handler(*handler_args, **handler_kwargs):
        return PreviewHandler(*handler_args, directory=directory, **handler_kwargs)

    server = ThreadingHTTPServer((args.bind, args.port), handler)
    server.daemon_threads = True
    print(
        f"Filomatia preview: {directory} -> http://{args.bind}:{args.port}/ "
        f"(package {args.package_version}, cache disabled)",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
