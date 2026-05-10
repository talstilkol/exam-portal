# HelpMe — Theory Q3 (25 pts)

> Source spec: `מבחן מועד א פולסטאק.pdf`
>
> 5 questions. The candidate may answer this **or** Q2, not both. We answer all
> 5 here so the candidate can pick the strongest combination.

---

## 1. הבדל בין GET / POST / PUT / DELETE

| מתודה | מה היא עושה? | Idempotent? | יש body? | Cacheable? |
|---|---|---|---|---|
| **GET** | מקבל מידע מהשרת ללא שינוי state | ✅ כן | ❌ לא (פרמטרים ב-URL) | ✅ כן |
| **POST** | יוצר משאב חדש או מבצע פעולה | ❌ לא | ✅ כן | ❌ לא |
| **PUT** | מחליף משאב שלם (replace full) | ✅ כן | ✅ כן | ❌ לא |
| **DELETE** | מוחק משאב | ✅ כן | רוב הזמן לא | ❌ לא |

**הבדלים מרכזיים**:
- **idempotent** = מספר קריאות עם אותם פרמטרים נותנות אותה תוצאה. PUT/DELETE/GET — כן. POST — לא (כל קריאה יוצרת משאב חדש).
- **GET** מציג פרמטרים ב-URL (visible, cacheable), **POST/PUT** ב-body (hidden, large payloads).
- **PUT** מחליף משאב שלם (אם השדה לא נשלח, הוא יימחק); **PATCH** (לא במבחן) מעדכן חלקית.

**דוגמה**:
```js
// GET
fetch('/users/42')                         // קבל משתמש 42
// POST
fetch('/users', {method:'POST', body: ...}) // צור משתמש חדש
// PUT
fetch('/users/42', {method:'PUT', body: ...}) // החלף משתמש 42
// DELETE
fetch('/users/42', {method:'DELETE'})      // מחק משתמש 42
```

---

## 2. יתרונות וחסרונות של MongoDB

### ✅ יתרונות (3+)

1. **Schemaless / גמישות סכמה** — אפשר לאחסן אובייקטים שונים באותו collection
   בלי הגדרת טבלה מראש. נוח לפרויקטים שמתפתחים מהר.
2. **JSON-native** — הנתונים נשמרים כ-BSON (קרוב מאוד ל-JSON), אז יש פחות מיפוי
   בין הקוד (JS) למסד הנתונים. קל לעבוד עם Node.js.
3. **Horizontal scaling** — תומך ב-sharding בקלות, אז כשגדלים פיזית יש דרך
   ברורה לפצל את הנתונים בין שרתים.
4. **Aggregation pipeline** — שפת שאילתות עוצמתית לעיבוד נתונים ב-pipeline
   (group, sort, project, lookup וכו').
5. **Replication** מובנה — replica sets לאמינות גבוהה.

### ⚠ חסרונות (2)

1. **חסר transactions ACID טהורות** (לפחות עד גרסה 4.0; גם אחרי, מוגבל ב-multi-document).
   לא מתאים לפיננסים/בנקים שדורשים atomicity מלא.
2. **חסרים joins חזקים** — `$lookup` קיים אבל איטי ומסובך לעומת SQL JOIN.
   אם יש הרבה יחסי 1:N — SQL יותר נוח.
3. **שימוש בזיכרון** — נוטה לאחסן מידע שלם ולא לעבוד בלחץ דיסק.

---

## 3. למה React ולא HTML/JS/CSS פשוט?

**3 יתרונות של React**:

1. **Components reusable** — מחלקים את ה-UI לחתיכות עצמאיות שאפשר להרכיב
   מחדש (`<Button/>`, `<Card/>`, `<Modal/>`). DRY ו-maintainable.
2. **State management מבוסס reactivity** — useState/useEffect גורמים לרינדור
   אוטומטי כשנתון משתנה. אין צורך לזכור לעדכן DOM ידנית בכל מקום.
3. **Virtual DOM + diffing** — React מחשב את ההפרש בין מצבי UI ומעדכן רק את
   החלקים ששונו. ב-vanilla JS הייתי כותב ידנית `element.innerHTML = ...`.

**1 חיסרון**:
- **bundle size + complexity** — React מוסיף ~100KB של ספרייה ובניית קוד דרך
   bundler. לאתר סטטי קטן זה overkill — HTML/CSS פשוטים יספיקו.

---

## 4. הבדל בין function ל-arrow function

| תכונה | `function` רגיל | `=>` arrow |
|---|---|---|
| **`this` binding** | דינמי — נקבע לפי מי שקורא לפונקציה | לקסיקלי — יורש מהסקופ שמסביב |
| **`arguments`** | יש (object דומה למערך) | אין — צריך rest `(...args) =>` |
| **constructor** | אפשר `new MyFunc()` | אסור — `new (() => {})` זורק שגיאה |
| **hoisting** | מורם לראש (function declaration) | לא — צריך להגדיר לפני שימוש |
| **method ב-object** | `this` עובד טוב | `this` יוצא מחוץ ל-object |

**דוגמה קריטית**:
```js
const obj = {
  count: 5,
  arrow: () => console.log(this.count),    // ❌ this = window, count = undefined
  normal() { console.log(this.count); }    // ✅ this = obj, count = 5
};
```

**מתי להשתמש בכל אחד**:
- `function` — כשצריך `this` דינמי, בעיקר ל-methods של objects/classes.
- arrow — לקריאות גלויות, callbacks (`array.map(x => x*2)`), והיכן ש-`this`
  צריך להישאר זה של ההורה (למשל בתוך useEffect).

---

## 5. הסבר על פונקציה רקורסיבית

**הגדרה**: פונקציה שקוראת לעצמה עם input קטן יותר עד שמגיעה למקרה בסיס.

**שני חלקים חיוניים**:
1. **Base case** — תנאי עצירה. בלעדיו → stack overflow.
2. **Recursive case** — קריאה לפונקציה עם input "קטן" יותר שמתקרב לבסיס.

**דוגמה — factorial**:
```js
function factorial(n) {
  if (n <= 1) return 1;          // base case
  return n * factorial(n - 1);   // recursive case
}
factorial(5); // → 5*4*3*2*1 = 120
```

**איך זה רץ**:
```
factorial(5)
 → 5 * factorial(4)
 →   5 * 4 * factorial(3)
 →     5 * 4 * 3 * factorial(2)
 →       5 * 4 * 3 * 2 * factorial(1)
 →         5 * 4 * 3 * 2 * 1
 → 120
```

**דוגמה שניה — סדרת פיבונאצ'י**:
```js
function fib(n) {
  if (n < 2) return n;                   // base case
  return fib(n - 1) + fib(n - 2);        // recursive case (×2)
}
fib(7); // → 13
```

**שתי בעיות אופייניות**:
- **חסר base case** → recursion infinite → stack overflow.
- **לא קטן יותר** (`factorial(n)` → `factorial(n)`) → גם stack overflow.

**מתי כדאי להשתמש**: עצים, גרפים, חלוקה-וכיבוש (mergesort, quicksort), בעיות
שטבעם רקורסיבי כמו "מצא את כל הקבצים בתת-תיקייה".

**מתי לא**: כשיש lookup פשוט עם loop. רקורסיה בעמודה עמוקה (n>10,000) תקפיץ
stack overflow ב-JS — עדיף iterative.

---

## ✅ סיכום מהיר לבחירה לפני המבחן

- **שאלה 1 (GET/POST/PUT/DELETE)**: זכור idempotency + body + cacheable.
- **שאלה 2 (MongoDB)**: 3 יתרונות (schemaless, JSON-native, scaling), 2 חסרונות (אין ACID חזק, אין JOIN חזק).
- **שאלה 3 (React vs vanilla)**: components, reactivity, virtual DOM. חיסרון: bundle size.
- **שאלה 4 (function vs arrow)**: this binding (דינמי vs לקסיקלי) הוא ההבדל הקריטי.
- **שאלה 5 (recursion)**: base case + recursive case. דוגמה: factorial / fib.
