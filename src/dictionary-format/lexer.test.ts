import {describe, expect, test, it } from '@jest/globals';
import { getParser, printAST } from './lexer';
import { IToken } from 'ebnf';

function assertParse(ast: IToken, input: string) {
  expect(ast).toBeDefined();
  expect(ast.text).toEqual(input);
}

describe("lexer", () => {
  describe('escape sequences', () => {
    it('basic escape sequence', () => {
      const parser = getParser();
      const input = '\\{';
      const ast = parser.getAST(input, 'output');

      printAST(ast);
      assertParse(ast, input);

      expect(ast.children.length).toEqual(1);
      expect(ast.children[0].type).toEqual('segment');
    });
  });
});