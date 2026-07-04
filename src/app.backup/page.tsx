// src/app/page.tsx — server component wrapper for PIN gate
export const dynamic = 'force-dynamic';

import PinGateClient from '@/components/PinGateClient';

export default function HomePage() {
  return <PinGateClient />;
}
