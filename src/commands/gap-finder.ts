import { DictionaryLookup } from "../dictionary-lookup";
import { getStenoConfigOrPrintErrors, mergeDictionaries, readPloverConfigOrPrintErrors } from "./command-common";
import _ from 'lodash';

export async function runGapFinderCommand() {
  const popular10kPromise = downloadAndExtractTextFile('https://github.com/first20hours/google-10000-english/raw/master/google-10000-english-usa.txt');

  const stenoConfig = await getStenoConfigOrPrintErrors();
  const ploverConfig = await readPloverConfigOrPrintErrors(stenoConfig);
  const mergedDictionary = await mergeDictionaries(stenoConfig, ploverConfig.dictionaries);
  // Given an input SPM, output the expected SPM if the input dictionary was used most efficiently
  // Output the commands, selected from the dictionary, that would match that output. This could
  // be a separate command.

  const dl = new DictionaryLookup(mergedDictionary);
  (await popular10kPromise).forEach((word, popularity) => {
    if (dl.lookupStrokesForWord(word).length === 0) {
      console.log(`${popularity + 1}: Dictionary does not contain '${word}'`)
    }
  });
}

async function downloadAndExtractTextFile(url: string): Promise<Array<string>> {
  try {
    // Fetch the content of the text file
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch the file. Status: ${response.status}`);
    }

    // Read the response as text
    const fileContent = await response.text();

    // Split the content into an array of lines
    const lines = fileContent.split('\n');

    // Remove empty lines
    const nonEmptyLines = lines.filter(line => line.trim() !== '');

    return nonEmptyLines;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}