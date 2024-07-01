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

  for (const [key, parser] of Object.entries(config)) {
    const variableName = parser._variable ?? key;
    const description = parser._description;
    const value = get(variableName);
    if (value == undefined) {
      if (parser._required) {
        const cause = new TypeError(`${JSON.stringify(variableName)} not set`);
        failures.push({ name: variableName, description, cause });
      } else {
        values[key] = undefined;
      }
      continue;
    }
    try {
      const parsed = await parser._parse(value);
      values[key] = parsed;
    } catch (error: unknown) {
      failures.push({ name: variableName, description, cause: error });
    }
  }

  if (failures.length) {
    throw new EnvironmentVariableParseError(failures);
  }

  return values as ValuesFromConfig<T>;
}
