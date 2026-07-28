/**
 * EmptyState — Shown when a filter combination yields no data.
 */

interface Props {
  message?: string;
}

export default function EmptyState({ message = 'No data for this filter combination.' }: Props) {
  return (
    <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
      <p className="text-sm text-[var(--color-text-tertiary)]">{message}</p>
    </div>
  );
}
