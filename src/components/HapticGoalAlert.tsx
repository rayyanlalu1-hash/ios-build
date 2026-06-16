import React from "react";
import { Zap, Volume2, Sparkles, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HapticGoalAlertProps {
  isOpen: boolean;
  onClose: () => void;
  teamCode: string;
  teamFlag: string;
  opponentCode: string;
  scorer: string;
  minute: number;
}

export default function HapticGoalAlert({
  isOpen,
  onClose,
  teamCode,
  teamFlag,
  opponentCode,
  scorer,
  minute
}: HapticGoalAlertProps) {
  const [hapticLog, setHapticLog] = React.useState<string>("Idle");

  // Attempt standard HTML5 vibration haptics on device mount
  React.useEffect(() => {
    if (isOpen) {
      triggerHapticPattern("goal");
    }
  }, [isOpen]);

  const triggerHapticPattern = (type: "goal" | "stadium" | "rumble" | "pulse") => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      if (type === "goal") {
        navigator.vibrate([150, 80, 150, 80, 300, 100, 400]);
        setHapticLog("🫨 [VIB_GOAL_BOOM] Success: 150ms-80ms-150ms-80ms-300ms");
      } else if (type === "stadium") {
        navigator.vibrate([200, 100, 200, 100, 200, 100, 500]);
        setHapticLog("🫨 [VIB_STADIUM_RUMBLE] Success: Severe amplitude 1200ms sequence");
      } else if (type === "pulse") {
        navigator.vibrate([80, 50, 80, 50, 80, 50, 80]);
        setHapticLog("🫨 [VIB_DRIBBLE_PULSE] Success: Light tactical 640ms pulse");
      } else {
        navigator.vibrate([500]);
        setHapticLog("🫨 [VIB_SHORT_EXPLOSION] Success: Sharp 500ms haptic trigger");
      }
    } else {
      setHapticLog("⚠️ [HAPTIC_ENGINE] Notice: Navigator vibration unsupported on this client browser. Falling back to rich CSS Screen Shake!");
    }
  };

  // Falling Confetti mock array
  const confettiParticles = React.useMemo(() => {
    return [...Array(32)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      size: `${Math.floor(Math.random() * 8 + 4)}px`,
      color: ["#14b8a6", "#3b82f6", "#e11d48", "#f59e0b", "#10b981"][Math.floor(Math.random() * 5)]
    }));
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          {/* Intense flashing background screen shake mask */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-0 animate-shake"></div>

          {/* Falling Confetti Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: -50, opacity: 0, rotate: 0 }}
                animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 360 }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: parseFloat(p.delay)
                }}
                style={{
                  position: "absolute",
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                }}
              />
            ))}
          </div>

          {/* Alert Celebratory card */}
          <motion.div
            initial={{ scale: 0.8, rotate: -2, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-md bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-teal-400 text-white p-8 rounded-3xl relative z-20 text-center shadow-2xl shadow-teal-500/25"
          >
            {/* Header info */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase font-mono bg-rose-600 px-3 py-1.5 rounded-full border border-rose-400/20 text-white font-black animate-pulse flex items-center gap-1.5 mx-auto">
                <Sparkles size={11} />
                MATCH MILESTONE
              </span>
            </div>

            {/* Giant Goal Text */}
            <motion.h2
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="font-display font-black text-6xl md:text-7xl tracking-tighter bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent uppercase drop-shadow-md pb-2 select-none"
            >
              GOOOOOAL!
            </motion.h2>

            <p className="text-sm text-neutral-400 font-sans tracking-tight uppercase">
              {teamFlag} {teamCode} has found the back of the net vs {opponentCode}!
            </p>

            {/* Live Scorer highlights info */}
            <div className="my-8 p-5 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden backdrop-blur-md">
              <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-1.5 font-mono">
                {minute}' SCORER PROFILE
              </div>
              <h3 className="font-display font-black text-2xl text-white">{scorer}</h3>
              <p className="text-xs text-neutral-400 font-medium leading-none mt-1 uppercase">
                Goal scored for {teamFlag} {teamCode}
              </p>
              <div className="absolute top-[10%] right-[10%] opacity-15">
                <span className="text-6xl">⚽</span>
              </div>
            </div>

            {/* Simulated Haptic diagnostics banner */}
            <div className="bg-black/80 rounded-2xl border border-white/5 p-3 text-left space-y-1 text-xs mb-6 font-mono select-none">
              <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-wider">HAPTIC DIAGNOSTICS:</p>
              <p className="text-[11px] text-teal-400 leading-normal font-mono">{hapticLog}</p>
            </div>

            {/* Manual Vibrator preset keys requested specifically for feedback showcase */}
            <div className="space-y-2.5">
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider text-center">
                Test Vibration On Your Smartphone
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerHapticPattern("goal")}
                  className="px-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white rounded-xl text-[10px] font-mono leading-none border border-white/10 cursor-pointer uppercase transition-all"
                >
                  🥅 Goal Boom
                </button>
                <button
                  onClick={() => triggerHapticPattern("stadium")}
                  className="px-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white rounded-xl text-[10px] font-mono leading-none border border-white/10 cursor-pointer uppercase transition-all"
                >
                  🌋 Rumble
                </button>
                <button
                  onClick={() => triggerHapticPattern("pulse")}
                  className="px-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white rounded-xl text-[10px] font-mono leading-none border border-white/10 cursor-pointer uppercase transition-all"
                >
                  💓 Dribble
                </button>
              </div>
            </div>

            {/* Acknowledge Action CTA */}
            <button
              onClick={onClose}
              className="mt-8 w-full py-4 bg-teal-400 hover:bg-teal-300 text-black font-display font-black tracking-tight uppercase rounded-2xl shadow-xl transition-all cursor-pointer active:scale-95"
              id="acknowledge-goal-btn"
            >
              Resume Stream
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
