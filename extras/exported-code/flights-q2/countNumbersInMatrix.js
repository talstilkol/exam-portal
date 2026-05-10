function countNumbersInMatrix(matrix) {
  if (!Array.isArray(matrix)) throw new Error("matrix must be array");
 
  const counters = new Map();
 
  for (const row of matrix) {
    if (!Array.isArray(row)) throw new Error("each row must be array");
    for (const value of row) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error("matrix values must be numbers");
      }
      counters.set(value, (counters.get(value) || 0) + 1);
    }
  }
 
  return [...counters.entries()].map(([num, count]) => ({ num, count }));
}
 
const matrix = [
  [1, 1, 2, 4, 1, 1, 7],
  [1, 1, 1, 2, 1, 1, 7],
  [7, 7, 1, 1, 1, 1, 1]
];
console.log(countNumbersInMatrix(matrix));
