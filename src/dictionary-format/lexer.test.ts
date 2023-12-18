import {describe } from '@jest/globals';
import { TokenMatch, fastDive, fastDiveSimple, fastDiveText, generateTest } from './lexerTestHelpers';

describe("lexer", () => {
  describe('simple text input', () => {
    generateTest('single letter', 'a',
      fastDiveText(['outline', 'atom', 'verbatim', 'verbatimSegment', 'verbatimSingle'], 'a')
    );

    generateTest('standard word', 'test',
      fastDiveText(['outline', 'atom', 'verbatim'], 'test')
    );

    generateTest('middle spaces', 't e s t',
      fastDiveText(['outline', 'atom', 'verbatim'], 't e s t')
    );

    generateTest('simple numbers', '1-9',
      fastDiveText(['outline', 'atom', 'verbatim'], '1-9')
    );

    generateTest('simple numbers', '32',
      fastDiveText(['outline', 'atom', 'verbatim'], '32')
    );
  });

  describe('macros', () => {
    generateTest('named macro', '=macro_name',
      fastDiveText(['outline', 'macro', 'macroName'], 'macro_name')
    );

    generateTest('named macro, with argument', '=macro_name:arg_name',
      fastDive(['outline'], {
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
      fastDiveText(['outline', 'atom', 'verbatim', 'verbatimSegment', 'escapeSequence'], '\\{')
    );

    generateTest('mid-text escape sequence', 'hel\\{lo',
      fastDiveText(['outline', 'atom', 'verbatim'], 'hel\\{lo')
    );
  });

  describe('meta commands', () => {
    describe('casing', () => {
      generateTest('basic cap first word', '{-|}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'caseMetaCommand', 'capFirstWord'])
      );

      generateTest('basic cap first word', '{>}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'caseMetaCommand', 'lowerFirstChar'])
      );

      generateTest('basic cap first word', '{<}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'caseMetaCommand', 'upperFirstWord'])
      );

      describe('retro', () => {
        generateTest('basic cap first word', '{*-|}',
          fastDiveSimple(['outline', 'atom', 'metaCommand', 'caseMetaCommand', 'retroCase', 'capFirstWord'])
        );

        generateTest('basic cap first word', '{*>}',
          fastDiveSimple(['outline', 'atom', 'metaCommand', 'caseMetaCommand', 'retroCase', 'lowerFirstChar'])
        );

        generateTest('basic cap first word', '{*<}',
          fastDiveSimple(['outline', 'atom', 'metaCommand', 'caseMetaCommand', 'retroCase', 'upperFirstWord'])
        );
      });
    });

    describe('gluing', () => {
      generateTest('glue a nunmber', '{&1}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'glueMetaCommand', 'verbatim'], '1')
      );

      generateTest('glue a nunmber', '{&Y.}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'glueMetaCommand', 'verbatim'], 'Y.')
      );
    });

    describe('if-next-matches', () => {
      generateTest('standard if-next-matches', '{=[AEIOUaeiou]/an/a}',
        fastDive(['outline', 'atom', 'metaCommand'], {
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
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'legacyMetaCommand', 'retroToggleAsterisk'])
      );

      generateTest('retro delete space', '{*!}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'legacyMetaCommand', 'retroDeleteSpace'])
      );

      generateTest('retro insert space', '{*?}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'legacyMetaCommand', 'retroInsertSpace'])
      );

      generateTest('repeat last stroke', '{*+}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'legacyMetaCommand', 'repeatLastStroke'])
      );
    });

    describe('meta macros', () => {
      generateTest('solo meta macro, no argument', '{:my_macro}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'macroMetaCommand', 'macroMetaCommandName'], "my_macro")
      );

      generateTest('solo meta macro, no argument, with numbers', '{:my_macro_123}',
      fastDiveText(['outline', 'atom', 'metaCommand', 'macroMetaCommand', 'macroMetaCommandName'], "my_macro_123")
      );

      generateTest('solo meta macro, with argument', '{:my_macro:my_argument}',
        fastDive(['outline', 'atom', 'metaCommand'], {
          type: 'macroMetaCommand',
          children: [
            fastDiveText(['macroMetaCommandName'], 'my_macro'),
            fastDiveText(['macroMetaCommandArg'], 'my_argument'),
          ]
        })
      );

      generateTest('solo meta macro, with argument, with escape', '{:my_macro:{my_argument\\}}',
      fastDive(['outline', 'atom', 'metaCommand'], {
        type: 'macroMetaCommand',
        children: [
          fastDiveText(['macroMetaCommandName'], 'my_macro'),
          fastDiveText(['macroMetaCommandArg'], '{my_argument\\}'),
        ]
      })
      );

      generateTest('surrounded meta macro, with argument', 'some{:my_macro:my_argument}text', {
        type: 'outline',
        children: [
          fastDiveText(['atom', 'verbatim'], 'some'),
          fastDive(['atom', 'metaCommand'], {
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
            fastDiveText(['outline', 'atom', 'metaCommand', 'ploverMetaCommand', 'ploverCommandName'], commandLower),
          );

          const commandUpper = commandLower.toLocaleUpperCase();
          generateTest('one command parsed, no context, capitalised', `{PLOVER:${commandUpper}}`,
            fastDiveText(['outline', 'atom', 'metaCommand', 'ploverMetaCommand', 'ploverCommandName'], commandUpper),
          );
        }
      });

      describe('set_config', () => {
        generateTest(`simple`, '{PLOVER:set_config:"start_attached": True, "start_capitalized": True}',
          fastDive(['outline', 'atom', 'metaCommand'], {
            type: 'ploverMetaCommand',
            children: [
              fastDiveText(['ploverCommandName'], 'set_config'),
              fastDiveText(['ploverMetaCommandArg'], '"start_attached": True, "start_capitalized": True'),
            ]
          })
        );

        generateTest(`simple, uppercase`, '{PLOVER:SET_CONFIG:"start_attached": True, "start_capitalized": True}',
          fastDive(['outline', 'atom', 'metaCommand'], {
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
            fastDiveText(['outline', 'atom', 'metaCommand', 'modeMetaCommand', 'simpleOutputMode'], modeLower),
          );

          const modeUpper = modeLower.toLocaleUpperCase();
          generateTest('one command parsed, no context, capitalised', `{MODE:${modeUpper}}`,
            fastDiveText(['outline', 'atom', 'metaCommand', 'modeMetaCommand', 'simpleOutputMode'], modeUpper),
          );
        }
      });

      describe('set_space', () => {
        generateTest(`simple`, '{MODE:set_space:blah}',
          fastDiveText(['outline', 'atom', 'metaCommand', 'modeMetaCommand', 'setSpaceOutputMode', 'setSpaceTo'], 'blah')
        );

        generateTest(`simple, uppercase`, '{MODE:SET_SPACE:blah}',
          fastDiveText(['outline', 'atom', 'metaCommand', 'modeMetaCommand', 'setSpaceOutputMode', 'setSpaceTo'], 'blah')
        );
      });
    });

    describe('key combos', () => {
      describe('single key press', () => {
        generateTest(`alphabetic key`, '{#p}',
          fastDiveText(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'p')
        );

        generateTest(`number key`, '{#4}',
          fastDiveText(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], '4')
        );

        generateTest(`function key`, '{#F10}',
          fastDiveText(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'F10')
        );

        generateTest(`accented letter`, '{#acute}',
          fastDiveText(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'acute')
        );

        generateTest(`arrow key`, '{#Down}',
          fastDiveText(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], 'Down')
        );
      });

      describe('special keys', () => {
        const specialKeys = ['BackSpace', 'Up', 'Left', 'Right', 'Down'];

        for (let i = 0; i < specialKeys.length; i++) {
          const specialKey = specialKeys[i];

          generateTest(`special key`, `{#${specialKey}}`,
            fastDiveText(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], specialKey)
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
          fastDive(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'],
            modifierGroup('Control_L',
              fastDiveText(['keyCombos', 'singleKeyCombo'], 'Up')
            )
          )
        );

        generateTest(`nested two deep`, '{#super(shift(x))}',
          fastDive(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos', 'singleKeyCombo'], {
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
          fastDive(['outline', 'atom', 'metaCommand', 'keyComboMetaCommand'], {
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
        fastDiveText(['outline', 'atom', 'metaCommand', 'commaMetaCommand'], ',')
      );

      generateTest(`colon`, '{:}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'commaMetaCommand'], ':')
      );

      generateTest(`semi-colon`, '{;}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'commaMetaCommand'], ';')
      );
    });

    describe('stop meta', () => {
      generateTest(`period`, '{.}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'stopMetaCommand'], '.')
      );

      generateTest(`exclamation mark`, '{!}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'stopMetaCommand'], '!')
      );

      generateTest(`question mark`, '{?}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'stopMetaCommand'], '?')
      );

    });

    describe('word end', () => {
      generateTest(`period`, '{$}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'wordEndMetaCommand'])
      );
    });

    describe('retro currency', () => {
      generateTest(`period`, '{*($c)}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'retroCurrencyMetaCommand', 'retroCurrencyStart'], '$')
      );
    });

    describe('spacing', () => {
      generateTest('space between meta commands is ignored', '{.} {.}', {
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'stopMetaCommand']),
          fastDiveSimple(['atom', 'metaCommand', 'stopMetaCommand'])
        ]
      });

      generateTest('multi meta commands with segments', '{.}{^ `}{-|}',{
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'stopMetaCommand']),
          fastDiveText(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart'], '^ `'),
          fastDiveText(['atom', 'metaCommand', 'caseMetaCommand'], '-|')
        ]
      });

      generateTest('multi meta commands with segments', '{.} `{-|}',{
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'stopMetaCommand']),
          fastDiveText(['atom', 'verbatim'], '`'),
          fastDiveText(['atom', 'metaCommand', 'caseMetaCommand'], '-|')
        ]
      });
    });

    describe('attach', () => {
      generateTest('simple attach', '{^}',
        fastDiveSimple(['outline', 'atom', 'metaCommand', 'attachMetaCommand', 'attachStart'])
      );

      generateTest('simple attach', '{^^}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'attachMetaCommand', 'attachStart'], '^^')
      );

      generateTest('attach symbol correct', '{^}^{^}', {
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart']),
          fastDiveText(['atom', 'verbatim'], '^'),
          fastDiveSimple(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart'])
        ]
      });

      generateTest('attach symbol correct (ignore spaces)', '{^} ^ {^}', {
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart']),
          fastDiveText(['atom', 'verbatim'], '^'),
          fastDiveSimple(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart'])
        ]
      });

      generateTest('attach symbol that starts looking like a stop', '{.^}',
        fastDiveText(['outline', 'atom', 'metaCommand', 'attachMetaCommand', 'attachEnd'], '.^')
      );

      describe('carry capitalisation', () => {

      });
    });

    describe('combinations', () => {
      generateTest('many different atoms, separated by spaces', '{^} {.} hello {.} {#ALT_L(Grave)}{^ ^}', {
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart']),
          fastDiveSimple(['atom', 'metaCommand', 'stopMetaCommand']),
          fastDiveText(['atom', 'verbatim'], 'hello'),
          fastDiveSimple(['atom', 'metaCommand', 'stopMetaCommand']),
          fastDiveText(['atom', 'metaCommand', 'keyComboMetaCommand', 'keyCombos'], 'ALT_L(Grave)'),
          fastDiveText(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart'], '^ ^'),
        ]
      });

      generateTest('many different atoms, no spaces, glue and case', '{-|}{>}{&a}{>}{&b}', {
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'caseMetaCommand', 'capFirstWord']),
          fastDiveSimple(['atom', 'metaCommand', 'caseMetaCommand', 'lowerFirstChar']),
          fastDiveText(['atom', 'metaCommand', 'glueMetaCommand', 'verbatim'], 'a'),
          fastDiveSimple(['atom', 'metaCommand', 'caseMetaCommand', 'lowerFirstChar']),
          fastDiveText(['atom', 'metaCommand', 'glueMetaCommand', 'verbatim'], 'b'),
        ]
      });

      generateTest('many different atoms, no spaces, glue and case', '{-|} equip {^s}', {
        type: 'outline',
        children: [
          fastDiveSimple(['atom', 'metaCommand', 'caseMetaCommand', 'capFirstWord']),
          fastDiveText(['atom', 'verbatim'], 'equip'),
          fastDiveText(['atom', 'metaCommand', 'attachMetaCommand', 'attachStart', 'attachVerbatim'], 's')
        ]
      });
    });
  });
});