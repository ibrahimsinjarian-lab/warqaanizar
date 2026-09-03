import { EssaysPage } from '@/components/Pages';

export const revalidate = 3600;

export default function Page() {
  return <EssaysPage locale="en" />;
}
