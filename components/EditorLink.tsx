'use client';

import { useEffect, useState } from 'react';

/**
 * ED 11. A way into the editor from the site, shown only to someone who is
 * already signed in. The pages are static, so this is decided in the browser
 * by looking for the session cookie. It reveals nothing: anyone can visit
 * /admin, and the database decides what they may actually do.
 */
export default function EditorLink() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(/sb-[^=]+-auth-token/.test(document.cookie));
  }, []);

  if (!signedIn) return null;

  return (
    <a className="navlink" href="/admin">
      Editor
    </a>
  );
}
