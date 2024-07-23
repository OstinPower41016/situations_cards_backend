export default (arr: any[], count: number) => {
  let result = new Array(count);
  let len = arr.length;
  let taken = new Array(len);

  if (count > len)
    throw new RangeError(
      'getRandomElements: more elements taken than available',
    );

  while (count--) {
    let x = Math.floor(Math.random() * len);
    result[count] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};
