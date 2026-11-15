"""La web abre sin conexión (v0.17): sw.js guarda la app y manifest.webmanifest la hace instalable."""

import json
import re

from tests.csp import APP, csp_actual

RAIZ = APP.parent
HTML = APP.read_text(encoding="utf-8")
SW = (RAIZ / "sw.js").read_text(encoding="utf-8")


def test_el_sw_es_de_la_misma_version_que_la_app():
    # Si no cambia con cada versión, los móviles se quedarían con la copia vieja guardada.
    app = re.search(r"const VERSION='([^']+)'", HTML).group(1)
    assert re.search(r"const VERSION = '([^']+)'", SW).group(1) == app


def test_el_sw_guarda_archivos_que_existen():
    lista = json.loads(re.search(r"const ARCHIVOS = (\[.*?\]);", SW, re.S).group(1).replace("'", '"'))
    for f in lista:
        assert f == "./" or (RAIZ / f).is_file(), f
    # Todo lo que la página carga por sí misma tiene que estar guardado.
    for f in re.findall(r'url\("(fonts/[^"]+)"\)', HTML):
        assert f in lista, f


def test_el_manifest_es_instalable():
    m = json.loads((RAIZ / "manifest.webmanifest").read_text(encoding="utf-8"))
    assert m["display"] == "standalone" and m["start_url"] == "./"
    for i in m["icons"]:
        assert (RAIZ / i["src"]).is_file()
    assert '<link rel="manifest" href="manifest.webmanifest">' in HTML


def test_la_csp_deja_el_sw_y_nada_mas():
    csp = csp_actual(HTML) or ""
    assert "worker-src 'self'" in csp and "connect-src 'none'" in csp
