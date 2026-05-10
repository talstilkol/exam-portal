function countUniqueEvenOdd(numbers) {
  if (!Array.isArray(numbers)) throw new Error("Input must be array");
 
  const checked = [];
  let even = 0;
  let odd = 0;
 
  for (const num of numbers) {
    if (typeof num !== "number" || Number.isNaN(num)) throw new Error("All values must be numbers");
    if (checked.includes(num)) continue;
    checked.push(num);
    if (num % 2 === 0) even++;
    else odd++;
  }
 
  return { even, odd, total: numbers.length };
}
 
const numbersArray = [6, 3, 3, 4, 13, 6, 7, 18, 7, 11];
console.log(countUniqueEvenOdd(numbersArray));
// { even: 3, odd: 4, total: 10 }
