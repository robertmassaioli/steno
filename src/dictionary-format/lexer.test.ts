import {describe } from '@jest/globals';
import { fastDive, fastDiveSimple, fastDiveText, generateTest } from './lexerTestHelpers';

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

  describe('macros', () => {
    generateTest('named macro', '=macro_name',
      fastDiveText(['output', 'macro', 'macroName'], 'macro_name')
    );

    generateTest('named macro, with argument', '=macro_name:arg_name',
      fastDive(['output'], {
        type: 'macro',
        children: [
          fastDiveText(['macroName'], 'macro_name'),
          fastDiveText(['macroArgument'], 'arg_name'),
        ]
      })
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
    describe('casing', () => {
      generateTest('basic cap first word', '{-|}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'capFirstWord'])
      );

      generateTest('basic cap first word', '{>}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'lowerFirstChar'])
      );

      generateTest('basic cap first word', '{<}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'upperFirstWord'])
      );

      describe('retro', () => {
        generateTest('basic cap first word', '{*-|}',
          fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'retroCase', 'capFirstWord'])
        );

        generateTest('basic cap first word', '{*>}',
          fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'retroCase', 'lowerFirstChar'])
        );

        generateTest('basic cap first word', '{*<}',
          fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'retroCase', 'upperFirstWord'])
        );
      });
    });

    describe('gluing', () => {
      generateTest('glue a nunmber', '{&1}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'glueMetaCommand', 'verbatim'], '1')
      );

      generateTest('glue a nunmber', '{&Y.}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'glueMetaCommand', 'verbatim'], 'Y.')
      );
    });

    describe('if-next-matches', () => {
      generateTest('standard if-next-matches', '{=AEIOUaeiou}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'glueMetaCommand', 'verbatim'], 'Y.')
      );
    });

    describe('legacy commands', () => {

    });

    describe('meta macros', () => {

    });

    describe('plover commands', () => {

    });

    describe('mode commands', () => {

    });

    describe('key combos', () => {

    });

    describe('comma', () => {

    });

    describe('stop', () => {

    });

    describe('word end', () => {

    });

    describe('retro currency', () => {

    });

    describe('spacing', () => {
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

      describe('carry capitalisation', () => {

      });
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
      });

      generateTest('many different atoms, no spaces, glue and case', '{-|}{>}{&a}{>}{&b}', {
        type: 'output',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'capFirstWord']),
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'lowerFirstChar']),
          fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'glueMetaCommand', 'verbatim'], 'a'),
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'lowerFirstChar']),
          fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'glueMetaCommand', 'verbatim'], 'b'),
        ]
      });

      generateTest('many different atoms, no spaces, glue and case', '{-|} equip {^s}', {
        type: 'output',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'metaCommandType', 'caseMetaCommand', 'capFirstWord']),
          fastDiveText(['atom', 'verbatim'], 'equip'),
          fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'attachMetaCommand', 'attachStart', 'attachVerbatim'], 's')
        ]
      });
    });
  });
});