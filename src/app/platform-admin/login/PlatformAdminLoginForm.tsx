"use client";

import { useActionState } from "react";
import { platformAdminLogin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PlatformAdminLoginForm() {
  const [state, action, pending] = useActionState(platformAdminLogin, undefined);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-12 rounded-2xl px-4 text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 rounded-2xl px-4 text-base"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2 h-12 w-full rounded-full text-base">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
