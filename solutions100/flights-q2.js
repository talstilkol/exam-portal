// Flights — JS Q2 (25 pts)
// "ספירת מספרים במטריצה" — count occurrences of `target` in 2D matrix

/**
 * @param {number[][]} matrix
 * @param {number} target
 * @returns {{count:number, positions:Array<{row:number, col:number}>}}
 */
function countMatrix(matrix, target) {
  if (!Array.isArray(matrix)) {
    throw new TypeError(`expected a matrix (2D array), got ${typeof matrix}`);
  }
  if (typeof target !== "number" || !Number.isFinite(target)) {
    throw new TypeError(`target must be a finite number`);
  }

  let count = 0;
  const positions = [];

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) {
      throw new TypeError(`row ${r} is not an array`);
    }
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      // ✅ FIXED: throw on non-numeric values per spec
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new TypeError(`non-number at [${r}][${c}]: ${JSON.stringify(v)}`);
      }
      if (v === target) {
        count++;
        positions.push({ row: r, col: c });
      }
    }
  }
  return { count, positions };
}

// ── self-tests ──
// console.assert(countMatrix([[1,2],[2,3]], 2).count === 2);
// console.assert(countMatrix([], 5).count === 0);
// try { countMatrix([[1,'x']], 2); console.assert(false); } catch (e) { console.assert(e instanceof TypeError); }

module.exports = countMatrix;
