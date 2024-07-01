import { parser } from "./parser.ts";
import type { JsonValue, ParseFunction, Parser } from "./types.ts";

const parseString: ParseFunction<string> = (value) => value;
const parseJson = (value: string): JsonValue => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new TypeError("Invalid JSON", { cause: error });
  }
};
const parseNumber = (value: string): number => {
  try {
    const json: unknown = JSON.parse(value);
    if (typeof json !== "number" || Number.isNaN(json)) {
      throw new TypeError("Invalid number");
    }
    return json;
  } catch (error) {
    throw new Error("Value cannot be parsed as a number", { cause: error });
  }
};
const parseInteger = (value: string): number => {
  try {
    const number = parseNumber(value);
    if (!Number.isInteger(number)) {
      throw new TypeError("Number is not an integer");
    }
    return number;
  } catch (error) {
    throw new TypeError(
      "Value cannot be parsed as an integer",
      { cause: error },
    );
  }
};
const parsePort = (value: string): number => {
  try {
    const integer = parseInteger(value);
    if (integer < 0 || integer > 65535) {
      throw new TypeError("Integer out of port range");
    }
    return integer;
  } catch (error) {
    throw new TypeError(
      "Value cannot be parsed as a port number",
      { cause: error },
    );
  }
};
const parseBoolean = (value: string): boolean => {
  switch (value) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      throw new TypeError("Value cannot be parsed as a boolean");
  }
};

const stringParser: Parser<string, true> = parser({
  description: "must be set",
  parse: parseString,
  required: true,
  variableName: undefined,
});
const jsonParser: Parser<JsonValue, true> = parser({
  description: "must be JSON",
  parse: parseJson,
  required: true,
  variableName: undefined,
});
const numberParser: Parser<number, true> = parser({
  description: "must be a number",
  parse: parseNumber,
  required: true,
  variableName: undefined,
});
const integerParser: Parser<number, true> = parser({
  description: "must be an integer",
  parse: parseInteger,
  required: true,
  variableName: undefined,
});
const portParser: Parser<number, true> = parser({
  description: "must be a valid port number",
  parse: parsePort,
  required: true,
  variableName: undefined,
});
const booleanParser: Parser<boolean, true> = parser({
  description: 'must be "true" or "false"',
  parse: parseBoolean,
  required: true,
  variableName: undefined,
});

/** Create a `string` parser. */
export const string = () => stringParser;
/** Create a parser for arbitrary valid JSON. */
export const json = () => jsonParser;
/** Create a parser for numbers. */
export const number = () => numberParser;
/** Create a parser for numbers that only accepts integers. */
export const integer = () => integerParser;
/**
 * Create a parser for integers that only accepts valid port numbers
 * (0-65535).
 */
export const port = () => portParser;
/** Create a parser for booleans. (Accepts the values `"true"` and `"false"`.) */
export const boolean = () => booleanParser;

/**
 * Create a custom parser from a description (e.g. `"must be a valid BigInt"`)
 * and a parse function. The description will be used to generate error
 * messages when the parse function fails for a variable.
 */
export const custom = <T>(
  description: string,
  parse: ParseFunction<T>,
): Parser<T, true> => {
  return parser({
    description,
    parse,
    required: true,
    variableName: undefined,
  });
};
