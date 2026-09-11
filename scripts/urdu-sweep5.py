#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Roman Urdu -> Urdu sweep #5: remaining stragglers after sweep4."""
import os

RAW = {
    "رپورٹ جمع ہو گئی. Hamari team review karegi.": "رپورٹ جمع ہو گئی۔ ہماری ٹیم جائزہ لے گی۔",
    '? "approve" : "reject"} ho gayi': '? "منظور" : "مسترد"} ہو گئی',
    'Naya {createEntity === "community" ? "Community" : createEntity === "clan" ? "Clan" : "Sub-Clan"} بنائیں': 'نئی {createEntity === "community" ? "کمیونٹی" : createEntity === "clan" ? "کلان" : "ذیلی کلان"} بنائیں',
    "Email check karein!": "ای میل چیک کریں!",
    "Google se Sign Up Karein": "گوگل سے سائن اپ کریں",
    "Login karein": "لاگ ان کریں",
    "Review Submit Karein": "ریویو جمع کریں",
    "Rabta Karein": "رابطہ کریں",
    "Social Link Add Karein": "سوشل لنک شامل کریں",
    "Buzurg Mode ON Karein?": "بزرگ موڈ آن کریں؟",
    "Prayer times apne shehar ke mutabiq settings mein set karein": "نماز کے اوقات اپنے شہر کے مطابق سیٹنگز میں سیٹ کریں",
    "Surah chala raha hai (audio connect karne ke liye audio URL configure karein)": "سورہ چل رہی ہے (آڈیو منسلک کرنے کے لیے آڈیو URL کنفیگر کریں)",
    "Koi sub-clan nahi hai": "کوئی ذیلی کلان نہیں ہے",
    "Share Karein": "شیئر کریں",
    "Ye event baar baar hoga": "یہ ایونٹ بار بار ہوگا",
    "Apply Karein — ": "درخواست دیں — ",
    "Resume aapke job profile se use hoga (Profile &gt; Job Profile mein update karein)": "ریزیومے آپ کی جاب پروفائل سے استعمال ہوگا (پروفائل &gt; جاب پروفائل میں اپ ڈیٹ کریں)",
    "Kids Mode ON Karein?": "کڈز موڈ آن کریں؟",
    "file(s) delete karein?": "فائلیں ڈیلیٹ کریں؟",
    "Memory delete karein?": "میموری ڈیلیٹ کریں؟",
    "Sab notifications delete karein?": "تمام اطلاعات ڈیلیٹ کریں؟",
    "User report karein?": "صارف کی رپورٹ کریں؟",
    "Hamari team report ka review karegi aur munasib action legi.": "ہماری ٹیم رپورٹ کا جائزہ لے گی اور مناسب کارروائی کرے گی۔",
    '|| "nahi hai"': '|| "نہیں ہے"',
    "Account permanently delete ho jayega": "اکاؤنٹ مستقل طور پر ڈیلیٹ ہو جائے گا",
    "Aapka account, data, memories, sab kuch permanently delete ho jayega.": "آپ کا اکاؤنٹ، ڈیٹا، یادیں، سب کچھ مستقل طور پر ڈیلیٹ ہو جائے گا۔",
    "Hamesha ke liye ڈیلیٹ کریں": "ہمیشہ کے لیے ڈیلیٹ کریں",
    "Buzurg users ke liye bara font recommended hai": "بزرگ صارفین کے لیے بڑا فونٹ تجویز کیا جاتا ہے",
    "2FA Enable Karein": "2FA فعال کریں",
    "Google Authenticator (ya koi bhi TOTP app) install karein.": "گوگل آتھنٹیکیٹر (یا کوئی بھی TOTP ایپ) انسٹال کریں۔",
    "Neeche QR code scan karein ya secret لکھیں۔": "نیچے QR کوڈ اسکین کریں یا سیکرٹ لکھیں۔",
    "Verify Karein": "تصدیق کریں",
    "Backup Codes (sirf ab dikh rahe hain — mehfooz jagah save karein):": "بیک اپ کوڈز (صرف اب دکھ رہے ہیں — محفوظ جگہ رکھیں):",
    "Codes Copy Karein": "کوڈز کاپی کریں",
    "ON hone par site band ho jayegi": "آن ہونے پر سائٹ بند ہو جائے گی",
}


def process_file(path):
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        return False
    original = content
    for old, new in RAW.items():
        if old in content:
            content = content.replace(old, new)
    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


if __name__ == "__main__":
    count = 0
    for root, dirs, files in os.walk("src"):
        dirs[:] = [d for d in dirs if d not in (".next", "node_modules")]
        for name in files:
            if name.endswith((".tsx", ".ts")):
                if process_file(os.path.join(root, name)):
                    count += 1
    if process_file("prisma/seed.ts"):
        count += 1
    print(f"Updated {count} files")
