#!/usr/bin/env python3
"""
build_solutions_100.py — Generates standalone HTML pages for each
"100/100" corrected solution living in solutions100/*.{jsx,js}.

Each generated page:
  1. Shows the FULL CORRECTED CODE with line numbers and hover-tips
  2. Lists the bugs that were fixed (vs the original)
  3. Lists requirements satisfied (vs the original spec)
  4. Has a "back to portal" link

Output goes to extras/solutions100/<qid>.html so the portal can iframe it.
"""

from __future__ import annotations

import html as html_lib
import json
import re
import sys
from pathlib import Path

ROOT = Path("/Users/tal/Desktop/פורטל מבחן 2")
SRC_DIR = ROOT / "solutions100"
OUT_DIR = ROOT / "extras" / "solutions100"

# Map of available solutions and their metadata
SOLUTIONS = {
    "football-q1": {
        "title": "Football Club — React (50 נק׳)",
        "kind": "React",
        "src_file": "football-q1.jsx",
        "language": "jsx",
        "fixes": [
            "Login alert: ה־`&#x27;` הוחלף באפוסטרוף אמיתי + נוסף prefix `username` לפי הספק",
            "Register: state נפרד `errors` עם שגיאה לכל אינפוט (לא alert יחיד)",
            "Register: שגיאת השדה מתנקה אוטומטית כשהמשתמש מקליד באותו השדה",
            "Register: 4 אינפוטים נפרדים עם labels תקינים — לא Object.keys-loop",
            "Persistence ב־localStorage — בריענון דף משתמשים נשמרים",
            "Validators מבודלים — validateTeamName / validatePassword / validatePlayer",
            "Player form: load values מ־route param `:playerId` ב־edit",
            "Layout: `aria-label`, focus management, keyboard navigation",
        ],
        "requirements": [
            ("עמוד ראשי / 2 אינפוטים + 2 כפתורים + כותרת", True),
            ("Alert: `username talko doesn't exist or the password doesn't match`", True),
            ("Register: 4 אינפוטים + כפתור + כותרת", True),
            ("Team name validation: אנגלית בלבד, אות גדולה רק בתחילת מילה", True),
            ("Password: 8-20 תווים + uppercase + lowercase + digit + special", True),
            ("Confirm password = password", True),
            ("שגיאה מעל כל אינפוט בנפרד", True),
            ("שגיאה נעלמת כשמקלידים שוב באינפוט", True),
            ("Team page: navbar + search + cards + show all toggle", True),
            ("Search: סינון בזמן אמת לפי substring בשם", True),
            ("Show all: text הופך ל־`Show only lineup players`", True),
            ("Click שחקן → /team/{name}/edit/{id} עם ערכים טעונים", True),
            ("Add player: validation גיל 18-60, מספרים בגולים/בישולים, מקס 11 in lineup", True),
            ("Edit page: select עם כל השחקנים, click → טעינת ערכים", True),
        ],
    },

    # ────── Currency Q1 (80 pts) ──────
    "currency-q1": {
        "title": "Currency Exchange — React (80 נק׳)",
        "kind": "React",
        "src_file": "currency-q1.jsx",
        "language": "jsx",
        "fixes": [
            "מחלקת `class Currency` עם constructor + method `update(newValue)` כפי שהדרישה דורשת במפורש",
            "אם סוג מטבע **קיים** — נקרא `existing.update(num)` (לא יוצר כפול בטעות)",
            "Validation: סוג מטבע באנגלית בלבד (regex `/^[A-Za-z]+$/`)",
            "Validation: ערך חייב להיות מספר (ולידציית `Number.isNaN`)",
            "כפתור START disabled עד שהוזנו from + to + amount תקינים (לפי הדרישה)",
            "כפתור UPDATE disabled עד שהוזנו type + value תקינים",
            "Routes מלאים: `/`, `/list`, `/update` עם react-router-dom",
            "BACK button בעמוד Update עם `useNavigate(-1)`",
            "פורמט רשימת ההמרות: `#N` / FROM type1 TO type2 / value = result + X delete",
            "ברירת מחדל: DOLLAR=4, EURO=5, SHEKEL=1 (per spec)",
            "Generic — תומך בכל גודל מערך מטבעות (הוספה, עדכון, מחיקה)",
            "Persistence ב־localStorage עם reconstruction של Currency instances ב־load",
            "Share on Facebook עם `window.open` ל־share URL רשמי",
        ],
        "requirements": [
            ("class Currency עם type, value, ו־update method", True),
            ("מערך ברירת מחדל DOLLAR=4, EURO=5, SHEKEL=1", True),
            ("Generic — לא תלוי בגודל המערך", True),
            ("Type באנגלית בלבד עם הודעת שגיאה", True),
            ("Value מספרי בלבד", True),
            ("START לא לחיץ עד הזנת ערכים", True),
            ("UPDATE לא לחיץ עד הזנת ערכים", True),
            ("Update: אם type קיים — מעדכן (לא יוצר חדש)", True),
            ("Routes /, /list, /update", True),
            ("Share on Facebook", True),
            ("BACK חוזר לעמוד הקודם", True),
            ("X על שורה ברשימה מוחק", True),
            ("פורמט שורה: #N / FROM x TO y / val = result", True),
            ("Persistence — שמירה אחרי refresh", True),
        ],
    },

    # ────── HelpMe Q1 (75 pts) ──────
    "helpme-q1": {
        "title": "HelpMe — React אפליקציית חירום (75 נק׳)",
        "kind": "React",
        "src_file": "helpme-q1.jsx",
        "language": "jsx",
        "fixes": [
            "מסך הרשמה רק בפעם הראשונה (localStorage `helpme-user`) — אחרי הרשמה לא מופיע שוב",
            "Validation שם: ≥4 תווים, ללא ספרות (`/\\d/.test`)",
            "Validation סיסמה: ≥8 תווים, לפחות אות אחת, לפחות ספרה אחת",
            "כפתור 'הצילו' אדום גדול במרכז, עם pulse animation + box-shadow",
            "מסך ביטול: 2 שדות סיסמה (כפולה) — שתיהן חייבות להיות זהות לסיסמה האמיתית",
            "**3-attempt lock**: state `locked` מסומן true אחרי 3 ניסיונות שגויים",
            "Locked state מתמיד ב־localStorage — לא מתאפס ברענון",
            "תפריט מוקדים: 3 שירותים (מד״א/משטרה/מכבי אש) + שמירת בחירה",
            "Vibration API ב־help button (פידבק פיזי)",
            "Per-field errors עם `setErrors`, מתנקות בהקלדה",
            "Routes נפרדים: /, /register, /help, /menu",
        ],
        "requirements": [
            ("מסך הרשמה — פעם ראשונה בלבד", True),
            ("שם — לפחות 4 תווים ללא ספרות", True),
            ("סיסמה — לפחות 8 תווים + אות + ספרה", True),
            ("כפתור 'הצילו' אדום גדול במרכז", True),
            ("מסך ביטול — סיסמה כפולה (2 שדות)", True),
            ("3 ניסיונות שגויים → המסך נעול", True),
            ("מצב locked נשמר ברענון", True),
            ("תפריט מוקדים — מד״א/משטרה/מכבי אש", True),
            ("שמירת בחירת מוקד", True),
            ("שגיאה מעל כל אינפוט בנפרד", True),
            ("Persistence: user, service, locked", True),
        ],
    },

    # ────── Logistics Q1 (75 pts) ──────
    "logistics-q1": {
        "title": "Logistics — React ניהול מחסן (75 נק׳)",
        "kind": "React",
        "src_file": "logistics-q1.jsx",
        "language": "jsx",
        "fixes": [
            "`class Worker` עם id (5-digit string), fullName, hasLicense, visits + method `visit()`",
            "`class Product` עם id, name, needsForklift, inPlace",
            "Validation מספר עובד: `/^\\d{5}$/` → טקסט שגיאה מדויק לפי הדרישה: `the number must be with 5 digits`",
            "Validation שם: אותיות בלבד + רווח אחד לפחות + ≥4 תווים → `the name must contain minimum 4 characters`",
            "Login: אם עובד לא נמצא → alert בעברית מדויק: **`X העובד לא קיים`**",
            "Welcome page: שם + פרטים + רישיון מתורגם ל־כן/לא + סיכום ביקורים",
            "רשימת מוצרים מסוננת ל־inPlace=false בלבד (per spec)",
            "Update button: אם המוצר דורש מלגזה ולעובד אין רישיון → `יש צורך ברישיון למלגזה`",
            "אחרת: המוצר נעלם, inPlace=true, worker.visits מוגדל",
            "5 מוצרים default per spec: 11122/22554 (Green), 66698 (Blue, forklift), 78544/69875 (Red)",
            "ערכים באנגלית בלבד (per spec)",
            "Persistence ב־localStorage לכל ה־classes (reconstruction ב־load)",
            "Logout button → return to /",
            "Visits log page (extra feature) — צפייה בכל הכניסות למחסן",
        ],
        "requirements": [
            ("class Worker עם 4 מאפיינים", True),
            ("class Product עם 4 מאפיינים", True),
            ("מערך עובדים ריק בהתחלה", True),
            ("מערך 5 מוצרים default per spec", True),
            ("Sign-up: 5-digit ID validation", True),
            ("טקסט שגיאת ID: 'the number must be with 5 digits'", True),
            ("Sign-up: 4+ char name + space", True),
            ("טקסט שגיאת שם: 'the name must contain minimum 4 characters'", True),
            ("Login by NO + alert 'X העובד לא קיים'", True),
            ("Welcome: שם + פרטים + רישיון כן/לא", True),
            ("רשימת מוצרים שלא במקום בלבד", True),
            ("Update בלי רישיון מלגזה: 'יש צורך ברישיון למלגזה'", True),
            ("Update עם רישיון: מוצר נעלם + visits++", True),
            ("Logout → /", True),
            ("Routes: /, /signup, /login, /welcome", True),
        ],
    },

    # ────── Bank Q1 (65 pts) ──────
    "bank-q1": {
        "title": "SV Bank — React ניהול בנק (65 נק׳)",
        "kind": "React",
        "src_file": "bank-q1.jsx",
        "language": "jsx",
        "fixes": [
            "Deposit/Withdraw: validation amount > 0 (positive number)",
            "Withdraw: insufficient funds check עם הצגת balance זמין",
            "Transfer: source ≠ target check",
            "Transfer: insufficient funds check על account המקור",
            "History array: timestamp ISO + type + from + to + amount + balanceAfter",
            "Centralized `record()` function שמוסיף לכל ה-history",
            "Confirmation modal לפני transfer גדול (>10000)",
            "History page: filter by type + search by owner/amount",
            "Persistence ב־localStorage",
            "Per-action error display עם clear-on-type",
            "Routes: /, /deposit, /withdraw, /transfer, /history",
            "Format ₪ עם toLocaleString",
        ],
        "requirements": [
            ("חשבונות עם id, owner, balance", True),
            ("Deposit: amount > 0", True),
            ("Withdraw: amount > 0 + insufficient funds", True),
            ("Transfer: source ≠ target", True),
            ("Transfer: insufficient funds check", True),
            ("History עם timestamp + type + amount", True),
            ("History filter by type", True),
            ("History search", True),
            ("Confirmation לסכומים גדולים", True),
            ("Routes לכל פעולה", True),
            ("Persistence", True),
        ],
    },

    # ────── Parking Q1 (50 pts) ──────
    "parking-q1": {
        "title": "SV Parking — React (50 נק׳)",
        "kind": "React",
        "src_file": "parking-q1.jsx",
        "language": "jsx",
        "fixes": [
            "מחירים מדויקים: Tel Aviv 150₪, Netanya 100₪, Rehovot 50₪ (per spec)",
            "Choose Parking: city + car required לפני start",
            "Active Parking: כפתור Pay מאופשר רק כש־active קיים",
            "Active Parking: real-time clock עדכון כל שנייה",
            "Pay flow: חישוב משך + מחיר (מינימום שעה אחת)",
            "History: מסונן ל־paid===true בלבד (per spec)",
            "Routes: /, /signin, /signup, /choose-parking, /active-parking, /history",
            "Persistent session ב־localStorage",
            "Phone validation 9-10 ספרות בהרשמה",
            "Logout button בכל מסך פנימי",
            "Cancel without paying — עדיין נרשם בהיסטוריה אבל paid=false",
        ],
        "requirements": [
            ("3 ערים: Tel Aviv 150, Netanya 100, Rehovot 50", True),
            ("Sign up + Sign in", True),
            ("Choose Parking page", True),
            ("Active Parking page", True),
            ("History page — completed only", True),
            ("Routes per spec", True),
            ("Pay button disabled עד active קיים", True),
            ("Logout returns to /", True),
            ("Persistent session", True),
        ],
    },

    # ────── Flights Q1 (50 pts) ──────
    "flights-q1": {
        "title": "Flight Control — React (50 נק׳)",
        "kind": "React",
        "src_file": "flights-q1.jsx",
        "language": "jsx",
        "fixes": [
            "Flight number validation: `/^[A-Z]{2}\\d{3,4}$/` (e.g. LY007)",
            "Airport codes validation: 3 uppercase letters (IATA format)",
            "Status update: skip alert אם אותו status (per spec)",
            "Filter by status (scheduled, boarding, departed, landed, cancelled, delayed)",
            "Search bar עם debounce של 200ms",
            "Color indicator לכל status — `--status-color` CSS variable",
            "From ≠ To check",
            "Persistence ב־localStorage",
            "Edit/delete flow",
            "Per-field errors עם clear-on-type",
        ],
        "requirements": [
            ("Flight CRUD", True),
            ("Validation flight number format", True),
            ("Validation airport codes", True),
            ("Status update", True),
            ("Filter by status", True),
            ("Search bar", True),
            ("Color per status", True),
        ],
    },

    # ────── Travel Q1 (50 pts) ──────
    "travel-q1": {
        "title": "Travel-SV — React יומן מסע (50 נק׳)",
        "kind": "React",
        "src_file": "travel-q1.jsx",
        "language": "jsx",
        "fixes": [
            "Date validation: required + valid date (`Date.parse`)",
            "Location required",
            "Notes required",
            "Sort by date — newest first",
            "Search in notes + location + tags",
            "Tags support — comma-separated input → array",
            "Edit/delete entries",
            "Persistence ב־localStorage",
            "Entry view page עם full content",
            "Per-field errors עם clear-on-type",
        ],
        "requirements": [
            ("Add entry — date, location, notes", True),
            ("Validation date + location + notes", True),
            ("Sort by date", True),
            ("Search", True),
            ("Edit + delete", True),
            ("Tags support", True),
        ],
    },

    # ────── Willing Q1 (40 pts) ──────
    "willing-q1": {
        "title": "Willing — React אתר התנדבות (40 נק׳)",
        "kind": "React",
        "src_file": "willing-q1.jsx",
        "language": "jsx",
        "fixes": [
            "Phone validation: 9-10 digits (Israeli format)",
            "City required + Title required",
            "Filter by city + category",
            "Mark as 'selected' (toggle)",
            "Show selected count on home page",
            "Persistence ב־localStorage",
            "Per-field errors עם clear-on-type",
            "Categories list: food, environment, elderly, children, animals, education, health",
        ],
        "requirements": [
            ("עמוד ראשי עם 2 כפתורים", True),
            ("Add event page", True),
            ("Find events page", True),
            ("Filter by city", True),
            ("Filter by category", True),
            ("Phone 9-10 digits validation", True),
            ("Mark as selected", True),
        ],
    },

    # ────── JS Q2 algorithms ──────
    "parking-q2": {
        "title": "Parking — JS רצפים שסכומם N (25 נק׳)",
        "kind": "JavaScript",
        "src_file": "parking-q2.js",
        "language": "js",
        "fixes": [
            "Brute-force O(n²) — עובד עם מספרים שליליים (sliding window נכשל בשליליים)",
            "Type validation: array + finite numbers",
            "Empty array → []",
            "מחזיר {start, end, slice} לכל רצף",
        ],
        "requirements": [
            ("פונקציה שמקבלת מערך + N", True),
            ("מחזירה כל הרצפים הרציפים שסכומם N", True),
            ("עובד עם מספרים שליליים", True),
            ("Edge cases: empty, n=0", True),
        ],
    },
    "flights-q2": {
        "title": "Flights — JS ספירת מספרים במטריצה (25 נק׳)",
        "kind": "JavaScript",
        "src_file": "flights-q2.js",
        "language": "js",
        "fixes": [
            "non-numeric → throw TypeError (per spec)",
            "מערך ריק / שורה ריקה → count=0",
            "מחזיר {count, positions[{row,col}]}",
            "Validation row-by-row",
        ],
        "requirements": [
            ("פונקציה שמקבלת מטריצה + ערך", True),
            ("ספירת מופעים", True),
            ("Throw על non-numeric", True),
            ("מחזיר positions", True),
        ],
    },
    "helpme-q2": {
        "title": "HelpMe — JS זיהוי סוג סדרה (25 נק׳)",
        "kind": "JavaScript",
        "src_file": "helpme-q2.js",
        "language": "js",
        "fixes": [
            "4 סוגים: arithmetic, geometric, fibonacci, other",
            "סדר בדיקה: arithmetic → geometric → fibonacci → other (per spec)",
            "Geometric guard: array עם 0 → not geometric (חלוקה ב־0)",
            "Float-safe comparison ב־geometric (Math.abs < 1e-9)",
            "Min length: 3 elements (RangeError אחרת)",
            "ייצוא גם isArithmetic, isGeometric, isFibonacci",
        ],
        "requirements": [
            ("4 סוגי סדרה", True),
            ("סדר בדיקה נכון", True),
            ("Min 3 elements", True),
            ("Geometric guard for 0", True),
            ("Type validation", True),
        ],
    },
    "bank-q2": {
        "title": "Bank — JS מיון ספרות ללא sort (20 נק׳)",
        "kind": "JavaScript",
        "src_file": "bank-q2.js",
        "language": "js",
        "fixes": [
            "Insertion sort (יציב, O(n²)) — לא משתמש ב־.sort()",
            "Bonus: bubble sort עם early-exit",
            "Empty/single → return slice (no work)",
            "Validation: כל אלמנט מספר סופי",
            "לא משנה את המערך המקורי (slice)",
        ],
        "requirements": [
            ("מיון ללא .sort()", True),
            ("Empty handling", True),
            ("Type validation", True),
            ("לא משנה input", True),
        ],
    },
    "logistics-q2": {
        "title": "Logistics — JS בינארי לדצימלי + פלינדרום (25 נק׳)",
        "kind": "JavaScript",
        "src_file": "logistics-q2.js",
        "language": "js",
        "fixes": [
            "Validation: רק 0 ו־1 במערך (TypeError אחרת)",
            "Convert to decimal עם parseInt(arr.join(''), 2)",
            "Palindrome check על הדצימלי כסטרינג",
            "מחזיר {decimal, isPalindrome, decString}",
            "Empty array → {decimal:0, isPalindrome:false}",
        ],
        "requirements": [
            ("Validation 0/1 only", True),
            ("המרה לדצימלי", True),
            ("בדיקת פלינדרום על הדצימלי", True),
            ("דוגמה: [1,0,1,1,0,1] → 45", True),
        ],
    },
    "currency-q2": {
        "title": "Currency — JS מיקום פיבונאצ׳י מותאם (20 נק׳)",
        "kind": "JavaScript",
        "src_file": "currency-q2.js",
        "language": "js",
        "fixes": [
            "Custom Fib starting from a, b (לא מהקלאסי 0,1)",
            "target === a → return 1; target === b → return 2",
            "target קטן מ־a וקטן מ־b → return -1 (לא בסדרה)",
            "MAX_ITER cap למניעת infinite loop (a=0,b=0)",
            "Validation: 3 numbers finite",
            "דוגמה מהספק: position(2,5,19) === 5",
        ],
        "requirements": [
            ("פונקציה (a, b, target)", True),
            ("מחזיר 1-based index", True),
            ("דוגמת ספק: position(2,5,19) = 5", True),
            ("target לא בסדרה → -1", True),
            ("Edge cases", True),
        ],
    },
    "willing-q2": {
        "title": "Willing — JS even/odd ייחודיים (35 נק׳)",
        "kind": "JavaScript",
        "src_file": "willing-q2.js",
        "language": "js",
        "fixes": [
            "Set לdedupe לפני ספירה",
            "מחזיר {even, odd, evenList, oddList}",
            "Type validation: integers בלבד",
            "Empty array → {even:0, odd:0}",
        ],
        "requirements": [
            ("ספירת ייחודיים", True),
            ("הפרדה זוגי/אי-זוגי", True),
            ("Type validation", True),
            ("Empty handling", True),
        ],
    },
    "travel-q2": {
        "title": "Travel — JS מערך חלקי בסדר (25 נק׳)",
        "kind": "JavaScript",
        "src_file": "travel-q2.js",
        "language": "js",
        "fixes": [
            "Two-pointer linear scan O(n) — לא בודק קונסקיוטיביות",
            "sub.length === 0 → true",
            "sub.length > full.length → false",
            "Bonus: subArrayInOrderWithIndexes — מחזיר indexes",
        ],
        "requirements": [
            ("בדיקה אם sub-array מופיע בסדר נכון", True),
            ("לא חייב להיות contiguous", True),
            ("Edge cases (empty, longer)", True),
        ],
    },

    # ────── Server Q3 ──────
    "parking-q3": {
        "title": "Parking — Express+Mongoose מורים (25 נק׳)",
        "kind": "Express",
        "src_file": "parking-q3.js",
        "language": "js",
        "fixes": [
            "Mongoose schema עם validators (id unique, salary ≥ 0)",
            "GET /teachers — all teachers",
            "POST /low-salary — `find({salary: {$lt: minSalary}})` (per spec)",
            "POST /add-or-update — `findOneAndUpdate({id}, body, {upsert:true})` (per spec)",
            "Try/catch סביב כל endpoint",
            "Status codes נכונים: 200/201 ל־upsert, 400 ל־invalid, 500 ל־error",
            "mongoose.connect עם try/catch ב־boot",
            "Index על teacher.id ל־performance",
        ],
        "requirements": [
            ("GET /teachers", True),
            ("POST /low-salary עם req.body.minSalary", True),
            ("POST /add-or-update עם upsert", True),
            ("Validation", True),
            ("Mongoose schema", True),
        ],
    },
    "flights-q3": {
        "title": "Flights — Express+Mongoose סטודנטים (25 נק׳)",
        "kind": "Express",
        "src_file": "flights-q3.js",
        "language": "js",
        "fixes": [
            "CRUD שלם: GET, POST, PUT, DELETE",
            "id duplicate check לפני insert + handling 11000 (Mongo dup key)",
            "POST /students/filter — combined filters: gpa, year, name",
            "Validation מלא של body",
            "Status codes: 201/204/404/409/400",
            "Mongoose schema עם validators (age ≥ 18, gpa 0-100, year 1-6)",
        ],
        "requirements": [
            ("CRUD מלא", True),
            ("id duplicate check", True),
            ("Filter by gpa, year, name", True),
            ("Validation", True),
        ],
    },
    "bank-q3": {
        "title": "Bank — Express שמירת טקסט (15 נק׳)",
        "kind": "Express",
        "src_file": "bank-q3.js",
        "language": "js",
        "fixes": [
            "POST /save-text — `fs.appendFile` (לא writeFile שדורסת!)",
            "Validation: text חייב להיות string לא ריק",
            "GET /text — קריאת תוכן + ENOENT handling",
            "GET /lines — מחזיר מערך שורות",
            "DELETE /text — ניקוי",
            "Error middleware",
        ],
        "requirements": [
            ("POST /save-text שומר ל-file", True),
            ("appendFile (לא דורס)", True),
            ("Validation על text", True),
            ("ENOENT handling", True),
        ],
    },
    "willing-q3": {
        "title": "Willing — Express+Mongoose קורסים (25 נק׳)",
        "kind": "Express",
        "src_file": "willing-q3.js",
        "language": "js",
        "fixes": [
            "CRUD שלם של courses",
            "Validation: name + instructor + capacity (positive integer)",
            "PUT /courses/:id — update existing",
            "DELETE /courses/:id",
            "POST /courses/filter — instructor (regex), minCapacity, hasSpots",
            "Schema עם validators (capacity integer)",
        ],
        "requirements": [
            ("CRUD מלא", True),
            ("Validation על body", True),
            ("PUT update", True),
            ("DELETE", True),
            ("Filter combined", True),
        ],
    },
    "travel-q3": {
        "title": "Travel — Node מחלקת קובץ טקסט (25 נק׳)",
        "kind": "Node package",
        "src_file": "travel-q3.js",
        "language": "js",
        "fixes": [
            "fs.promises עם async/await — אין callbacks",
            "ENOENT → return '' (לא throw)",
            "Atomic write: temp file + rename (אם נכשל באמצע, המקור נשמר)",
            "mkdir recursive לוודא parent dir",
            "Methods: read/readLines/write/append/appendLine/delete/exists/size",
            "Cleanup tmp on failure",
        ],
        "requirements": [
            ("class TextFile", True),
            ("read עם ENOENT handling", True),
            ("write atomic", True),
            ("append", True),
            ("delete + exists + size", True),
            ("async/await בלבד", True),
        ],
    },
    "helpme-q3": {
        "title": "HelpMe — תיאוריה (25 נק׳)",
        "kind": "Theory",
        "src_file": "helpme-q3.md",
        "language": "md",
        "fixes": [
            "GET vs POST vs PUT vs DELETE — טבלת השוואה עם idempotency, body, cacheable",
            "MongoDB: 3 יתרונות (schemaless, JSON-native, scaling) + 2 חסרונות (אין ACID, אין JOIN חזק)",
            "React vs vanilla: components, reactivity, virtual DOM + חיסרון bundle size",
            "function vs arrow: this binding (דינמי vs לקסיקלי) + arguments + constructor",
            "Recursion: base case + recursive case + factorial + fib + מתי כדאי/לא",
            "כל התשובות עם דוגמאות קוד מבוארות",
        ],
        "requirements": [
            ("GET/POST/PUT/DELETE כולל idempotency", True),
            ("MongoDB 3 יתרונות + 2 חסרונות", True),
            ("React vs HTML/JS/CSS", True),
            ("function vs arrow — this binding", True),
            ("Recursion — base case + דוגמאות", True),
        ],
    },

    "football-q2": {
        "title": "Football — JS סכום לפי אורך מספר (25 נק׳)",
        "kind": "JavaScript",
        "src_file": "football-q2.js",
        "language": "js",
        "fixes": [
            "Throw `TypeError` ברור לכל ערך שאינו מספר סופי (כולל NaN/Infinity)",
            "`Math.abs` מטופל לפני `String(...).length` — מספרים שליליים לא נספרים שגוי",
            "מערך ריק → `{}` (ולא שגיאה)",
            "JSDoc + signature ברור",
            "self-tests inline (מוערים)",
        ],
        "requirements": [
            ("פונקציה שמקבלת מערך מספרים", True),
            ("מחזירה אובייקט {אורך-ספרות: סכום}", True),
            ("דוגמה [1,15,30,5,800] → {1:6, 2:45, 3:800}", True),
            ("Throw שגיאה רלוונטית אם ערך אינו מספר", True),
        ],
    },
    "football-q3": {
        "title": "Football — Express CRUD משחקי מחשב (25 נק׳)",
        "kind": "Express",
        "src_file": "football-q3.js",
        "language": "js",
        "fixes": [
            "Validation מלא ל־POST `/` — שם, תיאור, שנת הוצאה, מחיר",
            "Status codes נכונים: 201 ל־create, 400 ל־invalid, 500 ל־error",
            "Error middleware גלובלי",
            "POST `/search` — שלושת הפילטרים פועלים יחדיו (AND) לא בנפרד",
            "Persistence ל־games.json עם fs/promises",
            "ENOENT handling — קובץ לא קיים מתחיל ריק",
        ],
        "requirements": [
            ("שרת Express עם רשימת משחקי מחשב", True),
            ("GET / מחזיר את כל המשחקים", True),
            ("POST / מוסיף משחק", True),
            ("POST /search עם פילטר שנת הוצאה (≤)", True),
            ("POST /search עם פילטר שם (substring)", True),
            ("POST /search עם פילטר מחיר (≤)", True),
            ("עד 3 פילטרים בו־זמנית, AND ביניהם", True),
        ],
    },
}


# ─────────────────── Hover tip generation ───────────────────
TIP_RULES = [
    (re.compile(r"^\s*//"),                     "הערה: לא רץ ב־runtime, רק לקריאה."),
    (re.compile(r"^\s*import\b"),               "Import: מביאים מודול אחר לקובץ הזה."),
    (re.compile(r"^\s*export\b"),               "Export: מאפשר לקובץ אחר להשתמש בקוד שלי."),
    (re.compile(r"^\s*const\s+\w+\s*="),        "const: משתנה שלא מוקצה מחדש — נכון לרוב המקרים."),
    (re.compile(r"^\s*let\s+\w+"),              "let: משתנה שאפשר לעדכן."),
    (re.compile(r"^\s*function\s+\w+"),         "function: יחידת פעולה מוגדרת — בדקו מה היא מחזירה."),
    (re.compile(r"^\s*if\s*\("),                "תנאי: מפצל את הזרימה לפי בדיקה."),
    (re.compile(r"^\s*return\b"),               "return: מסיים את הפונקציה ומחזיר ערך."),
    (re.compile(r"^\s*useState\b|=\s*useState"),"useState: state ב־React — שינוי גורם ל־re-render."),
    (re.compile(r"^\s*useEffect\b|=\s*useEffect"),"useEffect: side effect — רץ אחרי render לפי dependencies."),
    (re.compile(r"^\s*useMemo\b"),              "useMemo: שומר חישוב יקר עד שה־deps משתנות."),
    (re.compile(r"^\s*useNavigate\b"),          "useNavigate: hook של react-router לניווט תוכניתי."),
    (re.compile(r"^\s*useParams\b"),            "useParams: קוראים פרמטרים מה־route."),
    (re.compile(r"<Route\b"),                   "Route: מגדיר איזה רכיב מציג בכתובת מסוימת."),
    (re.compile(r"<BrowserRouter\b"),           "BrowserRouter: שורש הניווט; חובה עוטף את כל ה־Routes."),
    (re.compile(r"app\.(get|post|put|delete|use)\("), "Express endpoint: מאזין לבקשה ב־path מסוים."),
    (re.compile(r"\bres\.(json|send|status)\b"),"שולח תשובה ללקוח — עם status code נכון."),
    (re.compile(r"\bawait\s+fs\."),             "fs.promises: גישה לקבצים אסינכרונית."),
    (re.compile(r"\btry\s*\{"),                 "try/catch: לוכד שגיאות שלא יקריסו את התהליך."),
    (re.compile(r"^\s*throw\b"),                "throw: זורק שגיאה — מסמן מצב לא חוקי."),
    (re.compile(r"\.filter\("),                 "filter: יוצר מערך חדש רק מאיברים שעוברים תנאי."),
    (re.compile(r"\.map\("),                    "map: ממיר כל איבר במערך — מחזיר מערך חדש באותו אורך."),
    (re.compile(r"\.find\("),                   "find: מחזיר את האיבר הראשון שעובר את התנאי או undefined."),
    (re.compile(r"^\s*setForm\(|setUsers\(|setErrors\(|setSearch\(|setShowAll\(|setLocked\(|setForm\b"), "Setter: מעדכן state — React ירנדר מחדש."),
    (re.compile(r"localStorage\."),             "localStorage: שמירה מקומית בדפדפן בין refresh-ים."),
    (re.compile(r"\.replace\(|\.test\(|/.*/\.test"), "Regex: בדיקת תקינות של מחרוזת לפי תבנית."),
    (re.compile(r"\.length\b"),                 ".length: מחזיר את אורך המערך/מחרוזת."),
    (re.compile(r"^\s*$"),                      "שורה ריקה — מפרידה בלוקים לוגיים."),
]


def hover_tip_for(line: str) -> str:
    """Pick the most relevant tip for a line. Falls back to generic."""
    for pattern, tip in TIP_RULES:
        if pattern.search(line):
            return tip
    return "שורת קוד — בדקו סוגריים, שמות משתנים, וההקשר לדרישת השאלה."


def render_code_block(source: str, language: str = "jsx") -> str:
    """Render code with line numbers and per-line hover tips."""
    lines_html = []
    for i, line in enumerate(source.splitlines(), start=1):
        tip = hover_tip_for(line)
        # Color hint: comments get a grey class, fixes get a yellow class
        cls = "code-line"
        if line.lstrip().startswith("//"):
            cls += " is-comment"
        if "✅ FIXED" in line:
            cls += " is-fix"
        # escape line for HTML
        escaped = html_lib.escape(line) or "&nbsp;"
        tip_attr = html_lib.escape(tip, quote=True)
        lines_html.append(
            f'<div class="{cls}" data-tip="{tip_attr}" tabindex="0">'
            f'<span class="ln">{i}</span>'
            f'<span class="src">{escaped}</span>'
            f'</div>'
        )
    return (
        f'<div class="annotated-code lang-{language}">'
        f'<div class="code-lines">{"".join(lines_html)}</div>'
        f'</div>'
    )


def render_markdown(md: str) -> str:
    """Minimal markdown → HTML renderer for theory pages.
    Supports: # headers, **bold**, *italic*, `code`, ```code blocks```, - lists,
    | tables |, > quotes, --- hr, [text](url) links."""
    out = []
    lines = md.splitlines()
    i = 0
    in_code = False
    in_list = False
    in_table = False
    table_buffer = []

    def flush_table():
        nonlocal in_table, table_buffer
        if not in_table:
            return
        # First row is header, second row is separator (|---|---|), rest are body
        rows = [r for r in table_buffer if r.strip()]
        if len(rows) >= 2:
            head_cells = [c.strip() for c in rows[0].strip("|").split("|")]
            out.append("<table class='md-table'><thead><tr>" +
                       "".join(f"<th>{inline(c)}</th>" for c in head_cells) +
                       "</tr></thead><tbody>")
            for row in rows[2:]:  # skip separator
                cells = [c.strip() for c in row.strip("|").split("|")]
                out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in cells) + "</tr>")
            out.append("</tbody></table>")
        in_table = False
        table_buffer = []

    def inline(text: str) -> str:
        # Order matters
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', text)
        return text

    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            if in_code:
                out.append("</code></pre>")
                in_code = False
            else:
                lang = line[3:].strip() or "text"
                out.append(f'<pre class="md-code lang-{lang}"><code>')
                in_code = True
            i += 1
            continue
        if in_code:
            out.append(html_lib.escape(line))
            i += 1
            continue
        if line.startswith("|") and "|" in line[1:]:
            if not in_table:
                in_table = True
                table_buffer = [line]
            else:
                table_buffer.append(line)
            i += 1
            continue
        else:
            flush_table()
        if line.startswith("# "):
            out.append(f"<h1>{inline(line[2:])}</h1>")
        elif line.startswith("## "):
            out.append(f"<h2>{inline(line[3:])}</h2>")
        elif line.startswith("### "):
            out.append(f"<h3>{inline(line[4:])}</h3>")
        elif line.startswith("#### "):
            out.append(f"<h4>{inline(line[5:])}</h4>")
        elif line.strip() == "---":
            out.append("<hr/>")
        elif line.startswith("> "):
            out.append(f"<blockquote>{inline(line[2:])}</blockquote>")
        elif re.match(r'^\s*[-*]\s', line):
            if not in_list:
                out.append("<ul class='md-list'>")
                in_list = True
            content = re.sub(r'^\s*[-*]\s', '', line)
            out.append(f"<li>{inline(content)}</li>")
        elif re.match(r'^\s*\d+\.\s', line):
            if not in_list:
                out.append("<ol class='md-list'>")
                in_list = True
            content = re.sub(r'^\s*\d+\.\s', '', line)
            out.append(f"<li>{inline(content)}</li>")
        else:
            if in_list:
                out.append("</ul>" if "<ul" in out[-1] or any("<ul" in x for x in out[-5:]) else "</ol>")
                in_list = False
            if line.strip():
                out.append(f"<p>{inline(line)}</p>")
    if in_list:
        out.append("</ul>")
    if in_table:
        flush_table()
    return "\n".join(out)


def render_solution_page(qid: str, meta: dict) -> str:
    src_path = SRC_DIR / meta["src_file"]
    if not src_path.exists():
        print(f"  WARN: source missing for {qid}: {src_path}", file=sys.stderr)
        return ""
    source = src_path.read_text(encoding="utf-8")
    if meta.get("language") == "md":
        # Theory pages — render markdown instead of code block
        code_html = f'<div class="md-content">{render_markdown(source)}</div>'
    else:
        code_html = render_code_block(source, meta.get("language", "jsx"))

    fixes_html = "".join(
        f'<li><span class="fix-mark">✅</span> {f}</li>'
        for f in meta.get("fixes", [])
    )

    req_rows = []
    for req, ok in meta.get("requirements", []):
        cls = "req-yes" if ok else "req-no"
        mark = "✓" if ok else "✗"
        req_rows.append(
            f'<tr class="{cls}"><td class="req-mark">{mark}</td><td>{req}</td></tr>'
        )
    req_html = "".join(req_rows)

    return PAGE_TEMPLATE.format(
        title=meta["title"],
        qid=qid,
        kind=meta["kind"],
        code=code_html,
        fixes=fixes_html,
        requirements=req_html,
        line_count=len(source.splitlines()),
        char_count=len(source),
    )


PAGE_TEMPLATE = """<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>פתרון 100 — {title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  :root{{--ink:#0f172a;--bg:#f8fafc;--accent:#7c3aed;--accent2:#2563eb;--good:#16a34a}}
  *{{box-sizing:border-box}}
  body{{margin:0;font-family:Heebo,Arial,sans-serif;background:linear-gradient(135deg,#fef9c3,#dbeafe);color:var(--ink);line-height:1.7;direction:rtl;padding:24px}}
  .wrap{{max-width:1100px;margin:0 auto}}
  .hero{{padding:24px 28px;border:3px solid #000;border-radius:18px;background:linear-gradient(135deg,#0f172a,#312e81 60%,#7c3aed);color:#fff;box-shadow:6px 6px 0 #000;margin-bottom:18px}}
  .hero h1{{margin:0 0 8px;font-size:28px}}
  .hero .meta{{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}}
  .hero .pill{{padding:4px 10px;border:2px solid #fff;border-radius:999px;font-size:12px;font-weight:900;background:rgba(255,255,255,.15)}}
  .hero .pill.gold{{background:#facc15;color:#000;border-color:#000}}
  section.card{{padding:18px 22px;border:2.5px solid #000;border-radius:16px;background:#fff;box-shadow:5px 5px 0 #000;margin-bottom:16px}}
  section.card h2{{margin:0 0 10px;font-size:20px;color:#1f2937;display:flex;gap:8px;align-items:center}}
  ul.fixes{{padding:0;margin:0;list-style:none;display:grid;gap:6px}}
  ul.fixes li{{padding:8px 12px;border:2px solid #000;border-radius:8px;background:#f0fdf4;font-weight:600;font-size:13.5px;display:flex;gap:8px}}
  ul.fixes li .fix-mark{{font-weight:900}}
  table.req{{width:100%;border-collapse:collapse}}
  table.req td{{padding:8px 12px;border-bottom:1.5px solid #cbd5e1;font-size:13.5px;vertical-align:top}}
  table.req .req-mark{{width:24px;text-align:center;font-weight:900;font-size:16px}}
  table.req tr.req-yes .req-mark{{color:#16a34a}}
  table.req tr.req-no .req-mark{{color:#dc2626}}
  .annotated-code{{border:2px solid #000;border-radius:12px;background:#0f172a;padding:14px;direction:ltr;text-align:left;overflow-x:auto;font-family:Consolas,Monaco,monospace;font-size:13px;line-height:1.65}}
  .code-line{{display:flex;gap:10px;padding:1px 4px;border-radius:4px;cursor:help;color:#e2e8f0}}
  .code-line:hover{{background:rgba(250,204,21,.1)}}
  .code-line:focus{{outline:2px solid #facc15;outline-offset:-2px}}
  .code-line.is-comment .src{{color:#64748b;font-style:italic}}
  .code-line.is-fix{{background:rgba(16,185,129,.18)}}
  .code-line.is-fix .src{{color:#86efac}}
  .ln{{color:#64748b;min-width:36px;text-align:left;user-select:none;flex:0 0 auto}}
  .src{{flex:1;white-space:pre;color:#e2e8f0}}
  .src .keyword{{color:#c084fc}}
  .src .string{{color:#fcd34d}}
  /* Hover tooltip */
  .code-line[data-tip]{{position:relative}}
  .code-line[data-tip]:hover::after{{
    content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);right:0;
    background:#facc15;color:#0f172a;padding:6px 10px;border:2px solid #000;border-radius:8px;
    font-size:11.5px;font-weight:900;direction:rtl;white-space:normal;width:max-content;max-width:380px;
    box-shadow:3px 3px 0 #000;z-index:5;pointer-events:none;font-family:Heebo,Arial,sans-serif
  }}
  .lang-pill{{display:inline-block;padding:2px 9px;background:#1f2937;color:#facc15;border-radius:999px;font-size:11px;font-weight:900;margin-right:8px;font-family:Consolas,monospace}}
  /* Markdown rendering (theory pages) */
  .md-content{{padding:8px 4px;line-height:1.85;font-size:14.5px}}
  .md-content h1{{font-size:24px;margin:16px 0 10px;color:#1e1b4b;border-bottom:2px solid #c7d2fe;padding-bottom:6px}}
  .md-content h2{{font-size:20px;margin:18px 0 8px;color:#312e81}}
  .md-content h3{{font-size:17px;margin:14px 0 6px;color:#4338ca}}
  .md-content h4{{font-size:15px;margin:12px 0 4px;color:#5b21b6}}
  .md-content p{{margin:6px 0}}
  .md-content code{{background:#0f172a;color:#fcd34d;padding:1px 6px;border-radius:5px;font-family:Consolas,monospace;font-size:12.5px;direction:ltr;display:inline-block}}
  .md-content pre.md-code{{background:#0f172a;color:#86efac;padding:12px;border-radius:10px;direction:ltr;text-align:left;font-family:Consolas,monospace;font-size:12.5px;line-height:1.55;overflow-x:auto;margin:10px 0}}
  .md-content pre.md-code code{{background:transparent;color:inherit;padding:0;display:block}}
  .md-content blockquote{{border-right:4px solid #7c3aed;padding:8px 14px;background:#f5f3ff;margin:8px 0;font-style:italic}}
  .md-content table.md-table{{width:100%;border-collapse:collapse;margin:10px 0;background:#fff;box-shadow:0 4px 12px rgba(15,23,42,.08);border-radius:10px;overflow:hidden}}
  .md-content table.md-table th{{background:#312e81;color:#fff;padding:8px 12px;text-align:right;font-weight:900}}
  .md-content table.md-table td{{padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top}}
  .md-content table.md-table tr:nth-child(even) td{{background:#f8fafc}}
  .md-content ul.md-list, .md-content ol.md-list{{padding-right:24px;margin:6px 0}}
  .md-content ul.md-list li, .md-content ol.md-list li{{margin:3px 0}}
  .md-content hr{{border:none;border-top:2px dashed #94a3b8;margin:18px 0}}
  .md-content a{{color:#2563eb;text-decoration:underline}}

  @media print{{body{{background:#fff}};.hero{{background:#0f172a !important}}}}
</style>
</head>
<body>
<div class="wrap">

  <header class="hero">
    <h1>🏆 פתרון לציון 100 — {title}</h1>
    <p style="margin:0;color:#dbeafe">קוד <strong>מתוקן</strong> — עם כל הבאגים שתועדו במקור מתוקנים בפועל.
    רחפו על כל שורה לתיאור קצר; שורות ירוקות הן תיקונים.</p>
    <div class="meta">
      <span class="pill gold">{kind}</span>
      <span class="pill">{line_count} שורות</span>
      <span class="pill">{char_count} תווים</span>
      <span class="pill">qid: {qid}</span>
    </div>
  </header>

  <section class="card">
    <h2>🔧 באגים שתוקנו (לא רק תועדו — תוקנו בקוד)</h2>
    <ul class="fixes">{fixes}</ul>
  </section>

  <section class="card">
    <h2>✅ דרישה-מול-מימוש (טבלת בקרה)</h2>
    <table class="req">{requirements}</table>
  </section>

  <section class="card">
    <h2>📦 הקובץ המלא — קוד מתוקן עם hover-tip לכל שורה</h2>
    {code}
  </section>

</div>
</body>
</html>
"""


def render_index_page() -> str:
    """Build a tiny index page that links to all 100/100 solution pages."""
    items = []
    by_exam = {}
    for qid, meta in SOLUTIONS.items():
        exam = qid.split("-")[0]
        by_exam.setdefault(exam, []).append((qid, meta))
    for exam, qs in by_exam.items():
        qs.sort()
        cards = "".join(
            f'<a class="sol-link" href="{qid}.html"><h4>{m["title"]}</h4>'
            f'<small>{m["kind"]} · {len(m.get("fixes",[]))} תיקונים · {len(m.get("requirements",[]))} דרישות</small></a>'
            for qid, m in qs
        )
        items.append(
            f'<section class="exam-block"><h3>{exam}</h3><div class="sol-grid">{cards}</div></section>'
        )
    return INDEX_TEMPLATE.format(blocks="".join(items), total=len(SOLUTIONS))


INDEX_TEMPLATE = """<!doctype html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/><title>פתרונות 100/100 — אינדקס</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}body{{margin:0;font-family:Heebo,Arial,sans-serif;background:linear-gradient(135deg,#fef9c3,#dbeafe);direction:rtl;padding:24px}}
  .wrap{{max-width:1100px;margin:0 auto}}
  h1{{font-size:30px;margin:0 0 6px}}
  .lead{{color:#475569;margin:0 0 22px}}
  .exam-block{{margin-bottom:18px;padding:16px;border:2.5px solid #000;border-radius:16px;background:#fff;box-shadow:5px 5px 0 #000}}
  .exam-block h3{{margin:0 0 10px;font-size:20px;text-transform:capitalize;color:#1f2937}}
  .sol-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}}
  .sol-link{{display:block;padding:12px 14px;border:2px solid #000;border-radius:12px;background:linear-gradient(135deg,#fef9c3,#fffbeb);text-decoration:none;color:#0f172a;box-shadow:2px 2px 0 #000;transition:.16s}}
  .sol-link:hover{{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #000}}
  .sol-link h4{{margin:0 0 4px;font-size:14.5px}}
  .sol-link small{{color:#475569;font-size:11.5px}}
</style></head>
<body><div class="wrap">
  <h1>🏆 פתרונות לציון 100/100 — קוד מתוקן בפועל</h1>
  <p class="lead">{total} פתרונות שאלות מבחן עם הקוד המתוקן בפועל (לא רק תיעוד). כל פתרון כולל hover-tip לכל שורה, רשימת באגים שתוקנו וטבלת דרישה-מול-מימוש.</p>
  {blocks}
</div></body></html>
"""


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    built = 0
    for qid, meta in SOLUTIONS.items():
        page = render_solution_page(qid, meta)
        if not page:
            continue
        out = OUT_DIR / f"{qid}.html"
        out.write_text(page, encoding="utf-8")
        built += 1
    # index page
    idx = OUT_DIR / "index.html"
    idx.write_text(render_index_page(), encoding="utf-8")
    print(f"Built {built} solution page(s) in {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
