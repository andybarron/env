import { PARSER_INTERNALS_KEY } from "./constants.ts";
import { EnvironmentVariableParseError } from "./errors.ts";
import type {
  DenoEnv,
  Environment,
  EnvironmentConfig,
  ParseFailure,
  ValuesFromConfig,
} from "./types.ts";

function isDenoEnv(env: Environment): env is DenoEnv {
  return typeof env.get === "function";
}

/**
 * Parse data from a given environment. Both `process.env` and
 * `Deno.env` are supported.
 *
 * Custom parsers can be asynchronous, so this function returns
 * a promise.
 */
export async function parse<T extends EnvironmentConfig>(
  env: Environment,
  config: T,
): Promise<ValuesFromConfig<T>> {
  const get = isDenoEnv(env)
    ? (name: string) => env.get(name)
    : (name: string) => env[name];
  const values: Record<string, unknown> = {};
  const failures: ParseFailure[] = [];

  for (const [name, parser] of Object.entries(config)) {
    const { description, isRequired, parse } = parser[PARSER_INTERNALS_KEY];
    const value = get(name);
    if (value == undefined) {
      if (isRequired) {
        const cause = new TypeError(`${JSON.stringify(name)} not set`);
        failures.push({ name, description, cause });
      } else {
        values[name] = undefined;
      }
      continue;
    }
    try {
      const parsed = await parse(value);
      values[name] = parsed;
    } catch (error: unknown) {
      failures.push({ name, description, cause: error });
    }
  }

  if (failures.length) {
    throw new EnvironmentVariableParseError(failures);
  }

  return values as ValuesFromConfig<T>;
}
