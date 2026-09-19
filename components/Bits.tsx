import { renderContent } from '@/lib/render';

export { Plate } from './Plate';

/** Body copy, written either as Markdown or in the editor, always sanitised. */
export function Prose({
  content,
  format,
  className
}: {
  content: string | null | undefined;
  format?: string | null;
  className?: string;
}) {
  const html = renderContent(content, format);
  if (!html) return null;
  return <div className={className ?? 'prose'} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Empty({ message }: { message: string }) {
  return <div className="empty">{message}</div>;
}
