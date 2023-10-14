export type StenoConfig = {
  ploverAssetsDir: string;
};

export type ValidationErrors = {
  validationErrors: Array<string>;
}

export function isValidationErrors<T>(t: T | ValidationErrors): t is ValidationErrors {
  return t !== null && typeof t === 'object' && 'validationErrors' in t;
}

export interface DictionaryConfig {
  enabled: boolean;
  path: string;
}