"""D17.4: la app no se conecta a nada y solo ejecuta su propio script (hash en la CSP)."""

import re

from tests.csp import APP, csp_actual, csp_esperada

HTML = APP.read_text(encoding="utf-8")


def test_la_csp_coincide_con_el_script():
    assert csp_actual(HTML) == csp_esperada(HTML), "CSP desfasada: python3 tests/csp.py --escribir"


def test_la_csp_no_deja_conectarse_ni_ejecutar_codigo_inyectado():
    csp = csp_actual(HTML) or ""
    directivas = dict(d.strip().split(" ", 1) for d in csp.split(";") if d.strip())
    assert directivas["connect-src"] == "'none'"
    assert directivas["default-src"] == "'none'"
    assert "unsafe" not in directivas["script-src"]


def test_no_carga_nada_de_fuera():
    # Solo pueden ir a otro sitio los metadatos de la vista previa y el enlace al código.
    fuera = [u for u in re.findall(r'(?:src|href)="(https?://[^"]+)"', HTML)
             if not u.startswith("https://github.com/")]
    assert fuera == []
    assert "fonts.googleapis" not in HTML and "fonts.gstatic" not in HTML


def test_referrer_y_doctype():
    assert HTML.startswith("<!doctype html>\n<html lang=\"es\">")
    assert '<meta name="referrer" content="no-referrer">' in HTML
