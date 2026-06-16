import React from "react";
import { initialMatches, mockGoalScorersPool } from "./data/mockMatches";
import { Match, GoalEvent, TimelineEvent, CommentaryTrack, StandingRow } from "./types";
import Header from "./components/Header";
import MatchesSlider from "./components/MatchesSlider";
import NetflixHero from "./components/NetflixHero";
import LiveStreamModal from "./components/LiveStreamModal";
import HapticGoalAlert from "./components/HapticGoalAlert";
import LoginScreen from "./components/LoginScreen";
import AdminPanel from "./components/AdminPanel";
import StatsDashboard from "./components/StatsDashboard";
import { onAuthStateChanged, getRedirectResult, User } from "firebase/auth";
import { onSnapshot, collection, doc } from "firebase/firestore";
import { auth, db, seedInitialMatchesIfEmpty, logoutUser, checkUserIsAdmin } from "./lib/firebase";
import { Award, Radio, Tv, BarChart2, Trophy, Sliders, Calendar, Globe, Play, User as UserIcon, LogOut, Sun, Moon, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [darkMode, setDarkMode] = React.useState<boolean>(true);
  const [activeTab, setActiveTab] = React.useState<string>("matches");
  const [matches, setMatches] = React.useState<Match[]>(initialMatches);
  const [dbStandings, setDbStandings] = React.useState<StandingRow[]>([]);
  const [selectedMatchId, setSelectedMatchId] = React.useState<string>("match-1");
  const [isStreamOpen, setIsStreamOpen] = React.useState<boolean>(false);
  const [streamMatch, setStreamMatch] = React.useState<Match | null>(null);
  const [streamPlaybackMode, setStreamPlaybackMode] = React.useState<"live" | "highlights">("live");
  const [isIntroOpen, setIsIntroOpen] = React.useState<boolean>(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroOpen(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);
  
  // Auth states
  const [user, setUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false);
  const [isGuest, setIsGuest] = React.useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = React.useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = React.useState<boolean>(false);

  // Global Config loaded from settings doc
  const [settingsConfig, setSettingsConfig] = React.useState<{
    activeMatchId: string;
    streamUrl: string;
    drmKey: string;
    activeCommentaryCode: string;
    resolution: string;
    resolutions: string[];
    languages: string[];
    commentaryTracks?: CommentaryTrack[];
  } | null>({
    activeMatchId: "match-1",
    streamUrl: "https://qp-pldt-live-bpk-ucd-prod.akamaized.net/bpk-tv/ch299/default/index.mpd",
    drmKey: "549ab7cd35a64bb6bb479ecead04d69d:829799ed534d11fcadeb4b192467e050",
    activeCommentaryCode: "en",
    resolution: "Auto",
    resolutions: ["Auto", "1080p", "720p", "480p"],
    languages: ["en"]
  });

  // Goal celebration modal state
  const [goalAlert, setGoalAlert] = React.useState<{
    isOpen: boolean;
    teamCode: string;
    teamFlag: string;
    opponentCode: string;
    scorer: string;
    minute: number;
  }>({
    isOpen: false,
    teamCode: "",
    teamFlag: "",
    opponentCode: "",
    scorer: "",
    minute: 0
  });

  // Score comparison trackers for multiplayer alerts syncing
  const previousScoresRef = React.useRef<{ [key: string]: { home: number; away: number } }>({});
  const isStreamOpenRef = React.useRef<boolean>(false);

  // Synchronize Ref values to bypass stale closure scopes inside listeners
  React.useEffect(() => {
    isStreamOpenRef.current = isStreamOpen;
  }, [isStreamOpen]);

  // Recent in-app commentary toast banner
  const [liveToast, setLiveToast] = React.useState<{ msg: string; min: number; flag: string } | null>(null);

  // Retrieve today's and tomorrow's matches visible to regular users, excluding finished ones (which are edited/played as highlights)
  const visibleMatches = React.useMemo(() => {
    return matches.filter((m) => (m.date === "2026-06-13" || m.date === "2026-06-14") && m.status !== "FINISHED");
  }, [matches]);

  // Retrieve active selected match
  const activeMatch = matches.find((m) => m.id === selectedMatchId) || visibleMatches[0] || matches[0];

  // Dynamically compute authentic table standings from real Firestore matches data!
  const standings = React.useMemo(() => {
    const teamsData: Record<string, { name: string; code: string; flag: string; gp: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }> = {
      BRA: { name: "Brazil", code: "BRA", flag: "🇧🇷", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      MAR: { name: "Morocco", code: "MAR", flag: "🇲🇦", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      URU: { name: "Uruguay", code: "URU", flag: "🇺🇾", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      FRA: { name: "France", code: "FRA", flag: "🇫🇷", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      ARG: { name: "Argentina", code: "ARG", flag: "🇦🇷", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
      POR: { name: "Portugal", code: "POR", flag: "🇵🇹", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
    };

    matches.forEach((m) => {
      const home = m.homeTeam.code;
      const away = m.awayTeam.code;
      if (!teamsData[home] || !teamsData[away]) return;

      if (m.status === "FINISHED" || m.status === "LIVE") {
        teamsData[home].gp += 1;
        teamsData[away].gp += 1;
        teamsData[home].gf += m.homeScore;
        teamsData[home].ga += m.awayScore;
        teamsData[away].gf += m.awayScore;
        teamsData[away].ga += m.homeScore;

        if (m.homeScore > m.awayScore) {
          teamsData[home].w += 1;
          teamsData[home].pts += 3;
          teamsData[away].l += 1;
        } else if (m.homeScore < m.awayScore) {
          teamsData[away].w += 1;
          teamsData[away].pts += 3;
          teamsData[home].l += 1;
        } else {
          teamsData[home].d += 1;
          teamsData[home].pts += 1;
          teamsData[away].d += 1;
          teamsData[away].pts += 1;
        }
      }
    });

    return Object.values(teamsData).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });
  }, [matches]);

  const finalStandings = React.useMemo(() => {
    if (dbStandings && dbStandings.length > 0) {
      return [...dbStandings].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const gdA = a.gf - a.ga;
        const gdB = b.gf - b.ga;
        if (gdB !== gdA) return gdB - gdA;
        return b.gf - a.gf;
      });
    }
    return standings;
  }, [dbStandings, standings]);

  // Dynamic light/dark class synchronization
  React.useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle Firebase auth checking
  React.useEffect(() => {
    // Process redirect results for WebView compatibility (Android/iOS APK wrapper)
    getRedirectResult(auth)
      .then((credentials) => {
        if (credentials?.user) {
          setUser(credentials.user);
        }
      })
      .catch((err) => {
        console.error("Redirect login resolution error:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminPrivilege = await checkUserIsAdmin(currentUser.uid, currentUser.email);
        setIsAdmin(adminPrivilege);
        setIsGuest(false);
        if (adminPrivilege) {
          try {
            await seedInitialMatchesIfEmpty();
          } catch (e) {
            console.error("Failed to seed initial matches as admin", e);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Connect real-time Firestore synchronization for score updates
  React.useEffect(() => {
    // Listen to Matches collection
    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
      const dbMatches: Match[] = [];
      snapshot.forEach((doc) => {
        dbMatches.push(doc.data() as Match);
      });
      // Precise alphabetical sorting for unified user lists
      dbMatches.sort((a, b) => a.id.localeCompare(b.id));
      setMatches(dbMatches);
    }, (err) => {
      console.warn("Firestore matches subscriber permission alert: ", err);
    });

    // Listen to active configuration settings mapping (DRM URLs and keys)
    const unsubConfig = onSnapshot(doc(db, "settings", "config"), (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        setSettingsConfig({
          activeMatchId: d.activeMatchId || "match-1",
          streamUrl: d.streamUrl || "",
          drmKey: d.drmKey || "",
          activeCommentaryCode: d.activeCommentaryCode || "en",
          resolution: d.resolution || "Auto",
          resolutions: d.resolutions || ["Auto", "1080p", "720p", "480p"],
          languages: d.languages || ["en"],
          commentaryTracks: d.commentaryTracks || []
        });
      }
    }, (err) => {
      console.warn("Firestore settings configurations read issue: ", err);
    });

    // Listen to standings collection
    const unsubStandings = onSnapshot(collection(db, "standings"), (snapshot) => {
      const dbRows: StandingRow[] = [];
      snapshot.forEach((doc) => {
        dbRows.push(doc.data() as StandingRow);
      });
      setDbStandings(dbRows);
    }, (err) => {
      console.warn("Firestore standings subscriber permission alert: ", err);
    });

    return () => {
      unsubMatches();
      unsubConfig();
      unsubStandings();
    };
  }, []);

  // Real-time delta tracker to highlight goal scoring celebrations
  React.useEffect(() => {
    if (matches.length === 0) return;

    // Build baseline metrics on first sync
    if (Object.keys(previousScoresRef.current).length === 0) {
      matches.forEach((m) => {
        previousScoresRef.current[m.id] = { home: m.homeScore, away: m.awayScore };
      });
      return;
    }

    matches.forEach((m) => {
      const prev = previousScoresRef.current[m.id];
      if (prev) {
        let isGoal = false;
        let scoringTeam = null;
        let oppTeam = null;

        if (m.homeScore > prev.home) {
          isGoal = true;
          scoringTeam = m.homeTeam;
          oppTeam = m.awayTeam;
        } else if (m.awayScore > prev.away) {
          isGoal = true;
          scoringTeam = m.awayTeam;
          oppTeam = m.homeTeam;
        }

        if (isGoal && scoringTeam && oppTeam) {
          // Identify scorer profile detail
          const lastGoal = m.goals && m.goals.length > 0 ? m.goals[m.goals.length - 1] : null;
          const scorerName = lastGoal?.player || "Broadcaster Strike Team";

          // "the goal notification only show when user in home screen only"
          // We check our live stream ref to ensure they are on the home cockpit dashboard
          if (!isStreamOpenRef.current) {
            setGoalAlert({
              isOpen: true,
              teamCode: scoringTeam.code,
              teamFlag: scoringTeam.flag,
              opponentCode: oppTeam.code,
              scorer: scorerName,
              minute: m.minute
            });

            setLiveToast({
              msg: `⚽ GOOOOOAL! ${scoringTeam.flag} ${scorerName} puts it in! (${m.homeScore} - ${m.awayScore})`,
              min: m.minute,
              flag: scoringTeam.flag
            });
          }
        }
      }
      // Archive values as baseline mapping
      previousScoresRef.current[m.id] = { home: m.homeScore, away: m.awayScore };
    });
  }, [matches]);

  // Erase Telemetry commentator toast after few seconds
  React.useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => {
        setLiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [liveToast]);

  const handleGoalScored = (teamCode: string, isFromUserClick?: boolean) => {
    // If Admin triggers simulated goal, it updates in the local model helper
    console.log(`Action Goal Trigger received for team: ${teamCode}`);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState<boolean>(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  // Count active live fixtures
  const liveCount = matches.filter((m) => m.status === "LIVE").length;

  if (isIntroOpen) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center overflow-hidden select-none relative font-sans">
        {/* Animated background stars & lighting flares */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.12)_0%,transparent_70%)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/5 rounded-full filter blur-[80px]"></div>

        {/* CSS 3D perspectives Stage wrapper */}
        <motion.div 
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="perspective-1000 flex flex-col items-center z-10"
        >
          {/* Main 3D spinning Card */}
          <div className="preserve-3d animate-float-glow w-56 h-72 rounded-2xl bg-gradient-to-br from-amber-400 via-teal-400 to-amber-500 p-[1.5px] shadow-[0_20px_50px_rgba(20,184,166,0.3)] relative">
            <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-[#0f172a] via-[#020617] to-[#0f172a] flex flex-col justify-between p-5 items-center overflow-hidden">
              
              {/* Card Hologram line pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(251,191,36,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-pulse"></div>
              
              {/* Header inside Card */}
              <div className="flex justify-between w-full items-center text-[10px] uppercase font-mono tracking-widest text-[#f59e0b] font-black">
                <span>FIFA 2026</span>
                <span>GLOBAL STREAM</span>
              </div>
              
              {/* 3D Gold Emblem */}
              <div className="relative w-28 h-28 my-2 preserve-3d animate-spin-3d flex items-center justify-center">
                {/* Gold reflective coin circle */}
                <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border border-amber-200/40 shadow-inner flex items-center justify-center preserve-3d">
                  <span className="text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] select-none">🏆</span>
                </div>
                {/* Glowing ring */}
                <div className="absolute inset-x-0 -inset-y-2 rounded-full border border-teal-400/35 animate-ping opacity-60"></div>
              </div>

              {/* Card Bottom Meta details */}
              <div className="text-center space-y-1 z-10">
                <h2 className="text-base font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-white to-amber-200 tracking-tight uppercase">
                  FIFA TV LIVE
                </h2>
                <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono text-neutral-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="font-semibold tracking-wider text-teal-300">STREAM ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive loading tag */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-col items-center gap-2 text-center"
          >
            <span className="text-[11px] font-mono font-black text-[#f59e0b] tracking-widest uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-650 animate-pulse"></span>
              CONNECTING SATELLITE...
            </span>
            <div className="w-48 h-[2px] bg-neutral-800 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-teal-400 font-mono text-xs uppercase tracking-widest select-none">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full"></span>
          <span>Initiating satellite transceiver interface...</span>
        </div>
      </div>
    );
  }

  // Display authentication shield first if not signed in
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={(u) => setUser(u)}
      />
    );
  }

  const homeColor = activeMatch?.homeTeam?.color || "#14b8a6";
  const awayColor = activeMatch?.awayTeam?.color || "#06b6d4";
  const dynamicBackgroundStyle = activeMatch
    ? {
        background: darkMode
          ? `radial-gradient(circle at 50% -200px, ${homeColor}22 0%, ${awayColor}0d 50%, #030712 100%)`
          : `radial-gradient(circle at 50% -200px, ${homeColor}0f 0%, ${awayColor}05 50%, #f8fafc 100%)`
      }
    : undefined;

  return (
    <div 
      style={dynamicBackgroundStyle}
      className={`min-h-screen transition-all duration-300 pb-20 ${
        darkMode ? "bg-mesh-dark text-white" : "bg-mesh-light text-neutral-800"
      }`}
    >
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {activeTab === "matches" && (
              <>
                {/* Horizontal World Cup Fixtures Scroller Carousel */}
                {visibleMatches.length > 0 && (
                  <MatchesSlider
                    matches={visibleMatches}
                    selectedMatchId={selectedMatchId}
                    onSelectMatch={(matchId) => {
                      setSelectedMatchId(matchId);
                      setLiveToast(null); // Clear toast
                    }}
                  />
                )}

                {/* Cinematic Netflix scoreboard Banner */}
                {activeMatch ? (
                  <NetflixHero
                    match={activeMatch}
                    onOpenStream={() => {
                      setStreamMatch(activeMatch);
                      setStreamPlaybackMode("live");
                      setIsStreamOpen(true);
                    }}
                    matches={visibleMatches}
                    onSelectMatch={(matchId) => {
                      setSelectedMatchId(matchId);
                      setLiveToast(null);
                    }}
                  />
                ) : (
                  <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl text-center max-w-4xl mx-auto space-y-4 shadow-xl">
                    <div className="flex justify-center select-none">
                      <div className="p-4 rounded-full bg-white/5 border border-white/10 text-neutral-500 animate-pulse">
                        <Tv size={24} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-sans font-black text-xs uppercase tracking-wider text-neutral-300">Live Scoreboard Standby</h3>
                      <p className="text-[10px] text-neutral-400 max-w-md mx-auto">
                        No active live feeds registered. Re-seed matches automatically by clearing Firestore, or add/schedule custom live streams directly in the live Admin Panel.
                      </p>
                    </div>
                  </div>
                )}

                {/* Standings table displayed directly below live Hero section as requested */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false, margin: "-40px" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="pt-4 max-w-7xl mx-auto space-y-6"
                >
                  <div className="p-4 sm:p-6 rounded-3xl glass-panel space-y-4 border border-black/5 dark:border-white/10 shadow-xl bg-white/5 dark:bg-black/25">
                    <h4 className="font-display font-black text-xs uppercase text-neutral-900 dark:text-white flex items-center gap-2 select-none">
                      <Award size={14} className="text-teal-400" />
                      FIFA World Cup Real-Time Scoreboard standings
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] sm:text-xs font-sans">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/10 text-neutral-400 text-[9px] uppercase tracking-widest font-mono select-none">
                            <th className="py-2.5 font-bold">POS / TEAM</th>
                            <th className="py-2.5 font-bold text-center">GP</th>
                            <th className="py-2.5 font-bold text-center">W-D-L</th>
                            <th className="py-2.5 font-bold text-center">GD</th>
                            <th className="py-2.5 font-bold text-center">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 text-neutral-700 dark:text-neutral-200">
                          {finalStandings.map((row, idx) => {
                            const gd = row.gf - row.ga;
                            const gdStr = gd > 0 ? `+${gd}` : gd;
                            const isAssociated = activeMatch && (row.id === activeMatch.homeTeam?.code || row.id === activeMatch.awayTeam?.code);
                            return (
                              <tr
                                key={idx}
                                className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                                  isAssociated
                                    ? "bg-teal-500/10 hover:bg-teal-500/15"
                                    : ""
                                }`}
                              >
                                <td className="py-2.5 sm:py-3 font-bold flex items-center gap-2">
                                  <span className="text-neutral-400 w-3 text-center">{idx + 1}</span>
                                  <span>{row.flag} {row.name}</span>
                                </td>
                                <td className="py-2.5 sm:py-3 text-center font-mono">{row.gp}</td>
                                <td className="py-2.5 sm:py-3 text-center font-mono text-[10px] sm:text-xs">{`${row.w}-${row.d}-${row.l}`}</td>
                                <td className="py-2.5 sm:py-3 text-center font-mono text-teal-500">{gdStr}</td>
                                <td className="py-2.5 sm:py-3 text-center font-bold font-mono text-teal-400">{row.pts}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <p className="text-[9px] text-neutral-400 italic">
                      * Real-time automated calculations synced concurrently on goal events.
                    </p>
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === "highlights" && (
              <div className="pt-2 max-w-7xl mx-auto space-y-6">
                {/* Match Action Highlights Video Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <h4 className="font-display font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-[#f59e0b] flex items-center gap-2">
                      <Sparkles size={14} className="text-[#f59e0b]" />
                      Matchday Video Highlights
                    </h4>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase bg-black/20 px-2 py-0.5 rounded border border-white/5">
                      {matches.filter((m) => m.highlightsUrl).length} Clips Available
                    </span>
                  </div>

                  {matches.filter((m) => m.highlightsUrl).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {matches
                        .filter((m) => m.highlightsUrl)
                        .map((m) => {
                          const mainColor = m.homeTeam?.color || "#14b8a6";
                          return (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, y: 40, scale: 0.95 }}
                              whileInView={{ opacity: 1, y: 0, scale: 1 }}
                              viewport={{ once: false, margin: "-40px" }}
                              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
                              whileTap={{ scale: 0.98 }}
                              className="group cursor-pointer rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-white/5 dark:bg-black/30 shadow-lg flex flex-col relative"
                              onClick={() => {
                                setStreamMatch(m);
                                setStreamPlaybackMode("highlights");
                                setIsStreamOpen(true);
                              }}
                            >
                              {/* Thumbnail with Overlay Gradient */}
                              <div className="aspect-video w-full relative overflow-hidden bg-neutral-900">
                                <img
                                  src={m.highlightsThumbnailUrl || m.heroImage || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"}
                                  alt={m.homeTeam.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Dynamic gradient matching team colors adapted into thumbnail */}
                                <div 
                                  className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70"
                                  style={{
                                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, ${mainColor}20 100%)`
                                  }}
                                />
                                
                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="p-3 rounded-full bg-teal-500 text-neutral-900 shadow-lg scale-90 group-hover:scale-100 transition-all duration-300">
                                    <Play size={14} className="fill-neutral-900 stroke-none ml-0.5" />
                                  </div>
                                </div>

                                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 text-[8px] font-mono border border-white/10 uppercase font-bold text-rose-500">
                                  Highlight Video
                                </div>

                                {m.highlightsUploadTime && (
                                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-neutral-950/80 text-[8px] font-mono border border-white/10 uppercase font-bold text-[#f59e0b] flex items-center gap-1">
                                    <span>🕒 {m.highlightsUploadTime}</span>
                                  </div>
                                )}
                              </div>

                              {/* Content Details */}
                              <div className="p-4 flex-1 flex flex-col justify-between bg-black/10">
                                <div>
                                  <h5 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wide truncate">
                                    {m.homeTeam.flag} {m.homeTeam.name} vs {m.awayTeam.flag} {m.awayTeam.name}
                                  </h5>
                                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono uppercase">
                                    🏆 {m.group} • {m.date}
                                  </p>
                                </div>
                                
                                <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[8px] font-mono text-teal-400">
                                  <span>TAP TO PLAY CLIP</span>
                                  <span className="text-neutral-500">HD Decrypted</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center select-none text-neutral-500 text-[10px] font-mono uppercase">
                      No highlights registered. You can set a clip URL on any match in the admin panel to populate this list.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Live Commentary Toast Alert element positioned beautifully upwards to avoid bottom bar */}
        <AnimatePresence>
          {liveToast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 right-6 z-40 max-w-sm p-4 rounded-2xl glass-panel bg-neutral-900/95 dark:bg-[#030712]/95 border border-teal-500/30 shadow-2xl flex items-start gap-4 select-none"
            >
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mt-0.5">
                <Radio size={16} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-black text-teal-400 tracking-wider">
                    BROADCASTER REALTIME FEED
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">
                    min {liveToast.min}'
                  </span>
                </div>
                <p className="text-xs text-white mt-1.5 leading-relaxed font-sans font-semibold">
                  {liveToast.msg}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Navigation Bar (glassmorphism/visionOS inspired) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[500px] rounded-full p-1.5 bg-[#0e1726]/80 dark:bg-[#070b13]/85 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.65)] flex items-center justify-around gap-2 selection:bg-transparent">
        {[
          { id: "matches", label: "Matches", icon: Tv },
          { id: "highlights", label: "Highlights", icon: Sparkles }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Clear active toast notifications on tab navigation
                setLiveToast(null);
              }}
              className="relative py-2 px-3 sm:px-4 rounded-full flex flex-col items-center gap-1 cursor-pointer select-none outline-none group text-[9px] font-bold transition-all duration-300 flex-1"
            >
              {isActive && (
                <motion.div
                  layoutId="active-fluid-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="absolute inset-0 bg-white/10 dark:bg-white/[0.08] border border-white/15 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                />
              )}
              <tab.icon
                size={16}
                className={`relative z-10 transition-all duration-300 ${
                  isActive
                    ? "text-teal-400 scale-110 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                    : "text-neutral-400 dark:text-neutral-500 group-hover:text-white"
                }`}
              />
              <span
                className={`relative z-10 text-[8px] sm:text-[9.5px] font-bold tracking-wider uppercase transition-all duration-300 ${
                  isActive
                    ? "text-[#2dd4bf]"
                    : "text-neutral-400 dark:text-neutral-500 group-hover:text-white"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Vertical divider line */}
        <div className="w-[1px] h-6 bg-white/15 mx-1 flex-shrink-0" />

        {/* Action item buttons */}
        {isAdmin && (
          <button
            onClick={() => setIsAdminPanelOpen(true)}
            className="py-1 px-2.5 rounded-full flex flex-col items-center gap-1 cursor-pointer text-rose-400 hover:text-rose-300 select-none outline-none group text-[9px] font-bold transition-all duration-300"
            title="Launch Admin Scoreboard Panel"
          >
            <Sliders size={15} className="group-hover:scale-110 transition-transform text-rose-400" />
            <span className="text-[7.5px] sm:text-[8.5px] tracking-wider uppercase">Admin</span>
          </button>
        )}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="py-1 px-2.5 rounded-full flex flex-col items-center gap-1 cursor-pointer text-amber-400 hover:text-amber-300 select-none outline-none group text-[9px] font-bold transition-all duration-300"
          title="Toggle System Appearance"
        >
          {darkMode ? (
            <Sun size={15} className="group-hover:scale-110 transition-transform text-amber-400" />
          ) : (
            <Moon size={15} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-[7.5px] sm:text-[8.5px] tracking-wider uppercase text-neutral-400 group-hover:text-white">Theme</span>
        </button>

        {user ? (
          <button
            onClick={handleLogout}
            className="py-1 px-2.5 rounded-full flex flex-col items-center gap-1 cursor-pointer text-rose-500 hover:text-rose-400 select-none outline-none group text-[9px] font-bold transition-all duration-300"
            title="Immediate Sign Out"
          >
            <LogOut size={15} className="group-hover:scale-110 transition-transform" />
            <span className="text-[7.5px] sm:text-[8.5px] tracking-wider uppercase text-neutral-400 group-hover:text-white">Logout</span>
          </button>
        ) : (
          <button
            onClick={() => setIsGuest(false)}
            className="py-1 px-2.5 rounded-full flex flex-col items-center gap-1 cursor-pointer text-teal-400 hover:text-teal-300 select-none outline-none group text-[9px] font-bold transition-all duration-300"
          >
            <UserIcon size={15} className="group-hover:scale-110 transition-transform text-teal-400" />
            <span className="text-[7.5px] sm:text-[8.5px] tracking-wider uppercase text-neutral-400 group-hover:text-white">Login</span>
          </button>
        )}
      </div>

      {/* Interactive video live streaming viewport selection modal card */}
      {/* Interactive video live streaming viewport selection modal card */}
      {isStreamOpen && (streamMatch || activeMatch) && (
        <LiveStreamModal
          isOpen={isStreamOpen}
          onClose={() => {
            setIsStreamOpen(false);
            setStreamMatch(null);
          }}
          match={streamMatch || activeMatch!}
          forcePlaybackMode={streamPlaybackMode}
          onGoalScored={(teamCode, isFromUserClick) => handleGoalScored(teamCode, isFromUserClick)}
          settingsConfig={settingsConfig}
        />
      )}

      {/* Celebratory Goal full-screen haptic vibration alerting card */}
      <HapticGoalAlert
        isOpen={goalAlert.isOpen}
        onClose={() => setGoalAlert({ ...goalAlert, isOpen: false })}
        teamCode={goalAlert.teamCode}
        teamFlag={goalAlert.teamFlag}
        opponentCode={goalAlert.opponentCode}
        scorer={goalAlert.scorer}
        minute={goalAlert.minute}
      />

      {/* Custom Logout Confirmation Prompt Overlay */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm p-6 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl text-center space-y-5"
            >
              <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
                <LogOut size={22} />
              </div>
              
              <div className="space-y-1.5 animate-pulse">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Logout Confirmation
                </h3>
                <p className="text-xs text-neutral-400">
                  Are you sure you want to log out? Your active admin dashboard session will be terminated safely.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 text-xs font-mono font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsGuest(false);
                    await logoutUser();
                    setShowLogoutConfirm(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition cursor-pointer"
                >
                  OK (LOGOUT)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Administration panel panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        matches={matches}
        dbStandings={dbStandings}
        currentConfig={settingsConfig}
      />
    </div>
  );
}
