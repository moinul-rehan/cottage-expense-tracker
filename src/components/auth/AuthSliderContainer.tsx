"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/app/login/LoginForm";
import { SignupForm } from "@/app/signup/SignupForm";
import Image from "next/image";
import { ShieldCheck, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  function toggleMode(targetMode: AuthMode) {
    setMode(targetMode);
    const newPath = targetMode === "signup" ? "/signup" : "/login";
    window.history.pushState(null, "", newPath);
  }

  const isSignup = mode === "signup";

  return (
    <div className="relative flex min-h-svh w-full overflow-hidden bg-background selection:bg-primary selection:text-white">
      {/* Desktop Container (lg screens and above) */}
      <div className="relative hidden w-full lg:flex lg:min-h-svh">
        {/* Left Form Container (Login Form when mode == 'login') */}
        <div
          className={`flex w-1/2 flex-col justify-between px-16 py-12 transition-all duration-700 ${
            isSignup ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Logo size={32} />
              Cottage
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Sign in with the account your admin created for you.
              </p>
            </div>

            {loginError && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                {loginError}
              </p>
            )}

            <LoginForm />
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Need help? Contact your cottage admin or support.
          </div>
        </div>

        {/* Right Form Container (Signup Form when mode == 'signup') */}
        <div
          className={`flex w-1/2 flex-col justify-between px-16 py-12 transition-all duration-700 ${
            !isSignup ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Logo size={32} />
              Cottage
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Start a Cottage</h1>
              <p className="text-sm text-muted-foreground">
                Sign up for a new Cottage — you&apos;ll be its admin.
              </p>
            </div>

            {signupError && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                {signupError}
                {signupDetail && <span className="mt-1 block font-mono text-xs opacity-80">{signupDetail}</span>}
              </p>
            )}

            <SignupForm />
          </div>

          <div className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our Terms of Service & Privacy Policy.
          </div>
        </div>

        {/* Interactive Animated Sliding Overlay Panel (Brand Slider) */}
        <motion.div
          initial={false}
          animate={{
            x: isSignup ? "0%" : "100%",
          }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 32,
            mass: 0.9,
          }}
          className="absolute top-0 left-0 z-20 flex h-full w-1/2 flex-col justify-between overflow-hidden bg-primary p-16 text-white shadow-2xl"
        >
          {/* Subtle Background Pattern & Gradient Overlay */}
          <div
            className="absolute inset-0 z-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.3) 100%)",
            }}
          />

          <Image
            src="/auth-preview.png"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-top opacity-30 mix-blend-overlay"
          />

          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(190,65,35,0.2) 0%, rgba(160,50,25,0.7) 50%, #8E2B14 100%)",
            }}
          />

          {/* Slider Content Layer */}
          <div className="relative z-10 flex w-full items-center justify-between">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5" />
              <span>Smart Cottage Manager</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {!isSignup ? (
                <motion.div
                  key="login-slider-content"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5"
                >
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Create your own Cottage
                  </h2>
                  <p className="max-w-md text-base text-white/80 leading-relaxed font-normal">
                    Starting a new shared house? Set up meal tracking, utility ledgers, and roommate management in less than a minute.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => toggleMode("signup")}
                      className="group h-12 rounded-full border-2 border-white bg-white px-8 text-base font-bold text-primary shadow-lg transition-all hover:bg-white/90 active:scale-95"
                    >
                      Create your own Cottage
                      <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-slider-content"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5"
                >
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Already have a Cottage?
                  </h2>
                  <p className="max-w-md text-base text-white/80 leading-relaxed font-normal">
                    Sign in to access your house meal counts, utility balances, notice board, and monthly statements.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => toggleMode("login")}
                      className="group h-12 rounded-full border-2 border-white bg-white px-8 text-base font-bold text-primary shadow-lg transition-all hover:bg-white/90 active:scale-95"
                    >
                      <ArrowLeft className="mr-2 size-5 transition-transform group-hover:-translate-x-1" />
                      Sign in to your Cottage
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-6 text-xs text-white/70">
            <span>© 2026 Cottage</span>
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-4 text-white" />
              <span>Transparent & Automated</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile / Small Screen Fallback (Single column with smooth toggle) */}
      <div className="flex w-full flex-col justify-between px-6 py-10 lg:hidden min-h-svh">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Logo size={30} />
            Cottage
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleMode(isSignup ? "login" : "signup")}
            className="rounded-full text-xs font-semibold"
          >
            {isSignup ? "Sign in instead" : "Create Cottage"}
          </Button>
        </div>

        <div className="my-auto mx-auto w-full max-w-sm py-8">
          <AnimatePresence mode="wait">
            {!isSignup ? (
              <motion.div
                key="mobile-login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
                  <p className="text-sm text-muted-foreground">
                    Sign in with your Cottage member account.
                  </p>
                </div>
                {loginError && (
                  <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                    {loginError}
                  </p>
                )}
                <LoginForm />
                <p className="text-center text-sm text-muted-foreground">
                  Starting a new house?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("signup")}
                    className="font-semibold text-primary underline"
                  >
                    Create your Cottage
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="mobile-signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Start a Cottage</h1>
                  <p className="text-sm text-muted-foreground">
                    Sign up for a new Cottage — you&apos;ll be its admin.
                  </p>
                </div>
                {signupError && (
                  <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                    {signupError}
                    {signupDetail && <span className="mt-1 block font-mono text-xs opacity-80">{signupDetail}</span>}
                  </p>
                )}
                <SignupForm />
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("login")}
                    className="font-semibold text-primary underline"
                  >
                    Sign in to Cottage
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          © 2026 Cottage. All rights reserved.
        </div>
      </div>
    </div>
  );
}
