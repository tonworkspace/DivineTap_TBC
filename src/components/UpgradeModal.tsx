import React, { useState, useEffect, useCallback } from 'react';

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

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: Upgrade[];
  divinePoints: number;
  onPurchaseUpgrade: (upgradeId: string) => void;
  purchasingUpgrade: string | null;
  formatNumber: (num: number) => string;
  getUpgradeCost: (upgrade: Upgrade) => number;
  isUpgradeMaxed: (upgrade: Upgrade) => boolean;
  isUpgradeAvailable: (upgrade: Upgrade) => boolean;
  getFilterDisplayName: (filter: string) => string;
  getUpgradeCategoryColor: (category: string) => string;
  getUpgradeCategoryName: (category: string) => string;
  getPaginatedUpgrades: () => Upgrade[];
  getTotalPages: () => number;
  upgradeFilter: 'all' | 'affordable' | 'recommended' | 'hardware' | 'advanced' | 'software' | 'network' | 'infrastructure';
  currentUpgradePage: number;
  setUpgradeFilter: (filter: 'all' | 'affordable' | 'recommended' | 'hardware' | 'advanced' | 'software' | 'network' | 'infrastructure') => void;
  setCurrentUpgradePage: (page: number) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  upgrades,
  divinePoints,
  onPurchaseUpgrade,
  purchasingUpgrade,
  formatNumber,
  getUpgradeCost,
  isUpgradeMaxed,
  isUpgradeAvailable,
  getFilterDisplayName,
  getUpgradeCategoryColor,
  getUpgradeCategoryName,
  getPaginatedUpgrades,
  getTotalPages,
  upgradeFilter,
  currentUpgradePage,
  setUpgradeFilter,
  setCurrentUpgradePage,
}) => {
  const [modalPoints, setModalPoints] = useState(divinePoints);

  // Update points immediately when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalPoints(divinePoints);
    }
  }, [isOpen, divinePoints]);

  // Also update points every 2 seconds while modal is open to keep it current
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setModalPoints(divinePoints);
    }, 2000); // Update every 2 seconds while modal is open

    return () => clearInterval(timer);
  }, [isOpen, divinePoints]);

  if (!isOpen) return null;

  const paginatedUpgrades = getPaginatedUpgrades();
  const totalPages = getTotalPages();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
      onClick={(e) => {
        // Close modal when clicking outside
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_0_40px_rgba(0,255,255,0.3)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <div>
              <h2 className="text-lg font-mono font-bold text-cyan-300 tracking-wider">🔧 TBC MINING UPGRADES</h2>
              <p className="text-xs font-mono text-cyan-400">Enhance your mining operation with advanced equipment</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-800/50 hover:border-red-400/50 transition-all duration-300 hover:scale-110"
              title="Close shop"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {['all', 'affordable', 'recommended', 'hardware', 'advanced', 'software', 'network', 'infrastructure'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setUpgradeFilter(filter as typeof upgradeFilter);
                  setCurrentUpgradePage(1); // Reset to first page when changing filter
                }}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 whitespace-nowrap hover:scale-105 ${
                  upgradeFilter === filter
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-600 hover:border-cyan-400 hover:text-cyan-300'
                }`}
              >
                {getFilterDisplayName(filter)}
              </button>
            ))}
          </div>

          {/* Upgrades Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {paginatedUpgrades.length > 0 ? (
              paginatedUpgrades.map((upgrade) => {
                const cost = getUpgradeCost(upgrade);
                const canAfford = modalPoints >= cost;
                const isMaxed = isUpgradeMaxed(upgrade);
                const isAvailable = isUpgradeAvailable(upgrade);

                return (
                  <div
                    key={upgrade.id}
                    className={`relative bg-gradient-to-r backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${
                      !isAvailable
                        ? 'border-gray-500/30 bg-gradient-to-r from-gray-800/20 to-gray-700/20 opacity-50'
                        : isMaxed 
                        ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20' 
                        : canAfford 
                        ? 'border-green-500/50 hover:border-green-400 from-gray-800/40 to-gray-900/40' 
                        : 'border-gray-600/50 from-gray-800/40 to-gray-900/40'
                      }`}
                  >
                    <div className="flex flex-col h-full">
                      {/* Category Badge */}
                      {upgrade.category && (
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full border ${getUpgradeCategoryColor(upgrade.category)}`}>
                            {getUpgradeCategoryName(upgrade.category)}
                          </span>
                          {upgrade.level > 0 && (
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-full border border-cyan-500/30">
                              LV.{upgrade.level}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Upgrade Name */}
                      <h3 className="text-sm font-mono font-bold text-gray-200 tracking-wider mb-2">
                        {upgrade.name}
                      </h3>
                      
                      {/* Effect */}
                      <div className="text-xs font-mono text-gray-400 mb-2">
                        {upgrade.effect}
                      </div>
                      
                      {/* Description */}
                      {upgrade.description && (
                        <div className="text-xs font-mono text-gray-500 mb-3 flex-1 italic">
                          {upgrade.description}
                        </div>
                      )}
                      
                      {/* Requirements */}
                      {upgrade.requires && !isAvailable && (
                        <div className="text-xs font-mono text-red-400 mb-2">
                          Requires: {upgrade.requires.upgrade.replace('-', ' ').toUpperCase()} LV.{upgrade.requires.level}
                        </div>
                      )}
                      
                      {/* Cost and Buy Button */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono text-gray-300">
                          Cost: <span className={canAfford ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                            {formatNumber(cost)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (canAfford && !isMaxed && isAvailable && !purchasingUpgrade) {
                              onPurchaseUpgrade(upgrade.id);
                            }
                          }}
                          disabled={!canAfford || isMaxed || !isAvailable || purchasingUpgrade === upgrade.id}
                          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 ${
                            purchasingUpgrade === upgrade.id
                              ? 'bg-gradient-to-r from-blue-600/50 to-blue-500/50 text-blue-300 border border-blue-500/50 cursor-not-allowed animate-pulse'
                              : !isAvailable
                              ? 'bg-gradient-to-r from-gray-600/50 to-gray-500/50 text-gray-400 border border-gray-500/50 cursor-not-allowed'
                              : isMaxed
                              ? 'bg-gradient-to-r from-yellow-600/50 to-yellow-500/50 text-yellow-300 border border-yellow-500/50 cursor-not-allowed'
                              : canAfford
                              ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border border-green-400 shadow-sm'
                              : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                          }`}
                          title={
                            purchasingUpgrade === upgrade.id
                              ? 'Purchasing...'
                              : !isAvailable 
                              ? 'Requires previous upgrades' 
                              : isMaxed 
                              ? 'Maximum level reached' 
                              : canAfford 
                              ? 'Click to purchase' 
                              : 'Not enough TBC coins'
                          }
                        >
                          {purchasingUpgrade === upgrade.id ? '⏳' : !isAvailable ? '🔒' : isMaxed ? 'MAX' : canAfford ? 'BUY' : '💰'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-8">
                <div className="text-gray-400 font-mono text-sm mb-2">
                  {upgradeFilter === 'affordable' 
                    ? 'No affordable upgrades available' 
                    : upgradeFilter === 'recommended' 
                    ? 'No recommended upgrades available' 
                    : upgradeFilter === 'hardware' 
                    ? 'No hardware upgrades available' 
                    : upgradeFilter === 'advanced' 
                    ? 'No advanced upgrades available' 
                    : upgradeFilter === 'software' 
                    ? 'No software upgrades available' 
                    : upgradeFilter === 'network' 
                    ? 'No network upgrades available' 
                    : upgradeFilter === 'infrastructure' 
                    ? 'No infrastructure upgrades available' 
                    : 'No upgrades available'
                  }
                </div>
                <div className="text-gray-500 font-mono text-xs">
                  Try a different filter or earn more TBC coins
                </div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
              <button
                onClick={() => setCurrentUpgradePage(Math.max(1, currentUpgradePage - 1))}
                disabled={currentUpgradePage <= 1}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
                  currentUpgradePage <= 1
                    ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                    : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500 hover:bg-cyan-800/50 hover:border-cyan-400'
                }`}
              >
                ← Previous
              </button>
              <div className="text-xs font-mono text-gray-400">
                Page {currentUpgradePage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentUpgradePage(Math.min(totalPages, currentUpgradePage + 1))}
                disabled={currentUpgradePage >= totalPages}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
                  currentUpgradePage >= totalPages
                    ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                    : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500 hover:bg-cyan-800/50 hover:border-cyan-400'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 