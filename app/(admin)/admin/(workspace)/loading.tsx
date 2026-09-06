/**
 * Shown the instant a section is clicked, so the editor never sits blank
 * while the database answers.
 */
export default function Loading() {
  return (
    <div className="skeleton" aria-label="Loading" aria-busy="true">
      <span className="skeleton__line skeleton__line--title" />
      <span className="skeleton__line skeleton__line--wide" />
      <div className="skeleton__rows">
        <span className="skeleton__row" />
        <span className="skeleton__row" />
        <span className="skeleton__row" />
        <span className="skeleton__row" />
      </div>
    </div>
  );
}
