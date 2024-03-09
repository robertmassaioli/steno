#!/usr/bin/env node
import { Argument, program } from 'commander';
import { runInfoCommand } from './commands/info';
import { runBuildCommand } from './commands/build';
import { runGapFinderCommand } from './commands/gap-finder';
import { runPrepareCommand } from './commands/prepare';
import { runAnkiGeneration } from './commands/anki';
import { runAutoCompleteCommand } from './commands/autocomplete';

program
  .command('prepare')
  .description('Prepare all of the generated files that we will need to run more advanced commands.')
  .action(runPrepareCommand);

program
  .command('build')
  .description('Merge all JSON steno dictionaries in your Plover assets direcotry into one file.')
  .action(runBuildCommand);

program
  .command('info')
  .description('Load all of your dictionaries and give statistics on the dictionaries individually and as a whole.')
  .action(runInfoCommand);

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


program
  .command('gap-finder')
  .description('Searches the most popular words in english and makes sure that your dictionary can generate these words.')
  .action(runGapFinderCommand);

program
  .command('anki')
  .description('Generates an anki deck given your criteria.')
  .option('-d, --dictionary <filename...>', 'Specify a dictionary, in order, to be used for the generation of this command.')
  .option('-p, --popularity <top_n>', 'Specify that you only want the top N most popular words in the output. Must be <=10000.')
  .action((options) => runAnkiGeneration(options));

program
  .command('autocomplete')
  .description('Generates dictionaries that act as autocompletions of the input dictionaries')
  .option('-d, --dictionary <filename...>', 'Specify one or more dictionaries to run this command over.')
  .option('-m, --min-strokes', 'Specify the minimum number of strokes before autocompletion activates.', '2')
  .option('-o, --output <filename>', 'Specify where you want the output to be written to.', 'autocomplete.json')
  .action((options) => runAutoCompleteCommand(options));

// Command that evaluates where the most popular word or phrase is not the one that got the asterix

console.log(process.argv);
program.parse(process.argv);
