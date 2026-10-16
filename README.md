> **ARCHIVED 2026-10-16.** This repository is read-only. The exam it was built for (SVCollege Full-Stack, June 2026) is over; the site stays live at **https://exam-portal-peach.vercel.app** and the committed HTML is the source of truth. No further changes are planned.

# פורטל מבחן 2 — Full-Stack exam preparation portal

A static, Hebrew/RTL, single-page study dossier for the SVCollege Full-Stack exam.
Built over two days (2026-05-10 / 2026-05-11) and deployed on Vercel.

**Live:** https://exam-portal-peach.vercel.app (root rewrites to `portal.html`)

## What is in here

| Area | Content |
|---|---|
| `portal.html` | The entry point. Five tabs (home / exams / study / scorecard / extras). Embeds the exam-solutions and study documents as base64 payloads rendered into iframes. |
| `extras/qa-bundle-r3/` | Full solutions for **9 past exams x 2-3 questions = 27 questions** (Football Club, SV Parking, Flight Control, HelpMe, SV Bank, Logistics, Currency Exchange, Willing App, Travel-SV), each with bug analysis and a corrected "100/100" version. |
| `extras/solutions100/` + `solutions100/` | The 25 corrected reference solutions (React / Express / Node) as annotated HTML pages and as plain `.js` / `.jsx` source. |
| `extras/*.html` | ~36 standalone interactive study tools: practice bank (100 exercises), theory quiz (100 cards), mock-exam simulator, regex tester, validation atlas, flow canvas, last-day drill, cheat sheets, progress dashboard, print views. |
| `extras/course-portal/` | A 42-page course-summary mini-site. Four of its pages load question data from `extras/course-portal/materials/raw-data/` (48 files). That data is a one-way copy taken on 2026-05-09 from the `sv-test` (LumenPortal) repository, which is the canonical source. |
| `404.html`, `sitemap.xml`, `vercel.json` | Deployment: custom 404, sitemap, security/cache headers, `/` -> `/portal.html` rewrite. |

Pure HTML/CSS/JS. No build step, no framework, no package manager. The only external dependency is Google Fonts (Heebo). Progress is kept in `localStorage`.

## The Python scripts are HISTORICAL — do not run them

`build_portal.py`, `build_solutions_100.py` and `improvements.py` are the generators that produced the *first* version of `portal.html` and `extras/solutions100/*.html`. They are kept for provenance only:

- Their inputs lived outside the repo, on the author's machine (`/Users/tal/...`) and in `/tmp/svcollege_extract`. Those inputs are not committed, so `build_portal.py` exits immediately with "Source files not found".
- `render_markdown()` in `build_solutions_100.py` loops forever on some inputs (the loop index is not advanced on heading/list/paragraph lines), so the script hangs on the one Markdown-sourced page.
- After generation, the HTML was edited by hand in dozens of commits (dark mode, universal nav-tree, SEO/meta, link fixes). Re-running the generators would overwrite those edits and regress the site.

**The committed HTML is the source of truth.** If something needs to change, edit the HTML directly.

## Known limitations (left as-is at archive time)

- `extras/print-all-r4.html` contains 25 links to `qa-round4-grades.html`, a file that never existed in this repository (the Round-4 grade report is `extras/round4-grade-report.html`).
- The three study-summary exports (`claude-study123-full.html`, `claude-study1444-full.html`, `study-5-levels.html`) reference a `styles.css` / `app.js` that are not shipped; they render with their inline styles.
- `.git` history still contains the lesson PDFs removed early on (about 11 MB of unreachable-from-HEAD blobs). Not worth a history rewrite for an archived repo.

## Related

- `sv-test` (LumenPortal) — the adaptive-learning app whose question bank this portal copied; canonical for that data.
