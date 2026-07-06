import { MemberProvider } from '@/lib/MemberContext';

export default function MemberHandicapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MemberProvider>
      {children}
    </MemberProvider>
  );
}
