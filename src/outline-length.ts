import { IToken } from "ebnf";
import { isPresent } from "ts-is-present";

type CalculationError = {
  errorMessages: Array<string>;
};

function toE(m: string): CalculationError {
  return {
    errorMessages: [m]
  };
}

export function isCalculationError<T extends object>(v: T | CalculationError): v is CalculationError {
  if (!isPresent(v)) {
    return false;
  }
  if (typeof v !== 'object') {
    return false;
  }
  return 'errorMessage' in v;
}

function metaCommandLength(ast: IToken): number | CalculationError {
  // if (ast.type !== 'metaCommand')
  return 0;
}

export function calculateLength(ast: IToken): number | CalculationError {
  // TODO we are expecting
  if (ast.type !== 'outline') {
    return toE(`We expect this to be a complete 'outline', but instead the root type was: ${ast.type}`);
  }

  const lengths = ast.children.map<number | CalculationError>(atom => {
    if (atom.children.length !== 1) {
      return {
        errorMessages: [`Expected the atom to have one and only one child (${atom.type}): ${atom.text}`]
      };
    }
    const child = atom.children[0];

    switch (child.type) {
      case 'verbatim':
        return child.text.length;
      case 'resetFormatting':
        return 0;
      case 'metaCommand':
        return metaCommandLength(child);
    }

    return {
      errorMessages: [`Could not calculate length for atom (${child.type}): ${child.text}}`]
    };
  });

  return 0;
}