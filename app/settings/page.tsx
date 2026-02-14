'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since settings are now in modal
    router.push('/');
  }, [router]);

  return null;
}
