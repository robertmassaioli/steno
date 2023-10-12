#!/usr/bin/env node
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as ini from 'ini';

type StenoConfig = {
  ploverAssetsDir: string;
};

interface DictionaryConfig {
  enabled: boolean;
  path: string;
}

program
  .command('build')
  .description('Merge Steno dictionaries')
  .action(async () => {
    try {
      const stenoConfigPath = await findStenoConfigFile(process.cwd());
      if (!stenoConfigPath) {
        console.error('Could not find a .steno configuration file.');
        process.exit(1);
      }

      let stenoConfig: StenoConfig | null = null;
      try {
        stenoConfig = await readStenoConfig(stenoConfigPath);
      } catch(e) {
        console.error("Failed to load the .steno Configuration file", e);
        process.exit(2);
      }
      if (!stenoConfig.ploverAssetsDir) {
        console.error('The .steno configuration file does not contain "ploverAssetsDir".');
        return;
      }

      const ploverConfigPath = path.join(stenoConfig.ploverAssetsDir, 'plover.cfg');
      if (!fs.existsSync(ploverConfigPath)) {
        console.error('The plover.cfg file does not exist in the specified directory.');
        return;
      }

      const ploverConfig = await readPloverConfig(ploverConfigPath);
      const mergedDictionary = await mergeDictionaries(stenoConfig, ploverConfig.dictionaries);

      const outputFilePath = path.join(process.cwd(), 'dictionary.merged.json');
      await writeMergedDictionary(outputFilePath, mergedDictionary);

      console.log('Dictionaries merged successfully and saved to dictionary.merged.json');
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

program.parse(process.argv);

async function findStenoConfigFile(directory: string): Promise<string | undefined> {
  while (directory !== '/') {
    const stenoConfigPath = path.join(directory, '.steno');
    if (fs.existsSync(stenoConfigPath)) {
      return stenoConfigPath;
    }
    directory = path.dirname(directory);
  }
  return undefined;
}

async function readStenoConfig(configPath: string): Promise<StenoConfig> {
  const configContent = await fse.readFile(configPath, 'utf-8' );
  return JSON.parse(configContent);
}

async function readPloverConfig(ploverConfigPath: string): Promise<{ dictionaries: DictionaryConfig[] }> {
  const ploverConfigContent = await fse.readFile(ploverConfigPath, 'utf-8');
  const ploverConfigData = ini.parse(ploverConfigContent);

  // Assuming the section you're interested in is "[System: English Stenotype]"
  const englishStenotype = ploverConfigData['System: English Stenotype'];

  if (!englishStenotype || !englishStenotype.dictionaries) {
    console.error('Invalid plover.cfg format or missing "dictionaries" in [Gemini PR] section.');
    return { dictionaries: [] };
  }

  const dictionaries = JSON.parse(englishStenotype.dictionaries);

  return { dictionaries };
}


async function mergeDictionaries(stenoConfig: StenoConfig, dictionaries: DictionaryConfig[]): Promise<object> {
  let mergedDictionary = {};

  for (const dictionary of dictionaries) {
    if (dictionary.enabled) {
      const dictionaryPath = path.join(stenoConfig.ploverAssetsDir, dictionary.path);

      if (dictionaryPath.endsWith('.json')) {
        const dictionaryContent = await fse.readJson(dictionaryPath);
        mergedDictionary = { ...dictionaryContent, ...mergedDictionary };
      }
    }
  }

  return mergedDictionary;
}


async function writeMergedDictionary(outputFilePath: string, dictionary: object) {
  await fse.writeJson(outputFilePath, dictionary, { spaces: 2 });
}
