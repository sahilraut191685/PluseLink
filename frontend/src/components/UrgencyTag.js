'use client';

const URGENCY_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
  urgent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  standard: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const URGENCY_ICONS = { critical: '🔴', urgent: '🟡', standard: '🟢' };

export default function UrgencyTag({ urgency }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${URGENCY_STYLES[urgency] || URGENCY_STYLES.standard}`}>
      {URGENCY_ICONS[urgency]} {urgency}
    </span>
  );
}
