import { Grammars, IToken } from 'ebnf';
import fs from 'fs';

const ploverEbnfPath = require.resolve('./plover.ebnf');


export function getParser(): Grammars.W3C.Parser {
  const dictionaryOutputBNF = fs.readFileSync(ploverEbnfPath).toString('utf-8');
  const parser = new Grammars.W3C.Parser(dictionaryOutputBNF);
  //console.log(parser.emitSource());
  return parser;
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