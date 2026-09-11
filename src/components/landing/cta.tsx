"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function CTA() {
  return (
    <section className="bg-gradient-to-r from-emerald-600 to-green-600 py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Abhi Shuru Karein</h2>
          <p className="mt-4 text-lg text-emerald-100">
            Hazaron families pehle se {APP_NAME} par hain. Aaj hi apna khandaan jodein — bilkul free.
          </p>
          <div className="mt-8">
            <Button size="xl" className="bg-white text-emerald-700 shadow-lg hover:bg-emerald-50" asChild>
              <Link href="/register">
                Free Account Banayein
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
