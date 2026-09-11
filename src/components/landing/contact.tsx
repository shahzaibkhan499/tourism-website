"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "کچھ غلط ہو گیا");
        return;
      }
      toast.success(data.message || "پیغام بھیج دیا گیا!");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="bg-gray-50 py-20">
      <div className="container grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">ہم سے رابطہ کریں</h2>
          <p className="mt-3 text-gray-600">
            کوئی سوال ہے؟ تجویز دینا چاہتے ہیں؟ ہم سننے کے لیے ہمیشہ تیار ہیں۔
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Mail className="h-5 w-5" />
              </div>
              support@digitalkhandaan.pk
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <MessageSquare className="h-5 w-5" />
              </div>
              +92 300 1234567 (Mon–Sat, 9am–6pm)
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">نام</Label>
              <Input
                id="contact-name"
                placeholder="آپ کا نام"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="aap@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              placeholder="کس بارے میں بات کرنی ہے؟"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              minLength={2}
            />
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              rows={5}
              placeholder="اپنا پیغام یہاں لکھیں..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              minLength={10}
            />
          </div>
          <Button type="submit" className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            <Send className="mr-1 h-4 w-4" />
            {loading ? "بھیجا جا رہا ہے..." : "پیغام بھیجیں"}
          </Button>
        </form>
      </div>
    </section>
  );
}
