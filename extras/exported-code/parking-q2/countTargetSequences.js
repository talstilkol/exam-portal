function countTargetSequences(numbers, target) {
  if (!Array.isArray(numbers)) throw new Error("numbers must be array");
  if (typeof target !== "number") throw new Error("target must be number");
 
  let count = 0;
 
  for (let start = 0; start < numbers.length; start++) {
    let sum = 0;
 
    for (let end = start; end < numbers.length; end++) {
      if (typeof numbers[end] !== "number" || Number.isNaN(numbers[end])) {
        throw new Error("all array values must be numbers");
      }
 
      sum += numbers[end];
 
      if (end - start + 1 >= 2 && sum === target) {
        count++;
      }
    }
  }
 
  return count;
}
 
console.log(countTargetSequences([1, 2, 3, 4, 5, 1], 6)); // 2
