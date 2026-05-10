// Football Club — JS Q2 (25 pts)
// "סכום לפי אורך מספר" — function takes an array of numbers and returns
// an object whose keys are digit-lengths and values are the sums of numbers
// with that digit-length.
//
// Example:
//   sumByDigitLength([1, 15, 30, 5, 800])  →  { 1: 6, 2: 45, 3: 800 }
//   (1+5=6 are 1-digit; 15+30=45 are 2-digit; 800 is 3-digit)
//
// Spec note: throws a relevant error if any value is not a number.

/**
 * @param {number[]} arr
 * @returns {Record<number, number>}
 * @throws {TypeError} if any element is not a finite number
 */
function sumByDigitLength(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError(`expected an array, got ${typeof arr}`);
  }
  const out = {};
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    // ✅ FIXED: throw a relevant error per spec for non-numbers
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new TypeError(
        `value at index ${i} is not a finite number: ${JSON.stringify(v)}`
      );
    }
    // ✅ FIXED: use Math.abs so negative numbers don't count the "-" sign
    // and so -0 and 0 are equivalent
    const len = String(Math.abs(v)).length;
    out[len] = (out[len] || 0) + v;
  }
  return out;
}

// ── self-tests (uncomment to verify before submission) ──
// console.assert(JSON.stringify(sumByDigitLength([1,15,30,5,800])) === '{"1":6,"2":45,"3":800}');
// console.assert(JSON.stringify(sumByDigitLength([])) === '{}');
// console.assert(JSON.stringify(sumByDigitLength([-1,-5,3])) === '{"1":-3}'); // -1+-5+3 = -3
// try { sumByDigitLength([1,"x",3]); console.assert(false); } catch (e) { console.assert(e instanceof TypeError); }

module.exports = sumByDigitLength;
