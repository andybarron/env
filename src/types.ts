import type { PARSER_INTERNALS_KEY } from "./constants.ts";

export type NodeProcessEnv = Record<string, string | undefined>;
export type DenoEnv = {
  get: (key: string) => string | undefined;
};
export type Environment = NodeProcessEnv | DenoEnv;
export type ParseFunction<T> = (
  value: string,
) => T | PromiseLike<T>;
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [property: string]: JsonValue }
  | JsonValue[];
export type Parser<T, IsRequired extends boolean> = {
  required: () => Parser<T, true>;
  optional: () => Parser<T, false>;
  [PARSER_INTERNALS_KEY]: ParserInternals<T, IsRequired>;
};

export type ParserInternals<T, IsRequired extends boolean> = {
  parse: ParseFunction<T>;
  isRequired: IsRequired;
  description: string;
};

export type EnvironmentConfig = Record<string, Parser<unknown, boolean>>;
export type TypeFromParser<T> = T extends Parser<infer U, infer IsRequired>
  ? IsRequired extends true ? U : (U | undefined)
  : never;
export type ValuesFromConfig<T extends EnvironmentConfig> = {
  [K in keyof T]: TypeFromParser<T[K]>;
};

export type ParseFailure = {
  name: string;
  description: string;
  cause: unknown;
};
