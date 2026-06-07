'use client';

import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ user, children }) {
  return (
    <div className="flex min-h-screen bg-[#f4f7fe]">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header user={user} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
