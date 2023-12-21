import { DictionaryConfig, ErrorCodes, PloverConfig, StenoConfig, StenoDictionary, isValidationErrors } from "../data";
import { getStenoConfig, loadDictionaries, readPloverConfig } from "../loaders";
import * as fs from 'fs';
import * as path from 'path';

export async function getStenoConfigOrPrintErrors(): Promise<StenoConfig> {
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

export async function readPloverConfigOrPrintErrors(stenoConfig: StenoConfig): Promise<PloverConfig> {
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

function isJsonDictionary(dictionary: DictionaryConfig): boolean {
  return dictionary.path.endsWith('.json');
}

export function getEnabledJsonDictionaries(dictionaries: Array<DictionaryConfig>): Array<DictionaryConfig> {
  return dictionaries.filter(d => d.enabled).filter(isJsonDictionary);
}

export async function mergeDictionaries(stenoConfig: StenoConfig, dictionaries: DictionaryConfig[]): Promise<StenoDictionary> {
  const enabledJsonDictionaries = getEnabledJsonDictionaries(dictionaries);

  const loadedDictionaries = await loadDictionaries(stenoConfig, enabledJsonDictionaries);

  return loadedDictionaries.reduce((acc, loadedDictionary) => ({
    ...loadedDictionary.dictionary,
    ...acc
  }), {});
}