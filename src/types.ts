import type { PARSER_INTERNALS_KEY } from "./constants.ts";

export type NodeProcessEnv = Record<string, string | undefined>;
export type DenoEnv = {
  get: (key: string) => string | undefined;
};
/**
 * Input type for the {@link parse} function. Compatible with both
 * Node's `process.env` and Deno's `Deno.env`, as well as arbitrary
 * objects with only string values.
 */
export type Environment = NodeProcessEnv | DenoEnv;
/**
 * Function that parses an environment variable into an arbitrary
 * value.
 *
 * Undefined environment variables are handled by the parser, so parse
 * functions don't need to accept null or undefined values (but they
 * may receive empty strings).
 *
 * Parse functions may optionally be asynchronous / return promises.
 */
export type ParseFunction<T> = (
  value: string,
) => T | PromiseLike<T>;
/**
 * Arbitrary JSON value. Because `any` is so 2014.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [property: string]: JsonValue }
  | JsonValue[];
/**
 * Environment variable parser created by built-in parser
 * functions (e.g. {@link integer}, {@link json}) or by user-defined
 * custom parse functions (via {@link custom}).
 */
export type Parser<T, IsRequired extends boolean> = {
  /** Create an identical parser that allows undefined environment variables. */
  required: () => Parser<T, true>;
  /** Create an identical parser that rejects undefined environment variables. */
  optional: () => Parser<T, false>;
  /** @internal */
  [PARSER_INTERNALS_KEY]: ParserInternals<T, IsRequired>;
};

export type ParserInternals<T, IsRequired extends boolean> = {
  parse: ParseFunction<T>;
  isRequired: IsRequired;
  description: string;
};

/**
 * Base type for defining the expected shape of the environment.
 *
 * When used directly, prefer the TypeScript `satisfies` operator:
 * @example
 * ```ts
 * // GOOD: Allows full type inference for `parse`
 * const config = {
 *   // insert parsers here
 * } satisfies EnvironmentConfig;
 *
 * // BAD: Clobbers type inference
 * const config: EnvironmentConfig = {
 *   // insert parsers here
 * };
 * ```
 */
export type EnvironmentConfig = Record<string, Parser<unknown, boolean>>;
export type TypeFromParser<T> = T extends Parser<infer U, infer IsRequired>
  ? IsRequired extends true ? U : (U | undefined)
  : never;
export type ValuesFromConfig<T extends EnvironmentConfig> = {
  [K in keyof T]: TypeFromParser<T[K]>;
};

/**
 * Information about an environment variable that failed to parse
 */
export type ParseFailure = {
  /** Environment variable name */
  name: string;
  /** Description of what the value should be */
  description: string;
  /** Underlying error that was thrown during parsing */
  cause: unknown;
};
