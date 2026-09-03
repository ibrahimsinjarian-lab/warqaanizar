import { marked } from 'marked';
import { Star } from './Chrome';
import { mediaUrl } from '@/lib/queries';
import type { Media } from '@/lib/types';

marked.setOptions({ gfm: true, breaks: false });

/** Body copy is Markdown. Only admins can write it, so it is rendered as given. */
export function Prose({ markdown, className }: { markdown: string; className?: string }) {
  // the column was jsonb before the markdown migration, so guard the type
  const source = typeof markdown === 'string' ? markdown : '';
  const html = marked.parse(source, { async: false }) as string;
  return <div className={className ?? 'prose'} dangerouslySetInnerHTML={{ __html: html }} />;
}

type PlateProps = {
  media?: Media | null;
  alt?: string | null;
  angle?: number;
  mix?: number;
  tone?: 'clay' | 'olive';
  className?: string;
  ratio?: string;
  priority?: boolean;
};

/**
 * An image, or a generated stand in when there is no photograph yet.
 * The placeholder is deliberate rather than empty, so a page with no
 * pictures still reads as designed.
 */
export function Plate({ media, alt, angle = 200, mix = 62, tone, className, ratio }: PlateProps) {
  const url = mediaUrl(media?.path);
  const style: React.CSSProperties = {
    ['--a' as string]: angle,
    ['--m' as string]: mix,
    ...(tone === 'olive' ? { ['--tone' as string]: 'var(--olive)' } : {}),
    ...(ratio ? { aspectRatio: ratio } : {})
  };

  if (url) {
    return (
      <div className={className ?? 'plate'} style={ratio ? { aspectRatio: ratio } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt ?? ''}
          width={media?.width ?? undefined}
          height={media?.height ?? undefined}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div className={className ?? 'plate'} style={style}>
      <div className="plate__mark" aria-hidden="true">
        <Star />
      </div>
    </div>
  );
}

export function Empty({ message }: { message: string }) {
  return <div className="empty">{message}</div>;
}
