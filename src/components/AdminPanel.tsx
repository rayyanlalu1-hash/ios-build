import React from "react";
import { doc, setDoc, updateDoc, writeBatch, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Match, CommentaryTrack, StandingRow } from "../types";
import { X, Save, Plus, Trash2, Edit, AlertCircle, Sparkles, Check, Database, Trophy, Radio, Video, Film } from "lucide-react";
import { motion } from "motion/react";
import { saveVideoToDb, deleteVideoFromDb } from "../lib/videoDb";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  dbStandings: StandingRow[];
  currentConfig: {
    activeMatchId: string;
    streamUrl: string;
    drmKey: string;
    activeCommentaryCode: string;
    resolution: string;
    resolutions: string[];
    languages: string[];
    commentaryTracks?: CommentaryTrack[];
  } | null;
}

export default function AdminPanel({ isOpen, onClose, matches, dbStandings, currentConfig }: AdminPanelProps) {
  // Active settings configuration
  const [streamUrl, setStreamUrl] = React.useState<string>("");
  const [drmKey, setDrmKey] = React.useState<string>("");
  const [activeMatchId, setActiveMatchId] = React.useState<string>("");
  const [activeCommentaryCode, setActiveCommentaryCode] = React.useState<string>("");
  const [isEditingStream, setIsEditingStream] = React.useState<boolean>(false);
  const [activeAdminTab, setActiveAdminTab] = React.useState<"scores" | "addMatch" | "liveVideo" | "highlightsVideo" | "standings" | "commentary">("scores");
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const [matchHighlightsThumbnailUrl, setMatchHighlightsThumbnailUrl] = React.useState<string>("");
  const [matchHighlightsUploadTime, setMatchHighlightsUploadTime] = React.useState<string>("");
  const [matchLiveUploadTime, setMatchLiveUploadTime] = React.useState<string>("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // File upload additional states
  const [isDraggingLive, setIsDraggingLive] = React.useState<boolean>(false);
  const [isDraggingHighlight, setIsDraggingHighlight] = React.useState<boolean>(false);
  const [liveUploadProgress, setLiveUploadProgress] = React.useState<number | null>(null);
  const [highlightUploadProgress, setHighlightUploadProgress] = React.useState<number | null>(null);
  const [localLiveName, setLocalLiveName] = React.useState<string>("");
  const [localHighlightName, setLocalHighlightName] = React.useState<string>("");

  const handleLiveFileDrop = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showToast("Error: Only live video media files (.mp4, .webm, .mov) can be uploaded!");
      return;
    }
    setLocalLiveName(file.name);
    // Simulate high-speed progress upload
    setLiveUploadProgress(0);
    let prog = 0;
    const interval = setInterval(async () => {
      prog += 20;
      setLiveUploadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => setLiveUploadProgress(null), 850);
        
        try {
          await saveVideoToDb(`${selectedMatchId}_live`, file);
          setMatchStreamUrl("local://uploaded_live");
          showToast(`Successfully uploaded and saved Live Video to IndexedDB! File name: ${file.name}`);
        } catch (err) {
          console.error("IndexedDB store error:", err);
          showToast("Failed to write live video file locally.");
        }
      }
    }, 120);
  };

  const handleHighlightFileDrop = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showToast("Error: Only highlight video media files (.mp4, .webm, .mov) can be uploaded!");
      return;
    }
    setLocalHighlightName(file.name);
    // Simulate high-speed progress upload
    setHighlightUploadProgress(0);
    let prog = 0;
    const interval = setInterval(async () => {
      prog += 20;
      setHighlightUploadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => setHighlightUploadProgress(null), 850);
        
        try {
          await saveVideoToDb(`${selectedMatchId}_highlights`, file);
          setMatchHighlightsUrl("local://uploaded_highlights");
          showToast(`Successfully uploaded and saved Highlight Video to IndexedDB! File name: ${file.name}`);
        } catch (err) {
          console.error("IndexedDB store error:", err);
          showToast("Failed to write highlight video file locally.");
        }
      }
    }, 120);
  };

  // Selectable matches editor
  const [selectedMatchId, setSelectedMatchId] = React.useState<string>("");
  const [homeScore, setHomeScore] = React.useState<number>(0);
  const [awayScore, setAwayScore] = React.useState<number>(0);
  const [matchStatus, setMatchStatus] = React.useState<string>("LIVE");
  const [matchMinute, setMatchMinute] = React.useState<number>(0);
  const [groupName, setGroupName] = React.useState<string>("");
  const [stadiumName, setStadiumName] = React.useState<string>("");
  const [matchHeroImage, setMatchHeroImage] = React.useState<string>("");
  const [matchStreamUrl, setMatchStreamUrl] = React.useState<string>("");
  const [matchDrmKey, setMatchDrmKey] = React.useState<string>("");
  const [matchHighlightsUrl, setMatchHighlightsUrl] = React.useState<string>("");
  const [matchHighlightsDrmKey, setMatchHighlightsDrmKey] = React.useState<string>("");

  // Create Match Status and Poster Fields
  const [newMatchHeroImage, setNewMatchHeroImage] = React.useState<string>("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop");
  const [newMatchStatus, setNewMatchStatus] = React.useState<string>("SCHEDULED");

  // Standing Management State Fields
  const [standId, setStandId] = React.useState<string>("");
  const [standName, setStandName] = React.useState<string>("");
  const [standFlag, setStandFlag] = React.useState<string>("⚽");
  const [standGp, setStandGp] = React.useState<number>(0);
  const [standW, setStandW] = React.useState<number>(0);
  const [standD, setStandD] = React.useState<number>(0);
  const [standL, setStandL] = React.useState<number>(0);
  const [standGf, setStandGf] = React.useState<number>(0);
  const [standGa, setStandGa] = React.useState<number>(0);
  const [standPts, setStandPts] = React.useState<number>(0);

  // Commentary additions
  const [newLangCode, setNewLangCode] = React.useState<string>("");
  const [newLangName, setNewLangName] = React.useState<string>("");
  const [newLangFlag, setNewLangFlag] = React.useState<string>("🎙️");
  const [newLangChannel, setNewLangChannel] = React.useState<string>("");
  const [newLangCommentator, setNewLangCommentator] = React.useState<string>("");

  // Create Match Form state fields
  const [newHomeName, setNewHomeName] = React.useState<string>("");
  const [newHomeCode, setNewHomeCode] = React.useState<string>("");
  const [newHomeFlag, setNewHomeFlag] = React.useState<string>("⚽");
  const [newHomeColor, setNewHomeColor] = React.useState<string>("#0284c7");

  const [newAwayName, setNewAwayName] = React.useState<string>("");
  const [newAwayCode, setNewAwayCode] = React.useState<string>("");
  const [newAwayFlag, setNewAwayFlag] = React.useState<string>("⚽");
  const [newAwayColor, setNewAwayColor] = React.useState<string>("#b91c1c");

  const [newDate, setNewDate] = React.useState<string>("2026-06-13");
  const [newGroupParam, setNewGroupParam] = React.useState<string>("Group A");

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = React.useState<boolean>(false);

  // Synchronize state values from current loaded configs
  React.useEffect(() => {
    if (currentConfig) {
      setStreamUrl(currentConfig.streamUrl || "");
      setDrmKey(currentConfig.drmKey || "");
      setActiveMatchId(currentConfig.activeMatchId || "");
      setActiveCommentaryCode(currentConfig.activeCommentaryCode || "");
    }
  }, [currentConfig]);

  // Synchronize dynamic editing values when match is selected inside dropdown
  React.useEffect(() => {
    const match = matches.find((m) => m.id === selectedMatchId);
    // Clear local non-saved drag/drop files so we display the newly selected match's fields correctly
    setLocalLiveName("");
    setLocalHighlightName("");
    if (match) {
      setHomeScore(match.homeScore);
      setAwayScore(match.awayScore);
      setMatchStatus(match.status);
      setMatchMinute(match.minute);
      setGroupName(match.group || "");
      setStadiumName(match.stadium || "");
      setMatchHeroImage(match.heroImage || "");
      setMatchStreamUrl(match.streamUrl || "");
      setMatchDrmKey(match.drmKey || "");
      setMatchHighlightsUrl(match.highlightsUrl || "");
      setMatchHighlightsDrmKey(match.highlightsDrmKey || "");
      setMatchHighlightsThumbnailUrl(match.highlightsThumbnailUrl || "");
      setMatchHighlightsUploadTime(match.highlightsUploadTime || "");
      setMatchLiveUploadTime(match.liveUploadTime || "");

      if (match.streamUrl === "local://uploaded_live") {
        setLocalLiveName("Durable Live media cached in browser store");
      }
      if (match.highlightsUrl === "local://uploaded_highlights") {
        setLocalHighlightName("Durable Highlights media cached in browser store");
      }
    }
  }, [selectedMatchId]);

  // Handle saving Global Live configurations (M3U8/.MPD URL and DRM Key pair configurations)
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveSuccess(false);

    try {
      const configRef = doc(db, "settings", "config");
      await updateDoc(configRef, {
        streamUrl,
        drmKey,
        activeMatchId,
        activeCommentaryCode,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update config stream setting:", err);
      // Fallback update schema or handle error
      try {
        const configRef = doc(db, "settings", "config");
        await setDoc(configRef, {
          streamUrl,
          drmKey,
          activeMatchId,
          activeCommentaryCode,
          resolution: "Auto",
          resolutions: ["Auto", "1080p", "720p", "480p"],
          languages: ["en", "es", "ar", "fr", "pt"]
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.UPDATE, "settings/config");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "matches", matchId));
      if (selectedMatchId === matchId) {
        setSelectedMatchId("");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `matches/${matchId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save selected single Match updates to Firestore database directly
  const handleSaveMatchScore = async () => {
    if (!selectedMatchId) return;
    setIsLoading(true);

    try {
      const matchRef = doc(db, "matches", selectedMatchId);
      await updateDoc(matchRef, {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        status: matchStatus,
        minute: Number(matchMinute),
        group: groupName,
        stadium: stadiumName,
      });

      showToast("Match variables successfully updated in real-time!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matches/${selectedMatchId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Live Video configurations only
  const handleSaveLiveVideoOnly = async () => {
    if (!selectedMatchId) return;
    setIsLoading(true);

    try {
      const matchRef = doc(db, "matches", selectedMatchId);
      await updateDoc(matchRef, {
        streamUrl: matchStreamUrl || "",
        drmKey: matchDrmKey || "",
        liveUploadTime: matchLiveUploadTime || "",
        heroImage: matchHeroImage,
      });

      showToast("Live video stream settings successfully updated!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matches/${selectedMatchId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Highlights Video configurations only
  const handleSaveHighlightsVideoOnly = async () => {
    if (!selectedMatchId) return;
    setIsLoading(true);

    try {
      const matchRef = doc(db, "matches", selectedMatchId);
      await updateDoc(matchRef, {
        highlightsUrl: matchHighlightsUrl || "",
        highlightsDrmKey: matchHighlightsDrmKey || "",
        highlightsThumbnailUrl: matchHighlightsThumbnailUrl || "",
        highlightsUploadTime: matchHighlightsUploadTime || "",
      });

      showToast("Highlight video settings successfully updated!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `matches/${selectedMatchId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save addition of new audio commentators language option in list
  const handleAddCommentaryTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangCode || !newLangName || !newLangFlag) return;
    setIsLoading(true);

    try {
      // Add custom tracks into list or update local track list state configurations
      const configRef = doc(db, "settings", "config");
      const currentLanguages = currentConfig?.languages || [];
      const codeCleaned = newLangCode.toLowerCase().trim();
      const nextLanguages = currentLanguages.includes(codeCleaned)
        ? currentLanguages
        : [...currentLanguages, codeCleaned];

      const currentTracks = currentConfig?.commentaryTracks || [];
      const newTrack: CommentaryTrack = {
        code: codeCleaned,
        name: newLangName.trim(),
        flag: newLangFlag.trim(),
        channel: newLangChannel.trim() || "FIFA Live Broadcast Network",
        commentator: newLangCommentator.trim() || "Local Match Analysts"
      };

      const filteredTracks = currentTracks.filter(t => t.code !== codeCleaned);
      const nextTracks = [...filteredTracks, newTrack];

      await updateDoc(configRef, {
        languages: nextLanguages,
        commentaryTracks: nextTracks,
      });

      // Add as dynamic custom track document on match if required
      showToast(`Success: Commentary language ${newLangName} (${codeCleaned}) is configured successfully!`);
      setNewLangCode("");
      setNewLangName("");
      setNewLangFlag("");
      setNewLangChannel("");
      setNewLangCommentator("");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/config");
    } finally {
      setIsLoading(false);
    }
  };

  // Create match scheduler creator function
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeName || !newHomeCode || !newAwayName || !newAwayCode) {
      showToast("Please fill in both Home and Away team details!");
      return;
    }
    setIsLoading(true);

    try {
      const matchId = `match-${Date.now()}`;
      const matchRef = doc(db, "matches", matchId);

      const createdMatch: Match = {
        id: matchId,
        homeTeam: {
          name: newHomeName.trim(),
          code: newHomeCode.trim().toUpperCase(),
          flag: newHomeFlag.trim(),
          color: newHomeColor,
        },
        awayTeam: {
          name: newAwayName.trim(),
          code: newAwayCode.trim().toUpperCase(),
          flag: newAwayFlag.trim(),
          color: newAwayColor,
        },
        homeScore: 0,
        awayScore: 0,
        status: newMatchStatus as any,
        minute: 0,
        group: newGroupParam.trim() || "Group A",
        stadium: "Championship Arena",
        spectators: "65,000",
        referee: "FIFA Official Assistant",
        heroImage: newMatchHeroImage || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
        goals: [],
        timeline: [],
        date: newDate.trim() || "2026-06-13",
      };

      await setDoc(matchRef, createdMatch);

      showToast(`Success: Match scheduled on ${newDate} - ${newHomeCode} vs ${newAwayCode}!`);
      setNewHomeName("");
      setNewHomeCode("");
      setNewHomeFlag("⚽");
      setNewAwayName("");
      setNewAwayCode("");
      setNewAwayFlag("⚽");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "matches");
    } finally {
      setIsLoading(false);
    }
  };

  // Standing Row Actions
  const handleCreateStandingRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!standId || !standName) {
      showToast("Please fill in Country Code and Name!");
      return;
    }
    setIsLoading(true);
    try {
      const code = standId.trim().toUpperCase();
      const docRef = doc(db, "standings", code);
      const newRow: StandingRow = {
        id: code,
        name: standName.trim(),
        flag: standFlag.trim() || "⚽",
        gp: Number(standGp),
        w: Number(standW),
        d: Number(standD),
        l: Number(standL),
        gf: Number(standGf),
        ga: Number(standGa),
        pts: Number(standPts),
        manual: true
      };
      await setDoc(docRef, newRow);
      showToast(`Successfully added ${standName} to the Standings table!`);
      // Reset inputs
      setStandId("");
      setStandName("");
      setStandFlag("⚽");
      setStandGp(0);
      setStandW(0);
      setStandD(0);
      setStandL(0);
      setStandGf(0);
      setStandGa(0);
      setStandPts(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "standings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStandingRow = async (id: string, updatedFields: Partial<StandingRow>) => {
    setIsLoading(true);
    try {
      const docRef = doc(db, "standings", id);
      await updateDoc(docRef, updatedFields);
      showToast(`Successfully updated standing row for ${id}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `standings/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStandingRow = async (id: string) => {
    setIsLoading(true);
    try {
      const docRef = doc(db, "standings", id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `standings/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 text-white p-6 md:p-8 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col no-scrollbar"
        id="admin-dashboard-root"
      >
        {toastMsg && (
          <div className="absolute top-4 right-4 z-50 bg-gradient-to-r from-teal-400 to-emerald-500 text-neutral-950 font-sans text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.5)] flex items-center gap-2 border border-teal-300 pointer-events-none font-black uppercase tracking-wider">
            <Check size={14} className="stroke-[3]" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Glowing atmospheric elements */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header bar */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 z-10 relative">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-teal-400 to-emerald-500 text-neutral-950 rounded-xl">
              <Database size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg uppercase tracking-tight">
                FIFA 2026 Live Administration Panel
              </h2>
              <p className="text-[10px] uppercase font-mono tracking-widest text-teal-400">
                Authorized Cloud Host Connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/15 rounded-full border border-white/15 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable controls wrapper */}
        <div className="flex-1 overflow-y-auto space-y-6 pt-6 pr-1 no-scrollbar z-10 relative">
          
          {/* Dynamic Navigation Tabs inside Admin Panel */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 select-none mb-6">
            <button
              type="button"
              onClick={() => setActiveAdminTab("scores")}
              className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeAdminTab === "scores"
                  ? "bg-cyan-500 text-black shadow-md font-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Edit size={12} />
              <span>Modify Scores</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab("addMatch")}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeAdminTab === "addMatch"
                  ? "bg-teal-500 text-black shadow-md font-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Plus size={12} />
              <span>Add Match</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab("liveVideo")}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeAdminTab === "liveVideo"
                  ? "bg-cyan-600 text-white shadow-md font-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Video size={12} className="text-cyan-400" />
              <span>Live Video</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab("highlightsVideo")}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeAdminTab === "highlightsVideo"
                  ? "bg-amber-500 text-black shadow-md font-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Film size={12} className="text-amber-400" />
              <span>Highlights</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab("standings")}
              className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeAdminTab === "standings"
                  ? "bg-emerald-500 text-black shadow-md font-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy size={12} />
              <span>Standings Table</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab("commentary")}
              className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                activeAdminTab === "commentary"
                  ? "bg-purple-500 text-black shadow-md font-black"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Plus size={12} />
              <span>Language Feeds</span>
            </button>
          </div>

          {activeAdminTab === "scores" && (
            <section className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-cyan-400">
                  <Edit size={16} />
                  <span>EDIT LIVE MATCH SCORES & GAME STATE INSTANTLY</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Select any of the games in the championship card below. Manually modify scores, current game status, and minutes played. 
                  This immediately updates all screens in real-time.
                </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                  Choose Game Target
                </label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                >
                  <option value="">Select a game to edit...</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam.code} {m.homeScore} : {m.awayScore} {m.awayTeam.code} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatchId && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                      Home score goals
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-xs font-mono text-white"
                      value={homeScore}
                      onChange={(e) => setHomeScore(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                      Away score goals
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-xs font-mono text-white"
                      value={awayScore}
                      onChange={(e) => setAwayScore(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>

            {selectedMatchId && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Fixture status
                  </label>
                  <select
                    value={matchStatus}
                    onChange={(e) => setMatchStatus(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 p-3 rounded-xl text-xs font-mono text-white"
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="FINISHED">FINISHED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Match Time (Minutes Part)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-xs font-mono text-white"
                    value={matchMinute}
                    onChange={(e) => setMatchMinute(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Group Detail
                  </label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-xs font-mono text-white"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Stadium
                  </label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 p-3 rounded-xl text-xs font-mono text-white"
                    value={stadiumName}
                    onChange={(e) => setStadiumName(e.target.value)}
                  />
                </div>

              </div>
            )}

            {selectedMatchId && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveMatchScore}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Commit Match State</span>
                </button>
              </div>
            )}

            {/* List of current database matches with Direct Actions (Edit / Delete) */}
            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
              <h4 className="text-xs uppercase font-black text-cyan-400 tracking-wider">
                Database Scoreboard Manager ({matches.length} fixtures available)
              </h4>
              <p className="text-[10px] text-neutral-400">
                You can click the <strong>Edit</strong> button next to any match to load its data inside the state editor panel above, or click <strong>Delete</strong> to remove the fixture entirely from the application scoreboard.
              </p>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/35">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-neutral-400 font-mono text-[9px] uppercase">
                      <th className="p-3">Fixture</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {matches.map((m) => (
                      <tr key={m.id} className={`hover:bg-white/5 transition-colors ${selectedMatchId === m.id ? "bg-cyan-500/10" : ""}`}>
                        <td className="p-3 font-semibold flex items-center gap-2">
                          <span className="text-sm select-none">{m.homeTeam.flag}</span>
                          <span className="uppercase font-mono">{m.homeTeam.code}</span>
                          <span className="text-neutral-500 text-[10px]">vs</span>
                          <span className="text-sm select-none">{m.awayTeam.flag}</span>
                          <span className="uppercase font-mono">{m.awayTeam.code}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-teal-400">
                          {m.homeScore} - {m.awayScore}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold ${
                            m.status === "LIVE" ? "bg-red-500/15 text-red-400 animate-pulse" :
                            m.status === "FINISHED" ? "bg-neutral-800 text-neutral-400" :
                            "bg-amber-500/15 text-amber-400"
                          }`}>
                            {m.status} {m.status === "LIVE" ? `(${m.minute}')` : ""}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedMatchId(m.id)}
                            className="px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/25 text-cyan-400 rounded-lg font-mono text-[10px] uppercase font-black transition cursor-pointer"
                            title="Edit this score"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMatch(m.id)}
                            className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/25 text-rose-400 rounded-lg font-mono text-[10px] uppercase font-black transition cursor-pointer"
                            title="Delete this match score"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeAdminTab === "liveVideo" && (
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-cyan-400">
              <Video size={16} />
              <span>MANAGE LIVE VIDEO & STREAM FEEDS</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Upload local video feeds, specify custom stream URLs, and set hero wallpaper backgrounds for active live matches.
            </p>

            <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                  Select Match to Manage Live Video
                </label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                >
                  <option value="">Select a game...</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam.code} {m.homeScore} : {m.awayScore} {m.awayTeam.code} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatchId && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold">
                        Hero Banner Cover / Wallpaper URL
                      </label>
                      <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                        placeholder="e.g. https://images.unsplash.com/photo-..."
                        value={matchHeroImage}
                        onChange={(e) => setMatchHeroImage(e.target.value)}
                      />
                      <p className="text-[9px] text-neutral-500">
                        Default background wallpaper for the main live screen or premium matches list.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold">
                        Live Stream Publish/Start Time Description
                      </label>
                      <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                        placeholder="e.g. Today, 5 mins ago, 10:00 PM"
                        value={matchLiveUploadTime}
                        onChange={(e) => setMatchLiveUploadTime(e.target.value)}
                      />
                      <p className="text-[9px] text-neutral-500">
                        Display indicator shown for live coverage streams or scheduled matches.
                      </p>
                    </div>
                  </div>

                  <div className="border border-white/10 p-4 rounded-2xl bg-neutral-900/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-widest font-black text-cyan-400">
                          LIVE STREAM PLAYBACK VIDEO
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                          Specify a direct .mpd/.m3u8 stream or upload a playback media file.
                        </p>
                      </div>
                      {localLiveName && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocalLiveName("");
                            setMatchStreamUrl("");
                            deleteVideoFromDb(`${selectedMatchId}_live`).then(() => {
                              showToast("Cleared Live Media File");
                            });
                          }}
                          className="text-[9px] font-mono uppercase font-black text-rose-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          Clear Live Media File
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                          Live Stream URL
                        </label>
                        <input
                          type="text"
                          className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-cyan-400 focus:outline-none"
                          placeholder="e.g. Stream URL link (.m3u8 / .mpd)"
                          value={matchStreamUrl}
                          onChange={(e) => setMatchStreamUrl(e.target.value)}
                        />
                        {localLiveName && (
                          <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                            ✓ Local playback file active: {localLiveName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                          Live DRM ClearKey Sequence (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-cyan-400 focus:outline-none"
                          placeholder="e.g. keyId:keyHex"
                          value={matchDrmKey}
                          onChange={(e) => setMatchDrmKey(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Drag-and-Drop Live File Upload Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLive(true);
                      }}
                      onDragLeave={() => setIsDraggingLive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingLive(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleLiveFileDrop(file);
                      }}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden bg-neutral-950/20 max-w-none ${
                        isDraggingLive
                          ? "border-cyan-450 bg-cyan-500/10 scale-[1.01]"
                          : localLiveName
                          ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                          : "border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.01]"
                      }`}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/*";
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) handleLiveFileDrop(file);
                        };
                        input.click();
                      }}
                    >
                      {liveUploadProgress !== null ? (
                        <div className="space-y-2 py-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-450 animate-ping inline-block"></span>
                            <span className="text-xs font-mono font-extrabold text-cyan-450 uppercase tracking-widest">
                              UPLOADING {liveUploadProgress}%
                            </span>
                          </div>
                          <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden relative mx-auto">
                            <div 
                              style={{ width: `${liveUploadProgress}%` }} 
                              className="h-full bg-cyan-450 transition-all duration-150"
                            />
                          </div>
                        </div>
                      ) : localLiveName ? (
                        <div className="space-y-1.5 py-1">
                          <div className="text-emerald-400 text-xl">✓</div>
                          <p className="text-[11px] font-sans font-bold text-white uppercase tracking-tight">
                            Live Playback File Loaded
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400 select-all font-semibold">
                            {localLiveName}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-1">
                          <div className="text-cyan-450 text-2xl">⚡</div>
                          <p className="text-[11px] font-sans font-bold text-neutral-300 uppercase tracking-wide">
                            DRAG & DROP LIVE STREAM VIDEO CONTENT OR CLICK TO UPLOAD
                          </p>
                          <p className="text-[9.5px] font-mono text-neutral-500">
                            Enforces video format checks (.mp4, .webm, .mov)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveLiveVideoOnly}
                      disabled={isLoading}
                      className="px-6 py-3 bg-cyan-600 hover:bg-cyan-505 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
                    >
                      <Save size={14} className="stroke-[2.5]" />
                      <span>Save Live Video Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeAdminTab === "highlightsVideo" && (
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-amber-500">
              <Film size={16} />
              <span>MANAGE HIGHLIGHTS VIDEO CLIPS</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Upload local video clips, specify custom highlights URLs, and configure thumbnail images with capture times.
            </p>

            <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                  Select Match to Manage Highlights
                </label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                >
                  <option value="">Select a game...</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam.code} {m.homeScore} : {m.awayScore} {m.awayTeam.code} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatchId && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold">
                        Highlight Video Thumbnail URL
                      </label>
                      <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                        placeholder="e.g. Custom specific thumbnail image"
                        value={matchHighlightsThumbnailUrl}
                        onChange={(e) => setMatchHighlightsThumbnailUrl(e.target.value)}
                      />
                      <p className="text-[9px] text-neutral-500">
                        Target thumbnail used exclusively for the Highlight Cards list.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold">
                        Highlight Video Upload Time Description
                      </label>
                      <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                        placeholder="e.g. 2 hours ago, Yesterday"
                        value={matchHighlightsUploadTime}
                        onChange={(e) => setMatchHighlightsUploadTime(e.target.value)}
                      />
                      <p className="text-[9px] text-neutral-500">
                        Display release date/time details on highlight thumbnails.
                      </p>
                    </div>
                  </div>

                  <div className="border border-white/10 p-4 rounded-2xl bg-neutral-900/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-widest font-black text-amber-500">
                          CORES HIGHLIGHTS FILE & STREAM
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                          Specify a direct highlights stream link or upload a highlight recording file.
                        </p>
                      </div>
                      {localHighlightName && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocalHighlightName("");
                            setMatchHighlightsUrl("");
                            deleteVideoFromDb(`${selectedMatchId}_highlights`).then(() => {
                              showToast("Cleared Highlights Media File");
                            });
                          }}
                          className="text-[9px] font-mono uppercase font-black text-rose-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          Clear Highlights File
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                          Highlights Stream URL
                        </label>
                        <input
                          type="text"
                          className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-amber-505 focus:outline-none"
                          placeholder="e.g. Highlights URL link (.m3u8 / .mpd)"
                          value={matchHighlightsUrl}
                          onChange={(e) => setMatchHighlightsUrl(e.target.value)}
                        />
                        {localHighlightName && (
                          <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                            ✓ Local recording file active: {localHighlightName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                          Highlights DRM ClearKey Sequence (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-amber-505 focus:outline-none"
                          placeholder="e.g. keyId:keyHex"
                          value={matchHighlightsDrmKey}
                          onChange={(e) => setMatchHighlightsDrmKey(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Drag-and-Drop Highlight File Upload Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingHighlight(true);
                      }}
                      onDragLeave={() => setIsDraggingHighlight(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingHighlight(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleHighlightFileDrop(file);
                      }}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden bg-neutral-950/20 max-w-none ${
                        isDraggingHighlight
                          ? "border-amber-400 bg-amber-505/10 scale-[1.01]"
                          : localHighlightName
                          ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                          : "border-white/10 hover:border-amber-500/40 hover:bg-white/[0.01]"
                      }`}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "video/*";
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) handleHighlightFileDrop(file);
                        };
                        input.click();
                      }}
                    >
                      {highlightUploadProgress !== null ? (
                        <div className="space-y-2 py-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block"></span>
                            <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">
                              UPLOADING {highlightUploadProgress}%
                            </span>
                          </div>
                          <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden relative mx-auto">
                            <div 
                              style={{ width: `${highlightUploadProgress}%` }} 
                              className="h-full bg-amber-400 transition-all duration-150"
                            />
                          </div>
                        </div>
                      ) : localHighlightName ? (
                        <div className="space-y-1.5 py-1">
                          <div className="text-emerald-400 text-xl">✓</div>
                          <p className="text-[11px] font-sans font-bold text-white uppercase tracking-tight">
                            Highlights Recording File Loaded
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400 select-all font-semibold">
                            {localHighlightName}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-1">
                          <div className="text-amber-400 text-2xl">⚽</div>
                          <p className="text-[11px] font-sans font-bold text-neutral-300 uppercase tracking-wide">
                            DRAG & DROP SCORES HIGHLIGHT RECON VIDEO DATA OR CLICK TO UPLOAD
                          </p>
                          <p className="text-[9.5px] font-mono text-neutral-500">
                            Enforces video format checks (.mp4, .webm, .mov)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveHighlightsVideoOnly}
                      disabled={isLoading}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
                    >
                      <Save size={14} className="stroke-[2.5]" />
                      <span>Save Highlights Video Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeAdminTab === "commentary" && (
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-purple-400">
              <Plus size={16} />
              <span>ADD DIFFERENT COMMENTARY LANGUAGE OPTIONS</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Introduce new country tracks for multi-angle sound options shown inside video player choices.
            </p>

            <form onSubmit={handleAddCommentaryTrack} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Code</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="e.g. it"
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-mono text-white"
                    required
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Lang Name</label>
                  <input
                    type="text"
                    placeholder="Italiano"
                    value={newLangName}
                    onChange={(e) => setNewLangName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs text-white"
                    required
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Flag Emoji</label>
                  <input
                    type="text"
                    placeholder="🇮🇹"
                    value={newLangFlag}
                    onChange={(e) => setNewLangFlag(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs text-center text-white"
                    required
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Network name</label>
                  <input
                    type="text"
                    placeholder="Sky Italia HD"
                    value={newLangChannel}
                    onChange={(e) => setNewLangChannel(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Commentator</label>
                  <input
                    type="text"
                    placeholder="Fabio Caressa"
                    value={newLangCommentator}
                    onChange={(e) => setNewLangCommentator(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-black font-semibold text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Configure Language</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {activeAdminTab === "addMatch" && (
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-teal-400">
              <Plus size={16} />
              <span>CREATE / SCHEDULE FUTURE & DATED MATCHES</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Add new live matches. Set the kickoff date (e.g. today, tomorrow, or any dated schedule). 
              Users only see Today's and Tomorrow's matches on their screen widgets!
            </p>

            <form onSubmit={handleCreateMatch} className="space-y-4 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team Inputs */}
                <div className="bg-black/35 p-3.5 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="text-xs uppercase font-black text-rose-400 tracking-wider">Home Team</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Team Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Argentina"
                        value={newHomeName}
                        onChange={(e) => setNewHomeName(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 p-2 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Code (3 chars)</label>
                      <input
                        type="text"
                        placeholder="e.g. ARG"
                        maxLength={3}
                        value={newHomeCode}
                        onChange={(e) => setNewHomeCode(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 p-2 rounded-lg text-xs uppercase"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Flag Emoji</label>
                      <input
                        type="text"
                        placeholder="🇦🇷"
                        value={newHomeFlag}
                        onChange={(e) => setNewHomeFlag(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 p-2 rounded-lg text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Color Theme Hex</label>
                      <input
                        type="color"
                        value={newHomeColor}
                        onChange={(e) => setNewHomeColor(e.target.value)}
                        className="w-full h-8 bg-neutral-900 border border-white/10 p-1 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Away Team Inputs */}
                <div className="bg-black/35 p-3.5 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="text-xs uppercase font-black text-blue-400 tracking-wider">Away Team</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Team Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Portugal"
                        value={newAwayName}
                        onChange={(e) => setNewAwayName(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 p-2 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Code (3 chars)</label>
                      <input
                        type="text"
                        placeholder="e.g. POR"
                        maxLength={3}
                        value={newAwayCode}
                        onChange={(e) => setNewAwayCode(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 p-2 rounded-lg text-xs uppercase"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Flag Emoji</label>
                      <input
                        type="text"
                        placeholder="🇵🇹"
                        value={newAwayFlag}
                        onChange={(e) => setNewAwayFlag(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 p-2 rounded-lg text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Color Theme Hex</label>
                      <input
                        type="color"
                        value={newAwayColor}
                        onChange={(e) => setNewAwayColor(e.target.value)}
                        className="w-full h-8 bg-neutral-900 border border-white/10 p-1 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date details and tournament group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-3.5 rounded-2xl border border-white/5">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Match Scheduled Date (YYYY-MM-DD format)
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none"
                    required
                  />
                  <p className="text-[9px] text-neutral-500 mt-1 font-mono">
                    Today: 2026-06-13, Tomorrow: 2026-06-14
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Tournament Group Stage Name
                  </label>
                  <input
                    type="text"
                    value={newGroupParam}
                    onChange={(e) => setNewGroupParam(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                    placeholder="e.g. Group Stage Group A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Initial Match Status
                  </label>
                  <select
                    value={newMatchStatus}
                    onChange={(e) => setNewMatchStatus(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-white focus:outline-none"
                  >
                    <option value="SCHEDULED">SCHEDULED (Kickoff future match)</option>
                    <option value="LIVE">LIVE (Stream active currently)</option>
                    <option value="FINISHED">FINISHED (Live ended match / replay archives)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Custom Stream/Video Cover Thumbnail URL
                  </label>
                  <input
                    type="text"
                    value={newMatchHeroImage}
                    onChange={(e) => setNewMatchHeroImage(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-teal-400 focus:outline-none"
                    placeholder="e.g. https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-gradient-to-tr from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-extrabold text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-lg shadow-teal-500/10"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>CREATE SCHEDULE FIXTURE</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {activeAdminTab === "standings" && (
          <section className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-emerald-400">
              <Trophy size={16} />
              <span>MANUALLY MANAGE STANDINGS (FIFA WORLD CUP 2026)</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Alter live standing table points, games played, goal differences and details. You can also add custom scorers or countries manually.
            </p>

            {/* Inline Table Editor */}
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/35 no-scrollbar">
              <table className="w-full text-left text-[11px] sm:text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-neutral-400 font-mono text-[9px] uppercase">
                    <th className="p-2 text-center">Code</th>
                    <th className="p-2">Country Name</th>
                    <th className="p-2 text-center">GP</th>
                    <th className="p-2 text-center">W - D - L</th>
                    <th className="p-2 text-center">GF - GA</th>
                    <th className="p-2 text-center">PTS</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {dbStandings && dbStandings.length > 0 ? (
                    dbStandings.map((row) => (
                      <EditableStandingRow
                        key={row.id}
                        row={row}
                        onUpdate={handleUpdateStandingRow}
                        onDelete={handleDeleteStandingRow}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-neutral-500 font-mono text-[10px]">
                        No database overrides active (computed from scoreboard matches)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Create Standing Row Panel Form */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <h4 className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                Add Team to Standings overriding
              </h4>
              <form onSubmit={handleCreateStandingRow} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/20 p-4 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Code</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="e.g. BRA"
                    value={standId}
                    onChange={(e) => setStandId(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 p-2 rounded text-xs uppercase font-mono text-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Country Name</label>
                  <input
                    type="text"
                    placeholder="Brazil"
                    value={standName}
                    onChange={(e) => setStandName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 p-2 rounded text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Flag Emoji</label>
                  <input
                    type="text"
                    placeholder="🇧🇷"
                    value={standFlag}
                    onChange={(e) => setStandFlag(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 p-2 rounded text-xs text-center text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase text-neutral-400 mb-1">Points</label>
                  <input
                    type="number"
                    value={standPts}
                    onChange={(e) => setStandPts(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-white/10 p-2 rounded text-xs font-mono text-white"
                  />
                </div>
                
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] rounded-lg transition uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Insert Standing Row</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        </div>
      </motion.div>
    </div>
  );
}

interface EditableStandingRowProps {
  key?: string;
  row: StandingRow;
  onUpdate: (id: string, updated: any) => any;
  onDelete: (id: string) => any;
}

function EditableStandingRow({ row, onUpdate, onDelete }: EditableStandingRowProps) {
  const [name, setName] = React.useState(row.name);
  const [flag, setFlag] = React.useState(row.flag);
  const [gp, setGp] = React.useState(row.gp || 0);
  const [w, setW] = React.useState(row.w || 0);
  const [d, setD] = React.useState(row.d || 0);
  const [l, setL] = React.useState(row.l || 0);
  const [gf, setGf] = React.useState(row.gf || 0);
  const [ga, setGa] = React.useState(row.ga || 0);
  const [pts, setPts] = React.useState(row.pts || 0);

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="p-2 font-mono font-bold text-center text-teal-400 select-none">
        {row.id}
      </td>
      <td className="p-2 text-left">
        <div className="flex gap-1 items-center">
          <input
            type="text"
            className="w-8 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[11px]"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="🇧🇷"
          />
          <input
            type="text"
            className="w-20 bg-neutral-900 border border-white/10 p-1 rounded text-[11px] text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </td>
      <td className="p-1 text-center w-12">
        <input
          type="number"
          className="w-9 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[11px] font-mono text-white"
          value={gp}
          onChange={(e) => setGp(Number(e.target.value))}
        />
      </td>
      <td className="p-1">
        <div className="flex gap-0.5 items-center justify-center">
          <input
            type="number"
            className="w-7 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[10px] font-mono text-white"
            value={w}
            onChange={(e) => setW(Number(e.target.value))}
            title="Won"
          />
          <span className="text-neutral-600">-</span>
          <input
            type="number"
            className="w-7 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[10px] font-mono text-white"
            value={d}
            onChange={(e) => setD(Number(e.target.value))}
            title="Drawn"
          />
          <span className="text-neutral-600">-</span>
          <input
            type="number"
            className="w-7 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[10px] font-mono text-white"
            value={l}
            onChange={(e) => setL(Number(e.target.value))}
            title="Lost"
          />
        </div>
      </td>
      <td className="p-1">
        <div className="flex gap-0.5 items-center justify-center">
          <input
            type="number"
            className="w-7 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[10px] font-mono text-white"
            value={gf}
            onChange={(e) => setGf(Number(e.target.value))}
            title="Goals For"
          />
          <span className="text-neutral-600">:</span>
          <input
            type="number"
            className="w-7 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[10px] font-mono text-white"
            value={ga}
            onChange={(e) => setGa(Number(e.target.value))}
            title="Goals Against"
          />
        </div>
      </td>
      <td className="p-1 text-center w-12">
        <input
          type="number"
          className="w-9 bg-neutral-900 border border-white/10 p-1 rounded text-center text-[11px] font-mono font-bold text-yellow-400"
          value={pts}
          onChange={(e) => setPts(Number(e.target.value))}
          title="Points"
        />
      </td>
      <td className="p-2 text-right space-x-1">
        <button
          type="button"
          onClick={() => onUpdate(row.id, { name, flag, gp, w, d, l, gf, ga, pts })}
          className="p-1 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/20 rounded transition cursor-pointer"
          title="Commit Custom Scores"
        >
          <Save size={12} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(row.id)}
          className="p-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 rounded transition cursor-pointer"
          title="Delete row"
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );
}
