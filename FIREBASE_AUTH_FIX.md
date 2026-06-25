# 🔐 Firebase Auth Fix — ปลดล็อกปุ่ม Sign In บน team-dashboard

> **อาการ:** เปิด https://championest.github.io/team-championest/ แล้วกดปุ่ม **Sign In** → ไม่มีอะไรเกิดขึ้น (popup เด้งแล้วปิดทันที หรือขึ้น error `auth/unauthorized-domain`)
>
> **สาเหตุที่ยืนยันแล้ว:** โดเมน `championest.github.io` **ยังไม่ได้อยู่ใน Firebase Authorized Domains** ของโปรเจค `up-level-guild`
>
> ตรวจสอบเมื่อ: 2026-06-25 — ดึง config จาก Firebase API โดยตรง รายชื่อ authorized domains ปัจจุบัน **ไม่มี** `championest.github.io`

---

## ✅ สิ่งที่ Champ ต้องทำเอง (2 นาที — ต้อง login Firebase Console)

ทำไมต้องทำเอง: เครื่องนี้ไม่มี Firebase CLI / gcloud และ Chrome profile ของ agent-browser ยังไม่ได้ login Google account → ระบบอัตโนมัติเข้า Console ไม่ได้ ต้องให้ Champ คลิกเอง

### ขั้นตอน (คลิกตามทีละข้อ)

1. เปิดลิงก์นี้ (login ด้วย **champ.championest@gmail.com**):
   👉 **https://console.firebase.google.com/project/up-level-guild/authentication/settings**

2. เลื่อนลงไปหาหัวข้อ **"Authorized domains"**

3. กดปุ่ม **"Add domain"**

4. พิมพ์ → `championest.github.io`  *(ใส่แค่นี้ ไม่ต้องมี https:// ไม่ต้องมี /team-championest)*

5. กด **Add** / **Done**

6. รอ ~1 นาที แล้วกลับไปที่ https://championest.github.io/team-championest/ → กด **Sign In** อีกครั้ง → ต้องเด้ง popup เลือกบัญชี Google ได้แล้ว ✅

---

## ℹ️ เรื่อง Google Cloud OAuth redirect URI — **ไม่ต้องแก้อะไร**

แอปนี้ตั้งค่า `authDomain: "up-level-guild.firebaseapp.com"` ดังนั้นตอน login Google จะ redirect ผ่าน handler ของ Firebase เอง คือ:

```
https://up-level-guild.firebaseapp.com/__/auth/handler
```

**ไม่ใช่** redirect ไปที่ `championest.github.io` โดยตรง → ดังนั้น OAuth Client ใน Google Cloud Console **ครอบคลุมอยู่แล้ว ไม่ต้องเพิ่ม `championest.github.io` ในส่วนนั้น** การเพิ่มใน Firebase Authorized Domains (ขั้นตอนข้างบน) คือสิ่งเดียวที่ต้องทำ

---

## รายชื่อ Authorized Domains ปัจจุบัน (ยืนยัน 2026-06-25)

มีครบทุก vercel/netlify/custom domain ของ Up Level — **ยกเว้น** `championest.github.io`:

```
localhost
up-level-guild.firebaseapp.com
up-level-guild.web.app
uplevelguild.netlify.app
up-level-guild-web.vercel.app
champ-hq.vercel.app
... (และ pkm-deck / pkm-court / marketplace / *.uplevelguild.com อีกหลายตัว)
❌ championest.github.io  ← ตัวที่ขาด ต้องเพิ่ม
```

---

## 🛡️ กันลืม: หน้าเว็บจะบอกเองถ้ายังไม่ได้แก้

โค้ดในหน้า (index.html) มี preflight check อยู่แล้ว — ถ้า `championest.github.io` ยังไม่อยู่ใน authorized domains มันจะ:
- ขึ้น warning banner บนหน้า dispatch
- กด Sign In แล้วขึ้น toast ภาษาไทยบอกชัด ๆ ว่าต้องเพิ่ม domain

พอ Champ เพิ่ม domain เสร็จ → warning หายเอง ไม่ต้องแก้โค้ด

---

*สร้างโดย Cody · 2026-06-25 · งานสั่งจาก Telegram remote executor*
