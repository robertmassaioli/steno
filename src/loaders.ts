import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as ini from 'ini';
import * as path from 'path';
import { DictionaryConfig, LoadedDictionary, PloverConfig, StenoConfig, StenoDictionary, ValidationErrors } from './data';

export async function getStenoConfig(cwd: string): Promise<StenoConfig | ValidationErrors> {
  const stenoConfigPath = await findStenoConfigFile(cwd);
      if (!stenoConfigPath) {
        console.error('Could not find a .steno configuration file.');
        process.exit(1);
      }

  try {
    const stenoConfig = await readStenoConfig(stenoConfigPath); // Assuming readStenoConfig is an asynchronous function
    if (!stenoConfig.ploverAssetsDir) {
      return {
        validationErrors: ['The .steno configuration file does not contain "ploverAssetsDir".']
      };
    }
    return stenoConfig;
  } catch (e) {
    console.error('Failed to load the .steno Configuration file', e);
    process.exit(2);
  }
}

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

export async function readPloverConfig(ploverConfigPath: string): Promise<PloverConfig | ValidationErrors> {
  const ploverConfigContent = await fse.readFile(ploverConfigPath, 'utf-8');
  const ploverConfigData = ini.parse(ploverConfigContent);

  // Assuming the section you're interested in is "[System: English Stenotype]"
  const section = 'System: English Stenotype';
  const englishStenotype = ploverConfigData[section];

  if (!englishStenotype || !englishStenotype.dictionaries) {
    return {
      validationErrors: [
        `Invalid plover.cfg format or missing "dictionaries" in [${section}] section.`
      ]
    };
  }

  const dictionaries = JSON.parse(englishStenotype.dictionaries);

  return { dictionaries };
}

export async function loadDictionary(stenoConfig: StenoConfig, config: DictionaryConfig): Promise<LoadedDictionary> {
  const dictionaryPath = path.join(stenoConfig.ploverAssetsDir, config.path);
  const dictionary = await fse.readJson(dictionaryPath);
  return { config, dictionary };
}

export async function loadDictionaries(stenoConfig: StenoConfig, dictionary: Array<DictionaryConfig>): Promise<Array<LoadedDictionary>> {
  return Promise.all(dictionary.map(d => loadDictionary(stenoConfig, d)));
}