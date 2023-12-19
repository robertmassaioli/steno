#!/usr/bin/env node
import { program } from 'commander';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { getStenoConfig, loadDictionaries, loadDictionary, readPloverConfig } from './loaders';
import { DictionaryConfig, DictionaryStats, LoadedDictionary, PloverConfig, StenoConfig, StenoDictionary, isValidationErrors } from './data';
import { getParser, printAST } from './dictionary-format/lexer';
import { IToken } from 'ebnf';
import { formatCharacters, toHexadecimal } from './hexadecimal';
import { calculateLength, isCalculationError } from './outline-length';
import { isPresent } from 'ts-is-present';
import _ from 'lodash';

enum ErrorCodes {
  StenoConfigValidationError = 1,
  PloverConfigPathError,
  PloverConfigReadError,
};

async function getStenoConfigOrPrintErrors(): Promise<StenoConfig> {
  let stenoConfig = await getStenoConfig(process.cwd());

  if (isValidationErrors(stenoConfig)) {
    console.error('The following validation errors were found while finding and parsing the steno configuration:');
    stenoConfig.validationErrors.forEach(error => {
      console.error(` - ${error}`);
    })
    process.exit(ErrorCodes.StenoConfigValidationError);
  }

  return stenoConfig;
}

async function readPloverConfigOrPrintErrors(stenoConfig: StenoConfig): Promise<PloverConfig> {
  const ploverConfigPath = path.join(stenoConfig.ploverAssetsDir, 'plover.cfg');
    if (!fs.existsSync(ploverConfigPath)) {
      console.error('The plover.cfg file does not exist in the specified directory.');
      process.exit(ErrorCodes.PloverConfigPathError);
    }

    const ploverConfig = await readPloverConfig(ploverConfigPath);

    if (isValidationErrors(ploverConfig)) {
      console.error('The following validation errors were found while finding and parsing the plover configuration:');
      ploverConfig.validationErrors.forEach(error => {
        console.error(` - ${error}`);
      })
      process.exit(ErrorCodes.PloverConfigReadError);
    }

    return ploverConfig;
}

program
  .command('build')
  .description('Merge all JSON steno dictionaries in your Plover assets direcotry into one file.')
  .action(async () => {
    try {
      const stenoConfig = await getStenoConfigOrPrintErrors();
      const ploverConfig = await readPloverConfigOrPrintErrors(stenoConfig);
      const mergedDictionary = await mergeDictionaries(stenoConfig, ploverConfig.dictionaries);

      const outputFilePath = path.join(process.cwd(), 'dictionary.merged.json');
      await writeMergedDictionary(outputFilePath, mergedDictionary);

      console.log('Dictionaries merged successfully and saved to dictionary.merged.json');
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program
  .command('info')
  .description('Load all of your dictionaries and give statistics on the dictionaries individually and as a whole.')
  .action(async () => {
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
      const stats = calculateDictionaryStats(d);
      const uniqueToTotal = stats.uniqueWordCount / stats.definedEntries * 100;
      console.log(`   - Unique Entries: ${stats.uniqueWordCount} / ${stats.definedEntries} (${uniqueToTotal.toFixed(2)}%)`);
      console.log(`   - Entries by Stroke Count:`);
      Object.keys(stats.entriesByStrokeCount).sort((a, b) => parseInt(a) - parseInt(b)).forEach(strokes => {
        console.log(`     - ${strokes}: ${stats.entriesByStrokeCount[parseInt(strokes)]} entries`);
      });
      console.log(`   - Characters per stroke:`);
      Object.keys(stats.charactersPerStroke).sort((a, b) => parseInt(a) - parseInt(b)).forEach(characters => {
        console.log(`     - ${characters} characters => ${stats.charactersPerStroke[parseInt(characters)].toFixed(2)} strokes`);
      });
    });

  });

function calculateDictionaryStats(d: LoadedDictionary): DictionaryStats {
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
  const charactersPerStrokeAgg: { [characters: number]: Array<number> } = {};
  const dictionaryOutputParser = getParser();
  Object.entries(dictionary).forEach(([stenoKeys, output]) => {
    const ast = dictionaryOutputParser.getAST(output, 'outline');
    if (ast !== null && ast.text.length === output.length) {
      const strokes = stenoKeys.split('/').length;
      const estLength = calculateLength(ast);
      if (isCalculationError(estLength)) {
        console.log(`AST: ${ast === null ? 'null' : ast.text}`);
        console.error(`Could not calculate the output length for '${stenoKeys}' in ${d.config.path}: '${output}' (${formatCharacters(output)})`);
        console.error(estLength.errorMessages.join('\n'));
      } else {
        // console.log(estLength);
        if (!isPresent(charactersPerStrokeAgg[estLength])) {
          charactersPerStrokeAgg[estLength] = [strokes];
        } else {
          charactersPerStrokeAgg[estLength].push(strokes);
        }
      }
    } else {
      console.log(`AST: ${ast === null ? 'null' : ast.text}`);
      console.error(`Could not parse output or did not parse full output for '${stenoKeys}' in ${d.config.path}: '${output}' (${formatCharacters(output)})`);
      process.exit(1);
    }
  });

  const charactersPerStroke = _.mapValues(charactersPerStrokeAgg, vs => _.sum(vs) / vs.length);

  console.log(JSON.stringify(charactersPerStroke, null, 2));

  return {
    definedEntries: allKeys.length,
    uniqueWordCount: uniqueWords.size,
    entriesByStrokeCount,
    charactersPerStroke
  }
}

function calculateOutputCharacters(ast: IToken): number {
  if (ast.type !== 'outline') {
    throw new Error(`Expected AST type was output but got ${ast.type}`);
  }

  // Calculate the length of each atom and then add them all together

  printAST(ast);
  // const segments = ast.children;

  // console.log(segments);

  return 0;
}

program
  .command('convert')
  .description('Given a file, convert the contents of that file to the stenography representation of that file with the given dictionaries.')
  .action(async () => {
    console.log("Not yet implemented...");
  });

program
  .command('rate')
  .description('Rates your current stenography dictionary against known corpus of text.')
  .action(async () => {
    // Given an input SPM, output the expected SPM if the input dictionary was used most efficiently
    // Output the commands, selected from the dictionary, that would match that output. This could
    // be a separate command.

    // We could also evaluate the dictionary against the list of most popular words and phrases
    console.log("Not yet implemented...");
  });

// Command that evaluates where the most popular word or phrase is not the one that got the asterix

program.parse(process.argv);

function isJsonDictionary(dictionary: DictionaryConfig): boolean {
  return dictionary.path.endsWith('.json');
}

function getEnabledJsonDictionaries(dictionaries: Array<DictionaryConfig>): Array<DictionaryConfig> {
  return dictionaries.filter(d => d.enabled).filter(isJsonDictionary);
}

async function mergeDictionaries(stenoConfig: StenoConfig, dictionaries: DictionaryConfig[]): Promise<StenoDictionary> {
  const enabledJsonDictionaries = getEnabledJsonDictionaries(dictionaries);

  const loadedDictionaries = await loadDictionaries(stenoConfig, enabledJsonDictionaries);

  return loadedDictionaries.reduce((acc, loadedDictionary) => ({
    ...loadedDictionary.dictionary,
    ...acc
  }), {});
}


async function writeMergedDictionary(outputFilePath: string, dictionary: object) {
  await fse.writeJson(outputFilePath, dictionary, { spaces: 2 });
}
