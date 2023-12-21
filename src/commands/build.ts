import { getStenoConfigOrPrintErrors, mergeDictionaries, readPloverConfigOrPrintErrors } from "./command-common";
import * as fse from 'fs-extra';
import * as path from 'path';

export async function runBuildCommand() {
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
}

async function writeMergedDictionary(outputFilePath: string, dictionary: object) {
  await fse.writeJson(outputFilePath, dictionary, { spaces: 2 });
}