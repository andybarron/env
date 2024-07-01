import type { ParseFailure } from "./types.ts";

/**
 * Error type with information on every variable that failed to parse
 */
export class EnvironmentVariableParseError extends Error {
  /**
   * List of all parse failures that occurred
   */
  failures: ParseFailure[];
  constructor(allFailures: readonly ParseFailure[]) {
    const failures = allFailures.toSorted(failureSort);
    let message = "Failed to parse environment variables";
    if (failures.length) {
      const failSummary = failures.map(({ variable, parser }) => {
        const variableName = JSON.stringify(variable);
        const variableDescription = parser._required
          ? variableName
          : `${variableName} (optional)`;
        return `${variableDescription} ${parser._description}`;
      }).join(", ");
      message = `${message}: ${failSummary}`;
    }
    super(message);
    this.name = this.constructor.name;
    this.failures = failures;
  }
}

const failureSort = (a: ParseFailure, b: ParseFailure): -1 | 0 | 1 => {
  if (a.variable < b.variable) {
    return -1;
  }
  if (a.variable > b.variable) {
    return 1;
  }
  return 0; // TODO: coverage ignore - https://github.com/denoland/deno/issues/16626
};
