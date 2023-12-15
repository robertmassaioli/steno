import {describe } from '@jest/globals';
import { TokenMatch, fastDive, fastDiveSimple, fastDiveText, generateTest } from './lexerTestHelpers';

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
      generateTest('standard if-next-matches', '{=[AEIOUaeiou]/an/a}',
        fastDive(['output', 'atom', 'metaCommand', 'metaCommandType'], {
          type: 'ifNextMatchesMetaCommand',
          children: [
            fastDiveText(['matchSection'], '[AEIOUaeiou]'),
            fastDiveText(['matchSection'], 'an'),
            fastDiveText(['matchSection'], 'a')
          ]
        })
      );
    });

    describe('legacy commands', () => {
      generateTest('retro toggle asterix', '{*}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'legacyMetaCommand', 'retroToggleAsterisk'])
      );

      generateTest('retro delete space', '{*!}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'legacyMetaCommand', 'retroDeleteSpace'])
      );

      generateTest('retro insert space', '{*?}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'legacyMetaCommand', 'retroInsertSpace'])
      );

      generateTest('repeat last stroke', '{*+}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'legacyMetaCommand', 'repeatLastStroke'])
      );
    });

    describe('meta macros', () => {
      generateTest('solo meta macro, no argument', '{:my_macro}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'macroMetaCommand', 'macroMetaCommandName'], "my_macro")
      );

      generateTest('solo meta macro, no argument, with numbers', '{:my_macro_123}',
      fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'macroMetaCommand', 'macroMetaCommandName'], "my_macro_123")
      );

      generateTest('solo meta macro, with argument', '{:my_macro:my_argument}',
        fastDive(['output', 'atom', 'metaCommand', 'metaCommandType'], {
          type: 'macroMetaCommand',
          children: [
            fastDiveText(['macroMetaCommandName'], 'my_macro'),
            fastDiveText(['macroMetaCommandArg'], 'my_argument'),
          ]
        })
      );

      generateTest('solo meta macro, with argument, with escape', '{:my_macro:{my_argument\\}}',
      fastDive(['output', 'atom', 'metaCommand', 'metaCommandType'], {
        type: 'macroMetaCommand',
        children: [
          fastDiveText(['macroMetaCommandName'], 'my_macro'),
          fastDiveText(['macroMetaCommandArg'], '{my_argument\\}'),
        ]
      })
      );

      generateTest('surrounded meta macro, with argument', 'some{:my_macro:my_argument}text', {
        type: 'output',
        children: [
          fastDiveText(['atom', 'verbatim'], 'some'),
          fastDive(['atom', 'metaCommand', 'metaCommandType'], {
            type: 'macroMetaCommand',
            children: [
              fastDiveText(['macroMetaCommandName'], 'my_macro'),
              fastDiveText(['macroMetaCommandArg'], 'my_argument'),
            ]
          }),
          fastDiveText(['atom', 'verbatim'], 'text'),
        ]
      });
    });

    describe('plover commands', () => {
      describe('no arg commands', () => {
        const noArgCommands = ["suspend", "resume", "toggle", "add_translation", "lookup", "suggestions", "configure", "focus", "quit"];

        for (let i = 0; i < noArgCommands.length; i++) {
          const commandLower = noArgCommands[i];

          generateTest(`one command parsed, no context`, `{PLOVER:${commandLower}}`,
            fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'ploverMetaCommand', 'ploverCommandName'], commandLower),
          );

          const commandUpper = commandLower.toLocaleUpperCase();
          generateTest('one command parsed, no context, capitalised', `{PLOVER:${commandUpper}}`,
            fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'ploverMetaCommand', 'ploverCommandName'], commandUpper),
          );
        }
      });

      describe('set_config', () => {
        generateTest(`simple`, '{PLOVER:set_config:"start_attached": True, "start_capitalized": True}',
          fastDive(['output', 'atom', 'metaCommand', 'metaCommandType'], {
            type: 'ploverMetaCommand',
            children: [
              fastDiveText(['ploverCommandName'], 'set_config'),
              fastDiveText(['ploverMetaCommandArg'], '"start_attached": True, "start_capitalized": True'),
            ]
          })
        );

        generateTest(`simple, uppercase`, '{PLOVER:SET_CONFIG:"start_attached": True, "start_capitalized": True}',
          fastDive(['output', 'atom', 'metaCommand', 'metaCommandType'], {
            type: 'ploverMetaCommand',
            children: [
              fastDiveText(['ploverCommandName'], 'SET_CONFIG'),
              fastDiveText(['ploverMetaCommandArg'], '"start_attached": True, "start_capitalized": True'),
            ]
          })
        );
      });
    });

    describe('mode commands', () => {
      describe('no arg modes', () => {
        const noArgModes = ["caps", "snake", "camel", "lower", "title", "clear", "reset"];

        for (let i = 0; i < noArgModes.length; i++) {
          const modeLower = noArgModes[i];

          generateTest(`one command parsed, no context`, `{MODE:${modeLower}}`,
            fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'modeMetaCommand', 'simpleOutputMode'], modeLower),
          );

          const modeUpper = modeLower.toLocaleUpperCase();
          generateTest('one command parsed, no context, capitalised', `{MODE:${modeUpper}}`,
            fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'modeMetaCommand', 'simpleOutputMode'], modeUpper),
          );
        }
      });

      describe('set_space', () => {
        generateTest(`simple`, '{MODE:set_space:blah}',
          fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'modeMetaCommand', 'setSpaceOutputMode', 'setSpaceTo'], 'blah')
        );

        generateTest(`simple, uppercase`, '{MODE:SET_SPACE:blah}',
          fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'modeMetaCommand', 'setSpaceOutputMode', 'setSpaceTo'], 'blah')
        );
      });
    });

    describe('key combos', () => {
      describe('single key press', () => {
        generateTest(`alphabetic key`, '{#p}',
          fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'p')
        );

        generateTest(`number key`, '{#4}',
          fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], '4')
        );

        generateTest(`function key`, '{#F10}',
          fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'F10')
        );

        generateTest(`accented letter`, '{#acute}',
          fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'acute')
        );

        generateTest(`arrow key`, '{#Down}',
          fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'Down')
        );
      });

      describe('special keys', () => {
        const specialKeys = ['BackSpace', 'Up', 'Left', 'Right', 'Down'];

        for (let i = 0; i < specialKeys.length; i++) {
          const specialKey = specialKeys[i];

          generateTest(`special key`, `{#${specialKey}}`,
            fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], specialKey)
          );

        }
      });

      describe('modifiers', () => {
        function modifierGroup(modifier: string, further: TokenMatch): TokenMatch {
          return {
            type: 'modifierGroup',
            children: [
              fastDiveText(['modifier'], modifier),
              further
            ]
          }
        }

        generateTest(`nested simple key`, '{#Control_L(Up)}',
          fastDive(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'],
            modifierGroup('Control_L',
              fastDiveText(['keyCombos', 'singleKeyCombo'], 'Up')
            )
          )
        );

        generateTest(`nested two deep`, '{#super(shift(x))}',
          fastDive(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], {
            type: 'modifierGroup',
            children: [
              fastDiveText(['modifier'], 'super'),
              fastDive(['keyCombos', 'singleKeyCombo'], {
                type: 'modifierGroup',
                children: [
                  fastDiveText(['modifier'], 'shift'),
                  fastDiveText(['keyCombos', 'singleKeyCombo'], 'x')
                ]
              })
            ]
          })
        );

        generateTest(`multi keys`, '{#f super(g shift(x p))}',
          fastDive(['output', 'atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand'], {
            type: "keyCombos",
            children: [
              fastDiveText(['singleKeyCombo'], 'f'),
              fastDive(['singleKeyCombo'],
                modifierGroup('super', {
                  type: 'keyCombos',
                  children: [
                    fastDiveText(['singleKeyCombo'], 'g'),
                    fastDive(['singleKeyCombo'],
                      modifierGroup('shift', {
                        type: 'keyCombos',
                        children: [
                          fastDiveText(['singleKeyCombo'], 'x'),
                          fastDiveText(['singleKeyCombo'], 'p')
                        ]
                      })
                    )
                  ]
                })
              )
            ]

          })
        );
      });
    });

    describe('comma meta', () => {
      generateTest(`comma`, '{,}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'commaMetaCommand'], ',')
      );

      generateTest(`colon`, '{:}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'commaMetaCommand'], ':')
      );

      generateTest(`semi-colon`, '{;}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'commaMetaCommand'], ';')
      );
    });

    describe('stop meta', () => {
      generateTest(`period`, '{.}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand'], '.')
      );

      generateTest(`exclamation mark`, '{!}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand'], '!')
      );

      generateTest(`question mark`, '{?}',
        fastDiveText(['output', 'atom', 'metaCommand', 'metaCommandType', 'stopMetaCommand'], '?')
      );

    });

    describe('word end', () => {
      generateTest(`period`, '{$}',
        fastDiveSimple(['output', 'atom', 'metaCommand', 'metaCommandType', 'wordEndMetaCommand'])
      );
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
          fastDiveText(['atom', 'metaCommand', 'metaCommandType', 'keyComboMetaCommand', 'keyCombos'], 'ALT_L(Grave)'),
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