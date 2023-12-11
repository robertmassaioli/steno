import {describe, expect, test, it } from '@jest/globals';
import { getParser, printAST } from './lexer';
import { IToken } from 'ebnf';
import { isPresent } from 'ts-is-present';

function assertParse(ast: IToken, input: string) {
  expect(ast).toBeDefined();
  expect(ast.text).toEqual(input);
}

function toAST(input: string): IToken {
  return getParser().getAST(input, 'output');
}

type TokenMatch = {
  text?: string;
  type: string;
  children?: TokenMatch[];
};

function expectTokenMatch(a: IToken, e: TokenMatch) {
  expectTokenMatchHelper({e, a, currentPath: '<root>' });
}

type TokenMatchState = {
  e: TokenMatch,
  a: IToken,
  currentPath: string
};

function zipArrays<T, U>(arr1: T[], arr2: U[]): Array<[T, U]> {
  const result: Array<[T, U]> = [];

  const minLength = Math.min(arr1.length, arr2.length);

  for (let i = 0; i < minLength; i++) {
    result.push([arr1[i], arr2[i]]);
  }

  return result;
}

function expectTokenMatchHelper({e, a, currentPath}: TokenMatchState) {
  it(`${currentPath}: expected type "${e.type}"`, () => {
    expect(a.type).toEqual(e.type);
  });

  if(isPresent(e.text)) {
    it(`${currentPath}: expected text "${e.text}"`, () => {
      expect(a.text).toEqual(e.text);
    });
  }
  if (isPresent(e.children)) {
    const { children } = e;
    it(`${currentPath}: expected children length to be ${children.length}`, () => {
      expect(a.children).toHaveLength(children.length);
    });

    zipArrays(a.children, children).forEach((value, i) => {
      const [childA, childE] = value;
      expectTokenMatchHelper({
        a: childA,
        e: childE,
        currentPath: `${currentPath}[${i}.${childE.type}]` // TODO this is ugly
      });
    })
  }
}

function generateTest(testName: string, input: string, expected: TokenMatch): void {
  describe(testName, () => {
    const ast = toAST(input);

    printAST(ast);
    it('should parse successfully', () => {
      assertParse(ast, input);
    });

    expectTokenMatch(ast, {
      ...expected,
      text: input
    });
  });
}

function fastDive(directPath: string[], lastChild: TokenMatch): TokenMatch {
  const result: TokenMatch = lastChild;
  let current = result;

  for (const type of directPath.reverse()) {
    const newToken: TokenMatch = { type, children: [current] };
    current = newToken;
  }

  return current;
}

function fastDiveSimple(directPath: string[]): TokenMatch {
  if (directPath.length === 0) {
    throw new Error("Direct path cannot be empty");
  }

  let result: TokenMatch | undefined;

  for (const type of directPath.reverse()) {
    const newToken: TokenMatch = { type, children: result ? [result] : undefined };
    result = newToken;
  }

  return result!;
}

function fastDiveText(directPath: string[], expectedText: string): TokenMatch {
  if (directPath.length === 0) {
    throw new Error("Direct path cannot be empty");
  }

  let result: TokenMatch | undefined;

  for (const type of directPath.reverse()) {
    const newToken: TokenMatch = {
      type,
      children: result ? [result] : undefined,
      text: result ? undefined : expectedText,
    };
    result = newToken;
  }

  return result!;
}

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
    })
  });
});