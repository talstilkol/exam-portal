// SV Bank — JS Q2 (20 pts)
// "מיון ספרות ללא sort" — sort an array of numbers in ascending order
// WITHOUT using Array.prototype.sort()
//
// Implementation: insertion sort (stable, O(n²), early-exit safe)

/**
 * @param {number[]} arr — input array (will not be mutated)
 * @returns {number[]} new sorted array
 */
function sortNoSort(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError(`expected array, got ${typeof arr}`);
  }
  // ✅ Empty/single-element handling (no work needed)
  if (arr.length < 2) return arr.slice();

  // Validate all elements are numbers
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== "number" || !Number.isFinite(arr[i])) {
      throw new TypeError(`element at ${i} is not a finite number`);
    }
  }

  const out = arr.slice(); // don't mutate input
  // ✅ Insertion sort — stable, simple, O(n²) worst case
  for (let i = 1; i < out.length; i++) {
    const current = out[i];
    let j = i - 1;
    while (j >= 0 && out[j] > current) {
      out[j + 1] = out[j];
      j--;
    }
    out[j + 1] = current;
  }
  return out;
}

// ✅ Bonus: bubble sort with early-exit (alternative implementation)
function bubbleSort(arr) {
  const out = arr.slice();
  for (let i = 0; i < out.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < out.length - i - 1; j++) {
      if (out[j] > out[j + 1]) {
        [out[j], out[j + 1]] = [out[j + 1], out[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // already sorted, exit early
  }
  return out;
}

// ── self-tests ──
// console.assert(JSON.stringify(sortNoSort([3,1,2])) === '[1,2,3]');
// console.assert(JSON.stringify(sortNoSort([])) === '[]');
// console.assert(JSON.stringify(sortNoSort([5])) === '[5]');
// console.assert(JSON.stringify(sortNoSort([-1,5,0,-3])) === '[-3,-1,0,5]');

module.exports = { sortNoSort, bubbleSort };
