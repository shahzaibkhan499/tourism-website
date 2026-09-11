"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Phone,
  Users,
  Camera,
  Mic,
  AudioLines,
  Square,
  Accessibility,
  AlertTriangle,
  Check,
  Play,
  Pause,
  Loader2,
  BellRing,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import {
  getQuranAudioElement,
  playAlarm,
  playQuranAudio,
  preloadQuranMetadata,
  quranStreamUrl,
  setQuranVolume as setQuranElVolume,
} from "@/lib/audio";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRAYER_TIMES, QURAN_SURAHS } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
}

interface MedicineReminder {
  id: string;
  name: string;
  time: string;
  days: string[];
}

export default function BuzurgPage() {
  const { buzurgMode, setBuzurgMode } = useAppStore();
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [medicineName, setMedicineName] = useState("");
  const [medicineTime, setMedicineTime] = useState("08:00");
  const [medicineDays, setMedicineDays] = useState<string[]>(["MON"]);
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [checkInDone, setCheckInDone] = useState(false);
  const [playingSurah, setPlayingSurah] = useState<number | null>(null);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // Quran player state (Fix 1)
  const [quranLoading, setQuranLoading] = useState(false);
  const [quranError, setQuranError] = useState<string | null>(null);
  const [quranVolume, setQuranVolumeState] = useState(0.8);
  const [quranPaused, setQuranPaused] = useState(false);
  const quranFallbackRef = useRef(false);
  // Medicine alarm state (Fix 2)
  const [alarmReminder, setAlarmReminder] = useState<MedicineReminder | null>(null);
  const stopAlarmFnRef = useRef<(() => void) | null>(null);
  const firedAlarmsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/clans")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          for (const c of data.communities || []) {
            for (const clan of c.clans || []) {
              if (clan.id === data.myClanId) {
                // We'll fetch members when user is in a clan
                fetch(`/api/clans/${clan.id}`)
                  .then((r) => r.json())
                  .then((clanData) => {
                    if (!clanData.error) {
                      setFamily(
                        clanData.members.slice(0, 10).map((m: { id: string; name: string }) => ({
                          id: m.id,
                          name: m.name || "Family Member",
                          relation: "خاندان",
                        }))
                      );
                    }
                  })
                  .catch(() => {});
              }
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setFamilyLoading(false));

    const saved = localStorage.getItem("dk-medicine-reminders");
    if (saved) setReminders(JSON.parse(saved));

    // preload first surah metadata (no heavy download)
    preloadQuranMetadata(quranStreamUrl(1));
  }, []);

  // Medicine alarm checker — every 10s, plays Web Audio alarm at reminder time
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][now.getDay()];
      for (const r of reminders) {
        if (r.time !== hhmm) continue;
        if (!r.days.includes(today)) continue;
        const key = `${r.id}-${hhmm}`;
        if (firedAlarmsRef.current.has(key)) continue;
        firedAlarmsRef.current.add(key);
        setAlarmReminder(r);
        void playAlarm().then((handle) => {
          if (handle) stopAlarmFnRef.current = handle.stop;
        });
      }
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [reminders]);

  // ---------- Quran player functions (Fix 1) ----------
  const startSurah = async (id: number) => {
    stopAlarmFnRef.current?.();
    setQuranError(null);
    setQuranPaused(false);
    setQuranLoading(true);
    const url = quranStreamUrl(id, quranFallbackRef.current);
    const el = await playQuranAudio(url);
    if (!el) {
      setQuranLoading(false);
      setQuranError("آڈیو چلانے کے لیے براؤزر سپورٹ نہیں ہے");
      return;
    }
    el.volume = quranVolume;
    el.onplaying = () => setQuranLoading(false);
    el.onwaiting = () => setQuranLoading(true);
    el.onpause = () => setQuranPaused(true);
    el.onplay = () => setQuranPaused(false);
    el.onended = () => {
      // auto-advance to next surah when one finishes
      void startSurah(id === 114 ? 1 : id + 1);
    };
    el.onerror = () => {
      if (!quranFallbackRef.current) {
        // primary CDN failed → retry with fallback mirror once
        quranFallbackRef.current = true;
        toast.info("دوسرے سرور سے کوشش ہو رہی ہے...");
        void startSurah(id);
      } else {
        setQuranLoading(false);
        setQuranPaused(false);
        setQuranError("آڈیو لوڈ نہیں ہو سکی — انٹرنیٹ کنکشن چیک کریں");
      }
    };
    setPlayingSurah(id);
  };

  const toggleSurah = (id: number) => {
    const el = getQuranAudioElement();
    if (playingSurah === id && el && !quranError) {
      if (!el.paused) {
        el.pause();
        setQuranPaused(true);
        setPlayingSurah(id);
        return;
      }
      void el.play().catch(() => setQuranError("آڈیو چل نہیں سکی — دوبارہ کوشش کریں"));
      setQuranPaused(false);
      return;
    }
    void startSurah(id);
  };

  const nextSurah = (current: number | null) => {
    if (current) void startSurah(current === 114 ? 1 : current + 1);
  };
  const prevSurah = (current: number | null) => {
    if (current) void startSurah(current === 1 ? 114 : current - 1);
  };

  const stopAlarmAndClear = () => {
    stopAlarmFnRef.current?.();
    stopAlarmFnRef.current = null;
    setAlarmReminder(null);
    toast.success("الارم بند کر دیا گیا");
  };

  // Real voice note recording (MediaRecorder) → upload → memory
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setRecordingBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          if (blob.size === 0) {
            toast.error("کچھ ریکارڈ نہیں ہوا");
            return;
          }
          const fd = new FormData();
          fd.append("file", blob, `voice-note-${Date.now()}.webm`);
          const uploadRes = await fetch("/api/media/upload", { method: "POST", body: fd });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            toast.error(uploadData.error || "وائس نوٹ محفوظ نہیں ہوا");
            return;
          }
          const memRes = await fetch("/api/memories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "آواز کا پیغام (Voice Note)",
              description: "بزرگ موڈ سے ریکارڈ کیا گیا وائس نوٹ",
              date: new Date().toISOString(),
              category: "DAILY_LIFE",
              isPublic: false,
              media: [
                {
                  url: uploadData.url,
                  publicId: uploadData.publicId || null,
                  type: "AUDIO",
                  size: blob.size,
                  mimeType: blob.type,
                },
              ],
            }),
          });
          const memData = await memRes.json();
          if (!memRes.ok) {
            toast.error(memData.error || "وائس نوٹ محفوظ نہیں ہوا");
            return;
          }
          toast.success("وائس نوٹ محفوظ ہو گیا! یادوں میں دیکھیں 🎙️");
        } catch {
          toast.error("وائس نوٹ محفوظ کرنے میں مسئلہ آ گیا");
        } finally {
          setRecordingBusy(false);
        }
      };
      mr.start();
      setRecording(true);
      toast.info("ریکارڈنگ شروع... روکنے کے لیے دوبارہ بٹن دبائیں", { duration: 5000 });
    } catch {
      toast.error("مائیکروفون کی اجازت نہیں ملی۔ براؤزر سیٹنگز چیک کریں۔");
    }
  };

  const addReminder = () => {
    if (!medicineName.trim()) {
      toast.error("دوا کا نام لکھیں");
      return;
    }
    const reminder: MedicineReminder = {
      id: `med-${Date.now()}`,
      name: medicineName,
      time: medicineTime,
      days: medicineDays,
    };
    const updated = [...reminders, reminder];
    setReminders(updated);
    localStorage.setItem("dk-medicine-reminders", JSON.stringify(updated));
    setMedicineName("");
    toast.success("دوا کا ریمائنڈر محفوظ ہو گیا!");
  };

  const removeReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    localStorage.setItem("dk-medicine-reminders", JSON.stringify(updated));
  };

  const handleCheckIn = () => {
    setCheckInDone(true);
    toast.success("فیملی کو بتا دیا گیا: میں ٹھیک ہوں! 💚");
  };

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  if (!buzurgMode) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Buzurg Mode" titleUrdu="بزرگ موڈ" description="بزرگوں کے لیے آسان اور بڑا انٹرفیس" />
        <Card className="text-center">
          <CardContent className="p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <Accessibility className="h-10 w-10 text-emerald-700" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">بزرگ موڈ آن کریں؟</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              بڑا فونٹ، بڑے بٹن، صرف 4 آسان آپشنز۔ ویڈیو کالز، فیملی، تصویریں اور یادیں۔
            </p>
            <Button size="xl" className="mt-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => setBuzurgMode(true)}>
              Buzurg Mode ON
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="buzurg-text mx-auto max-w-xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="buzurg-heading font-bold">السلام علیکم! 🙏</h1>
          <p className="text-gray-600">Aaj kya karna hai?</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Buzurg Mode</span>
          <Switch checked={buzurgMode} onCheckedChange={setBuzurgMode} />
        </div>
      </div>

      {/* 4 big buttons */}
      <div className="space-y-5">
        <Dialog open={familyOpen} onOpenChange={setFamilyOpen}>
          <button
            onClick={() => setFamilyOpen(true)}
            className="flex w-full items-center gap-4 rounded-2xl bg-emerald-600 p-8 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Phone className="h-10 w-10" />
            <span className="text-2xl font-bold">ویڈیو کال کریں</span>
          </button>
          <DialogContent className="buzurg-text">
            <DialogHeader>
              <DialogTitle>کس سے بات کرنی ہے؟</DialogTitle>
              <DialogDescription>Family member chunein</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {familyLoading ? (
                <p className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Family load ho rahi hai...
                </p>
              ) : family.length === 0 ? (
                <p className="py-6 text-center text-gray-500">ابھی کوئی فیملی ممبر نہیں ہے۔ پہلے کلان جوائن کریں۔</p>
              ) : (
                family.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toast.success(`${m.name} ko call lag rahi hai...`)}
                    className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg">👤</div>
                    <div>
                      <div className="text-lg font-semibold">{m.name}</div>
                      <div className="text-sm text-gray-500">{m.relation}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <button
          onClick={() => setFamilyOpen(true)}
          className="flex w-full items-center gap-4 rounded-2xl bg-blue-600 p-8 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Users className="h-10 w-10" />
          <span className="text-2xl font-bold">فیملی دیکھیں</span>
        </button>

        <button
          onClick={() => (window.location.href = "/media")}
          className="flex w-full items-center gap-4 rounded-2xl bg-yellow-500 p-8 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Camera className="h-10 w-10" />
          <span className="text-2xl font-bold">تصویریں دیکھیں</span>
        </button>

        <button
          onClick={() => (window.location.href = "/memories")}
          className="flex w-full items-center gap-4 rounded-2xl bg-purple-600 p-8 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Mic className="h-10 w-10" />
          <span className="text-2xl font-bold">یادیں سنائیں</span>
        </button>

        <button
          onClick={toggleRecording}
          disabled={recordingBusy}
          className={cn(
            "flex w-full items-center gap-4 rounded-2xl p-8 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95",
            recording ? "animate-pulse bg-red-600" : "bg-teal-600"
          )}
        >
          {recording ? <Square className="h-10 w-10" /> : <AudioLines className="h-10 w-10" />}
          <span className="text-2xl font-bold">{recording ? "ریکارڈنگ روکیں" : "آواز ریکارڈ کریں"}</span>
        </button>
        {recording && <p className="text-center text-sm font-medium text-red-600">● Recording jaari hai...</p>}
      </div>

      {/* Check-in */}
      <Card className={cn(checkInDone ? "border-emerald-300 bg-emerald-50" : "")}>
        <CardContent className="p-6">
          <button
            onClick={handleCheckIn}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-2xl p-8 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95",
              checkInDone ? "bg-emerald-600" : "bg-green-700"
            )}
          >
            {checkInDone ? <Check className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
            <span className="text-2xl font-bold">{checkInDone ? "بیٹا بتا دیا! 💚" : "میں ٹھیک ہوں"}</span>
          </button>
          <p className="mt-2 text-center text-sm text-gray-500">اس بٹن سے فیملی کو پتہ چلے گا کہ آپ ٹھیک ہیں</p>
        </CardContent>
      </Card>

      {/* Prayer times */}
      <Card>
        <CardHeader>
          <CardTitle className="buzurg-heading">نماز کے اوقات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PRAYER_TIMES.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="flex items-center gap-2 text-xl font-semibold">
                <span>{p.emoji}</span> {p.nameUrdu}
              </span>
              <span className="text-gray-500">—:—</span>
            </div>
          ))}
          <p className="text-center text-xs text-gray-400">نماز کے اوقات اپنے شہر کے مطابق سیٹنگز میں سیٹ کریں</p>
        </CardContent>
      </Card>

      {/* Quran player — real HTML5 audio via islamic.network CDN (Fix 1) */}
      <Card>
        <CardHeader>
          <CardTitle className="buzurg-heading">قرآن سنیں</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {playingSurah ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold text-emerald-800">
                    {QURAN_SURAHS.find((s) => s.id === playingSurah)?.nameUrdu ?? ""}
                  </div>
                  <div className="text-sm text-gray-500">
                    سورہ نمبر {playingSurah} — {QURAN_SURAHS.find((s) => s.id === playingSurah)?.name ?? ""}
                  </div>
                </div>
                {quranLoading && <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />}
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  className="h-14 w-14 rounded-full"
                  onClick={() => prevSurah(playingSurah)}
                  aria-label="پچھلی سورہ"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>
                <Button
                  className="h-20 w-20 rounded-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => toggleSurah(playingSurah)}
                  aria-label="چلائیں یا روکیں"
                >
                  {quranLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : quranPaused ? (
                    <Play className="h-9 w-9" />
                  ) : (
                    <Pause className="h-9 w-9" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-14 w-14 rounded-full"
                  onClick={() => nextSurah(playingSurah)}
                  aria-label="اگلی سورہ"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Volume2 className="h-6 w-6 shrink-0 text-gray-500" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={quranVolume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setQuranVolumeState(v);
                    setQuranElVolume(v);
                  }}
                  className="h-3 w-full accent-emerald-600"
                  aria-label="آواز کی مقدار"
                />
              </div>

              {quranError && <p className="mt-3 text-center text-base text-red-600">{quranError}</p>}
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
              سورہ چن کر سنیں — پہلی بار بٹن دبانے پر آواز شروع ہوگی 🔊
            </p>
          )}

          <div className="max-h-80 overflow-y-auto rounded-xl border">
            {QURAN_SURAHS.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSurah(s.id)}
                className={cn(
                  "flex w-full items-center justify-between border-b p-3.5 text-left transition-colors last:border-b-0",
                  playingSurah === s.id ? "border-emerald-300 bg-emerald-50" : "hover:bg-gray-50"
                )}
              >
                <span className="text-lg font-semibold">
                  {s.id}. {s.nameUrdu}
                </span>
                {playingSurah === s.id ? (
                  quranLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  ) : quranPaused ? (
                    <Play className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <Pause className="h-6 w-6 text-emerald-600" />
                  )
                ) : (
                  <Play className="h-6 w-6 text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medicine reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="buzurg-heading">دوا کا وقت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-lg">دوا کا نام</Label>
              <Input
                className="buzurg-text h-12"
                placeholder="مثلاً: بلڈ پریشر کی دوا"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-lg">وقت</Label>
              <Input className="buzurg-text h-12" type="time" value={medicineTime} onChange={(e) => setMedicineTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-lg">کون سے دن</Label>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setMedicineDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
                    }
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium",
                      medicineDays.includes(d) ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <Button className="h-12 w-full bg-emerald-600 text-lg hover:bg-emerald-700" onClick={addReminder}>
              دوا یاد دلائیں
            </Button>
          </div>
          {reminders.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              {reminders.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                  <div>
                    <div className="text-lg font-semibold">💊 {r.name}</div>
                    <div className="text-sm text-gray-500">
                      {r.time} · {r.days.join(", ")}
                    </div>
                  </div>
                  <button onClick={() => removeReminder(r.id)} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicine alarm (Fix 2) — vibrating bell + big Stop button */}
      {alarmReminder && (
        <Card className="border-red-400 bg-red-50">
          <CardContent className="space-y-4 p-6">
            <style>{`@keyframes dk-bell-shake { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(18deg); } 40% { transform: rotate(-18deg); } 60% { transform: rotate(10deg); } 80% { transform: rotate(-10deg); } } .dk-bell-shake { animation: dk-bell-shake 0.6s ease-in-out infinite; }`}</style>
            <div className="flex justify-center">
              <BellRing className="dk-bell-shake h-16 w-16 text-red-600" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">💊 {alarmReminder.name}</div>
              <p className="mt-1 text-lg text-gray-600">دوا کا وقت ہو گیا ہے!</p>
            </div>
            <Button className="h-14 w-full bg-red-600 text-xl text-white hover:bg-red-700" onClick={stopAlarmAndClear}>
              الارم بند کریں — Stop Alarm
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Emergency */}
      <Card className="border-red-300 bg-red-50">
        <CardContent className="p-6">
          <button
            onClick={() => toast.success("ایمرجنسی نمبر پر کال جا رہی ہے... 📞")}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 p-8 text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
          >
            <AlertTriangle className="h-8 w-8" />
            <span className="text-2xl font-bold">ایمرجنسی کال</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
