import { Star } from './Chrome';
import { mediaSrcSet, mediaUrl } from '@/lib/media';
import type { Media } from '@/lib/types';

type PlateProps = {
  media?: Media | null;
  alt?: string | null;
  angle?: number;
  mix?: number;
  tone?: 'clay' | 'olive';
  className?: string;
  ratio?: string;
  /** how wide the picture is drawn, so the browser picks the right size */
  sizes?: string;
  priority?: boolean;
  style?: React.CSSProperties;
};

/**
 * An image, or a generated stand in when there is no photograph yet.
 * The placeholder is deliberate rather than empty, so a page with no
 * pictures still reads as designed.
 */
export function Plate({
  media,
  alt,
  angle = 200,
  mix = 62,
  tone,
  className,
  ratio,
  sizes = '(max-width: 760px) 100vw, 50vw',
  priority,
  style: extra
}: PlateProps) {
  const url = mediaUrl(media?.path);

  if (url) {
    return (
      <div className={`${className ?? 'plate'} plate--photo`} style={{ ...(ratio ? { aspectRatio: ratio } : {}), ...extra }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          srcSet={mediaSrcSet(media?.path, media?.width)}
          sizes={sizes}
          alt={alt ?? ''}
          width={media?.width ?? undefined}
          height={media?.height ?? undefined}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
      </div>
    );
  }

  const style: React.CSSProperties = {
    ['--a' as string]: angle,
    ['--m' as string]: mix,
    ...(tone === 'olive' ? { ['--tone' as string]: 'var(--olive)' } : {}),
    ...(ratio ? { aspectRatio: ratio } : {}),
    ...extra
  };

  return (
    <div className={className ?? 'plate'} style={style}>
      <div className="plate__mark" aria-hidden="true">
        <Star />
      </div>
    </div>
  );
}
