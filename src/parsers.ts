import { createParser } from "./parser.ts";
import type { JsonValue, ParseFunction } from "./types.ts";

const parseString: ParseFunction<string> = (value) => value;
const parseJson = ((value: string): JsonValue => {
  return JSON.parse(value);
}) satisfies ParseFunction<JsonValue>;
const parseNumber = ((value: string): number => {
  const json: unknown = JSON.parse(value);
  if (typeof json !== "number" || Number.isNaN(json)) {
    throw new TypeError(
      `${JSON.stringify(value)} cannot be parsed as a number`,
    );
  }
  return json;
}) satisfies ParseFunction<number>;
const parseInteger = ((value: string): number => {
  const number = parseNumber(value);
  if (!Number.isInteger(number)) {
    throw new TypeError(
      `${JSON.stringify(value)} cannot be parsed as an integer`,
    );
  }
  return number;
}) satisfies ParseFunction<number>;

const stringParser = createParser(parseString, "must be set");
const jsonParser = createParser(parseJson, "must be JSON");
const numberParser = createParser(parseNumber, "must be a number");
const integerParser = createParser(parseInteger, "must be an integer");

export const string = () => stringParser;
export const json = () => jsonParser;
export const number = () => numberParser;
export const integer = () => integerParser;
