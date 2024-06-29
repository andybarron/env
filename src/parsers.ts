import { createParser } from "./parser.ts";
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

const stringParser: Parser<string, true> = createParser(
  parseString,
  "must be set",
);
const jsonParser: Parser<JsonValue, true> = createParser(
  parseJson,
  "must be JSON",
);
const numberParser: Parser<number, true> = createParser(
  parseNumber,
  "must be a number",
);
const integerParser: Parser<number, true> = createParser(
  parseInteger,
  "must be an integer",
);
const portParser: Parser<number, true> = createParser(
  parsePort,
  "must be a valid port number",
);

export const string = () => stringParser;
export const json = () => jsonParser;
export const number = () => numberParser;
export const integer = () => integerParser;
export const port = () => portParser;
