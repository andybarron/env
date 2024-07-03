import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
  assertThrows,
} from "jsr:@std/assert";
import * as env from "./mod.ts";
import { parse } from "./parse.ts";

const parseBigInt = (value: string) => BigInt(value);

const bigIntParser = env.custom("must be a valid BigInt", parseBigInt);

Deno.test("happy path works for all built-in parsers with Node-like env", () => {
  const config = {
    INTEGER: env.integer(),
    JSON: env.json(),
    NUMBER: env.number(),
    STRING: env.string(),
    PORT: env.port(),
    OPTIONAL_STRING: env.string().optional(),
    BIG_INT: bigIntParser,
  };

  const testEnv: Record<string, string | undefined> = {
    INTEGER: "2",
    JSON: JSON.stringify({ hello: "world" }),
    NUMBER: "6.28",
    STRING: "theory",
    PORT: "8080",
    // OPTIONAL_STRING intentionally omitted
    BIG_INT: "99999999999999999",
  };

  type ExpectedInferredType = {
    INTEGER: number;
    JSON: env.JsonValue;
    NUMBER: number;
    STRING: string;
    PORT: number;
    OPTIONAL_STRING: string | undefined;
    BIG_INT: bigint;
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
    BIG_INT: 99999999999999999n,
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
    BIG_INT: bigIntParser,
  };

  const values: Record<string, string | undefined> = {
    INTEGER: "2",
    JSON: JSON.stringify({ hello: "world" }),
    NUMBER: "6.28",
    STRING: "theory",
    PORT: "8080",
    // OPTIONAL_STRING intentionally omitted
    BIG_INT: "99999999999999999",
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
    BIG_INT: bigint;
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
    BIG_INT: 99999999999999999n,
  });
});

Deno.test("custom parser rejects with provided description", () => {
  const parse = () => env.parse({ VAR: "1.2" }, { VAR: bigIntParser });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a valid BigInt',
  );
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

Deno.test("boolean parser accepts valid booleans", () => {
  const config = {
    TRUE: env.boolean(),
    FALSE: env.boolean(),
  };
  const testEnv = {
    TRUE: "true",
    FALSE: "false",
  };
  const vars = parse(testEnv, config);
  assertEquals(vars, {
    TRUE: true,
    FALSE: false,
  });
});

Deno.test("boolean parser rejects invalid booleans", () => {
  const parse = () => env.parse({ VAR: "1" }, { VAR: env.boolean() });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be "true" or "false"',
  );
});

Deno.test("optional errors are rejected if parse fails", () => {
  const parse = () =>
    env.parse({ VAR: "12.1" }, { VAR: env.integer().optional() });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" (optional) must be an integer',
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

Deno.test("calling required() makes an optional parser reject missing variables", () => {
  const parser = env.string().optional().required();
  const parse = () => env.parse({}, { VAR: parser });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be set',
  );
});

Deno.test("calling description() changes error message", () => {
  const parse = () =>
    env.parse({ VAR: "1.2" }, {
      VAR: env.integer().description("must be a really cool integer"),
    });
  const error = assertThrows(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a really cool integer',
  );
});

Deno.test("calling variable() changes target environment variable", () => {
  const testEnv = {
    GREETING: "hello",
  };
  const vars = env.parse(testEnv, {
    renamed: env.string().variable("GREETING"),
  });
  assertEquals(vars, {
    renamed: "hello",
  });
});

Deno.test("calling default() makes variable optional and uses default value", () => {
  const testEnv = {
    NAME: "",
  };
  const vars = env.parse(testEnv, {
    name: env.string().variable("NAME").default("Flumpus"),
  });
  assertEquals(vars, {
    name: "Flumpus",
  });
});
