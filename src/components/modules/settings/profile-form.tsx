"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { updateProfileNameAction } from "@/app/(app)/settings/actions";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName() {
    setSavingName(true);
    const result = await updateProfileNameAction(name);
    setSavingName(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Name updated");
      router.refresh();
    }
  }

  async function handleChangePassword() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="max-w-md space-y-8">
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Profile</h2>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button size="sm" disabled={savingName} onClick={handleSaveName}>
          {savingName ? "Saving..." : "Save name"}
        </Button>
      </div>

      <div className="space-y-3 border-t pt-6">
        <h2 className="text-sm font-medium">Change password</h2>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button size="sm" disabled={savingPassword} onClick={handleChangePassword}>
          {savingPassword ? "Saving..." : "Change password"}
        </Button>
      </div>
    </div>
  );
}
