"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="pattern-islamic relative min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 pt-16">
      <div className="container relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          Pakistan ka Pehla Complete Family Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
        >
          Apne <span className="text-gradient-green">Khandaan</span> Ko
          <br />
          Digital بنائیں
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 max-w-2xl text-lg text-gray-600"
        >
          Events, clans, rishta, jobs, memories aur bohat kuch — sab aik hi platform par.
          اپنی فیملی کو جوڑیں، یادیں محفوظ کریں، اور اپنی کمیونٹی کے ساتھ بڑھیں۔
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Button size="xl" className="bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700" asChild>
            <Link href="/register">
              فری میں شروع کریں
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/login">لاگ اِن کریں</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {[
            { icon: "📅", label: "Events", desc: "Family functions" },
            { icon: "👥", label: "Clans", desc: "Community judein" },
            { icon: "💚", label: "رشتہ", desc: "Safe & respectful" },
            { icon: "💼", label: "Jobs", desc: "Family businesses" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-100 bg-white/70 p-4 shadow-sm backdrop-blur">
              <div className="text-2xl">{item.icon}</div>
              <div className="mt-1 font-semibold">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
