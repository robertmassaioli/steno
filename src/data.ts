import { IToken } from "ebnf";

export enum ErrorCodes {
  StenoConfigValidationError = 1,
  PloverConfigPathError,
  PloverConfigReadError,
};

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

export type ParsedStenoDictionary = {
  [strokes: string]: IToken;
};

export type LoadedDictionary = {
  config: DictionaryConfig;
  dictionary: StenoDictionary;
}

export type DictionaryStats = {
  definedEntries: number;
  uniqueWordCount: number;
  entriesByStrokeCount: { [strokes: number]: number };
  // I want to have an approximation of the stroke intensity for output gained for true wpm
  // The value should be the average number of strokes required to get that many characters
  charactersPerStroke: { [characters: number]: Array<number> };
}