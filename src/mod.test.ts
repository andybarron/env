import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
  assertThrows,
} from "jsr:@std/assert";
import * as env from "./mod.ts";

Deno.test("happy path works for all built-in parsers with Node-like env", () => {
  const config = {
    INTEGER: env.integer(),
    JSON: env.json(),
    NUMBER: env.number(),
    STRING: env.string(),
    PORT: env.port(),
    OPTIONAL_STRING: env.string().optional(),
  };

  const testEnv: Record<string, string | undefined> = {
    INTEGER: "2",
    JSON: JSON.stringify({ hello: "world" }),
    NUMBER: "6.28",
    STRING: "theory",
    PORT: "8080",
    // OPTIONAL_STRING intentionally omitted
  };

  type ExpectedInferredType = {
    INTEGER: number;
    JSON: env.JsonValue;
    NUMBER: number;
    STRING: string;
    PORT: number;
    OPTIONAL_STRING: string | undefined;
  };

  const vars: ExpectedInferredType = env.parse(
    testEnv,
    config,
  );

  assertEquals(vars, {
    INTEGER: 2,
    JSON: {
      hello: "world",
    },
    NUMBER: 6.28,
    OPTIONAL_STRING: undefined,
    PORT: 8080,
    STRING: "theory",
  });
});

Deno.test("happy path works for all built-in parsers with Deno-like env", () => {
  const config = {
    INTEGER: env.integer(),
    JSON: env.json(),
    NUMBER: env.number(),
    STRING: env.string(),
    PORT: env.port(),
    OPTIONAL_STRING: env.string().optional(),
  };

  const values: Record<string, string | undefined> = {
    INTEGER: "2",
    JSON: JSON.stringify({ hello: "world" }),
    NUMBER: "6.28",
    STRING: "theory",
    PORT: "8080",
    // OPTIONAL_STRING intentionally omitted
  };

  const testEnv = {
    get(name: string): string | undefined {
      return values[name];
    },
  };

  type ExpectedInferredType = {
    INTEGER: number;
    JSON: env.JsonValue;
    NUMBER: number;
    STRING: string;
    PORT: number;
    OPTIONAL_STRING: string | undefined;
  };

  const vars: ExpectedInferredType = env.parse(
    testEnv,
    config,
  );

  assertEquals(vars, {
    INTEGER: 2,
    JSON: {
      hello: "world",
    },
    NUMBER: 6.28,
    OPTIONAL_STRING: undefined,
    PORT: 8080,
    STRING: "theory",
  });
});

Deno.test("integer parser rejects non-integer numbers", () => {
  const parse = () => env.parse({ VAR: "1.2" }, { VAR: env.integer() });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be an integer',
  );
});

Deno.test("json parser rejects invalid JSON", () => {
  const parse = () => env.parse({ VAR: "undefined" }, { VAR: env.json() });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be JSON',
  );
});

Deno.test("number parser rejects non-number values", () => {
  const parse = () => env.parse({ VAR: '"1.2"' }, { VAR: env.number() });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a number',
  );
});

Deno.test("port parser rejects integers out of port range", () => {
  const parse = () => env.parse({ VAR: "65536" }, { VAR: env.port() });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a valid port number',
  );
});

Deno.test("port parser rejects non-integer numbers", () => {
  const parse = () => env.parse({ VAR: "8080.1" }, { VAR: env.port() });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a valid port number',
  );
});

Deno.test("multiple errors are combined in order based on variable name", () => {
  const config = {
    D_PORT: env.port(),
    A_NUMBER: env.number(),
    B_INTEGER: env.integer(),
    C_STRING: env.string(),
  };
  const testEnv = {
    C_STRING: undefined,
    B_INTEGER: "1.2",
    A_NUMBER: "null",
  };
  const parse = () => env.parse(testEnv, config);
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    [
      "Failed to parse environment variables:",
      '"A_NUMBER" must be a number,',
      '"B_INTEGER" must be an integer,',
      '"C_STRING" must be set,',
      '"D_PORT" must be a valid port number',
    ].join(" "),
  );
});

Deno.test("chaining required() and optional() calls returns the same parser instance", () => {
  const original = env.string();
  const copy = original.required().required().optional().optional().required();
  assertStrictEquals(copy, original);
});
