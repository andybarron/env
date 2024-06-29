# `@andyb/env`

_Parse environment variables in Node, Deno, and Bun_

[![JSR Score](https://jsr.io/badges/@andyb/env/score)](https://jsr.io/@andyb/env)
[![JSR](https://jsr.io/badges/@andyb/env)](https://jsr.io/@andyb/env)
[![JSR Scope](https://jsr.io/badges/@andyb)](https://jsr.io/@andyb)

## Installation

| Package manager | Install command                |
| --------------- | ------------------------------ |
| Bun             | `bunx jsr add @andyb/env`      |
| Deno            | `deno add @andyb/env`          |
| NPM             | `npx jsr add @andyb/env`       |
| PNPM            | `pnpm dlx jsr add @andyb/env`z |
| Yarn            | `yarn dlx jsr add @andyb/env`  |

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
};
```
