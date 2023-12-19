import { IToken } from "ebnf";
import { isPresent } from "ts-is-present";
import _ from 'lodash';

type CalculationError = {
  errorMessages: Array<string>;
};

function toE(m: string): CalculationError {
  return {
    errorMessages: [m]
  };
}

function mergeErrors(errors: Array<CalculationError>): CalculationError {
  return {
    errorMessages: _.concat(...errors.map(e => e.errorMessages))
  };
}

function astS(ast: IToken): string {
  return `(${ast.type}): ${ast.text}`;
}

export function isCalculationError<T>(v: T | CalculationError): v is CalculationError {
  if (typeof v !== 'object') {
    return false;
  }
  return v !== null &&  'errorMessages' in v;
}

function attachMetaCommandLength(ast: IToken): number | CalculationError {
  if (ast.children.length > 1) {
    return toE(`Did not expect attach meta command to have more than one child ${astS(ast)}`);
  } else if (ast.children.length === 1 && ast.children[0].children.length === 1) {
    const child = ast.children[0].children[0];

    if (child.type !== 'attachVerbatim') {
      return toE(`Expected the attach meta child to be an attach verbatim ${astS(child)}`);
    }

    return child.text.length;
  }

  return 0;
}

function glueMetaCommandLength(ast: IToken): number | CalculationError {
  if (ast.children.length > 1) {
    return toE(`Glue meta command should not have more than one child ${astS(ast)}`);
  } else if (ast.children.length === 1) {
    const child = ast.children[0];
    if (child.type !== 'verbatim') {
      return toE(`Glue meta should have a verbatim child ${astS(child)}`);
    }
    return child.text.length;
  }
  return 0;
}
function ifNextMatchesCommandLength(ast: IToken): number | CalculationError {
  if (ast.children.length !== 3) {
    return toE(`if-next-matches should have three sections ${astS(ast)}`);
  }

  const [_regex, matchSection, notMatchSection] = ast.children;

  return Math.ceil((matchSection.text.length + notMatchSection.text.length) / 2);
}

function retroCurrencyCommandLength(ast: IToken): number | CalculationError {
  if (ast.children.length !== 2) {
    return toE(`retro currency should have two sections ${astS(ast)}`);
  }

  const [before, after] = ast.children;

  return before.text.length + after.text.length;
}

function legacyCommandLength(ast: IToken): number | CalculationError {
  if (ast.children.length !== 1) {
    return toE(`Expected one and only one legacy command ${astS(ast)}`);
  }
  const child = ast.children[0];

  switch(child.type) {
    case 'retroDeleteSpace':
      return -1;
    case 'retroInsertSpace':
      return 1;
    case 'retroToggleAsterisk':
      // Hahhaha, got me good Meta Command, can't work out which command this should magically translate into
      return 0;
    case 'repeatLastStroke':
      // Hahhaha, got me good Meta Command, can't work out which command this should magically translate into
      return 0;
    default:
      return toE(`Unknown legacy command ${astS(child)}`);
  }
}

function carryCapitalisationCommandLength(ast: IToken): number | CalculationError {
  if (ast.children.length === 1) {
    const child = ast.children[0];
    if (child.type !== 'verbatim') {
      return toE(`Expected a verbatim element in carry capitalisation ${astS(ast)}`);
    }
    return child.text.length;
  }

  return 0;
}


function metaCommandLength(ast: IToken): number | CalculationError {
  if (ast.type !== 'metaCommand') {
    return toE(`Passed something that was not a meta command to metaCommandLength ${astS(ast)}`);
  } else if (ast.children.length !== 1) {
    return toE(`Expect one and only one command type ${astS(ast)}`);
  }

  const command = ast.children[0];

  switch (command.type) {
    case 'attachMetaCommand':
      return attachMetaCommandLength(command);
    case 'caseMetaCommand':
      return 0;
    case 'glueMetaCommand':
      return glueMetaCommandLength(command);
    case 'ifNextMatchesMetaCommand':
      return ifNextMatchesCommandLength(command);
    case 'macroMetaCommand':
      // We have no idea what this is going to do, so treat it as zero...even though it probbaly isn't
      return 0;
    case 'ploverMetaCommand':
      // Does not output text, just makes plover do something
      return 0;
    case 'modeMetaCommand':
      // Changes the mode, this will affect spacing but we'll ignore that for now
      // as it will likely create nothing much but a rounding error for most dictionary files
      return 0;
    case 'keyComboMetaCommand':
      // Technically could result in key presses but ignoring for now to
      // avoid having to understand it better
      return 0;
    case 'commaMetaCommand':
      return 1;
    case 'stopMetaCommand':
      return 1;
    case 'wordEndMetaCommand':
      return 0;
    case 'retroCurrencyMetaCommand':
      return retroCurrencyCommandLength(command);
    case 'legacyMetaCommand':
      return legacyCommandLength(command);
    case 'carryCapitalisationMetaCommand':
      return carryCapitalisationCommandLength(command);
    default:
      // By default, assume that the command results in no output
      return 0;
  }
}

export function calculateLength(ast: IToken): number | CalculationError {
  // TODO we are expecting
  if (ast.type !== 'outline') {
    return toE(`We expect this to be a complete 'outline', but instead the root type was ${astS(ast)}`);
  }

  const results = ast.children.map<number | CalculationError>(atom => {
    if (atom.children.length !== 1) {
      return toE(`Expected the atom to have one and only one child ${astS(atom)}`);
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

    return toE(`Could not calculate length for atom ${astS(child)}`);
  });

  const [errors, lengths] = _.partition(results, isCalculationError);

  if (errors.length > 0) {
    return mergeErrors(errors);
  }

  // Currently assuming that every atom will be separated from the other atoms by a space, this is going to be wrong
  // so we should fix this eventually
  const spaces = lengths.length;
  //console.log(errors, lengths);
  return _.sum(lengths) + spaces;
}