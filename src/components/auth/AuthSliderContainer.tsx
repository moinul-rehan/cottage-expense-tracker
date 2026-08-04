"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/login/actions";
import { signup } from "@/app/signup/actions";
import { requestPasswordReset } from "@/app/forgot-password/actions";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/google-icon";
import { AtSign, Lock, Eye, EyeOff, Home, User, ArrowLeft } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot-password";

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
  const isForgotPassword = mode === "forgot-password";

  // Login form state
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password form state
  const [forgotState, forgotAction, forgotPending] = useActionState(requestPasswordReset, undefined);

  function toggleMode(targetMode: AuthMode) {
    setMode(targetMode);
    const newPath = targetMode === "signup" ? "/signup" : targetMode === "forgot-password" ? "/forgot-password" : "/login";
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
    <div className="relative flex min-h-svh w-full items-center justify-center bg-white overflow-hidden selection:bg-[#D1593B] selection:text-white">
      {/* Desktop Container (lg screens and above) */}
      <div className="relative hidden w-full min-h-svh lg:flex">
        
        {/* ================= REGISTER FORM (LEFT SIDE in Signup Mode) ================= */}
        <div
          className={`flex w-1/2 flex-col justify-center px-12 xl:px-20 py-12 transition-all duration-500 ${
            !isSignup ? "pointer-events-none opacity-0 invisible" : "pointer-events-auto opacity-100 visible"
          }`}
        >
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6">
            {/* Header Title & Subtitle matching Figma */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-4xl font-bold tracking-[2px] text-[#D1593B]">
                Register
              </h1>
              <div className="flex items-center gap-1.5 text-base text-[#6B727E]">
                <span>Sign up for new</span>
                <span className="flex items-center gap-1 font-bold text-[#D1593B]">
                  <img src="https://cottagee.me/logo.png" alt="" className="size-6 rounded-md object-cover" />
                  Cottage
                </span>
                <span>• You&apos;ll be its admin</span>
              </div>
            </div>

            {(signupError || signupState?.error) && (
              <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-medium text-[#CC4F4F] border border-red-100">
                {signupError || signupState?.error}
                {signupDetail && <span className="mt-1 block font-mono text-[11px] opacity-80">{signupDetail}</span>}
              </p>
            )}

            <form action={signupAction} className="flex flex-col gap-4">
              {/* Cottage Name Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup_cottage_name" className="text-sm font-normal text-[#404040]">
                  Cottage Name
                </label>
                <div className="relative flex items-center">
                  <Home className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                  <input
                    id="signup_cottage_name"
                    name="cottage_name"
                    type="text"
                    required
                    placeholder="e.g. Green Villa Cottage"
                    className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-4 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                  />
                </div>
              </div>

              {/* First Name & Last Name (2 columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup_first_name" className="text-sm font-normal text-[#404040]">
                    First Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                    <input
                      id="signup_first_name"
                      name="first_name"
                      type="text"
                      required
                      placeholder="e.g. John"
                      className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-3 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup_last_name" className="text-sm font-normal text-[#404040]">
                    Last Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                    <input
                      id="signup_last_name"
                      name="last_name"
                      type="text"
                      placeholder="e.g. Doe"
                      className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-3 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup_email" className="text-sm font-normal text-[#404040]">
                  Email <span className="text-[#CC4F4F]">*</span>
                </label>
                <div className="relative flex items-center">
                  <AtSign className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                  <input
                    id="signup_email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="e.g. john@example.com"
                    className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-4 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                  />
                </div>
              </div>

              {/* Password & Confirm Password (2 columns) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup_password" className="text-sm font-normal text-[#404040]">
                    Password <span className="text-[#CC4F4F]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                    <input
                      id="signup_password"
                      name="password"
                      type={showSignupPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-9 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 text-[#9CA3AF] hover:text-[#404040]"
                    >
                      {showSignupPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup_confirm_password" className="text-sm font-normal text-[#404040]">
                    Confirm Password <span className="text-[#CC4F4F]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                    <input
                      id="signup_confirm_password"
                      name="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Confirm password"
                      className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-9 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-[#9CA3AF] hover:text-[#404040]"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={signupPending}
                className="mt-2 h-12 w-full rounded-full bg-[#D1593B] font-semibold text-base text-white transition-all hover:bg-[#B8472C] active:scale-[0.99] disabled:opacity-70 shadow-md shadow-[#D1593B]/20"
              >
                {signupPending ? "Creating your cottage…" : "Sign up for a new Cottage"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="w-full border-t border-[#EEEEEE]" />
              <span className="absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm text-[#EEEEEE]">
                Or
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#EEEEEE] font-semibold text-base text-[#242424] transition-all hover:bg-[#E2E2E2] active:scale-[0.99]"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>
          </div>
        </div>

        {/* ================= LOGIN & FORGOT PASSWORD FORM (RIGHT SIDE in Login/Forgot Mode) ================= */}
        <div
          className={`flex w-1/2 flex-col justify-center px-12 xl:px-20 py-12 transition-all duration-500 ${
            isSignup ? "pointer-events-none opacity-0 invisible" : "pointer-events-auto opacity-100 visible"
          }`}
        >
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6">
            <AnimatePresence mode="wait">
              {!isForgotPassword ? (
                /* LOGIN FORM */
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-4xl font-bold tracking-[2px] text-[#D1593B]">
                      Login
                    </h1>
                    <div className="flex items-center gap-1.5 text-base text-[#6B727E]">
                      <span>Sign in to your</span>
                      <span className="flex items-center gap-1 font-bold text-[#D1593B]">
                        <img src="https://cottagee.me/logo.png" alt="" className="size-6 rounded-md object-cover" />
                        Cottage
                      </span>
                      <span>account as a member</span>
                    </div>
                  </div>

                  {(loginError || loginState?.error) && (
                    <p className="rounded-xl bg-red-50 p-3.5 text-center text-xs font-medium text-[#CC4F4F] border border-red-100">
                      {loginError || loginState?.error}
                    </p>
                  )}

                  <form action={loginAction} className="flex flex-col gap-5">
                    {/* Email Input */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login_email" className="text-sm font-normal text-[#404040]">
                        Email <span className="text-[#CC4F4F]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <AtSign className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                        <input
                          id="login_email"
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="e.g. member@example.com"
                          className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-4 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login_password" className="text-sm font-normal text-[#404040]">
                        Password <span className="text-[#CC4F4F]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                        <input
                          id="login_password"
                          name="password"
                          type={showLoginPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-10 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3.5 text-[#9CA3AF] hover:text-[#404040]"
                        >
                          {showLoginPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMode("forgot-password")}
                        className="self-start text-sm font-normal text-[#D40924] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loginPending}
                      className="mt-2 h-12 w-full rounded-full bg-[#D1593B] font-semibold text-base text-white transition-all hover:bg-[#B8472C] active:scale-[0.99] disabled:opacity-70 shadow-md shadow-[#D1593B]/20"
                    >
                      {loginPending ? "Signing in…" : "Sign In"}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative flex items-center py-1">
                    <div className="w-full border-t border-[#EEEEEE]" />
                    <span className="absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm text-[#EEEEEE]">
                      Or
                    </span>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#EEEEEE] font-semibold text-base text-[#242424] transition-all hover:bg-[#E2E2E2] active:scale-[0.99]"
                  >
                    <GoogleIcon className="size-5" />
                    Continue with Google
                  </button>
                </motion.div>
              ) : (
                /* FORGOT PASSWORD FORM */
                <motion.div
                  key="forgot-password-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-4xl font-bold tracking-[2px] text-[#D1593B]">
                      Reset Password
                    </h1>
                    <div className="flex items-center gap-1.5 text-base text-[#6B727E]">
                      <span>Enter your email to reset password for your</span>
                      <span className="flex items-center gap-1 font-bold text-[#D1593B]">
                        <img src="https://cottagee.me/logo.png" alt="" className="size-6 rounded-md object-cover" />
                        Cottage
                      </span>
                    </div>
                  </div>

                  {forgotState?.success ? (
                    <div className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800 border border-emerald-200">
                      {forgotState.success}
                    </div>
                  ) : (
                    <form action={forgotAction} className="flex flex-col gap-5">
                      {forgotState?.error && (
                        <p className="rounded-xl bg-red-50 p-3.5 text-center text-xs font-medium text-[#CC4F4F] border border-red-100">
                          {forgotState.error}
                        </p>
                      )}

                      {/* Email Input */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="forgot_email" className="text-sm font-normal text-[#404040]">
                          Email <span className="text-[#CC4F4F]">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <AtSign className="absolute left-3.5 size-5 text-[#9CA3AF]" />
                          <input
                            id="forgot_email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="e.g. member@example.com"
                            className="h-12 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-11 pr-4 text-sm text-[#242424] placeholder:text-[#9CA3AF] transition-all focus:border-[#D1593B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D1593B]"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={forgotPending}
                        className="mt-2 h-12 w-full rounded-full bg-[#D1593B] font-semibold text-base text-white transition-all hover:bg-[#B8472C] active:scale-[0.99] disabled:opacity-70 shadow-md shadow-[#D1593B]/20"
                      >
                        {forgotPending ? "Sending reset link…" : "Send reset link"}
                      </button>
                    </form>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleMode("login")}
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-[#D1593B] hover:underline"
                  >
                    <ArrowLeft className="size-4" />
                    Back to Sign In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ================= INTERACTIVE BRAND SLIDER OVERLAY ================= */}
        <motion.div
          initial={false}
          animate={{
            x: isSignup ? "100%" : "0%",
            borderTopLeftRadius: isSignup ? "250px" : "0px",
            borderBottomLeftRadius: isSignup ? "250px" : "0px",
            borderTopRightRadius: !isSignup ? "250px" : "0px",
            borderBottomRightRadius: !isSignup ? "250px" : "0px",
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 28,
            mass: 0.9,
          }}
          className="absolute top-0 left-0 z-30 flex h-full w-1/2 flex-col items-center justify-center overflow-hidden bg-[#D1593B] px-12 text-white shadow-2xl"
        >
          {/* User's Exact Vector Artwork in Background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
            <img
              src="/auth-vector.png"
              alt=""
              className="max-h-[85%] max-w-[90%] object-contain opacity-100"
            />
          </div>

          {/* Logo Card in Center */}
          <div className="relative z-10 mb-10 flex size-28 items-center justify-center rounded-[30px] border-2 border-white/90 bg-white p-3 shadow-xl">
            <img src="https://cottagee.me/logo.png" alt="Cottage" className="size-full rounded-[20px] object-cover" />
          </div>

          {/* Dynamic Content Switching inside Slider */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-md">
            <AnimatePresence mode="wait">
              {!isSignup ? (
                <motion.div
                  key="login-slider"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-4"
                >
                  <h2 className="text-4xl font-extrabold tracking-[2px] text-white">
                    Welcome to Cottage!
                  </h2>
                  <p className="text-2xl font-normal text-white/90">
                    {isForgotPassword ? "Remember your password?" : "Don't have an Cottage?"}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleMode(isForgotPassword ? "login" : "signup")}
                    className="mt-4 rounded-xl border border-white bg-transparent px-12 py-4 font-medium text-xl text-white transition-all hover:bg-white hover:text-[#D1593B] active:scale-95 shadow-md"
                  >
                    {isForgotPassword ? "Log In" : "Create your own Cottage"}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-slider"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-4"
                >
                  <h2 className="text-4xl font-extrabold tracking-[2px] text-white">
                    Welcome to Cottage!
                  </h2>
                  <p className="text-2xl font-normal text-white/90">
                    Already have a member of any Cottage?
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleMode("login")}
                    className="mt-4 rounded-xl border border-white bg-transparent px-14 py-4 font-medium text-xl text-white transition-all hover:bg-white hover:text-[#D1593B] active:scale-95 shadow-md"
                  >
                    Log In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Mobile Fallback */}
      <div className="flex w-full flex-col justify-between px-6 py-10 lg:hidden min-h-svh">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#D1593B]">
            <img src="https://cottagee.me/logo.png" alt="Cottage" className="size-8 rounded-lg object-cover" />
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
          {isForgotPassword ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <h1 className="text-3xl font-bold text-[#D1593B]">Reset Password</h1>
                <p className="text-xs text-[#6B727E]">Enter your email to receive a password reset link</p>
              </div>
              {forgotState?.success ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-center text-xs font-medium text-emerald-800">
                  {forgotState.success}
                </div>
              ) : (
                <form action={forgotAction} className="flex flex-col gap-3.5">
                  <div className="relative flex items-center">
                    <AtSign className="absolute left-3.5 size-4 text-[#9CA3AF]" />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="e.g. member@example.com"
                      className="h-11 w-full rounded-xl border border-[#EEEEEE] bg-[#FAFAFA] pl-10 pr-4 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotPending}
                    className="h-11 w-full rounded-full bg-[#D1593B] font-semibold text-white text-xs"
                  >
                    {forgotPending ? "Sending reset link…" : "Send reset link"}
                  </button>
                </form>
              )}
              <button
                type="button"
                onClick={() => toggleMode("login")}
                className="flex items-center justify-center gap-1 text-xs font-semibold text-[#D1593B]"
              >
                <ArrowLeft className="size-3.5" /> Back to Sign In
              </button>
            </div>
          ) : !isSignup ? (
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
                  type="button"
                  onClick={() => toggleMode("forgot-password")}
                  className="self-start text-xs font-medium text-[#D40924]"
                >
                  Forgot password?
                </button>
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#EEEEEE] bg-[#EEEEEE] font-semibold text-xs"
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
                className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#EEEEEE] bg-[#EEEEEE] font-semibold text-xs"
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
