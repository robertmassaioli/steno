import {describe } from '@jest/globals';
import { fastDiveSimple, fastDiveText, generateTest } from './lexerTestHelpers';

describe("lexer", () => {
  describe('escape sequences', () => {
    generateTest('basic escape sequence', '\\{',
      fastDiveText(['output', 'atom', 'verbatim', 'escapableSingle'], '\\{'));
  });

  describe('meta commands', () => {
    generateTest('space between meta commands is ignored', '{.} {.}', {
      type: 'output',
      children: [
        fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand']),
        fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand'])
      ]
    });

    generateTest('multi meta commands with segments', '{.}{^ `}{-|}',{
      type: 'output',
      children: [
        fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand']),
        fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'], '^ `'),
        fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand'], '-|')
      ]
    });

    generateTest('multi meta commands with segments', '{.} `{-|}',{
      type: 'output',
      children: [
        fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand']),
        fastDiveText(['atom', 'verbatim'], '`'),
        fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand'], '-|')
      ]
    });

    describe('attach', () => {
      generateTest('simple attach', '{^}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'])
      );

      generateTest('attach symbol correct', '{^}^{^}', {
        type: 'output',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart']),
          fastDiveText(['atom', 'verbatim'], '^'),
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'])
        ]
      });

      generateTest('attach symbol correct (ignore spaces)', '{^} ^ {^}', {
        type: 'output',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart']),
          fastDiveText(['atom', 'verbatim'], '^'),
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'])
        ]
      });

      generateTest('attach symbol that starts looking like a stop', '{.^}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachEnd'], '.^')
      );
    })
  });
});