"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Sahi email address likhein");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Kuch ghalat ho gaya");
        return;
      }
      setSent(true);
      toast.success("Reset link bhej diya gaya hai");
    } catch {
      toast.error("Network error. Dobara koshish karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Password Bhool Gaye?</CardTitle>
        <CardDescription>Fikr na karein — hum reset kar denge</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="text-center">
            <div className="text-5xl">📬</div>
            <h3 className="mt-4 text-lg font-semibold">Email check karein!</h3>
            <p className="mt-2 text-sm text-gray-600">
              Agar <strong>{email}</strong> hamare system mein mojood hai to reset link bhej diya gaya hai.
            </p>
            <Button className="mt-6" variant="outline" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Login par wapas jayen
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="aap@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Bheja ja raha hai..." : "Reset Link Bhejein"}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Yaad aa gaya?{" "}
              <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
                Login karein
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
