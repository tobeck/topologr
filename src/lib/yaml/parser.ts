import YAML from "yaml";
import { yamlDocumentSchema, type ValidatedYAMLDocument } from "./schemas";

export interface ParseResult {
  success: true;
  data: ValidatedYAMLDocument;
}

export interface ParseError {
  success: false;
  errors: string[];
}

/**
 * Parse and validate a YAML string into a ServiceMap document.
 * Returns either the validated document or a list of human-readable errors.
 */
export function parseServiceYAML(input: string): ParseResult | ParseError {
  // Reject tabs — YAML allows them but they cause confusion
  if (input.includes("\t")) {
    return {
      success: false,
      errors: [
        "YAML contains tab characters. Use spaces for indentation instead.",
      ],
    };
  }

  let raw: unknown;
  try {
    raw = YAML.parse(input);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to parse YAML";
    return { success: false, errors: [message] };
  }

  if (raw === null || raw === undefined) {
    return { success: false, errors: ["YAML document is empty"] };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      success: false,
      errors: ["YAML root must be an object with 'services' and 'connections' keys"],
    };
  }

  const result = yamlDocumentSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
