function isOrderedSubsequence(fullArray, partialArray) {
  let fullIndex = 0;
 
  for (const value of partialArray) {
    let found = false;
    while (fullIndex < fullArray.length) {
      if (fullArray[fullIndex] === value) {
        found = true;
        fullIndex++;
        break;
      }
      fullIndex++;
    }
    if (!found) return false;
  }
 
  return true;
}
 
console.log(isOrderedSubsequence([1, 2, 3, 4], [1, 3, 4])); // true
console.log(isOrderedSubsequence([1, 2, 3, 4], [2, 4]));    // true
console.log(isOrderedSubsequence([1, 2, 3, 4], [4, 2]));    // false
