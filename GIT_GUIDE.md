# วิธีทำงานร่วมกันด้วย Git

คู่มือสำหรับทีม: ดึงงานล่าสุด → แก้งานใน branch ของตัวเอง → ส่ง Pull Request → ตรวจ preview → รวมเข้า `main`

---

## สารบัญ

1. [คำศัพท์ที่ต้องรู้](#1-คำศัพท์ที่ต้องรู้)
2. [ครั้งแรก: ดึง repo มาไว้ในเครื่อง](#2-ครั้งแรก-ดึง-repo-มาไว้ในเครื่อง)
3. [ขั้นตอนทุกครั้งที่จะแก้งาน](#3-ขั้นตอนทุกครั้งที่จะแก้งาน)
4. [ส่ง Pull Request](#4-ส่ง-pull-request)
5. [ตรวจ preview แล้วรวมเข้า main](#5-ตรวจ-preview-แล้วรวมเข้า-main)
6. [เมื่อ main มีงานใหม่ระหว่างที่เรายังแก้อยู่](#6-เมื่อ-main-มีงานใหม่ระหว่างที่เรายังแก้อยู่)
7. [แก้ conflict (งานชนกัน)](#7-แก้-conflict-งานชนกัน)
8. [กติกาของทีม](#8-กติกาของทีม)
9. [แก้ปัญหาที่เจอบ่อย](#9-แก้ปัญหาที่เจอบ่อย)
10. [สรุปคำสั่ง](#10-สรุปคำสั่ง)

---

## 1. คำศัพท์ที่ต้องรู้

| คำ | ความหมายแบบง่าย |
|---|---|
| **Repository (repo)** | โฟลเดอร์โปรเจกต์ที่เก็บไว้บน GitHub พร้อมประวัติการแก้ทั้งหมด |
| **`main`** | branch หลัก = ตัวที่ขึ้นเว็บจริง |
| **Branch** | สำเนาแยกสำหรับแก้งาน ไม่กระทบ `main` จนกว่าจะรวม |
| **Commit** | การ "บันทึก" สิ่งที่แก้ พร้อมข้อความอธิบาย |
| **Push** | ส่ง commit จากเครื่องเราขึ้น GitHub |
| **Pull** | ดึงงานล่าสุดจาก GitHub ลงเครื่องเรา |
| **Fetch** | เช็กว่าบน GitHub มีอะไรใหม่ (ยังไม่รวมเข้าไฟล์เรา) |
| **Merge** | รวมงานจาก branch หนึ่งเข้าอีก branch |
| **Pull Request** | คำขอรวมงาน: "แก้เสร็จแล้ว ช่วยตรวจแล้วรวมเข้า `main` ให้หน่อย" |
| **Preview** | หน้าเว็บตัวอย่างที่ Vercel สร้างให้ทุก Pull Request (เปิดตรวจได้ก่อนรวม) |
| **Conflict** | Git รวมเองไม่ได้ เพราะสองคนแก้บรรทัดเดียวกัน → ต้องให้คนเลือก |

---

## 2. ครั้งแรก: ดึง repo มาไว้ในเครื่อง

ทำครั้งเดียวต่อเครื่อง

1. เปิดหน้า repo บน GitHub → กดปุ่มสีเขียว **Code** → คัดลอกลิงก์ (HTTPS)
2. เปิด VS Code → กด **Ctrl + Shift + P** → พิมพ์ `Git: Clone` → วางลิงก์ → เลือกโฟลเดอร์ที่จะเก็บ
3. กด **Open** เมื่อ VS Code ถาม

หรือใช้ Terminal:

```bash
git clone https://github.com/M0neybag/People-s-Party_Thai-Election-2026.git
```

---

## 3. ขั้นตอนทุกครั้งที่จะแก้งาน

> เปิด Terminal ใน VS Code: กด **Ctrl + `** (ปุ่มตัวหนอนใต้ Esc)
> ดูว่าอยู่ branch ไหน: มุมซ้ายล่างของ VS Code

### ขั้นที่ 1 — กลับไปที่ `main` แล้วดึงงานล่าสุด

```bash
git checkout main
git pull
```

ใน VS Code: กดชื่อ branch มุมซ้ายล่าง → เลือก `main` → แล้วกด Source Control (Ctrl + Shift + G) → ปุ่ม **⋯** → **Pull**

### ขั้นที่ 2 — สร้าง branch ใหม่สำหรับงานนี้

ตั้งชื่อให้บอกว่าแก้อะไร เช่น `fix-tier-table`, `color-house`, `readme-update`

```bash
git checkout -b ชื่อ-branch
```

ใน VS Code: กดชื่อ branch มุมซ้ายล่าง → **Create new branch...** → พิมพ์ชื่อ

### ขั้นที่ 3 — แก้ไฟล์ แล้วเปิดดูด้วย Live Server

ตรวจว่าหน้าเว็บถูกต้องก่อน commit

### ขั้นที่ 4 — Commit

ใน VS Code: Source Control → พิมพ์ข้อความอธิบายในช่อง Message → กด **Commit**
(ถ้าถามว่า "stage all changes?" กด **Yes**)

```bash
git add .
git commit -m "แก้คอลัมน์ตารางวางแผนพรรคบนมือถือ"
```

เขียนข้อความให้คนอื่นอ่านแล้วรู้ว่าแก้อะไร — อย่าใช้ "fix" หรือ "update" เฉยๆ

### ขั้นที่ 5 — Push ขึ้น GitHub

ใน VS Code: กด **Publish Branch** (ครั้งแรกของ branch) หรือ **Sync Changes**

```bash
git push -u origin ชื่อ-branch
```

---

## 4. ส่ง Pull Request

1. เปิดหน้า repo บน GitHub — จะมีแถบสีเหลือง *"ชื่อ-branch had recent pushes"* → กด **Compare & pull request**
   (ถ้าไม่มีแถบ: แท็บ **Pull requests** → **New pull request**)
2. ตรวจด้านบนว่า **base: `main`** ← **compare: `ชื่อ-branch`**
3. ตั้งชื่อ Pull Request ให้ชัด และเขียนรายละเอียด เช่น
   - แก้อะไร / เพราะอะไร
   - ทดสอบที่ขนาดจอไหนบ้าง
   - (ถ้ามี) ภาพหน้าจอก่อน-หลัง
4. ถ้าต้องการให้เพื่อนตรวจ เลือกชื่อใน **Reviewers** ด้านขวา
5. กด **Create pull request**

---

## 5. ตรวจ preview แล้วรวมเข้า main

1. ในหน้า Pull Request รอ Vercel ขึ้นข้อความพร้อมลิงก์ **Preview** (ประมาณ 1–2 นาที)
2. เปิด preview แล้วตรวจ:
   - งานที่เราแก้ทำงานถูกต้อง
   - **งานของคนอื่นที่อยู่ใน `main` ยังอยู่ครบ** (สำคัญมาก)
   - ลองจอเล็กด้วย (F12 → ไอคอนมือถือ)
3. ถ้าด้านล่างขึ้น ✅ *This branch has no conflicts with the base branch* → กด **Merge pull request** → **Confirm merge**
4. กด **Delete branch** (branch ที่รวมแล้วลบได้ ประวัติยังอยู่)
5. รอ 1–2 นาที เว็บจริงจะอัปเดต

ถ้าขึ้น ⚠️ *This branch has conflicts* → ไปข้อ 7

---

## 6. เมื่อ main มีงานใหม่ระหว่างที่เรายังแก้อยู่

เช่น เพื่อน merge งานเข้า `main` ไปแล้ว แต่ branch ของเรายังเป็นของเก่า → **preview ของเราจะไม่มีงานเพื่อน** (ไม่ได้แปลว่างานหาย)

ให้ดึง `main` ล่าสุดมารวมใน branch ของเรา (อยู่ที่ branch ของเรา):

```bash
git fetch origin
git merge origin/main
```

ใน VS Code: Source Control → **⋯** → **Pull, Push** → **Pull from...** → เลือก **origin/main**

> ⚠️ ปุ่ม **Pull** ธรรมดาจะดึงแค่ branch ของเราเอง ไม่ได้ดึงงานจาก `main`

หรือบนเว็บ: ในหน้า Pull Request กด **Update branch** (ถ้ามีปุ่มนี้)

จากนั้น push อีกครั้ง → Pull Request และ preview จะอัปเดตเอง

---

## 7. แก้ conflict (งานชนกัน)

เกิดเมื่อสองคนแก้บรรทัดเดียวกัน หรือต่างคนต่างเพิ่มโค้ดท้ายไฟล์เดียวกัน (เจอบ่อยที่ `style.css`)

ไฟล์จะมีเครื่องหมายแบบนี้:

```
<<<<<<< ฝั่งหนึ่ง
(โค้ดของฝั่งหนึ่ง)
=======
(โค้ดของอีกฝั่ง)
>>>>>>> อีกฝั่ง
```

### วิธี ก — บนเว็บ GitHub

1. ในหน้า Pull Request กด **Resolve conflicts**
2. ตรงจุดที่ชน กด **Accept both changes** (ถ้าต้องการเก็บทั้งสองฝั่ง — ส่วนใหญ่เป็นแบบนี้)
   หรือลบบรรทัด `<<<<<<<` `=======` `>>>>>>>` ออกเอง แล้วเก็บโค้ดที่ต้องการ
3. กด **Mark as resolved** → **Commit merge**

### วิธี ข — ใน VS Code

1. ทำตามข้อ 6 (`git merge origin/main`) → ไฟล์ที่ชนจะขึ้นตัว **C**
2. เปิดไฟล์ → เหนือจุดที่ชนจะมีปุ่ม **Accept Current Change | Accept Incoming Change | Accept Both Changes** → เลือก **Accept Both Changes**
3. Save → แล้ว:

```bash
git add .
git commit -m "merge main"
git push
```

### ⚠️ จุดที่ต้องระวัง

| ปุ่ม | ผล |
|---|---|
| **Accept Both Changes** | เก็บทั้งสองฝั่ง ✅ (ใช้บ่อยที่สุด) |
| Accept Current Change | เก็บแค่ฝั่ง branch ที่กำลังแก้ → **อีกฝั่งหาย** |
| Accept Incoming Change | เก็บแค่ฝั่งที่ดึงเข้ามา → **อีกฝั่งหาย** |

- หลังแก้ ตรวจว่า **ไม่มี** `<<<<<<<` `=======` `>>>>>>>` หลงเหลือ (ถ้ามี CSS จะพังทั้งไฟล์)
- ตรวจว่าไม่มีโค้ดก้อนเดียวกันซ้ำ 2 ครั้ง
- เปิด preview ตรวจก่อนกด Merge ทุกครั้ง

---

## 8. กติกาของทีม

1. **Pull ก่อนเริ่มแก้ทุกครั้ง** (ข้อ 3 ขั้นที่ 1)
2. **ไม่แก้บน `main` โดยตรง** — ใช้ branch + Pull Request เสมอ
3. **1 branch = 1 เรื่อง** และส่ง Pull Request เร็ว อย่าเก็บไว้หลายวัน (ยิ่งนาน ยิ่งชนง่าย)
4. **บอกในกลุ่มก่อนแก้ไฟล์เดียวกัน** โดยเฉพาะ `css/style.css` และ `js/app.js`
5. **เพิ่มโค้ด CSS ใหม่ให้มีหัวข้อกำกับ** เช่น `/* ===== แก้ตาราง (ชื่อ, วันที่) ===== */` จะได้รู้ว่าก้อนไหนของใครตอนแก้ conflict
6. **ตรวจ preview ก่อน Merge** ว่างานของคนอื่นยังอยู่ครบ
7. ถ้าไม่แน่ใจตอนแก้ conflict → **หยุดแล้วถามในกลุ่ม** อย่ากด Accept ฝั่งเดียว

---

## 9. แก้ปัญหาที่เจอบ่อย

| ข้อความ / อาการ | ความหมาย | วิธีแก้ |
|---|---|---|
| *Your local changes would be overwritten* | มีไฟล์ที่แก้แต่ยังไม่ commit | commit ก่อน แล้วค่อย pull |
| *CONFLICT (content): Merge conflict in …* | งานชนกัน | ข้อ 7 |
| *Already up to date* แต่หน้าเว็บยังเก่า | ไฟล์ล่าสุดแล้ว แต่เบราว์เซอร์จำของเก่า | **Ctrl + Shift + R** หรือปิดแล้วกด Go Live ใหม่ |
| Pull แล้วงานเพื่อนไม่มา | อยู่ branch ของตัวเอง ปุ่ม Pull ดึงแค่ branch นี้ | ข้อ 6 (Pull from… → origin/main) |
| *rejected … (fetch first)* ตอน push | บน GitHub มีงานใหม่ใน branch นี้ | `git pull` แล้วค่อย `git push` |
| *not a git repository* | เปิดโฟลเดอร์ผิด | File → Open Folder → เลือกโฟลเดอร์ repo |
| เปิด VS Code แล้วหน้าต่างให้พิมพ์ข้อความ merge | Git ขอข้อความ merge | ไม่ต้องพิมพ์อะไร กด Save แล้วปิดแท็บ |
| preview ไม่มีงานของเรา/ของเพื่อน | branch ยังไม่มีงานจาก `main` ล่าสุด | ข้อ 6 |

---

## 10. สรุปคำสั่ง

```bash
# เริ่มงานใหม่
git checkout main
git pull
git checkout -b ชื่อ-branch

# บันทึกและส่งขึ้น GitHub
git add .
git commit -m "อธิบายสิ่งที่แก้"
git push -u origin ชื่อ-branch
# → ไปเปิด Pull Request บน GitHub

# main มีงานใหม่ ต้องดึงมารวม (อยู่ที่ branch ของเรา)
git fetch origin
git merge origin/main
git push

# ดูสถานะ
git status              # อยู่ branch ไหน มีไฟล์ค้างไหม
git log --oneline -5    # 5 commit ล่าสุด
```
