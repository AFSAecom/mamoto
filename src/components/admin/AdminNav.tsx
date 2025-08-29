'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/motos', label: 'Motos' },
  { href: '/admin/categories', label: 'Catégories' },
  { href: '/admin/clients', label: 'Clients' },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-4 border-b mb-6">
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={clsx('px-3 py-2', pathname === l.href && 'font-semibold')}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
