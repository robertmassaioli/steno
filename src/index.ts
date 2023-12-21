#!/usr/bin/env node
import { program } from 'commander';
import { runInfoCommand } from './commands/info';
import { runBuildCommand } from './commands/build';
import { runGapFinderCommand } from './commands/gap-finder';

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

// Command that evaluates where the most popular word or phrase is not the one that got the asterix

program.parse(process.argv);
