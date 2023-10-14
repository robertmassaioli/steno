#!/usr/bin/env node
import { program } from 'commander';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { getStenoConfig, readPloverConfig } from './loaders';
import { DictionaryConfig, PloverConfig, StenoConfig, isValidationErrors } from './data';

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

  });

program
  .command('convert')
  .description('Given a file, convert the contents of that file to the stenography representation of that file with the given dictionaries.')
  .action(async () => {

  });

program
  .command('rate')
  .description('Rates your current stenography dictionary against known corpus of text.')
  .action(async () => {
    // Given an input SPM, output the expected SPM if the input dictionary was used most efficiently
    // Output the commands, selected from the dictionary, that would match that output. This could
    // be a separate command.

    // We could also evaluate the dictionary against the list of most popular words and phrases
  });

// Command that evaluates where the most popular word or phrase is not the one that got the asterix

program.parse(process.argv);

function isJsonDictionary(dictionary: DictionaryConfig): boolean {
  return dictionary.path.endsWith('.json');
}

async function mergeDictionaries(stenoConfig: StenoConfig, dictionaries: DictionaryConfig[]): Promise<object> {
  const enabledJsonDictionaries = dictionaries.filter(d => d.enabled).filter(isJsonDictionary);
  let mergedDictionary = {};

  for (const dictionary of enabledJsonDictionaries) {
    const dictionaryPath = path.join(stenoConfig.ploverAssetsDir, dictionary.path);
    const dictionaryContent = await fse.readJson(dictionaryPath);
    mergedDictionary = { ...dictionaryContent, ...mergedDictionary };
  }

  return mergedDictionary;
}


async function writeMergedDictionary(outputFilePath: string, dictionary: object) {
  await fse.writeJson(outputFilePath, dictionary, { spaces: 2 });
}
