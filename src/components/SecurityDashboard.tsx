// import React, { useState, useEffect } from 'react';
// import { getSecurityStats } from '@/lib/gameSecurity';
// import { getUpgradePurchaseHistory } from '@/lib/upgradeValidation';
// import { getOfflineProgressHistory } from '@/lib/offlineValidation';

// interface SecurityStats {
//   totalUsers: number;
//   bannedUsers: number;
//   suspiciousEvents: number;
//   cheatEvents: number;
//   totalSecurityEvents: number;
//   recentEvents: any[];
// }

// export const SecurityDashboard: React.FC = () => {
//   const [stats, setStats] = useState<SecurityStats | null>(null);
//   const [selectedUserId, setSelectedUserId] = useState<string>('');
//   const [upgradeHistory, setUpgradeHistory] = useState<any[]>([]);
//   const [offlineHistory, setOfflineHistory] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

//   // Load security statistics
//   const loadSecurityStats = async () => {
//     try {
//       const securityStats = getSecurityStats();
//       setStats(securityStats);
//     } catch (error) {
//       console.error('Error loading security stats:', error);
//     }
//   };

//   // Load user-specific data
//   const loadUserData = async (userId: string) => {
//     if (!userId) return;
    
//     setIsLoading(true);
//     try {
//       const upgradeHistoryData = getUpgradePurchaseHistory(userId);
//       const offlineHistoryData = getOfflineProgressHistory(userId);
      
//       setUpgradeHistory(upgradeHistoryData);
//       setOfflineHistory(offlineHistoryData);
//     } catch (error) {
//       console.error('Error loading user data:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Auto-refresh security stats
//   useEffect(() => {
//     loadSecurityStats();
    
//     const interval = setInterval(loadSecurityStats, 30000); // Refresh every 30 seconds
//     setRefreshInterval(interval);
    
//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, []);

//   // Load user data when selected user changes
//   useEffect(() => {
//     if (selectedUserId) {
//       loadUserData(selectedUserId);
//     }
//   }, [selectedUserId]);

//   const formatTimestamp = (timestamp: number) => {
//     return new Date(timestamp).toLocaleString();
//   };

//   const formatDuration = (milliseconds: number) => {
//     const hours = Math.floor(milliseconds / (1000 * 60 * 60));
//     const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
//     return `${hours}h ${minutes}m`;
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-red-400 mb-2">🔒 Security Dashboard</h1>
//           <p className="text-gray-400">Monitor and manage game security</p>
//         </div>

//         {/* Security Statistics */}
//         {stats && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//             <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//               <div className="flex items-center">
//                 <div className="p-2 bg-blue-500 rounded-lg">
//                   <span className="text-2xl">👥</span>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm text-gray-400">Total Users</p>
//                   <p className="text-2xl font-bold">{stats.totalUsers}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//               <div className="flex items-center">
//                 <div className="p-2 bg-red-500 rounded-lg">
//                   <span className="text-2xl">🚫</span>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm text-gray-400">Banned Users</p>
//                   <p className="text-2xl font-bold text-red-400">{stats.bannedUsers}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//               <div className="flex items-center">
//                 <div className="p-2 bg-yellow-500 rounded-lg">
//                   <span className="text-2xl">⚠️</span>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm text-gray-400">Suspicious Events</p>
//                   <p className="text-2xl font-bold text-yellow-400">{stats.suspiciousEvents}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//               <div className="flex items-center">
//                 <div className="p-2 bg-red-600 rounded-lg">
//                   <span className="text-2xl">🕵️</span>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm text-gray-400">Cheat Events</p>
//                   <p className="text-2xl font-bold text-red-500">{stats.cheatEvents}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Recent Security Events */}
//         {stats && stats.recentEvents.length > 0 && (
//           <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
//             <h2 className="text-xl font-bold mb-4">🚨 Recent Security Events</h2>
//             <div className="space-y-3">
//               {stats.recentEvents.map((event, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
//                   <div className="flex items-center space-x-3">
//                     <span className={`px-2 py-1 rounded text-xs font-bold ${
//                       event.eventType === 'ban' ? 'bg-red-600' :
//                       event.eventType === 'cheat_detected' ? 'bg-red-500' :
//                       event.eventType === 'suspicious' ? 'bg-yellow-600' :
//                       'bg-blue-600'
//                     }`}>
//                       {event.eventType.toUpperCase()}
//                     </span>
//                     <span className="text-sm text-gray-300">User: {event.userId}</span>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-sm text-gray-400">{event.details}</p>
//                     <p className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* User Investigation */}
//         <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//           <h2 className="text-xl font-bold mb-4">🔍 User Investigation</h2>
          
//           <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-400 mb-2">
//               User ID
//             </label>
//             <div className="flex space-x-2">
//               <input
//                 type="text"
//                 value={selectedUserId}
//                 onChange={(e) => setSelectedUserId(e.target.value)}
//                 placeholder="Enter user ID to investigate"
//                 className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
//               />
//               <button
//                 onClick={() => loadUserData(selectedUserId)}
//                 disabled={!selectedUserId || isLoading}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isLoading ? 'Loading...' : 'Investigate'}
//               </button>
//             </div>
//           </div>

//           {/* User Data Results */}
//           {selectedUserId && (upgradeHistory.length > 0 || offlineHistory.length > 0) && (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Upgrade History */}
//               {upgradeHistory.length > 0 && (
//                 <div>
//                   <h3 className="text-lg font-semibold mb-3">🛠️ Upgrade History</h3>
//                   <div className="space-y-2 max-h-64 overflow-y-auto">
//                     {upgradeHistory.slice(-10).map((purchase, index) => (
//                       <div key={index} className="p-3 bg-gray-700 rounded text-sm">
//                         <div className="flex justify-between items-center">
//                           <span className="font-medium">{purchase.upgradeId}</span>
//                           <span className="text-gray-400">
//                             {purchase.currentLevel} → {purchase.newLevel}
//                           </span>
//                         </div>
//                         <div className="flex justify-between text-xs text-gray-400 mt-1">
//                           <span>Cost: {purchase.cost.toLocaleString()}</span>
//                           <span>{formatTimestamp(purchase.timestamp)}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Offline Progress History */}
//               {offlineHistory.length > 0 && (
//                 <div>
//                   <h3 className="text-lg font-semibold mb-3">⏰ Offline Progress History</h3>
//                   <div className="space-y-2 max-h-64 overflow-y-auto">
//                     {offlineHistory.slice(-10).map((progress, index) => (
//                       <div key={index} className="p-3 bg-gray-700 rounded text-sm">
//                         <div className="flex justify-between items-center">
//                           <span className="font-medium">Offline Time</span>
//                           <span className="text-gray-400">
//                             {formatDuration(progress.offlineTime)}
//                           </span>
//                         </div>
//                         <div className="flex justify-between text-xs text-gray-400 mt-1">
//                           <span>Reward: {progress.calculatedReward.toLocaleString()}</span>
//                           <span>{formatTimestamp(progress.timestamp)}</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {selectedUserId && upgradeHistory.length === 0 && offlineHistory.length === 0 && !isLoading && (
//             <div className="text-center py-8 text-gray-400">
//               <p>No data found for user {selectedUserId}</p>
//             </div>
//           )}
//         </div>

//         {/* Security Actions */}
//         <div className="bg-gray-800 rounded-lg p-6 mt-8 border border-gray-700">
//           <h2 className="text-xl font-bold mb-4">⚡ Security Actions</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <button className="p-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
//               🚫 Ban User
//             </button>
//             <button className="p-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
//               ⚠️ Flag Suspicious
//             </button>
//             <button className="p-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
//               ✅ Clear Flag
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }; 