import { HomePage } from '@/components/Pages';

export const revalidate = 3600;

export default function Page() {
  return <HomePage locale="en" />;
}
