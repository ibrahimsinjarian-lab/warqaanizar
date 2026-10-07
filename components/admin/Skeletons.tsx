/**
 * The shape of the page that is on its way, drawn the instant a link is
 * clicked, so the old page never sits there looking as if nothing happened.
 */

/** An editor: a title, the save bar, the writing column and the rail. */
export default function EditorSkeleton() {
  return (
    <div className="skeleton" role="status" aria-label="Opening">
      <span className="skeleton__line skeleton__line--small" />
      <span className="skeleton__line skeleton__line--title" />
      <span className="skeleton__bar" />
      <div className="skeleton__cols">
        <div className="skeleton" style={{ gap: '1.1rem' }}>
          <span className="skeleton__block skeleton__block--short" />
          <span className="skeleton__block" />
        </div>
        <div className="skeleton" style={{ gap: '1.1rem' }}>
          <span className="skeleton__block skeleton__block--short" />
          <span className="skeleton__block skeleton__block--short" />
        </div>
      </div>
    </div>
  );
}

/** A list of essays or projects. */
export function ListSkeleton() {
  return (
    <div className="skeleton" role="status" aria-label="Opening">
      <span className="skeleton__line skeleton__line--title" />
      <span className="skeleton__line skeleton__line--wide" />
      <div className="skeleton__rows">
        {Array.from({ length: 6 }, (_, i) => (
          <span className="skeleton__row" key={i} />
        ))}
      </div>
    </div>
  );
}
