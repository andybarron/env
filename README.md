# [`@andyb/env`](https://github.com/andybarron/env)

_Zero-dependency environment variable parsing in Node, Deno, and Bun_

[Documentation](https://jsr.io/@andyb/env/doc) &bull;
[Source](https://github.com/andybarron/env)

[![JSR Version](https://img.shields.io/jsr/v/%40andyb/env?style=flat&logo=jsr&color=%231e1f45)](https://jsr.io/@andyb/env)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/andybarron/env/ci.yml?branch=main&style=flat&logo=github)](https://github.com/andybarron/env/actions?query=branch%3Amain)
[![Codecov](https://img.shields.io/codecov/c/github/andybarron/env?style=flat&logo=codecov)](https://app.codecov.io/github/andybarron/env)
[![JSR Dependencies](https://img.shields.io/badge/dependencies-0-8A2BE2)](https://jsr.io/@andyb/env/dependencies)

## Installation

| Tool                         | Install command               |
| ---------------------------- | ----------------------------- |
| [Bun](https://bun.sh)        | `bunx jsr add @andyb/env`     |
| [Deno](https://deno.com)     | `deno add @andyb/env`         |
| [NPM](https://www.npmjs.com) | `npx jsr add @andyb/env`      |
| [PNPM](https://pnpm.io)      | `pnpm dlx jsr add @andyb/env` |
| [Yarn](https://yarnpkg.com)  | `yarn dlx jsr add @andyb/env` |

## Quickstart

```ts
import * as env from "@andyb/env";

// parse() is compatible with process.env in Node and Deno.env in Deno.
// On failure, the thrown error will report every variable that failed to parse.
const config = parse(process.env, {
  // Specify expected type and environment variable name.
  favoriteNumber: env.integer().variable("FAVORITE_NUMBER"),
  // Mark some environment variables as optional. They will only be parsed if present.
  nickname: env.string().variable("NICKNAME").optional(),
  // Default values can be provided. This makes the variable optional as well.
  lovesDeno: env.boolean().variable("LOVES_DENO").default(true),
  // If no variable is specified, the property name will be used.
  TZ: env.string(),
});

// config will have its type inferred correctly:
type InferredType = {
  favoriteNumber: number;
  nickname: string | undefined;
  lovesDeno: boolean;
  TZ: string;
};
```

## Custom parsers

```ts
import * as env from "@andyb/env";
import ms from "ms";

// To parse custom types, provide a description and a parser function.
function duration() {
  return env.custom(
    'must be a duration e.g. "10 seconds"',
    (value: string): number => ms(value),
  );
}

const config = parse(process.env, {
  // Custom parsers have the same chainable configuration methods as the
  // built-in parsers.
  timeoutMs: duration().variable("TIMEOUT").optional(),
});

// Type inference works for custom and async parsers as well:
type InferredType = {
  timeoutMs: number;
  healthCheck: number;
};
```

## Built-in parser types

```ts
import * as env from "@andyb/env";

const config = env.parse(process.env, {
  BOOLEAN: env.boolean(), // only accepts "true" and "false"
  INTEGER: env.integer(),
  JSON: env.json(), // accepts any valid JSON value
  NUMBER: env.number(),
  PORT: env.port(), // accepts integers from 0 to 65545
  STRING: env.string(),
});

type InferredType = {
  BOOLEAN: boolean;
  INTEGER: number;
  JSON: env.JsonValue;
  NUMBER: number;
  PORT: number;
  STRING: string;
};
```
