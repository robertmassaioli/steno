import { isPresent } from "ts-is-present";
import { ParsedStenoDictionary, StenoDictionary } from "./data";
import { astIs, getParser, getTextAt } from "./dictionary-format/lexer";
import _ from 'lodash';
import { InvertedLookup, PrefixLookup, createLookup, createPrefixLookupFS } from "./lookup";
import { makeCandidatesFromRules } from "./orthography";

export class DictionaryLookup {
  private dictionary: ParsedStenoDictionary;
  private verbatimLookup: InvertedLookup;
  private suffixStrokes: ParsedStenoDictionary;
  private prefixStrokes: ParsedStenoDictionary;

  constructor(dictionary: StenoDictionary) {
    const parser = getParser();

    this.dictionary = _.pickBy(_.mapValues(dictionary, v => parser.getAST(v, 'outline')), isPresent);

    const lowerVertatimEntries = _.reduce<ParsedStenoDictionary, StenoDictionary>(this.dictionary, (result, v, k) => {
      if (isPresent(v) && astIs(v, ['outline', 'atom', 'verbatim'])) {
        result[k] = v.text.toLocaleLowerCase();
      }

      return result;
    }, {});
    console.log('verbatim entries', Object.keys(lowerVertatimEntries).length);
    this.verbatimLookup = createLookup(lowerVertatimEntries);

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

    /*
    // Using the prefix and suffix strokes, and the orthography rules,
    // see if I can get it working
    const startWords = this.prefixLookup[lowerText];
    if (startWords.length > 0) {
      // Should use the start words to generate the candidates
      const suffixCandidates = _.mapValues(this.suffixStrokes, token => {
        if (isPresent(token)) {
          const suffixText = getTextAt(token, ['outline', 'atom', 'metaCommand', 'attachMetaCommand', 'attachStart']);
          if (!isPresent(suffixText)) {
            return null;
          }
          return startWords.map(match => {
            return {
              match,
              candidates: makeCandidatesFromRules(match.fullText, suffixText)
            };
          })
        }

        return token;
      });

      function getMatchingCandidates(): Array<string> {
        const results = new Array<string>();

        Object.entries(suffixCandidates).forEach(([stroke, started]) => {
          if (!isPresent(started)) {
            return false;
          }

          started.forEach(start => {
            if (start.candidates.find(c => c === lowerText)) {
              results.push(`${start.match.stroke}/${stroke}`);
            }
          });
        });

        return results;
      }

      const matching = getMatchingCandidates();
      if (matching.length > 0) {
        return matching;
      }
    }

    // Found no results
    */
    return [];
  }
}