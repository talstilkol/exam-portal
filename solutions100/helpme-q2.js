// HelpMe — JS Q2 (25 pts)
// "זיהוי סוג סדרה" — return one of: 'arithmetic' | 'geometric' | 'fibonacci' | 'other'
//
// Spec rules:
//   arithmetic: a[i+1] - a[i] is constant
//   geometric:  a[i+1] / a[i] is constant (and a[i] !== 0)
//   fibonacci:  a[i] === a[i-1] + a[i-2]  for all i >= 2
//   otherwise:  'other'
//
// Order: arithmetic → geometric → fibonacci → other (per spec)

/** @param {number[]} a */
function isArithmetic(a) {
  if (a.length < 2) return false;
  const d = a[1] - a[0];
  for (let i = 2; i < a.length; i++) {
    if (a[i] - a[i - 1] !== d) return false;
  }
  return true;
}

/** @param {number[]} a */
function isGeometric(a) {
  if (a.length < 2) return false;
  // ✅ FIXED: guard against 0-divisor — geometric series can't have 0
  if (a.some((v) => v === 0)) return false;
  const r = a[1] / a[0];
  for (let i = 2; i < a.length; i++) {
    // float-safe comparison
    if (Math.abs(a[i] / a[i - 1] - r) > 1e-9) return false;
  }
  return true;
}

/** @param {number[]} a */
function isFibonacci(a) {
  if (a.length < 3) return false;
  for (let i = 2; i < a.length; i++) {
    if (a[i] !== a[i - 1] + a[i - 2]) return false;
  }
  return true;
}

/**
 * @param {number[]} arr
 * @returns {'arithmetic'|'geometric'|'fibonacci'|'other'}
 */
function sequenceType(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError("expected an array of numbers");
  }
  if (arr.length < 3) {
    // spec: minimum 3 elements to determine a series type
    throw new RangeError("array must have at least 3 elements");
  }
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== "number" || !Number.isFinite(arr[i])) {
      throw new TypeError(`element at ${i} is not a finite number`);
    }
  }
  // ✅ FIXED: order — arithmetic first, then geometric, then fibonacci
  if (isArithmetic(arr)) return "arithmetic";
  if (isGeometric(arr))  return "geometric";
  if (isFibonacci(arr))  return "fibonacci";
  return "other";
}

// ── self-tests ──
// console.assert(sequenceType([1,3,5,7])      === 'arithmetic');
// console.assert(sequenceType([2,4,8,16])     === 'geometric');
// console.assert(sequenceType([1,1,2,3,5,8])  === 'fibonacci');
// console.assert(sequenceType([1,2,4,7])      === 'other');
// try { sequenceType([1,2]); console.assert(false); } catch (e) { console.assert(e instanceof RangeError); }

module.exports = { sequenceType, isArithmetic, isGeometric, isFibonacci };
