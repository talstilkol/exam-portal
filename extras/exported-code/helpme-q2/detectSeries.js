function detectSeries(values) {
  if (!Array.isArray(values)) throw new Error("Input must be an array");
  if (values.some(v => typeof v !== "number" || Number.isNaN(v))) {
    throw new Error("All values must be numbers");
  }
  if (values.length < 3) return "D";
 
  const arithmeticDiff = values[1] - values[0];
  const isArithmetic = values.every((v, i) => i === 0 || v - values[i - 1] === arithmeticDiff);
  if (isArithmetic) return "A";
 
  const ratio = values[0] === 0 ? null : values[1] / values[0];
  const isGeometric = ratio !== null && values.every((v, i) => i === 0 || values[i - 1] !== 0 && v / values[i - 1] === ratio);
  if (isGeometric) return "B";
 
  const isFibonacci = values.every((v, i) => i < 2 || v === values[i - 1] + values[i - 2]);
  if (isFibonacci) return "C";
 
  return "D";
}
 
console.log(detectSeries([2, 4, 6, 8]));      // A
console.log(detectSeries([2, 6, 18, 54]));    // B
console.log(detectSeries([1, 1, 2, 3, 5]));   // C
console.log(detectSeries([1, 4, 9, 16]));     // D
 
export default detectSeries;
