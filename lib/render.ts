import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Rich text comes out of the editor as HTML. Anything written before the
 * editor existed is still Markdown, so each row says which it holds and
 * both keep working.
 *
 * HTML is passed through a strict allowlist before it reaches a page, so a
 * compromised editor account cannot put a script on the site.
 */

const ALLOWED = {
  allowedTags: [
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark',
    'h2', 'h3', 'h4',
    'blockquote', 'ul', 'ol', 'li',
    'a', 'code', 'pre',
    'figure', 'figcaption', 'img'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    '*': ['style', 'dir', 'lang']
  },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify|start|end)$/] }
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener', target: '_blank' })
  }
};

export type ContentFormat = 'markdown' | 'html';

/** Body copy, whichever way it was written, as HTML safe to put on a page. */
export function renderContent(content: string | null | undefined, format?: string | null): string {
  const source = typeof content === 'string' ? content : '';
  if (!source.trim()) return '';

  if (format === 'html') return sanitizeHtml(source, ALLOWED);
  return sanitizeHtml(marked.parse(source, { async: false }) as string, ALLOWED);
}

/** What the editor should open with: always HTML, converting once if needed. */
export function toEditorHtml(content: string | null | undefined, format?: string | null): string {
  return renderContent(content, format);
}
