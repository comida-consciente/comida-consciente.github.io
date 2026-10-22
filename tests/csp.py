"""La CSP de la app (D17.4): calcula el hash del <script> de index.html y lo comprueba o lo escribe.

    python3 tests/csp.py             # dice si el hash de la CSP coincide con el script
    python3 tests/csp.py --escribir  # pone el hash del script actual en la CSP

Cada cambio dentro del <script> cambia el hash. Sin --escribir, la app publicada no ejecutaría
su propio código (el navegador lo bloquea), así que test_csp.py falla si no coinciden.
"""

from __future__ import annotations

import base64
import hashlib
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "index.html"

# Lo que se permite y nada más. connect-src 'none': la página no puede conectarse a ningún sitio.
PLANTILLA = ("default-src 'none'; script-src 'sha256-{hash}'; style-src 'unsafe-inline'; "
             "img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; manifest-src 'self'; "
             "base-uri 'none'; form-action 'none'")
RE_SCRIPT = re.compile(r"<script>(.*?)</script>", re.S)
RE_META = re.compile(r'<meta http-equiv="Content-Security-Policy" content="([^"]*)">')


def hash_script(html: str) -> str:
    scripts = RE_SCRIPT.findall(html)
    if len(scripts) != 1:
        raise SystemExit(f"se esperaba un solo <script> en línea y hay {len(scripts)}")
    return base64.b64encode(hashlib.sha256(scripts[0].encode("utf-8")).digest()).decode()


def csp_esperada(html: str) -> str:
    return PLANTILLA.format(hash=hash_script(html))


def csp_actual(html: str) -> str | None:
    m = RE_META.search(html)
    return m.group(1) if m else None


def main() -> int:
    html = APP.read_text(encoding="utf-8")
    esperada = csp_esperada(html)
    if "--escribir" in sys.argv:
        meta = f'<meta http-equiv="Content-Security-Policy" content="{esperada}">'
        if csp_actual(html) is None:
            html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + meta, 1)
        else:
            html = RE_META.sub(lambda _: meta, html, count=1)
        APP.write_text(html, encoding="utf-8")
        print("CSP escrita:", esperada)
        return 0
    if csp_actual(html) == esperada:
        print("La CSP coincide con el script.")
        return 0
    print("La CSP NO coincide con el script: python3 tests/csp.py --escribir")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
