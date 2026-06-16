import React from "react";
import { BarChart3, Star, Percent, Shield, Zap, CircleAlert, Flame, Compass } from "lucide-react";
import { Match } from "../types";

interface StatsDashboardProps {
  match: Match;
}

export default function StatsDashboard({ match }: StatsDashboardProps) {
  const { stats } = match;

  // Render a side-by-side bar compare row
  const StatRow = ({
    title,
    homeVal,
    awayVal,
    icon: Icon,
    isPercentage = false,
    formatAsFloat = false
  }: {
    title: string;
    homeVal: number;
    awayVal: number;
    icon?: any;
    isPercentage?: boolean;
    formatAsFloat?: boolean;
  }) => {
    const total = homeVal + awayVal || 1;
    const homePercent = (homeVal / total) * 100;
    const awayPercent = (awayVal / total) * 100;

    const displayHome = formatAsFloat ? homeVal.toFixed(2) : isPercentage ? `${homeVal}%` : homeVal;
    const displayAway = formatAsFloat ? awayVal.toFixed(2) : isPercentage ? `${awayVal}%` : awayVal;

    return (
      <div className="p-4 rounded-2xl glass-card flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-xs font-mono text-neutral-500 dark:text-neutral-400 font-bold select-none">
          <span className="text-left font-display text-neutral-800 dark:text-white text-sm">
            {displayHome}
          </span>
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            {Icon && <Icon size={12} className="text-teal-500" />}
            {title}
          </span>
          <span className="text-right font-display text-neutral-800 dark:text-white text-sm">
            {displayAway}
          </span>
        </div>

        {/* Triple-layer progressive comparison bar line */}
        <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
          <div
            style={{ width: `${homePercent}%` }}
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700 rounded-l-full"
          />
          <div
            style={{ width: `${awayPercent}%` }}
            className="h-full bg-gradient-to-r from-red-400 to-rose-600 transition-all duration-700 rounded-r-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard Heading */}
      <div className="flex items-center gap-2 select-none">
        <div className="p-2 bg-teal-500/10 text-teal-500 dark:text-teal-400 rounded-xl border border-teal-500/15">
          <BarChart3 size={16} />
        </div>
        <div>
          <h3 className="font-display font-black text-xl tracking-tight uppercase text-neutral-900 dark:text-white mt-1">
            Match Analytics Center
          </h3>
          <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
            Detailed Live Performance Indexes
          </p>
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Possession Ring (Circular stats card) */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between md:row-span-2">
          <div>
            <h4 className="font-display font-bold text-xs uppercase text-neutral-400 tracking-wider flex items-center gap-1">
              <Percent size={13} className="text-teal-400" />
              Ball Possession %
            </h4>
            <p className="text-[10px] text-neutral-500 mt-1">Domination status on field</p>
          </div>

          <div className="relative py-8 flex justify-center items-center">
            {/* Visual Arc gauge using standard HTML/CSS */}
            <svg width="150" height="150" viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background trace */}
              <circle cx="50" cy="50" r="40" stroke="rgba(239, 68, 68, 0.7)" strokeWidth="8" fill="transparent" />
              {/* Home possession fill */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgb(20, 184, 166)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${stats.possession[0] * 2.51} 251`}
                className="transition-all duration-1000"
              />
            </svg>

            {/* Inner absolute content box */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
              <span className="font-display font-black text-3xl text-neutral-900 dark:text-white leading-none">
                {stats.possession[0]}%
              </span>
              <span className="text-[10px] text-teal-500 font-semibold uppercase tracking-widest mt-1">
                {match.homeTeam.code} Control
              </span>
              <span className="text-[9px] text-neutral-400 uppercase mt-0.5 font-mono">
                {match.awayTeam.code}: {stats.possession[1]}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold pt-3 border-t border-black/5 dark:border-white/5 font-mono text-neutral-400">
            <span>⚽ Pass Control</span>
            <span className="text-teal-400">Tactical Advantage</span>
          </div>
        </div>

        {/* Performance indexes Bento items */}
        <StatRow title="Expected Goals (xG)" homeVal={stats.xg[0]} awayVal={stats.xg[1]} icon={Flame} formatAsFloat={true} />
        <StatRow title="Total Shots Taken" homeVal={stats.shots[0]} awayVal={stats.shots[1]} icon={Zap} />
        <StatRow title="Shots On Target" homeVal={stats.shotsOnTarget[0]} awayVal={stats.shotsOnTarget[1]} icon={Star} />
        <StatRow title="Fouls Committed" homeVal={stats.fouls[0]} awayVal={stats.fouls[1]} icon={CircleAlert} />

        {/* Custom Bento Card for Bookings & Offsides */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <h4 className="font-display font-bold text-xs uppercase text-neutral-400 tracking-wider flex items-center gap-1 select-none">
            <Shield size={13} className="text-rose-500" />
            Discipline & Penalties
          </h4>

          <div className="flex gap-4 py-3">
            {/* Home Discipline */}
            <div className="flex-1 space-y-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono block">
                {match.homeTeam.code} Cards
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-500 px-2.5 py-1 rounded-xl border border-yellow-400/20">
                  <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm"></span>
                  <span className="text-xs font-bold font-mono">{stats.yellowCards[0]}</span>
                </div>
                <div className="flex items-center gap-1 bg-rose-600/10 text-rose-500 px-2.5 py-1 rounded-xl border border-rose-500/20">
                  <span className="w-2.5 h-3.5 bg-rose-500 rounded-sm"></span>
                  <span className="text-xs font-bold font-mono">{stats.redCards[0]}</span>
                </div>
              </div>
            </div>

            {/* divider */}
            <div className="w-[1.5px] bg-neutral-200 dark:bg-neutral-800 self-stretch"></div>

            {/* Away Discipline */}
            <div className="flex-1 space-y-2 text-right">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono block">
                {match.awayTeam.code} Cards
              </span>
              <div className="flex items-center gap-2 justify-end">
                <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-500 px-2.5 py-1 rounded-xl border border-yellow-400/20">
                  <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm"></span>
                  <span className="text-xs font-bold font-mono">{stats.yellowCards[1]}</span>
                </div>
                <div className="flex items-center gap-1 bg-rose-600/10 text-rose-500 px-2.5 py-1 rounded-xl border border-rose-500/20">
                  <span className="w-2.5 h-3.5 bg-rose-500 rounded-sm"></span>
                  <span className="text-xs font-bold font-mono">{stats.redCards[1]}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-neutral-400 mt-2 font-mono text-center bg-black/5 dark:bg-white/5 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
            Ref: {match.referee}
          </p>
        </div>

        {/* Passes Bento Panel */}
        <div className="p-5 rounded-2xl glass-card flex flex-col justify-between">
          <h4 className="font-display font-bold text-xs uppercase text-neutral-400 tracking-wider flex items-center gap-1 select-none">
            <Compass size={13} className="text-teal-400" />
            Accuracy & Setup
          </h4>

          <div className="space-y-4 py-2">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                <span>Pass Completion</span>
                <span className="font-bold text-teal-400">
                  {stats.passAccuracy[0]}% vs {stats.passAccuracy[1]}%
                </span>
              </div>
              <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${stats.passAccuracy[0]}%` }} className="h-full bg-teal-500" />
                <div style={{ width: `${stats.passAccuracy[1]}%` }} className="h-full bg-rose-500" />
              </div>
            </div>

            <div className="flex justify-between text-center select-none pt-2.5">
              <div className="flex-1">
                <span className="block text-xs font-bold text-neutral-400">Passes</span>
                <span className="font-display font-black text-sm text-neutral-700 dark:text-neutral-100">
                  {stats.passes[0]}
                </span>
              </div>
              <div className="w-[1px] bg-neutral-200 dark:bg-neutral-800 self-stretch"></div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-neutral-400">Offsides</span>
                <span className="font-display font-black text-sm text-neutral-700 dark:text-neutral-100">
                  {stats.offsides[0]} - {stats.offsides[1]}
                </span>
              </div>
              <div className="w-[1px] bg-neutral-200 dark:bg-neutral-800 self-stretch"></div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-neutral-400">Corners</span>
                <span className="font-display font-black text-sm text-neutral-700 dark:text-neutral-100">
                  {stats.corners[0]} - {stats.corners[1]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
