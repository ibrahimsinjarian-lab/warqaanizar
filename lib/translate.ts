/**
 * Arabic to English, through Gemini's free tier.
 *
 * Google retires model names on a schedule of their own, so nothing here
 * depends on one being correct forever. If the configured model is gone,
 * this asks Google which models the key can actually use, picks the newest
 * flash one, and carries on. The name it settled on is remembered for the
 * life of the server process.
 *
 * The result is always a draft. Nothing machine translated is published
 * without her reading it first, because a flat translation of a literary
 * essay would go out under her name.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Newest first. Only used before we have asked Google what exists. */
const PREFERRED = ['gemini-3.6-flash', 'gemini-2.5-flash'];

const SYSTEM = `You translate literary Arabic prose into English for a writer's own website.

Rules:
- Translate meaning and voice, not word for word. The English must read as though she wrote it.
- Keep the register: plain, unshowy, quietly political. Do not add adjectives she did not use.
- Preserve Markdown exactly: paragraph breaks, headings, blockquotes, emphasis between asterisks.
- Never use hyphens or dashes in the prose. Rewrite around them.
- Return every field you are given, even if the field is short.
- Do not add a preface, a note, or an explanation. Return the translation only.`;

let resolvedModel: string | null = null;

interface ModelInfo {
  name?: string;
  supportedGenerationMethods?: string[];
}

/** Ask the key what it can actually reach. */
async function listUsableModels(key: string): Promise<string[]> {
  const response = await fetch(`${ENDPOINT}?key=${key}&pageSize=200`);
  if (!response.ok) return [];
  const payload = await response.json().catch(() => null);
  return ((payload?.models ?? []) as ModelInfo[])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => String(m.name ?? '').replace(/^models\//, ''))
    .filter(Boolean);
}

/**
 * Newest flash model wins. Preview, experimental and the audio or image
 * variants are skipped: this is prose, and it has to be dependable.
 */
export function pickModel(names: string[]): string | null {
  const ranked = names
    .filter((n) => n.startsWith('gemini-') && n.includes('flash'))
    .filter((n) => !/(preview|exp|thinking|image|audio|tts|live|vision)/.test(n))
    .map((n) => ({
      name: n,
      version: Number.parseFloat(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? '0'),
      lite: /lite/.test(n) ? 1 : 0
    }))
    .sort((a, b) => b.version - a.version || a.lite - b.lite || a.name.length - b.name.length);

  return ranked[0]?.name ?? null;
}

function looksLikeAMissingModel(message: string): boolean {
  return /no longer available|not found|is not supported|does not exist|unsupported model/i.test(message);
}

async function callGemini(model: string, key: string, body: unknown) {
  const response = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}

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

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'Translate each field of this piece into English. Keep the field names.',
              '',
              ...names.map((name) => `### ${name}\n${fields[name] ?? ''}`)
            ].join('\n')
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      responseSchema: { type: 'OBJECT', properties, required: names }
    }
  };

  const first = resolvedModel ?? process.env.GEMINI_MODEL ?? PREFERRED[0];
  let attempt = await callGemini(first, key, body);

  // the configured model is gone: find out what this key can use, and retry once
  if (!attempt.ok && looksLikeAMissingModel(attempt.payload?.error?.message ?? '')) {
    const available = await listUsableModels(key);
    const next = pickModel(available);
    if (next && next !== first) {
      resolvedModel = next;
      attempt = await callGemini(next, key, body);
    }
  }

  if (!attempt.ok) {
    const detail = attempt.payload?.error?.message || `${attempt.status}`;
    throw new Error(`Gemini refused the request: ${detail}`);
  }

  if (!resolvedModel) resolvedModel = first;

  const text: string =
    attempt.payload?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('') ?? '';

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
