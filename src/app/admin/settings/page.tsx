"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        const map: Record<string, string> = {};
        for (const s of json.settings as SiteSetting[]) map[s.key] = s.value;
        setSettings(map);
      })
      .catch(() => toast.error("سیٹنگز لوڈ نہیں ہو سکیں"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string | boolean) => setSettings((prev) => ({ ...prev, [key]: String(value) }));

  const saveKeys = async (keys: string[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: keys.map((key) => ({ key, value: settings[key] ?? "" })),
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "محفوظ نہیں ہو سکا");
      toast.success("Settings save ho gayin!");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
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

  const siteKeys = [
    "site_name",
    "contact_email",
    "support_phone",
    "max_upload_size_mb",
    "default_storage_quota_gb",
  ];
  const contentKeys = ["about_us", "terms_of_service", "privacy_policy"];
  const emailTemplateKeys = [
    { key: "welcome_email_template", label: "Welcome Email", desc: "نئے صارف کے اکاؤنٹ بننے پر" },
    { key: "event_reminder_template", label: "Event Reminder", desc: "ایونٹ سے پہلے یاد دہانی" },
    { key: "password_reset_template", label: "Password Reset", desc: "پاس ورڈ ری سیٹ کے وقت" },
    { key: "report_notification_template", label: "Report Notification", desc: "رپورٹ کی صورتحال اپ ڈیٹ ہونے پر" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-sm text-gray-500">پلیٹ فارم کی ترتیب اور ای میل ٹیمپلیٹس</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="emails">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site Settings</CardTitle>
              <CardDescription>Platform ki bunyadi settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Site Name</Label>
                  <Input value={settings.site_name || ""} onChange={(e) => set("site_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Email</Label>
                  <Input type="email" value={settings.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Support Phone</Label>
                  <Input value={settings.support_phone || ""} onChange={(e) => set("support_phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Upload Size (MB)</Label>
                  <Input type="number" min={1} value={settings.max_upload_size_mb || "50"} onChange={(e) => set("max_upload_size_mb", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Default Storage Quota (GB)</Label>
                  <Input type="number" min={1} value={settings.default_storage_quota_gb || "5"} onChange={(e) => set("default_storage_quota_gb", e.target.value)} />
                </div>
              </div>
              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Maintenance Mode</div>
                    <div className="text-xs text-gray-500">آن ہونے پر سائٹ بند ہو جائے گی</div>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode === "true"}
                    onCheckedChange={(v) => set("maintenance_mode", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Registration Open</div>
                    <div className="text-xs text-gray-500">Naye users register kar sakte hain</div>
                  </div>
                  <Switch
                    checked={settings.registration_open === "true"}
                    onCheckedChange={(v) => set("registration_open", v)}
                  />
                </div>
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={saving}
                onClick={() =>
                  saveKeys([...siteKeys, "maintenance_mode", "registration_open"])
                }
              >
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                محفوظ کریں
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Pages</CardTitle>
              <CardDescription>About Us, Terms aur Privacy Policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>About Us</Label>
                <Textarea rows={5} value={settings.about_us || ""} onChange={(e) => set("about_us", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Terms of Service</Label>
                <Textarea rows={5} value={settings.terms_of_service || ""} onChange={(e) => set("terms_of_service", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Privacy Policy</Label>
                <Textarea rows={5} value={settings.privacy_policy || ""} onChange={(e) => set("privacy_policy", e.target.value)} />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={() => saveKeys(contentKeys)}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                محفوظ کریں
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4 space-y-6">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <Mail className="h-5 w-5 shrink-0" />
            Templates mein <code className="rounded bg-white px-1.5 py-0.5 text-xs">{`{{name}}`}</code>,{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">{`{{event}}`}</code>,{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">{`{{link}}`}</code>,{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">{`{{status}}`}</code> jaisay variables use kar sakte hain.
          </div>
          {emailTemplateKeys.map((t) => (
            <Card key={t.key}>
              <CardHeader>
                <CardTitle className="text-base">{t.label}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={6}
                  value={settings[t.key] || ""}
                  onChange={(e) => set(t.key, e.target.value)}
                />
              </CardContent>
            </Card>
          ))}
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={saving}
            onClick={() => saveKeys(emailTemplateKeys.map((t) => t.key))}
          >
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Email Templates محفوظ کریں
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
