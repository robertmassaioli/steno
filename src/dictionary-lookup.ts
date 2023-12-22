import { isPresent } from "ts-is-present";
import { ParsedStenoDictionary, StenoDictionary } from "./data";
import { astIs, getParser } from "./dictionary-format/lexer";
import _ from 'lodash';
import { InvertedLookup, createLookup } from "./lookup";

export class DictionaryLookup {
  private dictionary: ParsedStenoDictionary;
  private verbatimLookup: InvertedLookup;
  private suffixStrokes: ParsedStenoDictionary;
  private prefixStrokes: ParsedStenoDictionary;

  constructor(dictionary: StenoDictionary) {
    const parser = getParser();

    this.dictionary = _.pickBy(_.mapValues(dictionary, v => parser.getAST(v, 'outline')), isPresent);

    this.verbatimLookup = createLookup(_.mapValues(this.dictionary, v => isPresent(v) ? v.text.toLocaleLowerCase() : ''));

    this.suffixStrokes = _.pickBy(this.dictionary, ast => {
      return isPresent(ast) && astIs(ast, ['outline', 'atom', 'metaCommand', 'attachMetaCommand', 'attachStart']);
    });

    this.prefixStrokes = _.pickBy(this.dictionary, ast => {
      return isPresent(ast) && astIs(ast, ['outline', 'atom', 'metaCommand', 'attachMetaCommand', 'attachEnd']);
    });
  }

  public getPrefixStrokes() {
    return this.prefixStrokes;
  }

  public getSuffixStrokes() {
    return this.suffixStrokes;
  }

  public getParsedDictionary() {
    return this.dictionary;
  }

  /**
   * The purpose of this function is to find strokes that will
   * generate the text given. The input text should not contain special
   * characters or numbers. This function should be used to see if a
   * "reasonable" dictionary word is achievable by the provided dictionary.
   * @param text The text that the user wants to output.
   */
  public lookupStrokesForWord(text: string): Array<string> {
    // Try looking up directly first
    const lowerText = text.toLocaleLowerCase();
    if (isPresent(this.verbatimLookup[lowerText])) {
      return this.verbatimLookup[lowerText];
    }

    // Found no results
    return [];
  }
}