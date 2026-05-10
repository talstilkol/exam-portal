function binaryToDecimalPalindrome(bits) {
  if (!Array.isArray(bits)) throw new Error("Input must be an array");
  if (bits.some(bit => bit !== 0 && bit !== 1)) throw new Error("Array must contain only 0 and 1");
 
  let decimal = 0;
 
  for (let i = 0; i < bits.length; i++) {
    const bit = bits[bits.length - 1 - i];
    if (bit === 1) decimal += 2 ** i;
  }
 
  const text = String(decimal);
  const reversed = text.split("").reverse().join("");
  return text === reversed;
}
 
console.log(binaryToDecimalPalindrome([1, 0, 1, 1, 0, 1])); // 45 => false
console.log(binaryToDecimalPalindrome([1, 0, 0, 1]));       // 9 => true
