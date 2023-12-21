import { isPresent } from "ts-is-present";
import { ParsedStenoDictionary, StenoDictionary } from "./data";
import { astIs, getParser } from "./dictionary-format/lexer";
import _ from 'lodash';

export class DictionaryLookup {
  private dictionary: ParsedStenoDictionary;
  private suffixStrokes: ParsedStenoDictionary;
  private prefixStrokes: ParsedStenoDictionary;

  constructor(dictionary: StenoDictionary) {
    const parser = getParser();

    this.dictionary = _.pickBy(_.mapValues(dictionary, v => parser.getAST(v, 'outline')), isPresent);

    this.suffixStrokes = _.pickBy(this.dictionary, ast => {
      return astIs(ast, ['outline', 'metaCommand', 'attachMetaCommand', 'attachStart']);
    });

    this.prefixStrokes = _.pickBy(this.dictionary, ast => {
      return astIs(ast, ['outline', 'metaCommand', 'attachMetaCommand', 'attachEnd']);
    });
  }

  public getPrefixStrokes() {
    return this.prefixStrokes;
  }

  public getSuffixStrokes() {
    return this.suffixStrokes;
  }
}