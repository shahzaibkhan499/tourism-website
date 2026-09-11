"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { Quote } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const testimonials = [
  {
    name: "Rana Khalid Mehmood",
    clan: "Arain Clan, Lahore",
    quote: `${APP_NAME} ne humari family ko phir se jor diya. Ab har event par poora khandaan RSVP karta hai, aur rishte bhi platform par hi pakke ho gaye!`,
  },
  {
    name: "Saima Yousafzai",
    clan: "Yousafzai Clan, Swat",
    quote: "بزرگ موڈ کی وجہ سے میری امی اب خود ویڈیو کالز کرتی ہیں۔ میڈیسن ریمائنڈر فیچر بہت کام آیا۔ اللہ خوش رکھے ٹیم کو۔",
  },
  {
    name: "Usman Memon",
    clan: "Memon Clan, Karachi",
    quote: "ہمارا فیملی بزنس اب ڈائریکٹری میں درج ہے اور کمیونٹی کے لوگوں سے 3 نئے آرڈرز ملے ہیں۔ نوکریاں پوسٹ کرنا بھی بہت آسان ہے۔",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-white py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Family Ne Kya Kaha?</h2>
          <p className="mt-3 text-gray-600">Pakistan bhar ki families ka bharosa</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6"
            >
              <Quote className="h-8 w-8 text-emerald-200" />
              <p className="mt-3 text-sm leading-relaxed text-gray-700">&quot;{t.quote}&quot;</p>
              <div className="mt-5 flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-emerald-600 text-white">
                  <AvatarFallback className="bg-emerald-600 text-white">{initials(t.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.clan}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
