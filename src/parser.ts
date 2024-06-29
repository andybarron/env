import { PARSER_INTERNALS_KEY } from "./constants.ts";
import type { ParseFunction, Parser } from "./types.ts";

export function createParser<T>(
  parse: ParseFunction<T>,
  description: string,
): Parser<T, true> {
  const requiredParser: Parser<T, true> = {
    [PARSER_INTERNALS_KEY]: {
      parse,
      isRequired: true,
      description,
    },
    required: () => requiredParser,
    optional: () => optionalParser,
  };
  const optionalParser: Parser<T, false> = {
    [PARSER_INTERNALS_KEY]: {
      parse,
      isRequired: false,
      description,
    },
    required: () => requiredParser,
    optional: () => optionalParser,
  };
  return requiredParser;
}
