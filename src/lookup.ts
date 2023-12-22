export type InputObject = Record<string, string>;
export type InvertedLookup = Record<string, string[]>;

export function createLookup(inputObject: InputObject): InvertedLookup {
  const result: InvertedLookup = {};

  for (const [key, value] of Object.entries(inputObject)) {
    if (result.hasOwnProperty(value)) {
      result[value].push(key);
    } else {
      result[value] = [key];
    }
  }

  return result;
}