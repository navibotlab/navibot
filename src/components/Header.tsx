'use client';

import { UserProfileMenu } from './UserProfileMenu';

export function Header() {
  return (
    <header className="w-full h-16 bg-[#0F1115] border-b border-gray-800 flex items-center justify-end px-6">
      <UserProfileMenu />
    </header>
  );
} 