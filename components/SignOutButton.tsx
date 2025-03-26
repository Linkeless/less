'use client';

export default function SignOutButton() {
  return (
    <button
      onClick={() => window.location.href = '/login'}
      className="block px-3 py-1 text-sm leading-6 text-gray-900"
    >
      Sign out
    </button>
  );
}
