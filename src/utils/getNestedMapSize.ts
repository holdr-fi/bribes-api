export const getNestedMapSize = function getNestedMapSize(nestedMap: Map<any, Map<any, any>>): number {
  let size = 0;

  nestedMap.forEach((innerMap, _) => {
    size += innerMap.size;
  });

  return size;
};
