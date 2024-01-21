import { isPresent } from "ts-is-present";
import { astIs, getParser } from "../dictionary-format/lexer";
import { getStenoConfigOrPrintErrors, mergeDictionaries, readPloverConfigOrPrintErrors } from "./command-common";
import _ from 'lodash';
import { ParsedStenoDictionary, StenoDictionary } from "../data";
import { createPrefixLookupFS } from "../lookup";

export const GEN_DIR = ".steno-generated";

export async function runPrepareCommand() {
  const stenoConfig = await getStenoConfigOrPrintErrors();
  const ploverConfig = await readPloverConfigOrPrintErrors(stenoConfig);
  const mergedDictionary = await mergeDictionaries(stenoConfig, ploverConfig.dictionaries);

  const parser = getParser();
  const parsedDictionary = _.pickBy(_.mapValues(mergedDictionary, v => parser.getAST(v, 'outline')), isPresent);

    const lowerVertatimEntries = _.reduce<ParsedStenoDictionary, StenoDictionary>(parsedDictionary, (result, v, k) => {
      if (isPresent(v) && astIs(v, ['outline', 'atom', 'verbatim'])) {
        result[k] = v.text.toLocaleLowerCase();
      }

      return result;
    }, {});

    await createPrefixLookupFS(lowerVertatimEntries, GEN_DIR);
}