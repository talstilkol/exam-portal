function sumByDigitLength(numbers) {
  if (!Array.isArray(numbers)) {
    throw new Error("Input must be an array");
  }
 
  const result = {};
 
  for (const value of numbers) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error("All values must be numbers");
    }
 
    const length = String(Math.abs(value)).replace(".", "").length;
    result[length] = (result[length] || 0) + value;
  }
 
  return result;
}
 
console.log(sumByDigitLength([1, 15, 30, 5, 800]));
// { 1: 6, 2: 45, 3: 800 }
