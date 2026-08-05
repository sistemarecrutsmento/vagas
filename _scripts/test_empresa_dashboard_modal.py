#!/usr/bin/env python3
"""Static regression checks for the Empresa Dashboard modal contract.

This intentionally checks source contracts only; it never calls production APIs or
uses fixtures/mocks. Run from the repository root with Python 3.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "vagas/empresa/index.html").read_text(encoding="utf-8")
APP = (ROOT / "vagas/empresa/app.js").read_text(encoding="utf-8")
API = (ROOT / "recrutamento-api/src/server.js").read_text(encoding="utf-8")


def require(needle: str, haystack: str, message: str) -> None:
    if needle not in haystack:
        raise AssertionError(message + f" (missing: {needle!r})")


def main() -> None:
    # One reusable overlay, with no replacement dashboard view or new route/page.
    require('id="modal-dashboard-insight"', HTML, "dashboard overlay missing")
    require('role="dialog"', HTML, "dashboard overlay is not a dialog")
    require('id="dashboard-modal-close"', HTML, "dashboard modal close button missing")
    if 'id="dashboard-insight"' in HTML or "dashview" in APP:
        raise AssertionError("legacy internal dashboard view/query remains")

    # The four mandatory dashboard cases are modal-only and preserve the dashboard.
    require("if(action==='processos')return openDashboardModal('processos')", APP, "Processos KPI is not modal-backed")
    require("if(action==='antigas')return openDashboardModal('antigas')", APP, "Abertas +30d KPI is not modal-backed")
    require("abrirDashboardModal('funil')", HTML, "funnel link is not modal-backed")
    require("abrirDashboardModal('history')", HTML, "activity history link is not modal-backed")
    require("function fecharDashboardInsight()", APP, "modal close implementation missing")
    require("document.body.style.overflow='hidden'", APP, "modal does not protect background interaction")
    require("e.key==='Escape'", APP, "modal Escape handling missing")
    require("data-dashboard-retry", APP, "modal retry state missing")

    # Actions use real IDs and official SPA filters after closing the modal.
    require('data-dashboard-nav="candidatos" data-vaga-id="${id}"', APP, "process action lacks real vaga_id")
    require('data-dashboard-nav="vagas" data-vaga-id="${id}"', APP, "old-vaga action lacks real vaga_id")
    require('data-dashboard-nav="candidatos" data-etapa="${stage}"', APP, "funnel action lacks real etapa")
    require("dashNavigate('vagas',{status:'publicada',periodo:'all'})", APP, "active vacancies navigation filter missing")
    require("dashNavigate('contratacoes',{status:'concluido'})", APP, "completed hiring navigation filter missing")
    require("dashNavigate('vagas',{vaga_id:n,periodo:'all'})", APP, "ranking vacancy navigation ID missing")

    # No unsafe unescaped dashboard values are interpolated in modal markup.
    for value in ("v.titulo", "v.vaga_status", "a.candidato", "a.vaga"):
        if value in APP and f"dashboardInsightText({value})" not in APP:
            raise AssertionError(f"dashboard value is not escaped: {value}")

    # Backend aggregate/activity contract remains tenant-scoped and time-bounded.
    require("atividadesRecentes = atividadesHistorico.filter(a => a.quando", API, "recent activity derivation missing")
    require("Date.now() - 24 * 60 * 60 * 1000", API, "recent activity is not limited to 24h")
    require("slice(0, 8)", API, "recent activity is not capped at eight")
    require("INTERVAL '48 hours'", API, "48h activity history window missing")
    require("eva.empresa_id = $1", API, "tenant scope predicate missing")
    require("processos_por_vaga", API, "process aggregate missing")
    require("v.status = 'publicada' AND v.criada_em < NOW() - INTERVAL '30 days'", API, "30d vacancy rule missing")

    print("empresa dashboard modal static checks: PASS")


if __name__ == "__main__":
    main()
