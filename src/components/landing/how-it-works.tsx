"use client";

import { motion } from "framer-motion";
import { UserPlus, Users, CalendarDays, Share2 } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "رجسٹر کریں", desc: "صرف 2 منٹ میں فری اکاؤنٹ بنائیں۔ گوگل سے بھی سائن اپ کر سکتے ہیں۔" },
  { icon: Users, title: "کلان سے جڑیں", desc: "اپنی کمیونٹی اور کلان منتخب کریں۔ اپنے لوگوں کو ڈھونڈیں اور جڑیں۔" },
  { icon: CalendarDays, title: "ایونٹس بنائیں", desc: "شادی، عید، عقیقہ — کوئی بھی ایونٹ بنائیں اور فیملی کو مدعو کریں۔" },
  { icon: Share2, title: "Share & Grow", desc: "یادیں شیئر کریں، نوکریاں ڈھونڈیں، اور اپنا خاندان بڑھائیں۔" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gradient-to-b from-emerald-50 to-green-50/50 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">شروع کرنا کتنا آسان ہے؟</h2>
          <p className="mt-3 text-gray-600">Char simple steps — bas!</p>
        </div>
        <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-7 hidden h-0.5 bg-emerald-200 lg:block" />
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                <step.icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-700 shadow">
                  {i + 1}
                </span>
              </div>
              <div className="mt-5 w-full rounded-2xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
