/**
 * Arabic to English, through Gemini's free tier.
 *
 * The result is always a draft. Nothing machine translated is published
 * without her reading it first, because a flat translation of a literary
 * essay would go out under her name.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM = `You translate literary Arabic prose into English for a writer's own website.

Rules:
- Translate meaning and voice, not word for word. The English must read as though she wrote it.
- Keep the register: plain, unshowy, quietly political. Do not add adjectives she did not use.
- Preserve Markdown exactly: paragraph breaks, headings, blockquotes, emphasis between asterisks.
- Never use hyphens or dashes in the prose. Rewrite around them.
- Return every field you are given, even if the field is short.
- Do not add a preface, a note, or an explanation. Return the translation only.`;

/**
 * Translates a set of named fields in one request, so an essay costs one
 * call rather than three.
 */
export async function translateFields(fields: Record<string, string>): Promise<Record<string, string>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set on the server, so translation is unavailable.');

  const names = Object.keys(fields);
  const properties: Record<string, { type: string }> = {};
  names.forEach((name) => (properties[name] = { type: 'STRING' }));

  const prompt = [
    'Translate each field of this piece into English. Keep the field names.',
    '',
    ...names.map((name) => `### ${name}\n${fields[name] ?? ''}`)
  ].join('\n');

  const response = await fetch(`${ENDPOINT}/${MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties, required: names }
      }
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.error?.message || `${response.status} ${response.statusText}`;
    throw new Error(`Gemini refused the request: ${detail}`);
  }

  const text: string =
    payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

  if (!text.trim()) throw new Error('Gemini returned nothing to use.');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini returned something that was not the expected shape.');
  }

  const out: Record<string, string> = {};
  names.forEach((name) => (out[name] = typeof parsed[name] === 'string' ? (parsed[name] as string) : ''));
  return out;
}
