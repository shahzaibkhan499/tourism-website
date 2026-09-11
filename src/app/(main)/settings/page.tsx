"use client";

import { NotificationSoundCard } from "@/components/settings/notification-sound-card";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Lock,
  Bell,
  Languages,
  Palette,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  Smartphone,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PrivacyTab } from "@/components/settings/privacy-tab";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn, passwordStrength } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ email: string; phone: string | null; twoFactorEnabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const requestOtp = async (type: "email" | "phone", value: string) => {
    if (!value.trim()) {
      toast.error(type === "email" ? "نیا ای میل لکھیں" : "نیا فون نمبر لکھیں");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/settings/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "OTP نہیں بھیجا جا سکا");
        return;
      }
      setOtpSent(type);
      setOtpValue("");
      toast.success(
        type === "email"
          ? "OTP آپ کی نئی ای میل پر بھیج دیا گیا ہے (10 منٹ تک درست)"
          : "OTP آپ کی رجسٹرڈ ای میل پر بھیج دیا گیا ہے (10 منٹ تک درست)"
      );
      if (data.devOtp) {
        toast.info(`Development mode — OTP: ${data.devOtp}`, { duration: 30000 });
      }
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async (type: "email" | "phone", value: string) => {
    if (otpValue.length !== 6) {
      toast.error("6 ہندسوں کا OTP لکھیں");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/settings/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "OTP غلط ہے");
        return;
      }
      toast.success(data.message || "اپ ڈیٹ ہو گیا!");
      setOtpSent("none");
      setOtpValue("");
      if (type === "email") setNewEmail("");
      else setNewPhone("");
      // Refresh profile info
      fetch("/api/profile")
        .then((r) => r.json())
        .then((p) => {
          if (p && !p.error) {
            setProfile({ email: p.email, phone: p.phone ?? null, twoFactorEnabled: p.twoFactorEnabled ?? false });
          }
        })
        .catch(() => undefined);
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setOtpBusy(false);
    }
  };

  // Account tab state
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Email/Phone OTP state
  const [otpSent, setOtpSent] = useState<"none" | "email" | "phone">("none");
  const [otpValue, setOtpValue] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);

  // Login history (sessions)
  interface SessionRow {
    id: string;
    createdAt: string;
    ip: string | null;
    device: string;
    browser: string;
    os: string;
  }
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // 2FA state
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "verify" | "done">("idle");
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaQr, setTwoFaQr] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaPassword, setTwoFaPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Store preferences
  const { theme, setTheme, fontSize, setFontSize, interfaceLanguage, setInterfaceLanguage } = useAppStore();

  // Notification toggles
  const [notifPrefs, setNotifPrefs] = useState({
    eventReminders: true,
    rishtaRequests: true,
    jobUpdates: true,
    weeklyDigest: false,
    pushAll: true,
    smsOtp: true,
    smsAll: false,
  });

  useEffect(() => {
    fetch("/api/settings/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions as SessionRow[]);
      })
      .catch(() => undefined)
      .finally(() => setSessionsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((json) => {
        if (!json.error) {
          setProfile({ email: json.email, phone: json.phone, twoFactorEnabled: json.twoFactorEnabled });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const strength = passwordStrength(newPassword);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) return toast.error("نیا پاس ورڈ کم از کم 8 حروف کا ہو");
    if (newPassword !== confirmPassword) return toast.error("دونوں پاس ورڈز مماثل نہیں ہیں");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "پاس ورڈ نہیں بدلا");
        return;
      }
      toast.success("پاس ورڈ بدل گیا!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Network error");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "اکاؤنٹ ڈیلیٹ نہیں ہو سکا");
        return;
      }
      toast.success("اکاؤنٹ ڈیلیٹ ہو گیا۔ اللہ حافظ! 👋");
      window.location.href = "/";
    } catch {
      toast.error("Network error");
    }
  };

  const start2FASetup = async () => {
    try {
      const res = await fetch("/api/settings/2fa");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "2FA سیٹ اپ شروع نہیں ہو سکا");
        return;
      }
      setTwoFaSecret(data.secret);
      setTwoFaQr(data.qrDataUrl);
      setTwoFaStep("setup");
    } catch {
      toast.error("Network error");
    }
  };

  const verify2FA = async () => {
    try {
      const res = await fetch("/api/settings/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFaCode, password: twoFaPassword, secret: twoFaSecret }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "2FA تصدیق نہیں ہو سکی");
        return;
      }
      setBackupCodes(data.backupCodes);
      setTwoFaStep("done");
      setProfile((p) => (p ? { ...p, twoFactorEnabled: true } : p));
      toast.success("2FA فعال ہو گیا! 🔐");
    } catch {
      toast.error("Network error");
    }
  };

  const disable2FA = async () => {
    try {
      const res = await fetch("/api/settings/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFaCode, password: twoFaPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "2FA غیر فعال نہیں ہو سکا");
        return;
      }
      toast.success("2FA غیر فعال ہو گیا");
      setTwoFaStep("idle");
      setTwoFaCode("");
      setTwoFaPassword("");
      setProfile((p) => (p ? { ...p, twoFactorEnabled: false } : p));
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" titleUrdu="ترتیبات" description="اپنا اکاؤنٹ اور ترجیحات منظم کریں" />

      <Tabs defaultValue="account" className="flex flex-col gap-6 lg:flex-row">
        <TabsList className="h-auto flex-col items-stretch lg:w-52 lg:flex">
          <TabsTrigger value="account" className="justify-start">
            <User className="mr-2 h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="privacy" className="justify-start">
            <Lock className="mr-2 h-4 w-4" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications" className="justify-start">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="language" className="justify-start">
            <Languages className="mr-2 h-4 w-4" /> Language
          </TabsTrigger>
          <TabsTrigger value="theme" className="justify-start">
            <Palette className="mr-2 h-4 w-4" /> Theme
          </TabsTrigger>
          <TabsTrigger value="security" className="justify-start">
            <ShieldCheck className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Email</CardTitle>
                <CardDescription>موجودہ ای میل: {profile?.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="نیا ای میل"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={otpSent === "email"}
                  />
                  <Button
                    onClick={() => requestOtp("email", newEmail)}
                    disabled={otpBusy || otpSent === "email"}
                    className="shrink-0"
                  >
                    {otpBusy && otpSent === "none" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    OTP Bhejein
                  </Button>
                </div>
                {otpSent === "email" && (
                  <div className="flex gap-3">
                    <Input
                      placeholder="6 digit OTP"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    />
                    <Button onClick={() => verifyOtp("email", newEmail)} disabled={otpBusy} className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                      {otpBusy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Verify & Change
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Phone</CardTitle>
                <CardDescription>
                  موجودہ فون: {profile?.phone || "نہیں ہے"} — OTP آپ کی رجسٹرڈ ای میل پر جائے گا
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    placeholder="03001234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    disabled={otpSent === "phone"}
                  />
                  <Button
                    onClick={() => requestOtp("phone", newPhone)}
                    disabled={otpBusy || otpSent === "phone"}
                    className="shrink-0"
                  >
                    {otpBusy && otpSent === "none" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    OTP Bhejein
                  </Button>
                </div>
                {otpSent === "phone" && (
                  <div className="flex gap-3">
                    <Input
                      placeholder="6 digit OTP"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    />
                    <Button onClick={() => verifyOtp("phone", newPhone)} disabled={otpBusy} className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                      {otpBusy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Verify & Change
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Maujuda Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>نیا پاس ورڈ</Label>
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>نئے پاس ورڈ کی تصدیق</Label>
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                {newPassword && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div className={cn("h-full rounded-full", strength.color)} style={{ width: `${(strength.score + 1) * 25}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{strength.label}</span>
                  </div>
                )}
                <Button onClick={handleChangePassword} className="bg-emerald-600 hover:bg-emerald-700">
                  Password Badlein
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔵</span>
                    <div>
                      <div className="text-sm font-medium">Google</div>
                      <div className="text-xs text-gray-500">OAuth login</div>
                    </div>
                  </div>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📘</span>
                    <div>
                      <div className="text-sm font-medium">Facebook</div>
                      <div className="text-xs text-gray-500">Jald aa raha hai</div>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-700">Danger Zone</CardTitle>
                <CardDescription>اکاؤنٹ مستقل طور پر ڈیلیٹ ہو جائے گا</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Kya aap bilkul yaqeeni hain?</AlertDialogTitle>
                      <AlertDialogDescription>
                        آپ کا اکاؤنٹ، ڈیٹا، یادیں، سب کچھ مستقل طور پر ڈیلیٹ ہو جائے گا۔ یہ کارروائی واپس نہیں ہو سکتی۔
                        تصدیق کے لیے <strong>DELETE</strong> لکھیں۔
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                      placeholder="DELETE لکھیں"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteConfirm !== "DELETE"}
                        onClick={handleDeleteAccount}
                      >
                        ہمیشہ کے لیے ڈیلیٹ کریں
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRIVACY TAB */}
          <TabsContent value="privacy" className="mt-0">
            <PrivacyTab />
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "eventReminders" as const, label: "Event reminders", desc: "ایونٹ سے پہلے یاد دلا دیں" },
                  { key: "rishtaRequests" as const, label: "رشتہ کی درخواستیں", desc: "جب کوئی دلچسپی بھیجے" },
                  { key: "jobUpdates" as const, label: "Job updates", desc: "Application status changes" },
                  { key: "weeklyDigest" as const, label: "Weekly digest", desc: "ہفتے کی فیملی سرگرمیاں" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{n.label}</div>
                      <div className="text-xs text-gray-500">{n.desc}</div>
                    </div>
                    <Switch
                      checked={notifPrefs[n.key]}
                      onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, [n.key]: v })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Push Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Sab push notifications</div>
                  <Switch
                    checked={notifPrefs.pushAll}
                    onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, pushAll: v })}
                  />
                </div>
              </CardContent>
            </Card>
            <NotificationSoundCard />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SMS Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">صرف OTP کوڈز</div>
                  <Switch
                    checked={notifPrefs.smsOtp}
                    onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, smsOtp: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Sab notifications SMS par</div>
                  <Switch
                    checked={notifPrefs.smsAll}
                    onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, smsAll: v })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LANGUAGE TAB */}
          <TabsContent value="language" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interface Language</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={interfaceLanguage} onValueChange={(v) => setInterfaceLanguage(v as "urdu" | "english")}>
                  {[
                    { value: "urdu", label: "Urdu — اردو" },
                    { value: "english", label: "English" },
                    { value: "punjabi", label: "Punjabi — پنجابی (jald)" },
                    { value: "sindhi", label: "Sindhi — سنڌي (jald)" },
                    { value: "pashto", label: "Pashto — پښتو (jald)" },
                  ].map((l) => (
                    <label key={l.value} className="flex items-center gap-2">
                      <RadioGroupItem value={l.value} /> {l.label}
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Date Format</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="ddmmyyyy">
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="ddmmyyyy" /> DD/MM/YYYY (15/08/2026)
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="mmddyyyy" /> MM/DD/YYYY (08/15/2026)
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="both">
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="gregorian" /> Gregorian
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="hijri" /> Hijri
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="both" /> Dono (recommended)
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>
          </TabsContent>

          {/* THEME TAB */}
          <TabsContent value="theme" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="light" /> ☀️ Light
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="dark" /> 🌙 Dark
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem value="system" /> 💻 System
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Font Size</CardTitle>
                <CardDescription>بزرگ صارفین کے لیے بڑا فونٹ تجویز کیا جاتا ہے</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={fontSize} onValueChange={(v) => setFontSize(v as "small" | "medium" | "large" | "xl")}>
                  {[
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                    { value: "xl", label: "Extra Large (buzurg)" },
                  ].map((f) => (
                    <label key={f.value} className="flex items-center gap-2">
                      <RadioGroupItem value={f.value} /> {f.label}
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>
                  Google Authenticator jaisi app se extra security layer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.twoFactorEnabled && twoFaStep !== "setup" ? (
                  <div className="space-y-4">
                    <Badge variant="success" className="text-sm">
                      <ShieldCheck className="mr-1 h-4 w-4" /> 2FA Enabled hai ✓
                    </Badge>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Authenticator se 6-digit code"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value)}
                        maxLength={6}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={twoFaPassword}
                        onChange={(e) => setTwoFaPassword(e.target.value)}
                      />
                      <Button variant="destructive" onClick={disable2FA}>
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                ) : twoFaStep === "idle" ? (
                  <Button onClick={start2FASetup} className="bg-emerald-600 hover:bg-emerald-700">
                    <Smartphone className="mr-1 h-4 w-4" />
                    2FA فعال کریں
                  </Button>
                ) : twoFaStep === "setup" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      1. گوگل آتھنٹیکیٹر (یا کوئی بھی TOTP ایپ) انسٹال کریں۔
                      <br />
                      2. نیچے QR کوڈ اسکین کریں یا سیکرٹ لکھیں۔
                      <br />
                      3. App se 6-digit code yahan likhein.
                    </p>
                    {twoFaQr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={twoFaQr} alt="2FA QR Code" className="h-44 w-44 rounded-xl border bg-white p-2" />
                    )}
                    <p className="break-all rounded-lg bg-gray-50 p-3 font-mono text-xs">{twoFaSecret}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="6-digit code"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value)}
                        maxLength={6}
                      />
                      <Input
                        type="password"
                        placeholder="اپنا پاس ورڈ (تصدیق کے لیے)"
                        value={twoFaPassword}
                        onChange={(e) => setTwoFaPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={verify2FA} className="bg-emerald-600 hover:bg-emerald-700">
                        تصدیق کریں
                      </Button>
                      <Button variant="outline" onClick={() => setTwoFaStep("idle")}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Badge variant="success" className="text-sm">
                      2FA Enabled! 🎉
                    </Badge>
                    <p className="text-sm font-semibold">بیک اپ کوڈز (صرف اب دکھ رہے ہیں — محفوظ جگہ رکھیں):</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {backupCodes.map((code, i) => (
                        <code key={i} className="rounded-lg bg-gray-100 p-2 text-center font-mono text-xs">
                          {code}
                        </code>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(backupCodes.join("\n"));
                        setCopiedCodes(true);
                        toast.success("Backup codes copy ho gaye!");
                      }}
                    >
                      {copiedCodes ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                      کوڈز کاپی کریں
                    </Button>
                    <Button variant="outline" className="ml-2" onClick={() => setTwoFaStep("idle")}>
                      Done
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Sessions</CardTitle>
                <CardDescription>Jin devices par aap logged in hain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-3 font-medium text-gray-500">Device</th>
                        <th className="p-3 font-medium text-gray-500">Browser</th>
                        <th className="p-3 font-medium text-gray-500">IP</th>
                        <th className="p-3 font-medium text-gray-500">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-3" colSpan={4}>
                              <Skeleton className="h-5 w-full" />
                            </td>
                          </tr>
                        ))
                      ) : sessions.length === 0 ? (
                        <tr className="border-t">
                          <td className="p-3 text-gray-500" colSpan={4}>
                            Koi login history nahi mili
                          </td>
                        </tr>
                      ) : (
                        sessions.map((s, i) => (
                          <tr key={s.id} className="border-t">
                            <td className="p-3">
                              <span className="mr-1">{s.device === "desktop" ? "💻" : "📱"}</span>
                              {s.device === "mobile" ? "Mobile" : s.device === "tablet" ? "Tablet" : "Desktop"}
                              {i === 0 && (
                                <Badge variant="success" className="ml-2">
                                  موجودہ
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-gray-500">
                              {s.browser} · {s.os}
                            </td>
                            <td className="p-3 text-gray-500">{s.ip || "—"}</td>
                            <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
