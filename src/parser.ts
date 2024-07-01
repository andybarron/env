import type { ParseFunction, Parser, ParserType } from "./types.ts";

export type ParserParams<
  T,
  Type extends ParserType,
> = {
  readonly parse: ParseFunction<T>;
  readonly type: Type;
  readonly description: string;
  readonly variableName: string | undefined;
  readonly defaultValue: Type extends "default" ? T : undefined;
};

export function parser<T, Type extends ParserType>(
  {
    parse,
    type,
    description,
    variableName,
    defaultValue,
  }: ParserParams<T, Type>,
): Parser<T, Type> {
  const params: ParserParams<T, Type> = {
    parse,
    type,
    description,
    variableName,
    defaultValue,
  };
  return {
    _description: description,
    _parse: parse,
    _variable: variableName,
    _defaultValue: defaultValue,
    _type: type,
    required: () =>
      parser({ ...params, type: "required", defaultValue: undefined }),
    optional: () =>
      parser({ ...params, type: "optional", defaultValue: undefined }),
    default: (defaultValue) =>
      parser({ ...params, type: "default", defaultValue }),
    variable: (variableName) => parser({ ...params, variableName }),
    description: (description) => parser({ ...params, description }),
  };
}
