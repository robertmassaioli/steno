import { Grammars, IToken } from 'ebnf';
import fs from 'fs';

const ploverEbnfPath = require.resolve('./plover.ebnf');


export function getParser(): Grammars.W3C.Parser {
  const dictionaryOutputBNF = fs.readFileSync(ploverEbnfPath).toString('utf-8');
  console.log('dictionary content', dictionaryOutputBNF);
  const parser = new Grammars.W3C.Parser(dictionaryOutputBNF);
  console.log(parser.emitSource());
  return parser;
}

export function printAST(ast: IToken): void {
  printASTHelper(ast, {
    depth: 0
  });
}

type PrintASTState = {
  depth: number;
};

function indent(depth: number): string {
  return '  '.repeat(depth);
}

function printASTHelper(ast: IToken, state: PrintASTState) {
  const ind = indent(state.depth);
  console.log(`${ind}- ${ast.type} (${ast.text})`);
  ast.children.forEach(child => printASTHelper(child, { ...state, depth: state.depth + 1 }));
}