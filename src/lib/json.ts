import type { Prisma } from "@prisma/client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const array: Prisma.InputJsonArray = value.map((item) => toPrismaJsonValue(item));
    return array;
  }

  if (isRecord(value)) {
    const object: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, entryValue] of Object.entries(value)) {
      if (entryValue !== undefined) {
        object[key] = toPrismaJsonValue(entryValue);
      }
    }

    return object;
  }

  return String(value);
}

export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
