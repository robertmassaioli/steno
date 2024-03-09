import { getEnabledJsonDictionaries, getStenoConfigOrPrintErrors, mergeDictionaries, readPloverConfigOrPrintErrors } from "./command-common";
import * as fse from 'fs-extra';
import * as path from 'path';
import { StenoDictionary } from "../data";
import { loadDictionaries } from "../loaders";
import { isPresent } from "ts-is-present";

function extractMultiChordOutlines(dictionary: StenoDictionary): Array<string> {
  const multiChordOutlines = [];
  for (const outline in dictionary) {
    if (outline.includes('/') && !dictionary[outline].includes(' ')) {
      multiChordOutlines.push(outline);
    }
  }
  return multiChordOutlines;
}

function dropLastChord(outline: string): string {
  const chords = outline.split('/');
  if (chords.length === 1) {
    return outline;
  }
  chords.pop();
  return chords.join('/');
}

function generateAutoCompleteDictionary(dictionary: StenoDictionary, minStrokes: number): StenoDictionary {
  const newDictionary: StenoDictionary = {};

  const multiChordOutlines = extractMultiChordOutlines(dictionary);

  for (const outline of multiChordOutlines) {
    let chords = outline.split('/');
    while(chords.length > minStrokes) {
      const popped = chords.pop();
      const currentOutline = chords.join('/');

      if(!isPresent(dictionary[currentOutline])) {
        if (currentOutline === "UPB/ORGD") {
          console.log(`Adding ${currentOutline} as a shortening of ${outline}: ${dictionary[outline]}`);
        }
        newDictionary[currentOutline] = dictionary[outline];
      }
    }
  }
  return newDictionary;
}

type Args = {
  dictionary: string;
  minStrokes: string;
  output: string
};

export async function runAutoCompleteCommand(args: Args) {
  console.log(args);
  // load all of the dictionaries
  // for each of them, generate the autocomplete lists
  // then merge the autocomplete lists together so that there is just one file
  try {
    const stenoConfig = await getStenoConfigOrPrintErrors();
    const ploverConfig = await readPloverConfigOrPrintErrors(stenoConfig);

    const enabledDictionaryConfigs = getEnabledJsonDictionaries(ploverConfig.dictionaries);
    const dictionaries = await loadDictionaries(stenoConfig, enabledDictionaryConfigs);

    const generatedDicts = dictionaries.map(ld => ({
      ...ld,
      originalDictionary: ld.dictionary,
      dictionary: generateAutoCompleteDictionary(ld.dictionary, parseInt(args.minStrokes))
    }));

    console.log(`Generated autocompletions for enabled dictionaries:`);
    generatedDicts.forEach(gd => {
      console.log(` - ${gd.config.path}: ${Object.keys(gd.originalDictionary).length} entries => ${Object.keys(gd.dictionary).length} entries`);
    });

    const merged = generatedDicts.reduce((acc, gd) => ({
      ...gd.dictionary,
      ...acc
    }), {});

    await fse.writeFile(args.output, JSON.stringify(merged, null, 2));
  } catch (e) {
    console.error(e);
  }

}