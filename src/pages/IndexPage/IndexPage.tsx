import { FC, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { OnboardingScreen } from './OnboardingScreen';
import { DivineMiningGame } from '@/components/DivineMiningGame';
import { DivinePointsLeaderboard } from '@/components/DivinePointsLeaderboard';
import { TaskCenter } from '@/components/TaskCenter';
import { ReferralSystem } from '@/components/ReferralSystem';
import { useTonAddress, TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UpgradeModal } from '@/components/UpgradeModal';
import { 
  GiCrystalBall, 
  GiCrystalCluster,
  GiSpellBook,
  GiDiamonds
} from 'react-icons/gi';
import { BiHome } from 'react-icons/bi';
// Import gem sync test utilities for debugging
import '@/utils/gemSyncTest';
import DailyRewards from '@/components/DailyRewards';
import { ShoutboxHeader } from '@/components/ShoutboxHeader/ShoutboxHeader';



// interface GameState {
//   divinePoints: number;
//   pointsPerSecond: number;
//   totalEarned24h: number;
//   totalEarned7d: number;
//   upgradesPurchased: number;
//   minersActive: number;
//   isMining: boolean;
// }

// interface Upgrade {
//   id: string;
//   name: string;
//   level: number;
//   effect: string;
//   baseCost: number;
//   costMultiplier: number;
// }

// Header component that uses GameContext
const GameHeader: FC<{ 
  user: any; 
  currentTab: string; 
  userFriendlyAddress?: string;
  walletBalance: string;
  isLoadingBalance: boolean;
  NETWORK_NAME: string;
  fetchWalletBalance: () => void;
}> = ({ user, userFriendlyAddress, walletBalance, isLoadingBalance }) => {
  const { gems, } = useGameContext();
  
  // Helper function to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  return (
    <div className="relative bg-gradient-to-r from-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-yellow-500/30 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 mb-2 shadow-[0_0_30px_rgba(0,255,255,0.1)] overflow-hidden game-card-frame">
      {/* Futuristic Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-yellow-500/30 corner-accent"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-yellow-500/30 corner-accent"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-yellow-500/30 corner-accent"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-yellow-500/30 corner-accent"></div>
      
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 rounded-xl transition-all duration-1000 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 animate-pulse"></div>
      
      {/* Single Line Content */}
      <div className="relative z-10 flex items-center justify-between space-x-2">
         
        {/* User Badge */}
        {user?.username && (
          <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/80 to-black/80 rounded-full px-1.5 py-0.5 border border-cyan-500/30 backdrop-blur-sm">
            <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-cyan-300 font-mono font-bold text-[10px] truncate max-w-[80px]">
              {user.username}
            </span>
          </div>
        )}

        {/* Stats Section */}
        <div className="flex items-center space-x-2">
          {/* TBC Balance */}
          {/* <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 font-mono font-bold text-[9px] uppercase">💰</span>
            <span className="text-yellow-300 font-mono font-bold text-sm">
              {formatNumber(points)} TBC
            </span>
          </div> */}
          
          {/* Separator */}
          <div className="w-px h-3 bg-gradient-to-b from-transparent via-gray-500/50 to-transparent"></div>
          
          {/* Gems */}
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-purple-400 font-mono font-bold text-[9px] uppercase">💎</span>
            <span className="text-purple-300 font-mono font-bold text-[11px]">
              {formatNumber(gems)}
            </span>
          </div>

          {/* Wallet Balance */}
          {userFriendlyAddress && (
            <>
              {/* Separator */}
              <div className="w-px h-3 bg-gradient-to-b from-transparent via-gray-500/50 to-transparent"></div>
              
              {/* TON Balance */}
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-mono font-bold text-[9px] uppercase">⚡</span>
                <span className="text-green-300 font-mono font-bold text-[11px]">
                  {isLoadingBalance ? (
                    <span className="inline-flex items-center">
                      <div className="w-2.5 h-2.5 border border-green-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                      ...
                    </span>
                  ) : (
                    formatNumber(Number(walletBalance))
                  )} TON
                </span>
              </div>
            </>
          )}
        </div>
       
      </div>
    </div>
  );
};

// Upgrade Shop Modal Wrapper Component
const UpgradeShopModal: FC<{
  showUpgradeShop: boolean;
  setShowUpgradeShop: (show: boolean) => void;
}> = ({ showUpgradeShop, setShowUpgradeShop }) => {
  const [upgradeData, setUpgradeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { points } = useGameContext();

  useEffect(() => {
    if (upgradeData && points !== upgradeData.divinePoints) {
      setUpgradeData((prevData: any) => ({
        ...prevData,
        divinePoints: points,
      }));
    }
  }, [points, upgradeData]);
  
  // FAST FILTER STATE - Moved from DivineMiningGame for better performance
  const [upgradeFilter, setUpgradeFilter] = useState<'all' | 'affordable' | 'recommended' | 'hardware' | 'advanced' | 'software' | 'network' | 'infrastructure'>('all');
  const [currentUpgradePage, setCurrentUpgradePage] = useState(1);
  const upgradesPerPage = 9; // Show 9 upgrades per page

  // FAST FILTER FUNCTIONS - Moved to IndexPage for instant performance
  const getFilterDisplayName = useCallback((filter: string): string => {
    switch (filter) {
      case 'all': return 'ALL';
      case 'affordable': return 'AFFORDABLE';
      case 'recommended': return 'RECOMMENDED';
      case 'hardware': return '🖥️ HARDWARE';
      case 'advanced': return '⚡ ADVANCED';
      case 'software': return '💻 SOFTWARE';
      case 'network': return '🌐 NETWORK';
      case 'infrastructure': return '🏗️ INFRASTRUCTURE';
      default: return filter.toUpperCase();
    }
  }, []);

  const getUpgradeCategoryName = useCallback((category: string): string => {
    switch (category) {
      case 'hardware': return '🖥️ HARDWARE';
      case 'advanced': return '⚡ ADVANCED';
      case 'software': return '💻 SOFTWARE';
      case 'network': return '🌐 NETWORK';
      case 'infrastructure': return '🏗️ INFRASTRUCTURE';
      default: return category.toUpperCase();
    }
  }, []);

  const getUpgradeCategoryColor = useCallback((category: string): string => {
    switch (category) {
      case 'hardware': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'advanced': return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
      case 'software': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'network': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'infrastructure': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  }, []);

  // FAST FILTERING - Instant filtering without DivineMiningGame dependency
  const getFilteredUpgrades = useCallback((): any[] => {
    if (!upgradeData?.upgrades) return [];
    
    let filtered = [...upgradeData.upgrades];
    
    switch (upgradeFilter) {
      case 'affordable':
        filtered = filtered.filter(upgrade => {
          const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
          return upgradeData.divinePoints >= cost;
        });
        break;
      case 'recommended':
        filtered = filtered.filter(upgrade => {
          // Simple efficiency check - upgrades with good value
          const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
          const efficiency = upgrade.effectValue / cost;
          return efficiency > 0.001 && upgrade.level < upgrade.maxLevel;
        });
        break;
      case 'hardware':
        filtered = filtered.filter(upgrade => upgrade.category === 'hardware');
        break;
      case 'advanced':
        filtered = filtered.filter(upgrade => upgrade.category === 'advanced');
        break;
      case 'software':
        filtered = filtered.filter(upgrade => upgrade.category === 'software');
        break;
      case 'network':
        filtered = filtered.filter(upgrade => upgrade.category === 'network');
        break;
      case 'infrastructure':
        filtered = filtered.filter(upgrade => upgrade.category === 'infrastructure');
        break;
      case 'all':
      default:
        // Show all upgrades
        break;
    }
    
    return filtered;
  }, [upgradeData, upgradeFilter]);

  // FAST PAGINATION - Instant pagination calculation
  const getTotalPages = useCallback((): number => {
    return Math.ceil(getFilteredUpgrades().length / upgradesPerPage);
  }, [getFilteredUpgrades]);

  const getPaginatedUpgrades = useCallback((): any[] => {
    const filtered = getFilteredUpgrades();
    const startIndex = (currentUpgradePage - 1) * upgradesPerPage;
    const endIndex = startIndex + upgradesPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [getFilteredUpgrades, currentUpgradePage]);

  // FAST HELPER FUNCTIONS
  const getUpgradeCost = useCallback((upgrade: any): number => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
  }, []);

  const isUpgradeMaxed = useCallback((upgrade: any): boolean => {
    return upgrade.level >= upgrade.maxLevel;
  }, []);

  const isUpgradeAvailable = useCallback((upgrade: any): boolean => {
    if (!upgrade.requires) return true;
    const requiredUpgrade = upgradeData?.upgrades?.find((u: any) => u.id === upgrade.requires.upgrade);
    return requiredUpgrade && requiredUpgrade.level >= upgrade.requires.level;
  }, [upgradeData]);

  const formatNumber = useCallback((num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  }, []);

  // FAST PURCHASE HANDLER
  const handlePurchaseUpgrade = useCallback((upgradeId: string) => {
    console.log('🚀 Fast purchase request:', upgradeId);
    // Dispatch purchase event to DivineMiningGame
    window.dispatchEvent(new CustomEvent('purchaseUpgrade', { detail: upgradeId }));
  }, []);

  const requestUpgradeData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // Request upgrade data from DivineMiningGame
    window.dispatchEvent(new CustomEvent('requestUpgradeData'));
    
    // Set a timeout to handle cases where no response is received
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('No response from game. Please try again.');
        setRetryCount(prev => prev + 1);
      }
    }, 3000);
  }, [isLoading]);

  // Listen for upgrade data from DivineMiningGame
  useEffect(() => {
    const handleUpgradeData = (event: CustomEvent) => {
      if (event.detail) {
        setUpgradeData(event.detail);
        setIsLoading(false);
        setError(null);
      }
    };

    const handleUpgradeDataError = () => {
      setIsLoading(false);
      setError('Failed to load upgrade data');
    };

    // Listen for purchase updates to refresh data
    const handlePurchaseUpdate = () => {
      console.log('🔄 Purchase update received, refreshing upgrade data...');
      // Request fresh data after purchase
      requestUpgradeData();
    };

    window.addEventListener('upgradeDataResponse', handleUpgradeData as EventListener);
    window.addEventListener('upgradeDataError', handleUpgradeDataError);
    window.addEventListener('purchaseUpdate', handlePurchaseUpdate);
    
    return () => {
      window.removeEventListener('upgradeDataResponse', handleUpgradeData as EventListener);
      window.removeEventListener('upgradeDataError', handleUpgradeDataError);
      window.removeEventListener('purchaseUpdate', handlePurchaseUpdate);
    };
  }, [requestUpgradeData]);

  const closeUpgradeShop = () => {
    setShowUpgradeShop(false);
    setError(null);
    setRetryCount(0);
  };

  // Request upgrade data when modal opens - IMMEDIATE
  useEffect(() => {
    if (showUpgradeShop) {
      // Immediate request for faster response
      requestUpgradeData();
    }
  }, [showUpgradeShop, requestUpgradeData]);

  // Listen for upgrade data changes - OPTIMIZED
  useEffect(() => {
    const handleUpgradeDataChange = () => {
      console.log('🔄 Upgrade data changed in IndexPage, updating existing data...');
      // Don't request fresh data for filter changes - just update existing data
      if (showUpgradeShop && upgradeData) {
        // Update the existing data instead of making new requests
        setUpgradeData((prevData: any) => ({
          ...prevData,
          timestamp: Date.now() // Force re-render
        }));
      }
    };

    window.addEventListener('upgradeDataChanged', handleUpgradeDataChange);
    
    return () => {
      window.removeEventListener('upgradeDataChanged', handleUpgradeDataChange);
    };
  }, [showUpgradeShop, upgradeData]);

  // If no upgrade data is available, show loading or error state
  if (!upgradeData) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-300 ${showUpgradeShop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeUpgradeShop();
          }
        }}
      >
        <div className={`relative w-full h-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_40px_rgba(0,255,255,0.3)] overflow-hidden transition-transform duration-300 ${showUpgradeShop ? 'scale-100' : 'scale-95'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-700 to-blue-800 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
                <div className="text-cyan-200 text-2xl">🤖</div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-mono text-cyan-400">Divine Points</span>
                <span className="flex items-center text-2xl font-mono font-bold text-yellow-300">
                  <span className="mr-2 text-yellow-400">💰</span>
                  <span className="tabular-nums">
                    {isLoading ? 'Loading...' : '---'}
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={closeUpgradeShop}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-800/50 hover:border-red-400/50 transition-all duration-200 hover:scale-110"
              title="Close shop"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
            {error ? (
              <div className="text-center py-12">
                <div className="text-red-400 font-mono text-lg mb-4">
                  ⚠️ Connection Error
                </div>
                <div className="text-gray-500 font-mono text-sm mb-6">
                  {error}
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={requestUpgradeData}
                    className="px-6 py-3 bg-cyan-900/50 text-cyan-300 border border-cyan-500 rounded-lg hover:bg-cyan-800/50 transition-all duration-200"
                  >
                    Retry
                  </button>
                  <button
                    onClick={closeUpgradeShop}
                    className="px-6 py-3 bg-gray-700/50 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-600/50 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
                {retryCount > 0 && (
                  <div className="text-gray-600 font-mono text-xs mt-4">
                    Retry attempts: {retryCount}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 font-mono text-lg mb-4">
                  🔧 Loading Upgrade Shop...
                </div>
                <div className="text-gray-500 font-mono text-sm mb-4">
                  Connecting to mining game data...
                </div>
                <div className="flex justify-center">
                  <div className="w-8 h-8 border border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                </div>
                <div className="text-gray-600 font-mono text-xs mt-4">
                  This may take a few seconds...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Use the actual UpgradeModal with real data
  return (
    <UpgradeModal
      isOpen={showUpgradeShop}
      onClose={closeUpgradeShop}
      upgrades={upgradeData.upgrades}
      divinePoints={upgradeData.divinePoints}
      onPurchaseUpgrade={handlePurchaseUpgrade}
      purchasingUpgrade={upgradeData.purchasingUpgrade}
      formatNumber={formatNumber}
      getUpgradeCost={getUpgradeCost}
      isUpgradeMaxed={isUpgradeMaxed}
      isUpgradeAvailable={isUpgradeAvailable}
      getFilterDisplayName={getFilterDisplayName}
      getUpgradeCategoryColor={getUpgradeCategoryColor}
      getUpgradeCategoryName={getUpgradeCategoryName}
      getPaginatedUpgrades={getPaginatedUpgrades}
      getTotalPages={getTotalPages}
      upgradeFilter={upgradeFilter}
      currentUpgradePage={currentUpgradePage}
      setUpgradeFilter={setUpgradeFilter}
      setCurrentUpgradePage={setCurrentUpgradePage}
    />
  );
};

export const IndexPage: FC = () => {
  const { user, isLoading, error } = useAuth();
  
  // Skip loading if user is already authenticated
  const shouldShowLoading = isLoading && !user;
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState('zodiac');
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [showWalletStatus, setShowWalletStatus] = useState(false);
  
  // TON Wallet State
  const userFriendlyAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Upgrade Shop Modal State
  const [showUpgradeShop, setShowUpgradeShop] = useState(false);
  
  // TON Network Configuration
  const isMainnet = false; // You can toggle this for testing
  const NETWORK_NAME = isMainnet ? 'Mainnet' : 'Testnet';
  const MAINNET_API_KEY = 'ba0e3b7f5080add7ba9bc310b2652ce4d33654575152d5ab90fde863309f6118';
  const TESTNET_API_KEY = 'bb31868e5cf6529efb16bcf547beb3c534a28d1e139bd63356fd936c168fe662';
  
  // Add referral integration
  useReferralIntegration();
  
  // Global event listener for opening upgrade shop
  useEffect(() => {
    const handleOpenUpgradeShop = () => {
      setShowUpgradeShop(true);
    };

    window.addEventListener('openUpgradeShop', handleOpenUpgradeShop);
    
    return () => {
      window.removeEventListener('openUpgradeShop', handleOpenUpgradeShop);
    };
  }, []);

  // Show wallet status when address changes or balance updates
  useEffect(() => {
    if (userFriendlyAddress) {
      setShowWalletStatus(true);
      const timer = setTimeout(() => {
        setShowWalletStatus(false);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [userFriendlyAddress, walletBalance]);

  // Function to fetch wallet balance from TON Center API
  const fetchWalletBalance = async () => {
    if (!userFriendlyAddress) {
      setWalletBalance('0');
      return;
    }

    setShowWalletStatus(true); // Show status when fetching balance
    setIsLoadingBalance(true);
    try {
      const apiKey = isMainnet ? MAINNET_API_KEY : TESTNET_API_KEY;
      const baseUrl = isMainnet ? 'https://toncenter.com/api/v2' : 'https://testnet.toncenter.com/api/v2';
      
      // Fetch wallet balance from TON Center API
      const response = await fetch(`${baseUrl}/getAddressBalance?address=${userFriendlyAddress}`, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok) {
        // Convert nano TON to TON (1 TON = 1,000,000,000 nano TON)
        const balanceInNano = parseInt(data.result);
        const balanceInTon = balanceInNano / 1_000_000_000;
        setWalletBalance(balanceInTon.toFixed(4));
        console.log(`💰 Wallet balance updated: ${balanceInTon.toFixed(4)} TON (${NETWORK_NAME})`);
      } else {
        console.error('API error:', data.error);
        setWalletBalance('0');
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance('0');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Function to disconnect wallet
  const handleDisconnectWallet = async () => {
    setShowWalletStatus(true); // Show status when disconnecting
    try {
      await tonConnectUI.disconnect();
      setWalletBalance('0');
      console.log('🔌 Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Fetch wallet balance when wallet is connected
  useEffect(() => {
    fetchWalletBalance();
  }, [userFriendlyAddress]);

  // Refresh wallet balance every 30 seconds when connected
  useEffect(() => {
    if (!userFriendlyAddress) return;

    const interval = setInterval(() => {
      fetchWalletBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userFriendlyAddress]);
  
  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setShowNetworkWarning(false);
    };
    
    const handleOffline = () => {
      setShowNetworkWarning(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // const connectedAddress = useMemo(() => {
  //   return isValidAddress(connectedAddressString)
  //     ? Address.parse(connectedAddressString)
  //     : null;
  // }, [connectedAddressString]);
  
  // Get theme-specific colors
  const getThemeColors = () => {
    switch (theme) {
      case 'light':
        return {
          mainGradient: 'from-gray-100 via-gray-50 to-gray-200',
          energyFields: 'bg-cyan-200/20',
          energyFieldsDark: 'bg-cyan-400/15',
          energyFields2: 'bg-blue-300/15',
          energyFields2Dark: 'bg-blue-500/10',
          energyFields3: 'bg-purple-400/15',
          energyFields3Dark: 'bg-purple-600/10',
          energyFields4: 'bg-cyan-300/15',
          energyFields4Dark: 'bg-cyan-500/10',
          orbs: 'bg-cyan-400/50',
          orbsDark: 'bg-cyan-500/45',
          particles: 'bg-cyan-500/40',
          particlesDark: 'bg-cyan-600/35',
          gridOverlay: 'from-cyan-200/10 via-transparent to-cyan-200/10',
          gridOverlayDark: 'from-cyan-500/6 via-transparent to-cyan-500/6',
          lightRays: 'from-transparent via-cyan-200/8 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-500/4 to-transparent',
          cornerGlows: 'bg-cyan-300/20',
          cornerGlowsDark: 'bg-cyan-500/15',
          cornerGlows2: 'bg-blue-400/20',
          cornerGlows2Dark: 'bg-blue-600/15',
          cornerGlows3: 'bg-purple-500/20',
          cornerGlows3Dark: 'bg-purple-700/15',
          cornerGlows4: 'bg-cyan-400/20',
          cornerGlows4Dark: 'bg-cyan-600/15',
          bottomNav: 'from-white/95 via-gray-50/90 to-white/95',
          bottomNavDark: 'from-gray-900/95 via-gray-800/90 to-gray-900/95',
          bottomBorder: 'border-cyan-300',
          bottomBorderDark: 'border-cyan-600',
          bottomShadow: 'shadow-[0_-4px_20px_0_rgba(0,255,255,0.15)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.2)]'
        };
      case 'dark':
        return {
          mainGradient: 'from-black via-gray-900 to-black',
          energyFields: 'bg-cyan-500/20',
          energyFieldsDark: 'bg-cyan-600/15',
          energyFields2: 'bg-blue-600/15',
          energyFields2Dark: 'bg-blue-700/10',
          energyFields3: 'bg-purple-600/15',
          energyFields3Dark: 'bg-purple-700/10',
          energyFields4: 'bg-cyan-400/15',
          energyFields4Dark: 'bg-cyan-500/10',
          orbs: 'bg-cyan-400/60',
          orbsDark: 'bg-cyan-500/55',
          particles: 'bg-cyan-400/50',
          particlesDark: 'bg-cyan-500/45',
          gridOverlay: 'from-cyan-500/8 via-transparent to-cyan-500/8',
          gridOverlayDark: 'from-cyan-600/5 via-transparent to-cyan-600/5',
          lightRays: 'from-transparent via-cyan-500/6 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-600/3 to-transparent',
          cornerGlows: 'bg-cyan-500/20',
          cornerGlowsDark: 'bg-cyan-600/15',
          cornerGlows2: 'bg-blue-600/20',
          cornerGlows2Dark: 'bg-blue-700/15',
          cornerGlows3: 'bg-purple-600/20',
          cornerGlows3Dark: 'bg-purple-700/15',
          cornerGlows4: 'bg-cyan-400/20',
          cornerGlows4Dark: 'bg-cyan-500/15',
          bottomNav: 'from-black/95 via-gray-900/90 to-black/95',
          bottomNavDark: 'from-black/95 via-gray-900/90 to-black/95',
          bottomBorder: 'border-cyan-500',
          bottomBorderDark: 'border-cyan-500',
          bottomShadow: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.2)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.25)]'
        };
      case 'auto':
        return {
          mainGradient: 'from-gray-900 via-black to-gray-900',
          energyFields: 'bg-cyan-400/20',
          energyFieldsDark: 'bg-cyan-500/15',
          energyFields2: 'bg-blue-500/15',
          energyFields2Dark: 'bg-blue-600/10',
          energyFields3: 'bg-purple-500/15',
          energyFields3Dark: 'bg-purple-600/10',
          energyFields4: 'bg-cyan-300/15',
          energyFields4Dark: 'bg-cyan-400/10',
          orbs: 'bg-cyan-400/55',
          orbsDark: 'bg-cyan-500/50',
          particles: 'bg-cyan-400/45',
          particlesDark: 'bg-cyan-500/40',
          gridOverlay: 'from-cyan-400/9 via-transparent to-cyan-400/9',
          gridOverlayDark: 'from-cyan-500/5.5 via-transparent to-cyan-500/5.5',
          lightRays: 'from-transparent via-cyan-400/7 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-500/3.5 to-transparent',
          cornerGlows: 'bg-cyan-400/20',
          cornerGlowsDark: 'bg-cyan-500/15',
          cornerGlows2: 'bg-blue-500/20',
          cornerGlows2Dark: 'bg-blue-600/15',
          cornerGlows3: 'bg-purple-500/20',
          cornerGlows3Dark: 'bg-purple-600/15',
          cornerGlows4: 'bg-cyan-300/20',
          cornerGlows4Dark: 'bg-cyan-400/15',
          bottomNav: 'from-gray-900/95 via-black/90 to-gray-900/95',
          bottomNavDark: 'from-gray-900/95 via-black/90 to-gray-900/95',
          bottomBorder: 'border-cyan-400',
          bottomBorderDark: 'border-cyan-500',
          bottomShadow: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.18)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.22)]'
        };
      default:
        return {
          mainGradient: 'from-black via-gray-900 to-black',
          energyFields: 'bg-cyan-500/20',
          energyFieldsDark: 'bg-cyan-600/15',
          energyFields2: 'bg-blue-600/15',
          energyFields2Dark: 'bg-blue-700/10',
          energyFields3: 'bg-purple-600/15',
          energyFields3Dark: 'bg-purple-700/10',
          energyFields4: 'bg-cyan-400/15',
          energyFields4Dark: 'bg-cyan-500/10',
          orbs: 'bg-cyan-400/60',
          orbsDark: 'bg-cyan-500/55',
          particles: 'bg-cyan-400/50',
          particlesDark: 'bg-cyan-500/45',
          gridOverlay: 'from-cyan-500/8 via-transparent to-cyan-500/8',
          gridOverlayDark: 'from-cyan-600/5 via-transparent to-cyan-600/5',
          lightRays: 'from-transparent via-cyan-500/6 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-600/3 to-transparent',
          cornerGlows: 'bg-cyan-500/20',
          cornerGlowsDark: 'bg-cyan-600/15',
          cornerGlows2: 'bg-blue-600/20',
          cornerGlows2Dark: 'bg-blue-700/15',
          cornerGlows3: 'bg-purple-600/20',
          cornerGlows3Dark: 'bg-purple-700/15',
          cornerGlows4: 'bg-cyan-400/20',
          cornerGlows4Dark: 'bg-cyan-500/15',
          bottomNav: 'from-black/95 via-gray-900/90 to-black/95',
          bottomNavDark: 'from-black/95 via-gray-900/90 to-black/95',
          bottomBorder: 'border-cyan-500',
          bottomBorderDark: 'border-cyan-500',
          bottomShadow: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.2)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.25)]'
        };
    }
  };

  const colors = getThemeColors();
  
  // Only show loading on initial load, not when switching tabs
  if (shouldShowLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-1000">
        {/* Futuristic Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
        </div>
        
        <div className="relative flex flex-col items-center space-y-6 z-10">
          {/* Futuristic Loading Animation */}
          <div className="relative">
            {/* Cyberpunk Core */}
            <div className="relative w-24 h-24">
              {/* Main Holographic Core */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 rounded-full shadow-[0_0_30px_rgba(0,255,255,0.5)] border-2 border-cyan-400 animate-pulse transition-all duration-1000">
                {/* Inner Core */}
                <div className="absolute inset-3 bg-gradient-to-br from-cyan-300 to-cyan-400 rounded-full animate-spin transition-all duration-1000" style={{ animationDuration: '3s' }}>
                  <div className="absolute inset-2 bg-gradient-to-br from-cyan-200 to-cyan-300 rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
                
                {/* Data Nodes */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full border border-cyan-600 flex items-center justify-center shadow-md transition-all duration-1000">
                  <div className="w-1.5 h-1.5 bg-cyan-700 rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
                <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full border border-cyan-600 flex items-center justify-center shadow-md transition-all duration-1000">
                  <div className="w-1.5 h-1.5 bg-cyan-700 rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
                
                {/* Holographic Aura */}
                <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-lg animate-pulse transition-all duration-1000"></div>
              </div>
              
              {/* Orbiting Data Particles */}
              {[...Array(16)].map((_, i) => (
                <div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-md transition-all duration-1000"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 22.5}deg) translateX(50px)`,
                    animation: `cyberpunk-orbit ${4 + i * 0.2}s linear infinite`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            
            {/* Futuristic Energy Waves */}
            <div className="absolute inset-0 bg-cyan-400/15 rounded-full blur-xl animate-ping transition-all duration-1000" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 bg-cyan-300/10 rounded-full blur-2xl animate-ping transition-all duration-1000" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            <div className="absolute inset-0 bg-cyan-200/5 rounded-full blur-3xl animate-ping transition-all duration-1000" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          </div>
          
          {/* Futuristic Loading Text */}
          <div className="text-center space-y-3">
            <div className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse transition-all duration-1000 tracking-wider">
              ⚡ DIVINE TAPSTERS ⚡
            </div>
            <div className="text-sm text-cyan-300 font-mono font-medium transition-all duration-1000 tracking-wide">
              Initializing neural interface...
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce transition-all duration-1000"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce transition-all duration-1000" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce transition-all duration-1000" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Futuristic Loading Status */}
          <div className="text-center max-w-xs">
            <div className="text-xs text-cyan-300 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30 transition-all duration-1000">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="font-mono font-bold tracking-wider">SYSTEM STATUS: INITIALIZING</span>
              </div>
              <p className="text-gray-300 font-mono text-[10px] tracking-wide">
                🔮 <span className="font-medium">Cyber Tip:</span> Neural networks are processing...
              </p>
            </div>
          </div>
        </div>
        
        {/* Futuristic custom CSS animations */}
        <style>{`
          @keyframes cyberpunk-orbit {
            0% {
              transform: rotate(0deg) translateX(50px) translateY(-50%);
              opacity: 0.8;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) translateX(50px) translateY(-50%);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${colors.mainGradient} dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200 transition-all duration-1000`}>
        <div className="text-center p-3">
          <p className="text-red-500 dark:text-red-400 text-sm transition-all duration-1000">{error}</p>
          <p className="mt-1 text-blue-600 dark:text-blue-400 text-xs transition-all duration-1000">Please open this app in Telegram</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GameProvider>
        <div className="w-full min-h-screen relative overflow-hidden">
          <ShoutboxHeader />
          {/* Network Warning */}
          {showNetworkWarning && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-500 text-white p-3 text-center font-mono font-bold text-sm animate-pulse">
              ⚠️ NO INTERNET CONNECTION - Some features may be limited
            </div>
          )}
      {/* Futuristic Cyberpunk Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Main cyberpunk gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-1000" />
        
        {/* Futuristic energy fields */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-cyan-500/20 rounded-full opacity-60 blur-3xl animate-pulse transition-all duration-1000" style={{ animationDuration: '8s' }} />
        <div className="absolute top-32 left-1/2 w-96 h-64 bg-blue-600/15 rounded-[60%] opacity-70 blur-3xl animate-pulse transition-all duration-1000" style={{ transform: 'translateX(-50%) rotate(-12deg)', animationDuration: '10s' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-80 bg-purple-600/20 rounded-tl-[80%] rounded-tr-[60%] rounded-bl-[60%] rounded-br-[80%] opacity-80 blur-3xl animate-pulse transition-all duration-1000" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-20 left-20 w-60 h-48 bg-cyan-400/15 rounded-full opacity-50 blur-3xl animate-pulse transition-all duration-1000" style={{ animationDuration: '14s' }} />
        
        {/* Futuristic floating data nodes */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`node-${i}`}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-ping transition-all duration-1000"
            style={{
              top: `${15 + (i * 7)}%`,
              left: `${8 + (i * 8)}%`,
              animationDuration: `${2 + i * 0.3}s`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
        
        {/* Futuristic data particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full animate-ping transition-all duration-1000"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${1.5 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Futuristic cyberpunk grid overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Futuristic scan lines */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse transition-all duration-1000" style={{ animationDuration: '4s' }} />
        
        {/* Futuristic corner energy fields */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-br-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '6s' }} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-bl-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/20 rounded-tr-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-tl-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '9s' }} />
        
        {/* Futuristic circuit patterns */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Futuristic holographic interference */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/2 to-transparent animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/2 to-transparent animate-pulse" style={{ animationDuration: '12s' }} />
      </div>
      
      <div className="relative z-10">
        {!isLoading && user && <OnboardingScreen />}

                 {/* Enhanced Cyberpunk Main Content Area */}
         <div className="flex-1 pb-20 px-4 pt-4 max-w-md mx-auto">
           
           {/* Ultra-Compact Cyberpunk Stats Header */}
           {userFriendlyAddress && (
             <GameHeader 
               user={user} 
               currentTab={currentTab}
               userFriendlyAddress={userFriendlyAddress}
               walletBalance={walletBalance}
               isLoadingBalance={isLoadingBalance}
               NETWORK_NAME={NETWORK_NAME}
               fetchWalletBalance={fetchWalletBalance}
             />
           )}

           {/* Compact Wallet Connection Section */}
           {!userFriendlyAddress && (
             <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/20 rounded-lg p-2 mb-2">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                   <span className="text-orange-400 font-mono font-bold text-[10px]">🔗 CONNECT WALLET</span>
                 </div>
                 <div className="text-[9px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                   🌐 {NETWORK_NAME}
                 </div>
               </div>
               <div className="flex items-center justify-between mt-1.5">
                 <p className="text-[9px] text-gray-300">
                   Connect your TON wallet to access all features
                 </p>
                 <TonConnectButton 
                   className=""
                 />
               </div>
             </div>
           )}

           {/* Compact Wallet Status Bar */}
           {userFriendlyAddress && showWalletStatus && (
             <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/20 rounded-lg p-2 mb-2 transition-all duration-300">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                   <span className="text-green-400 font-mono font-bold text-[10px]">WALLET CONNECTED</span>
                   <span className="text-gray-400 font-mono text-[9px]">
                     {userFriendlyAddress.slice(0, 6)}...{userFriendlyAddress.slice(-4)}
                   </span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <div className="text-[9px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                     🌐 {NETWORK_NAME}
                   </div>
                   <button
                     onClick={handleDisconnectWallet}
                     className="text-[9px] text-red-400 font-mono bg-red-500/10 px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors duration-200 border border-red-500/20 hover:border-red-500/40"
                     title="Disconnect Wallet"
                   >
                     🔌
                   </button>
                 </div>
               </div>
             </div>
           )}

          {currentTab === 'zodiac' && <DivineMiningGame />}
          {currentTab === 'daily' && <DailyRewards />}
          {currentTab === 'divine' && <DivinePointsLeaderboard />}

          {currentTab === 'crystals' && (
            <div className="flex-1 overflow-y-auto">
              <TaskCenter/>
            </div>
          )}

          {currentTab === 'spells' && (
            <div className="flex-1 overflow-y-auto">
              <ReferralSystem />
            </div>
          )}

        </div>

        {/* Upgrade Shop Modal */}
        <UpgradeShopModal 
          showUpgradeShop={showUpgradeShop}
          setShowUpgradeShop={setShowUpgradeShop}
        />

                 {/* Enhanced Cyberpunk Bottom Navigation */}
         <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/98 via-gray-900/95 to-black/98 backdrop-blur-2xl border-t border-cyan-500/40 safe-area-pb z-40 shadow-[0_-8px_32px_0_rgba(0,255,255,0.15)] transition-all duration-300 overflow-hidden">
           {/* Enhanced Top Border with Animation */}
           <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
           
           {/* Holographic Scan Effect */}
           <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/2 via-transparent to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
           
           <div className="max-w-lg mx-auto px-3 py-3 relative">
             <div className="grid grid-cols-5 items-center gap-2">
               {[
                 { id: 'zodiac', text: 'Mine', Icon: BiHome, color: 'cyan' },
                 { id: 'daily', text: 'Rewards', Icon: GiCrystalBall, color: 'purple' },
                 { id: 'divine', text: 'Leaderboard', Icon: GiDiamonds, color: 'yellow' },
                 { id: 'crystals', text: 'Tasks', Icon: GiCrystalCluster, color: 'green' },
                 { id: 'spells', text: 'Referrals', Icon: GiSpellBook, color: 'pink' }, 
               ].map(({ id, text, Icon, color }) => {
                 const isActive = currentTab === id;
                 
                 const getColorClasses = (colorName: string, active: boolean) => {
                   const colors = {
                     cyan: {
                       bg: active ? 'from-cyan-500/80 to-cyan-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-cyan-400/60' : 'border-gray-600/40',
                       text: active ? 'text-cyan-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(6,182,212,0.4)]' : '',
                       hover: 'group-hover:from-cyan-600/60 group-hover:to-cyan-700/40 group-hover:border-cyan-500/50'
                     },
                     purple: {
                       bg: active ? 'from-purple-500/80 to-purple-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-purple-400/60' : 'border-gray-600/40',
                       text: active ? 'text-purple-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(147,51,234,0.4)]' : '',
                       hover: 'group-hover:from-purple-600/60 group-hover:to-purple-700/40 group-hover:border-purple-500/50'
                     },
                     yellow: {
                       bg: active ? 'from-yellow-500/80 to-yellow-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-yellow-400/60' : 'border-gray-600/40',
                       text: active ? 'text-yellow-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(251,191,36,0.4)]' : '',
                       hover: 'group-hover:from-yellow-600/60 group-hover:to-yellow-700/40 group-hover:border-yellow-500/50'
                     },
                     green: {
                       bg: active ? 'from-emerald-500/80 to-emerald-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-emerald-400/60' : 'border-gray-600/40',
                       text: active ? 'text-emerald-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' : '',
                       hover: 'group-hover:from-emerald-600/60 group-hover:to-emerald-700/40 group-hover:border-emerald-500/50'
                     },
                     pink: {
                       bg: active ? 'from-pink-500/80 to-pink-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-pink-400/60' : 'border-gray-600/40',
                       text: active ? 'text-pink-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(236,72,153,0.4)]' : '',
                       hover: 'group-hover:from-pink-600/60 group-hover:to-pink-700/40 group-hover:border-pink-500/50'
                     }
                   };
                   return colors[colorName as keyof typeof colors];
                 };
                 
                 const colorClasses = getColorClasses(color, isActive);
                 
                 return (
                   <button 
                     key={id} 
                     aria-label={text}
                     onClick={() => setCurrentTab(id)}
                     className={`
                       group relative flex flex-col items-center py-2 px-1 w-full transition-all duration-300 rounded-xl
                       ${isActive ? 'scale-105' : 'hover:scale-102'}
                     `}
                   >
                     {/* Enhanced Icon Container */}
                     <div className={`
                       relative flex items-center justify-center rounded-xl transition-all duration-300 mb-1.5 border-2
                       bg-gradient-to-br ${colorClasses.bg} ${colorClasses.border} ${colorClasses.glow} ${colorClasses.hover}
                     `}
                       style={{
                         width: 40,
                         height: 40,
                       }}
                     >
                       {/* Enhanced Glow Effect */}
                       {isActive && (
                         <>
                           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl animate-pulse" style={{ animationDuration: '2s' }}></div>
                           <div className="absolute -inset-1 bg-gradient-to-br from-current/20 to-transparent rounded-xl blur-sm animate-pulse" style={{ animationDuration: '3s' }}></div>
                         </>
                       )}
                       
                       {/* Floating Particles for Active Tab */}
                       {isActive && (
                         <>
                           <div className="absolute top-0 right-0 w-1 h-1 bg-current rounded-full animate-ping opacity-60"></div>
                           <div className="absolute bottom-0 left-0 w-1 h-1 bg-current rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
                         </>
                       )}
                       
                       <Icon 
                         size={18} 
                         className={`
                           relative z-10 transition-all duration-300
                           ${isActive 
                             ? 'text-white filter drop-shadow-[0_0_8px_currentColor]' 
                             : 'text-gray-300 group-hover:text-white group-hover:drop-shadow-[0_0_4px_currentColor]'
                           }
                         `} 
                       />
                     </div>
                     
                     {/* Enhanced Text */}
                     <span className={`
                       text-[9px] font-mono font-bold tracking-wider truncate max-w-[55px] text-center transition-all duration-300 uppercase
                       ${colorClasses.text} group-hover:text-gray-300
                       ${isActive ? 'filter drop-shadow-[0_0_4px_currentColor]' : ''}
                     `}>
                       {text}
                     </span>
                     
                     {/* Enhanced Active Indicator */}
                     {isActive && (
                       <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-current rounded-full animate-pulse"></div>
                     )}
                   </button>
                 );
               })}
             </div>
           </div>
           
           {/* Enhanced Bottom Effects */}
           <div className="absolute bottom-0 left-0 right-0">
             <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
             <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
           </div>
         </div>
               </div>
      </div>
      
        </GameProvider>
      </ErrorBoundary>
    );
  };