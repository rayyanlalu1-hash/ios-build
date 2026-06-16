import React from "react";
import { Play } from "lucide-react";
import { Match } from "../types";

interface NetflixHeroProps {
  match: Match;
  onOpenStream: () => void;
  matches?: Match[];
  onSelectMatch?: (matchId: string) => void;
}

export default function NetflixHero({ match, onOpenStream }: NetflixHeroProps) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";

  return (
    <section className="relative w-full min-h-[380px] sm:min-h-[480px] md:min-h-[580px] lg:min-h-[645px] overflow-hidden mb-8 flex flex-col justify-end bg-transparent select-none rounded-3xl">
      {/* Background Hero Image with Fade-out Overlay */}
      <div className="absolute inset-0 z-0 bg-neutral-950">
        <img
          src={match.heroImage}
          alt={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
          className="w-full h-full object-cover object-center scale-100 filter brightness-[0.4] transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        {/* Dynamic mesh gradient thumbnail overlay based on team colors */}
        <div 
          className="absolute inset-0 opacity-30 mix-blend-color-dodge transition-all duration-500"
          style={{
            backgroundImage: `radial-gradient(ellipse at top left, ${match.homeTeam.color}60 0%, transparent 60%), radial-gradient(ellipse at bottom right, ${match.awayTeam.color}50 0%, transparent 70%)`
          }}
        />
        {/* Cinematic gradients matching the Stranger Things style */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent"></div>
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 bg-gradient-to-r from-[#030712]/95 via-[#030712]/40 to-transparent pointer-events-none"></div>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-4xl px-6 sm:px-12 md:px-16 pb-12 sm:pb-16 flex flex-col items-start gap-3 sm:gap-5 text-white text-left">
        
        {/* FIFA World Cup Icon Tag */}
        <div className="flex items-center gap-2 select-none font-sans">
          <img 
            src="/src/assets/images/fifa_badge_1781431615884.jpg" 
            alt="FIFA World Cup Trophy Logo" 
            className="w-12 h-16 object-contain rounded-md filter brightness-110 contrast-105"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-amber-400 font-black text-base tracking-widest leading-none font-display">FIFA</span>
            <span className="text-neutral-300 text-[8px] tracking-[0.2em] uppercase font-black font-mono mt-1 leading-none">WORLD CUP</span>
          </div>
        </div>

        {/* Cinematic Bold Header (Stranger Things typeface feel) */}
        <h1 className="font-sans font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter uppercase leading-none select-all drop-shadow-[0_5px_15px_rgba(0,0,0,0.95)] max-w-3xl">
          <span className="block text-white font-black">{match.homeTeam.name}</span>
          <span className="block text-lg sm:text-2xl font-light text-neutral-400 lowercase tracking-widest my-1 pb-1 font-serif opacity-80">vs</span>
          <span className="block text-red-600 font-extrabold tracking-tight filter brightness-110 drop-shadow-[0_2px_10px_rgba(220,38,38,0.3)]">{match.awayTeam.name}</span>
        </h1>

        {/* TOP 10 Badge & real-time metadata */}
        <div className="flex flex-wrap items-center gap-2.5 select-none py-1">
          <div className="bg-[#e50914] text-white font-black text-[9px] sm:text-[10px] tracking-tight px-1.5 py-0.5 rounded shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center font-sans">
            TOP 10
          </div>
          <span className="text-xs font-bold text-white tracking-wide uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            #1 in Live Streams Today
          </span>
          {isLive && (
            <span className="ml-2 flex items-center gap-1 bg-red-650/45 text-white border border-red-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              Live {match.minute}'
            </span>
          )}
          {isFinished && (
            <span className="ml-2 bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
              Finished
            </span>
          )}
          {isLive && match.liveUploadTime && (
            <span className="ml-2 bg-[#030712]/80 text-[#14b8a6] border border-[#14b8a6]/30 px-2 py-0.5 rounded text-[9.5px] font-mono font-extrabold uppercase">
              🕒 {match.liveUploadTime}
            </span>
          )}
          {isFinished && match.highlightsUploadTime && (
            <span className="ml-2 bg-[#030712]/80 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded text-[9.5px] font-mono font-extrabold uppercase">
              🕒 {match.highlightsUploadTime}
            </span>
          )}
        </div>

        {/* Elegant Cinematic Description */}
        <p className="text-xs sm:text-sm md:text-base text-neutral-300 max-w-2xl leading-relaxed font-sans font-medium drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
          When world-class football titans clash on the absolute highest level, a legendary match arises. Watch multi-camera premium streams, live tactical overlays, and immersive stadium audio broadcast in elite decrypted ultra HD.
        </p>

        {/* Action Controls - Play & More Info Buttons exactly matching image */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 font-sans">
          {/* Play Button */}
          <button
            onClick={onOpenStream}
            className="flex items-center justify-center gap-2 px-6 py-2 sm:px-8 sm:py-3 bg-white text-black hover:bg-neutral-200 active:scale-95 transition-all duration-200 font-bold text-sm sm:text-base rounded shadow-lg opacity-95 hover:opacity-100 cursor-pointer"
            id="netflix-play-btn"
          >
            <Play size={16} className="fill-black stroke-none" />
            <span>Play</span>
          </button>

          {/* More Info Button */}
          <button
            onClick={onOpenStream}
            className="flex items-center justify-center gap-2 px-6 py-2 sm:px-8 sm:py-3 bg-neutral-600/60 hover:bg-neutral-600/85 active:scale-95 transition-all duration-200 text-white font-bold text-sm sm:text-base rounded select-none border border-white/10 shadow-lg backdrop-blur-md cursor-pointer"
            id="netflix-info-btn"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-white/80 text-[10px] font-serif font-black leading-none pb-0.5">i</span>
            <span>More Info</span>
          </button>
        </div>

      </div>

      {/* Right side TV-14 warning badge overlay */}
      <div className="absolute right-0 bottom-16 sm:bottom-20 z-20 flex items-center pr-4 sm:pr-8 md:pr-12 pointer-events-none select-none">
        <div className="flex items-center gap-3 bg-black/35 backdrop-blur-xs pl-3.5 pr-6 py-1.5 border-l-[3px] border-neutral-100 text-[10px] sm:text-xs font-mono tracking-widest text-neutral-300 font-bold uppercase">
          TV-14
        </div>
      </div>
    </section>
  );
}
