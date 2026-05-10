// Currency Exchange — JS Q2 (20 pts)
// "מיקום בסדרת פיבונאצ׳י מותאמת"
// Function takes 3 numbers: target, a (1st value), b (2nd value).
// Returns the position of `target` in a custom Fibonacci sequence
// that starts with a, b (i.e. a, b, a+b, b+(a+b), ...).
//
// Spec example: position(2, 5, 19) → 5
//   Sequence:   2, 5, 7, 12, 19   →  19 is at index 5 (1-based)

/**
 * @param {number} a       first value of the sequence
 * @param {number} b       second value of the sequence
 * @param {number} target  value to find
 * @returns {number} 1-based position, or -1 if target is not in the sequence
 */
function fibonacciPosition(a, b, target) {
  // Validate inputs
  for (const [name, v] of [["a", a], ["b", b], ["target", target]]) {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new TypeError(`${name} must be a finite number, got ${v}`);
    }
  }

  // ✅ FIXED: handle edges where target equals one of the first two
  if (target === a) return 1;
  if (target === b) return 2;

  // ✅ FIXED: if target is below both a AND b, it can never appear (sequence grows)
  // (only if both a,b are >= 0 — for safety we still loop with iteration cap)
  if (target < a && target < b) return -1;

  let prev = a;
  let curr = b;
  let idx = 2;
  // Cap iterations to avoid infinite loop (e.g. a=0, b=0)
  const MAX_ITER = 1000;
  while (curr < target && idx < MAX_ITER) {
    const next = prev + curr;
    // safety: if not increasing, abort
    if (!Number.isFinite(next) || next <= curr) return -1;
    prev = curr;
    curr = next;
    idx++;
  }

  return curr === target ? idx : -1;
}

// ── self-tests ──
// console.assert(fibonacciPosition(2, 5, 19) === 5);   // spec example
// console.assert(fibonacciPosition(0, 1, 8) === 7);    // classic Fib: 0,1,1,2,3,5,8 → 8 at index 7
// console.assert(fibonacciPosition(1, 1, 13) === 7);   // 1,1,2,3,5,8,13 → 13 at index 7
// console.assert(fibonacciPosition(1, 2, 100) === -1); // not in sequence

module.exports = fibonacciPosition;
