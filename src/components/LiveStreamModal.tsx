import React from "react";
import { X, Volume2, VolumeX, Radio, ChevronRight, Play, Pause, RefreshCw, MessageSquare, Monitor, Send, HelpCircle, ShieldAlert, KeyRound, Maximize, Minimize, Mic, Globe, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Match, CommentaryTrack, TimelineEvent } from "../types";
import { commentaryTracks } from "../data/mockMatches";
import shaka from "shaka-player";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, limit, deleteDoc, doc } from "firebase/firestore";
import { getVideoFromDb } from "../lib/videoDb";

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onGoalScored: (teamCode: string, isFromUserClick?: boolean) => void;
  settingsConfig?: {
    activeMatchId: string;
    streamUrl: string;
    drmKey: string;
    activeCommentaryCode: string;
    resolution: string;
    resolutions: string[];
    languages: string[];
    commentaryTracks?: CommentaryTrack[];
  } | null;
  forcePlaybackMode?: "live" | "highlights";
}

function VoicePlayer({ audioData }: { audioData: string }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioData);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback failure:", err);
      });
    }
  };

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2 bg-neutral-900 border border-white/15 rounded-lg p-2 mt-1 select-none">
      <button
        type="button"
        onClick={togglePlay}
        className="p-1.5 bg-teal-500 text-black hover:bg-teal-400 rounded-lg cursor-pointer transition"
      >
        {isPlaying ? <Pause size={10} className="fill-black stroke-none animate-pulse" /> : <Play size={10} className="fill-black stroke-none" />}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-[9px] font-mono text-teal-400 uppercase font-bold tracking-wide">Audio Share</span>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
          {isPlaying && (
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 6, ease: "linear" }}
              className="h-full bg-teal-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveStreamModal({ isOpen, onClose, match, onGoalScored, settingsConfig, forcePlaybackMode }: LiveStreamModalProps) {
  const [selectedTrack, setSelectedTrack] = React.useState<CommentaryTrack | null>(null);
  const [isConnecting, setIsConnecting] = React.useState<boolean>(false);
  const [isPreloading, setIsPreloading] = React.useState<boolean>(false);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(true);
  const [volumeLevel, setVolumeLevel] = React.useState<number>(80);
  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const [commentaryChat, setCommentaryChat] = React.useState<{ name: string; msg: string; flag: string; isStaff?: boolean; audioData?: string }[]>([]);
  const [userChatInput, setUserChatInput] = React.useState<string>("");
  const [selectedRes, setSelectedRes] = React.useState<string>("Auto");
  const [availableResolutions, setAvailableResolutions] = React.useState<string[]>(["Auto", "1080p", "720p", "480p", "360p"]);
  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);

  // Custom highlights timeline, fullscreen chat toggle, and language selector properties
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [duration, setDuration] = React.useState<number>(0);
  const [isChatOpenInFullScreen, setIsChatOpenInFullScreen] = React.useState<boolean>(false);
  const [isLanguageListOpen, setIsLanguageListOpen] = React.useState<boolean>(false);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return "00:00";
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Microphone recording structures
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState<number>(0);
  const mediaRecorderRef = React.useRef<any>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingIntervalRef = React.useRef<any>(null);
  
  // Interactive Autohide Controls and Catch Up seek elements
  const [showControls, setShowControls] = React.useState<boolean>(true);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = React.useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen, resetControlsTimeout]);

  const handleCatchUp = () => {
    if (!videoRef.current) return;
    try {
      if (shakaPlayerRef.current) {
        const seekRange = shakaPlayerRef.current.seekRange();
        if (seekRange && seekRange.end) {
          videoRef.current.currentTime = seekRange.end - 1;
        }
      } else {
        const buffered = videoRef.current.buffered;
        if (buffered.length > 0) {
          videoRef.current.currentTime = buffered.end(buffered.length - 1);
        }
      }
      setIsPlaying(true);
      videoRef.current.play().catch(() => {});
    } catch (err) {
      console.warn("Satellite live sync seek error:", err);
    }
  };
  
  // Real video decoder elements and references
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const shakaPlayerRef = React.useRef<any>(null);
  const [streamError, setStreamError] = React.useState<string | null>(null);

  // Synchronize true native Fullscreen API elements to guarantee device resolution fit
  React.useEffect(() => {
    const onFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullScreen(isFull);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
    };
  }, []);

  const handleFullScreenToggle = () => {
    if (!playerContainerRef.current) return;
    
    try {
      const isCurrentlyFull = isFullScreen;
      if (!isCurrentlyFull) {
        setIsFullScreen(true);
        // Force overflow-hidden on body during fullscreen to prevent scrolls showing backgrounds
        document.body.style.overflow = "hidden";
        
        // Progressive enhancement: try requesting browser-level native fullscreen
        const req = playerContainerRef.current.requestFullscreen || 
                    (playerContainerRef.current as any).webkitRequestFullscreen || 
                    (playerContainerRef.current as any).mozRequestFullScreen || 
                    (playerContainerRef.current as any).msRequestFullscreen;
        
        if (req) {
          req.call(playerContainerRef.current).catch((e: any) => {
            console.warn("Native fullscreen rejected, relying on custom CSS fullscreen fallback:", e);
          });
        }
      } else {
        setIsFullScreen(false);
        document.body.style.overflow = "";
        
        const exit = document.exitFullscreen || 
                     (document as any).webkitExitFullscreen || 
                     (document as any).mozCancelFullScreen || 
                     (document as any).msExitFullscreen;
        if (exit) {
          // Check if we are physically in native fullscreen before calling exit
          const isNativeFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
          if (isNativeFull) {
            exit.call(document).catch((e: any) => {
              console.warn("Native fullscreen exit rejected:", e);
            });
          }
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle processing issue:", err);
      setIsFullScreen(!isFullScreen);
    }
  };

  // Compute dynamic client languages with administrative filters applied
  const tracksToDisplay = React.useMemo(() => {
    const configTracks = settingsConfig?.commentaryTracks && settingsConfig.commentaryTracks.length > 0
      ? settingsConfig.commentaryTracks
      : commentaryTracks;

    const allowedCodes = settingsConfig?.languages || ["en"];
    return configTracks.filter((track) => allowedCodes.includes(track.code));
  }, [settingsConfig]);

  // Auto-selection of first language track and immediate fullscreen for highlights playback mode
  React.useEffect(() => {
    if (isOpen) {
      // 1. Completely bypass language selection screen by auto-selecting the first track
      const track = tracksToDisplay[0] || commentaryTracks[0];
      if (track) {
        setSelectedTrack(track);
      }

      // 2. Direct play highlights in fullscreen
      const isFinished = match.status === "FINISHED";
      const isHighlights = forcePlaybackMode === "highlights" || (isFinished && match.highlightsUrl && forcePlaybackMode !== "live");
      if (isHighlights) {
        setIsFullScreen(true);
        // Request actual device webkit/moz/ms/main fullscreen on a relative delay to ensure container binding is loaded fully
        setTimeout(() => {
          if (playerContainerRef.current) {
            try {
              const req = playerContainerRef.current.requestFullscreen || 
                          (playerContainerRef.current as any).webkitRequestFullscreen || 
                          (playerContainerRef.current as any).mozRequestFullScreen || 
                          (playerContainerRef.current as any).msRequestFullscreen;
              if (req) {
                req.call(playerContainerRef.current).catch((err: any) => {
                  console.warn("Direct device-level fullscreen was rejected or needs user gesture:", err);
                });
              }
            } catch (err) {
              console.warn("Direct device fullscreen threw exception:", err);
            }
          }
        }, 300);
      }
    } else {
      setSelectedTrack(null);
      setIsFullScreen(false);
    }
  }, [isOpen, tracksToDisplay, forcePlaybackMode, match]);

  // Real-time globally synced Firebase Chat listener
  React.useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, "chatMessages"),
      orderBy("createdAt", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbMsgs: any[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        dbMsgs.push({
          id: doc.id,
          name: d.name,
          msg: d.msg || "",
          audioData: d.audioData || undefined,
          flag: d.flag || "⚽",
          createdAt: d.createdAt,
          uid: d.uid,
          isStaff: d.uid === "staff" || d.isStaff
        });
      });

      if (dbMsgs.length === 0 && selectedTrack) {
        setCommentaryChat([
          { name: "First Touch Bot", msg: `Welcome to the Live Global chat room! Broadcast active.`, flag: "🤖", isStaff: true },
          { name: "Live Stadium Feed", msg: `Atmosphere at high decibels for this fixtures clash!`, flag: "🏟️", isStaff: true }
        ]);
      } else {
        setCommentaryChat(dbMsgs);
      }
    }, (error) => {
      console.warn("Firestore live chat subscription warning/permission denied: ", error);
    });

    return () => unsubscribe();
  }, [isOpen, selectedTrack]);

  // Handle posting messages to Firestore
  const sendChatMessage = async (text: string, audioBase64?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return; // Silent guard since user is required

    try {
      const chatCol = collection(db, "chatMessages");
      await addDoc(chatCol, {
        name: currentUser.displayName || currentUser.email?.split("@")[0] || "Player",
        msg: text || "",
        audioData: audioBase64 || null,
        flag: match.homeTeam.flag || "⚽",
        uid: currentUser.uid,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Failed to post message to Firestore:", err);
    }
  };

  const handleDeleteMessage = async (msgId?: string) => {
    if (!msgId) return;
    try {
      await deleteDoc(doc(db, "chatMessages", msgId));
    } catch (err) {
      console.error("Failed to delete chat message:", err);
    }
  };

  // Voice recording routines utilizing standard MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendChatMessage("", base64Audio);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone device acquisition failure:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Synchronize playing states with HTML5 video player element
  React.useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.warn("Video play command safe interrupted: ", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Synchronize dynamic sound configs
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volumeLevel / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volumeLevel, isMuted]);

  // Lifecycle initialization loop for Widevine and ClearKey decryption utilizing Shaka Player
  React.useEffect(() => {
    if (!isOpen || !selectedTrack) return;

    // Load and warm up polyfills setup
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      setStreamError("Your current sandbox browser lacks playback modules for high-fidelity MPEG-DASH streaming decryption.");
      return;
    }

    let isDestroyed = false;
    let localPlayer: any = null;

    const initDecoderPipeline = async () => {
      if (!videoRef.current) return;

      try {
        // Resolve URL and DRM key based on match status and match-specific overlays
        let activeStreamUrl = settingsConfig?.streamUrl || "https://qp-pldt-live-bpk-ucd-prod.akamaized.net/bpk-tv/ch299/default/index.mpd";
        let activeDrmKey = settingsConfig?.drmKey || "549ab7cd35a64bb6bb479ecead04d69d:829799ed534d11fcadeb4b192467e050";

        const isFinished = match.status === "FINISHED";
        const playHighlights = forcePlaybackMode === "highlights" || (isFinished && match.highlightsUrl && forcePlaybackMode !== "live");

        if (playHighlights && match.highlightsUrl) {
          activeStreamUrl = match.highlightsUrl;
          activeDrmKey = match.highlightsDrmKey || "";
        } else if (match.streamUrl) {
          activeStreamUrl = match.streamUrl;
          activeDrmKey = match.drmKey || "";
        }

        // Check if activeStreamUrl is an IndexedDB reference or local blob reference
        if (activeStreamUrl === "local://uploaded_live" || activeStreamUrl === "local://uploaded_highlights") {
          const idbKey = activeStreamUrl === "local://uploaded_live" ? `${match.id}_live` : `${match.id}_highlights`;
          try {
            const localFile = await getVideoFromDb(idbKey);
            if (localFile) {
              const localUrl = URL.createObjectURL(localFile);
              if (videoRef.current) {
                // Bypass Shaka player entirely since this is a plain local MP4 file!
                videoRef.current.src = localUrl;
                setAvailableResolutions(["Standard Definition"]);
                setStreamError(null);
                shakaPlayerRef.current = null;
                return; // Bypasses Shaka player load!
              }
            }
          } catch (err) {
            console.error("Failed to load local video from IndexedDB for playback:", err);
          }
        }

        // Standard Shaka player load path for MPEG-DASH/HLS stream URLs
        localPlayer = new shaka.Player(videoRef.current);
        shakaPlayerRef.current = localPlayer;
        setStreamError(null);

        // Map ClearKey DRM configs if provided
        const parsedClearKeys: Record<string, string> = {};
        if (activeDrmKey && activeDrmKey.trim() && activeDrmKey.includes(":")) {
          const [keyId, keyValue] = activeDrmKey.split(":");
          if (keyId && keyValue) {
            parsedClearKeys[keyId.trim()] = keyValue.trim();
          }
          localPlayer.configure({
            drm: {
              clearKeys: parsedClearKeys
            }
          });
        } else {
          // No DRM key required or provided. Render normal optional clear stream config
          localPlayer.configure({
            drm: {}
          });
        }

        localPlayer.addEventListener("error", (event: any) => {
          if (isDestroyed) return;
          console.error("Shaka Player Decrypt error: ", event);
          setStreamError(`Decoder Alert: Feed cannot be decrypted (Error ${event.detail?.code || "0xFE"}). Check your DRM Key settings or network filters.`);
        });

        await localPlayer.load(activeStreamUrl);

        if (isDestroyed) return;
        console.log("MPEG-DASH stream loaded and decoded successfully.");

        try {
          // Detect available variant tracks fromLoaded MPD manifest
          const tracks = localPlayer.getVariantTracks();
          const heights = Array.from(new Set(tracks.map((t: any) => t.height).filter((h: any) => !!h))) as number[];
          heights.sort((a, b) => b - a);
          if (heights.length > 0) {
            setAvailableResolutions(["Auto", ...heights.map(h => `${h}p`)]);
          }
        } catch (e) {
          console.warn("Could not query dynamic variant tracks, using fallbacks:", e);
        }

        if (videoRef.current && isPlaying) {
          videoRef.current.play().catch(err => {
            console.log("Safe play override: ", err);
          });
        }
      } catch (err: any) {
        if (isDestroyed) return;
        console.error("Decoder setup issue: ", err);
        setStreamError(`Initialization Failure: ${err.message || err.code || "Failed loader configuration"}. This often occurs due to missing cross-origin (CORS) attributes on the radio provider's servers.`);
      }
    };

    // Buffer slightly to allow React element to establish its DOM reference
    const timer = setTimeout(() => {
      initDecoderPipeline();
    }, 150);

    return () => {
      isDestroyed = true;
      clearTimeout(timer);
      if (localPlayer) {
        localPlayer.destroy().then(() => {
          if (shakaPlayerRef.current === localPlayer) {
            shakaPlayerRef.current = null;
          }
        });
      }
    };
  }, [isOpen, selectedTrack, settingsConfig]);





  // Handle manual resolution track selection using Shaka Player API
  React.useEffect(() => {
    const localPlayer = shakaPlayerRef.current;
    if (!localPlayer || !isOpen) return;

    try {
      if (selectedRes === "Auto") {
        localPlayer.configure({ abr: { enabled: true } });
        console.log("Enabled Adaptive Bitrate (ABR)");
      } else {
        const targetHeight = parseInt(selectedRes);
        if (!isNaN(targetHeight)) {
          // Disable ABR before selecting manually
          localPlayer.configure({ abr: { enabled: false } });
          const tracks = localPlayer.getVariantTracks();
          const matchedTrack = tracks.find((t: any) => t.height === targetHeight);
          if (matchedTrack) {
            localPlayer.selectVariantTrack(matchedTrack, true);
            console.log(`Successfully locked resolution to height: ${targetHeight}p`);
          }
        }
      }
    } catch (err) {
      console.warn("Unable to switch Shaka Player resolution track:", err);
    }
  }, [selectedRes, isOpen]);

  const handleTrackSelect = (track: CommentaryTrack) => {
    setIsConnecting(true);
    setIsPreloading(true);
    setSelectedTrack(track);
    setTimeout(() => {
      setIsConnecting(false);
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;

    const text = userChatInput;
    setUserChatInput("");

    await sendChatMessage(text);
  };

  // Helper function to manual goal scorer trigger in live commentary!
  const handleSimulateGoalTrigger = () => {
    const luckyTeam = Math.random() > 0.5 ? match.homeTeam.code : match.awayTeam.code;
    onGoalScored(luckyTeam, true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center ${isFullScreen ? "p-0 overflow-hidden" : "p-4 overflow-y-auto"}`}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className={`text-white overflow-hidden shadow-2xl relative flex flex-col ${
              isFullScreen
                ? "w-full h-full max-w-none max-h-none rounded-none bg-neutral-950"
                : "w-full max-w-5xl glass-panel rounded-3xl max-h-[90vh]"
            }`}
          >
            {/* Modal Closer */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/45 hover:bg-black/80 rounded-full border border-white/10 text-white transition-all cursor-pointer active:scale-90"
              title="Close Player"
            >
              <X size={18} />
            </button>

            {/* Language Commentary Choice overlay state (Completely disabled to bypass language selection ask tab) */}
            {!selectedTrack && false ? (
              <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[440px] max-w-xl mx-auto">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="p-4 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-6"
                >
                  <Radio size={40} className="stroke-[2] animate-pulse" />
                </motion.div>

                <h3 className="font-display font-black text-2xl mb-2 tracking-tight">
                  FIFA LIVE MULTI-AUDIO AUDIO FEED
                </h3>
                <p className="text-xs text-neutral-400 mb-8 max-w-sm">
                  The match is broadcast with multiple language options. Choose your audio commentary feed below to initiate the streaming.
                </p>

                {isConnecting ? (
                  <div className="text-center py-6">
                    <RefreshCw className="animate-spin text-teal-400 mx-auto mb-3" size={24} />
                    <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
                      TUNING SATELLITE TRANSCEIVER...
                    </span>
                  </div>
                ) : (
                  <div className="w-full space-y-2.5">
                    {tracksToDisplay.map((track) => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={track.code}
                        onClick={() => handleTrackSelect(track)}
                        className="w-full p-4 rounded-2xl glass-card-interactive hover:bg-teal-500/10 hover:border-teal-500/35 border border-white/10 text-left flex justify-between items-center transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl select-none">{track.flag}</span>
                          <div>
                            <h4 className="font-bold text-sm tracking-tight text-white">{track.name}</h4>
                            <p className="text-[11px] text-neutral-400 font-medium">Broadcast: {track.channel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronRight size={14} className="text-neutral-500" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            ) : (() => {
              const isFinished = match.status === "FINISHED";
              const isHighlights = forcePlaybackMode === "highlights" || (isFinished && match.highlightsUrl && forcePlaybackMode !== "live");
              const showLockedOverlay = !isHighlights && !isFullScreen;

              return (
                /* Player active state */
                <div className="flex flex-col lg:flex-row h-full flex-1 min-h-0 bg-[#030712] relative overflow-hidden">
                  {/* Visual Video Stream Player Column */}
                  <div className="flex-1 p-4 flex flex-col justify-between border-r border-white/5 bg-neutral-950/40 relative">
                    
                    {/* Outer container which holds the video tag and floating overlays for True Fullscreen */}
                    <div
                      ref={playerContainerRef}
                      onMouseMove={resetControlsTimeout}
                      onTouchStart={resetControlsTimeout}
                      style={{ cursor: showControls ? "default" : "none" }}
                      className={`relative overflow-hidden bg-black border border-white/10 flex flex-col justify-between transition-all duration-300 shadow-2xl ${
                        isFullScreen
                          ? "fixed inset-0 z-50 w-full h-full rounded-none border-none aspect-auto"
                          : "aspect-video rounded-3xl"
                      }`}
                    >
                      {/* HTML5 Live Decrypting Player stream */}
                      <video
                        ref={videoRef}
                        playsInline
                        className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
                        onClick={resetControlsTimeout}
                        poster={match.heroImage}
                        onPlaying={() => {
                          setIsPreloading(false);
                        }}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                      />

                      {/* Locked Live Stream Overlay (locks interactions prior to entering Fullscreen) */}
                      {showLockedOverlay && (
                        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40 select-none text-center">
                          <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(20,184,166,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleFullScreenToggle}
                            className="px-6 py-4 rounded-full bg-gradient-to-r from-amber-400 via-teal-400 to-amber-500 text-neutral-950 font-black uppercase font-sans tracking-widest text-[11px] flex items-center gap-3 shadow-[0_20px_50px_rgba(20,184,166,0.3)] cursor-pointer"
                          >
                            <Maximize size={16} className="text-neutral-900 animate-pulse stroke-[3]" />
                            <span>Play Stream in Fullscreen</span>
                          </motion.button>
                          <p className="text-[10px] text-neutral-400 font-mono mt-3 uppercase tracking-wider">
                            Enter Fullscreen to unlock live chat & audio console controls
                          </p>
                        </div>
                      )}

                      {/* OVERLAY SECTION 2: STREAM STATUS INDICATORS (Error & Loader) */}
                      {!streamError && (isPreloading || isConnecting) && (
                        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center z-40 select-none pointer-events-none">
                          <div className="flex flex-col items-center justify-center">
                            {/* Rotating 3D loading soccer ball */}
                            <div className="w-16 h-16 rounded-full border-4 border-t-teal-500 border-r-transparent border-b-teal-500 border-l-transparent animate-spin flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)]">
                              <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] animate-pulse text-center">⚽</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stream Error Diagnosis Overlay Card */}
                      {streamError && (
                        <div className="absolute inset-x-4 bottom-24 max-w-sm sm:max-w-md bg-neutral-950/95 backdrop-blur-md p-4 rounded-2xl border border-red-500/30 text-white shadow-2xl z-40">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                              <ShieldAlert size={18} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="font-display font-black text-xs uppercase tracking-wider text-red-400">Satellite Signal Warning</h4>
                              <p className="text-[10.5px] text-neutral-300 leading-relaxed font-mono">
                                {streamError}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* OVERLAY SECTION 3: FLOATING BOTTOM CONTROLS COCKPIT */}
                      {/* We hide the default dashboard when Locked overlay is shown */}
                      {!showLockedOverlay && (
                        <div className={`absolute bottom-0 sm:bottom-4 left-0 right-0 sm:inset-x-4 bg-[#0a0f1d]/75 backdrop-blur-3xl p-3 border-t sm:border border-white/10 z-30 flex flex-col gap-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.85)] transition-all duration-300 sm:rounded-2xl rounded-none scale-95 sm:scale-100 origin-bottom ${
                          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
                        }`}>
                          
                          {/* HIGHLIGHT VIDEO INTERACTIVE SCRUBBER BAR */}
                          {isHighlights ? (
                            <div className="space-y-1.5 pb-1">
                              {/* Scrubber core elements */}
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setIsPlaying(!isPlaying)}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-lg cursor-pointer transition active:scale-95"
                                  title={isPlaying ? "Pause Highlights" : "Play Highlights"}
                                >
                                  {isPlaying ? <Pause size={12} className="fill-white" /> : <Play size={12} className="fill-white ml-0.5" />}
                                </button>
                                
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleTimelineChange}
                                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
                                  />
                                  <span className="text-[9.5px] font-mono text-neutral-300 font-semibold whitespace-nowrap bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {/* Control keys: Mute / Sound Off, Playback speed, Live Catchup, and full screen toggling */}
                          <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                            {/* Audio and Playback controls (Sound Off Pill is exactly sound toggle) */}
                            <div className="flex items-center gap-2">
                              {!isHighlights && (
                                <button
                                  type="button"
                                  onClick={handleCatchUp}
                                  className="px-2.5 py-1.5 rounded-lg text-[9.5px] font-mono font-black tracking-wider bg-gradient-to-r from-teal-500 to-emerald-500 text-neutral-950 hover:from-teal-400 hover:to-emerald-400 transition-all flex items-center gap-1 cursor-pointer border border-teal-300/30 animate-pulse"
                                  title="Synchronize feed instantly to current live stream"
                                >
                                  <RefreshCw size={9} className="animate-spin" />
                                  <span>SYNC LIVE</span>
                                </button>
                              )}

                              {/* SOUND OFF / SOUND ON pill button (IOS-glaa controls visual layout) */}
                              <button
                                type="button"
                                onClick={() => setIsMuted(!isMuted)}
                                className={`px-2.5 py-1.5 rounded-lg text-[9.5px] font-mono font-black tracking-widest transition-all flex items-center gap-1.5 cursor-pointer border ${
                                  isMuted
                                    ? "bg-rose-500/15 text-rose-300 border-rose-500/25 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                                    : "bg-white/10 text-white hover:bg-white/20 border-white/15"
                                }`}
                                title={isMuted ? "Unmute Audio Stream" : "Mute Stream (Sound Off)"}
                              >
                                {isMuted ? <VolumeX size={10} className="text-rose-400 animate-pulse" /> : <Volume2 size={10} />}
                                <span className="text-[8.5px] uppercase font-bold">{isMuted ? "MUTED" : "SOUND OFF"}</span>
                              </button>

                              {/* Volume slider control */}
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={isMuted ? 0 : volumeLevel}
                                onChange={(e) => {
                                  setVolumeLevel(Number(e.target.value));
                                  setIsMuted(false);
                                }}
                                className="hidden sm:inline-block w-16 sm:w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                                title="Volume Level"
                              />
                            </div>

                            {/* Right side controls (iOS style glass dynamic selection buttons) */}
                            <div className="flex items-center gap-2">
                              {/* 1. Bitrate Profile quality selection dropdown */}
                              <div className="flex items-center gap-0.5 bg-white/10 px-2 py-1 rounded-lg border border-white/15 text-[9.5px] font-mono">
                                <span className="text-teal-400 font-bold uppercase mr-1">{selectedRes === "Auto" ? "Auto" : `${selectedRes}`}</span>
                                <select
                                  value={selectedRes}
                                  onChange={(e) => setSelectedRes(e.target.value)}
                                  className="bg-transparent text-white border-none focus:outline-none cursor-pointer font-bold font-mono text-[9.5px]"
                                  title="Tuning video profile dynamic bitrate"
                                >
                                  {availableResolutions.map((res) => (
                                    <option key={res} value={res} className="bg-neutral-950 text-white text-[10px]">{res}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Simulates a goal overlay for immediate testing */}
                              {!isHighlights && (
                                <button
                                  type="button"
                                  onClick={handleSimulateGoalTrigger}
                                  className="px-2 py-1 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 text-rose-300 text-[9px] font-mono uppercase rounded-lg transition-all"
                                >
                                  ⚽ Goal
                                </button>
                              )}

                              {/* 3. Sliding Live Chat drawer toggle button (available on Fullscreen only as requested) */}
                              {isFullScreen && !isHighlights && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsChatOpenInFullScreen(!isChatOpenInFullScreen);
                                    setIsLanguageListOpen(false); // mutually exclusive
                                  }}
                                  className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                                    isChatOpenInFullScreen
                                      ? "bg-teal-500 text-black border-teal-400"
                                      : "bg-white/10 text-white border-white/15 hover:bg-white/20"
                                  }`}
                                  title="Expand group text & audio chat chatroom"
                                >
                                  <MessageSquare size={11} className="stroke-[2.5]" />
                                </button>
                              )}

                              {/* True Native full-screen switch button */}
                              <button
                                type="button"
                                onClick={handleFullScreenToggle}
                                className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/25 border border-teal-500/20 text-teal-400 transition cursor-pointer active:scale-90"
                                title="Toggle Fullscreen"
                              >
                                {isFullScreen ? <Minimize size={11} className="stroke-[2.5]" /> : <Maximize size={11} className="stroke-[2.5]" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Absolute Sliding Glass Chat Panel for Fullscreen */}
                      <AnimatePresence>
                        {isFullScreen && isChatOpenInFullScreen && !isHighlights && (
                          <motion.div
                            initial={{ x: 350, y: 150, opacity: 0 }}
                            animate={{ x: 0, y: 0, opacity: 1 }}
                            exit={{ x: 350, y: 150, opacity: 0 }}
                            transition={{ type: "spring", damping: 26, stiffness: 220 }}
                            className="absolute right-4 bottom-28 top-4 w-80 bg-[#090d16]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-40"
                          >
                            {/* Heading */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-white/5 select-none">
                              <h4 className="font-display font-black text-[11px] tracking-wider uppercase text-neutral-200 flex items-center gap-1.5">
                                <MessageSquare size={12} className="text-teal-400" />
                                Fullscreen Group chat
                              </h4>
                              <button
                                type="button"
                                onClick={() => setIsChatOpenInFullScreen(false)}
                                className="text-[9px] font-mono font-bold text-neutral-500 hover:text-white"
                              >
                                Hide Dialog
                              </button>
                            </div>

                            {/* Message list */}
                            <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar scroll-smooth">
                              {commentaryChat.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`text-[11px] p-2 rounded-xl transition-all ${
                                    item.isStaff
                                      ? "bg-teal-500/10 border border-teal-500/20 text-teal-100"
                                      : "bg-white/5 hover:bg-white/10 text-neutral-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-extrabold text-[#f3f4f6] tracking-tight flex items-center gap-3">
                                      <span className="select-none">{item.flag}</span>
                                      {item.name}
                                    </span>
                                    {item.uid === auth.currentUser?.uid && item.id && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMessage(item.id)}
                                        className="text-neutral-500 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer pointer-events-auto"
                                        title="Delete Message"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                  </div>
                                  {item.audioData ? (
                                    <VoicePlayer audioData={item.audioData} />
                                  ) : (
                                    <p className="text-neutral-300 leading-normal">{item.msg}</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Forms Message and Voice Message */}
                            <form
                              onSubmit={handleSendMessage}
                              className="pt-2.5 border-t border-white/5 flex gap-1.5 items-center bg-transparent"
                            >
                              {isRecording ? (
                                <div className="flex-1 bg-red-950/40 border border-red-500/20 rounded-xl px-2.5 py-1.5 text-[9.5px] flex items-center justify-between text-red-300 font-mono">
                                  <span className="flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                                    Recording... {recordingSeconds}s
                                  </span>
                                  <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="text-red-400 font-bold uppercase text-[8.5px] underline"
                                  >
                                    STOP & SEND
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Type in fullscreen..."
                                  value={userChatInput}
                                  onChange={(e) => setUserChatInput(e.target.value)}
                                  className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:outline-none border border-white/10 rounded-xl px-2.5 py-1.5 text-xs transition-all"
                                />
                              )}

                              {!isRecording && (
                                <button
                                  type="button"
                                  onClick={startRecording}
                                  className="p-1.5 bg-blue-600/15 hover:bg-blue-600/35 border border-blue-500/20 text-blue-400 rounded-lg cursor-pointer flex items-center justify-center text-center leading-none"
                                >
                                  <Mic size={11} />
                                </button>
                              )}

                              {!isRecording && (
                                <button
                                  type="submit"
                                  className="p-1.5 bg-teal-500 hover:bg-teal-400 text-black rounded-lg cursor-pointer flex items-center justify-center text-center leading-none"
                                >
                                  <Send size={11} />
                                </button>
                              )}
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Standard sidebar chat (Completely disabled under standard modal size, live video only chat shows only in full screen) */}
                  {false && (
                    <div className="w-full lg:w-80 bg-neutral-950 p-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <h4 className="font-display font-bold text-xs tracking-wider uppercase text-neutral-200 flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-teal-400" />
                          LIVE GLOBAL CHAT
                        </h4>
                        <span className="text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                          💬 {Math.floor(25000 + Math.random() * 5000)} online
                        </span>
                      </div>

                      {/* Scrollable messages container */}
                      <div className="flex-1 min-h-[160px] max-h-[220px] lg:max-h-none overflow-y-auto py-2.5 space-y-2 no-scrollbar scroll-smooth">
                        {commentaryChat.map((item, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded-xl transition-all ${
                              item.isStaff
                                ? "bg-teal-500/10 border border-teal-500/20 text-teal-100"
                                : "bg-white/5 hover:bg-white/10 text-neutral-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-extrabold text-[#f3f4f6] tracking-tight flex items-center gap-1">
                                <span className="select-none">{item.flag}</span>
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1">
                                {item.isStaff && (
                                  <span className="text-[9px] font-mono font-black text-teal-400 uppercase tracking-widest leading-none bg-teal-500/10 px-1 rounded">
                                    Official
                                  </span>
                                )}
                                {item.uid === auth.currentUser?.uid && item.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(item.id)}
                                    className="text-neutral-500 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer pointer-events-auto"
                                    title="Delete Message"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {item.audioData ? (
                              <VoicePlayer audioData={item.audioData} />
                            ) : (
                              <p className="text-neutral-300 text-[11px] leading-relaxed break-words">{item.msg}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Messaging prompt field */}
                      <form onSubmit={handleSendMessage} className="pt-3 border-t border-white/10 flex gap-2 items-center">
                        {isRecording ? (
                          <div className="flex-1 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3 py-2 text-[10px] flex items-center justify-between text-rose-300 font-mono">
                            <span className="flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                              Recording Voice... {recordingSeconds}s
                            </span>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="text-rose-400 hover:text-rose-300 font-black uppercase text-[9px] underline cursor-pointer"
                            >
                              STOP & SEND
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Comment something..."
                            value={userChatInput}
                            onChange={(e) => setUserChatInput(e.target.value)}
                            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:border-teal-500 border border-white/10 rounded-xl px-3 py-2 text-xs transition-all"
                          />
                        )}

                        {!isRecording && (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="p-2 bg-blue-600/15 hover:bg-blue-600/35 border border-blue-500/20 text-blue-400 rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center"
                          >
                            <Mic size={12} className="stroke-[2.5]" />
                          </button>
                        )}

                        {!isRecording && (
                          <button
                            type="submit"
                            className="p-2 bg-teal-500 hover:bg-teal-400 text-black rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center"
                          >
                            <Send size={12} className="stroke-[2.5]" />
                          </button>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
