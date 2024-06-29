import type { ParseFailure } from "./types.ts";

export class EnvironmentVariableParseError extends Error {
  failures: ParseFailure[];
  constructor(failures: ParseFailure[]) {
    let message = "Failed to parse environment variables";
    if (failures.length) {
      const failSummary = failures.map(({ name, description }) =>
        `${JSON.stringify(name)} ${description}`
      ).join(", ");
      message = `${message}: ${failSummary}`;
    }
    super(message);
    this.name = this.constructor.name;
    this.failures = failures;
  }
}
