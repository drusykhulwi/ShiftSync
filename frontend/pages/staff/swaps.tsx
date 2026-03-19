// frontend/src/pages/staff/swaps.tsx
// Redirects to the shared swaps page
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StaffSwapsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/swaps');
  }, [router]);
  return null;
}