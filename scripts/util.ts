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
  // deno-lint-ignore no-console
  console[level](`%c${message}`, style ?? logStyles[level]);
};
log.info = log.bind(null, "info");
log.warn = log.bind(null, "warn");
log.error = log.bind(null, "error");

export const sleep = (seconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
