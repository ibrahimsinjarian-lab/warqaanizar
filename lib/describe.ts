import { askGemini } from './translate';
import { mediaUrl } from './media';

/**
 * A short description of a picture, in Arabic and English, written by
 * Gemini the moment it is uploaded. Screen readers read it aloud and search
 * engines index it. She can change it; if Gemini is unavailable the fields
 * are simply left empty and nothing else is held up.
 */

const SYSTEM = `You write alt text for pictures on the portfolio of an architecture student and writer in Baghdad.

Rules:
- Describe what is visible, plainly, in one sentence of at most 18 words.
- Name architectural elements precisely where you can see them: shanasheel, mashrabiya, arches, brick, courtyards, wooden screens.
- Do not start with "An image of" or "A photo of". Do not guess names of places you cannot read.
- Never use hyphens or dashes. Rewrite around them.
- Give the same description in natural English and in natural Modern Standard Arabic.`;

export async function describeImage(path: string): Promise<{ alt_ar: string; alt_en: string } | null> {
  const url = mediaUrl(path, 800);
  if (!url || !process.env.GEMINI_API_KEY) return null;

  try {
    // a small JPEG is plenty for a description, and keeps the request light
    const picture = await fetch(url.replace('f_auto', 'f_jpg'));
    if (!picture.ok) return null;
    const data = Buffer.from(await picture.arrayBuffer()).toString('base64');

    const text = await askGemini({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: 'image/jpeg', data } }, { text: 'Write the alt text.' }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: { alt_en: { type: 'STRING' }, alt_ar: { type: 'STRING' } },
          required: ['alt_en', 'alt_ar']
        }
      }
    });

    const parsed = JSON.parse(text) as { alt_ar?: unknown; alt_en?: unknown };
    const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/\s*[–—]\s*/g, ', ').trim().slice(0, 300) : '');
    const result = { alt_ar: clean(parsed.alt_ar), alt_en: clean(parsed.alt_en) };
    return result.alt_ar || result.alt_en ? result : null;
  } catch {
    return null;
  }
}
