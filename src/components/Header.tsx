import React from "react";
import { Sun, Moon, Trophy, Radio, ShieldAlert, KeyRound, LogOut, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "firebase/auth";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  activeMatchesCount: number;
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  isAdmin: boolean;
  onOpenAdminPanel: () => void;
}

export default function Header({
  darkMode,
  setDarkMode,
  activeMatchesCount,
  user,
  onLoginClick,
  onLogoutClick,
  isAdmin,
  onOpenAdminPanel,
}: HeaderProps) {
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Main Glassmorphic Header */}
      <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-[#090d16]/80 border-b border-black/5 dark:border-white/10 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Brand - ONLY showing smaller icon as requested */}
        <div className="flex items-center gap-1.5">
          <motion.div
            initial={{ rotate: -15, scale: 0.85 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-md shadow-emerald-500/15"
            title="FIFA World Cup Live Match Cast"
          >
            <Trophy size={14} className="stroke-[2.5]" />
          </motion.div>
        </div>

        {/* Right Side Options */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* Admin panel launcher option top of app */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAdminPanel}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/15"
              title="Launch Live Settings Editor"
            >
              <KeyRound size={13} />
              <span>Admin Panel</span>
            </motion.button>
          )}

          {/* User auth state profile summary */}
          <div className="flex items-center gap-2 border-l border-neutral-300 dark:border-neutral-800 pl-3">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full border border-teal-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 text-teal-400 border border-teal-500 flex items-center justify-center text-xs font-bold font-mono">
                    <UserIcon size={14} />
                  </div>
                )}
                
                <div className="hidden lg:block text-left leading-none">
                  <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[100px]">
                    {user.displayName || user.email?.split("@")[0]}
                  </p>
                  <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                    {isAdmin ? "ADMIN PRIVILEGE" : "BROADCAST VISITOR"}
                  </p>
                </div>

                <button
                  onClick={onLogoutClick}
                  className="p-2 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-white transition cursor-pointer active:scale-95"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer transition active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-slate-100/10 hover:bg-slate-100/20 text-neutral-800 dark:text-neutral-200 transition-all duration-300 shadow-sm active:scale-90 cursor-pointer"
            id="theme-toggle-btn"
            title="Toggle theme mode"
          >
            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 180 : 0, scale: [0.9, 1.1, 1] }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {darkMode ? (
                <Sun size={15} className="text-amber-400 fill-amber-300/10" />
              ) : (
                <Moon size={15} className="text-indigo-950 fill-indigo-950/10" />
              )}
            </motion.div>
          </button>
        </div>
      </div>
    </header>
  );
}
