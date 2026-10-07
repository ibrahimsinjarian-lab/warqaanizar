'use client';

import { useLinkStatus } from 'next/link';
import { useFormStatus } from 'react-dom';

/**
 * A click is answered at once, on the thing that was clicked. A link shows
 * a small turning circle while its page is fetched; a button that asks the
 * server for something says what it is doing until the answer comes.
 */

/** Put inside a Link. Turns while that link's page is on its way. */
export function LinkSpinner() {
  const { pending } = useLinkStatus();
  return <span className={`spin${pending ? ' is-on' : ''}`} aria-hidden="true" />;
}

/** A submit button that knows when its form is with the server. */
export function SubmitButton({
  children,
  busy,
  className,
  name,
  value
}: {
  children: React.ReactNode;
  /** what it says while it works, such as Translating */
  busy: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} name={name} value={value} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spin is-on" aria-hidden="true" />
          {busy}
        </>
      ) : (
        children
      )}
    </button>
  );
}
