"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-4">☕</div>
        <h1 className="text-3xl font-bold text-coffee-800 mb-2">
          Access Denied
        </h1>
        <p className="text-coffee-600 mb-8">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/login"
          className="bg-coffee-600 text-white px-6 py-3 rounded-lg hover:bg-coffee-700 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
