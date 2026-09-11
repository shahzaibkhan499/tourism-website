#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Final Roman Urdu -> Urdu sweep #4: remaining stragglers found by grep."""
import os

RAW = {
    # reset-password
    "Naya Password Set Karein": "نیا پاس ورڈ سیٹ کریں",
    "Confirm Naya Password": "نئے پاس ورڈ کی تصدیق",
    "Naya Password": "نیا پاس ورڈ",
    "Naya email": "نیا ای میل",
    # business
    "Review submit ho gayi! ⭐": "ریویو جمع ہو گیا! ⭐",
    "Abhi koi review nahi hai": "ابھی کوئی ریویو نہیں ہے",
    "Image upload ho gayi": "تصویر اپ لوڈ ہو گئی",
    # buzurg
    "Bara font, bade buttons, sirf 4 aasan options. Video calls, family, tasveerein aur yaadein.": "بڑا فونٹ، بڑے بٹن، صرف 4 آسان آپشنز۔ ویڈیو کالز، فیملی، تصویریں اور یادیں۔",
    "Abhi koi family member nahi hai. Pehle clan join karein.": "ابھی کوئی فیملی ممبر نہیں ہے۔ پہلے کلان جوائن کریں۔",
    "Is button se family ko pata chalega ke aap theek hain": "اس بٹن سے فیملی کو پتہ چلے گا کہ آپ ٹھیک ہیں",
    # events
    "Aap ka jawab?": "آپ کا جواب؟",
    "Abhi koi confirm nahi hua": "ابھی کسی نے تصدیق نہیں کی",
    "Yeh event hamesha ke liye delete ho jayega aur yeh action wapas nahi ho sakta.": "یہ ایونٹ ہمیشہ کے لیے ڈیلیٹ ہو جائے گا اور یہ عمل واپس نہیں ہو سکتا۔",
    "Cover image upload ho gayi": "کور تصویر اپ لوڈ ہو گئی",
    # jobs
    "Aapki job profile se details auto-fill ho jayengi. Cover letter likhein.": "آپ کی جاب پروفائل سے تفصیلات خود بھر جائیں گی۔ کور لیٹر لکھیں۔",
    "Resume aapke job profile se use hoga (Profile > Job Profile mein update karein)": "ریزیومے آپ کی جاب پروفائل سے استعمال ہوگا (پروفائل > جاب پروفائل میں اپ ڈیٹ کریں)",
    "Job post ho gayi! 🎉": "جاب پوسٹ ہو گئی! 🎉",
    "Job post karne ke liye business profile hona zaroori hai. Agar nahi hai to pehle": "جاب پوسٹ کرنے کے لیے بزنس پروفائل ہونا ضروری ہے۔ اگر نہیں ہے تو پہلے",
    "Ye job ghar se ki ja sakti hai": "یہ جاب گھر سے کی جا سکتی ہے",
    "Job profile save ho gayi! 🎉": "جاب پروفائل محفوظ ہو گئی! 🎉",
    "Jobs ke liye aapki professional profile": "جابز کے لیے آپ کی پیشہ ورانہ پروفائل",
    "Abhi job profile nahi hai. بنائیں taake aap jobs par apply kar sakein.": "ابھی جاب پروفائل نہیں ہے۔ بنائیں تاکہ آپ جابز پر درخواست دے سکیں۔",
    "Professional details bharein — jobs par apply karne ke liye zaroori": "پیشہ ورانہ تفصیلات بھریں — جابز پر درخواست دینے کے لیے ضروری",
    "Skills (comma se alag karein)": "مہارتیں (کوما سے الگ کریں)",
    "Abhi koi experience nahi add kiya": "ابھی کوئی تجربہ شامل نہیں کیا",
    "Abhi koi education nahi add ki": "ابھی کوئی تعلیم شامل نہیں کی",
    # kids
    "Naya Saal": "نیا سال",
    "Aapke Points:": "آپ کے پوائنٹس:",
    "Ye quiz aapki asli family photos par bana hai": "یہ کوئز آپ کی اصلی فیملی تصاویر پر بنا ہے",
    # media / memories
    "File upload ho gayi": "فائل اپ لوڈ ہو گئی",
    "Media upload ho gayi": "میڈیا اپ لوڈ ہو گئی",
    "Public memory aapki clan ke members dekh sakte hain": "پبلک میموری آپ کی کلان کے ممبران دیکھ سکتے ہیں",
    "Memory delete ho gayi": "میموری ڈیلیٹ ہو گئی",
    "aaj ke din yeh yaadein bani thin": "آج کے دن یہ یادیں بنی تھیں",
    "Yeh memory aur is ki sab media hamesha ke liye delete ho jayegi.": "یہ میموری اور اس کا سارا میڈیا ہمیشہ کے لیے ڈیلیٹ ہو جائے گا۔",
    # profile
    "Report submit ho gayi": "رپورٹ جمع ہو گئی",
    "Report Karein": "رپورٹ کریں",
    "Profile photo update ho gayi!": "پروفائل تصویر اپ ڈیٹ ہو گئی!",
    "Profile update ho gayi!": "پروفائل اپ ڈیٹ ہو گئی!",
    "Apni maloomat update karein": "اپنی معلومات اپ ڈیٹ کریں",
    "Update Karein": "اپ ڈیٹ کریں",
    # rishta
    "Profile Report Karein": "پروفائل رپورٹ کریں",
    "Kya yeh profile fake ya inappropriate lagti hai? Report karne par hamari team review karegi.": "کیا یہ پروفائل جعلی یا نامناسب لگتی ہے؟ رپورٹ کرنے پر ہماری ٹیم جائزہ لے گی۔",
    "Yeh profile abhi verified nahi hai. Photos aur kuch details sirf verification ke baad dikhti hain.": "یہ پروفائل ابھی تصدیق شدہ نہیں ہے۔ تصاویر اور کچھ تفصیلات صرف تصدیق کے بعد دکھائی دیتی ہیں۔",
    "Photo upload ho gayi": "تصویر اپ لوڈ ہو گئی",
    "Guardian mode ON karne par requests seedha guardian ke paas jayengi (female profiles ke liye recommended)": "گارڈین موڈ آن کرنے پر درخواستیں سیدھی گارڈین کے پاس جائیں گی (خواتین پروفائلز کے لیے تجویز کردہ)",
    "Note: Photos sirf verified users ko dikhti hain. Non-verified logon ke liye photos blur rehti hain.": "نوٹ: تصاویر صرف تصدیق شدہ صارفین کو دکھائی دیتی ہیں۔ غیر تصدیق شدہ صارفین کے لیے تصاویر دھندلی رہتی ہیں۔",
    # settings
    "Clan Only — sirf aapki clan": "صرف کلان — صرف آپ کی کلان",
    "Private — sirf aap": "پرائیویٹ — صرف آپ",
    "Sirf OTP codes": "صرف OTP کوڈز",
    # admin dashboard
    "Koi pending report nahi hai 🎉": "کوئی زیر التواء رپورٹ نہیں ہے 🎉",
    # admin users
    "User ban karein:": "صارف کو بند کریں:",
    "Ban Karein": "بند کریں",
    "User permanently delete karein?": "صارف کو مستقل طور پر ڈیلیٹ کریں؟",
    "ka sara data delete ho jayega.": "کا سارا ڈیٹا ڈیلیٹ ہو جائے گا۔",
    "Confirm karne ke liye": "تصدیق کے لیے",
    "type karein.": "لکھیں۔",
    "Delete Karein": "ڈیلیٹ کریں",
    "Delete karein:": "ڈیلیٹ کریں:",
    # admin clans
    "Koi join request nahi hai": "کوئی جوائن درخواست نہیں ہے",
    "Details bharein aur save karein": "تفصیلات بھریں اور محفوظ کریں",
    "Create Karein": "بنائیں",
    # admin events
    "Event delete karein?": "ایونٹ ڈیلیٹ کریں؟",
    "aur is ke sab RSVPs delete ho jayenge.": "اور اس کے تمام RSVPs ڈیلیٹ ہو جائیں گے۔",
    # admin businesses
    "Business delete karein?": "بزنس ڈیلیٹ کریں؟",
    "aur is ki jobs/reviews permanently delete ho jayengi.": "اور اس کی جابز/ریویوز مستقل طور پر ڈیلیٹ ہو جائیں گی۔",
    # admin rishta
    "Rishta profile delete karein?": "رشتہ پروفائل ڈیلیٹ کریں؟",
    "ki profile permanently delete ho jayegi.": "کی پروفائل مستقل طور پر ڈیلیٹ ہو جائے گی۔",
    # admin jobs
    "Job delete karein?": "جاب ڈیلیٹ کریں؟",
    "aur is ki applications delete ho jayengi.": "اور اس کی درخواستیں ڈیلیٹ ہو جائیں گی۔",
    # admin media
    "Koi media nahi hai": "کوئی میڈیا نہیں ہے",
    "File delete karein?": "فائل ڈیلیٹ کریں؟",
    "ki file (": "کی فائل (",
    ") delete ho jayegi.": ") ڈیلیٹ ہو جائے گی۔",
    # admin audit / contact
    "Koi audit entry nahi hai": "کوئی آڈٹ اندراج نہیں ہے",
    "Koi contact message nahi hai": "کوئی رابطہ پیغام نہیں ہے",
    "Message delete karein?": "پیغام ڈیلیٹ کریں؟",
    "Reply Karein": "جواب دیں",
    # api messages
    "media file(s) delete ho gayi": "میڈیا فائلیں ڈیلیٹ ہو گئیں",
    "file(s) delete ho gayi": "فائلیں ڈیلیٹ ہو گئیں",
    "Report resolve ho gayi": "رپورٹ حل ہو گئی",
    "Aapki report ka review ho gaya hai.": "آپ کی رپورٹ کا جائزہ لیا جا چکا ہے۔",
    "Aapke khilaf report aayi hai.": "آپ کے خلاف رپورٹ آئی ہے۔",
    "Job delete ho gayi": "جاب ڈیلیٹ ہو گئی",
    "ke liye apply kiya hai": "کے لیے درخواست دی ہے",
    "ne \"": "نے \"",
    "Aik user": "ایک صارف",
    "clan join karne ki request bheji hai": "کلان جوائن کرنے کی درخواست بھیجی ہے",
    "clan join karne ki aapki request manzoor ho gayi.": "کلان جوائن کرنے کی آپ کی درخواست منظور ہو گئی۔",
    "clan join karne ki aapki request reject ho gayi.": "کلان جوائن کرنے کی آپ کی درخواست مسترد ہو گئی۔",
    "Notification read ho gayi": "اطلاع پڑھ لی گئی",
    "Report submit ho gayi. Hamari team review karegi.": "رپورٹ جمع ہو گئی۔ ہماری ٹیم جائزہ لے گی۔",
    "ne aapko rishta request bheji hai": "نے آپ کو رشتہ کی درخواست بھیجی ہے",
    "ne aapki rishta request qabool kar li hai": "نے آپ کی رشتہ کی درخواست قبول کر لی ہے",
    "ne aapki rishta request maazrat ke saath reject kar di hai": "نے آپ کی رشتہ کی درخواست معذرت کے ساتھ مسترد کر دی ہے",
    "badalne ki request ki hai. Verification code yeh hai:": "بدلنے کی درخواست کی ہے۔ تصدیقی کوڈ یہ ہے:",
    "Yeh code 10 minute mein expire ho jayega. Agar yeh request aapne nahi ki, to is email ko ignore kar dein.": "یہ کوڈ 10 منٹ میں ختم ہو جائے گا۔ اگر یہ درخواست آپ نے نہیں کی تو اس ای میل کو نظر انداز کر دیں۔",
    # not-found
    "Yeh page nahi mila": "یہ صفحہ نہیں ملا",
    "Jo page aap dhond rahe hain woh mojood nahi hai ya hata diya gaya hai.": "جو صفحہ آپ ڈھونڈ رہے ہیں وہ موجود نہیں ہے یا ہٹا دیا گیا ہے۔",
    # community join-request
    "Clan Join Karein": "کلان جوائن کریں",
    "Apna sub-clan chunein. Approval admin ya moderator karega.": "اپنا ذیلی کلان منتخب کریں۔ منظوری ایڈمن یا ماڈریٹر دے گا۔",
    "Naya Sub-Clan Naam": "نئے ذیلی کلان کا نام",
    # dashboard
    "Koi upcoming event nahi hai.": "کوئی آنے والا ایونٹ نہیں ہے۔",
    "Abhi koi activity nahi hai. Platform explore karein!": "ابھی کوئی سرگرمی نہیں ہے۔ پلیٹ فارم دریافت کریں!",
    # landing
    "Humse Rabta Karein": "ہم سے رابطہ کریں",
    "Koi sawal hai? Suggestion dena chahte hain? Hum sunn ne ke liye hamesha tayyar hain.": "کوئی سوال ہے؟ تجویز دینا چاہتے ہیں؟ ہم سننے کے لیے ہمیشہ تیار ہیں۔",
    "Abhi Shuru Karein": "ابھی شروع کریں",
    "12 powerful features jo aapke poore khandaan ko digital banati hain": "12 طاقتور فیچرز جو آپ کے پورے خاندان کو ڈیجیٹل بناتے ہیں",
    "Pakistan ka pehla complete digital family platform. Apne khandaan ko jodein, yaadein mehfooz karein, aur": "پاکستان کا پہلا مکمل ڈیجیٹل فیملی پلیٹ فارم۔ اپنے خاندان کو جوڑیں، یادیں محفوظ کریں، اور",
    "Apni family ko jodein, yaadein mehfooz karein, aur apni community ke saath barhein.": "اپنی فیملی کو جوڑیں، یادیں محفوظ کریں، اور اپنی کمیونٹی کے ساتھ بڑھیں۔",
    "Shuru Karna Kitna Aasan Hai?": "شروع کرنا کتنا آسان ہے؟",
    # rishta inbox
    "Request qabool ho gayi! 🎉": "درخواست قبول ہو گئی! 🎉",
    "Request reject kar di gayi": "درخواست مسترد کر دی گئی",
    "Aapne abhi tak koi rishta request nahi bheji": "آپ نے ابھی تک کوئی رشتہ کی درخواست نہیں بھیجی",
    # lib
    "Yeh file type allowed nahi hai": "یہ فائل کی قسم اجازت یافتہ نہیں ہے",
    "MB se zyada nahi ho sakti": "MB سے زیادہ نہیں ہو سکتی",
    "File size ": "فائل سائز ",
    "Family events banayein aur manage karein": "فیملی ایونٹس بنائیں اور ان کا انتظام کریں",
    "Jobs dhoondein ya post karein": "جابز تلاش کریں یا پوسٹ کریں",
    "Memories aur tasveerein mehfooz karein": "یادیں اور تصویریں محفوظ کریں",
    "Aapne password reset karne ki request ki hai. Neeche button par click karein:": "آپ نے پاس ورڈ ری سیٹ کرنے کی درخواست کی ہے۔ نیچے بٹن پر کلک کریں:",
    "Password Reset Karein": "پاس ورڈ ری سیٹ کریں",
    "Agar aapne yeh request nahi ki thi to is email ko ignore kar dein. Yeh link 1 ghante mein expire ho jayega.": "اگر آپ نے یہ درخواست نہیں کی تھی تو اس ای میل کو نظر انداز کر دیں۔ یہ لنک 1 گھنٹے میں ختم ہو جائے گا۔",
    "Kisi": "کسی",
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
