import { isPresent } from "ts-is-present";
import { getEnabledJsonDictionaries, getStenoConfigOrPrintErrors, readPloverConfigOrPrintErrors } from "./command-common";
import { calculateLength, isCalculationError } from "../outline-length";
import { getParser } from "../dictionary-format/lexer";
import { DictionaryStats, LoadedDictionary } from "../data";
import { loadDictionaries } from "../loaders";
import { formatCharacters } from "../hexadecimal";
import _ from 'lodash';
import { DictionaryLookup } from "../dictionary-lookup";
import { IToken } from "ebnf";

function astCompator(a: IToken | null, b: IToken | null): number {
  if (a === null) {
    return -1;
  }

  if (b === null) {
    return -1;
  }

  return a.text.localeCompare(b.text);
}

export async function runInfoCommand() {
  const stenoConfig = await getStenoConfigOrPrintErrors();
  const ploverConfig = await readPloverConfigOrPrintErrors(stenoConfig);

  console.log(`## Plover Configuration`);
  console.log('');

  const { dictionaries } = ploverConfig;
  console.log(`You have ${dictionaries.length} dictionaries configured in Plover, in the following order:`);
  dictionaries.forEach(d => {
    console.log(` - ${d.path} ${d.enabled ? '' : ' (disabled)'}`);
  });
  console.log('');

  const enabledJsonDictionaries = getEnabledJsonDictionaries(dictionaries);
  const loadedDictionaries = await loadDictionaries(stenoConfig, enabledJsonDictionaries);

  // For each dictionary, how many unique outputs? How many suffixes and prefixes? What is the distribution?
  console.log('## Individual JSON Dictionary Statistics');
  console.log();
  loadedDictionaries.forEach(d => {
    console.log(` - ${d.config.path}`);
    const dictionaryLookup = new DictionaryLookup(d.dictionary);
    const stats = calculateDictionaryStats(dictionaryLookup, d);
    const uniqueToTotal = stats.uniqueWordCount / stats.definedEntries * 100;
    console.log(`   - Unique Entries: ${stats.uniqueWordCount} / ${stats.definedEntries} (${uniqueToTotal.toFixed(2)}%)`);
    console.log(`   - Entries by Stroke Count:`);
    Object.keys(stats.entriesByStrokeCount).sort((a, b) => parseInt(a) - parseInt(b)).forEach(strokes => {
      console.log(`     - ${strokes}: ${stats.entriesByStrokeCount[parseInt(strokes)]} entries`);
    });
    console.log(`   - Characters per stroke:`);
    const averages = _.mapValues(stats.charactersPerStroke, vs => _.sum(vs) / vs.length);
    Object.keys(averages).sort((a, b) => parseInt(a) - parseInt(b)).forEach(characters => {
      console.log(`     - ${characters} characters => ${averages[parseInt(characters)].toFixed(2)} strokes (ave)`);
    });
    const prefixStrokes = dictionaryLookup.getPrefixStrokes();
    console.log(`   - Found ${Object.keys(prefixStrokes).length} prefix strokes.`);
    Object.entries(prefixStrokes).sort(([_aKey, aToken], [_bKey, bToken]) => {
      return astCompator(aToken, bToken);
    }).forEach(([key, ast]) => {
      if (isPresent(ast)) {
        console.log(`     - ${ast.text} (${key})`);
      }
    });
    const suffixStrokes = dictionaryLookup.getSuffixStrokes();
    console.log(`   - Found ${Object.keys(suffixStrokes).length} suffix strokes.`);
    Object.entries(suffixStrokes).sort(([_aKey, aToken], [_bKey, bToken]) => {
      return astCompator(aToken, bToken);
    }).forEach(([key, ast]) => {
      if (isPresent(ast)) {
        console.log(`     - ${ast.text} (${key})`);
      }
    });
    // TODO Calculate average characters per stroke for the whole dictionary,
    // also need to keep track of how many entries went into the average so that we
    // don't get swayed by outliers.
  });
}

function calculateDictionaryStats(dictionaryLookup: DictionaryLookup, d: LoadedDictionary): DictionaryStats {
  const { dictionary } = d;

  const allOutputs = Object.values(dictionary);
  const uniqueWords = new Set<string>(allOutputs);

  const allKeys = Object.keys(dictionary);
  const entriesByStrokeCount: { [strokes: number]: number } = {};
  allKeys.forEach(key => {
    const strokes = key.split('/').length;
    entriesByStrokeCount[strokes] = (entriesByStrokeCount[strokes] || 0) + 1;
  });

  // How many characters are output
  const charactersPerStroke: { [characters: number]: Array<number> } = {};
  Object.entries(dictionaryLookup.getParsedDictionary()).forEach(([stenoKeys, ast]) => {
    if (ast !== null && ast.errors.length === 0) {
      const strokes = stenoKeys.split('/').length;
      const estLength = calculateLength(ast);
      if (isCalculationError(estLength)) {
        console.log(`AST: ${ast === null ? 'null' : ast.text}`);
        console.error(`Could not calculate the output length for '${stenoKeys}' in ${d.config.path}: '${ast.text}' (${formatCharacters(ast.text)})`);
        console.error(estLength.errorMessages.join('\n'));
      } else {
        // console.log(estLength);
        if (!isPresent(charactersPerStroke[estLength])) {
          charactersPerStroke[estLength] = [strokes];
        } else {
          charactersPerStroke[estLength].push(strokes);
        }
      }
    } else {
      // TODO have a debug or verbose flag
      // console.log(`AST: ${ast === null ? 'null' : ast.text}`);
      // console.error(`Could not parse output or did not parse full output for '${stenoKeys}' in ${d.config.path}: '${dictionary[stenoKeys]}' (${formatCharacters(dictionary[stenoKeys])})`);
      // if (isPresent(ast) && isPresent(ast.errors) && ast.errors.length > 0) {
      //   console.error(`Ast Errors: ${JSON.stringify(ast.errors.map(e => e.message))}`);
      // }
    }
  });

  // const charactersPerStroke = _.mapValues(charactersPerStroke, vs => _.sum(vs) / vs.length);

  return {
    definedEntries: allKeys.length,
    uniqueWordCount: uniqueWords.size,
    entriesByStrokeCount,
    charactersPerStroke
  }
}