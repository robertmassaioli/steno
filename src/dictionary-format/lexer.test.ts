import {describe } from '@jest/globals';
import { fastDiveSimple, fastDiveText, generateTest } from './lexerTestHelpers';

describe("lexer", () => {
  describe('simple text input', () => {
    generateTest('single letter', 'a',
      fastDiveText(['output', 'atom', 'verbatim', 'verbatimSegment', 'verbatimSingle'], 'a')
    );

    generateTest('standard word', 'test',
      fastDiveText(['output', 'atom', 'verbatim'], 'test')
    );

    generateTest('middle spaces', 't e s t',
      fastDiveText(['output', 'atom', 'verbatim'], 't e s t')
    );

    generateTest('simple numbers', '1-9',
      fastDiveText(['output', 'atom', 'verbatim'], '1-9')
    );

    generateTest('simple numbers', '32',
      fastDiveText(['output', 'atom', 'verbatim'], '32')
    );
  });

  describe('escape sequences', () => {
    generateTest('basic escape sequence', '\\{',
      fastDiveText(['output', 'atom', 'verbatim', 'verbatimSegment', 'escapeSequence'], '\\{')
    );

    generateTest('mid-text escape sequence', 'hel\\{lo',
      fastDiveText(['output', 'atom', 'verbatim'], 'hel\\{lo')
    );
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

      generateTest('simple attach', '{^^}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'], '^^')
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
    });

    describe('combinations', () => {
      generateTest('many different atoms, separated by spaces', '{^} {.} hello {.} {#ALT_L(Grave)}{^ ^}', {
        type: 'output',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart']),
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand']),
          fastDiveText(['atom', 'verbatim'], 'hello'),
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand']),
          fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'singleKeyCombo'], 'ALT_L(Grave)'),
          fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart'], '^ ^'),
        ]
      })
    });
  });
});