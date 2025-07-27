import React, { useState, useCallback } from 'react';
import { FaLock, FaCoins, FaCheckCircle, FaInfoCircle, FaStar, FaChevronDown, FaChevronUp, FaCrown, FaRocket } from 'react-icons/fa';

interface Upgrade {
  id: string;
  name: string;
  level: number;
  effect: string;
  baseCost: number;
  costMultiplier: number;
  effectValue: number;
  category?: 'hardware' | 'advanced' | 'software' | 'network' | 'infrastructure';
  description?: string;
  requires?: {
    upgrade: string;
    level: number;
  };
  detailedDescription?: string;
  benefits?: string[];
  tips?: string[];
  unlockProgress?: number;
  maxLevel: number;
  unlockReward?: string;
}

interface UpgradeCardProps {
  upgrade: Upgrade;
  canAfford: boolean;
  isMaxed: boolean;
  isAvailable: boolean;
  isRecommended?: boolean;
  isNew?: boolean;
  cost: number;
  formatNumber: (num: number) => string;
  onPurchase: (upgradeId: string) => void;
  purchasing: boolean;
  categoryColor: string;
  categoryName: string;
  mode?: 'grid' | 'compact';
}

export const UpgradeCard: React.FC<UpgradeCardProps> = ({
  upgrade,
  canAfford,
  isMaxed,
  isAvailable,
  isRecommended,
  isNew,
  cost,
  formatNumber,
  onPurchase,
  purchasing,
  categoryColor,
  categoryName,
  mode = 'grid',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePurchase = useCallback(() => {
    if (canAfford && !isMaxed && isAvailable && !purchasing) {
      onPurchase(upgrade.id);
    }
  }, [canAfford, isMaxed, isAvailable, purchasing, onPurchase, upgrade.id]);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const getCardStyle = () => {
    if (!isAvailable) {
      return 'border-gray-500/30 bg-gradient-to-r from-gray-800/20 to-gray-700/20 opacity-60';
    }
    if (isMaxed) {
      return 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20';
    }
    if (canAfford) {
      return 'border-green-500/50 hover:border-green-400 from-gray-800/40 to-gray-900/40';
    }
    return 'border-gray-600/50 from-gray-800/40 to-gray-900/40';
  };

  const getButtonStyle = () => {
    if (purchasing) {
      return 'bg-gradient-to-r from-blue-600/50 to-blue-500/50 text-blue-300 border border-blue-500/50 cursor-not-allowed animate-pulse';
    }
    if (!isAvailable) {
      return 'bg-gradient-to-r from-gray-600/50 to-gray-500/50 text-gray-400 border border-gray-500/50 cursor-not-allowed';
    }
    if (isMaxed) {
      return 'bg-gradient-to-r from-yellow-600/50 to-yellow-500/50 text-yellow-300 border border-yellow-500/50 cursor-not-allowed';
    }
    if (canAfford) {
      return 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border border-green-400 shadow-sm';
    }
    return 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-500 border border-gray-600 cursor-not-allowed';
  };

  const getButtonText = () => {
    if (purchasing) return '⏳';
    if (!isAvailable) return <FaLock />;
    if (isMaxed) return 'MAX';
    if (canAfford) return 'BUY';
    return <FaCoins />;
  };

  const getButtonTitle = () => {
    if (purchasing) return 'Purchasing...';
    if (!isAvailable) return 'Requires previous upgrades';
    if (isMaxed) return 'Maximum level reached';
    if (canAfford) return 'Click to purchase';
    return 'Not enough Divine Points';
  };

  return (
    <div
      className={`relative bg-gradient-to-r backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 shadow-lg ${
        mode === 'compact' ? 'py-2 px-3' : ''
      } ${getCardStyle()} ${
        isHovered && isAvailable && !isMaxed ? 'scale-[1.02] shadow-xl' : ''
      }`}
      style={{ minHeight: mode === 'compact' ? 80 : 180 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 z-10">
        {isRecommended && (
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center animate-pulse">
            <FaStar className="mr-1 text-yellow-300" /> Recommended
          </span>
        )}
        {isNew && (
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center animate-bounce">
            <FaRocket className="mr-1" /> NEW
          </span>
        )}
        {upgrade.unlockReward && (
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center">
            <FaCrown className="mr-1" /> REWARD
          </span>
        )}
        {upgrade.level > 0 && (
          <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-full border border-cyan-500/30">
            LV.{upgrade.level}
          </span>
        )}
      </div>

      <div className="flex flex-col h-full">
        {/* Category Badge */}
        {upgrade.category && (
          <div className="flex items-center mb-2">
            <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full border ${categoryColor}`}>
              {categoryName}
            </span>
          </div>
        )}

        {/* Upgrade Name */}
        <h3 className="text-sm font-mono font-bold text-gray-200 tracking-wider mb-2 flex items-center">
          {upgrade.name}
          {upgrade.unlockReward && (
            <FaCheckCircle className="ml-2 text-green-400 animate-pulse" title="Unlocks reward!" />
          )}
        </h3>

        {/* Effect */}
        <div className="text-xs font-mono text-gray-400 mb-2 flex items-center">
          <FaInfoCircle className="mr-1 text-cyan-400" title="Effect" />
          {upgrade.effect}
        </div>

        {/* Description */}
        {upgrade.description && (
          <div className="text-xs font-mono text-gray-500 mb-2 flex-1 italic">
            {upgrade.description}
          </div>
        )}

        {/* Requirements */}
        {upgrade.requires && !isAvailable && (
          <div className="text-xs font-mono text-red-400 mb-2 flex items-center">
            <FaLock className="mr-1" />
            Requires: {upgrade.requires.upgrade.replace('-', ' ').toUpperCase()} LV.{upgrade.requires.level}
          </div>
        )}

        {/* Progress Bar for Unlock Progress */}
        {upgrade.unlockProgress !== undefined && upgrade.unlockProgress > 0 && (
          <div className="mb-2">
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
              <span>Unlock Progress</span>
              <span>{upgrade.unlockProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700/30 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${upgrade.unlockProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Expandable Details */}
        {(upgrade.detailedDescription || (upgrade.benefits && upgrade.benefits.length) || (upgrade.tips && upgrade.tips.length)) && (
          <button
            className="flex items-center text-xs text-cyan-400 hover:text-cyan-200 font-mono mb-2 focus:outline-none transition-colors duration-200"
            onClick={toggleExpanded}
            aria-expanded={expanded}
          >
            {expanded ? <FaChevronUp className="mr-1" /> : <FaChevronDown className="mr-1" />}
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
        )}

        {expanded && (
          <div className="bg-cyan-900/10 border border-cyan-500/10 rounded-lg p-2 mb-2 animate-fade-in">
            {upgrade.detailedDescription && (
              <div className="text-xs font-mono text-cyan-200 mb-1">{upgrade.detailedDescription}</div>
            )}
            {upgrade.benefits && upgrade.benefits.length > 0 && (
              <ul className="text-xs font-mono text-green-300 mb-1 list-disc list-inside">
                {upgrade.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {upgrade.tips && upgrade.tips.length > 0 && (
              <ul className="text-xs font-mono text-yellow-200 list-disc list-inside">
                {upgrade.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Cost and Buy Button */}
        <div className="flex items-center justify-between mt-auto">
          <div className="text-xs font-mono text-gray-300 flex items-center">
            <FaCoins className="mr-1 text-yellow-400" />
            Cost: <span className={canAfford ? 'text-green-400 font-bold ml-1' : 'text-red-400 font-bold ml-1'}>
              {formatNumber(cost)}
            </span>
          </div>
          <button
            onClick={handlePurchase}
            disabled={!canAfford || isMaxed || !isAvailable || purchasing}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${getButtonStyle()}`}
            title={getButtonTitle()}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}; 