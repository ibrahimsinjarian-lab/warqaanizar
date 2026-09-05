'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: [string, string][] = [
  ['/admin', 'Overview'],
  ['/admin/essays', 'Essays'],
  ['/admin/designs', 'Projects'],
  ['/admin/settings', 'Front page']
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="admin__links">
      {LINKS.map(([href, label]) => {
        const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
