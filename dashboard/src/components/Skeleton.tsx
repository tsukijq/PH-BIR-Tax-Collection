/**
 * Skeleton — Loading placeholder for chart areas.
 * Uses shimmer animation defined in index.css.
 */

interface Props {
  height?: string;
  className?: string;
}

export default function Skeleton({ height = '300px', className = '' }: Props) {
  return (
    <div
      className={`skeleton w-full rounded-md ${className}`}
      style={{ height }}
      aria-label="Loading content"
      role="progressbar"
    />
  );
}
