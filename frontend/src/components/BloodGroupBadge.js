'use client';

const BLOOD_COLORS = {
  'O-': 'bg-red-600 text-white',
  'O+': 'bg-red-500 text-white',
  'A-': 'bg-blue-600 text-white',
  'A+': 'bg-blue-500 text-white',
  'B-': 'bg-purple-600 text-white',
  'B+': 'bg-purple-500 text-white',
  'AB-': 'bg-amber-600 text-white',
  'AB+': 'bg-amber-500 text-white',
};

export default function BloodGroupBadge({ bloodGroup, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base font-semibold',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium tracking-wide ${BLOOD_COLORS[bloodGroup] || 'bg-gray-500 text-white'} ${sizeClasses[size]}`}>
      🩸 {bloodGroup}
    </span>
  );
}
