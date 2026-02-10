'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-gray-900">
            🎯 Quiz App
          </Link>

          {session ? (
            <div className="flex items-center gap-4">
              {/* 👇 pseudo cliquable */}
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 font-semibold"
              >
                Bonjour, {session.user.username ?? session.user.email} 👋
              </Link>

              {/* Badge admin */}
              {session.user.role === 'ADMIN' && (
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">
                  ADMIN
                </span>
              )}

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-secondary">
                Connexion
              </Link>
              <Link href="/register" className="btn-primary">
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}