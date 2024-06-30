// deno-lint-ignore-file no-console
import { assert } from "jsr:@std/assert";
import getQuote from "npm:enquoraging";

export const logStyles = {
  error: "color: red",
  warn: "color: yellow",
  info: "color: cyan",
};

export const log = (
  level: keyof typeof logStyles,
  message: string,
  style?: string,
): void => {
  console[level](`%c${message}`, style ?? logStyles[level]);
};
log.info = log.bind(null, "info");
log.warn = log.bind(null, "warn");
log.error = log.bind(null, "error");

export const sleep = (seconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export const prompt = (message: string, defaultValue?: string): string => {
  const response = globalThis.prompt(message, defaultValue);
  assert(typeof response === "string", "No stdin");
  return response;
};

export type RemoveIndex<T> = {
  [
    K in keyof T as string extends K ? never
      : number extends K ? never
      : symbol extends K ? never
      : K
  ]: T[K];
};

export function printRandomQuote() {
  try {
    const { quote, author }: { quote: string; author: string } = getQuote();
    console.info(
      `%c"${quote}"`,
      "background-color: darkblue; color: white; font-weight: bold",
    );
    console.info(
      `%c ~ ${author}`,
      "font-weight: bold",
    );
  } catch {
    // ignore
  }
}
