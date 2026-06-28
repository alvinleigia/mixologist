type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
  };
}

export function logEvent(
  level: LogLevel,
  event: string,
  fields: LogFields = {},
) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
}

export function logError(
  event: string,
  error: unknown,
  fields: LogFields = {},
) {
  logEvent("error", event, {
    ...fields,
    error: normalizeError(error),
  });
}
