"use client";

import { useActionState } from "react";
import { changePassword, setInitialPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  if (!hasPassword) {
    return <SetInitialPasswordForm />;
  }
  return <ChangePasswordForm />;
}

function SetInitialPasswordForm() {
  const [state, action, pending] = useActionState(setInitialPassword, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Set a password</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          You signed up with Google, so your account doesn&apos;t have a password yet. Set one
          here — you&apos;ll need it to confirm admin actions like resetting a month.
        </p>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_password">New password</Label>
              <Input id="new_password" name="new_password" type="password" required minLength={8} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Setting…" : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current_password">Current password</Label>
              <Input id="current_password" name="current_password" type="password" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_password">New password</Label>
              <Input id="new_password" name="new_password" type="password" required minLength={8} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Updating…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
