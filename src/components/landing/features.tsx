"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  Heart,
  Briefcase,
  BookOpen,
  Accessibility,
  ShieldCheck,
  Baby,
  Building2,
  Lock,
  Bell,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { icon: CalendarDays, color: "bg-emerald-100 text-emerald-700", title: "Events", desc: "Family events banayein, manage karein aur RSVP lein — shaadi, eid, mehndi sab." },
  { icon: Users, color: "bg-blue-100 text-blue-700", title: "Clan & Community", desc: "Apni community, clan aur sub-clan se judein. Apne logon ko dhundein." },
  { icon: Heart, color: "bg-pink-100 text-pink-700", title: "Rishta", desc: "Respectful aur safe rishta search. Guardian mode aur verification ke saath." },
  { icon: Briefcase, color: "bg-amber-100 text-amber-700", title: "Jobs", desc: "Family businesses ki jobs. Apni community ke logon ke saath kaam karein." },
  { icon: BookOpen, color: "bg-purple-100 text-purple-700", title: "Memories & Media", desc: "Yaadein mehfooz karein — photos, videos aur kahaniyan aik jagah." },
  { icon: Accessibility, color: "bg-orange-100 text-orange-700", title: "Buzurg Mode", desc: "Bade buzurgon ke liye simple UI, video calls aur medicine reminders." },
  { icon: ShieldCheck, color: "bg-green-100 text-green-700", title: "Security", desc: "bcrypt encryption, 2FA, rate limiting aur audit logs." },
  { icon: Baby, color: "bg-yellow-100 text-yellow-700", title: "Kids Zone", desc: "Family quiz, achievements aur points ke saath bachon ki learning." },
  { icon: HeartHandshake, color: "bg-rose-100 text-rose-700", title: "Female First", desc: "Khawateen ki privacy aur suraksha sab se pehle. Guardian mode available." },
  { icon: Building2, color: "bg-sky-100 text-sky-700", title: "Business Directory", desc: "Family-owned businesses discover karein aur reviews dein." },
  { icon: Lock, color: "bg-slate-100 text-slate-700", title: "E2E Encryption", desc: "Aapka data aapka hai. End-to-end security ke saath." },
  { icon: Bell, color: "bg-red-100 text-red-700", title: "Notifications", desc: "Event reminders, rishta requests aur updates — kabhi miss na karein." },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sab Kuch Ek Platform Pe</h2>
          <p className="mt-3 text-gray-600">
            12 powerful features jo aapke poore khandaan ko digital banati hain
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.08 }}
              className="group rounded-2xl border border-gray-100 p-6 transition-all duration-300 hover:border-green-200 hover:shadow-xl"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                  feature.color
                )}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
