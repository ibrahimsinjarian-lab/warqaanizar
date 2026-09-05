import { Fragment } from 'react';

/**
 * A one line piece of copy may carry a single emphasised phrase, written
 * between asterisks, and may break where there is a newline. That is the
 * whole grammar: the accented word in the statement, the italic in the
 * about line, the second line of the contact heading.
 *
 * Deliberately not Markdown. It renders React nodes rather than raw HTML,
 * so nothing typed into the editor can inject markup, and the parser does
 * not have to travel to the browser.
 */
export function Em({ text }: { text: string | null | undefined }) {
  if (!text) return null;

  const lines = String(text).split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {line.split(/(\*[^*\n]+\*)/g).map((part, i) =>
            part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
              <em key={i}>{part.slice(1, -1)}</em>
            ) : (
              <Fragment key={i}>{part}</Fragment>
            )
          )}
        </Fragment>
      ))}
    </>
  );
}
