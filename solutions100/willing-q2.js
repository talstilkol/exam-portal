// Willing — JS Q2 (35 pts)
// "ספירת זוגיים/אי זוגיים ייחודיים"
// Counts UNIQUE even and odd numbers in an array (not duplicates).

/**
 * @param {number[]} arr
 * @returns {{even:number, odd:number, evenList:number[], oddList:number[]}}
 */
function uniqueEvenOdd(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError(`expected array, got ${typeof arr}`);
  }
  // Validate types
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] !== "number" || !Number.isFinite(arr[i])) {
      throw new TypeError(`element at ${i} is not a finite number: ${arr[i]}`);
    }
    if (!Number.isInteger(arr[i])) {
      throw new TypeError(`element at ${i} is not an integer: ${arr[i]}`);
    }
  }

  // ✅ FIXED: dedupe with Set BEFORE counting
  const unique = Array.from(new Set(arr));
  const evenList = unique.filter((n) => n % 2 === 0);
  const oddList  = unique.filter((n) => n % 2 !== 0);

  return {
    even: evenList.length,
    odd:  oddList.length,
    evenList,
    oddList,
  };
}

// ── self-tests ──
// console.assert(uniqueEvenOdd([1,2,3,4,2,1]).even === 2); // {2,4} unique
// console.assert(uniqueEvenOdd([1,2,3,4,2,1]).odd === 2);  // {1,3} unique
// console.assert(uniqueEvenOdd([]).even === 0);
// console.assert(uniqueEvenOdd([-3,-2,-1,0,1,2,3]).even === 4); // {-2,0,2} ... wait actually {-2,0,2} is 3 -- let me verify
// // unique([-3,-2,-1,0,1,2,3]) = [-3,-2,-1,0,1,2,3]
// // even: [-2,0,2] = 3
// // odd:  [-3,-1,1,3] = 4

module.exports = uniqueEvenOdd;
