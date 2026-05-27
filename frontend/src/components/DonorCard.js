'use client';
import BloodGroupBadge from './BloodGroupBadge';

const STATUS_STYLES = {
  pending: 'text-yellow-400',
  accepted: 'text-green-400',
  rejected: 'text-red-400',
  donated: 'text-blue-400',
};

export default function DonorCard({ donor, onAccept, onReject, showActions = false }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:border-red-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
            {donor.name?.charAt(0) || 'D'}
          </div>
          <div>
            <h4 className="text-white font-medium">{donor.name || 'Anonymous Donor'}</h4>
            <p className="text-gray-400 text-sm">{donor.distanceFormatted || `${donor.distance?.toFixed?.(1) || '?'} km`}</p>
          </div>
        </div>
        <BloodGroupBadge bloodGroup={donor.bloodGroup} size="sm" />
      </div>

      {donor.verifiedDonor && (
        <div className="flex items-center gap-1 text-green-400 text-xs mb-2">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Verified Donor
        </div>
      )}

      {donor.status && (
        <p className={`text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[donor.status] || 'text-gray-400'}`}>
          ● {donor.status}
        </p>
      )}

      {showActions && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => onAccept?.(donor)} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            Accept
          </button>
          <button onClick={() => onReject?.(donor)} className="flex-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-sm font-medium py-2 rounded-lg border border-red-600/30 transition-colors">
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
