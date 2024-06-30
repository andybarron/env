import {
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertStrictEquals,
} from "jsr:@std/assert";
import * as env from "./mod.ts";

const parseBigInt = (value: string) => BigInt(value);

const bigIntParser = env.custom("must be a valid BigInt", parseBigInt);

Deno.test("happy path works for all built-in parsers with Node-like env", async () => {
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

  const vars: ExpectedInferredType = await env.parse(
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

Deno.test("happy path works for all built-in parsers with Deno-like env", async () => {
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

  const vars: ExpectedInferredType = await env.parse(
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

Deno.test("custom parser rejects with provided description", async () => {
  const parse = async () =>
    await env.parse({ VAR: "1.2" }, { VAR: bigIntParser });
  const error = await assertRejects(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a valid BigInt',
  );
});

Deno.test("integer parser rejects non-integer numbers", async () => {
  const parse = async () =>
    await env.parse({ VAR: "1.2" }, { VAR: env.integer() });
  const error = await assertRejects(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be an integer',
  );
});

Deno.test("json parser rejects invalid JSON", async () => {
  const parse = async () =>
    await env.parse({ VAR: "undefined" }, { VAR: env.json() });
  const error = await assertRejects(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be JSON',
  );
});

Deno.test("number parser rejects non-number values", async () => {
  const parse = async () =>
    await env.parse({ VAR: '"1.2"' }, { VAR: env.number() });
  const error = await assertRejects(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a number',
  );
});

Deno.test("port parser rejects integers out of port range", async () => {
  const parse = async () =>
    await env.parse({ VAR: "65536" }, { VAR: env.port() });
  const error = await assertRejects(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a valid port number',
  );
});

Deno.test("port parser rejects non-integer numbers", async () => {
  const parse = async () =>
    await env.parse({ VAR: "8080.1" }, { VAR: env.port() });
  const error = await assertRejects(parse);
  assertInstanceOf(error, env.EnvironmentVariableParseError);
  assertStrictEquals(
    error.message,
    'Failed to parse environment variables: "VAR" must be a valid port number',
  );
});

Deno.test("multiple errors are combined in order based on variable name", async () => {
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
  const parse = async () => await env.parse(testEnv, config);
  const error = await assertRejects(parse);
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
