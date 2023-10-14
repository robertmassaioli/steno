export type StenoConfig = {
  ploverAssetsDir: string;
};

export type ValidationErrors = {
  validationErrors: Array<string>;
}

export function isValidationErrors<T>(t: T | ValidationErrors): t is ValidationErrors {
  return t !== null && typeof t === 'object' && 'validationErrors' in t;
}

export type PloverConfig = {
  dictionaries: Array<DictionaryConfig>;
};

export type DictionaryConfig = {
  enabled: boolean;
  path: string;
};