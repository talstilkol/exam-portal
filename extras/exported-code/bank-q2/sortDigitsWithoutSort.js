function sortDigitsWithoutSort(num) {
  if (!Number.isInteger(num) || num < 0) throw new Error("num must be positive integer");
 
  const counts = Array(10).fill(0);
  const digits = String(num);
 
  for (const ch of digits) {
    counts[Number(ch)]++;
  }
 
  let result = "";
  for (let digit = 0; digit <= 9; digit++) {
    result += String(digit).repeat(counts[digit]);
  }
 
  return Number(result);
}
 
console.log(sortDigitsWithoutSort(642531)); // 123456
