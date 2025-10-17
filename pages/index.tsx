import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileDown,
  Send,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  BookOpen,
  IdCard,
} from "lucide-react";

// للسكون TypeScript عند استخدام Web NFC
declare global {
  interface Window {
    NDEFReader?: any;
  }
}

type Student = { id: string; name: string; course: string };
type Resource = { name: string; href: string };

const ALLOWED_EXT = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "zip",
  "jpg",
  "jpeg",
  "png",
];

export default function Home() {
  // قراءة بارامترات الرابط
  const params = useMemo(
    () =>
      new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      ),
    []
  );

  const [student, setStudent] = useState<Student>({
    name: params.get("name") || "الطالب",
    id: params.get("id") || "",
    course: params.get("course") || "course",
  });

  const [ack, setAck] = useState(false);
  const [inquiry, setInquiry] = useState({ subject: "", message: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const resources: Resource[] = [
    { name: "دليل الطالب", href: "/files/student-guide.pdf" },
    { name: "الجدول الدراسي", href: "/files/schedule.pdf" },
    { name: "حقيبة الدورة", href: "/files/course-kit.zip" },
  ];

  // تحميل حالة الإقرار لكل طالب من التخزين المحلي
  useEffect(() => {
    if (!student.id) return;
    const v = localStorage.getItem(`ack_${student.id}`);
    setAck(v === "1");
  }, [student.id]);

  // تحديث الرابط عند تعديل الحقول (لطلبة الـURL params)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams();
    if (student.name) p.set("name", student.name);
    if (student.id) p.set("id", student.id);
    if (student.course) p.set("course", student.course);
    window.history.replaceState({}, "", `/?${p.toString()}`);
  }, [student]);

  // NFC (اختياري – يعمل غالباً على أندرويد كروم)
  const readingRef = useRef(false);
  const scanNFC = async () => {
    if (!window.NDEFReader) {
      alert("متصفحك لا يدعم Web NFC. استخدمي بارامترات الرابط بدلًا من ذلك.");
      return;
    }
    if (readingRef.current) return;
    readingRef.current = true;
    try {
      const reader = new window.NDEFReader();
      await reader.scan();
      reader.onreading = (ev: any) => {
        for (const record of ev.message.records) {
          if (record.recordType === "text") {
            const dec = new TextDecoder(record.encoding || "utf-8");
            const s = dec.decode(record.data);
            // صيغة متوقعة: id=20251234&name=أحمد محمد&course=cyber101
            const sp = new URLSearchParams(s);
            setStudent({
              id: sp.get("id") || "",
              name: sp.get("name") || "الطالب",
              course: sp.get("course") || "course",
            });
          }
        }
      };
    } catch {
      alert("تعذّر بدء قراءة NFC.");
    } finally {
      readingRef.current = false;
    }
  };

  const acknowledge = () => {
    if (!student.id) {
      alert("فضلاً أدخلي رقم الطالب أولاً.");
      return;
    }
    localStorage.setItem(`ack_${student.id}`, "1");
    setAck(true);
  };

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const arr = Array.from(list);
    const invalid = arr.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      return !ALLOWED_EXT.includes(ext);
    });
    if (invalid.length) {
      alert(
        "في ملفات غير مسموح بها. الصيغ المدعومة: PDF, DOCX, PPTX, XLSX, ZIP, JPG, PNG (وأيضًا DOC/PPT/XLS)."
      );
      return;
    }
    setFiles(arr);
  };

  // محاكاة رفع (بدون سيرفر حقيقي الآن)
  const uploadFiles = async () => {
    if (!files.length) {
      alert("اختاري ملفات أولاً.");
      return;
    }
    setUploading(true);
    setProgress(0);
    const totalSteps = 20;
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise((r) => setTimeout(r, 120));
      setProgress(Math.round((i / totalSteps) * 100));
    }
    setUploading(false);
    alert("تم رفع الملفات (محاكاة). لاحقًا نربطه بـ /api/upload.");
    setFiles([]);
  };

  const sendInquiry = async () => {
    if (!student.id || !inquiry.subject || !inquiry.message) {
      alert("أدخلي رقم الطالب وموضوع الرسالة ونصها.");
      return;
    }
    // محاكاة إرسال (لاحقًا API: /api/inquiry)
    console.log("Inquiry:", { studentId: student.id, ...inquiry });
    alert("تم إرسال الاستفسار (محاكاة).");
    setInquiry({ subject: "", message: "" });
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background:
          "linear-gradient(180deg, #f6f6f6 0%, #f1efea 40%, #efe7da 100%)",
      }}
    >
      {/* شريط علوي بسيط بروح الديوان */}
      <header className="w-full sticky top-0 z-30 backdrop-blur bg-white/60 border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7a1531]" />
            <div className="flex flex-col">
              <strong className="text-[#7a1531]">بوابة الطالب</strong>
              <span className="text-xs text-neutral-500">نظام أكاديمي</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={scanNFC}>
              <IdCard className="ms-1" size={16} />
              مسح بطاقة NFC
            </Button>
            <Badge className="bg-[#c9a15b] hover:bg-[#b58e4a] text-white">
              نسخة تجريبية
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 mt-6 space-y-6">
        {/* بيانات الطالب المختصرة */}
        <Card className="p-4 border-[#e5d2ad]">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-sm text-neutral-600 mb-1">اسم الطالب</label>
              <Input
                value={student.name}
                onChange={(e) =>
                  setStudent((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-neutral-600 mb-1">
                الرقم الجامعي
              </label>
              <Input
                value={student.id}
                onChange={(e) =>
                  setStudent((s) => ({ ...s, id: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-neutral-600 mb-1">
                الدورة/المقرر
              </label>
              <Input
                value={student.course}
                onChange={(e) =>
                  setStudent((s) => ({ ...s, course: e.target.value }))
                }
              />
            </div>
          </div>
        </Card>

        {/* الترحيب */}
        <Card className="p-6 border-[#e5d2ad]">
          <h1 className="text-2xl font-semibold text-[#7a1531] mb-2">
            أهلاً {student.name} ({student.id || "—"})
          </h1>
          <p className="text-neutral-700">
            مرحبًا بك في بوابة الطالب الخاصة بمقرر{" "}
            <strong>{student.course}</strong>.
          </p>
        </Card>

        {/* كلمة القائد */}
        <Card className="p-6 border-[#e5d2ad]">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-1">رسالة من القائد</h2>
              <p className="text-neutral-700 leading-8">
                يسرّنا استقبالكم في هذا البرنامج. نؤكد على الانضباط، والالتزام
                باللوائح، وروح الفريق. مع تمنياتنا لكم بالتوفيق والنجاح.
              </p>
              <p className="mt-2 font-medium text-[#7a1531]">
                القائد: اللواء (هيئة الركن) رمضان حمد النعيمي
              </p>
            </div>
          </div>
        </Card>

        {/* تبويبات */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 bg-[#f4efe6]">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="rules">اللوائح</TabsTrigger>
            <TabsTrigger value="resources">الملفات</TabsTrigger>
            <TabsTrigger value="inquiry">استفسار</TabsTrigger>
            <TabsTrigger value="submit">تسليم ملفات</TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview" className="mt-4">
            <Card className="p-6 border-[#e5d2ad]">
              <div className="flex items-start gap-3">
                <BookOpen />
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    مقرر {student.course}
                  </h3>
                  <ul className="list-disc pr-5 text-neutral-700 leading-8">
                    <li>الأهداف: اكتساب المهارات الأساسية للمقرر.</li>
                    <li>المحتوى: محاضرات، تمارين عملية، وتقييمات مرحلية.</li>
                    <li>التقييم: واجبات، اختبار منتصف، اختبار نهائي، وانضباط.</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* اللوائح */}
          <TabsContent value="rules" className="mt-4">
            <Card className="p-6 border-[#e5d2ad] space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle />
                <div>
                  <h3 className="text-lg font-semibold mb-2">لوائح الطالب</h3>
                  <ol className="list-decimal pr-5 text-neutral-700 leading-8">
                    <li>الالتزام بالزي والانضباط الزمني.</li>
                    <li>احترام الأنظمة والتعليمات داخل جميع المرافق.</li>
                    <li>عدم مشاركة الحسابات أو المواد دون إذن.</li>
                    <li>اتباع تعليمات السلامة داخل المختبرات.</li>
                  </ol>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  className="bg-[#7a1531] hover:bg-[#5d0f25]"
                  onClick={acknowledge}
                  disabled={ack}
                >
                  {ack ? "تم الإقرار" : "أقرّ بذلك"}
                </Button>
                {ack && (
                  <span className="text-green-700 flex items-center gap-2">
                    <CheckCircle size={18} /> تم تسجيل إقرارك محليًا لهذا الرقم.
                  </span>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* الملفات */}
          <TabsContent value="resources" className="mt-4">
            <Card className="p-6 border-[#e5d2ad]">
              <div className="grid sm:grid-cols-3 gap-3">
                {resources.map((r) => (
                  <a
                    key={r.name}
                    href={r.href}
                    download
                    className="flex items-center justify-between rounded-lg border border-[#e5d2ad] bg-white px-4 py-3 hover:bg-neutral-50"
                  >
                    <span>{r.name}</span>
                    <FileDown size={18} />
                  </a>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* الاستفسار */}
          <TabsContent value="inquiry" className="mt-4">
            <Card className="p-6 border-[#e5d2ad] space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <label className="text-sm text-neutral-600 mb-1">
                    موضوع الرسالة
                  </label>
                  <Input
                    value={inquiry.subject}
                    onChange={(e) =>
                      setInquiry((s) => ({ ...s, subject: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-sm text-neutral-600 mb-1">
                    نص الاستفسار
                  </label>
                  <Textarea
                    rows={5}
                    value={inquiry.message}
                    onChange={(e) =>
                      setInquiry((s) => ({ ...s, message: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button onClick={sendInquiry} className="w-fit">
                <Send size={16} className="ms-1" />
                إرسال للعميد
              </Button>
            </Card>
          </TabsContent>

          {/* التسليم */}
          <TabsContent value="submit" className="mt-4">
            <Card className="p-6 border-[#e5d2ad] space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm text-neutral-600">
                    الصيغ المسموحة: PDF, DOCX, PPTX, XLSX, ZIP, JPG, PNG
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
                    onChange={onSelectFiles}
                    className="max-w-sm"
                  />
                  <Button onClick={uploadFiles} disabled={uploading}>
                    <Upload size={16} className="ms-1" />
                    رفع الملفات
                  </Button>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <div className="text-sm text-neutral-600">{progress}%</div>
                </div>
              )}

              {files.length > 0 && (
                <div className="text-sm text-neutral-700">
                  ملفات مختارة: {files.map((f) => f.name).join("، ")}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
