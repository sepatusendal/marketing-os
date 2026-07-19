"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteUserAction } from "@/app/(app)/settings/actions";

export function InviteUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function handleInvite() {
    if (!email.trim()) return;
    setPending(true);
    const result = await inviteUserAction(email);
    setPending(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`Invite sent to ${email}`);
      setEmail("");
      router.refresh();
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        type="email"
        placeholder="colleague@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-64"
      />
      <Button size="sm" disabled={pending || !email.trim()} onClick={handleInvite}>
        {pending ? "Sending..." : "Invite"}
      </Button>
    </div>
  );
}
