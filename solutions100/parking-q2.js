// SV Parking — JS Q2 (25 pts)
// "מציאת רצפים שסכומם שווה למספר N"
// Function takes an array and a target N, returns all CONSECUTIVE
// subsequences whose sum equals N.

/**
 * @param {number[]} arr
 * @param {number} n
 * @returns {Array<{start:number, end:number, slice:number[]}>}
 */
function findSubsequencesSum(arr, n) {
  // ✅ FIXED: array validation
  if (!Array.isArray(arr)) {
    throw new TypeError(`expected an array, got ${typeof arr}`);
  }
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new TypeError(`target n must be a finite number`);
  }

  const result = [];
  // ✅ FIXED: brute-force O(n²) — works correctly with negative numbers
  // (sliding window doesn't handle negatives well)
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    for (let j = i; j < arr.length; j++) {
      const v = arr[j];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new TypeError(`array contains non-number at index ${j}: ${v}`);
      }
      sum += v;
      if (sum === n) {
        result.push({
          start: i,
          end: j,
          slice: arr.slice(i, j + 1),
        });
      }
    }
  }
  return result;
}

// ── self-tests ──
// console.assert(findSubsequencesSum([1,2,3,4,5], 9).length === 2); // [2,3,4] and [4,5]
// console.assert(findSubsequencesSum([], 0).length === 0);
// console.assert(findSubsequencesSum([5], 5).length === 1);
// console.assert(findSubsequencesSum([-1,2,-1,2,-1], 1).length > 0); // negatives work

module.exports = findSubsequencesSum;
