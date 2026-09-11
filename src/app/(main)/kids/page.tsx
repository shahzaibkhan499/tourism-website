"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Baby, Lock, Loader2, Trophy, Star, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { KIDS_BADGES, KIDS_LEVELS } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  emoji: string;
  image?: string;
  options: string[];
  correct: number;
}

const defaultQuizQuestions: QuizQuestion[] = [
  {
    question: "یہ کون ہیں؟ (تصویر میں جو نظر آ رہے ہیں)",
    emoji: "👨‍🦳",
    options: ["Dada Abu", "چچا", "Mamu", "Phupha"],
    correct: 0,
  },
  {
    question: "آپ کا رشتہ کیا ہے؟ دادا ابو کے بھائی سے",
    emoji: "👴",
    options: ["چچا", "Taya", "Mamu", "Khalu"],
    correct: 1,
  },
  {
    question: "عید ملن پارٹی کب ہوئی تھی؟",
    emoji: "🎉",
    options: ["Eid ul Fitr", "Eid ul Adha", "Pakistan Day", "نیا سال"],
    correct: 0,
  },
  {
    question: "نکاح کی رسم میں کیا ہوتا ہے؟",
    emoji: "🤝",
    options: ["قبول ہے", "Happy Birthday", "Goal!", "Allah Hafiz"],
    correct: 0,
  },
  {
    question: "امی کی امی آپ کی کیا لگتی ہیں؟",
    emoji: "👵",
    options: ["Nani", "Dadi", "Khala", "Phupho"],
    correct: 0,
  },
  {
    question: "بچوں کو عید پر کیا ملتا ہے؟",
    emoji: "🧧",
    options: ["Eidi", "Salary", "Bonus", "Pocket Money"],
    correct: 0,
  },
];

export default function KidsPage() {
  const { kidsMode, setKidsMode, kidsPoints, addKidsPoints } = useAppStore();
  const [passwordInput, setPasswordInput] = useState("");
  const [quizActive, setQuizActive] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizDone, setQuizDone] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [questions, setQuestions] = useState<QuizQuestion[]>(defaultQuizQuestions);
  const [photoQuiz, setPhotoQuiz] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Timer
  useEffect(() => {
    if (!quizActive || quizDone) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizActive, quizDone]);

  useEffect(() => {
    const saved = localStorage.getItem("dk-kids-badges");
    if (saved) setBadges(JSON.parse(saved));
  }, []);

  const toggleKidsMode = () => {
    if (!kidsMode) {
      setKidsMode(true);
      toast.success("کڈز موڈ آن! مزے کرو! 🎈");
    } else {
      if (passwordInput === "family123") {
        setKidsMode(false);
        setPasswordInput("");
        toast.success("Kids Mode OFF");
      } else {
        toast.error("پاس ورڈ غلط ہے (اشارہ: family123)");
      }
    }
  };

  // Build quiz questions from real family photos (memories with media)
  const loadPhotoQuestions = async (): Promise<QuizQuestion[] | null> => {
    try {
      const res = await fetch("/api/memories?limit=50");
      const json = await res.json();
      const items: Array<{ title: string; media: Array<{ url: string }> }> = json.items || [];
      const withPhotos = items.filter((m) => m.media && m.media.length > 0 && m.media[0].url);
      if (withPhotos.length < 4) return null;

      const shuffled = [...withPhotos].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(6, shuffled.length));

      return picked.map((m, idx) => {
        const others = picked.filter((_, j) => j !== idx);
        const distractors = [...others].sort(() => Math.random() - 0.5).slice(0, 3).map((o) => o.title);
        const options = [m.title, ...distractors].sort(() => Math.random() - 0.5);
        return {
          question: "یہ تصویر کس یاد کی ہے؟",
          emoji: "🖼️",
          image: m.media[0].url,
          options,
          correct: options.indexOf(m.title),
        };
      });
    } catch {
      return null;
    }
  };

  const startQuiz = async () => {
    setPhotoLoading(true);
    const photoQs = await loadPhotoQuestions();
    setPhotoLoading(false);

    if (photoQs) {
      setQuestions(photoQs);
      setPhotoQuiz(true);
      toast.info("فوٹو کوئز! اپنی فیملی کی یادیں پہچانو 📸");
    } else {
      setQuestions(defaultQuizQuestions);
      setPhotoQuiz(false);
    }
    setQuizActive(true);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizCorrect(0);
    setTimeLeft(30);
    setQuizDone(false);
  };

  const handleAnswer = (optionIndex: number) => {
    const q = questions[quizIndex];
    const isCorrect = optionIndex === q.correct;
    if (isCorrect) {
      setQuizScore((s) => s + 10);
      setQuizCorrect((c) => c + 1);
      addKidsPoints(10);
      toast.success("Shabash! +10 points! ⭐");
    } else {
      setQuizScore((s) => Math.max(0, s - 5));
      toast.error("غلط! -5 پوائنٹس");
    }

    if (quizIndex >= questions.length - 1) {
      setQuizDone(true);
      const finalScore = quizScore + (isCorrect ? 10 : 0);
      if (finalScore >= 100) {
        const updated = { ...badges, quiz_master: 100 };
        setBadges(updated);
        localStorage.setItem("dk-kids-badges", JSON.stringify(updated));
      }
    } else {
      setQuizIndex((i) => i + 1);
      setTimeLeft(30);
    }
  };

  const currentLevel = KIDS_LEVELS.find((l) => kidsPoints >= l.min && kidsPoints < l.max) || KIDS_LEVELS[3];
  const nextLevel = KIDS_LEVELS[KIDS_LEVELS.indexOf(currentLevel) + 1];
  const levelProgress = nextLevel
    ? Math.min(100, ((kidsPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  if (!kidsMode) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Kids Zone" titleUrdu="بچوں کی دنیا" description="بچوں کے لیے مزیدار سیکھنا اور کھیل" />
        <Card className="text-center">
          <CardContent className="p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-4xl">🧒</div>
            <h2 className="mt-5 text-2xl font-bold">کڈز موڈ آن کریں؟</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              فیملی کوئز، کامیابیاں اور پوائنٹس! بچوں کے لیے محفوظ اور مزیدار۔
            </p>
            <Button size="xl" className="mt-8 bg-yellow-500 text-white hover:bg-yellow-600" onClick={toggleKidsMode}>
              <Baby className="mr-2 h-5 w-5" />
              Kids Mode ON
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header with exit */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Kids Zone 🎈</h1>
          <p className="text-sm text-gray-500">Maze karo aur points jama karo!</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Password"
              className="h-9 w-28"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={toggleKidsMode}>
            Kids Mode OFF
          </Button>
        </div>
      </div>

      {/* Points & level */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-yellow-50">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold text-purple-700">
              <Star className="h-7 w-7 fill-yellow-400 text-yellow-400" />
              آپ کے پوائنٹس: {kidsPoints}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Level: {currentLevel.emoji} {currentLevel.name} ({currentLevel.nameUrdu})
              {nextLevel && <> → اگلا: {nextLevel.emoji} {nextLevel.name}</>}
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Progress value={levelProgress} className="h-4" />
            <p className="mt-1 text-center text-xs text-gray-500">
              {nextLevel ? `${nextLevel.min - kidsPoints} پوائنٹس اور چاہییں` : "Max level!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quiz */}
      <Card className="border-yellow-200">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">
            <Trophy className="mr-1 inline h-5 w-5 text-yellow-500" />
            Apne Khandaan Ko Pehchano!
          </CardTitle>
          {quizActive && !quizDone && (
            <Badge variant={timeLeft <= 10 ? "destructive" : "warning"} className="text-sm">
              ⏰ {timeLeft}s
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {!quizActive ? (
            <div className="text-center">
              <div className="text-6xl">🎯</div>
              <p className="mt-3 text-sm text-gray-600">
                6 sawal, har sawal par 30 seconds. Sahi jawab +10, ghalat -5. 100 points par badge milega!
              </p>
              <Button size="lg" className="mt-4 bg-yellow-500 text-white hover:bg-yellow-600" onClick={startQuiz} disabled={photoLoading}>
                {photoLoading ? <Loader2 className="mr-1 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-1 h-5 w-5" />}
                {photoLoading ? "تصاویر لوڈ ہو رہی ہیں..." : "کوئز شروع کریں"}
              </Button>
              {photoQuiz && (
                <p className="mt-2 text-xs text-gray-500">📸 یہ کوئز آپ کی اصلی فیملی تصاویر پر بنا ہے</p>
              )}
            </div>
          ) : quizDone ? (
            <div className="text-center">
              <div className="text-6xl">{quizScore >= 50 ? "🏆" : "💪"}</div>
              <h3 className="mt-3 text-2xl font-bold text-purple-700">Quiz Khatam!</h3>
              <p className="mt-2 text-gray-600">
                Score: <strong>{quizScore}</strong> · Sahi jawab: {quizCorrect}/{questions.length} · Accuracy:{" "}
                {Math.round((quizCorrect / questions.length) * 100)}%
              </p>
              <Button size="lg" className="mt-4 bg-purple-600 text-white hover:bg-purple-700" onClick={startQuiz}>
                Play Again
              </Button>
            </div>
          ) : (
            <div>
              <div className="text-center">
                {questions[quizIndex].image ? (
                  <div className="mx-auto max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={questions[quizIndex].image}
                      alt="Family photo"
                      className="mx-auto max-h-44 w-auto rounded-xl border-4 border-yellow-200 object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-6xl">{questions[quizIndex].emoji}</div>
                )}
                <h3 className="mt-3 text-lg font-bold">
                  Sawal {quizIndex + 1}/{questions.length}: {questions[quizIndex].question}
                </h3>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {questions[quizIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="rounded-2xl border-2 border-purple-200 bg-white p-4 text-left font-medium transition-all hover:border-purple-400 hover:bg-purple-50 active:scale-95"
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-sm text-gray-500">
                Score: {quizScore} · Sahi: {quizCorrect}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Achievement Badges</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KIDS_BADGES.map((badge) => {
            const progress = badges[badge.id] || 0;
            const earned = progress >= badge.requirement;
            return (
              <div
                key={badge.id}
                className={cn(
                  "rounded-2xl border p-4 text-center",
                  earned ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50 opacity-60"
                )}
              >
                <div className={cn("text-4xl", !earned && "grayscale")}>{badge.emoji}</div>
                <div className="mt-1 font-semibold">
                  {badge.name} {earned && "✓"}
                </div>
                <div className="text-xs text-gray-500">{badge.nameUrdu}</div>
                <p className="mt-1 text-[11px] text-gray-400">{badge.description}</p>
                <Progress value={(progress / badge.requirement) * 100} className="mt-2 h-1.5" />
                <p className="mt-1 text-[10px] text-gray-400">
                  {earned ? "Earned!" : `${progress}/${badge.requirement}`}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Points guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Points Kaise Mileinge?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { action: "فیملی معلومات شامل کریں", points: "+10", emoji: "👨‍👩‍👧‍👦" },
            { action: "تصاویر اپ لوڈ کریں", points: "+5", emoji: "📸" },
            { action: "Quiz khelna", points: "+10", emoji: "🎯" },
            { action: "Daily login", points: "+2", emoji: "📅" },
          ].map((p) => (
            <div key={p.action} className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="text-2xl">{p.emoji}</div>
              <div className="mt-1 text-xs font-medium text-gray-600">{p.action}</div>
              <Badge variant="success" className="mt-1">
                {p.points} points
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
