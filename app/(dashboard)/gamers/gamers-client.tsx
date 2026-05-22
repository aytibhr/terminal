'use client';

import { useState, useMemo } from 'react';
import { 
  Users, Search, Gamepad2, Clock, Monitor, CupSoda, SortAsc, User, Award, Flame
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CompletedSession {
  id: number;
  durationMinutes: number;
  userPhone: string | null;
  customerName: string | null;
  stationName: string | null;
  stationType: string | null;
}

interface SessionAddon {
  sessionId: number;
  addonName: string | null;
  quantity: number;
}

interface GamersClientProps {
  completedSessions: CompletedSession[];
  sessionAddons: SessionAddon[];
}

export function GamersClient({ completedSessions, sessionAddons }: GamersClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'sessions' | 'hours' | 'name'>('sessions');

  // In-memory data aggregation and analytics engine
  const gamers = useMemo(() => {
    const gamersMap = new Map<string, any>();

    // 1. Group completed sessions by phone number
    completedSessions.forEach(session => {
      // Group by phone. If none, fallback to 'Walk-In'.
      const phone = session.userPhone || 'Walk-In';
      const name = session.customerName || 'Gamer';

      if (!gamersMap.has(phone)) {
        gamersMap.set(phone, {
          phone,
          name: name,
          totalSessions: 0,
          totalMinutes: 0,
          stationCounts: {} as Record<string, number>,
          addonCounts: {} as Record<string, number>,
        });
      }

      const gamer = gamersMap.get(phone)!;
      
      // Update name to keep the latest non-default name
      if (name !== 'Gamer' && name.trim() !== '') {
        gamer.name = name;
      }
      
      gamer.totalSessions += 1;
      gamer.totalMinutes += (session.durationMinutes || 0);

      // Aggregate station occurrences
      const sName = session.stationName;
      if (sName) {
        gamer.stationCounts[sName] = (gamer.stationCounts[sName] || 0) + 1;
      }
    });

    // 2. Aggregate snacks/addons grouped by gamer phone number
    sessionAddons.forEach(addon => {
      const session = completedSessions.find(s => s.id === addon.sessionId);
      if (session) {
        const phone = session.userPhone || 'Walk-In';
        const gamer = gamersMap.get(phone);
        if (gamer && addon.addonName) {
          gamer.addonCounts[addon.addonName] = (gamer.addonCounts[addon.addonName] || 0) + (addon.quantity || 0);
        }
      }
    });

    // 3. Transform map into structured Gamer stats
    return Array.from(gamersMap.values()).map(gamer => {
      // Find favorite station
      let favoriteStation = 'None';
      let maxStationCount = 0;
      Object.entries(gamer.stationCounts).forEach(([sName, count]) => {
        if ((count as number) > maxStationCount) {
          maxStationCount = count as number;
          favoriteStation = sName;
        }
      });

      // Find favorite snack
      let favoriteSnack = 'None';
      let maxSnackCount = 0;
      Object.entries(gamer.addonCounts).forEach(([addonName, count]) => {
        if ((count as number) > maxSnackCount) {
          maxSnackCount = count as number;
          favoriteSnack = addonName;
        }
      });

      return {
        phone: gamer.phone,
        name: gamer.name,
        totalSessions: gamer.totalSessions,
        totalHours: parseFloat((gamer.totalMinutes / 60).toFixed(1)),
        favoriteStation,
        favoriteSnack,
      };
    });
  }, [completedSessions, sessionAddons]);

  // Overall metrics for top cards
  const stats = useMemo(() => {
    const totalGamers = gamers.length;
    const totalHours = gamers.reduce((sum, g) => sum + g.totalHours, 0);

    // Compute absolute most popular station across all sessions
    const stationPopularity: Record<string, number> = {};
    completedSessions.forEach(s => {
      if (s.stationName) {
        stationPopularity[s.stationName] = (stationPopularity[s.stationName] || 0) + 1;
      }
    });
    let topStation = 'None';
    let maxSCount = 0;
    Object.entries(stationPopularity).forEach(([sName, count]) => {
      if (count > maxSCount) {
        maxSCount = count;
        topStation = sName;
      }
    });

    return {
      totalGamers,
      totalHours: parseFloat(totalHours.toFixed(1)),
      topStation,
    };
  }, [gamers, completedSessions]);

  // Filtering and Sorting
  const filteredAndSortedGamers = useMemo(() => {
    return gamers
      .filter(gamer => {
        const query = searchQuery.toLowerCase();
        return (
          gamer.name.toLowerCase().includes(query) ||
          gamer.phone.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'sessions') {
          return b.totalSessions - a.totalSessions;
        } else if (sortBy === 'hours') {
          return b.totalHours - a.totalHours;
        } else {
          return a.name.localeCompare(b.name);
        }
      });
  }, [gamers, searchQuery, sortBy]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen pb-24 md:pb-8">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-orbitron text-2xl md:text-3xl text-white font-black tracking-wider flex items-center gap-2">
            <Users className="w-7 h-7 text-[#00f3ff] animate-pulse" /> GAMERS DATABASE
          </h1>
          <p className="text-gray-400 font-mono text-xs md:text-sm mt-1">
            Lifetime analytics and profiles of gamers who checked out at Terminal 8.
          </p>
        </div>
      </div>

      {/* ─── Stats Overview ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-[#0a0a1a]/60 border border-gray-800 rounded-xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f3ff]/5 rounded-full blur-2xl group-hover:bg-[#00f3ff]/10 transition-all duration-300" />
          <div className="space-y-1.5 z-10">
            <p className="text-[10px] font-pixel text-gray-500 tracking-wider">TOTAL ACTIVE GAMERS</p>
            <h3 className="font-orbitron text-2xl font-black text-white">{stats.totalGamers}</h3>
            <p className="text-[9px] text-[#00f3ff] font-mono">Unique customer profiles</p>
          </div>
          <Users className="w-8 h-8 text-[#00f3ff]/40 z-10 shrink-0" />
        </div>

        {/* Stat Card 2 */}
        <div className="bg-[#0a0a1a]/60 border border-gray-800 rounded-xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff00ea]/5 rounded-full blur-2xl group-hover:bg-[#ff00ea]/10 transition-all duration-300" />
          <div className="space-y-1.5 z-10">
            <p className="text-[10px] font-pixel text-gray-500 tracking-wider">COMBINED PLAYTIME</p>
            <h3 className="font-orbitron text-2xl font-black text-white">{stats.totalHours} <span className="text-xs text-gray-400">HRS</span></h3>
            <p className="text-[9px] text-[#ff00ea] font-mono">Total gaming hours logged</p>
          </div>
          <Clock className="w-8 h-8 text-[#ff00ea]/40 z-10 shrink-0" />
        </div>

        {/* Stat Card 3 */}
        <div className="bg-[#0a0a1a]/60 border border-gray-800 rounded-xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffea00]/5 rounded-full blur-2xl group-hover:bg-[#ffea00]/10 transition-all duration-300" />
          <div className="space-y-1.5 z-10">
            <p className="text-[10px] font-pixel text-gray-500 tracking-wider">MOST POPULAR STATION</p>
            <h3 className="font-orbitron text-base md:text-lg font-black text-[#ffea00] uppercase truncate max-w-[200px]">{stats.topStation}</h3>
            <p className="text-[9px] text-gray-400 font-mono">Most frequented playground</p>
          </div>
          <Flame className="w-8 h-8 text-[#ffea00]/40 z-10 shrink-0" />
        </div>
      </div>

      {/* ─── Search & Sort Bar ─── */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0a0a1a]/40 border border-gray-850 p-4 rounded-xl backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search gamers by name or phone..."
            className="pl-10 bg-[#0a0a1a] border-gray-800 text-white font-mono text-sm placeholder-gray-600 focus-visible:border-[#00f3ff] focus-visible:ring-1 focus-visible:ring-[#00f3ff] h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-pixel text-gray-500 flex items-center gap-1"><SortAsc className="w-3.5 h-3.5" /> SORT:</span>
          <div className="flex bg-[#0a0a1a] border border-gray-800 rounded p-0.5">
            {[
              { id: 'sessions', label: 'Sessions' },
              { id: 'hours', label: 'Play Hours' },
              { id: 'name', label: 'Name (A-Z)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id as any)}
                className={`px-3 py-1.5 rounded text-xs font-pixel transition-colors ${
                  sortBy === tab.id 
                    ? 'bg-[#00f3ff] text-black font-bold shadow-[0_0_10px_rgba(0,243,255,0.3)]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Gamers Responsive Grid ─── */}
      {filteredAndSortedGamers.length === 0 ? (
        <div className="text-center py-16 bg-[#0a0a1a]/30 border border-gray-850 rounded-xl space-y-2">
          <Users className="w-12 h-12 text-gray-700 mx-auto" />
          <p className="text-gray-400 font-mono text-sm">No gamers match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedGamers.map((gamer, idx) => {
            const hasPhone = gamer.phone !== 'Walk-In' && gamer.phone !== 'N/A';
            const colors = [
              'border-[#00f3ff]/30 shadow-[0_0_15px_rgba(0,243,255,0.03)] focus-within:border-[#00f3ff]',
              'border-[#ff00ea]/30 shadow-[0_0_15px_rgba(255,0,234,0.03)] focus-within:border-[#ff00ea]',
              'border-[#ffea00]/30 shadow-[0_0_15px_rgba(255,234,0,0.03)] focus-within:border-[#ffea00]',
            ];
            const borderTheme = colors[idx % colors.length];

            return (
              <div 
                key={gamer.phone} 
                className={`bg-[#0a0a1a]/85 border rounded-xl p-5 space-y-4 hover:-translate-y-1 transition-all duration-300 hover:bg-[#0f1026]/90 ${borderTheme}`}
              >
                {/* Gamer Basic Profile */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#0f1026] border border-gray-800 flex items-center justify-center text-[#00f3ff] font-pixel text-sm shrink-0 shadow-[inset_0_0_10px_rgba(0,243,255,0.1)]">
                    {gamer.name !== 'Gamer' ? getInitials(gamer.name) : <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-orbitron font-black text-white text-base truncate leading-snug tracking-wide uppercase">
                      {gamer.name}
                    </h4>
                    <p className={`font-mono text-xs truncate ${hasPhone ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>
                      {gamer.phone}
                    </p>
                  </div>
                </div>

                {/* Gamer Aggregate Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-900 py-3.5">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 font-pixel flex items-center gap-1 uppercase">
                      <Gamepad2 className="w-3.5 h-3.5 text-[#00f3ff]" /> Sessions
                    </p>
                    <p className="font-mono text-sm text-white font-bold pl-4.5">
                      {gamer.totalSessions} {gamer.totalSessions === 1 ? 'session' : 'sessions'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 font-pixel flex items-center gap-1 uppercase">
                      <Clock className="w-3.5 h-3.5 text-[#ff00ea]" /> Played Time
                    </p>
                    <p className="font-mono text-sm text-white font-bold pl-4.5">
                      {gamer.totalHours} {gamer.totalHours === 1 ? 'hour' : 'hours'}
                    </p>
                  </div>
                </div>

                {/* Favourites Panel */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-gray-500 font-pixel flex items-center gap-1 uppercase">
                      <Monitor className="w-3.5 h-3.5 text-[#ffea00]" /> Fav Station:
                    </span>
                    <span className="font-mono text-white text-[11px] font-bold uppercase truncate max-w-[150px]" title={gamer.favoriteStation}>
                      {gamer.favoriteStation}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-gray-500 font-pixel flex items-center gap-1 uppercase">
                      <CupSoda className="w-3.5 h-3.5 text-[#00ff55]" /> Fav Snack:
                    </span>
                    <span className="font-mono text-[#00ff55] text-[11px] font-bold truncate max-w-[150px]" title={gamer.favoriteSnack}>
                      {gamer.favoriteSnack}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
