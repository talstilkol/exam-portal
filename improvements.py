"""
improvements.py — per-question improvement data for Portal-מבחן-2.

Each entry is keyed by the section id (e.g. 'football-q1') and provides:
  - title:       short improvement title
  - score:       point value (informational)
  - bugs:        list of {desc, severity, before, after} for highlighted code fixes
  - full_fix:    full corrected code snippet (optional) — adds a new annotated-code block
  - missing:     list of requirements not implemented in original
  - extras:      list of "beyond spec" features added (a11y, polish)

The build_portal.py script injects a styled panel into each section using these.
"""

# When `replace` flag is True, the patch FULLY REPLACES the existing
# annotated-code with the corrected file. Otherwise, only the bug list and
# improvement panel are added.

IMPROVEMENTS = {

    # ============================================================
    # FOOTBALL CLUB (מבחן אימון)
    # ============================================================

    "football-q1": {
        "title": "Football Club — תיקוני ציון 100",
        "score": 50,
        "bugs": [
            {
                "desc": "Login alert מציג <code>&amp;#x27;</code> כטקסט גולמי במקום אפוסטרוף; וגם חסרה התחילית <code>username</code> שהדרישה מציינת",
                "severity": "critical",
                "before": 'alert(`${form.username} doesn&#x27;t exist or the password doesn&#x27;t match`);',
                "after": 'alert(`username ${form.username} doesn\\\'t exist or the password doesn\\\'t match`);',
            },
            {
                "desc": "Register: השאלה דורשת <strong>הצגת שגיאה מעל כל אינפוט בנפרד</strong> וגם <strong>ניקוי הכיתוב כשהמשתמש מקליד</strong> — הקוד הקיים משתמש ב־alert יחיד",
                "severity": "critical",
                "before": "function submit() {\n  const err = error();\n  if (err) return alert(err);\n  ...\n}",
                "after": "// פתרון מלא — ראו 'הקובץ המתוקן' למטה",
            },
            {
                "desc": "Register: הכפתור הוא 'Register' אבל הקוד מציג טקסט פלייסהולדר 'username/teamName/password/confirm' — בעוד שהדרישה והתמונה מראות שמות שדות תקינים: <code>username, Team name, Password, Confirm password</code>",
                "severity": "medium",
                "before": "{Object.keys(form).map(key => <input ... placeholder={key} ... />)}",
                "after": "// אינפוטים נפרדים עם placeholder + label תקינים",
            },
            {
                "desc": "Team page: הדרישה אומרת ברירת מחדל היא <strong>showAll=false</strong> (רק שחקנים בהרכב), והכפתור מתחלף בהתאם — הקוד הקיים תקין, אבל הכפתור צריך לעדכן NavBar עקבי.",
                "severity": "low",
                "before": "// כפתור עובד, אבל אין aria-label",
                "after": "<button aria-label='הצגת כל השחקנים / רק הרכב' onClick={...}>...</button>",
            },
            {
                "desc": "PlayerForm: בעת ניווט מעמוד Team עם clicked-player, הערכים אמורים להיטען ב־<code>edit/:playerId</code> route — בקוד הקיים המסלול קיים אבל אין fallback לכישלון",
                "severity": "low",
                "before": "// אין הודעה אם playerId לא נמצא",
                "after": "if (!initial.id) navigate(`/team/${teamName}`); // חזרה אם השחקן לא נמצא",
            },
        ],
        "missing": [
            "ניקוי שגיאת השדה כשהמשתמש מקליד (ניקוי key-by-key ב־onChange)",
            "ולידציה חזותית מעל כל אינפוט (border-color: red, +error-text מתחת)",
            "Persisted users — הרשמה כרגע לא נשמרת ב־localStorage; בריענון דף — נמחק",
            "כותרת <code>&lt;title&gt;</code> לא משתנה לפי הדף (a11y/SEO)",
            "כפתור 'Show All Players' מציג טקסט שגוי עם `Show All Players` במקום הטקסט המדויק לפי הדרישה",
        ],
        "extras": [
            "aria-label לכל כפתור ניווט",
            "Responsive layout עם CSS Grid",
            "Focus ring ברור עבור keyboard navigation",
            "Optimistic UI: alert מוצג רק אחרי שמירה מוצלחת",
            "Form persists in URL state (לחיצת back מחזירה לאותם ערכים)",
        ],
    },

    "football-q2": {
        "title": "JS — סכום לפי אורך מספר",
        "score": 25,
        "bugs": [
            {
                "desc": "אין טיפול במקרה של <strong>ערך שאינו מספר</strong> — הדרישה אומרת 'יש לזרוק שגיאה רלוונטית'",
                "severity": "critical",
                "before": "// אין throw אם value !== Number",
                "after": 'if (typeof v !== "number" || isNaN(v)) throw new TypeError(`expected number, got ${typeof v}: ${v}`);',
            },
            {
                "desc": "מספרים שליליים — האורך מחושב על ה־string כולל '-' או על המספר ללא '-'? צריך החלטה מודעת",
                "severity": "medium",
                "before": "String(num).length // -42 → '−42'.length = 3",
                "after": "String(Math.abs(num)).length // -42 → '42'.length = 2 (התעלמות מסימן)",
            },
            {
                "desc": "<code>num=0</code> נחשב לאורך 1, אבל יש מקרה קצה של <code>0</code> חיובי vs <code>-0</code>",
                "severity": "low",
                "before": "// String(0).length = 1, String(-0).length = 2",
                "after": "// השתמש Math.abs קודם — 0 ו-0- שווים",
            },
        ],
        "missing": [
            "documentation/JSDoc על ה־input/output",
            "unit tests של מקרי קצה: [], [0], [-1, 1], [1.5]",
        ],
        "extras": [
            "TypeScript signature אופציונלית לשירותי safety",
            "הוספת `module.exports` ל־Node compatibility",
        ],
    },

    "football-q3": {
        "title": "Express — שרת משחקי מחשב",
        "score": 25,
        "bugs": [
            {
                "desc": "בקשת POST של פילטרים — לפי הדרישה: 'לא יותר מ־3 פילטרים בפעם, וכל אחד יחזיר את משחקי המחשב המתאימים'. הפילטרים: שנה (≥yearMin), שם (כולל substring), מחיר (≤priceMax). הקוד הקיים לא תמיד מטפל ב־3 ביחד.",
                "severity": "critical",
                "before": "// AND של פילטרים נפרדים, אבל לא תמיד מאוחד",
                "after": "const filtered = games.filter(g =>\n  (!filters.yearMin || g.releaseYear >= filters.yearMin) &&\n  (!filters.name    || g.name.toLowerCase().includes(filters.name.toLowerCase())) &&\n  (!filters.priceMax|| g.price <= filters.priceMax)\n);",
            },
            {
                "desc": "אין validation על body של POST /add (name, description, releaseYear, price)",
                "severity": "high",
                "before": "// app.post('/add', (req,res) => { games.push(req.body); res.send(...) }) — בלי בדיקה",
                "after": "if (!req.body.name || typeof req.body.releaseYear !== 'number') return res.status(400).json({error:'invalid body'});",
            },
            {
                "desc": "שגיאות לא מטופלות — צריך res.status(500) עם try/catch גלובלי",
                "severity": "medium",
                "before": "// אין error middleware",
                "after": "app.use((err, req, res, next) => { console.error(err); res.status(500).json({error:'server error'}); });",
            },
        ],
        "missing": [
            "express.json() middleware — חובה ל־POST",
            "DELETE endpoint (השאלה לא דרשה אבל מומלץ)",
            "validation מורכב על price>=0, year סביר",
        ],
        "extras": [
            "morgan logger ל־request logging",
            "ROUTE: GET /games/:id — קבלת משחק יחיד",
        ],
    },

    # ============================================================
    # SV PARKING (מבחן חדש 2023)
    # ============================================================

    "parking-q1": {
        "title": "SV Parking — אפליקציית חניה",
        "score": 50,
        "bugs": [
            {
                "desc": "הדרישה קובעת מחירים ספציפיים: <strong>תל אביב 150 ₪, נתניה 100 ₪, רחובות 50 ₪</strong> — לוודא שזה במחיר המוצג למשתמש בעמוד Active Parking ובעמוד History",
                "severity": "critical",
                "before": "const PRICES = { 'Tel Aviv': 100, ... } // ערך לא נכון",
                "after": "const PRICES = { 'Tel Aviv': 150, 'Netanya': 100, 'Rehovot': 50 };",
            },
            {
                "desc": "Active Parking: הדרישה אומרת שניתן ללחוץ Pay רק <strong>אחרי</strong> שהחנייה החלה (ערך ב־state) — אין לאפשר Pay על חניה לא־קיימת",
                "severity": "high",
                "before": "// כפתור Pay מאופשר תמיד",
                "after": "<button disabled={!activeParking} onClick={pay}>Pay</button>",
            },
            {
                "desc": "Choose Parking: הדרישה אומרת שיש למלא בחירה (<strong>required</strong>) של רכב ועיר — לפני start parking",
                "severity": "medium",
                "before": "// start parking בלי validation",
                "after": "if (!selectedCar || !selectedCity) return alert('Please choose car and city');",
            },
            {
                "desc": "History: הדרישה אומרת להציג רק חניות <strong>שהושלמו</strong> (paid: true) — הקוד הקיים מציג את הכל",
                "severity": "high",
                "before": "history.map(p => ...) // כל החניות",
                "after": "history.filter(p => p.paid).map(p => ...) // רק ששולמו",
            },
        ],
        "missing": [
            "כפתור 'Logout' שמנקה את ה־session",
            "ניווט בכותרת — שם המשתמש המחובר",
            "אנימציה של 'Active' פולסת ב־Active Parking",
        ],
        "extras": [
            "localStorage ל־persistent session",
            "Real-time tick של דקות-חניה",
            "סינון History לפי תאריך/עיר",
        ],
    },

    "parking-q2": {
        "title": "JS — רצפים שסכומם N",
        "score": 25,
        "bugs": [
            {
                "desc": "הדרישה אומרת להחזיר את כל הרצפים <strong>הרציפים</strong> (consecutive) שסכומם N — לא תתי-קבוצות שרירותיות",
                "severity": "critical",
                "before": "// אם הקוד מחזיר combinations במקום windows רציפים",
                "after": "// sliding window: for(let i=0; i<arr.length; i++) { let s=0; for(let j=i; j<arr.length; j++) { s+=arr[j]; if (s===n) result.push(arr.slice(i,j+1)); } }",
            },
            {
                "desc": "מספרים שליליים — sliding window אינו עובד אם המערך מכיל גם שליליים. צריך גישה brute-force O(n²)",
                "severity": "high",
                "before": "// two-pointer לא עובד עם שליליים",
                "after": "// brute-force O(n²) עם prefix sum — תקין לכל סוגי המספרים",
            },
        ],
        "missing": [
            "טיפול ב־n=0 (רצפים עם סכום אפס — קיימים?)",
            "מערך ריק — return []",
            "מקרי קצה: כל המערך = N",
        ],
        "extras": [
            "החזרה גם של אינדקסים [start, end] בנוסף לרצף עצמו",
            "performance — early-exit כש־prefix sum > n*2 (אם רק חיוביים)",
        ],
    },

    "parking-q3": {
        "title": "Express + MongoDB — שרת מורים",
        "score": 25,
        "bugs": [
            {
                "desc": "POST /low-salary: הדרישה אומרת לקבל minSalary ב־body ולהחזיר רק מורים עם שכר <strong>נמוך מ-minSalary</strong>",
                "severity": "critical",
                "before": "// תנאי פילטר לא תואם לדרישה",
                "after": "const teachers = await Teacher.find({ salary: { $lt: req.body.minSalary } });",
            },
            {
                "desc": "POST /add-or-update: הדרישה אומרת — אם המורה <strong>קיים</strong> (לפי ID), עדכן; אחרת צור חדש. צריך upsert עם findOneAndUpdate",
                "severity": "critical",
                "before": "// כתיבת if-else ידנית עם find ואז update/create",
                "after": "await Teacher.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });",
            },
        ],
        "missing": [
            "validation על body (id, name, salary)",
            "טיפול בשגיאת חיבור ל־MongoDB (try/catch סביב mongoose.connect)",
        ],
        "extras": [
            "Index על teacher.id ל־performance",
            "Mongoose schema עם validators (min/max salary)",
        ],
    },

    # ============================================================
    # FLIGHTS (מבחן טיסות)
    # ============================================================

    "flights-q1": {
        "title": "Flight Control — בקרת טיסות",
        "score": 50,
        "bugs": [
            {
                "desc": "validations של מספרי טיסה (regex), קודי שדה תעופה (3 אותיות גדולות), אם חסר — הציון יורד",
                "severity": "high",
                "before": "// אין validation או חלקי",
                "after": "if (!/^[A-Z]{2}\\d{3,4}$/.test(flightNum)) return setError('Flight number invalid');",
            },
            {
                "desc": "Status update: הדרישה אומרת <strong>אם המשתמש חוזר על אותו status</strong> אין הצגת alert מיותר",
                "severity": "medium",
                "before": "alert(`Status updated to ${newStatus}`);",
                "after": "if (newStatus === oldStatus) return; alert(...);",
            },
        ],
        "missing": [
            "סינון לפי status (planned/landed/cancelled)",
            "real-time update של 'minutes to landing'",
        ],
        "extras": [
            "חיווי צבעוני לפי status",
            "Search bar עם debounce",
        ],
    },

    "flights-q2": {
        "title": "JS — ספירת מספרים במטריצה",
        "score": 25,
        "bugs": [
            {
                "desc": "non-numeric values במטריצה — צריך להתעלם מהם או לזרוק שגיאה (לפי הדרישה)",
                "severity": "high",
                "before": "matrix.flat().filter(x => x === target).length",
                "after": "if (matrix.flat().some(x => typeof x !== 'number')) throw new TypeError('non-numeric value'); return matrix.flat().filter(x => x === target).length;",
            },
        ],
        "missing": [
            "מטריצה ריקה / שורה ריקה",
            "בדיקה שכל השורות באותו אורך (rectangular)",
        ],
        "extras": [
            "החזרת מיקומי {row,col} בנוסף לספירה",
        ],
    },

    "flights-q3": {
        "title": "Server — DB סטודנטים",
        "score": 25,
        "bugs": [
            {
                "desc": "validation על body (id ייחודי, name, age >= 18)",
                "severity": "high",
                "before": "// אין validation",
                "after": "if (!req.body.id || students.find(s => s.id === req.body.id)) return res.status(400).json({error:'invalid or duplicate id'});",
            },
        ],
        "missing": [
            "סינון לפי GPA / שנה",
            "DELETE endpoint",
        ],
        "extras": [
            "pagination עם ?page=&limit=",
        ],
    },

    # ============================================================
    # HELPME (מועד א פולסטאק)
    # ============================================================

    "helpme-q1": {
        "title": "HelpMe — אפליקציית חירום",
        "score": 75,
        "bugs": [
            {
                "desc": "מסך ביטול: הדרישה אומרת <strong>3 ניסיונות סיסמה כפולה</strong> ואז <strong>נעילה</strong>. הקוד צריך state <code>attempts</code> + <code>locked</code>; אחרי 3 כשלונות locked=true ולא ניתן לנסות יותר",
                "severity": "critical",
                "before": "const [attempts, setAttempts] = useState(0); // אין locked state",
                "after": "const [locked, setLocked] = useState(false);\nfunction tryCancel(pwd) {\n  if (locked) return;\n  if (pwd === user.password && pwd === user.password) {\n    cancel(); return;\n  }\n  if (attempts + 1 >= 3) { setLocked(true); alert('Locked - too many attempts'); }\n  else { setAttempts(a => a+1); alert(`Wrong - ${3-attempts-1} left`); }\n}",
            },
            {
                "desc": "מסך הרשמה רק בפעם הראשונה — Persistence ב־localStorage חיוני",
                "severity": "critical",
                "before": "// אין persist — בריענון דף נחזור למסך הרשמה",
                "after": "useEffect(() => { localStorage.setItem('user', JSON.stringify(user)); }, [user]);\nconst [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);",
            },
            {
                "desc": "Validations: שם ≥ 4 תווים <strong>ללא ספרות כלל</strong>; סיסמה אורך 8 + לפחות אות אחת + ספרה אחת",
                "severity": "high",
                "before": "// validation חסר/חלקי",
                "after": "function validUser(name, pwd) {\n  if (name.length < 4 || /\\d/.test(name)) return 'Name: 4+ chars, no digits';\n  if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd) || !/\\d/.test(pwd)) return 'Password: 8+ with letter and digit';\n  return null;\n}",
            },
            {
                "desc": "כפתור 'הצילו' — אדום במרכז המסך, גודל גדול. צריך להיות אקסטרא בולט",
                "severity": "medium",
                "before": "// כפתור רגיל",
                "after": ".help-btn { background: #dc2626; color: white; font-size: 28px; padding: 30px 60px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(220,38,38,.3); animation: pulse 1.2s infinite; }",
            },
        ],
        "missing": [
            "תפריט מוקדים (מד״א/משטרה/מכבי אש) — שמירת הבחירה ב־state",
            "מסך הצלה — תצוגת פרטי המשתמש כדי שירותי החירום ידעו את מי לחפש",
            "ביטול — סיסמה כפולה (אינפוט סיסמה + סיסמה לאישור) שאומתת מילולית זה לזה",
        ],
        "extras": [
            "Vibration API: navigator.vibrate(...) ב־לחיצה על הצילו (פידבק פיזי)",
            "Geolocation: שליחת מיקום למוקד החירום הנבחר",
            "Sound effect חירום קצר",
            "Dark theme אוטומטי בלילה (prefers-color-scheme)",
        ],
    },

    "helpme-q2": {
        "title": "JS — זיהוי סוג סדרה",
        "score": 25,
        "bugs": [
            {
                "desc": "הדרישה אומרת לזהות 4 סוגים: <strong>חשבונית</strong>, <strong>הנדסית</strong>, <strong>פיבונאצ׳י</strong>, <strong>אחרת</strong>. בדיקת פיבונאצ׳י דורשת a[i] = a[i-1] + a[i-2]",
                "severity": "critical",
                "before": "// בדיקה חלקית או חסרה של פיבונאצ׳י",
                "after": "function isFib(a) {\n  for (let i = 2; i < a.length; i++) if (a[i] !== a[i-1] + a[i-2]) return false;\n  return true;\n}",
            },
            {
                "desc": "הסדר: בדיקה <strong>חשבונית קודם</strong>, אחרי <strong>הנדסית</strong>, אחרי <strong>פיבונאצ׳י</strong>, אחרת — 'אחרת'",
                "severity": "high",
                "before": "// סדר בדיקה לא נכון",
                "after": "if (isArith(a)) return 'arithmetic';\nif (isGeom(a)) return 'geometric';\nif (isFib(a))   return 'fibonacci';\nreturn 'other';",
            },
            {
                "desc": "סדרה הנדסית עם 0 — חלוקה ב־0! צריך guard",
                "severity": "high",
                "before": "a[i+1] / a[i] // NaN/Infinity if a[i]=0",
                "after": "if (a[i] === 0) return false; // הנדסית עם 0 לא תקינה",
            },
        ],
        "missing": [
            "טיפול במערך באורך < 3 (אין מספיק מידע)",
            "מספרים non-finite (Infinity, NaN)",
        ],
        "extras": [
            "הסקת ההפרש/יחס ההתחלתי וההחזרתו ב־objct מורחב",
        ],
    },

    "helpme-q3": {
        "title": "תאוריה — HTTP, MongoDB, React, functions",
        "score": 25,
        "bugs": [
            {
                "desc": "GET vs POST: התשובה צריכה לכלול <strong>idempotency</strong>, <strong>body in POST</strong>, <strong>cacheable GET</strong>, <strong>visibility ב־URL</strong>",
                "severity": "high",
                "before": "// תשובה חסרה הסבר על idempotency",
                "after": "GET: לא משנה state, idempotent (מותר לקאשר), פרמטרים ב־URL; POST: יוצר/משנה state, body חובה, לא נשמר ב־cache.",
            },
            {
                "desc": "MongoDB יתרונות: <strong>schemaless flexibility</strong>, <strong>horizontal scaling</strong>, <strong>JSON-native</strong>, <strong>aggregation pipeline</strong>. חסרונות: <strong>אין joins חזקים</strong>, <strong>אין transactions ACID טהורות לפני 4.0</strong>",
                "severity": "high",
                "before": "// תשובה כללית מדי",
                "after": "ראו פירוט בלוח השוואה למטה",
            },
            {
                "desc": "function vs arrow: <strong>this binding</strong> (function: dynamic, arrow: lexical), <strong>arguments object</strong> (יש ב־function, אין ב־arrow), <strong>hoisting</strong>, <strong>שימוש כ־method/constructor</strong>",
                "severity": "high",
                "before": "// תשובה חסרה this binding",
                "after": "function: this נקבע בזמן ריצה לפי איך נקראת. arrow: this יורש מהסקופ הלקסיקלי שמוגדר. + arrow אינו constructor.",
            },
            {
                "desc": "פונקציה רקורסיבית: הסבר <strong>base case</strong>, <strong>recursive case</strong>, <strong>stack overflow risk</strong>, דוגמה (factorial/fibonacci)",
                "severity": "medium",
                "before": "// הסבר חלקי",
                "after": "פונקציה שקוראת לעצמה. חייבת base case (תנאי עצירה) ו־recursive case (קריאה עם input קטן יותר). דוגמה: factorial(0) = 1; factorial(n) = n * factorial(n-1).",
            },
        ],
        "missing": [
            "PUT vs PATCH (PUT: full replacement, PATCH: partial update)",
            "DELETE — idempotent",
        ],
        "extras": [
            "טבלת השוואה ויזואלית של HTTP methods",
        ],
    },

    # ============================================================
    # SV BANK (מועד ב פולסטאק)
    # ============================================================

    "bank-q1": {
        "title": "SV Bank — ניהול בנק",
        "score": 65,
        "bugs": [
            {
                "desc": "הפקדה/משיכה: ולידציה — <strong>amount &gt; 0</strong>, <strong>insufficient funds</strong>",
                "severity": "critical",
                "before": "// אין בדיקת insufficient",
                "after": "if (amount <= 0) return alert('Amount must be positive');\nif (type === 'withdraw' && amount > balance) return alert('Insufficient funds');",
            },
            {
                "desc": "העברה בין חשבונות: בדיקה ש־source !== target ושני החשבונות קיימים",
                "severity": "high",
                "before": "// אין בדיקה",
                "after": "if (sourceId === targetId) return alert('Cannot transfer to same account');",
            },
        ],
        "missing": [
            "היסטוריית פעולות (timestamp, type, amount, balance after)",
            "סינון/חיפוש בהיסטוריה",
        ],
        "extras": [
            "Export ל־CSV של ההיסטוריה",
            "Confirmation modal לפני העברה גדולה (>10000)",
        ],
    },

    "bank-q2": {
        "title": "JS — מיון ספרות ללא sort",
        "score": 20,
        "bugs": [
            {
                "desc": "מיון ידני: bubble sort הוא O(n²) — סביר לתרגיל. selection / insertion גם בסדר.",
                "severity": "low",
                "before": "// אם השתמשת ב־sort() — הניקוד יורד",
                "after": "// bubble sort:\nfor (let i = 0; i < arr.length; i++) {\n  for (let j = 0; j < arr.length - i - 1; j++) {\n    if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];\n  }\n}",
            },
            {
                "desc": "האם המיון יציב? (stable) — אם הדרישה אומרת לשמור על סדר יחסי בין שווים, bubble/insertion יציבים",
                "severity": "low",
                "before": "// selection sort אינו stable",
                "after": "// השתמש ב־insertion sort עבור stability",
            },
        ],
        "missing": [
            "טיפול ב־מערך ריק / מערך באורך 1 (אין מה למיין)",
        ],
        "extras": [
            "אופטימיזציה: early exit אם לא בוצע swap בסבב שלם",
        ],
    },

    "bank-q3": {
        "title": "Express — שמירת טקסט לקובץ",
        "score": 15,
        "bugs": [
            {
                "desc": "השאלה דורשת POST שמקבל text ושומר ל־file.txt — חובה fs.appendFile (לא writeFile, כי זה ידחק הקודם)",
                "severity": "critical",
                "before": "fs.writeFile('file.txt', text, ...) // דריסה!",
                "after": "fs.appendFile('file.txt', text + '\\n', err => err ? res.status(500).json({err:'fs error'}) : res.json({ok:true}));",
            },
            {
                "desc": "אין validation על body.text",
                "severity": "high",
                "before": "// res.json(...) ללא בדיקה",
                "after": "if (!req.body.text || typeof req.body.text !== 'string') return res.status(400).json({error:'text required'});",
            },
        ],
        "missing": [
            "GET endpoint לקריאת התוכן",
            "טיפול בקובץ שלא קיים (ENOENT)",
        ],
        "extras": [
            "Stream במקום load-all — לקבצים גדולים",
            "Rotation אוטומטי של הקובץ אחרי X MB",
        ],
    },

    # ============================================================
    # LOGISTICS (מבחן מחסן לוגיסטי) — 2 שאלות בלבד
    # ============================================================

    "logistics-q1": {
        "title": "Logistics Management — ניהול מחסן",
        "score": 75,
        "bugs": [
            {
                "desc": "Sign up: validation על מספר עובד (5 ספרות בלבד) — שגיאה: <code>the number must be with 5 digits</code> מתחת לשדה באדום",
                "severity": "critical",
                "before": "// ולידציה לא תואמת",
                "after": "if (!/^\\d{5}$/.test(num)) setErrors(e => ({...e, num: 'the number must be with 5 digits'}));",
            },
            {
                "desc": "Sign up: validation שם — <strong>אותיות בלבד עם רווח אחד לפחות, מינימום 4 תווים ללא הרווח</strong>",
                "severity": "critical",
                "before": "// ולידציה חלקית",
                "after": "const nameNoSpace = name.replace(/\\s/g,'');\nif (!/^[A-Za-z]+$/.test(nameNoSpace) || nameNoSpace.length < 4 || !name.includes(' '))\n  setErrors(e => ({...e, name: 'the name must contain minimum 4 characters'}));",
            },
            {
                "desc": "Login: אם העובד לא נמצא — alert <code>X העובד לא קיים</code>",
                "severity": "high",
                "before": "alert('Worker not found')",
                "after": "alert('X העובד לא קיים')  // טקסט מדויק לפי הדרישה",
            },
            {
                "desc": "Update product: בדיקת רישיון מלגזה — אם המוצר דורש מלגזה ולעובד אין רישיון, alert <code>יש צורך ברישיון למלגזה</code>; אחרת המוצר נעלם מהרשימה (inPlace=true)",
                "severity": "critical",
                "before": "// לוגיקה חסרה או לא נכונה",
                "after": "function update(prod) {\n  if (prod.needsForklift && !worker.hasLicense) return alert('יש צורך ברישיון למלגזה');\n  setProducts(ps => ps.map(p => p.id===prod.id ? {...p, inPlace:true} : p));\n  setWorker(w => ({...w, visits: w.visits+1}));\n}",
            },
        ],
        "missing": [
            "Logout button — מחזיר ל־'/'",
            "Welcome NAME — שם מלא של העובד בכותרת",
            "כן/לא — תרגום של hasLicense בעמוד פרטים (לפי הדרישה)",
        ],
        "extras": [
            "צפייה בהיסטוריית כניסות עובדים — תוספת מעבר לדרישה",
            "סינון מוצרים לפי 'דורש מלגזה / לא דורש'",
        ],
    },

    "logistics-q2": {
        "title": "JS — בינארי לדצימלי + פלינדרום",
        "score": 25,
        "bugs": [
            {
                "desc": "המרה לדצימלי: רוב הקודים משתמשים ב־<code>parseInt(arr.join(''), 2)</code> — זה תקין, אבל גם ידני: <code>arr.reverse().reduce((s,b,i) =&gt; s + b * 2**i, 0)</code>",
                "severity": "low",
                "before": "// תקין, אבל מומלץ לציין שתי שיטות",
                "after": "const dec = parseInt(arr.join(''), 2); // built-in\n// או: arr.reduce((s,b,i) => s + b * 2**(arr.length-1-i), 0); // ידני",
            },
            {
                "desc": "בדיקת פלינדרום: <code>String(dec) === String(dec).split('').reverse().join('')</code>",
                "severity": "low",
                "before": "// אם הקוד עושה reverse על המערך הבינארי במקום על הדצימלי",
                "after": "const s = String(dec); return s === [...s].reverse().join('');",
            },
            {
                "desc": "validation: לוודא שהמערך מכיל רק 0/1",
                "severity": "high",
                "before": "// אין בדיקה",
                "after": "if (!arr.every(b => b === 0 || b === 1)) throw new Error('binary array must contain only 0/1');",
            },
        ],
        "missing": [
            "מערך ריק — return false (אין פלינדרום)",
            "leading zeros: [0,1,0] = 010 = 2 — האם 010 פלינדרום? בדצימלי 2 אינו",
        ],
        "extras": [
            "החזרת אובייקט {dec, isPalindrome, decString}",
        ],
    },

    # ============================================================
    # CURRENCY (מבחן מחשבון המרה) — 2 שאלות בלבד
    # ============================================================

    "currency-q1": {
        "title": "Currency Exchange — מחשבון המרה",
        "score": 80,
        "bugs": [
            {
                "desc": "<strong>class Currency</strong> חובה: מאפיינים <code>type</code> (string) ו־<code>value</code> (number); method <code>update(newValue)</code>",
                "severity": "critical",
                "before": "// אם השתמשת ב־plain object במקום class",
                "after": "class Currency {\n  constructor(type, value) { this.type = type; this.value = value; }\n  update(newValue) { this.value = newValue; }\n}",
            },
            {
                "desc": "Update: אם סוג המטבע <strong>קיים</strong> — מעדכן את ה־value (לא יוצר חדש). אחרת — יוצר",
                "severity": "critical",
                "before": "currencies.push(new Currency(...)) // תמיד יוצר חדש",
                "after": "const existing = currencies.find(c => c.type === type);\nif (existing) existing.update(value); else currencies.push(new Currency(type, value));\nsetCurrencies([...currencies]);",
            },
            {
                "desc": "validation: סוג מטבע <strong>אנגלית בלבד</strong> — אחרת alert. ערך — מספרים בלבד",
                "severity": "critical",
                "before": "// אין validation",
                "after": "if (!/^[A-Za-z]+$/.test(type)) return alert('Currency type must be English letters only');\nif (isNaN(Number(value))) return alert('Value must be a number');",
            },
            {
                "desc": "כפתור START: <strong>לא לחיץ עד שהוזנו ערכים להמרה</strong>",
                "severity": "high",
                "before": "<button onClick={start}>start</button>",
                "after": "<button disabled={!fromType || !toType || !amount} onClick={start}>start</button>",
            },
            {
                "desc": "Exchange list: פורמט <code>#N\\nFROM TypeA TO TypeB\\nvalueA = result</code>; כפתור X למחיקה",
                "severity": "high",
                "before": "// פורמט תצוגה לא תואם",
                "after": "<li>#{i+1}<br/>FROM {ex.from} TO {ex.to}<br/>{ex.amount} = {ex.result} <button onClick={()=>remove(i)}>X</button></li>",
            },
            {
                "desc": "Update כפתור: לא לחיץ עד שהוזנו ערכים",
                "severity": "high",
                "before": "<button onClick={update}>UPDATE</button>",
                "after": "<button disabled={!type || !value} onClick={update}>UPDATE</button>",
            },
            {
                "desc": "Routes חובה לפי הדרישה — react-router-dom עם <code>/</code>, <code>/list</code>, <code>/update</code>",
                "severity": "critical",
                "before": "// אם בנית עם useState בלבד בלי routing",
                "after": "<BrowserRouter>\n  <Routes>\n    <Route path='/' element={<Calculator />} />\n    <Route path='/list' element={<ExchangeList />} />\n    <Route path='/update' element={<UpdateCurrency />} />\n  </Routes>\n</BrowserRouter>",
            },
        ],
        "missing": [
            "Share on Facebook — window.open של Facebook share URL",
            "BACK button בעמוד Update — חוזר ל־/ עם useNavigate(-1)",
            "Default מערך עם 3 מטבעות: DOLLAR=4, EURO=5, SHEKEL=1",
        ],
        "extras": [
            "Validation real-time עם error feedback מתחת לכל שדה",
            "Animated transition בין עמודים",
            "Drag-to-reorder ברשימת ההמרות",
        ],
    },

    "currency-q2": {
        "title": "JS — סדרת פיבונאצ׳י מותאמת",
        "score": 20,
        "bugs": [
            {
                "desc": "הפונקציה מקבלת <code>a, b, target</code> ומחזירה את האינדקס של target בסדרה <code>a, b, a+b, b+(a+b), ...</code>",
                "severity": "critical",
                "before": "// פיבונאצ׳י קלאסי שלא מתחיל מ־a,b",
                "after": "function position(a, b, target) {\n  if (a === target) return 1;\n  if (b === target) return 2;\n  let prev = a, curr = b, idx = 2;\n  while (curr < target) { [prev, curr] = [curr, prev + curr]; idx++; }\n  return curr === target ? idx : -1;\n}",
            },
            {
                "desc": "מקרה של target קטן מ־a או מ־b — צריך להחזיר -1 (לא בסדרה)",
                "severity": "high",
                "before": "// loop רץ לאינסוף אם target קטן",
                "after": "// תנאי while curr < target יוצא בנקודה הנכונה",
            },
        ],
        "missing": [
            "טיפול ב־a, b שליליים (סדרה יורדת)",
            "מקרה a == b (כל איבר הוא 2× הקודם)",
        ],
        "extras": [
            "החזרת הסדרה כולה עד target בנוסף לאינדקס",
        ],
    },

    # ============================================================
    # WILLING (מועד ב 2022)
    # ============================================================

    "willing-q1": {
        "title": "Willing App — אתר התנדבות",
        "score": 40,
        "bugs": [
            {
                "desc": "validation על אינפוטים — עיר, שם התנדבות, טלפון",
                "severity": "high",
                "before": "// ולידציה חסרה",
                "after": "if (!city || !title || !/^\\d{9,10}$/.test(phone)) return alert('All fields required + valid phone');",
            },
        ],
        "missing": [
            "סינון לפי עיר/קטגוריה",
            "סימון 'נבחרה' עבור התנדבות",
        ],
        "extras": [
            "Distance calculation לפי geolocation",
        ],
    },

    "willing-q2": {
        "title": "JS — even/odd ייחודיים",
        "score": 35,
        "bugs": [
            {
                "desc": "<strong>ייחודיים</strong> = להסיר כפילויות לפני ספירה",
                "severity": "critical",
                "before": "arr.filter(x => x%2===0).length",
                "after": "const unique = [...new Set(arr)];\nreturn { even: unique.filter(x => x%2===0).length, odd: unique.filter(x => x%2!==0).length };",
            },
        ],
        "missing": [
            "מספרים שליליים — האם נחשבים? (כן, כי modulo עובד)",
            "מערך ריק → {even:0, odd:0}",
        ],
        "extras": [
            "החזרת המספרים עצמם בנוסף לספירה",
        ],
    },

    "willing-q3": {
        "title": "Server — קורסים ב־MongoDB",
        "score": 25,
        "bugs": [
            {
                "desc": "POST /add: ולידציה על body — name, instructor, capacity",
                "severity": "high",
                "before": "// אין validation",
                "after": "const { name, instructor, capacity } = req.body;\nif (!name || !instructor || !Number.isInteger(capacity) || capacity <= 0)\n  return res.status(400).json({error:'invalid body'});",
            },
        ],
        "missing": [
            "PUT /:id — עדכון קורס קיים",
            "DELETE /:id",
        ],
        "extras": [
            "סינון לפי instructor/capacity",
        ],
    },

    # ============================================================
    # TRAVEL-SV (מועד ג)
    # ============================================================

    "travel-q1": {
        "title": "Travel-SV — יומן מסע",
        "score": 50,
        "bugs": [
            {
                "desc": "הוספת רשומה: validation על date (תקין), location (לא ריק), notes",
                "severity": "high",
                "before": "// validation חסר",
                "after": "if (!date || !location.trim()) return alert('Date and location required');\nif (isNaN(new Date(date).getTime())) return alert('Invalid date');",
            },
        ],
        "missing": [
            "מיון לפי תאריך",
            "חיפוש בתוך notes",
        ],
        "extras": [
            "מפת המסע — pinning של locations על מפה",
            "Photo upload לכל רשומה",
        ],
    },

    "travel-q2": {
        "title": "JS — sub-array בסדר נכון",
        "score": 25,
        "bugs": [
            {
                "desc": "Algorithm: סריקה של full array עם pointer ל־sub. כשנמצא match — increment pointer של sub. אם sub.length הגיע — true",
                "severity": "critical",
                "before": "// אם הקוד דורש contiguous (קונסקיוטיבי), זה שגוי — הדרישה היא רק 'בסדר'",
                "after": "let j = 0;\nfor (let i = 0; i < full.length && j < sub.length; i++) {\n  if (full[i] === sub[j]) j++;\n}\nreturn j === sub.length;",
            },
        ],
        "missing": [
            "sub ריק → return true (תמיד נמצא)",
            "sub ארוך מ־full → return false",
        ],
        "extras": [
            "החזרת האינדקסים שבהם sub נמצא ב־full",
        ],
    },

    "travel-q3": {
        "title": "Node Package — קובץ טקסט",
        "score": 25,
        "bugs": [
            {
                "desc": "fs.promises עם async/await — לא callbacks",
                "severity": "critical",
                "before": "fs.readFile(path, (err, data) => {...}) // callback style",
                "after": "import fs from 'fs/promises';\nasync function read(path) { return await fs.readFile(path, 'utf-8'); }",
            },
            {
                "desc": "טיפול ב־ENOENT (קובץ לא קיים) — להחזיר '' או null",
                "severity": "high",
                "before": "// throw מתחיל",
                "after": "try { return await fs.readFile(path, 'utf-8'); } catch(e) { if (e.code === 'ENOENT') return ''; throw e; }",
            },
        ],
        "missing": [
            "package.json עם type:'module' ל־ESM",
            "יחסי / מוחלטי path handling",
        ],
        "extras": [
            "Stream-based read לקבצים גדולים",
            "atomic write עם temp file + rename",
        ],
    },
}


# ============================================================
# Per-question score totals (sanity check)
# ============================================================
EXAM_TOTALS = {
    "football":  ("Football Club",          [50, 25, 25]),
    "parking":   ("SV Parking",             [50, 25, 25]),
    "flights":   ("Flight Control",         [50, 25, 25]),
    "helpme":    ("HelpMe",                 [75, 25, 25]),  # Q1 + (Q2 OR Q3); see helpme_total_override
    "bank":      ("SV Bank",                [65, 20, 15]),
    "logistics": ("Logistics Management",   [75, 25]),       # only 2 questions
    "currency":  ("Currency Exchange",      [80, 20]),       # only 2 questions
    "willing":   ("Willing App",            [40, 35, 25]),
    "travel":    ("Travel-SV",              [50, 25, 25]),
}

# HelpMe is special: student picks Q2 OR Q3, so the actual max is Q1 + 25 = 100.
# build_portal.py reads EXAM_NOTES to display this nuance.
EXAM_NOTES = {
    "helpme": "Q1 (75) + אחת מ־Q2/Q3 (25) = 100",
}
