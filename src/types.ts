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
 * Missing and empty environment variables are handled by the parser,
 * so parse functions don't need to accept `null`, `undefined`, or
 * empty strings.
 */
export type ParseFunction<T> = (value: string) => T;
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
 * custom parse functions (via {@link custom}). Intended for use by
 * the {@link parse} function.
 *
 * All configuration functions are chainable:
 * @example
 * ```ts
 * const envConfig = {
 *   json: env.json()
 *     .optional()
 *     .description('must be valid JSON'),
 * };
 * ```
 */
export type Parser<T, Type extends ParserType = ParserType> = {
  /** Create a copy of this parser that allows undefined or empty environment variables. */
  readonly required: () => Parser<T, "required">;
  /** Create a copy of this parser that rejects undefined or empty environment variables. */
  readonly optional: () => Parser<T, "optional">;
  /** Create a copy of this parser that uses a default value when none is provided. */
  readonly default: (value: T) => Parser<T, "default">;
  /** Create a copy of this parser that targets a different environment variable. */
  readonly variable: (name: string) => Parser<T, Type>;
  /** Create a copy of this parser with a different description (e.g. `"must be valid JSON"`). */
  readonly description: (description: string) => Parser<T, Type>;
  readonly _parse: ParseFunction<T>;
  readonly _description: string;
  readonly _type: Type;
  readonly _variable: string | undefined;
  readonly _defaultValue: T | undefined;
};

export type ParserType = "required" | "optional" | "default";

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
// deno-lint-ignore no-explicit-any
export type EnvironmentConfig = Record<string, Parser<any>>;
type ParserTypeMap<T> = {
  required: T;
  default: T;
  optional: T | undefined;
};
export type TypeFromParser<T> = T extends Parser<infer U, infer Type>
  ? ParserTypeMap<U>[Type]
  : never;
export type ValuesFromConfig<T extends EnvironmentConfig> = {
  [K in keyof T]: TypeFromParser<T[K]>;
};

/**
 * Information about an environment variable that failed to parse
 */
export type ParseFailure = {
  /** Environment variable name */
  variable: string;
  /** Parser that rejected the value */
  parser: Parser<unknown>;
  /** Underlying error that was thrown during parsing */
  cause: unknown;
};
