import type { ParseFunction, Parser } from "./types.ts";

export type ParserParams<T, IsRequired extends boolean> = {
  readonly parse: ParseFunction<T>;
  readonly required: IsRequired;
  readonly description: string;
  readonly variableName: string | undefined;
};

export function parser<T, IsRequired extends boolean>(
  { description, required, parse, variableName }: ParserParams<T, IsRequired>,
): Parser<T, IsRequired> {
  const params: ParserParams<T, IsRequired> = {
    description,
    required,
    parse,
    variableName,
  };
  return {
    _description: description,
    _parse: parse,
    _required: required,
    _variable: variableName,
    description: (description) => parser({ ...params, description }),
    optional: () => parser({ ...params, required: false }),
    required: () => parser({ ...params, required: true }),
    variable: (variableName) => parser({ ...params, variableName }),
  };
}
