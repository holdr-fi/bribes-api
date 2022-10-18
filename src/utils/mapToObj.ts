// eslint-disable-next-line
export const mapToObj = function mapToObj(map: Map<any, any>) {
  return Array.from(map).reduce((obj, [key, value]) => {
    if (value instanceof Set) {
      obj[key] = Array.from(value);
    } else {
      obj[key] = value;
    }
    return obj;
  }, {});
};
