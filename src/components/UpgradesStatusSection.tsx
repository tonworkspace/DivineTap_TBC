import React from 'react';

interface GameState {
  divinePoints: number;
  upgradesPurchased: number;
  currentEnergy: number;
  maxEnergy: number;
  miningExperience: number;
  miningExperienceToNext: number;
  miningLevel: number;
}

interface UpgradesStatusSectionProps {
  gameState: GameState;
  setShowUpgradeShop: (show: boolean) => void;
  formatNumber: (num: number) => string;
  getEnergyRegenerationRate: () => number;
}

export const UpgradesStatusSection: React.FC<UpgradesStatusSectionProps> = ({
  gameState,
  setShowUpgradeShop,
  formatNumber,
  getEnergyRegenerationRate
}) => {
  const energyPercentage = Math.max(0, Math.min(100, (gameState.currentEnergy / gameState.maxEnergy) * 100));
  const experiencePercentage = (gameState.miningExperience / gameState.miningExperienceToNext) * 100;
  
  const getEnergyStatus = () => {
    if (energyPercentage > 70) return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '🟢', status: 'OPTIMAL' };
    if (energyPercentage > 30) return { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '🟡', status: 'MODERATE' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', icon: '🔴', status: 'CRITICAL' };
  };

  const energyStatus = getEnergyStatus();

  return (
    <div className="space-y-4">
      {/* Enhanced Upgrades Button */}
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
        
        <button
          onClick={() => setShowUpgradeShop(true)}
          className="relative w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 font-mono font-bold border overflow-hidden
                     bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 backdrop-blur-xl 
                     border-gradient-to-r border-cyan-500/30 hover:border-cyan-400/50
                     hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl hover:shadow-cyan-500/25
                     group transform-gpu"
        >
          {/* Animated background overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          
          <div className="relative flex items-center space-x-3">
            {/* Animated pulse indicator */}
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50"></div>
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-20"></div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-base tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-extrabold">
                ⚡ UPGRADES
              </span>
              {gameState.upgradesPurchased > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-lg blur"></div>
                  <div className="relative text-xs px-3 py-1.5 rounded-lg border border-cyan-400/40 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 text-cyan-300 font-bold shadow-lg">
                    {gameState.upgradesPurchased}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-mono font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                {formatNumber(gameState.divinePoints)}
              </div>
              <div className="text-xs text-gray-400 font-medium">THE BILLION COIN</div>
            </div>
            <div className="text-cyan-300 group-hover:text-cyan-200 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="transform group-hover:translate-y-0.5 transition-transform">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Enhanced Energy & Experience Card */}
      <div className="relative group">
        {/* Outer glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-purple-600/20 rounded-2xl blur opacity-50"></div>
        
        <div className="relative bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-slate-800/98 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-5 shadow-2xl shadow-yellow-500/10 overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]"></div>
          </div>
          
          {/* Header Section */}
          <div className="relative flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              {/* Energy Status */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className={`w-2 h-2 rounded-full ${energyStatus.bg} shadow-lg`}></div>
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-yellow-400 animate-pulse opacity-60"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">🔋</span>
                  <span className={`text-sm font-mono font-bold ${energyStatus.color} drop-shadow-sm`}>
                    {Math.round(gameState.currentEnergy)}<span className="text-gray-500">/</span>{gameState.maxEnergy}
                  </span>
                </div>
              </div>
              
              {/* Experience Status */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-indigo-500/30 shadow-lg"></div>
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-indigo-400 animate-pulse opacity-60"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-mono font-bold text-indigo-400 drop-shadow-sm">
                    {gameState.miningExperience.toLocaleString()}<span className="text-gray-500">/</span>{gameState.miningExperienceToNext.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Regeneration Rate */}
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <span className="text-xs text-gray-400">⚡</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                +{getEnergyRegenerationRate().toFixed(1)}/s
              </span>
            </div>
          </div>
          
          {/* Enhanced Dual Progress Bar */}
          <div className="relative h-4 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/60 shadow-inner mb-4">
            {/* Energy Bar (Top Half) */}
            <div className="absolute top-0 left-0 w-full h-1/2">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${energyPercentage}%` }}
              >
                                 {/* Shimmer effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Experience Bar (Bottom Half) */}
            <div className="absolute bottom-0 left-0 w-full h-1/2">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${experiencePercentage}%` }}
                             >
                 {/* Shimmer effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse"></div>
               </div>
            </div>
            
            {/* Center Progress Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white drop-shadow-lg">
                <span className="px-2 py-0.5 rounded bg-black/50 text-yellow-200">
                  {energyPercentage.toFixed(0)}%
                </span>
                <span className="text-gray-300">|</span>
                <span className="px-2 py-0.5 rounded bg-black/50 text-indigo-200">
                  {experiencePercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Footer */}
          <div className="relative flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg ${energyStatus.bg} border border-current/20`}>
                <span className="text-sm">{energyStatus.icon}</span>
                <span className={`text-xs font-bold ${energyStatus.color}`}>
                  {energyStatus.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                <span className="text-xs text-indigo-300 font-medium">LEVEL</span>
                <span className="ml-2 text-sm font-bold text-indigo-400">
                  {gameState.miningLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}; 