import React, { useState, useEffect } from 'react';
import { GiCrown, GiTrophy, GiMedal, GiLightningArc, GiDiamonds } from 'react-icons/gi';
import { BiTime, BiTrendingUp, BiStar, BiRefresh } from 'react-icons/bi';
import { FaCrown } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { 
  getDivinePointsLeaderboard, 
  getDivinePointsLeaderboardByPeriod, 
  getUserDivinePointsRank,
  getDivinePointsStats,
  // updateGenericUsernames
} from '@/lib/supabaseClient';
import './DivinePointsLeaderboard.css';

interface DivinePlayer {
  rank: number;
  userId: number;
  telegramId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  divinePoints: number;
  totalPointsEarned: number;
  pointsPerSecond: number;
  highScore: number;
  allTimeHighScore: number;
  upgradesPurchased: number;
  lastActive: string;
  joinedAt: string;
  lastUpdated: string;
  period?: string;
}

interface LeaderboardData {
  topPlayers: DivinePlayer[];
  dailyWinners: DivinePlayer[];
  weeklyWinners: DivinePlayer[];
  monthlyWinners: DivinePlayer[];
  totalPlayers: number;
  lastUpdated: number;
}

interface DivineStats {
  totalPlayers: number;
  totalDivinePoints: number;
  averageDivinePoints: number;
  maxDivinePoints: number;
  totalPointsEarned: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <GiCrown className="text-yellow-400 text-lg" />;
  if (rank === 2) return <GiTrophy className="text-gray-300 text-lg" />;
  if (rank === 3) return <GiMedal className="text-amber-600 text-lg" />;
  return <span className="text-cyan-400 font-bold text-sm">#{rank}</span>;
};

const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return time.toLocaleDateString();
};

// Generate mock data for demonstration
const generateMockDivinePlayers = (): DivinePlayer[] => {
  const names = [
    'DivineMiner_2077', 'CosmicHarvester', 'QuantumDiviner', 'CrystalSeeker', 'MysticMiner',
    'EtherealDigger', 'AstralProspector', 'CelestialMiner', 'SpiritualHarvester', 'TranscendentDigger',
    'EnlightenedMiner', 'SacredProspector', 'DivineSeeker', 'CosmicDigger', 'QuantumHarvester',
    'MysticProspector', 'CrystalMiner', 'EtherealSeeker', 'AstralDigger', 'CelestialHarvester'
  ];

  return names.map((name, index) => ({
    rank: index + 1,
    userId: 1000 + index,
    telegramId: 123456789 + index,
    username: name,
    firstName: name.split('_')[0],
    lastName: name.split('_')[1] || '',
    divinePoints: Math.floor(Math.random() * 10000000) + 100000,
    totalPointsEarned: Math.floor(Math.random() * 50000000) + 500000,
    pointsPerSecond: Math.floor(Math.random() * 1000) + 10,
    highScore: Math.floor(Math.random() * 20000000) + 200000,
    allTimeHighScore: Math.floor(Math.random() * 50000000) + 500000,
    upgradesPurchased: Math.floor(Math.random() * 50) + 5,
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
    joinedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    lastUpdated: new Date().toISOString()
  })).sort((a, b) => b.divinePoints - a.divinePoints);
};

export const DivinePointsLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'all_time' | 'daily' | 'weekly' | 'monthly'>('all_time');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyTop10, setShowOnlyTop10] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    topPlayers: [],
    dailyWinners: [],
    weeklyWinners: [],
    monthlyWinners: [],
    totalPlayers: 0,
    lastUpdated: Date.now()
  });
  const [stats, setStats] = useState<DivineStats>({
    totalPlayers: 0,
    totalDivinePoints: 0,
    averageDivinePoints: 0,
    maxDivinePoints: 0,
    totalPointsEarned: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userDivinePoints, setUserDivinePoints] = useState(0);
  const [userPointsPerSecond, setUserPointsPerSecond] = useState(0);
  const [previousUserRank, setPreviousUserRank] = useState<number | null>(null);

  // Load user's current game state from localStorage
  useEffect(() => {
    const loadUserGameState = async () => {
      try {
        const savedGameState = localStorage.getItem('divineMiningGame');
        if (savedGameState) {
          const gameState = JSON.parse(savedGameState);
          const newDivinePoints = gameState.divinePoints || 0;
          const newPointsPerSecond = gameState.pointsPerSecond || 0;
          
          setUserDivinePoints(newDivinePoints);
          setUserPointsPerSecond(newPointsPerSecond);
          
          // Update user rank if divine points changed and user is logged in
          if (user?.id && newDivinePoints > 0) {
            const newRank = await getUserDivinePointsRank(user.id);
            if (newRank !== userRank) {
              setPreviousUserRank(userRank);
              setUserRank(newRank);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user game state:', error);
      }
    };

    loadUserGameState();
    const interval = setInterval(loadUserGameState, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboardData = async () => {
      setIsLoading(true);
      
      try {
        // Load real data from database
        console.log('Loading real leaderboard data...');
        const allTimeData = await getDivinePointsLeaderboard(100);
        console.log('All time data:', allTimeData);
        console.log('All time data length:', allTimeData?.length);
        
        const dailyData = await getDivinePointsLeaderboardByPeriod('daily', 50);
        console.log('Daily data:', dailyData);
        console.log('Daily data length:', dailyData?.length);
        
        const weeklyData = await getDivinePointsLeaderboardByPeriod('weekly', 50);
        console.log('Weekly data:', weeklyData);
        console.log('Weekly data length:', weeklyData?.length);
        
        const monthlyData = await getDivinePointsLeaderboardByPeriod('monthly', 50);
        console.log('Monthly data:', monthlyData);
        console.log('Monthly data length:', monthlyData?.length);
        
        // Load global stats
        const globalStats = await getDivinePointsStats();
        console.log('Global stats:', globalStats);
        
        // Get user rank if logged in
        let userRankData = null;
        if (user?.id && userDivinePoints > 0) {
          userRankData = await getUserDivinePointsRank(user.id);
          console.log('User rank data:', userRankData);
        }

        setLeaderboardData({
          topPlayers: allTimeData || [],
          dailyWinners: dailyData || [],
          weeklyWinners: weeklyData || [],
          monthlyWinners: monthlyData || [],
          totalPlayers: globalStats.totalPlayers,
          lastUpdated: Date.now()
        });

        setStats(globalStats);
        setUserRank(userRankData);
        
      } catch (error) {
        console.error('Error loading leaderboard data:', error);
        // Fallback to mock data if database fails
        const allTimeData = generateMockDivinePlayers();
        const dailyData = allTimeData.slice(0, 20).map(p => ({ ...p, divinePoints: Math.floor(p.divinePoints * 0.1) }));
        const weeklyData = allTimeData.slice(0, 20).map(p => ({ ...p, divinePoints: Math.floor(p.divinePoints * 0.3) }));
        const monthlyData = allTimeData.slice(0, 20).map(p => ({ ...p, divinePoints: Math.floor(p.divinePoints * 0.6) }));
        
        const totalDivinePoints = allTimeData.reduce((sum, p) => sum + p.divinePoints, 0);
        const totalPointsEarned = allTimeData.reduce((sum, p) => sum + p.totalPointsEarned, 0);
        const maxDivinePoints = Math.max(...allTimeData.map(p => p.divinePoints));
        
        const globalStats = {
          totalPlayers: allTimeData.length,
          totalDivinePoints,
          averageDivinePoints: totalDivinePoints / allTimeData.length,
          maxDivinePoints,
          totalPointsEarned
        };
        
        let userRankData = null;
        if (userDivinePoints > 0) {
          userRankData = allTimeData.findIndex(p => p.divinePoints <= userDivinePoints) + 1;
          if (userRankData === 0) userRankData = allTimeData.length + 1;
        }

        setLeaderboardData({
          topPlayers: allTimeData,
          dailyWinners: dailyData,
          weeklyWinners: weeklyData,
          monthlyWinners: monthlyData,
          totalPlayers: globalStats.totalPlayers,
          lastUpdated: Date.now()
        });

        setStats(globalStats);
        setUserRank(userRankData);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboardData();
  }, [user?.id, userDivinePoints]);

  const getCurrentTabData = () => {
    let data: DivinePlayer[] = [];
    
    switch (currentTab) {
      case 'all_time': 
        data = leaderboardData.topPlayers;
        break;
      case 'daily': 
        data = leaderboardData.dailyWinners;
        break;
      case 'weekly': 
        data = leaderboardData.weeklyWinners;
        break;
      case 'monthly': 
        data = leaderboardData.monthlyWinners;
        break;
      default: 
        data = leaderboardData.topPlayers;
    }

    // Ensure the data is always sorted correctly by points in descending order
    data.sort((a, b) => b.divinePoints - a.divinePoints);

    // Apply search filter
    if (searchTerm.trim()) {
      data = data.filter(player => 
        player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply top 10 filter
    if (showOnlyTop10) {
      data = data.slice(0, 10);
    }

    // Apply active players filter (active in last 24 hours)
    if (showOnlyActive) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      data = data.filter(player => new Date(player.lastActive) > oneDayAgo);
    }

    return data;
  };

  const refreshLeaderboard = async () => {
    setIsRefreshing(true);
    
    try {
      // Load fresh data from database
      const allTimeData = await getDivinePointsLeaderboard(100);
      const dailyData = await getDivinePointsLeaderboardByPeriod('daily', 50);
      const weeklyData = await getDivinePointsLeaderboardByPeriod('weekly', 50);
      const monthlyData = await getDivinePointsLeaderboardByPeriod('monthly', 50);
      const globalStats = await getDivinePointsStats();
      
      let userRankData = null;
      if (user?.id && userDivinePoints > 0) {
        userRankData = await getUserDivinePointsRank(user.id);
      }

      setLeaderboardData({
        topPlayers: allTimeData,
        dailyWinners: dailyData,
        weeklyWinners: weeklyData,
        monthlyWinners: monthlyData,
        totalPlayers: globalStats.totalPlayers,
        lastUpdated: Date.now()
      });

      setStats(globalStats);
      setUserRank(userRankData);
      
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      // Show error notification instead of falling back to mock data
      console.error('Failed to refresh leaderboard data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // const fixUsernames = async () => {
  //   try {
  //     console.log('Updating generic usernames...');
  //     await updateGenericUsernames();
  //     // Refresh the leaderboard after updating usernames
  //     await refreshLeaderboard();
  //   } catch (error) {
  //     console.error('Error fixing usernames:', error);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex-1 p-custom space-y-2 overflow-y-auto game-scrollbar">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="text-cyan-400 font-mono text-sm animate-pulse tracking-wider">
            LOADING DIVINE LEADERBOARD...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 space-y-1.5 overflow-y-auto game-scrollbar">
      {/* Header with Glass Effect */}
      <div className="glass-effect bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 hover-float">
            <GiDiamonds className="text-cyan-400 text-lg" />
            <span className="gradient-text font-mono font-bold tracking-wider text-sm">LEADERBOARD</span>
          </div>
          
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all duration-300 hover-glow ${
                showStats
                  ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/50'
                  : 'bg-black/40 text-gray-400 border border-gray-600 hover:text-yellow-300'
              }`}
            >
              {showStats ? 'Hide Stats' : 'Stats'}
            </button>
            <button
              onClick={refreshLeaderboard}
              disabled={isRefreshing}
              className={`p-1.5 rounded transition-all duration-300 hover-glow ${
                isRefreshing 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30'
              }`}
            >
              <BiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid with Animation */}
        {showStats && (
          <div className="stats-grid grid-cols-2 sm:grid-cols-4 mb-2">
            <div className="stats-item shimmer">
              <div className="text-cyan-400 font-mono text-[10px] tracking-wider">PLAYERS</div>
              <div className="text-white font-bold text-sm">{formatNumber(stats.totalPlayers)}</div>
            </div>
            <div className="stats-item shimmer">
              <div className="text-yellow-400 font-mono text-[10px] tracking-wider">TOTAL</div>
              <div className="text-white font-bold text-sm">{formatNumber(stats.totalDivinePoints)}</div>
            </div>
            <div className="stats-item shimmer">
              <div className="text-green-400 font-mono text-[10px] tracking-wider">AVG</div>
              <div className="text-white font-bold text-sm">{formatNumber(Math.floor(stats.averageDivinePoints))}</div>
            </div>
            <div className="stats-item shimmer">
              <div className="text-purple-400 font-mono text-[10px] tracking-wider">MAX</div>
              <div className="text-white font-bold text-sm">{formatNumber(stats.maxDivinePoints)}</div>
            </div>
          </div>
        )}

        {/* User Stats with Glass Effect */}
        {user && (
          <div className="glass-effect bg-black/40 border border-cyan-400/20 rounded p-2 mb-2 hover-glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center hover-float">
                  <span className="text-white text-xs">YOU</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="gradient-text font-mono font-bold text-xs">#{userRank || 'N/A'}</span>
                  {previousUserRank && userRank && previousUserRank !== userRank && (
                    <span className={`text-xs ${userRank < previousUserRank ? 'text-green-400' : 'text-red-400'}`}>
                      {userRank < previousUserRank ? '↗' : '↘'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GiLightningArc className="text-green-400 text-sm animate-pulse" />
                <div className="text-right">
                  <div className="gradient-text font-mono font-bold text-xs">+{userPointsPerSecond.toFixed(1)}/s</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation with Hover Effects */}
        <div className="flex gap-1">
          {[
            { key: 'all_time', label: 'All', icon: <FaCrown className="text-xs" /> },
            { key: 'daily', label: '24H', icon: <BiTime className="text-xs" /> },
            { key: 'weekly', label: '7D', icon: <BiTrendingUp className="text-xs" /> },
            { key: 'monthly', label: '30D', icon: <BiStar className="text-xs" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded text-xs font-mono transition-all duration-300 hover-glow ${
                currentTab === tab.key
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                  : 'text-gray-400 hover:text-cyan-300 hover:bg-black/30'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters with Glass Effect */}
      <div className="glass-effect bg-black/20 rounded p-1.5 flex gap-1.5">
        <input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-black/40 border border-cyan-400/30 rounded px-2 py-1 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-cyan-400/60 transition-all duration-300"
        />
        <button
          onClick={() => setShowOnlyTop10(!showOnlyTop10)}
          className={`px-2 py-1 rounded text-xs font-mono transition-all duration-300 hover-glow ${
            showOnlyTop10
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
              : 'bg-black/40 text-gray-400 border border-gray-600 hover:text-cyan-300'
          }`}
        >
          Top 10
        </button>
        <button
          onClick={() => setShowOnlyActive(!showOnlyActive)}
          className={`px-2 py-1 rounded text-xs font-mono transition-all duration-300 hover-glow ${
            showOnlyActive
              ? 'bg-green-500/30 text-green-300 border border-green-400/50'
              : 'bg-black/40 text-gray-400 border border-gray-600 hover:text-green-300'
          }`}
        >
          24H
        </button>
      </div>

      {/* Leaderboard List with Card Effects */}
      <div className="space-y-1.5">
        {getCurrentTabData().length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            No players found
          </div>
        ) : (
          getCurrentTabData().map((player, index) => {
            const isCurrentUser = user?.id === player.userId;
            return (
              <div
                key={`${player.userId}-${currentTab}`}
                className={`leaderboard-card glass-effect bg-black/40 backdrop-blur-xl border rounded p-2 transition-all duration-300 hover:bg-black/60 ${
                  isCurrentUser ? 'border-green-400/50 shadow-[0_0_15px_rgba(34,197,94,0.2)] bg-green-500/10' :
                  index === 0 ? 'top-player-1' :
                  index === 1 ? 'top-player-2' :
                  index === 2 ? 'top-player-3' :
                  'border-cyan-400/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center hover-float">
                      {getRankIcon(player.rank)}
                      <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded ml-1.5 flex items-center justify-center">
                        <span className="text-white text-xs">{player.username.charAt(0)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-white font-bold text-xs flex items-center gap-1">
                        {player.username}
                        {isCurrentUser && <span className="text-[10px] text-green-400">(YOU)</span>}
                        {player.rank <= 3 && (
                          <span className="text-xs hover-float">{player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-[10px]">
                        {player.upgradesPurchased}⚡ • {formatTimeAgo(player.lastActive)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="gradient-text font-mono font-bold text-sm tracking-wider">
                      {formatNumber(player.divinePoints)}
                    </div>
                    <div className="text-cyan-300 text-[10px] font-mono">
                      +{player.pointsPerSecond.toFixed(1)}/s
                    </div>
                  </div>
                </div>

                {/* Progress Bar with Animation */}
                {player.rank <= 3 && stats.maxDivinePoints > 0 && (
                  <div className="mt-1.5">
                    <div className="progress-bar w-full bg-gray-700/50 rounded-full h-0.5">
                      <div 
                        className={`h-0.5 rounded-full transition-all duration-1000 ${
                          player.rank === 1 ? 'bg-yellow-400' :
                          player.rank === 2 ? 'bg-gray-300' :
                          'bg-amber-600'
                        }`}
                        style={{ width: `${(player.divinePoints / stats.maxDivinePoints) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Last Updated with Shimmer Effect */}
      <div className="text-center text-gray-500 text-[10px] font-mono mt-2 shimmer">
        Updated: {new Date(leaderboardData.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}; 