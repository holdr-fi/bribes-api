// Slice array into equal slices of 'sliceLength' length.
export const arraySlicer = function arraySlicer(array: any[], sliceLength: number): any[][] {
  const sliced_arrays: any[] = [];
  const length = array.length;
  if (length % sliceLength !== 0) {
    throw new Error(`Cannot slice array into equal slices of ${sliceLength} each`);
  }
  for (let i = 0; i < length; i++) {
    sliced_arrays.push(array.slice(i * sliceLength, (i + 1) * sliceLength));
  }
  return sliced_arrays;
};
