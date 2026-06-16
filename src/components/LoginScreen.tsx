import React from "react";
import { loginWithEmail, registerWithEmail } from "../lib/firebase";
import { Trophy, Shield, Mail, Lock, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorLog, setErrorLog] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorLog("Please fill in both email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorLog("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorLog(null);
    setSuccessMsg(null);

    try {
      if (isRegistering) {
        const user = await registerWithEmail(email, password);
        setSuccessMsg("Account registered successfully! Initiating dashboard session...");
        setTimeout(() => {
          onLoginSuccess(user);
        }, 1200);
      } else {
        const user = await loginWithEmail(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error("Authentication Error:", err);
      let readableError = "Authentication failed. Please check your credentials.";
      
      const errStr = (err.code || err.message || "").toLowerCase();
      if (errStr.includes("email-already-in-use")) {
        readableError = "This email is already registered. Please sign in instead.";
      } else if (errStr.includes("invalid-email")) {
        readableError = "Please enter a valid email address.";
      } else if (errStr.includes("weak-password")) {
        readableError = "The password is too weak. Please use at least 6 characters.";
      } else if (
        errStr.includes("wrong-password") || 
        errStr.includes("user-not-found") || 
        errStr.includes("invalid-credential") ||
        errStr.includes("invalid-login-credentials")
      ) {
        readableError = "Incorrect email or password. Please try again or register if you don't have an account.";
      } else if (err.message) {
        readableError = err.message;
      }
      setErrorLog(readableError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] flex items-center justify-center p-4 selection:bg-teal-500 overflow-y-auto no-scrollbar">
      {/* iOS style beautiful ambient mesh background */}
      <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      {/* Main Container Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="w-full max-w-md p-6 sm:p-8 my-auto rounded-3xl backdrop-blur-3xl bg-white/5 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden text-center text-white"
        id="login-card-root"
      >
        {/* Stadium line markings decorative header */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent"></div>

        {/* Brand & Trophy */}
        <div className="space-y-3">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 5, duration: 1.5 }}
            className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/20"
          >
            <Trophy size={28} className="stroke-[2.5]" />
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight uppercase bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              FIFA TV MATCHES
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-teal-400 font-bold">
              Immersive 2026 Broadcasting
            </p>
          </div>
        </div>

        {/* Tab Selector: Sign In vs Register */}
        <div className="grid grid-cols-2 p-1 bg-black/40 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setErrorLog(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRegistering
                ? "bg-teal-500 text-black shadow-lg"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <LogIn size={12} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setErrorLog(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isRegistering
                ? "bg-teal-500 text-black shadow-lg"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <UserPlus size={12} />
            <span>Register</span>
          </button>
        </div>

        {/* Typed Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {errorLog && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2"
            >
              <span className="select-none">⚠️</span>
              <p>{errorLog}</p>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2"
            >
              <span className="select-none">✅</span>
              <p>{successMsg}</p>
            </motion.div>
          )}

          {/* Email Address Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-neutral-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-neutral-950/80 border border-white/10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pl-10 pr-4 py-3 rounded-2xl text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Password (min. 6 chars)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-neutral-500">
                <Lock size={14} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-neutral-950/80 border border-white/10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pl-10 pr-10 py-3 rounded-2xl text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-neutral-500 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl transition shadow-lg shadow-teal-500/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>
            ) : isRegistering ? (
              <>
                <UserPlus size={14} className="stroke-[2.5]" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn size={14} className="stroke-[2.5]" />
                <span>Access Stream Dashboard</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Info Box */}
        <div className="text-[10px] text-neutral-500 font-sans leading-relaxed text-left bg-black/20 p-3.5 rounded-2xl border border-white/5 space-y-1">
          <p className="font-bold text-neutral-400 uppercase tracking-widest text-[9px]">💡 Device Local Persistence</p>
          <p>Once logged in, your satellite session matches credentials will be persistently stored strictly on this device so you don&apos;t have to log in again on app restarts.</p>
        </div>

        {/* Footer info lock */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider font-mono text-neutral-500">
          <Shield size={10} className="text-teal-500/70" />
          <span>Secured Device Token Persistence Encrypted Gateway</span>
        </div>
      </motion.div>
    </div>
  );
}
