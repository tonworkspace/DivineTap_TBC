import React, { useState } from 'react';
import { FiCopy, FiGift, FiUsers } from 'react-icons/fi';
import './ReferralCard.css';

interface ReferralCardProps {
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  nextRewardTier: string;
  referralsNeeded: number;
  progress: number;
  onShare: () => void;
  copied: boolean;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
  referralLink,
  totalReferrals,
  totalEarnings,
  nextRewardTier,
  referralsNeeded,
  progress,
  onShare,
  copied,
}) => {
  const [localCopied, setLocalCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setLocalCopied(true);
    setTimeout(() => setLocalCopied(false), 2000);
  };

  return (
    <div className="referral-card">
      <div className="card-header">
        <h2>Your Referral Link</h2>
        <p>Share your code to earn rewards</p>
      </div>

      <div className="card-body">
        <div className="referral-code-section">
          <input type="text" value={referralLink} readOnly />
          <button onClick={handleCopy} className="copy-button">
            {localCopied ? <FiCheck /> : <FiCopy />}
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <FiUsers className="stat-icon" />
            <div className="stat-value">{totalReferrals}</div>
            <div className="stat-label">Friends Joined</div>
          </div>
          <div className="stat-item">
            <FiGift className="stat-icon" />
            <div className="stat-value">{totalEarnings.toLocaleString()}</div>
            <div className="stat-label">Points Earned</div>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <h3>Next Reward: {nextRewardTier}</h3>
            <span>{referralsNeeded} more friends</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-filler"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card-footer">
        <button onClick={onShare} className="share-button">
          {copied ? 'Link Copied!' : 'Share Your Link'}
        </button>
      </div>
    </div>
  );
};

// FiCheck is not in react-icons/fi, so I'll define a simple checkmark icon here
const FiCheck: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
