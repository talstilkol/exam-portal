/**
 * Universal Navigation Tree — פורטל מבחן 2
 * Include this script on any page to get a floating nav button + collapsible site tree.
 * Current page is auto-highlighted. Sections fold/unfold on click.
 */
(function(){
'use strict';

const SITE_MAP = {
  id: "root",
  label: "פורטל מבחן",
  icon: "🏠",
  children: [
    {
      id: "interactive-tools",
      label: "כלים אינטראקטיביים",
      icon: "🛠",
      children: [
        { id: "practice-bank", label: "בנק תרגול", icon: "💪", href: "practice-bank.html", meta: "50 תרגילים" },
        { id: "simulations", label: "סימולציות", icon: "🎮", href: "simulations.html", meta: "9 סימולציות" },
        { id: "flow-canvas", label: "מפת זרימה", icon: "🗺", href: "flow-canvas.html", meta: "27 שאלות" },
        { id: "exam-master", label: "Exam Master", icon: "🏆", href: "exam-master-v3.html", meta: "20 פרקים" },
        { id: "code-browser", label: "דפדפן קוד", icon: "💻", href: "code-browser.html", meta: "27 פרויקטים" },
        { id: "file-graph", label: "File Graph", icon: "📂", href: "file-graph.html", meta: "9 מערכות" },
        { id: "sequence-diagrams", label: "Sequence Diagrams", icon: "🔄", href: "sequence-diagrams.html", meta: "12 תרשימים" }
      ]
    },
    {
      id: "knowledge",
      label: "ידע ולמידה",
      icon: "📚",
      children: [
        { id: "exam-knowledge", label: "מרכז ידע", icon: "📚", href: "exam-knowledge.html", meta: "10 נושאים" },
        { id: "exam-strategy", label: "אסטרטגיית מבחן", icon: "🎯", href: "exam-strategy.html", meta: "18 טיפים" },
        { id: "debug-walkthrough", label: "Debug צעד-אחר-צעד", icon: "🔍", href: "debug-walkthrough.html", meta: "6 שאלות" },
        { id: "data-flow", label: "Data Flow", icon: "📦", href: "data-flow.html", meta: "5 תרחישים" },
        { id: "course-map", label: "מפת קורס", icon: "🗂", href: "course-map.html", meta: "16 נושאים" },
        { id: "weakness-explainer", label: "נקודות חולשה", icon: "⚡", href: "weakness-explainer.html" }
      ]
    },
    {
      id: "cheatsheets",
      label: "Cheatsheets",
      icon: "📋",
      children: [
        { id: "react-patterns", label: "React Patterns", icon: "⚛", href: "react-patterns.html" },
        { id: "express-patterns", label: "Express Patterns", icon: "🟢", href: "express-js-patterns.html" },
        { id: "mongo-cheatsheet", label: "MongoDB Cheatsheet", icon: "🍃", href: "mongo-cheatsheet.html" },
        { id: "ts-cheatsheet", label: "TypeScript Cheatsheet", icon: "📘", href: "ts-cheatsheet.html" }
      ]
    },
    {
      id: "solutions",
      label: "פתרונות מבחנים",
      icon: "✅",
      children: [
        { id: "solutions100", label: "פתרונות 100/100", icon: "🏆", href: "solutions100/index.html", meta: "27 פתרונות" },
        { id: "qa-bundle", label: "QA Bundle — ROUND3", icon: "📘", href: "qa-bundle-r3/index.html", meta: "27 שאלות" },
        {
          id: "sol-by-exam",
          label: "לפי מבחן",
          icon: "📄",
          children: [
            { id: "football", label: "Football Club", icon: "⚽", children: [
              { id: "football-q1", label: "Q1 React (50)", href: "solutions100/football-q1.html" },
              { id: "football-q2", label: "Q2 JS (25)", href: "solutions100/football-q2.html" },
              { id: "football-q3", label: "Q3 Express (25)", href: "solutions100/football-q3.html" }
            ]},
            { id: "parking", label: "SV Parking", icon: "🅿️", children: [
              { id: "parking-q1", label: "Q1 React (50)", href: "solutions100/parking-q1.html" },
              { id: "parking-q2", label: "Q2 JS (25)", href: "solutions100/parking-q2.html" },
              { id: "parking-q3", label: "Q3 Express (25)", href: "solutions100/parking-q3.html" }
            ]},
            { id: "flights", label: "בקרת טיסות", icon: "✈️", children: [
              { id: "flights-q1", label: "Q1 React (50)", href: "solutions100/flights-q1.html" },
              { id: "flights-q2", label: "Q2 JS (25)", href: "solutions100/flights-q2.html" },
              { id: "flights-q3", label: "Q3 Express (25)", href: "solutions100/flights-q3.html" }
            ]},
            { id: "helpme", label: "HelpMe", icon: "🚨", children: [
              { id: "helpme-q1", label: "Q1 React (75)", href: "solutions100/helpme-q1.html" },
              { id: "helpme-q2", label: "Q2 JS (25)", href: "solutions100/helpme-q2.html" },
              { id: "helpme-q3", label: "Q3 Theory (25)", href: "solutions100/helpme-q3.html" }
            ]},
            { id: "bank", label: "SV Bank", icon: "🏦", children: [
              { id: "bank-q1", label: "Q1 React (65)", href: "solutions100/bank-q1.html" },
              { id: "bank-q2", label: "Q2 JS (20)", href: "solutions100/bank-q2.html" },
              { id: "bank-q3", label: "Q3 Express (15)", href: "solutions100/bank-q3.html" }
            ]},
            { id: "logistics", label: "מחסן לוגיסטי", icon: "📦", children: [
              { id: "logistics-q1", label: "Q1 React (75)", href: "solutions100/logistics-q1.html" },
              { id: "logistics-q2", label: "Q2 JS (25)", href: "solutions100/logistics-q2.html" },
              { id: "logistics-q3", label: "Q3 Express", href: "solutions100/logistics-q3.html" }
            ]},
            { id: "currency", label: "מחשבון המרה", icon: "💱", children: [
              { id: "currency-q1", label: "Q1 React (80)", href: "solutions100/currency-q1.html" },
              { id: "currency-q2", label: "Q2 JS (20)", href: "solutions100/currency-q2.html" },
              { id: "currency-q3", label: "Q3 Express", href: "solutions100/currency-q3.html" }
            ]},
            { id: "willing", label: "Willing", icon: "🤝", children: [
              { id: "willing-q1", label: "Q1 React (40)", href: "solutions100/willing-q1.html" },
              { id: "willing-q2", label: "Q2 JS (35)", href: "solutions100/willing-q2.html" },
              { id: "willing-q3", label: "Q3 Express (25)", href: "solutions100/willing-q3.html" }
            ]},
            { id: "travel", label: "Travel-SV", icon: "🧳", children: [
              { id: "travel-q1", label: "Q1 React (50)", href: "solutions100/travel-q1.html" },
              { id: "travel-q2", label: "Q2 JS (25)", href: "solutions100/travel-q2.html" },
              { id: "travel-q3", label: "Q3 Node (25)", href: "solutions100/travel-q3.html" }
            ]}
          ]
        }
      ]
    },
    {
      id: "study-materials",
      label: "חומרי לימוד",
      icon: "📖",
      children: [
        { id: "study-5-levels", label: "5 רמות לימוד", icon: "📚", href: "study-5-levels.html" },
        { id: "claude-study123", label: "Claude Study 123", icon: "🤖", href: "claude-study123-full.html" },
        { id: "claude-study1444", label: "Claude Study 1444", icon: "🤖", href: "claude-study1444-full.html" },
        { id: "combined-claude", label: "חומר משולב מלא", icon: "📜", href: "combined-claude-full.html" },
        { id: "fullstack-illustrated", label: "Full Stack מאויר", icon: "🎨", href: "fullstack-illustrated.html" },
        { id: "fullstack-colorful", label: "Full Stack צבעוני v2", icon: "🌈", href: "fullstack-colorful-illustrated.html" },
        { id: "file-tree-master", label: "עץ קבצים", icon: "🌳", href: "file-tree-master.html" },
        { id: "master-kit", label: "Master Kit", icon: "🧰", href: "master-kit-index.html" },
        { id: "homework-index", label: "שיעורי בית", icon: "📝", href: "homework-index.html" }
      ]
    },
    {
      id: "course-portal",
      label: "פורטל קורס מתקדם",
      icon: "🎓",
      children: [
        { id: "cp-dashboard", label: "Dashboard", icon: "📊", href: "course-portal/00_dashboard.html" },
        { id: "cp-theory", label: "תיאוריה מאסטר", icon: "📖", href: "course-portal/01_master_theory.html" },
        { id: "cp-missing", label: "נושאים חסרים", icon: "🔍", href: "course-portal/02_missing_topics.html" },
        { id: "cp-solutions", label: "פתרונות מבחנים", icon: "✅", href: "course-portal/03_exam_solutions.html" },
        { id: "cp-algorithms", label: "אלגוריתמים", icon: "🧮", href: "course-portal/04_algorithms.html" },
        { id: "cp-snippets", label: "Snippets", icon: "✂️", href: "course-portal/05_snippets.html" },
        { id: "cp-strategy", label: "אסטרטגיה", icon: "🎯", href: "course-portal/06_strategy.html" },
        { id: "cp-advanced", label: "נושאים מתקדמים", icon: "🚀", href: "course-portal/07_advanced_topics.html" },
        { id: "cp-flashcards", label: "Flashcards & Quiz", icon: "🃏", href: "course-portal/08_flashcards_quiz.html" },
        { id: "cp-mini-quiz", label: "Mini Quiz", icon: "❓", href: "course-portal/09_mini_quiz.html" },
        { id: "cp-tricky", label: "שאלות טריקיות", icon: "🧩", href: "course-portal/12_tricky_questions.html" },
        { id: "cp-mock-exams", label: "מבחנים לדוגמה", icon: "📝", href: "course-portal/25_mock_exams.html" },
        { id: "cp-interview", label: "חדר ראיונות", icon: "💼", href: "course-portal/32_interview_war_room.html" }
      ]
    },
    {
      id: "tracking",
      label: "מעקב וניהול",
      icon: "📊",
      children: [
        { id: "progress-dashboard", label: "דשבורד התקדמות", icon: "📊", href: "progress-dashboard.html", meta: "11 כלים" },
        { id: "master-plan", label: "Master Plan", icon: "🗺", href: "master-plan.html" },
        { id: "round4-report", label: "דוח QA Round 4", icon: "📋", href: "round4-grade-report.html" },
        { id: "print-all-r3", label: "הדפסה — Round 3", icon: "🖨", href: "print-all-r3.html" },
        { id: "print-all-r4", label: "הדפסה — Round 4", icon: "🖨", href: "print-all-r4.html" }
      ]
    }
  ]
};

// Resolve href relative to current page
function resolveHref(href) {
  if (!href) return null;
  const path = window.location.pathname;
  // If we're in a subdirectory (solutions100/, qa-bundle-r3/, course-portal/)
  if (path.includes('/solutions100/') || path.includes('/qa-bundle-r3/') || path.includes('/course-portal/')) {
    return '../' + href;
  }
  // If we're in extras/ root
  return href;
}

// Check if a node matches current page
function isCurrentPage(href) {
  if (!href) return false;
  const current = window.location.pathname;
  return current.endsWith('/' + href) || current.endsWith(href);
}

// Find path to current page in tree
function findPath(node, path) {
  if (node.href && isCurrentPage(node.href)) return [...path, node.id];
  if (node.children) {
    for (const child of node.children) {
      const found = findPath(child, [...path, node.id]);
      if (found) return found;
    }
  }
  return null;
}

// Build the tree HTML
function renderTree(node, activePath, depth) {
  const isActive = activePath && activePath.includes(node.id);
  const isCurrent = node.href && isCurrentPage(node.href);
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = isActive || depth < 1;

  let html = '';
  if (depth > 0) {
    const cls = ['nt-item'];
    if (isCurrent) cls.push('nt-current');
    if (hasChildren) cls.push('nt-branch');
    if (isActive) cls.push('nt-active');

    html += `<div class="${cls.join(' ')}" data-depth="${depth}">`;
    if (hasChildren) {
      html += `<button class="nt-toggle ${isOpen ? 'nt-open' : ''}" aria-expanded="${isOpen}">${isOpen ? '▾' : '▸'}</button>`;
    } else {
      html += `<span class="nt-spacer"></span>`;
    }
    if (node.href && !isCurrent) {
      html += `<a class="nt-link" href="${resolveHref(node.href)}">${node.icon || ''} ${node.label}</a>`;
    } else {
      html += `<span class="nt-label${isCurrent ? ' nt-here' : ''}">${node.icon || ''} ${node.label}</span>`;
    }
    if (node.meta) html += `<span class="nt-meta">${node.meta}</span>`;
    html += `</div>`;
  }

  if (hasChildren) {
    html += `<div class="nt-children${isOpen || depth === 0 ? '' : ' nt-collapsed'}">`;
    for (const child of node.children) {
      html += renderTree(child, activePath, depth + 1);
    }
    html += `</div>`;
  }

  return html;
}

// Inject styles
function injectStyles() {
  const style = document.createElement('style');
  style.id = 'nav-tree-styles';
  style.textContent = `
    #nav-tree-btn{position:fixed;bottom:20px;left:20px;z-index:99999;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border:3px solid #000;box-shadow:3px 3px 0 #000;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;transition:.15s}
    #nav-tree-btn:hover{transform:scale(1.1);box-shadow:4px 4px 0 #000}
    #nav-tree-btn.nt-active-btn{background:#0f172a}
    #nav-tree-panel{position:fixed;bottom:80px;left:20px;z-index:99998;width:340px;max-height:70vh;background:#fff;border:3px solid #000;border-radius:16px;box-shadow:8px 8px 0 rgba(0,0,0,.15);overflow:hidden;display:none;flex-direction:column;font-family:'Heebo',Arial,sans-serif;direction:rtl}
    #nav-tree-panel.nt-show{display:flex}
    .nt-header{padding:12px 16px;background:linear-gradient(135deg,#0f172a,#1e1b4b);color:#fff;font-weight:900;font-size:14px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000}
    .nt-header button{background:none;border:none;color:#fff;cursor:pointer;font-size:16px;padding:6px 10px;border-radius:4px;min-width:44px;min-height:44px}
    .nt-header button:hover{background:rgba(255,255,255,.2)}
    .nt-body{overflow-y:auto;padding:8px 0;flex:1}
    .nt-item{display:flex;align-items:center;gap:4px;padding:6px 12px;font-size:13px;line-height:1.4;min-height:44px}
    .nt-item[data-depth="1"]{padding-right:12px}
    .nt-item[data-depth="2"]{padding-right:28px}
    .nt-item[data-depth="3"]{padding-right:44px}
    .nt-item[data-depth="4"]{padding-right:60px}
    .nt-toggle{background:none;border:none;cursor:pointer;font-size:11px;color:#64748b;padding:6px 8px;border-radius:4px;min-width:32px;min-height:32px;text-align:center;flex-shrink:0}
    .nt-toggle:hover{background:#f1f5f9;color:#0f172a}
    .nt-spacer{width:20px;flex-shrink:0}
    .nt-link{color:#1e40af;text-decoration:none;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nt-link:hover{color:#7c3aed;text-decoration:underline}
    .nt-label{font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nt-here{background:#dcfce7;padding:2px 8px;border-radius:6px;border:1.5px solid #16a34a;color:#166534}
    .nt-meta{font-size:10px;color:#64748b;font-weight:600;margin-right:auto;white-space:nowrap}
    .nt-active>.nt-label,.nt-active>.nt-link{color:#7c3aed}
    .nt-children{transition:none}
    .nt-collapsed{display:none}
    .nt-branch{cursor:default}
    .nt-current{background:#f0fdf4;border-radius:6px;margin:1px 8px}
    .nt-breadcrumb{padding:6px 12px;font-size:11px;color:#64748b;font-weight:600;border-top:1.5px solid #e2e8f0;background:#f8fafc;display:flex;gap:4px;flex-wrap:wrap}
    .nt-breadcrumb span{color:#7c3aed}
    @media(prefers-color-scheme:dark){
      #nav-tree-panel{background:#1e293b;border-color:#334155}
      .nt-label{color:#e2e8f0}
      .nt-link{color:#93c5fd}
      .nt-link:hover{color:#c4b5fd}
      .nt-here{background:#1a2e1a;border-color:#16a34a;color:#86efac}
      .nt-toggle{color:#94a3b8}
      .nt-toggle:hover{background:#334155;color:#e2e8f0}
      .nt-meta{color:#94a3b8}
      .nt-breadcrumb{background:#0f172a;border-color:#334155;color:#94a3b8}
      .nt-current{background:#1a2e1a}
    }
    @media(max-width:500px){
      #nav-tree-panel{left:8px;right:8px;width:auto;bottom:72px;max-height:60vh}
    }
  `;
  document.head.appendChild(style);
}

// Build and inject the nav tree
function init() {
  // Don't inject inside portal.html (it has its own nav)
  if (window.location.pathname.endsWith('/portal.html') || window.location.pathname === '/') return;

  injectStyles();

  const activePath = findPath(SITE_MAP, []);

  // Build breadcrumb
  let breadcrumb = '';
  if (activePath && activePath.length > 1) {
    const crumbs = [];
    let node = SITE_MAP;
    for (let i = 1; i < activePath.length; i++) {
      const child = node.children && node.children.find(c => c.id === activePath[i]);
      if (child) { crumbs.push((child.icon || '') + ' ' + child.label); node = child; }
    }
    breadcrumb = crumbs.map(c => `<span>${c}</span>`).join(' › ');
  }

  // Create button
  const btn = document.createElement('button');
  btn.id = 'nav-tree-btn';
  btn.innerHTML = '🗺';
  btn.title = 'עץ ניווט';
  btn.setAttribute('aria-label', 'פתח עץ ניווט');
  document.body.appendChild(btn);

  // Create panel
  const panel = document.createElement('div');
  panel.id = 'nav-tree-panel';
  panel.innerHTML = `
    <div class="nt-header">
      <span>🗺 עץ ניווט</span>
      <div>
        <button class="nt-expand-all" title="פתח הכל">⊞</button>
        <button class="nt-collapse-all" title="סגור הכל">⊟</button>
        <button class="nt-close" title="סגור">✕</button>
      </div>
    </div>
    ${breadcrumb ? `<div class="nt-breadcrumb">${breadcrumb}</div>` : ''}
    <div class="nt-body">${renderTree(SITE_MAP, activePath, 0)}</div>
  `;
  document.body.appendChild(panel);

  // Toggle panel
  btn.addEventListener('click', () => {
    const showing = panel.classList.toggle('nt-show');
    btn.classList.toggle('nt-active-btn', showing);
    btn.innerHTML = showing ? '✕' : '🗺';
  });

  // Close button
  panel.querySelector('.nt-close').addEventListener('click', () => {
    panel.classList.remove('nt-show');
    btn.classList.remove('nt-active-btn');
    btn.innerHTML = '🗺';
  });

  // Fold/unfold toggles
  panel.addEventListener('click', (e) => {
    const toggle = e.target.closest('.nt-toggle');
    if (!toggle) return;
    const item = toggle.closest('.nt-item');
    const children = item.nextElementSibling;
    if (!children || !children.classList.contains('nt-children')) return;
    const isOpen = !children.classList.contains('nt-collapsed');
    children.classList.toggle('nt-collapsed', isOpen);
    toggle.textContent = isOpen ? '▸' : '▾';
    toggle.classList.toggle('nt-open', !isOpen);
    toggle.setAttribute('aria-expanded', !isOpen);
  });

  // Expand all / Collapse all
  panel.querySelector('.nt-expand-all').addEventListener('click', () => {
    panel.querySelectorAll('.nt-children').forEach(c => c.classList.remove('nt-collapsed'));
    panel.querySelectorAll('.nt-toggle').forEach(t => { t.textContent = '▾'; t.classList.add('nt-open'); t.setAttribute('aria-expanded','true'); });
  });
  panel.querySelector('.nt-collapse-all').addEventListener('click', () => {
    panel.querySelectorAll('.nt-children').forEach(c => c.classList.add('nt-collapsed'));
    panel.querySelectorAll('.nt-toggle').forEach(t => { t.textContent = '▸'; t.classList.remove('nt-open'); t.setAttribute('aria-expanded','false'); });
  });

  // Scroll current into view
  setTimeout(() => {
    const current = panel.querySelector('.nt-current');
    if (current) current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 100);

  // ESC closes panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('nt-show')) {
      panel.classList.remove('nt-show');
      btn.classList.remove('nt-active-btn');
      btn.innerHTML = '🗺';
    }
  });

  // --- Universal Footer ---
  injectUniversalFooter();
}

function injectUniversalFooter() {
  const existing = document.querySelector('footer');
  if (existing) existing.remove();

  const footerLinks = [
    { href: 'practice-bank.html', icon: '💪', label: 'בנק תרגול' },
    { href: 'simulations.html', icon: '🎮', label: 'סימולציות' },
    { href: 'flow-canvas.html', icon: '🗺', label: 'Flow Canvas' },
    { href: 'code-browser.html', icon: '💻', label: 'קוד מקור' },
    { href: 'file-graph.html', icon: '📂', label: 'File Graph' },
    { href: 'sequence-diagrams.html', icon: '🔄', label: 'Sequence' },
    { href: 'exam-knowledge.html', icon: '📚', label: 'מרכז ידע' },
    { href: 'exam-strategy.html', icon: '🎯', label: 'אסטרטגיה' },
    { href: 'debug-walkthrough.html', icon: '🔍', label: 'Debug' },
    { href: 'data-flow.html', icon: '📦', label: 'Data Flow' },
    { href: 'course-map.html', icon: '🗂', label: 'Course Map' },
    { href: 'progress-dashboard.html', icon: '📊', label: 'דשבורד' }
  ];

  const footer = document.createElement('footer');
  footer.id = 'universal-footer';

  const path = window.location.pathname;
  const prefix = (path.includes('/solutions100/') || path.includes('/qa-bundle-r3/') || path.includes('/course-portal/')) ? '../' : '';
  const currentFile = path.split('/').pop();

  let linksHtml = footerLinks
    .filter(l => l.href !== currentFile)
    .map(l => `<a href="${prefix}${l.href}">${l.icon} ${l.label}</a>`)
    .join('');

  footer.innerHTML = `<strong>🔗 כלים נוספים:</strong>${linksHtml}`;
  document.body.appendChild(footer);

  const footerStyle = document.createElement('style');
  footerStyle.textContent = `
    #universal-footer{border-top:3px solid #000;padding:16px 24px;background:#fff;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:center;font-family:'Heebo',Arial,sans-serif}
    #universal-footer strong{font-size:14px}
    #universal-footer a{color:#7c3aed;font-weight:700;text-decoration:none;font-size:13px;white-space:nowrap}
    #universal-footer a:hover{text-decoration:underline;color:#5b21b6}
    @media(prefers-color-scheme:dark){#universal-footer{background:#1e293b;border-color:#7c3aed;border-top:3px solid #7c3aed}#universal-footer strong{color:#f1f5f9}#universal-footer a{color:#a78bfa}#universal-footer a:hover{color:#c4b5fd}}
    @media print{#universal-footer{display:none}}
  `;
  document.head.appendChild(footerStyle);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
