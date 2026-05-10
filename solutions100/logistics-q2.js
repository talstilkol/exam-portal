// Logistics — JS Q2 (25 pts)
// "בינארי לדצימלי ואז פלינדרום"
// Function takes array of 0/1 (binary), converts to decimal,
// and returns true if the decimal is a palindrome string.

/**
 * @param {number[]} bits — array containing only 0 and 1
 * @returns {{decimal:number, isPalindrome:boolean, decString:string}}
 */
function binaryPalindrome(bits) {
  if (!Array.isArray(bits)) {
    throw new TypeError(`expected an array of 0/1, got ${typeof bits}`);
  }
  if (bits.length === 0) {
    return { decimal: 0, isPalindrome: false, decString: "" };
  }
  // ✅ FIXED: validate that array contains ONLY 0 or 1
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== 0 && bits[i] !== 1) {
      throw new TypeError(`element at ${i} is not 0 or 1: ${JSON.stringify(bits[i])}`);
    }
  }

  // ✅ Convert binary array to decimal
  // Use parseInt for clarity (built-in path) — equivalent manual:
  //   bits.reduce((s,b,i) => s + b * 2 ** (bits.length - 1 - i), 0)
  const decimal = parseInt(bits.join(""), 2);
  const decString = String(decimal);

  // ✅ Check palindrome on the DECIMAL string
  const reversed = decString.split("").reverse().join("");
  const isPalindrome = decString === reversed;

  return { decimal, isPalindrome, decString };
}

// ── self-tests ──
// console.assert(binaryPalindrome([1,0,1,1,0,1]).decimal === 45);  // spec example
// console.assert(binaryPalindrome([1,0,1,1,0,1]).isPalindrome === false);
// console.assert(binaryPalindrome([1,0,1,1,0,0,1]).decimal === 89);
// console.assert(binaryPalindrome([1,0,0,0,1]).decimal === 17); // not palindrome (17 ≠ 71)
// try { binaryPalindrome([1,2]); console.assert(false); } catch (e) { console.assert(e instanceof TypeError); }

module.exports = binaryPalindrome;
