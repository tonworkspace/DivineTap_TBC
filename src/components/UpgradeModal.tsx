import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCoins, FaRobot, FaTimes, FaFilter, FaChevronLeft, FaChevronRight, FaStar, FaLock, FaCheckCircle, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(divinePoints);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // FAST POINTS UPDATE - Instant points display
  useEffect(() => {
    setCurrentPoints(divinePoints);
    
    // Smooth points animation - faster updates
    const interval = setInterval(() => {
      setCurrentPoints(prev => {
        const diff = divinePoints - prev;
        if (Math.abs(diff) < 1) return divinePoints;
        return prev + diff * 0.1;
      });
    }, 50); // Faster updates for smoother animation

    return () => clearInterval(interval);
  }, [divinePoints]);

  // FAST MODAL ANIMATION - Instant show/hide
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      // Faster animation
      const timer = setTimeout(() => setIsAnimating(false), 150);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      // Faster hide animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // FAST UPGRADE DATA SYNC - Listen for changes
  useEffect(() => {
    const handleUpgradeDataChange = () => {
      console.log('🔄 Upgrade data changed in modal, refreshing...');
      // Force re-render when data changes
      setExpandedCards(new Set());
    };

    window.addEventListener('upgradeDataChanged', handleUpgradeDataChange);
    
    return () => {
      window.removeEventListener('upgradeDataChanged', handleUpgradeDataChange);
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // FAST FILTERED UPGRADES - Instant filtering
  const filteredUpgrades = useMemo(() => {
    return getPaginatedUpgrades();
  }, [getPaginatedUpgrades]);

  const totalPages = useMemo(() => getTotalPages(), [getTotalPages]);

  // Handle card expansion
  const toggleCardExpansion = useCallback((upgradeId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(upgradeId)) {
        newSet.delete(upgradeId);
      } else {
        newSet.add(upgradeId);
      }
      return newSet;
    });
  }, []);

  // FAST FILTER CHANGE - Instant filter switching
  const handleFilterChange = useCallback((filter: typeof upgradeFilter) => {
    console.log('🔍 Fast filter change:', filter);
    // Instant filter change - no delays
    setUpgradeFilter(filter);
    setCurrentUpgradePage(1);
    // Reset expanded cards for better UX
    setExpandedCards(new Set());
  }, [setUpgradeFilter, setCurrentUpgradePage]);

  // FAST PAGE CHANGE - Instant pagination
  const handlePageChange = useCallback((newPage: number) => {
    console.log('📄 Fast page change:', newPage);
    // Instant page change - no delays
    setCurrentUpgradePage(newPage);
    // Scroll to top for better UX
    const modalContent = document.querySelector('.upgrade-modal-content');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
  }, [setCurrentUpgradePage]);

  if (!isVisible) return null;

  const filters = ['all', 'affordable', 'recommended', 'hardware', 'advanced', 'software', 'network', 'infrastructure'] as const;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isOpen ? 'bg-black/90 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAnimating) {
          onClose();
        }
      }}
    >
      <div 
        className={`relative w-full h-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_40px_rgba(0,255,255,0.3)] overflow-hidden transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
          <div className="flex items-center space-x-4">
            {/* Shopkeeper Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-700 to-blue-800 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
              <FaRobot className="text-cyan-200 text-2xl" />
            </div>
            
            {/* Points Display */}
            <div className="flex flex-col">
              <span className="text-sm font-mono text-cyan-400">Divine Points</span>
              <span className="flex items-center text-2xl font-mono font-bold text-yellow-300">
                <FaCoins className="mr-2 text-yellow-400" />
                <span className="tabular-nums">
                  {currentPoints.toLocaleString()}
                </span>
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-800/50 hover:border-red-400/50 transition-all duration-200 hover:scale-110"
            title="Close shop"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-80px)] pointer-events-auto">
          {/* Filter Tabs */}
          <div className="p-4 border-b border-gray-700/30 pointer-events-auto">
            <div className="flex items-center space-x-2 mb-3">
              <FaFilter className="text-cyan-400" />
              <span className="text-sm font-mono text-gray-300">Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2 pointer-events-auto">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔍 Filter button clicked:', filter, 'Event:', e);
                    handleFilterChange(filter);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-200 hover:scale-105 cursor-pointer pointer-events-auto ${
                    upgradeFilter === filter
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-600 hover:border-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  {getFilterDisplayName(filter)}
                </button>
              ))}
            </div>
          </div>

          {/* Upgrades Grid */}
          <div className="flex-1 overflow-y-auto p-4 upgrade-modal-content">
            {filteredUpgrades.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUpgrades.map((upgrade) => {
                  const cost = getUpgradeCost(upgrade);
                  const canAfford = currentPoints >= cost;
                  const isMaxed = isUpgradeMaxed(upgrade);
                  const isAvailable = isUpgradeAvailable(upgrade);
                  const isExpanded = expandedCards.has(upgrade.id);
                  const isRecommended = upgrade.unlockReward || upgrade.level === 0;
                  const isNew = upgrade.level === 0;

                  return (
                    <div
                      key={upgrade.id}
                      className={`relative bg-gradient-to-r backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] shadow-lg ${
                        !isAvailable
                          ? 'border-gray-500/30 bg-gradient-to-r from-gray-800/20 to-gray-700/20 opacity-60'
                          : isMaxed
                          ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20'
                          : canAfford
                          ? 'border-green-500/50 hover:border-green-400 from-gray-800/40 to-gray-900/40'
                          : 'border-gray-600/50 from-gray-800/40 to-gray-900/40'
                      }`}
                    >
                      {/* Badges */}
                      <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 z-10">
                        {isRecommended && (
                          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center">
                            <FaStar className="mr-1 text-yellow-300" /> Recommended
                          </span>
                        )}
                        {isNew && (
                          <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center">
                            NEW
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
                            <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full border ${getUpgradeCategoryColor(upgrade.category)}`}>
                              {getUpgradeCategoryName(upgrade.category)}
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
                          <FaInfoCircle className="mr-1 text-cyan-400" />
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

                        {/* Expandable Details */}
                        {(upgrade.detailedDescription || (upgrade.benefits && upgrade.benefits.length) || (upgrade.tips && upgrade.tips.length)) && (
                          <button
                            className="flex items-center text-xs text-cyan-400 hover:text-cyan-200 font-mono mb-2 focus:outline-none transition-colors duration-200"
                            onClick={() => toggleCardExpansion(upgrade.id)}
                          >
                            {isExpanded ? <FaChevronUp className="mr-1" /> : <FaChevronDown className="mr-1" />}
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </button>
                        )}

                        {isExpanded && (
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
                            onClick={() => {
                              console.log(`🛒 Purchase button clicked for: ${upgrade.name}`, {
                                canAfford,
                                isMaxed,
                                isAvailable,
                                purchasing: purchasingUpgrade,
                                cost,
                                currentPoints: currentPoints
                              });
                              
                              if (canAfford && !isMaxed && isAvailable && !purchasingUpgrade) {
                                console.log(`🚀 Calling onPurchaseUpgrade for: ${upgrade.id}`);
                                onPurchaseUpgrade(upgrade.id);
                              } else {
                                console.log(`❌ Purchase blocked:`, {
                                  canAfford,
                                  isMaxed,
                                  isAvailable,
                                  purchasing: purchasingUpgrade === upgrade.id
                                });
                              }
                            }}
                            disabled={!canAfford || isMaxed || !isAvailable || purchasingUpgrade === upgrade.id}
                            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${
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
                                : 'Not enough Divine Points'
                            }
                          >
                            {purchasingUpgrade === upgrade.id ? '⏳' : !isAvailable ? <FaLock /> : isMaxed ? 'MAX' : canAfford ? 'BUY' : <FaCoins />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 font-mono text-lg mb-4">
                  🔧 No upgrades available
                </div>
                <div className="text-gray-500 font-mono text-sm mb-4">
                  {upgradeFilter === 'affordable' 
                    ? 'No affordable upgrades available' 
                    : upgradeFilter === 'recommended' 
                    ? 'No recommended upgrades available' 
                    : `No ${upgradeFilter} upgrades available`
                  }
                </div>
                <div className="text-gray-600 font-mono text-xs">
                  Try a different filter or earn more Divine Points
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-700/30 bg-gray-900/20">
              <button
                onClick={() => handlePageChange(Math.max(1, currentUpgradePage - 1))}
                disabled={currentUpgradePage <= 1}
                className={`flex items-center px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                  currentUpgradePage <= 1
                    ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                    : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500 hover:bg-cyan-800/50 hover:border-cyan-400 hover:scale-105'
                }`}
              >
                <FaChevronLeft className="mr-1" />
                Previous
              </button>
              
              <div className="text-xs font-mono text-gray-400">
                Page {currentUpgradePage} of {totalPages}
              </div>
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentUpgradePage + 1))}
                disabled={currentUpgradePage >= totalPages}
                className={`flex items-center px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                  currentUpgradePage >= totalPages
                    ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                    : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500 hover:bg-cyan-800/50 hover:border-cyan-400 hover:scale-105'
                }`}
              >
                Next
                <FaChevronRight className="ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 