# [`@andyb/env`](https://github.com/andybarron/env)

_Parse environment variables in Node, Deno, and Bun_

[Documentation](https://jsr.io/@andyb/env/doc) &bull;
[Source](https://github.com/andybarron/env)

[![JSR Version](https://img.shields.io/jsr/v/%40andyb/env?style=flat&logo=jsr&color=%231e1f45)](https://jsr.io/@andyb/env)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/andybarron/env/ci.yml?branch=main&style=flat&logo=github)](https://github.com/andybarron/env/actions?query=branch%3Amain)
[![Codecov](https://img.shields.io/codecov/c/github/andybarron/env?style=flat&logo=codecov)](https://app.codecov.io/github/andybarron/env)

## Installation

| Package manager | Install command               |
| --------------- | ----------------------------- |
| Bun             | `bunx jsr add @andyb/env`     |
| Deno            | `deno add @andyb/env`         |
| NPM             | `npx jsr add @andyb/env`      |
| PNPM            | `pnpm dlx jsr add @andyb/env` |
| Yarn            | `yarn dlx jsr add @andyb/env` |

## Usage

```ts
import * as env from "@andyb/env";

// Define variables and parsers.
const config = {
  // Reject non-integer numbers.
  INTEGER: env.integer(),
  // Parse arbitrary JSON.
  JSON: env.json(),
  NUMBER: env.number(),
  STRING: env.string(),
  // Reject non-integers and invalid ports.
  PORT: env.port(),
  // Any variable can be made optional.
  OPTIONAL_STRING: env.string().optional(),
  // Custom parsers are also supported.
  CUSTOM_BIG_INT: env.custom(
    "must be a valid BigInt",
    (value: string) => BigInt(value),
  ),
};

// If one or more variables fail to parse, this
// throws a helpful error listing every failure.
const vars = env.parse(
  process.env, // or Deno.env
  config,
);

// Type inference works out of the box. Example:
type InferredTypeOfVars = {
  INTEGER: number;
  JSON: env.JsonValue;
  NUMBER: number;
  STRING: string;
  PORT: number;
  OPTIONAL_STRING: string | undefined;
  CUSTOM_BIG_INT: bigint;
};
```
