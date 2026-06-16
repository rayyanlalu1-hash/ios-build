import React from "react";
import { Radio, Calendar, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Match } from "../types";

interface MatchesSliderProps {
  matches: Match[];
  selectedMatchId: string;
  onSelectMatch: (matchId: string) => void;
}

export default function MatchesSlider({ matches, selectedMatchId, onSelectMatch }: MatchesSliderProps) {
  return (
    <div className="mb-4 space-y-2 select-none">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-display font-black text-[9px] uppercase tracking-widest text-[#14b8a6] flex items-center gap-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]">
          <span className="w-1 h-1 rounded-full bg-teal-400 animate-ping"></span>
          CHAMPIONSHIP SCOREBOARD LIVE FEED
        </h3>
      </div>

      {/* Horizontal Scroller Carousel - Made Extremely Compact with No Scrollbar, Apple-inspired layout */}
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
        {matches.map((m) => {
          const isSelected = m.id === selectedMatchId;
          const isLive = m.status === "LIVE";
          const isFinished = m.status === "FINISHED";

          return (
            <motion.div
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              key={m.id}
              onClick={() => onSelectMatch(m.id)}
              className={`flex-shrink-0 w-48 p-3 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-md relative ${
                isSelected
                  ? "bg-neutral-800/90 border border-neutral-400 dark:border-white/20 shadow-lg text-white"
                  : "bg-white/5 hover:bg-white/10 dark:bg-neutral-900/40 dark:hover:bg-neutral-800/60 border border-neutral-200/10 dark:border-white/5 text-neutral-950 dark:text-neutral-200"
              }`}
            >
              {/* Card Meta Status Header */}
              <div className="flex justify-between items-center mb-1.5 bg-black/10 dark:bg-black/30 px-2 py-0.5 rounded-lg text-[8px] font-mono select-none">
                <span className={`font-bold uppercase tracking-wider ${isSelected ? "text-cyan-400" : "text-neutral-400"}`}>
                  {m.group}
                </span>

                {/* Live indicators */}
                {isLive ? (
                  <span className="flex items-center gap-0.5 text-[8px] text-red-500 font-extrabold animate-pulse">
                    <span className="w-1 h-3 rounded bg-red-500 block"></span>
                    LIVE
                  </span>
                ) : isFinished ? (
                  <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-widest">
                    FINAL
                  </span>
                ) : (
                  <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wider">
                    READY
                  </span>
                )}
              </div>

              {/* Score breakdown row with display flags */}
              <div className="flex justify-between items-center py-0.5">
                {/* Home */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-base select-none">{m.homeTeam.flag}</span>
                  <span className="font-mono font-black text-[10px] truncate uppercase tracking-tight">
                    {m.homeTeam.code}
                  </span>
                </div>

                {/* Live Score/VS indicator Column */}
                <div className="px-2 text-center font-mono font-black text-[11px]">
                  {m.status !== "SCHEDULED" ? (
                    <span className={isLive ? "text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded" : "text-neutral-400"}>
                      {m.homeScore} : {m.awayScore}
                    </span>
                  ) : (
                    <span className="text-[8px] text-neutral-500 tracking-widest bg-neutral-800/30 px-1 py-0.5 rounded">VS</span>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end text-right">
                  <span className="font-mono font-black text-[10px] truncate uppercase tracking-tight">
                    {m.awayTeam.code}
                  </span>
                  <span className="text-base select-none">{m.awayTeam.flag}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
