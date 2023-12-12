import {describe, expect, it } from '@jest/globals';
import { getParser, printAST, toASTString } from './lexer';
import { IToken } from 'ebnf';
import { isPresent } from 'ts-is-present';

export function assertParse(ast: IToken, input: string) {
  expect(ast).toBeDefined();
  expect(ast.text).toEqual(input);
}

export function toAST(input: string): IToken | null {
  return getParser().getAST(input, 'output');
}

export type TokenMatch = {
  text?: string;
  type: string;
  children?: TokenMatch[];
};

export function expectTokenMatch(a: IToken, e: TokenMatch) {
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

export function generateTest(testName: string, input: string, expected: TokenMatch): void {
  describe(`${testName}: ${input}`, () => {
    const ast = toAST(input);

    it('should not have any remainder', () => {
      expect(ast?.errors || []).toHaveLength(0)
      expect(ast?.rest || "").toHaveLength(0);
    });

    if (isPresent(ast)) {
      const astString = toASTString(ast);
      console.log(`${testName} AST:\n\n${astString}`);

      it('should parse successfully', () => {
        assertParse(ast, input);
      });

      expectTokenMatch(ast, {
        ...expected,
        text: input
      });
    } else {
      it('should parse successfully', () => {
        expect(ast).not.toBeNull();
      });
    }
  });
}

export function fastDive(directPath: string[], lastChild: TokenMatch): TokenMatch {
  const result: TokenMatch = lastChild;
  let current = result;

  for (const type of directPath.reverse()) {
    const newToken: TokenMatch = { type, children: [current] };
    current = newToken;
  }

  return current;
}

export function fastDiveSimple(directPath: string[]): TokenMatch {
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

export function fastDiveText(directPath: string[], expectedText: string): TokenMatch {
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