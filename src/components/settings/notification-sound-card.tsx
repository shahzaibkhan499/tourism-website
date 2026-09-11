"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/audio";

// ============================================================
// NOTIFICATION SOUND CARD — Settings > Notifications tab.
// Toggles the Web Audio chime for new notifications.
// Preference persists in localStorage (dk-notification-sound).
// ============================================================
export function NotificationSoundCard() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isNotificationSoundEnabled());
  }, []);

  const toggle = (v: boolean) => {
    setEnabled(v);
    setNotificationSoundEnabled(v);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Sound</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {enabled ? (
              <Volume2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <div className="text-sm font-medium">نئی اطلاع پر آواز (chime)</div>
              <div className="text-xs text-gray-500">
                صرف اُس وقت بجے گی جب ٹیب کھلا ہو — آف کریں تو خاموشی
              </div>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={toggle} />
        </div>
      </CardContent>
    </Card>
  );
}
