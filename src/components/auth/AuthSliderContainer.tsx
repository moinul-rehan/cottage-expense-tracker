"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/login/actions";
import { signup } from "@/app/signup/actions";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/google-icon";
import { Logo } from "@/components/logo";
import { AtSign, Lock, Eye, EyeOff, Home, User } from "lucide-react";

type AuthMode = "login" | "signup";

interface AuthSliderContainerProps {
  initialMode: AuthMode;
  loginError?: string | null;
  signupError?: string | null;
  signupDetail?: string | null;
}

export function AuthSliderContainer({
  initialMode,
  loginError,
  signupError,
  signupDetail,
}: AuthSliderContainerProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const isSignup = mode === "signup";

  // Login form state
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function toggleMode(targetMode: AuthMode) {
    setMode(targetMode);
    const newPath = targetMode === "signup" ? "/signup" : "/login";
    window.history.pushState(null, "", newPath);
  }

  function handleGoogleLogin() {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?mode=login` },
    });
  }

  function handleGoogleSignup() {
    const cottageNameInput = document.getElementById("signup_cottage_name") as HTMLInputElement | null;
    const cottageName = cottageNameInput?.value.trim() || "My Cottage";

    document.cookie = `pending_cottage_name=${encodeURIComponent(cottageName)}; path=/; max-age=600; samesite=lax`;

    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?mode=create_cottage` },
    });
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center bg-[#FDFBF9] overflow-hidden selection:bg-[#D1593B] selection:text-white">
      {/* Desktop Container (lg screens and above) */}
      <div className="relative hidden w-full min-h-svh lg:flex">
        {/* ================= LOGIN FORM (LEFT SIDE in Login Mode) ================= */}
        <div
          className={`flex w-1/2 flex-col justify-center px-12 xl:px-24 py-12 transition-all duration-700 ${
            isSignup ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
        >
          <div className="mx-auto flex w-full max-w-md flex-col gap-6">
            {/* Header Title & Subtitle matching Figma */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-[#D1593B] sm:text-4xl">
                Login
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-[#6B727E]">
                Sign in to your{" "}
                <span className="inline-flex items-center gap-1 rounded-md bg-[#D1593B] px-2 py-0.5 text-xs font-semibold text-white">
                  <Logo size={14} /> Cottage
                </span>{" "}
                account as a member
              </p>
            </div>

            {(loginError || loginState?.error) && (
              <p className="rounded-xl bg-red-50 p-3.5 text-center text-xs font-medium text-[#CC4F4F] border border-red-100">
                {loginError || loginState?.error}
              </p>
            )}

            <form action={loginAction} className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login_email" className="text-xs font-medium text-[#404040]">
                  Email <span className="text-[#CC4F4F]">*</span>
                </label>
                <div className="relative flex items-center">
                  <AtSign className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                  <input
                    id="login_email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="johndoe@gmail.com"
                    className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-4 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login_password" className="text-xs font-medium text-[#404040]">
                  Password <span className="text-[#CC4F4F]">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                  <input
                    id="login_password"
                    name="password"
                    type={showLoginPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-10 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 text-[#9CA3AF] hover:text-[#404040]"
                  >
                    {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Link
                  href="/forgot-password"
                  className="self-start text-xs font-medium text-[#CC4F4F] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginPending}
                className="mt-2 h-12 w-full rounded-full bg-[#D1593B] font-semibold text-white transition-all hover:bg-[#B8472C] active:scale-[0.99] disabled:opacity-70 shadow-md shadow-[#D1593B]/20"
              >
                {loginPending ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="w-full border-t border-[#EEEEEE]" />
              <span className="absolute left-1/2 -translate-x-1/2 bg-[#FDFBF9] px-3 text-xs text-[#9CA3AF]">
                Or
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[#EEEEEE] bg-[#EEEEEE]/70 font-semibold text-xs text-[#242424] transition-all hover:bg-[#EEEEEE] active:scale-[0.99]"
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </button>
          </div>
        </div>

        {/* ================= REGISTER FORM (LEFT SIDE in Signup Mode) ================= */}
        <div
          className={`flex w-1/2 flex-col justify-center px-12 xl:px-24 py-12 transition-all duration-700 ${
            !isSignup ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
        >
          <div className="mx-auto flex w-full max-w-md flex-col gap-5">
            {/* Header Title & Subtitle matching Figma */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-[#D1593B] sm:text-4xl">
                Register
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-[#6B727E]">
                Sign up for new{" "}
                <span className="inline-flex items-center gap-1 rounded-md bg-[#D1593B] px-2 py-0.5 text-xs font-semibold text-white">
                  <Logo size={14} /> Cottage
                </span>{" "}
                • You&apos;ll be its admin
              </p>
            </div>

            {(signupError || signupState?.error) && (
              <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-medium text-[#CC4F4F] border border-red-100">
                {signupError || signupState?.error}
                {signupDetail && <span className="mt-1 block font-mono text-[11px] opacity-80">{signupDetail}</span>}
              </p>
            )}

            <form action={signupAction} className="flex flex-col gap-3.5">
              {/* Cottage Name Input */}
              <div className="flex flex-col gap-1">
                <label htmlFor="signup_cottage_name" className="text-xs font-medium text-[#404040]">
                  Cottage Name
                </label>
                <div className="relative flex items-center">
                  <Home className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                  <input
                    id="signup_cottage_name"
                    name="cottage_name"
                    type="text"
                    required
                    placeholder="e.g. Green Road Cottage"
                    className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-4 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                  />
                </div>
              </div>

              {/* First Name & Last Name (2 columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup_first_name" className="text-xs font-medium text-[#404040]">
                    First Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                    <input
                      id="signup_first_name"
                      name="first_name"
                      type="text"
                      required
                      placeholder="John"
                      className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-3 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="signup_last_name" className="text-xs font-medium text-[#404040]">
                    Last Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                    <input
                      id="signup_last_name"
                      name="last_name"
                      type="text"
                      placeholder="Doe"
                      className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-3 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1">
                <label htmlFor="signup_email" className="text-xs font-medium text-[#404040]">
                  Email <span className="text-[#CC4F4F]">*</span>
                </label>
                <div className="relative flex items-center">
                  <AtSign className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                  <input
                    id="signup_email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="johndoe@gmail.com"
                    className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-4 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                  />
                </div>
              </div>

              {/* Password & Confirm Password (2 columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="signup_password" className="text-xs font-medium text-[#404040]">
                    Password <span className="text-[#CC4F4F]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                    <input
                      id="signup_password"
                      name="password"
                      type={showSignupPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="••••"
                      className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-8 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-2.5 text-[#9CA3AF] hover:text-[#404040]"
                    >
                      {showSignupPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="signup_confirm_password" className="text-xs font-medium text-[#404040]">
                    Confirm <span className="text-[#CC4F4F]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                    <input
                      id="signup_confirm_password"
                      name="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="••••"
                      className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-8 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 text-[#9CA3AF] hover:text-[#404040]"
                    >
                      {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={signupPending}
                className="mt-1.5 h-11 w-full rounded-full bg-[#D1593B] font-semibold text-xs text-white transition-all hover:bg-[#B8472C] active:scale-[0.99] disabled:opacity-70 shadow-md shadow-[#D1593B]/20"
              >
                {signupPending ? "Creating your cottage…" : "Sign up for a new Cottage"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-0.5">
              <div className="w-full border-t border-[#EEEEEE]" />
              <span className="absolute left-1/2 -translate-x-1/2 bg-[#FDFBF9] px-3 text-xs text-[#9CA3AF]">
                Or
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#EEEEEE] bg-[#EEEEEE]/70 font-semibold text-xs text-[#242424] transition-all hover:bg-[#EEEEEE] active:scale-[0.99]"
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </button>
          </div>
        </div>

        {/* ================= INTERACTIVE BRAND SLIDER OVERLAY ================= */}
        <motion.div
          initial={false}
          animate={{
            x: isSignup ? "100%" : "0%",
            borderTopLeftRadius: isSignup ? "140px" : "0px",
            borderBottomLeftRadius: isSignup ? "140px" : "0px",
            borderTopRightRadius: !isSignup ? "140px" : "0px",
            borderBottomRightRadius: !isSignup ? "140px" : "0px",
          }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 30,
            mass: 0.9,
          }}
          className="absolute top-0 left-0 z-20 flex h-full w-1/2 flex-col items-center justify-center overflow-hidden bg-[#D1593B] px-12 text-white shadow-2xl"
        >
          {/* Background Vector Cottage & Magnifying Glass Illustration matching Figma */}
          <div className="pointer-events-none absolute inset-0 opacity-15 flex items-center justify-center">
            <svg width="480" height="420" viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60 200L240 60L420 200V380H60V200Z" stroke="white" strokeWidth="4" strokeLinejoin="round" />
              <path d="M190 380V250H290V380" stroke="white" strokeWidth="4" />
              <rect x="100" y="230" width="60" height="60" rx="4" stroke="white" strokeWidth="4" />
              <rect x="320" y="230" width="60" height="60" rx="4" stroke="white" strokeWidth="4" />
              <circle cx="340" cy="180" r="80" stroke="white" strokeWidth="4" />
              <line x1="395" y1="235" x2="455" y2="295" stroke="white" strokeWidth="12" strokeLinecap="round" />
            </svg>
          </div>

          {/* Logo Badge in Center */}
          <div className="relative z-10 mb-8 flex size-20 items-center justify-center rounded-2xl border-2 border-white/80 bg-white/10 backdrop-blur-md shadow-lg">
            <Logo size={42} />
          </div>

          {/* Dynamic Content Switching inside Slider */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
            <AnimatePresence mode="wait">
              {!isSignup ? (
                <motion.div
                  key="login-slider"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-4"
                >
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Welcome to Cottage!
                  </h2>
                  <p className="text-sm font-normal text-white/80">
                    Don&apos;t have an Cottage?
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleMode("signup")}
                    className="mt-2 rounded-full border-2 border-white/90 bg-transparent px-8 py-3 font-semibold text-sm text-white transition-all hover:bg-white hover:text-[#D1593B] active:scale-95 shadow-md"
                  >
                    Create your own Cottage
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-slider"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-4"
                >
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Welcome to Cottage!
                  </h2>
                  <p className="text-sm font-normal text-white/80">
                    Already have a member of any Cottage?
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleMode("login")}
                    className="mt-2 rounded-full border-2 border-white/90 bg-transparent px-10 py-3 font-semibold text-sm text-white transition-all hover:bg-white hover:text-[#D1593B] active:scale-95 shadow-md"
                  >
                    Log In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Mobile / Small Screen Layout */}
      <div className="flex w-full flex-col justify-between px-6 py-10 lg:hidden min-h-svh">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#D1593B]">
            <Logo size={30} />
            Cottage
          </div>
          <button
            type="button"
            onClick={() => toggleMode(isSignup ? "login" : "signup")}
            className="rounded-full border border-[#D1593B] px-4 py-1.5 text-xs font-semibold text-[#D1593B]"
          >
            {isSignup ? "Log In instead" : "Create Cottage"}
          </button>
        </div>

        <div className="my-auto mx-auto w-full max-w-sm py-6">
          {!isSignup ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <h1 className="text-3xl font-bold text-[#D1593B]">Login</h1>
                <p className="text-xs text-[#6B727E]">Sign in to your Cottage account as a member</p>
              </div>
              {(loginError || loginState?.error) && (
                <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-medium text-[#CC4F4F]">
                  {loginError || loginState?.error}
                </p>
              )}
              <form action={loginAction} className="flex flex-col gap-3.5">
                <div className="relative flex items-center">
                  <AtSign className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email"
                    className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-4 text-sm"
                  />
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                  <input
                    name="password"
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 text-[#9CA3AF]"
                  >
                    {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loginPending}
                  className="h-11 w-full rounded-full bg-[#D1593B] font-semibold text-white"
                >
                  {loginPending ? "Signing in…" : "Sign In"}
                </button>
              </form>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#EEEEEE] bg-[#EEEEEE]/70 font-semibold text-xs"
              >
                <GoogleIcon className="size-4" /> Continue with Google
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <h1 className="text-3xl font-bold text-[#D1593B]">Register</h1>
                <p className="text-xs text-[#6B727E]">Sign up for new Cottage • You&apos;ll be its admin</p>
              </div>
              {(signupError || signupState?.error) && (
                <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-medium text-[#CC4F4F]">
                  {signupError || signupState?.error}
                </p>
              )}
              <form action={signupAction} className="flex flex-col gap-3">
                <input
                  id="signup_cottage_name"
                  name="cottage_name"
                  required
                  placeholder="Cottage Name"
                  className="h-10 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] px-4 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="first_name"
                    required
                    placeholder="First Name"
                    className="h-10 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] px-3 text-sm"
                  />
                  <input
                    name="last_name"
                    placeholder="Last Name"
                    className="h-10 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] px-3 text-sm"
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="h-10 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] px-4 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Password"
                    className="h-10 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] px-3 text-sm"
                  />
                  <input
                    name="confirm_password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Confirm"
                    className="h-10 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] px-3 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={signupPending}
                  className="h-11 w-full rounded-full bg-[#D1593B] font-semibold text-white text-xs mt-1"
                >
                  {signupPending ? "Creating your cottage…" : "Sign up for a new Cottage"}
                </button>
              </form>
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#EEEEEE] bg-[#EEEEEE]/70 font-semibold text-xs"
              >
                <GoogleIcon className="size-4" /> Continue with Google
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-[#9CA3AF]">
          © 2026 Cottage. All rights reserved.
        </div>
      </div>
    </div>
  );
}
