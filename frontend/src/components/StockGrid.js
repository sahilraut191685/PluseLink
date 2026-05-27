'use client';

const STOCK_LEVELS = { low: 5, critical: 2 };
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function getStockColor(units) {
  if (units <= STOCK_LEVELS.critical) return 'bg-red-500/20 border-red-500/40 text-red-400';
  if (units <= STOCK_LEVELS.low) return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
  return 'bg-green-500/20 border-green-500/40 text-green-400';
}

export default function StockGrid({ inventory, onUpdate, editable = false }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {BLOOD_GROUPS.map((group) => {
        const units = inventory?.[group] ?? 0;
        return (
          <div key={group} className={`rounded-xl border p-3 text-center transition-all duration-200 ${getStockColor(units)}`}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">🩸 {group}</div>
            {editable ? (
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => onUpdate?.(group, Math.max(0, units - 1))} className="w-6 h-6 rounded bg-gray-700 text-white text-xs hover:bg-gray-600">−</button>
                <span className="text-xl font-bold w-8">{units}</span>
                <button onClick={() => onUpdate?.(group, units + 1)} className="w-6 h-6 rounded bg-gray-700 text-white text-xs hover:bg-gray-600">+</button>
              </div>
            ) : (
              <div className="text-2xl font-bold">{units}</div>
            )}
            <div className="text-[10px] uppercase tracking-wide mt-1 opacity-60">units</div>
          </div>
        );
      })}
    </div>
  );
}
