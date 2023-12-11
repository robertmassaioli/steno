import {describe } from '@jest/globals';
import { fastDiveSimple, fastDiveText, generateTest } from './lexerTestHelpers';

describe("lexer", () => {
  describe('escape sequences', () => {
    generateTest('basic escape sequence: \\{', '\\{',
      fastDiveSimple(['output', 'segment', 'verbatim', 'escapeSequence']));
  });

  describe('meta commands', () => {
    generateTest('space between meta commands: {.} {.}', '{.} {.}', {
      type: 'output',
      children: [
        fastDiveSimple(['segment', 'metaCommand', 'metaCommandType', 'stopMetaCommand']),
        fastDiveText(['segment', 'verbatim'], ' '),
        fastDiveSimple(['segment', 'metaCommand', 'metaCommandType', 'stopMetaCommand'])
      ]
    });

    generateTest('multi meta commands with segments: {.} `{-|}', '{.} `{-|}',{
      type: 'output',
      children: [
        fastDiveSimple(['segment', 'metaCommand', 'metaCommandType', 'stopMetaCommand']),
        fastDiveText(['segment', 'verbatim'], ' `'),
        fastDiveText(['segment', 'metaCommand', 'metaCommandType', 'caseMetaCommand'], '-|')
      ]
    });

    describe('attach', () => {
      generateTest('simple attach: {^}', '{^}',
        fastDiveSimple(['output', 'segment', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'])
      );

      generateTest('attach symbol correct: {^}^{^}', '{^}^{^}', {
        type: 'output',
        children: [
          fastDiveSimple(['segment', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart']),
          fastDiveText(['segment', 'verbatim'], '^'),
          fastDiveSimple(['segment', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'])
        ]
      });

      generateTest('attach symbol that starts looking like a stop {.^}', '{.^}',
        fastDiveText(['output', 'segment', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachEnd'], '.^')
      );
    })
  });
});