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

/**
 * The dictionary format is well documented here: https://www.openstenoproject.org/learn-plover/appendix-the-dictionary-format.html
 */
export type StenoDictionary = {
  [strokes: string]: string;
};

export type LoadedDictionary = {
  config: DictionaryConfig;
  dictionary: StenoDictionary;
}

export type DictionaryStats = {
  definedEntries: number;
  uniqueWordCount: number;
  definitionsByStrokeCount: { [strokes: number]: number };
}