import { Grammars, IToken } from 'ebnf';
import fs from 'fs';
import _ from 'lodash';

const ploverEbnfPath = require.resolve('./plover.ebnf');


export function getParser(): Grammars.W3C.Parser {
  const dictionaryOutputBNF = fs.readFileSync(ploverEbnfPath).toString('utf-8');
  const parser = new Grammars.W3C.Parser(dictionaryOutputBNF);
  //console.log(parser.emitSource());
  return parser;
}

export function toAST(parser: Grammars.W3C.Parser, input: string): IToken | null {
  return parser.getAST(input, 'outline');
}

export function printAST(ast: IToken): void {
  console.log(toASTString(ast));
}

export function toASTString(ast: IToken): string {
  return printASTHelper(ast, {
    depth: 0
  }).join('\n');
}

type PrintASTState = {
  depth: number;
};

function indent(depth: number): string {
  return '  '.repeat(depth);
}

function printASTHelper(ast: IToken, state: PrintASTState): Array<string> {
  const lines = new Array<string>();
  const ind = indent(state.depth);
  lines.push(`${ind}- ${ast.type} (${ast.text})`);
  ast.children.map(child => printASTHelper(child, { ...state, depth: state.depth + 1 })).forEach(result => lines.push(...result));
  return lines;
}

export function astIs(ast: IToken, tree: Array<string>): boolean {
  while (tree.length > 0) {
    const current = _.head(tree);

    if (current !== ast.type || ast.children.length !== 1) {
      return false;
    }

    ast = ast.children[0];
    tree = _.tail(tree);
  }

  return true;
}