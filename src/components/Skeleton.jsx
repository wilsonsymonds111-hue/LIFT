export default function Skeleton({ className = '', style }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-foreground/[0.08] dark:bg-foreground/10 ${className}`}
      style={style}
    />
  );
}