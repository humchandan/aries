'use client';

import React from 'react';
import ProfileTab from '@/components/ProfileTab';

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col space-y-4 max-w-7xl mx-auto p-4 sm:p-6 w-full">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Profile Settings</h1>
      <ProfileTab />
    </div>
  );
}
