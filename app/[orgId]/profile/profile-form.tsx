"use client";

import { useRef, useState } from "react";
import type { E164Number } from "libphonenumber-js/core";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { ProfileAvatarUpload } from "@/components/profile-avatar-upload";
import { useUpdateProfile, useProfile } from "@/hooks/use-api";
import { uploadProfileImage, removeProfileImage } from "../settings/actions";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { getInitials } from "@/lib/get-initials";

interface ProfileFormProps {
  profile: Profile | null;
}


export function ProfileForm({ profile }: ProfileFormProps) {
  const supabase = createClient();
  const updateProfile = useUpdateProfile();
  const { refetch: refetchProfile } = useProfile();
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [phone, setPhone] = useState<string>(profile?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [otpToken, setOtpToken] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayAvatarUrl = avatarUrl ?? profile?.avatar_url ?? null;
  const displayName = ([firstName, lastName].filter(Boolean).join(" ") || profile?.email) ?? "User";
  const initials = getInitials(displayName)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProfileImage(formData);
    setUploadingAvatar(false);
    e.target.value = "";
    if (result.success && result.url) {
      setAvatarUrl(result.url);
      setMessage({ type: "success", text: "Photo updated." });
    } else if (!result.success) {
      setMessage({ type: "error", text: result.error ?? "Upload failed." });
    }
  }

  async function handleRemoveAvatar() {
    setMessage(null);
    setRemovingAvatar(true);
    const result = await removeProfileImage();
    setRemovingAvatar(false);
    if (result.success) {
      setAvatarUrl(null);
      setMessage({ type: "success", text: "Photo removed." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to remove photo." });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await updateProfile.mutateAsync({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      });
      const phoneTrimmed = phone.trim();
      const phoneChanged = phoneTrimmed !== (profile?.phone ?? "");
      if (phoneChanged && phoneTrimmed) {
        setSendOtpLoading(true);
        const { error } = await supabase.auth.updateUser({ phone: phoneTrimmed as E164Number });
        setSendOtpLoading(false);
        if (error) {
          setMessage({ type: "error", text: error.message });
          return;
        }
        setPendingPhone(phoneTrimmed);
        setMessage({ type: "success", text: "Check your phone for the verification code." });
      } else if (!phoneChanged) {
        setMessage({ type: "success", text: "Profile saved." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingPhone || !otpToken.trim()) return;
    setMessage(null);
    setOtpLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: otpToken.trim(),
      type: "phone_change",
    });
    setOtpLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setPendingPhone(null);
    setOtpToken("");
    setMessage({ type: "success", text: "Phone verified and saved." });
    await refetchProfile();
  }

  function cancelPhoneVerify() {
    setPendingPhone(null);
    setOtpToken("");
    setMessage(null);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Profile</CardTitle>
          <CardDescription className="text-xs">
            Account details (shared across organizations). Email is read-only. Phone is verified by OTP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <ProfileAvatarUpload
              avatarSrc={displayAvatarUrl}
              displayName={displayName}
              initials={initials}
              onAvatarClick={() => fileInputRef.current?.click()}
              onViewImage={displayAvatarUrl ? () => window.open(displayAvatarUrl, "_blank", "noopener,noreferrer") : undefined}
              onRemove={displayAvatarUrl ? handleRemoveAvatar : undefined}
              uploading={uploadingAvatar}
              removing={removingAvatar}
              avatarSize="default"
              compact
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Upload profile photo"
              onChange={handleAvatarChange}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs">First name</Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs">Last name</Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email ?? ""}
                  disabled
                  readOnly
                  className="h-8 bg-muted text-sm cursor-not-allowed opacity-90"
                  aria-describedby="email-readonly"
                />
                <p id="email-readonly" className="text-muted-foreground text-[11px]">Email cannot be changed.</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">Phone (optional)</h3>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <PhoneInput
                id="phone"
                value={phone || undefined}
                onChange={(value) => setPhone(value ?? "")}
                placeholder="Phone number"
                className="h-8 text-sm"
                disabled={!!pendingPhone}
              />
            </div>
          </div>

          {pendingPhone && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground">Verify phone</h3>
              <p className="text-muted-foreground text-xs">Enter the 6-digit code sent to {pendingPhone}</p>
              <form onSubmit={handleVerifyOtp} className="flex flex-wrap items-end gap-2">
                <Input
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="h-8 w-28 text-sm font-mono"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <Button type="submit" size="sm" disabled={otpLoading || otpToken.length < 6}>
                  {otpLoading ? "Verifying…" : "Verify"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={cancelPhoneVerify}>
                  Cancel
                </Button>
              </form>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="submit"
            disabled={updateProfile.isPending || sendOtpLoading || !!pendingPhone}
          >
            {updateProfile.isPending || sendOtpLoading ? "Saving…" : "Save changes"}
          </Button>
          {message && (
            <span
              className={
                message.type === "success"
                  ? "text-muted-foreground text-sm"
                  : "text-destructive text-sm"
              }
            >
              {message.text}
            </span>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
