import { getErrorMessage } from './errorMessages';

/**
 * Remove markdown code block wrappers from text
 */
export function removeMarkdownWrapper(text: string): string {
  let jsonText = text.trim();

  // Remove opening ```json or ``` if it's at the very start
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3);
  }

  // Remove closing ``` if it's at the very end
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }

  return jsonText.trim();
}

/**
 * Extract JSON object from text
 */
export function extractJSONObject(text: string): string {
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return text.slice(jsonStart, jsonEnd + 1);
  }

  return text;
}

/**
 * Extract tags array from JSON text
 */
export function extractTags(jsonText: string): string[] {
  const tagsRegex = /"tags"\s*:\s*\[([\s\S]*?)\]/u;
  const tagsMatch = tagsRegex.exec(jsonText);

  if (!tagsMatch) {
    return ['web development'];
  }

  try {
    const tagsContent = tagsMatch[1];
    return tagsContent
      .split(',')
      .map((tag) => tag.trim().replace(/^"(.*)"$/u, '$1'))
      .filter((tag) => tag.length > 0);
  } catch {
    return ['web development'];
  }
}

/**
 * Find the end index of the body field in JSON text
 */
export function findBodyEnd(jsonText: string, bodyStart: number): number {
  let isEscaped = false;

  for (let i = bodyStart; i < jsonText.length; i += 1) {
    const char = jsonText[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      // This should be the end of the body string
      if (i + 1 < jsonText.length && jsonText[i + 1] === ',') {
        return i;
      }
    }
  }

  // Fallback: find the last quote before tags
  const tagsIndex = jsonText.indexOf('"tags"');
  if (tagsIndex > bodyStart) {
    const lastQuote = jsonText.lastIndexOf('"', tagsIndex - 1);
    if (lastQuote > bodyStart) {
      return lastQuote;
    }
  }

  return -1;
}

/**
 * Manually reconstruct JSON from AI response
 */
export function reconstructJSON(jsonText: string): string {
  const titleRegex = /"title"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/u;
  const summaryRegex = /"summary"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/u;
  const bodyStartRegex = /"body"\s*:\s*"/u;

  const titleMatch = titleRegex.exec(jsonText);
  const summaryMatch = summaryRegex.exec(jsonText);
  const bodyStartMatch = bodyStartRegex.exec(jsonText);

  if (!bodyStartMatch || !titleMatch || !summaryMatch) {
    throw new Error(getErrorMessage('AI_JSON_PARSE_ERROR'));
  }

  const bodyStart = bodyStartMatch.index + bodyStartMatch[0].length;
  const bodyEnd = findBodyEnd(jsonText, bodyStart);

  if (bodyEnd === -1) {
    throw new Error(getErrorMessage('AI_BODY_EXTRACTION_ERROR'));
  }

  const bodyContent = jsonText.slice(bodyStart, bodyEnd);
  const tags = extractTags(jsonText);

  // Construct clean JSON
  const cleanJson = {
    title: titleMatch[1],
    summary: summaryMatch[1],
    body: bodyContent,
    tags
  };

  return JSON.stringify(cleanJson);
}

/**
 * Attempt to extract and fix JSON from AI response
 */
export function extractAndFixJSON(text: string): string {
  let jsonText = removeMarkdownWrapper(text);
  jsonText = extractJSONObject(jsonText);

  // First attempt: try parsing as-is
  try {
    JSON.parse(jsonText);
    return jsonText;
  } catch {
    // Initial parse failed, will attempt reconstruction
  }

  // If parsing fails, try to manually reconstruct the JSON
  try {
    return reconstructJSON(jsonText);
  } catch (parseError) {
    throw new Error(getErrorMessage('AI_JSON_PARSE_ERROR'), {
      cause: parseError
    });
  }
}
