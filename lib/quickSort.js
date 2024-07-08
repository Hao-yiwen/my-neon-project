function quicksort(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];

  for (const el of arr.slice(0, arr.length - 1)) {
    if (el < pivot) {
      left.push(el);
    } else {
      right.push(el);
    }
  }

  return [...quicksort(left), pivot, ...quicksort(right)];
}

module.exports = quicksort;