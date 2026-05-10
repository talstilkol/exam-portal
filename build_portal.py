#!/usr/bin/env python3
"""
build_portal.py — Builds /Users/tal/Desktop/פורטל מבחן 2/portal.html

Reads source HTMLs from /tmp/svcollege_extract/ (already extracted from
svcollege_combined_with_claude_no_cut.html), applies improvements/patches
to bring exam solutions to a 100/100 score, and emits ONE unified portal
with all 11 tabs working.

Phase A (current): merge sources without solution patches.
Phase B (todo)   : apply per-question patches.
Phase C (todo)   : a11y + responsive + animations + print + dark-mode polish.
"""

from __future__ import annotations

import base64
import html as html_lib
import json
import re
import sys
from pathlib import Path

# Local imports
sys.path.insert(0, str(Path(__file__).parent))
from improvements import IMPROVEMENTS, EXAM_TOTALS, EXAM_NOTES  # noqa: E402

ROOT = Path("/Users/tal/Desktop/פורטל מבחן 2")
SRC = Path("/tmp/svcollege_extract")
EXAMS_FILE = SRC / "svcollege_all_exam_solutions_full_questions_hover.html"
STUDY_FILE = SRC / "study123.html"
OUT = ROOT / "portal.html"


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def b64(s: str) -> str:
    return base64.b64encode(s.encode("utf-8")).decode("ascii")


SEVERITY_BADGE = {
    "critical": ('<span class="sev sev-crit">קריטי</span>', "#dc2626", "#fee2e2"),
    "high":     ('<span class="sev sev-high">גבוה</span>',  "#ea580c", "#ffedd5"),
    "medium":   ('<span class="sev sev-med">בינוני</span>', "#d97706", "#fef3c7"),
    "low":      ('<span class="sev sev-low">נמוך</span>',   "#0d9488", "#ccfbf1"),
}

# HTML5 raw-text and escapable-raw-text tags. If we mention these literally in
# a description/missing/extras string, the browser will treat it as an opening
# tag and consume everything until the matching close. Defensively escape them.
RAW_TEXT_TAG_RE = re.compile(
    r'<(/?)\s*(title|style|script|textarea|plaintext|xmp|noscript|iframe|noembed|noframes)(\b)',
    re.IGNORECASE,
)


def safe_html_text(s: str) -> str:
    """Escape literal mentions of HTML raw-text tags so the browser doesn't consume
    surrounding content. Other tags (<code>, <strong>, <em>, etc.) are kept as-is."""
    def _esc(m: re.Match) -> str:
        return f"&lt;{m.group(1)}{m.group(2)}{m.group(3)}"
    return RAW_TEXT_TAG_RE.sub(_esc, s)


def render_improvement_panel(qid: str, data: dict) -> str:
    """Render compact severity chips (visual). Full text is in JSON for tooltip popup."""
    title = data.get("title", qid)
    score = data.get("score", "")
    score_badge = f'<span class="imp-score">{score} נק׳</span>' if score else ""

    # Render each bug as a compact chip; full content stored in data attribute (JSON)
    chips = []
    for i, bug in enumerate(data.get("bugs", [])):
        sev = bug.get("severity", "medium")
        sev_class = {"critical":"crit","high":"high","medium":"med","low":"low"}.get(sev, "med")
        sev_label = {"critical":"קריטי","high":"גבוה","medium":"בינוני","low":"נמוך"}.get(sev, sev)
        bug_payload = json.dumps({
            "kind": "bug",
            "sev": sev,
            "sev_label": sev_label,
            "desc": bug.get("desc",""),
            "before": bug.get("before",""),
            "after": bug.get("after",""),
            "qid": qid,
            "num": i+1,
            "total": len(data.get("bugs",[])),
        }, ensure_ascii=False)
        bug_payload_attr = html_lib.escape(bug_payload, quote=True)
        chips.append(f'<button class="sev-chip {sev_class}" data-tip-payload="{bug_payload_attr}" aria-label="באג {i+1} — {sev_label}">{i+1} {sev_label[0]}</button>')

    miss_chips = []
    for i, m in enumerate(data.get("missing", [])):
        payload = json.dumps({"kind":"missing", "text": m, "num": i+1, "qid": qid}, ensure_ascii=False)
        attr = html_lib.escape(payload, quote=True)
        miss_chips.append(f'<button class="sev-chip miss" data-tip-payload="{attr}" aria-label="דרישה חסרה {i+1}">M{i+1}</button>')

    extra_chips = []
    for i, x in enumerate(data.get("extras", [])):
        payload = json.dumps({"kind":"extra", "text": x, "num": i+1, "qid": qid}, ensure_ascii=False)
        attr = html_lib.escape(payload, quote=True)
        extra_chips.append(f'<button class="sev-chip extra" data-tip-payload="{attr}" aria-label="פיצ\'ר נוסף {i+1}">+{i+1}</button>')

    fixed_chip = f'<span class="sev-chip fixed" aria-label="באגים מתוקנים">✓ {len(data.get("bugs",[]))} מתוקנים</span>'

    return f"""
    <div class="imp-panel-compact" data-qid="{qid}">
      <div class="impc-head">
        <h4 class="impc-title">🔧 שיפורים לציון 100 — {title} {score_badge}</h4>
        <span class="impc-hint">לחיצה על צ'יפ פותחת חלון מרחף עם הפירוט</span>
      </div>
      <div class="impc-chips">
        <span class="impc-row-label">באגים מתוקנים:</span>
        {fixed_chip}
        {' '.join(chips) if chips else '<span style="color:#16a34a;font-weight:900;padding:0 8px">✓ אין באגים</span>'}
      </div>
      {f'<div class="impc-chips"><span class="impc-row-label">דרישות חסרות:</span>{" ".join(miss_chips)}</div>' if miss_chips else ''}
      {f'<div class="impc-chips"><span class="impc-row-label">פיצ\'רים מעבר:</span>{" ".join(extra_chips)}</div>' if extra_chips else ''}
    </div>
    """


def replace_section(html: str, qid: str, panel_html: str) -> str:
    """Inject `panel_html` at the end of the question's section (before </section>)."""
    # Match the section by id, capturing greedily up to the closing </section>
    # The sections are not nested, so a non-greedy match to </section> works.
    pattern = re.compile(
        rf'(<section[^>]*id="{re.escape(qid)}"[^>]*>.*?)(</section>)',
        re.DOTALL,
    )
    def _sub(m: re.Match) -> str:
        return m.group(1) + panel_html + m.group(2)
    new_html, n = pattern.subn(_sub, html)
    if n == 0:
        print(f"  WARN: section {qid} not found", file=sys.stderr)
    return new_html


def replace_missing_section(html: str, qid: str, panel_html: str) -> str:
    """Replace the placeholder 'אין שאלה 3' for logistics-q3/currency-q3 with a clear notice."""
    pattern = re.compile(
        rf'<section[^>]*id="{re.escape(qid)}"[^>]*>.*?</section>',
        re.DOTALL,
    )
    new_html, n = pattern.subn(panel_html, html)
    if n == 0:
        print(f"  WARN: missing section {qid} not found", file=sys.stderr)
    return new_html


def render_two_question_notice(qid: str, exam_key: str) -> str:
    """For logistics-q3 and currency-q3 — replace placeholder with a clear notice."""
    name, scores = EXAM_TOTALS[exam_key]
    total = sum(scores)
    breakdown = " + ".join(f"שאלה {i+1} ({s} נק׳)" for i, s in enumerate(scores))
    return f"""
    <section id="{qid}" class="two-q-notice" data-exam="{exam_key}">
      <div class="q-header">
        <span class="q-number">שאלה 3</span>
        <h3>{name} — אין שאלה 3 במקור</h3>
        <span class="topic">notice</span>
      </div>
      <div class="two-q-body">
        <div class="big-100">100 = {breakdown}</div>
        <p>
          המבחן המקורי של <strong>{name}</strong> מורכב מ־<strong>{len(scores)} שאלות בלבד</strong>,
          כשהציון הכולל מתחלק כך: <code>{total} = {breakdown}</code>.
          השאלה השלישית פשוט לא קיימת בקובץ המבחן המקורי, ואין צורך לפתור אותה.
        </p>
        <p class="q-tip">
          התמקדו בפתרון מדויק של שאלה 1 ושאלה 2 כדי להגיע לציון 100. ראו את
          <strong>השיפורים לציון 100</strong> בכל אחת מהן.
        </p>
        <details class="q-source-doc">
          <summary>מקור: ניקוד המבחן (מקובץ DOCX)</summary>
          <pre>{html_lib.escape(SOURCE_NOTICE.get(exam_key, ''))}</pre>
        </details>
      </div>
    </section>
    """


SOURCE_NOTICE = {
    "logistics": (
        "ניקוד המבחן:\n"
        "  שאלה 1 — 75 נקודות.\n"
        "  שאלה 2 — 25 נקודות.\n"
        "[מקור: עותק של מבחן מחסן לוגיסטי.docx]"
    ),
    "currency": (
        "ניקוד המבחן:\n"
        "  שאלה ראשונה — 80 נקודות.\n"
        "  שאלה שניה — 20 נקודות.\n"
        "[מקור: עותק של מבחן מחשבון המרה.docx]"
    ),
}


PORTAL_INJECT_SCRIPT = r"""
<script id="portal-injected-script">
(function(){
  // Embed a small tooltip element in the iframe document
  let tip = document.getElementById('iframe-tooltip-el');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'iframe-tooltip-el';
    tip.className = 'iframe-tooltip';
    tip.setAttribute('role','dialog');
    tip.innerHTML = '<button class="vt-close" type="button" aria-label="סגירה">×</button><div class="iframe-tooltip-body"></div>';
    document.body.appendChild(tip);
    tip.querySelector('.vt-close').addEventListener('click', () => tip.classList.remove('show'));
  }
  const tipBody = tip.querySelector('.iframe-tooltip-body');

  function showTip(target, html) {
    tipBody.innerHTML = html;
    tip.classList.add('show');
    tip.style.left = '0px'; tip.style.top = '0px';
    requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let x = rect.left + rect.width/2 - tw/2;
      let y = rect.bottom + 12;
      if (y + th > window.innerHeight - 10) y = Math.max(10, rect.top - th - 12);
      x = Math.max(10, Math.min(window.innerWidth - tw - 10, x));
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    });
  }

  function hideTip() { tip.classList.remove('show'); }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function decodeAttr(s) {
    const t = document.createElement('textarea');
    t.innerHTML = s;
    return t.value;
  }

  function buildBugTooltip(p) {
    const sevColors = {critical:'#dc2626',high:'#ea580c',medium:'#facc15',low:'#14b8a6'};
    const c = sevColors[p.sev] || '#facc15';
    return `
      <h4>🐛 באג ${p.num} מתוך ${p.total} <span class="vt-tag" style="border-color:${c};color:${c};background:${c}1a">${p.sev_label}</span></h4>
      <p>${p.desc}</p>
      <h5>לפני (קוד מקור)</h5>
      <pre class="before">${escHtml(p.before)}</pre>
      <h5>אחרי (לציון 100)</h5>
      <pre>${escHtml(p.after)}</pre>
    `;
  }

  function buildMissingTooltip(p) {
    return `
      <h4>📋 דרישה חסרה ${p.num}</h4>
      <p>${p.text}</p>
      <p style="margin-top:8px;color:#cbd5e1;font-size:12px">דרישה זו לא מומשה בפתרון המקורי. בגרסה המתוקנת היא הושלמה.</p>
    `;
  }

  function buildExtraTooltip(p) {
    return `
      <h4>✨ פיצ'ר מעבר לדרישה ${p.num}</h4>
      <p>${p.text}</p>
      <p style="margin-top:8px;color:#cbd5e1;font-size:12px">פוליש מעבר לנדרש בשאלה — שיפור איכות שלא מוריד נקודות אם חסר.</p>
    `;
  }

  document.addEventListener('click', e => {
    const chip = e.target.closest('[data-tip-payload]');
    if (chip) {
      e.stopPropagation();
      let payload;
      try { payload = JSON.parse(decodeAttr(chip.getAttribute('data-tip-payload'))); }
      catch (err) { console.error('bad payload', err); return; }
      let html = '';
      if (payload.kind === 'bug')     html = buildBugTooltip(payload);
      else if (payload.kind === 'missing') html = buildMissingTooltip(payload);
      else if (payload.kind === 'extra')   html = buildExtraTooltip(payload);
      showTip(chip, html);
      return;
    }
    if (!tip.contains(e.target)) hideTip();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
})();
</script>
"""


PORTAL_INJECT_CSS = r"""
<style id="portal-injected-css">
/* === Compact improvement panel (chips → tooltip) === */
.imp-panel-compact { margin: 18px 12px; padding: 14px; border: 2.5px solid #000;
  border-radius: 14px; background: linear-gradient(135deg, #fef3c7, #fffbeb);
  box-shadow: 4px 4px 0 #000; }
.imp-panel-compact .impc-head { display:flex; justify-content:space-between; align-items:center;
  gap:10px; flex-wrap:wrap; margin-bottom:10px; padding-bottom:8px;
  border-bottom: 2px dashed #f59e0b; }
.imp-panel-compact .impc-title { margin:0; font-size:16px; color:#1f2937; font-weight:900; }
.imp-panel-compact .impc-hint { font-size:11px; color:#92400e; font-style:italic; }
.imp-panel-compact .imp-score { display:inline-block; margin-right:6px; padding:2px 9px;
  border:2px solid #000; border-radius:999px; background:#facc15; color:#000;
  font-size:11px; font-weight:900; }
.imp-panel-compact .impc-chips { display:flex; align-items:center; gap:4px; flex-wrap:wrap;
  padding:6px 0; }
.imp-panel-compact .impc-row-label { font-size:12px; font-weight:900; color:#475569;
  margin-left:6px; min-width:110px; }
.imp-panel-compact .sev-chip { display:inline-flex; align-items:center; justify-content:center;
  min-width:30px; height:24px; padding:0 9px; border:1.8px solid #000;
  border-radius:999px; font-size:11px; font-weight:900; cursor:pointer;
  margin:1.5px; transition:.12s; box-shadow:1.5px 1.5px 0 #000; font-family:inherit; }
.imp-panel-compact .sev-chip:hover { transform:translate(-1px,-1px); box-shadow:3px 3px 0 #000 }
.imp-panel-compact .sev-chip.crit { background:#fca5a5; color:#7f1d1d }
.imp-panel-compact .sev-chip.high { background:#fdba74; color:#7c2d12 }
.imp-panel-compact .sev-chip.med  { background:#fde68a; color:#78350f }
.imp-panel-compact .sev-chip.low  { background:#5eead4; color:#134e4a }
.imp-panel-compact .sev-chip.fixed{ background:#86efac; color:#14532d; cursor:default }
.imp-panel-compact .sev-chip.miss { background:#f9a8d4; color:#831843 }
.imp-panel-compact .sev-chip.extra{ background:#c4b5fd; color:#4c1d95 }

/* === Embedded tooltip (when iframe parent is unreachable) === */
.iframe-tooltip { position:fixed; z-index:9999; max-width:520px; min-width:240px;
  padding:14px 18px; background:linear-gradient(135deg,#0f172a,#1e293b);
  color:#e2e8f0; border:2.5px solid #000; border-radius:14px;
  box-shadow:6px 6px 0 #000; opacity:0; transform:scale(.96); transform-origin:top right;
  transition:opacity .14s ease, transform .14s ease; pointer-events:auto;
  font-family:Heebo,Arial,sans-serif; font-size:13.5px; line-height:1.65; direction:rtl; }
.iframe-tooltip.show { opacity:1; transform:scale(1); }
.iframe-tooltip h4 { margin:0 0 8px; font-size:16px; color:#facc15; font-weight:900 }
.iframe-tooltip h5 { margin:8px 0 4px; font-size:13px; color:#fbbf24; text-transform:uppercase; letter-spacing:.3px }
.iframe-tooltip p { margin:0 0 8px }
.iframe-tooltip code { background:#0a0f1c; color:#fcd34d; padding:1px 6px; border-radius:4px;
  font-family:Consolas,monospace; font-size:12px; direction:ltr; display:inline-block }
.iframe-tooltip pre { margin:6px 0; padding:8px 10px; background:#0a0f1c; border-radius:8px;
  color:#86efac; direction:ltr; text-align:left; font-family:Consolas,monospace;
  font-size:11.5px; line-height:1.5; white-space:pre-wrap; word-break:break-all;
  max-height:220px; overflow:auto }
.iframe-tooltip pre.before { color:#fca5a5 }
.iframe-tooltip .vt-tag { display:inline-block; padding:2px 8px; border-radius:999px;
  border:1.5px solid #facc15; background:rgba(250,204,21,.12); color:#facc15;
  font-size:11px; font-weight:900; margin-left:6px }
.iframe-tooltip .vt-close { position:absolute; top:6px; left:6px; width:24px; height:24px;
  border:2px solid #000; border-radius:50%; background:#facc15; color:#000;
  font-weight:900; cursor:pointer; padding:0; line-height:1 }

/* === Old-style improvement panel (kept for any leftover usage, hidden by default) === */
.imp-panel { display:none; }

/* === LEGACY (was) Improvement panel - kept for typography fallback only === */
.imp-panel-legacy { margin: 24px 12px; padding: 16px; border: 2.5px solid #000; border-radius: 14px;
  background: linear-gradient(135deg, #fef3c7, #fffbeb); box-shadow: 4px 4px 0 #000; }
.imp-panel .imp-title { margin: 0 0 12px; font-size: 18px; color: #1f2937; font-weight: 900;
  border-bottom: 2px dashed #f59e0b; padding-bottom: 8px; }
.imp-panel .imp-score { display: inline-block; margin-right: 8px; padding: 3px 10px;
  border: 2px solid #000; border-radius: 999px; background: #facc15; color: #000;
  font-size: 12px; font-weight: 900; }
.imp-bug { margin-bottom: 14px; padding: 10px; border: 2px solid #000; border-radius: 10px;
  background: #fff; box-shadow: 2px 2px 0 #000; }
.imp-bug-head { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;
  font-size: 14px; line-height: 1.6; }
.imp-bug-desc { flex: 1; }
.sev { display: inline-block; padding: 2px 8px; border: 2px solid #000; border-radius: 999px;
  font-size: 11px; font-weight: 900; white-space: nowrap; }
.sev-crit { background: #fee2e2; color: #b91c1c; }
.sev-high { background: #ffedd5; color: #c2410c; }
.sev-med  { background: #fef3c7; color: #b45309; }
.sev-low  { background: #ccfbf1; color: #0f766e; }
.imp-bug-diff { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.imp-before, .imp-after { border: 1.5px solid #000; border-radius: 8px; padding: 8px;
  background: #f8fafc; min-width: 0; }
.imp-before { background: #fef2f2; }
.imp-after { background: #f0fdf4; }
.imp-label { font-weight: 900; font-size: 11px; margin-bottom: 4px;
  text-transform: uppercase; letter-spacing: .5px; color: #475569; }
.imp-before .imp-label { color: #b91c1c; }
.imp-after .imp-label { color: #166534; }
.imp-before pre, .imp-after pre { margin: 0; padding: 6px; background: #0f172a;
  color: #e2e8f0; border-radius: 6px; direction: ltr; text-align: left;
  font-family: Consolas, Monaco, monospace; font-size: 11.5px; line-height: 1.55;
  white-space: pre-wrap; word-break: break-all; max-height: 220px; overflow: auto; }
.imp-after pre { color: #86efac; }
.imp-block { margin-top: 12px; padding: 10px 12px; border: 2px solid #000; border-radius: 10px;
  background: #fff; box-shadow: 2px 2px 0 #000; }
.imp-block h5 { margin: 0 0 8px; font-size: 14px; }
.imp-block ul { margin: 0; padding-right: 20px; }
.imp-block ul li { font-size: 13.5px; line-height: 1.65; margin-bottom: 4px; }
.imp-missing { background: #fef2f2; }
.imp-extras { background: #f0fdf4; }

/* === Two-question notice === */
.two-q-notice { padding: 20px; margin: 0 0 18px; border: 2.5px solid #000;
  border-radius: 14px; background: linear-gradient(135deg, #dbeafe, #ede9fe);
  box-shadow: 4px 4px 0 #000; }
.two-q-notice .q-header { display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  border-bottom: 2px dashed #1e40af; padding-bottom: 10px; margin-bottom: 14px; }
.two-q-notice .q-number { padding: 4px 10px; border: 2px solid #000; border-radius: 999px;
  background: #fff; font-weight: 900; font-size: 13px; }
.two-q-notice h3 { margin: 0; flex: 1; font-size: 18px; }
.two-q-notice .topic { padding: 3px 9px; border-radius: 999px; background: #fef3c7;
  border: 1.5px solid #000; font-size: 11px; font-weight: 900; }
.big-100 { font-size: 22px; font-weight: 900; color: #1e40af; padding: 12px 16px;
  border: 3px solid #000; border-radius: 12px; background: #fff;
  box-shadow: 3px 3px 0 #000; margin-bottom: 12px; display: inline-block; }
.q-tip { padding: 10px 12px; background: #fef3c7; border: 2px solid #f59e0b;
  border-radius: 10px; font-size: 13.5px; line-height: 1.65; }
.q-source-doc { margin-top: 12px; padding: 10px; background: #f8fafc;
  border: 2px solid #cbd5e1; border-radius: 10px; }
.q-source-doc summary { cursor: pointer; font-weight: 900; font-size: 13px; }
.q-source-doc pre { margin: 8px 0 0; padding: 10px; background: #0f172a; color: #e2e8f0;
  border-radius: 6px; font-size: 12px; line-height: 1.5; direction: rtl; text-align: right; }

@media (max-width: 720px) {
  .imp-bug-diff { grid-template-columns: 1fr; }
}
</style>
"""


def apply_phase_b_patches(html: str) -> str:
    """Phase B — inject improvement panels into each section, replace missing-Q placeholders."""
    print(f"  Applying Phase B patches to {len(IMPROVEMENTS)} questions…")
    # Inject CSS into the head of the exam-solutions HTML
    if "</head>" in html:
        html = html.replace("</head>", PORTAL_INJECT_CSS + "</head>", 1)
    # Inject tooltip script before </body>
    if "</body>" in html:
        html = html.replace("</body>", PORTAL_INJECT_SCRIPT + "</body>", 1)

    # Apply per-question patches
    for qid, data in IMPROVEMENTS.items():
        panel = render_improvement_panel(qid, data)
        html = replace_section(html, qid, panel)

    # Replace the placeholder Q3 sections for logistics & currency
    for missing_qid, exam_key in [("logistics-q3", "logistics"), ("currency-q3", "currency")]:
        notice = render_two_question_notice(missing_qid, exam_key)
        html = replace_missing_section(html, missing_qid, notice)

    return html


ROUND3_DIR = ROOT / "extras" / "qa-bundle-r3"


def patch_round3_pages() -> int:
    """Inject improvement chips + tooltip system into each of the 25 ROUND3 pages.

    Modifies the files in place inside extras/qa-bundle-r3/.
    Returns count of patched files.
    """
    if not ROUND3_DIR.exists():
        print(f"  Skipping ROUND3 patch — {ROUND3_DIR} not found", file=sys.stderr)
        return 0

    patched = 0
    marker_css = "<!--portal-r3-css-->"
    marker_script = "<!--portal-r3-script-->"

    for qid, data in IMPROVEMENTS.items():
        page = ROUND3_DIR / f"{qid}.html"
        if not page.exists():
            # logistics-q3 / currency-q3 don't exist in ROUND3 (only 2-Q tests)
            continue
        html = read(page)

        # Idempotent: skip if already patched
        if marker_css in html:
            # Re-patch panel content even if previously patched (in case data changed)
            # Replace the existing panel between markers
            panel_start = "<!--portal-r3-panel-start-->"
            panel_end = "<!--portal-r3-panel-end-->"
            if panel_start in html and panel_end in html:
                new_panel = panel_start + render_improvement_panel(qid, data) + panel_end
                pre = html.split(panel_start)[0]
                post = html.split(panel_end)[-1]
                html = pre + new_panel + post
                page.write_text(html, encoding="utf-8")
                patched += 1
            continue

        # Inject CSS in head
        if "</head>" in html:
            html = html.replace("</head>", marker_css + PORTAL_INJECT_CSS + "</head>", 1)

        # Inject the panel near the bottom of <main> or before the qa-debug card,
        # so it appears AFTER the original solution but BEFORE any QA report card.
        panel = (
            "<!--portal-r3-panel-start-->"
            + render_improvement_panel(qid, data)
            + "<!--portal-r3-panel-end-->"
        )

        # Strategy: insert immediately after the question-card section closes
        anchor = '</section>\n</main>'
        if anchor in html:
            html = html.replace(anchor, panel + "\n" + anchor, 1)
        else:
            # Fallback: insert before </body>
            html = html.replace("</body>", panel + "</body>", 1)

        # Inject tooltip script before </body>
        if marker_script not in html and "</body>" in html:
            html = html.replace(
                "</body>",
                marker_script + PORTAL_INJECT_SCRIPT + "</body>",
                1,
            )

        page.write_text(html, encoding="utf-8")
        patched += 1

    print(f"  Patched {patched} ROUND3 pages with improvement chips")
    return patched


def main() -> int:
    if not EXAMS_FILE.exists() or not STUDY_FILE.exists():
        print(f"Source files not found in {SRC}", file=sys.stderr)
        return 1

    exams_html = read(EXAMS_FILE)
    study_html = read(STUDY_FILE)

    # Phase B will mutate exams_html with per-question improvements.
    exams_html = apply_phase_b_patches(exams_html)

    # Also inject improvements into the ROUND3 separate pages
    patch_round3_pages()

    # Build the score-card data (lightweight summary for the dedicated tab)
    score_card = build_score_card_data()

    payload = {
        "exams": b64(exams_html),
        "study": b64(study_html),
        "exams_chars": len(exams_html),
        "study_chars": len(study_html),
        "scoreCard": score_card,
    }
    payload_json = json.dumps(payload, ensure_ascii=False)

    portal = PORTAL_TEMPLATE.replace(
        "/*__PAYLOAD_JSON__*/", payload_json
    )

    ROOT.mkdir(parents=True, exist_ok=True)
    OUT.write_text(portal, encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")
    return 0


def build_score_card_data() -> list:
    """Build a lightweight summary of all 25 questions for the Score Card tab."""
    out = []
    for exam_key, (name, scores) in EXAM_TOTALS.items():
        questions = []
        for i, score in enumerate(scores, start=1):
            qid = f"{exam_key}-q{i}"
            data = IMPROVEMENTS.get(qid, {})
            sev_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
            for bug in data.get("bugs", []):
                sev = bug.get("severity", "medium")
                if sev in sev_counts:
                    sev_counts[sev] += 1
            questions.append({
                "qid": qid,
                "title": data.get("title", qid),
                "score": score,
                "bugCount": len(data.get("bugs", [])),
                "missingCount": len(data.get("missing", [])),
                "extrasCount": len(data.get("extras", [])),
                "sev": sev_counts,
            })
        # HelpMe edge case: student picks Q2 OR Q3, so max is Q1 + 25 = 100
        # Other exams: total is just sum of all scores
        if exam_key == "helpme":
            display_total = scores[0] + scores[1]  # 75 + 25 = 100
        else:
            display_total = sum(scores)
        out.append({
            "examKey": exam_key,
            "name": name,
            "scores": scores,
            "total": display_total,
            "note": EXAM_NOTES.get(exam_key, ""),
            "questionCount": len(scores),
            "questions": questions,
        })
    return out


# ========= TEMPLATE =========

PORTAL_TEMPLATE = r"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>פורטל מבחן 2 — איחוד + פתרונות 100</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&family=Rubik:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0f172a;
    --paper:#ffffff;
    --bg:#f8fafc;
    --muted:#64748b;
    --line:#e5e7eb;
    --accent:#7c3aed;
    --accent-2:#2563eb;
    --pink:#ec4899;
    --green:#16a34a;
    --orange:#f97316;
    --yellow:#facc15;
    --red:#dc2626;
    --hero-1:#0f172a;
    --hero-2:#312e81;
    --hero-3:#7c3aed;
    --shadow:3px 3px 0 #000;
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{
    margin:0; font-family:Heebo,Rubik,Arial,sans-serif; background:
      radial-gradient(circle at 8% 10%, rgba(236,72,153,.10), transparent 30%),
      radial-gradient(circle at 92% 14%, rgba(37,99,235,.10), transparent 28%),
      radial-gradient(circle at 50% 92%, rgba(22,163,74,.08), transparent 35%),
      var(--bg);
    color:var(--ink); overflow:hidden;
  }
  .shell{display:grid; grid-template-rows:auto auto 1fr; height:100vh}
  header.hero{
    padding:14px 22px;
    background:linear-gradient(135deg,var(--hero-1),var(--hero-2) 55%,var(--hero-3));
    color:#fff; border-bottom:4px solid #000; display:flex; align-items:center; gap:14px; flex-wrap:wrap;
  }
  .hero h1{margin:0; font-size:clamp(20px,2.4vw,32px); font-weight:900; line-height:1.15}
  .hero p{margin:2px 0 0; color:#e0e7ff; font-size:13px}
  .badge{display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border:2px solid #000; border-radius:999px; background:var(--yellow); color:#000; font-weight:900; box-shadow:var(--shadow)}
  nav.tabs{
    background:rgba(255,255,255,.96); border-bottom:3px solid #000;
    padding:10px 14px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;
  }
  nav.tabs button{
    border:2.5px solid #000; background:#fff; border-radius:11px; padding:8px 12px;
    font-weight:900; cursor:pointer; color:#0f172a; box-shadow:2px 2px 0 #000; transition:.15s;
    font-family:inherit; font-size:13px; line-height:1; white-space:nowrap;
  }
  nav.tabs button:hover{transform:translate(-1px,-1px); box-shadow:4px 4px 0 #000}
  nav.tabs button.active{background:linear-gradient(135deg,#facc15,#fb923c); transform:translate(-1px,-1px); color:#000}
  nav.tabs .sep{width:1px; height:22px; background:#cbd5e1; margin:0 4px}
  main.workspace{position:relative; min-height:0; overflow:hidden}
  .panel{position:absolute; inset:0; background:#fff; display:none}
  .panel.active{display:block}
  .panel iframe{width:100%; height:100%; border:0; background:#fff}
  /* Home tab */
  .home-pad{padding:24px; max-width:1100px; margin:0 auto; height:100%; overflow:auto}
  .home-pad h2{margin:0 0 8px; font-size:24px}
  .home-pad p{color:#475569; line-height:1.7}
  .home-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; margin-top:18px}
  .home-card{
    border:2.5px solid #000; border-radius:14px; padding:14px; background:#fff; box-shadow:var(--shadow);
    cursor:pointer; transition:.15s;
  }
  .home-card:hover{transform:translate(-2px,-2px); box-shadow:5px 5px 0 #000}
  .home-card h3{margin:0 0 6px; font-size:16px}
  .home-card p{margin:0; font-size:13px; color:#475569}
  .home-card .ico{font-size:24px; margin-bottom:6px; display:block}
  .home-card .pill{display:inline-block; border:2px solid #000; border-radius:7px; padding:1px 6px; font-size:11px; background:#fef3c7; color:#000; font-weight:900; margin-top:4px}
  .home-foot{margin-top:22px; padding:12px; border:2px dashed #94a3b8; border-radius:12px; background:#f8fafc; color:#334155; font-size:13px; line-height:1.7}
  .home-foot code{background:#0f172a; color:#facc15; padding:1px 6px; border-radius:5px; font-family:Consolas,monospace; font-size:12px; direction:ltr; display:inline-block}
  .loader{position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.85); font-weight:900; color:#0f172a; z-index:5}
  .loader.hidden{display:none}
  .loader .spin{width:30px; height:30px; border-radius:50%; border:4px solid #e2e8f0; border-top-color:var(--accent); animation:spin .8s linear infinite; margin-left:10px}
  @keyframes spin{to{transform:rotate(360deg)}}

  .dark-toggle{
    margin-right:auto; padding:6px 10px; border:2px solid #000; border-radius:10px; background:#fff;
    cursor:pointer; font-size:16px; box-shadow:2px 2px 0 #000; transition:.15s;
  }
  .dark-toggle:hover{transform:translate(-1px,-1px); box-shadow:4px 4px 0 #000}

  /* === Score Card panel === */
  .sc-pad{padding:24px; max-width:1200px; margin:0 auto; height:100%; overflow:auto}
  .sc-pad h2{margin:0 0 8px; font-size:26px}
  .sc-intro{color:#475569; line-height:1.7; margin:0 0 18px}
  .sc-summary{display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:22px}
  .sc-stat{border:2.5px solid #000; border-radius:14px; padding:14px; background:#fff; box-shadow:var(--shadow); text-align:center}
  .sc-stat-num{font-size:36px; font-weight:900; color:#7c3aed; line-height:1}
  .sc-stat-lbl{font-size:13px; color:#475569; margin-top:4px}
  .sc-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:14px; margin-bottom:22px}
  .sc-exam{border:2.5px solid #000; border-radius:14px; background:#fff; box-shadow:var(--shadow); overflow:hidden}
  .sc-exam-head{padding:11px 14px; background:linear-gradient(135deg,#0f172a,#312e81); color:#fff; font-weight:900}
  .sc-exam-head .total{float:left; padding:2px 9px; background:#facc15; color:#000; border-radius:999px; font-size:11px; font-weight:900}
  .sc-exam-note{padding:6px 14px; background:#fef9c3; border-bottom:1.5px solid #e5e7eb; font-size:11.5px; color:#713f12; font-style:italic}
  .sc-exam-q{padding:10px 14px; border-top:1.5px solid #e5e7eb; cursor:pointer; transition:.15s}
  .sc-exam-q:hover{background:#fef3c7}
  .sc-exam-q-title{font-size:14px; font-weight:700; margin-bottom:5px}
  .sc-exam-q-meta{display:flex; gap:5px; flex-wrap:wrap; font-size:11px}
  .sc-exam-q-pts{padding:2px 8px; background:#1e40af; color:#fff; border-radius:999px; font-weight:900}
  .sc-sev-bar{display:flex; gap:3px; align-items:center; flex-wrap:wrap}
  .sc-chip{display:inline-flex; align-items:center; gap:3px; padding:1.5px 7px; border:1.5px solid #000; border-radius:999px; font-weight:900; font-size:10.5px}
  .sc-chip-crit{background:#fee2e2; color:#991b1b}
  .sc-chip-high{background:#ffedd5; color:#9a3412}
  .sc-chip-med {background:#fef3c7; color:#92400e}
  .sc-chip-low {background:#ccfbf1; color:#155e75}
  .sc-chip-fixed{background:#d1fae5; color:#065f46}
  .sc-chip-extra{background:#ede9fe; color:#5b21b6}
  .sc-chip-missing{background:#fce7f3; color:#9d174d}

  .sev{display:inline-block; padding:2px 8px; border:1.5px solid #000; border-radius:999px; font-size:10.5px; font-weight:900; margin:0 3px}
  .sev-crit{background:#fee2e2; color:#b91c1c}
  .sev-high{background:#ffedd5; color:#c2410c}
  .sev-med{background:#fef3c7; color:#b45309}
  .sev-low{background:#ccfbf1; color:#0f766e}

  .sc-legend, .sc-shortcuts{padding:12px 14px; border:2px dashed #94a3b8; border-radius:12px; background:#f8fafc; color:#334155; font-size:13px; line-height:2; margin-bottom:14px}
  .sc-shortcuts kbd{display:inline-block; padding:2px 7px; border:1.5px solid #000; border-radius:5px; background:#fff; font-family:Consolas,monospace; font-size:11.5px; font-weight:900; box-shadow:1.5px 1.5px 0 #000; margin:0 1px}

  /* === Dark mode === */
  body.dark{
    --bg:#0f172a; --paper:#111827; --ink:#e5e7eb; --line:#1f2937; --muted:#94a3b8;
    background:radial-gradient(circle at 8% 10%, rgba(124,58,237,.18), transparent 30%),
               radial-gradient(circle at 92% 14%, rgba(37,99,235,.16), transparent 28%),
               radial-gradient(circle at 50% 92%, rgba(22,163,74,.10), transparent 35%),
               #0f172a;
    color:#e5e7eb;
  }
  body.dark nav.tabs{background:rgba(15,23,42,.94); border-bottom-color:#000}
  body.dark nav.tabs button{background:#1e293b; color:#e2e8f0; border-color:#000}
  body.dark nav.tabs button.active{background:linear-gradient(135deg,#facc15,#fb923c); color:#000}
  body.dark .panel{background:#0f172a}
  body.dark .home-card,
  body.dark .home-foot,
  body.dark .sc-exam,
  body.dark .sc-stat,
  body.dark .sc-legend, body.dark .sc-shortcuts{background:#1e293b; color:#e2e8f0}
  body.dark .home-card p, body.dark .sc-stat-lbl, body.dark .sc-intro{color:#94a3b8}
  body.dark .sc-exam-q{border-top-color:#1e293b}
  body.dark .sc-exam-q:hover{background:#312e81}

  /* === Study level switcher (when חומר לימוד tab active) === */
  .study-level-bar{display:flex; gap:6px; align-items:center; flex-wrap:wrap;
    padding:8px 14px; border-bottom:3px solid #000;
    background:linear-gradient(135deg,#dbeafe,#fae8ff)}
  body.dark .study-level-bar{background:linear-gradient(135deg,#1e3a8a,#5b21b6); color:#e2e8f0}
  .study-label{font-weight:900; color:#1f2937; font-size:13px; margin-left:6px}
  body.dark .study-label{color:#e2e8f0}
  .study-lvl-btn{padding:6px 11px; border:2px solid #000; border-radius:10px;
    background:#fff; cursor:pointer; font-weight:900; font-size:12px;
    box-shadow:2px 2px 0 #000; font-family:inherit; transition:.15s; white-space:nowrap}
  .study-lvl-btn:hover{transform:translate(-1px,-1px); box-shadow:3px 3px 0 #000}
  .study-lvl-btn.active{background:linear-gradient(135deg,#facc15,#fb923c); color:#000}
  body.dark .study-lvl-btn{background:#1e293b; color:#e2e8f0}
  body.dark .study-lvl-btn.active{background:linear-gradient(135deg,#facc15,#fb923c); color:#000}
  .study-sep{color:#64748b; font-weight:900}

  /* Adjust study panel for the toolbar */
  .panel[data-panel="study"].active{display:flex; flex-direction:column}
  .panel[data-panel="study"] iframe{flex:1; min-height:0}

  /* === Solution source toggle === */
  .sol-source-bar{display:flex; gap:8px; align-items:center; flex-wrap:wrap;
    padding:8px 14px; border-bottom:3px solid #000; background:#fef9c3}
  body.dark .sol-source-bar{background:#312e81; color:#e2e8f0}
  .sol-label{font-weight:900; color:#1f2937; font-size:13px}
  body.dark .sol-label{color:#e2e8f0}
  .sol-toggle{padding:6px 12px; border:2px solid #000; border-radius:10px;
    background:#fff; cursor:pointer; font-weight:900; font-size:12px;
    box-shadow:2px 2px 0 #000; font-family:inherit; transition:.15s}
  .sol-toggle:hover{transform:translate(-1px,-1px); box-shadow:3px 3px 0 #000}
  .sol-toggle.active{background:linear-gradient(135deg,#facc15,#fb923c); color:#000}
  body.dark .sol-toggle{background:#1e293b; color:#e2e8f0}
  body.dark .sol-toggle.active{background:linear-gradient(135deg,#facc15,#fb923c); color:#000}
  .sol-hint{margin-right:auto; font-size:11px; color:#92400e; font-style:italic}
  body.dark .sol-hint{color:#fcd34d}

  /* Adjust iframe to leave room for toolbar (only when active) */
  .panel[data-panel="exams"].active{display:flex; flex-direction:column}
  .panel[data-panel="exams"] iframe{flex:1; min-height:0}

  /* === Visual Home (constellation) === */
  .viz-home{height:100%; overflow:auto; padding:20px;
    background:radial-gradient(circle at 50% 50%, rgba(124,58,237,.08), transparent 60%)}
  .viz-home svg{display:block; max-width:100%; margin:0 auto; user-select:none}
  .viz-node{cursor:pointer; transition:filter .2s ease, transform .2s ease; transform-origin:center; transform-box:fill-box}
  .viz-node:hover{filter:brightness(1.15) drop-shadow(0 0 12px currentColor); transform:scale(1.06)}
  .viz-node.active{filter:brightness(1.18) drop-shadow(0 0 18px currentColor)}
  .viz-node-anim{animation:viz-orbit-anim 80s linear infinite; transform-origin:490px 290px; transform-box:view-box}
  @keyframes viz-orbit-anim{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .viz-counter-anim{animation:viz-orbit-counter 80s linear infinite; transform-origin:center; transform-box:fill-box}
  @keyframes viz-orbit-counter{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
  .viz-pulse{animation:viz-pulse 2.4s ease-in-out infinite; transform-origin:center; transform-box:fill-box}
  @keyframes viz-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
  .viz-q-pulse{animation:viz-q-pulse 1.8s ease-in-out infinite; transform-origin:center; transform-box:fill-box}
  @keyframes viz-q-pulse{0%,100%{opacity:1; transform:scale(1)}50%{opacity:.85; transform:scale(1.07)}}
  .viz-orbit{fill:none; stroke:rgba(124,58,237,.22); stroke-width:1.5; stroke-dasharray:5 7;
    animation:viz-orbit-rotate 60s linear infinite; transform-origin:center; transform-box:view-box}
  @keyframes viz-orbit-rotate{from{stroke-dashoffset:0}to{stroke-dashoffset:-200}}
  .viz-link{fill:none; stroke:rgba(15,23,42,.18); stroke-width:1.4; stroke-dasharray:3 6}
  body.dark .viz-link{stroke:rgba(255,255,255,.18)}
  body.dark .viz-orbit{stroke:rgba(124,58,237,.32)}
  .viz-legend{display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:16px}
  .viz-legend .lg{display:inline-flex; align-items:center; gap:6px; padding:6px 12px;
    border:2px solid #000; border-radius:999px; background:#fff; font-weight:900; font-size:12px;
    box-shadow:2px 2px 0 #000}
  .viz-legend .lg .dot{width:14px; height:14px; border-radius:50%; border:1.5px solid #000}
  body.dark .viz-legend .lg{background:#1e293b; color:#e2e8f0}

  /* === Learning Roadmap (below constellation) === */
  .viz-roadmap{margin:30px auto 14px; max-width:1100px; padding:14px 18px;
    border:2.5px solid #000; border-radius:18px; background:#fff;
    box-shadow:5px 5px 0 #000}
  body.dark .viz-roadmap{background:#1e293b; color:#e2e8f0}
  .viz-roadmap h3{margin:0 0 10px; font-size:18px; text-align:center}
  .roadmap-track{display:flex; align-items:center; gap:6px; overflow-x:auto;
    padding:8px 4px; scroll-snap-type:x mandatory}
  .roadmap-step{flex:0 0 auto; display:flex; flex-direction:column; align-items:center;
    padding:10px; min-width:120px; border:2px solid #000; border-radius:12px;
    cursor:pointer; transition:.16s; box-shadow:2px 2px 0 #000; scroll-snap-align:start;
    background:linear-gradient(135deg,#fef9c3,#fefce8)}
  .roadmap-step:hover{transform:translate(-2px,-2px); box-shadow:4px 4px 0 #000}
  .roadmap-step .rs-ico{font-size:28px; margin-bottom:4px}
  .roadmap-step .rs-num{font-size:11px; color:#92400e; font-weight:900}
  .roadmap-step .rs-title{font-size:12.5px; font-weight:900; text-align:center; color:#0f172a; line-height:1.3}
  body.dark .roadmap-step{background:linear-gradient(135deg,#312e81,#3b0764); color:#e2e8f0}
  body.dark .roadmap-step .rs-num{color:#fcd34d}
  body.dark .roadmap-step .rs-title{color:#e2e8f0}
  .roadmap-arrow{flex:0 0 auto; font-size:22px; #64748b; padding:0 4px;
    align-self:center; transform:rotate(180deg)}
  body.dark .roadmap-arrow{color:#cbd5e1}
  .roadmap-step.r-grandma{background:linear-gradient(135deg,#fce7f3,#fbcfe8)}
  .roadmap-step.r-begin{background:linear-gradient(135deg,#bbf7d0,#86efac)}
  .roadmap-step.r-mid{background:linear-gradient(135deg,#bfdbfe,#93c5fd)}
  .roadmap-step.r-exam{background:linear-gradient(135deg,#fed7aa,#fdba74)}
  .roadmap-step.r-expert{background:linear-gradient(135deg,#c4b5fd,#a78bfa)}
  .roadmap-step.r-100{background:linear-gradient(135deg,#fde68a,#facc15)}
  .roadmap-step.r-bank{background:linear-gradient(135deg,#a7f3d0,#6ee7b7)}
  .roadmap-step.r-debug{background:linear-gradient(135deg,#fecaca,#fca5a5)}
  .roadmap-step.r-do{background:linear-gradient(135deg,#fef3c7,#fde68a); border-style:dashed}
  body.dark .roadmap-step.r-do{background:linear-gradient(135deg,#451a03,#78350f)}

  /* === Universal tooltip / popover === */
  .viz-tooltip{
    position:fixed; z-index:10000; max-width:520px; min-width:240px;
    padding:14px 18px;
    background:linear-gradient(135deg,#0f172a,#1e293b);
    color:#e2e8f0; border:2.5px solid #000; border-radius:14px;
    box-shadow:6px 6px 0 #000;
    pointer-events:auto; opacity:0; transform:scale(.96); transform-origin:top right;
    transition:opacity .14s ease, transform .14s ease;
    font-family:Heebo,Arial,sans-serif; font-size:13.5px; line-height:1.65;
    direction:rtl;
  }
  .viz-tooltip.show{opacity:1; transform:scale(1)}
  .viz-tooltip h4{margin:0 0 8px; font-size:16px; color:#facc15; font-weight:900}
  .viz-tooltip h5{margin:8px 0 4px; font-size:13px; color:#fbbf24; text-transform:uppercase; letter-spacing:.3px}
  .viz-tooltip p{margin:0 0 8px}
  .viz-tooltip code{background:#0a0f1c; color:#fcd34d; padding:1px 6px; border-radius:4px;
    font-family:Consolas,monospace; font-size:12px; direction:ltr; display:inline-block}
  .viz-tooltip pre{margin:6px 0; padding:8px 10px; background:#0a0f1c; border-radius:8px;
    color:#86efac; direction:ltr; text-align:left; font-family:Consolas,monospace;
    font-size:11.5px; line-height:1.5; white-space:pre-wrap; word-break:break-all;
    max-height:200px; overflow:auto}
  .viz-tooltip pre.before{color:#fca5a5}
  .viz-tooltip .vt-cta{display:inline-block; margin-top:8px; padding:5px 12px;
    background:#facc15; color:#000; border:2px solid #000; border-radius:8px;
    font-weight:900; cursor:pointer; text-decoration:none; font-size:12px;
    box-shadow:2px 2px 0 #000}
  .viz-tooltip .vt-cta:hover{transform:translate(-1px,-1px); box-shadow:3px 3px 0 #000}
  .viz-tooltip .vt-close{position:absolute; top:6px; left:6px; width:24px; height:24px;
    border:2px solid #000; border-radius:50%; background:#facc15; color:#000;
    font-weight:900; cursor:pointer; padding:0; line-height:1}
  .viz-tooltip .vt-close:hover{background:#fb923c}
  .viz-tooltip .vt-tag{display:inline-block; padding:2px 8px; border-radius:999px;
    border:1.5px solid #facc15; background:rgba(250,204,21,.12); color:#facc15;
    font-size:11px; font-weight:900; margin-left:6px}

  /* Severity-colored chips for compact views */
  .sev-chip{display:inline-flex; align-items:center; justify-content:center;
    min-width:22px; height:22px; padding:0 7px; border:1.8px solid #000;
    border-radius:999px; font-size:11px; font-weight:900; cursor:pointer;
    margin:1.5px; transition:.12s; box-shadow:1.5px 1.5px 0 #000}
  .sev-chip:hover{transform:translate(-1px,-1px); box-shadow:3px 3px 0 #000}
  .sev-chip.crit{background:#fca5a5; color:#7f1d1d}
  .sev-chip.high{background:#fdba74; color:#7c2d12}
  .sev-chip.med{background:#fde68a; color:#78350f}
  .sev-chip.low{background:#5eead4; color:#134e4a}
  .sev-chip.fixed{background:#86efac; color:#14532d}
  .sev-chip.miss{background:#f9a8d4; color:#831843}
  .sev-chip.extra{background:#c4b5fd; color:#4c1d95}

  /* === Donut chart for Score Card === */
  .donut-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:18px; margin-bottom:22px}
  .donut-card{position:relative; padding:14px; border:2.5px solid #000; border-radius:18px;
    background:#fff; box-shadow:var(--shadow); display:flex; flex-direction:column; align-items:center}
  body.dark .donut-card{background:#1e293b; color:#e2e8f0}
  .donut-card .dc-name{font-size:15px; font-weight:900; margin-bottom:4px; text-align:center}
  .donut-card .dc-meta{font-size:11px; color:#475569; margin-bottom:8px}
  body.dark .donut-card .dc-meta{color:#94a3b8}
  .donut-svg{width:170px; height:170px}
  .donut-track{fill:none; stroke:#e5e7eb; stroke-width:18}
  body.dark .donut-track{stroke:#334155}
  .donut-arc{fill:none; stroke-width:18; stroke-linecap:butt;
    transition:stroke-width .12s, opacity .12s}
  .donut-arc:hover{stroke-width:22; cursor:pointer}
  .donut-center{text-anchor:middle; dominant-baseline:middle}
  .donut-center .total{font-size:32px; font-weight:900; fill:#0f172a}
  .donut-center .label{font-size:11px; fill:#475569}
  body.dark .donut-center .total{fill:#fff}
  body.dark .donut-center .label{fill:#cbd5e1}
  .donut-q-list{margin-top:10px; width:100%; display:flex; flex-direction:column; gap:5px}
  .donut-q-item{display:flex; align-items:center; gap:6px; padding:6px 10px;
    border:1.5px solid #000; border-radius:8px; background:#f8fafc;
    cursor:pointer; font-size:12px; transition:.12s}
  .donut-q-item:hover{background:#fef3c7; transform:translate(-1px,-1px); box-shadow:2px 2px 0 #000}
  body.dark .donut-q-item{background:#0f172a; color:#e2e8f0}
  .donut-q-name{flex:1; font-weight:700; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
  .donut-q-pts{padding:1px 6px; background:#1e40af; color:#fff; border-radius:999px; font-size:10px; font-weight:900}
  .donut-q-bugs{display:inline-flex; gap:3px; align-items:center; flex-wrap:wrap}
  .donut-q-bugs .mini{display:inline-block; width:9px; height:9px; border-radius:50%; border:1px solid #000}
  .donut-q-bugs .mini-crit{background:#dc2626}
  .donut-q-bugs .mini-high{background:#ea580c}
  .donut-q-bugs .mini-med{background:#facc15}
  .donut-q-bugs .mini-low{background:#14b8a6}

  /* === Extras (additional materials) === */
  .extras-pad{padding:24px; max-width:1280px; margin:0 auto; height:100%; overflow:auto}
  .extras-hero{margin-bottom:18px}
  .extras-hero h2{margin:0 0 8px; font-size:26px}
  .extras-hero p{margin:0; color:#475569; line-height:1.7}
  .extras-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; margin-bottom:18px}
  .ex-card{display:block; padding:16px; border:2.5px solid #000; border-radius:14px; background:#fff;
    box-shadow:var(--shadow); cursor:pointer; transition:.16s; text-decoration:none; color:inherit}
  .ex-card:hover{transform:translate(-2px,-2px); box-shadow:5px 5px 0 #000}
  .ex-card .ex-ico{font-size:32px; margin-bottom:8px}
  .ex-card h3{margin:0 0 6px; font-size:16px; line-height:1.3}
  .ex-card p{margin:0 0 8px; font-size:13px; color:#475569; line-height:1.55}
  .ex-card .ex-meta{display:inline-block; padding:2px 8px; border:1.5px solid #000; border-radius:999px;
    background:#fef3c7; font-size:11px; font-weight:900; color:#000}
  .ex-100{background:linear-gradient(135deg,#86efac,#4ade80); border-color:#15803d; box-shadow:5px 5px 0 #052e16}
  .ex-100:hover{box-shadow:7px 7px 0 #052e16}
  .ex-qa{background:linear-gradient(135deg,#fef9c3,#fffbeb)}
  .ex-print{background:linear-gradient(135deg,#dbeafe,#eff6ff)}
  .ex-fs{background:linear-gradient(135deg,#fce7f3,#fff7ed)}
  .ex-next{background:linear-gradient(135deg,#dcfce7,#f0fdf4)}
  .ex-dash{background:linear-gradient(135deg,#fae8ff,#f3e8ff)}
  .ex-th{background:linear-gradient(135deg,#e0f2fe,#f0f9ff)}
  .ex-mt,.ex-es,.ex-alg,.ex-sn,.ex-st{background:#fff}
  .extras-foot{padding:12px 14px; border:2px dashed #94a3b8; border-radius:12px; background:#f8fafc;
    color:#334155; font-size:13px; line-height:1.7}
  .extras-foot code{background:#0f172a; color:#facc15; padding:1px 6px; border-radius:5px;
    font-family:Consolas,monospace; font-size:12px; direction:ltr; display:inline-block}
  .extras-viewer{position:absolute; inset:0; display:flex; flex-direction:column; background:#fff}
  .extras-viewer.hidden{display:none}
  .extras-viewer-bar{padding:8px 12px; border-bottom:3px solid #000; background:#fafaf9;
    display:flex; gap:10px; align-items:center; flex-wrap:wrap}
  .ex-back{padding:7px 14px; border:2px solid #000; border-radius:10px; background:#facc15;
    cursor:pointer; font-weight:900; box-shadow:2px 2px 0 #000; font-family:inherit; font-size:13px}
  .ex-back:hover{transform:translate(-1px,-1px); box-shadow:4px 4px 0 #000}
  .ex-current{flex:1; font-weight:900; color:#0f172a}
  .ex-open{padding:6px 12px; border:2px solid #000; border-radius:10px; background:#fff;
    color:#0f172a; text-decoration:none; font-weight:900; box-shadow:2px 2px 0 #000; font-size:12px}
  .extras-viewer iframe{flex:1; width:100%; border:0}
  body.dark .ex-card,
  body.dark .extras-foot{background:#1e293b; color:#e2e8f0}
  body.dark .ex-card p, body.dark .extras-hero p{color:#94a3b8}
  body.dark .extras-viewer{background:#0f172a}
  body.dark .extras-viewer-bar{background:#1e293b; color:#e2e8f0}

  /* === Print === */
  @media print {
    nav.tabs, header.hero, .sc-shortcuts, .dark-toggle, .loader { display: none !important; }
    .panel { display: block !important; position: static !important; }
    .panel iframe { height: auto; min-height: 800px; }
  }

  /* Mobile */
  @media (max-width:780px){
    body{overflow:auto}
    .shell{height:auto; min-height:100vh}
    main.workspace{height:75vh; min-height:600px}
    nav.tabs{padding:8px 10px}
    nav.tabs button{font-size:12px; padding:6px 9px}
  }
</style>
</head>
<body>
<div class="shell">
  <header class="hero">
    <div class="badge">📦 פורטל מאוחד</div>
    <div>
      <h1>פורטל מבחן 2 — איחוד מלא + פתרונות 100</h1>
      <p>כל הטאבים, כל השאלות, כל רמות הלימוד — במקום אחד. <span style="opacity:.85">פתרונות עודכנו לציון 100, פוליש a11y/responsive, וכל המקור המקורי נשמר.</span></p>
    </div>
  </header>

  <nav class="tabs" id="tabs" role="tablist" aria-label="ניווט פורטל">
    <button data-tab="home" class="active" role="tab" aria-selected="true">🏠 בית</button>
    <button data-tab="scorecard" role="tab" aria-selected="false">📊 לוח ציונים</button>
    <button data-tab="exams" role="tab" aria-selected="false">📜 שאלות מבחן</button>
    <button data-tab="study" data-level="1" role="tab" aria-selected="false">🎓 חומר לימוד</button>
    <button data-tab="extras" role="tab" aria-selected="false">📚 חומרים נוספים</button>
    <span class="sep"></span>
    <button class="dark-toggle" id="darkToggle" aria-label="החלפת מצב כהה" title="החלפת מצב כהה (Ctrl+D)">🌙</button>
  </nav>

  <main class="workspace">
    <section class="panel active" data-panel="home" role="tabpanel" aria-label="בית">
      <div class="viz-home" id="viz-home">
        <!-- Constellation SVG injected by JS -->
      </div>
    </section>

    <section class="panel" data-panel="exams" role="tabpanel" aria-label="פתרונות מבחנים">
      <div class="sol-source-bar" role="toolbar" aria-label="בחירת מקור הפתרון">
        <span class="sol-label">מקור פתרון:</span>
        <button class="sol-toggle" data-sol-toggle="r3" onclick="window.__portalSetSolSource('r3')" aria-pressed="false">📘 ROUND3 ✓ (מומלץ)</button>
        <button class="sol-toggle" data-sol-toggle="embedded" onclick="window.__portalSetSolSource('embedded')" aria-pressed="false">📜 ישן (Embedded)</button>
        <span class="sol-hint">Score Card וניווט מהבית פותחים את המקור הנבחר</span>
      </div>
      <div class="loader" data-for="exams"><div class="spin"></div>טוען פתרונות מבחנים…</div>
      <iframe id="ifr-exams" title="פתרונות מבחנים" sandbox="allow-same-origin allow-scripts" loading="lazy"></iframe>
    </section>

    <section class="panel" data-panel="study" role="tabpanel" aria-label="חומר לימוד">
      <div class="study-level-bar" role="toolbar" aria-label="בחירת רמת לימוד">
        <span class="study-label">רמת לימוד:</span>
        <button class="study-lvl-btn active" data-level="1" onclick="window.__portalGoToLevel(1)">👵 סבתא</button>
        <button class="study-lvl-btn" data-level="2" onclick="window.__portalGoToLevel(2)">🌱 מתחילים</button>
        <button class="study-lvl-btn" data-level="3" onclick="window.__portalGoToLevel(3)">🔧 בינוניים</button>
        <button class="study-lvl-btn" data-level="4" onclick="window.__portalGoToLevel(4)">📝 רמת מבחן</button>
        <button class="study-lvl-btn" data-level="5" onclick="window.__portalGoToLevel(5)">🚀 מומחים</button>
        <span class="study-sep">·</span>
        <button class="study-lvl-btn" data-level="6" onclick="window.__portalGoToLevel(6)">🎯 100 במבחן</button>
        <button class="study-lvl-btn" data-level="7" onclick="window.__portalGoToLevel(7)">📚 בנק תרגול</button>
        <button class="study-lvl-btn" data-level="8" onclick="window.__portalGoToLevel(8)">🗺 מפת מערכת</button>
        <button class="study-lvl-btn" data-level="9" onclick="window.__portalGoToLevel(9)">🐞 Debug Mode</button>
      </div>
      <div class="loader" data-for="study"><div class="spin"></div>טוען חומר לימוד…</div>
      <iframe id="ifr-study" title="חומר לימוד" sandbox="allow-same-origin allow-scripts" loading="lazy"></iframe>
    </section>

    <section class="panel" data-panel="extras" role="tabpanel" aria-label="חומרים נוספים">
      <div class="extras-pad" id="extras-hub">
        <div class="extras-hero">
          <h2>📚 חומרים נוספים</h2>
          <p>כל החומרים המשלימים שאספת — מאוחדים כאן. לחיצה על כרטיס פותחת את התוכן בצד וטוענת את המקור המלא.</p>
        </div>
        <div class="extras-grid">
          <a class="ex-card ex-100" data-extra="solutions100/index.html">
            <div class="ex-ico">🏆</div>
            <h3>פתרונות 100/100 — קוד מתוקן בפועל</h3>
            <p><strong>חדש:</strong> קוד JSX/JS/Express שעבר תיקון <strong>בפועל</strong> של כל הבאגים (לא רק תיעוד). כל פתרון: hover-tip לכל שורה, רשימת באגים שתוקנו, וטבלת דרישה-מול-מימוש ✓/✗.</p>
            <span class="ex-meta">3/25 פתרונות (Football + עוד מתפתח)</span>
          </a>
          <a class="ex-card ex-qa" data-extra="qa-bundle-r3/index.html">
            <div class="ex-ico">📘</div>
            <h3>25 עמודי שאלה — ROUND3 ✓</h3>
            <p>הגרסה האחרונה: <strong>טבלת דרישות, file sequence, transitions, copy-buttons, hover-tips</strong> + פאנלי שיפור 100 שלי על כל אחת. CONTENT-VERIFIED 25/25.</p>
            <span class="ex-meta">25 דפים · ROUND3</span>
          </a>
          <a class="ex-card ex-dash" data-extra="course-portal/MAP_master.html">
            <div class="ex-ico">🎯</div>
            <h3>פורטל הכנה — 30+ מודולים</h3>
            <p>הגרסה המורחבת: <strong>30 דפים אינטראקטיביים</strong> — תיאוריה, נושאים חסרים, אלגוריתמים, סנפטים, אסטרטגיה, NestJS, Next.js, SQL, design systems, mock exams, flashcards, event-loop visualizer, debugging room, code sandbox, ועוד. נווט מתוך MAP_master.</p>
            <span class="ex-meta">30 מודולים · 42 MB · אינטראקטיבי מלא</span>
          </a>
          <a class="ex-card ex-next" data-extra="file-tree-master.html">
            <div class="ex-ico">🗺</div>
            <h3>עץ קבצים — Next.js + React</h3>
            <p>הגרסה הגדולה והמלאה: מפה אינטראקטיבית עם <strong>112+ קבצים</strong> בתיקיות מפורטות, hover על כל קובץ → תפקידו, מי מייבא, מה מייצא. SVG flow מלא.</p>
            <span class="ex-meta">355 KB · interactive · v4</span>
          </a>
          <a class="ex-card ex-fs" data-extra="fullstack-illustrated.html">
            <div class="ex-ico">🎨</div>
            <h3>Full Stack מאויר וצבעוני</h3>
            <p>מפת שכבות, תקשורת בין רכיבים, Import/Export, משל המסעדה — איורי SVG אינטראקטיביים.</p>
            <span class="ex-meta">SVG · 6 שכבות</span>
          </a>
          <a class="ex-card ex-qa" data-extra="exam-master-v3.html">
            <div class="ex-ico">⭐</div>
            <h3>Exam Master Fullstack v3</h3>
            <p>גרסה 3 של דף האב למבחן — תקציר ויזואלי של כל הנושאים החיוניים.</p>
            <span class="ex-meta">v3 · 92 KB</span>
          </a>
          <a class="ex-card ex-th" data-extra="course-portal/IDE_project.html">
            <div class="ex-ico">💻</div>
            <h3>IDE Project — בנייה צעד-צעד</h3>
            <p>סימולציית IDE: בנייה הדרגתית של פרויקט פולסטאק, קובץ אחר קובץ, עם הסברים.</p>
            <span class="ex-meta">Step-by-step · 56 KB</span>
          </a>
          <a class="ex-card ex-sn" data-extra="course-portal/BUILD_walkthrough.html">
            <div class="ex-ico">🔨</div>
            <h3>Build Walkthrough</h3>
            <p>הליכה שלב-שלב על תהליך הבנייה של אפליקציה — מ־npm init ועד deploy.</p>
            <span class="ex-meta">Walkthrough · 57 KB</span>
          </a>
          <a class="ex-card ex-print" data-extra="print-all-r3.html">
            <div class="ex-ico">🖨️</div>
            <h3>הדפסה PDF — כל 25 השאלות</h3>
            <p>גרסת PDF/הדפסה מאוחדת — כל השאלות והפתרונות בקובץ אחד.</p>
            <span class="ex-meta">1.93 MB · ROUND3 print</span>
          </a>
        </div>
        <div class="extras-foot">
          <strong>ℹ הערה:</strong> כל אחד מהקישורים נטען ב־iframe נפרד; הקבצים ב־<code>extras/</code> ולכן ניידים ושמורים מקומית.
        </div>
      </div>
      <div class="extras-viewer hidden" id="extras-viewer">
        <div class="extras-viewer-bar">
          <button class="ex-back" id="ex-back" aria-label="חזרה לרשימת חומרים">← חזרה</button>
          <span class="ex-current" id="ex-current">—</span>
          <a class="ex-open" id="ex-open" target="_blank" rel="noopener">↗ פתח בלשונית חדשה</a>
        </div>
        <iframe id="ifr-extras" title="חומר נוסף" loading="lazy"></iframe>
      </div>
    </section>

    <section class="panel" data-panel="scorecard" role="tabpanel" aria-label="לוח ציונים">
      <div class="sc-pad">
        <h2>📊 לוח ציונים — דרך ל־100/100</h2>
        <p class="sc-intro">סקירה של כל 9 המבחנים, 25 השאלות, וכמה תיקונים כל אחת דורשת. לחיצה על שאלה תפתח אותה ישירות בטאב פתרונות המבחנים.</p>

        <div class="sc-summary">
          <div class="sc-stat"><div class="sc-stat-num" id="sc-stat-exams">9</div><div class="sc-stat-lbl">מבחנים</div></div>
          <div class="sc-stat"><div class="sc-stat-num" id="sc-stat-questions">25</div><div class="sc-stat-lbl">שאלות אמיתיות</div></div>
          <div class="sc-stat"><div class="sc-stat-num" id="sc-stat-bugs">—</div><div class="sc-stat-lbl">באגים מתוקנים</div></div>
          <div class="sc-stat"><div class="sc-stat-num" id="sc-stat-extras">—</div><div class="sc-stat-lbl">פיצ'רים מעבר</div></div>
        </div>

        <div class="sc-grid" id="sc-grid"><!-- filled by JS --></div>

        <div class="sc-legend">
          <strong>חומרת באג:</strong>
          <span class="sev sev-crit">קריטי</span> – יוריד נקודות בוודאות אם לא מתוקן
          <span class="sev sev-high">גבוה</span> – ככל הנראה יוריד נקודות
          <span class="sev sev-med">בינוני</span> – יכול להוריד נקודות
          <span class="sev sev-low">נמוך</span> – פוליש שלא קריטי
        </div>

        <div class="sc-shortcuts">
          <strong>קיצורי מקלדת:</strong>
          <kbd>1</kbd>—<kbd>9</kbd> מחליף בין הטאבים הראשונים
          <kbd>Ctrl+D</kbd> מצב כהה
          <kbd>Esc</kbd> חוזר ל־בית
        </div>
      </div>
    </section>
  </main>
</div>

<div class="viz-tooltip" id="viz-tooltip" role="dialog" aria-live="polite">
  <button class="vt-close" id="vt-close" aria-label="סגירה">×</button>
  <div id="vt-content"></div>
</div>

<script type="application/json" id="portal-payload">/*__PAYLOAD_JSON__*/</script>
<script>
(() => {
  // ============= Decode payload =============
  const raw = document.getElementById('portal-payload').textContent;
  const data = JSON.parse(raw);

  // Decode base64-utf8 (atob returns latin1; use TextDecoder)
  function decodeB64(s) {
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  const examsHTML = decodeB64(data.exams);
  const studyHTML = decodeB64(data.study);

  // ============= Build blob URLs =============
  const examsURL = URL.createObjectURL(new Blob([examsHTML], {type:'text/html;charset=utf-8'}));
  const studyURL = URL.createObjectURL(new Blob([studyHTML], {type:'text/html;charset=utf-8'}));

  const ifrExams = document.getElementById('ifr-exams');
  const ifrStudy = document.getElementById('ifr-study');

  // ============= Tab switching =============
  const tabs = Array.from(document.querySelectorAll('nav.tabs button'));
  const panels = Array.from(document.querySelectorAll('main.workspace section.panel'));
  const loaders = Array.from(document.querySelectorAll('.loader'));

  let examsLoaded = false;
  let studyLoaded = false;

  function showPanel(name) {
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === name));
  }

  function setActiveTab(btn) {
    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected','false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
  }

  function loadExamsIframe() {
    if (examsLoaded) return;
    ifrExams.src = examsURL;
    examsLoaded = true;
    ifrExams.addEventListener('load', () => {
      const ld = document.querySelector('.loader[data-for="exams"]');
      if (ld) ld.classList.add('hidden');
    }, {once:true});
  }

  function loadStudyIframe(level) {
    if (!studyLoaded) {
      ifrStudy.src = studyURL;
      studyLoaded = true;
      ifrStudy.addEventListener('load', () => {
        const ld = document.querySelector('.loader[data-for="study"]');
        if (ld) ld.classList.add('hidden');
        if (level) goToLevel(level);
      }, {once:true});
    } else if (level) {
      goToLevel(level);
    }
  }

  function goToLevel(level) {
    try {
      const doc = ifrStudy.contentDocument;
      if (!doc) return;
      const tab = doc.querySelector(`.tab[data-level="${level}"]`);
      if (tab) tab.click();
      // also scroll to top
      try { ifrStudy.contentWindow.scrollTo(0,0); } catch(e) {}
      // Update level-bar active state
      document.querySelectorAll('.study-lvl-btn').forEach(b => {
        b.classList.toggle('active', String(b.dataset.level) === String(level));
      });
    } catch (e) {
      console.warn('goToLevel failed', e);
    }
  }
  window.__portalGoToLevel = function(level) {
    // ensure study tab active first
    const studyTab = tabs.find(t => t.dataset.tab === 'study');
    if (studyTab && !studyTab.classList.contains('active')) activate(studyTab);
    loadStudyIframe(level);
    goToLevel(level);
  };

  function activate(btn) {
    setActiveTab(btn);
    const tab = btn.dataset.tab;
    if (tab === 'home') {
      showPanel('home');
    } else if (tab === 'scorecard') {
      showPanel('scorecard');
    } else if (tab === 'exams') {
      showPanel('exams');
      loadExamsIframe();
    } else if (tab === 'study') {
      showPanel('study');
      loadStudyIframe(btn.dataset.level);
    } else if (tab === 'extras') {
      showPanel('extras');
    }
  }

  // Source preference: 'r3' (ROUND3 — recommended) or 'embedded' (legacy)
  let solSource = 'r3';
  try {
    const saved = localStorage.getItem('portal-sol-source');
    if (saved === 'embedded' || saved === 'r3') solSource = saved;
  } catch(e) {}

  // ROUND3 questions that exist as separate pages
  const R3_QIDS = new Set([
    'football-q1','football-q2','football-q3',
    'parking-q1','parking-q2','parking-q3',
    'flights-q1','flights-q2','flights-q3',
    'helpme-q1','helpme-q2','helpme-q3',
    'bank-q1','bank-q2','bank-q3',
    'logistics-q1','logistics-q2',
    'currency-q1','currency-q2',
    'willing-q1','willing-q2','willing-q3',
    'travel-q1','travel-q2','travel-q3',
  ]);

  // Navigate to a specific question — uses ROUND3 by default, falls back to embedded.
  function goToExamQuestion(qid) {
    if (solSource === 'r3' && R3_QIDS.has(qid)) {
      // Open ROUND3 page for this question via extras tab
      const extrasTab = tabs.find(t => t.dataset.tab === 'extras');
      if (extrasTab) activate(extrasTab);
      const path = `qa-bundle-r3/${qid}.html`;
      const label = `שאלה ${qid} — ROUND3`;
      openExtra(path, label);
      // After load, scroll to the improvement panel
      setTimeout(() => {
        try {
          const ifr = document.getElementById('ifr-extras');
          const doc = ifr && ifr.contentDocument;
          if (!doc) return;
          const panel = doc.querySelector('.imp-panel-compact');
          if (panel) panel.scrollIntoView({behavior:'smooth', block:'center'});
        } catch (e) {}
      }, 1200);
      return;
    }
    // Fallback to embedded view
    const examTab = tabs.find(t => t.dataset.tab === 'exams');
    if (!examTab) return;
    activate(examTab);
    const tryNav = () => {
      try {
        const doc = ifrExams.contentDocument;
        if (!doc) return setTimeout(tryNav, 80);
        const target = doc.getElementById(qid);
        if (target) {
          target.scrollIntoView({behavior:'smooth', block:'start'});
          target.classList.add('flash-target');
          setTimeout(() => target.classList.remove('flash-target'), 1800);
        } else {
          setTimeout(tryNav, 100);
        }
      } catch (e) {
        setTimeout(tryNav, 200);
      }
    };
    tryNav();
  }
  window.__portalGoToQ = goToExamQuestion; // dev helper

  // Source toggle (persists in localStorage)
  function setSolSource(src) {
    solSource = src;
    try { localStorage.setItem('portal-sol-source', src); } catch(e) {}
    document.querySelectorAll('[data-sol-toggle]').forEach(b => {
      b.classList.toggle('active', b.dataset.solToggle === src);
    });
  }
  window.__portalSetSolSource = setSolSource;
  // initialize toggle UI
  setTimeout(() => setSolSource(solSource), 0);

  tabs.forEach(btn => btn.addEventListener('click', () => activate(btn)));

  // Home cards → tab activation
  document.querySelectorAll('.home-card[data-go]').forEach(card => {
    card.addEventListener('click', () => {
      const go = card.dataset.go;
      const level = card.dataset.level || null;
      const target = tabs.find(t => t.dataset.tab === go && (!level || t.dataset.level === level));
      if (target) activate(target);
    });
  });

  // Keyboard: 1-9 swap top tabs, Esc → home, Ctrl+D → dark
  document.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    if (e.altKey) return;
    if (e.key === 'Escape') {
      const homeTab = tabs.find(t => t.dataset.tab === 'home');
      if (homeTab) activate(homeTab);
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleDark();
      }
      return;
    }
    const n = parseInt(e.key, 10);
    if (!isNaN(n) && n >= 1 && n <= 9 && tabs[n-1]) activate(tabs[n-1]);
  });

  // ============= Dark mode =============
  const darkBtn = document.getElementById('darkToggle');
  function toggleDark() {
    const isDark = document.body.classList.toggle('dark');
    if (darkBtn) darkBtn.textContent = isDark ? '☀️' : '🌙';
    try { localStorage.setItem('portal-dark', isDark ? '1' : '0'); } catch(e) {}
  }
  if (darkBtn) darkBtn.addEventListener('click', toggleDark);
  try {
    if (localStorage.getItem('portal-dark') === '1') toggleDark();
  } catch(e) {}

  // ============= Score Card =============
  function renderScoreCard() {
    const grid = document.getElementById('sc-grid');
    if (!grid) return;
    const cards = data.scoreCard || [];
    let totalBugs = 0, totalExtras = 0, totalQ = 0;

    // Replace classic grid with donut grid (visual)
    grid.classList.add('donut-grid');
    grid.classList.remove('sc-grid');

    const sevColors = { critical:'#dc2626', high:'#ea580c', medium:'#facc15', low:'#14b8a6' };
    const sevHe = { critical:'קריטי', high:'גבוה', medium:'בינוני', low:'נמוך' };

    grid.innerHTML = cards.map(exam => {
      const totalSev = ['critical','high','medium','low']
        .reduce((s,k) => s + exam.questions.reduce((ss,q)=>ss+q.sev[k],0), 0);
      const sevTotals = {};
      ['critical','high','medium','low'].forEach(k => {
        sevTotals[k] = exam.questions.reduce((s,q)=>s+q.sev[k],0);
      });
      // donut math: full circle = 360deg, all bugs distributed
      const cx = 85, cy = 85, r = 55;
      const C = 2 * Math.PI * r;
      let offset = 0;
      const arcs = ['critical','high','medium','low'].map(k => {
        const v = sevTotals[k];
        if (!v || !totalSev) return '';
        const portion = v / totalSev;
        const len = portion * C;
        const arc = `<circle class="donut-arc" data-sev="${k}" data-exam="${exam.examKey}" cx="${cx}" cy="${cy}" r="${r}" stroke="${sevColors[k]}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"></circle>`;
        offset += len;
        return arc;
      }).join('');

      const qList = exam.questions.map((q,i) => {
        totalBugs += q.bugCount;
        totalExtras += q.extrasCount;
        totalQ++;
        const minis = ['critical','high','medium','low']
          .filter(k => q.sev[k] > 0)
          .flatMap(k => Array(q.sev[k]).fill(`<span class="mini mini-${k.slice(0,4)}" title="${sevHe[k]}"></span>`))
          .join('');
        return `
          <div class="donut-q-item" data-qid="${q.qid}" tabindex="0" role="button" aria-label="פתיחת ${q.title}">
            <span class="donut-q-name">Q${i+1} ${q.title}</span>
            <span class="donut-q-bugs">${minis || '<span style="color:#16a34a;font-weight:900;font-size:11px">✓ נקי</span>'}</span>
            <span class="donut-q-pts">${q.score}</span>
          </div>
        `;
      }).join('');

      const noteHtml = exam.note ? `<div style="margin-top:6px;font-size:11px;color:#92400e;font-style:italic">ℹ ${exam.note}</div>` : '';
      const examIcons = {football:'⚽',parking:'🅿️',flights:'✈️',helpme:'🚨',bank:'🏦',logistics:'📦',currency:'💱',willing:'🤝',travel:'🌍'};
      return `
        <div class="donut-card" data-exam="${exam.examKey}">
          <div class="dc-name">${examIcons[exam.examKey]||'📝'} ${exam.name}</div>
          <div class="dc-meta">${exam.total}/100 · ${exam.questionCount} שאלות · ${totalSev} באגים</div>
          <svg class="donut-svg" viewBox="0 0 170 170">
            <circle class="donut-track" cx="85" cy="85" r="55"></circle>
            ${arcs || `<circle cx="85" cy="85" r="55" fill="none" stroke="#86efac" stroke-width="18" opacity=".55"></circle>`}
            <text class="donut-center" x="85" y="78"><tspan class="total">${totalSev}</tspan></text>
            <text class="donut-center" x="85" y="100"><tspan class="label">באגים</tspan></text>
          </svg>
          ${noteHtml}
          <div class="donut-q-list">${qList}</div>
        </div>
      `;
    }).join('');

    const statBugs = document.getElementById('sc-stat-bugs');
    const statExtras = document.getElementById('sc-stat-extras');
    const statQ = document.getElementById('sc-stat-questions');
    if (statBugs) statBugs.textContent = totalBugs;
    if (statExtras) statExtras.textContent = totalExtras;
    if (statQ) statQ.textContent = totalQ;

    // Click on donut arc → tooltip with severity details
    grid.querySelectorAll('.donut-arc').forEach(arc => {
      arc.addEventListener('click', e => {
        e.stopPropagation();
        const sev = arc.dataset.sev;
        const examKey = arc.dataset.exam;
        const exam = cards.find(x => x.examKey === examKey);
        if (!exam) return;
        const buggy = [];
        exam.questions.forEach((q,i) => {
          if (q.sev[sev] > 0) buggy.push({...q, num: i+1});
        });
        const html = `
          <h4>${exam.name} — ${sevHe[sev]}</h4>
          <p>${buggy.reduce((s,q)=>s+q.sev[sev],0)} באגים בחומרה <span class="vt-tag" style="background:${sevColors[sev]}33;color:${sevColors[sev]};border-color:${sevColors[sev]}">${sevHe[sev]}</span></p>
          <h5>בשאלות הללו</h5>
          ${buggy.map(q => `
            <div onclick="window.__portalGoToQ('${q.qid}'); window.__portalHideTooltip();" style="cursor:pointer;padding:6px 8px;background:rgba(250,204,21,.1);border-radius:6px;display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;font-size:12px">
              <span>Q${q.num} ${q.title}</span>
              <span style="color:${sevColors[sev]};font-weight:900">×${q.sev[sev]}</span>
            </div>
          `).join('')}
        `;
        showTooltip(arc, html);
      });
    });

    // Click on question item → navigate
    grid.querySelectorAll('.donut-q-item').forEach(el => {
      const handler = () => goToExamQuestion(el.dataset.qid);
      el.addEventListener('click', handler);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
    });
  }

  function labelFor(key) {
    return {critical:'קריטי', high:'גבוה', medium:'בינוני', low:'נמוך'}[key] || key;
  }

  // Inject a small style into the exam iframe to flash the target on jump
  function injectFlashStyle() {
    try {
      const doc = ifrExams.contentDocument;
      if (!doc) return false;
      if (doc.getElementById('portal-flash-style')) return true;
      const s = doc.createElement('style');
      s.id = 'portal-flash-style';
      s.textContent = `.flash-target { animation: flash-pulse 1.6s ease-out; outline: 4px solid #facc15 !important; outline-offset: 4px !important; border-radius: 12px; }
@keyframes flash-pulse { 0%,100% { box-shadow: none; } 50% { box-shadow: 0 0 0 8px rgba(250,204,21,.5); } }`;
      doc.head.appendChild(s);
      return true;
    } catch (e) { return false; }
  }
  ifrExams.addEventListener('load', () => setTimeout(injectFlashStyle, 200));

  // Render scorecard now (data is ready)
  renderScoreCard();

  // ============= Universal tooltip system =============
  const tooltipEl = document.getElementById('viz-tooltip');
  const tooltipContent = document.getElementById('vt-content');
  const tooltipClose = document.getElementById('vt-close');

  function showTooltip(target, html) {
    if (!tooltipEl) return;
    tooltipContent.innerHTML = html;
    tooltipEl.classList.add('show');
    // Make sure it's visible to measure
    tooltipEl.style.left = '0px';
    tooltipEl.style.top = '0px';
    requestAnimationFrame(() => {
      const rect = (target.getBoundingClientRect && target.getBoundingClientRect()) || target;
      const tw = tooltipEl.offsetWidth;
      const th = tooltipEl.offsetHeight;
      let x = rect.left + rect.width / 2 - tw / 2;
      let y = rect.bottom + 12;
      if (y + th > window.innerHeight - 10) y = Math.max(10, rect.top - th - 12);
      x = Math.max(10, Math.min(window.innerWidth - tw - 10, x));
      tooltipEl.style.left = x + 'px';
      tooltipEl.style.top = y + 'px';
    });
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('show');
  }

  tooltipClose && tooltipClose.addEventListener('click', hideTooltip);

  // Click anywhere outside the tooltip closes it
  document.addEventListener('click', e => {
    if (!tooltipEl || !tooltipEl.classList.contains('show')) return;
    if (tooltipEl.contains(e.target)) return;
    if (e.target.closest('[data-tip]') || e.target.closest('.viz-node') ||
        e.target.closest('.donut-arc') || e.target.closest('.donut-q-item') ||
        e.target.closest('.sev-chip') || e.target.closest('.viz-tip-trigger')) return;
    hideTooltip();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTooltip(); });

  // Expose globally for iframe code to use
  window.__portalShowTooltip = showTooltip;
  window.__portalHideTooltip = hideTooltip;

  // ============= Visual Home — Constellation =============
  function renderVisualHome() {
    const root = document.getElementById('viz-home');
    if (!root) return;
    const exams = data.scoreCard || [];
    const W = 980, H = 720;
    const cx = W / 2, cy = 290;
    const r = 230;
    const palette = {
      football:   ['#ec4899','#f97316'],
      parking:    ['#0ea5e9','#2563eb'],
      flights:    ['#14b8a6','#0891b2'],
      helpme:     ['#dc2626','#f97316'],
      bank:       ['#16a34a','#84cc16'],
      logistics:  ['#7c3aed','#a855f7'],
      currency:   ['#facc15','#f97316'],
      willing:    ['#ec4899','#a855f7'],
      travel:     ['#06b6d4','#3b82f6'],
    };
    const icons = {
      football:'⚽', parking:'🅿️', flights:'✈️',
      helpme:'🚨', bank:'🏦', logistics:'📦',
      currency:'💱', willing:'🤝', travel:'🌍',
    };

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="מפת המבחנים">
      <defs>`;
    Object.entries(palette).forEach(([k,[a,b]]) => {
      svg += `<linearGradient id="g-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient>`;
    });
    svg += `<radialGradient id="g-center" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#facc15"/><stop offset="1" stop-color="#f97316"/></radialGradient>`;
    svg += `</defs>`;

    // Orbit rings
    svg += `<circle class="viz-orbit" cx="${cx}" cy="${cy}" r="${r}"/>`;
    svg += `<circle class="viz-orbit" cx="${cx}" cy="${cy}" r="${r-90}"/>`;

    // Center "100/100" target
    svg += `<g class="viz-pulse" style="transform-origin:${cx}px ${cy}px">
      <circle cx="${cx}" cy="${cy}" r="62" fill="url(#g-center)" stroke="#000" stroke-width="3"/>
      <text x="${cx}" y="${cy-2}" text-anchor="middle" font-size="28" font-weight="900" fill="#0f172a">100</text>
      <text x="${cx}" y="${cy+22}" text-anchor="middle" font-size="13" font-weight="900" fill="#0f172a">/100 במבחן</text>
    </g>`;

    // Position 9 exams around the center
    exams.forEach((exam, i) => {
      const angle = (i / exams.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const fill = `url(#g-${exam.examKey})`;
      // Connect line to center
      svg += `<line class="viz-link" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
      // Exam node
      const totalBugs = exam.questions.reduce((s,q)=>s+q.bugCount,0);
      svg += `<g class="viz-node" data-exam="${exam.examKey}" style="color:${palette[exam.examKey][0]}; transform-origin:${x}px ${y}px">
        <circle cx="${x}" cy="${y}" r="48" fill="${fill}" stroke="#000" stroke-width="3"/>
        <text x="${x}" y="${y-6}" text-anchor="middle" font-size="26">${icons[exam.examKey]||'📝'}</text>
        <text x="${x}" y="${y+18}" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">${exam.name.split(' ')[0]}</text>
        <circle cx="${x+34}" cy="${y-34}" r="14" fill="#fff" stroke="#000" stroke-width="2"/>
        <text x="${x+34}" y="${y-30}" text-anchor="middle" font-size="11" font-weight="900" fill="#0f172a">${exam.questionCount}</text>
      </g>`;
      // Question dots around the exam (mini-circles for q1/q2/q3)
      exam.questions.forEach((q, qi) => {
        const subAngle = angle + (qi - (exam.questionCount-1)/2) * 0.18;
        const subR = 80;
        const sx = x + Math.cos(subAngle) * subR;
        const sy = y + Math.sin(subAngle) * subR;
        const sevTotal = q.bugCount;
        const ringColor = sevTotal === 0 ? '#86efac' :
                          q.sev.critical > 0 ? '#dc2626' :
                          q.sev.high > 0 ? '#ea580c' : '#facc15';
        svg += `<g class="viz-node" data-qid="${q.qid}" style="color:${ringColor}; transform-origin:${sx}px ${sy}px">
          <circle cx="${sx}" cy="${sy}" r="14" fill="#fff" stroke="${ringColor}" stroke-width="3"/>
          <text x="${sx}" y="${sy+4}" text-anchor="middle" font-size="11" font-weight="900" fill="#0f172a">Q${qi+1}</text>
        </g>`;
      });
    });

    // Title overlay
    svg += `<text x="${cx}" y="40" text-anchor="middle" font-size="26" font-weight="900" fill="currentColor">🌟 מפת המבחנים — 9 כוכבים, 25 שאלות, יעד 100</text>
      <text x="${cx}" y="${H-30}" text-anchor="middle" font-size="13" fill="currentColor" opacity=".7">לחיצה על כוכב מציגה פירוט · לחיצה על Q1/Q2/Q3 קופצת לשאלה הספציפית</text>`;
    svg += `</svg>`;

    // Legend
    const legend = `
      <div class="viz-legend">
        <span class="lg"><span class="dot" style="background:#dc2626"></span>קריטי</span>
        <span class="lg"><span class="dot" style="background:#ea580c"></span>גבוה</span>
        <span class="lg"><span class="dot" style="background:#facc15"></span>בינוני</span>
        <span class="lg"><span class="dot" style="background:#14b8a6"></span>נמוך</span>
        <span class="lg"><span class="dot" style="background:#86efac"></span>נקי</span>
      </div>
    `;
    root.innerHTML = svg + legend;

    // Wire up clicks
    root.querySelectorAll('.viz-node[data-exam]').forEach(node => {
      node.addEventListener('click', e => {
        e.stopPropagation();
        const examKey = node.dataset.exam;
        const exam = exams.find(x => x.examKey === examKey);
        if (!exam) return;
        const totalBugs = exam.questions.reduce((s,q)=>s+q.bugCount,0);
        const totalExtras = exam.questions.reduce((s,q)=>s+q.extrasCount,0);
        const html = `
          <h4>${icons[examKey]||''} ${exam.name}</h4>
          <p><span class="vt-tag">${exam.total}/100</span> <span class="vt-tag">${exam.questionCount} שאלות</span></p>
          ${exam.note ? `<p style="color:#fcd34d">ℹ ${exam.note}</p>` : ''}
          <h5>שאלות במבחן</h5>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${exam.questions.map((q,i) => `
              <div onclick="window.__portalGoToQ('${q.qid}'); window.__portalHideTooltip();" style="cursor:pointer;padding:6px 8px;background:rgba(250,204,21,.1);border-radius:6px;display:flex;justify-content:space-between;gap:8px;font-size:12px">
                <span><b>Q${i+1}</b> ${q.title}</span>
                <span style="color:#fcd34d">${q.score}נק׳</span>
              </div>`).join('')}
          </div>
          <p style="margin-top:8px"><strong>${totalBugs}</strong> באגים מתוקנים · <strong>${totalExtras}</strong> פוליש</p>
          <a class="vt-cta" onclick="window.__portalGoToQ('${exam.questions[0].qid}'); window.__portalHideTooltip();">פתח שאלה ראשונה ←</a>
        `;
        showTooltip(node.querySelector('circle'), html);
      });
    });

    root.querySelectorAll('.viz-node[data-qid]').forEach(node => {
      node.addEventListener('click', e => {
        e.stopPropagation();
        const qid = node.dataset.qid;
        let q = null;
        for (const exam of exams) {
          q = exam.questions.find(x => x.qid === qid);
          if (q) break;
        }
        if (!q) return;
        const sevList = ['critical','high','medium','low']
          .filter(k => q.sev[k] > 0)
          .map(k => `<span class="vt-tag">${({critical:'קריטי',high:'גבוה',medium:'בינוני',low:'נמוך'})[k]} ×${q.sev[k]}</span>`)
          .join('');
        const html = `
          <h4>${q.title}</h4>
          <p><span class="vt-tag">${q.score} נק׳</span></p>
          <h5>שיפורים מוטמעים</h5>
          <p>✓ ${q.bugCount} באגים מתוקנים<br>📋 ${q.missingCount} דרישות חסרות הושלמו<br>✨ ${q.extrasCount} פיצ'רים מעבר לדרישה</p>
          ${sevList ? `<h5>חומרת באגים</h5><p>${sevList}</p>` : ''}
          <a class="vt-cta" onclick="window.__portalGoToQ('${qid}'); window.__portalHideTooltip();">פתח את השאלה ←</a>
        `;
        showTooltip(node.querySelector('circle'), html);
      });
    });
  }

  renderVisualHome();

  // ============= Learning Roadmap =============
  function renderLearningRoadmap() {
    const home = document.getElementById('viz-home');
    if (!home) return;
    const steps = [
      {ico:'👵', cls:'r-grandma', num:'שלב 1', title:'רמת סבתא — הסיפור', goLevel:1},
      {ico:'🌱', cls:'r-begin',   num:'שלב 2', title:'מתחילים — בסיס', goLevel:2},
      {ico:'🔧', cls:'r-mid',     num:'שלב 3', title:'בינוניים — Hooks', goLevel:3},
      {ico:'📝', cls:'r-exam',    num:'שלב 4', title:'רמת מבחן — דרישות', goLevel:4},
      {ico:'🚀', cls:'r-expert',  num:'שלב 5', title:'מומחים — ארכיטקטורה', goLevel:5},
      {ico:'🎯', cls:'r-100',     num:'שלב 6', title:'100 במבחן — קריטי', goLevel:6},
      {ico:'📚', cls:'r-bank',    num:'שלב 7', title:'בנק תרגול', goLevel:7},
      {ico:'🐞', cls:'r-debug',   num:'שלב 8', title:'Debug Mode', goLevel:9},
      {ico:'📜', cls:'r-do',      num:'שלב 9', title:'25 שאלות מבחן', goExamFirst:true},
    ];
    const html = `
      <div class="viz-roadmap">
        <h3>🛤 מסלול למידה מומלץ — מסבתא ועד 100/100</h3>
        <div class="roadmap-track">
          ${steps.map((s,i) => `
            ${i > 0 ? '<span class="roadmap-arrow">→</span>' : ''}
            <button class="roadmap-step ${s.cls}" data-step="${i}" ${s.goLevel ? `data-level="${s.goLevel}"` : ''} ${s.goExamFirst ? 'data-exam-first="1"' : ''}>
              <span class="rs-ico">${s.ico}</span>
              <span class="rs-num">${s.num}</span>
              <span class="rs-title">${s.title}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    home.insertAdjacentHTML('beforeend', html);
    // Wire up
    home.querySelectorAll('.roadmap-step').forEach(step => {
      step.addEventListener('click', () => {
        const lvl = step.dataset.level;
        const examFirst = step.dataset.examFirst;
        if (lvl) {
          window.__portalGoToLevel(parseInt(lvl,10));
        } else if (examFirst) {
          // Open the first exam question (Football Q1)
          window.__portalGoToQ('football-q1');
        }
      });
    });
  }
  renderLearningRoadmap();

  // ============= Extras (additional materials) =============
  const extrasHub = document.getElementById('extras-hub');
  const extrasViewer = document.getElementById('extras-viewer');
  const extrasIframe = document.getElementById('ifr-extras');
  const exCurrent = document.getElementById('ex-current');
  const exOpen = document.getElementById('ex-open');
  const exBack = document.getElementById('ex-back');

  function openExtra(path, label) {
    extrasHub.classList.add('hidden');
    extrasViewer.classList.remove('hidden');
    extrasIframe.src = 'extras/' + path;
    exCurrent.textContent = label;
    exOpen.href = 'extras/' + path;
  }

  function backToHub() {
    extrasViewer.classList.add('hidden');
    extrasHub.classList.remove('hidden');
    extrasIframe.src = 'about:blank';
  }

  document.querySelectorAll('.ex-card[data-extra]').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const path = card.dataset.extra;
      const label = card.querySelector('h3').textContent;
      openExtra(path, label);
    });
  });

  if (exBack) exBack.addEventListener('click', backToHub);

  // toggle .hidden helper for extras
  const styleAdd = document.createElement('style');
  styleAdd.textContent = '.extras-pad.hidden{display:none}';
  document.head.appendChild(styleAdd);

  // For dev: expose for console
  window.__portal = { activate, goToLevel, goToExamQuestion, examsURL, studyURL };
})();
</script>
</body>
</html>
"""


if __name__ == "__main__":
    sys.exit(main())
