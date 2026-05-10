// Travel-SV — JS Q2 (25 pts)
// "האם מערך חלקי מופיע במערך שלם לפי סדר"
// Returns true if all elements of `sub` appear in `full` IN ORDER
// (not necessarily contiguous — just preserved order).

/**
 * @param {Array<*>} full
 * @param {Array<*>} sub
 * @returns {boolean}
 */
function subArrayInOrder(full, sub) {
  if (!Array.isArray(full)) {
    throw new TypeError(`full must be an array, got ${typeof full}`);
  }
  if (!Array.isArray(sub)) {
    throw new TypeError(`sub must be an array, got ${typeof sub}`);
  }
  // ✅ FIXED: empty sub is always trivially present
  if (sub.length === 0) return true;
  // ✅ FIXED: longer sub than full → impossible
  if (sub.length > full.length) return false;

  // Two-pointer linear scan: O(full.length)
  let j = 0; // pointer into sub
  for (let i = 0; i < full.length && j < sub.length; i++) {
    // Use strict equality; for objects, the user must pass identical references
    if (full[i] === sub[j]) {
      j++;
    }
  }
  return j === sub.length;
}

/**
 * Bonus — returns the indexes in `full` where `sub` was matched (if any).
 */
function subArrayInOrderWithIndexes(full, sub) {
  const idx = [];
  let j = 0;
  for (let i = 0; i < full.length && j < sub.length; i++) {
    if (full[i] === sub[j]) {
      idx.push(i);
      j++;
    }
  }
  return j === sub.length ? idx : null;
}

// ── self-tests ──
// console.assert(subArrayInOrder([1,2,3,4,5], [2,4]) === true);
// console.assert(subArrayInOrder([1,2,3,4,5], [4,2]) === false); // wrong order
// console.assert(subArrayInOrder([1,2,3], []) === true);
// console.assert(subArrayInOrder([], [1]) === false);
// console.assert(subArrayInOrder([1,2,3], [1,2,3]) === true);

module.exports = { subArrayInOrder, subArrayInOrderWithIndexes };
