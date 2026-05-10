function fibonacciPosition(finalValue, first, second) {
  if (![finalValue, first, second].every(Number.isFinite)) {
    throw new Error("all values must be numbers");
  }
 
  let position = 1;
  let a = first;
  let b = second;
 
  if (finalValue === a) return 1;
  if (finalValue === b) return 2;
 
  position = 2;
  while (b < finalValue) {
    const next = a + b;
    a = b;
    b = next;
    position++;
    if (b === finalValue) return position;
  }
 
  return -1; // הערך לא נמצא בסדרה
}
 
console.log(fibonacciPosition(19, 2, 5)); // 5: 2,5,7,12,19
