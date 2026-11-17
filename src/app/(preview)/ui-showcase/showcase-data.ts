/**
 * Static mock data for the design showcase. Nothing here touches the database, so the page renders
 * the same for anyone and can be deleted without side effects once a concept is chosen.
 */

export interface ShowcasePerson {
  id: string;
  name: string;
  role: "Katılımcı" | "Mentor" | "Eğitmen";
  school: string;
  department: string;
  about: string;
}

export const student = {
  firstName: "Can",
  /** Attended live trainings over all programme trainings, from the admin's roll calls. */
  percent: 67,
  attended: 4,
  total: 6,
  rollCall: "4/5",
  next: {
    title: "Üretken Yapay Zeka",
    day: "Perşembe, 6 Kasım",
    time: "19:00 - 20:30",
    countdown: "2 gün 4 sa",
    instructor: "Ahmet Yılmaz",
    topics: ["Büyük dil modelleri", "İstem tasarımı", "Sorumlu kullanım"],
  },
  badges: [
    { name: "Dünyaya Karşı Sorumluluk", earned: true, tone: "brand" },
    { name: "Sosyal İnovasyon", earned: true, tone: "brand" },
    { name: "Sosyal Etki Ölçümü", earned: false, tone: "brand" },
    { name: "Üretken Yapay Zeka", earned: false, tone: "brand" },
    { name: "Girişimcilik", earned: false, tone: "brand" },
    { name: "Sunum Teknikleri", earned: false, tone: "brand" },
    { name: "1. Mentorluk Seansı", earned: true, tone: "amber" },
    { name: "2. Mentorluk Seansı", earned: true, tone: "amber" },
    { name: "3. Mentorluk Seansı", earned: false, tone: "amber" },
  ] as Array<{ name: string; earned: boolean; tone: "brand" | "amber" }>,
  team: {
    name: "Takım Atlas",
    representative: "Can Öztürk",
    members: ["Ayşe Yıldız", "Can Öztürk", "Emre Kaya"],
    problem: "Kırsaldaki ortaokul öğrencilerinin kodlama eğitimine erişimi sınırlı; internet zayıf sınıflarda da çalışan, çevrimdışı bir eğitim aracı geliştiriyoruz.",
    session: { mentor: "Burak Demir", day: "Salı, 11 Kasım", time: "11:00 - 11:45", countdown: "8 gün" },
  },
};

export const people: ShowcasePerson[] = [
  { id: "ay", name: "Ayşe Yıldız", role: "Katılımcı", school: "Ege Üniversitesi", department: "Endüstri Mühendisliği", about: "Sürdürülebilir tedarik zincirleri ve veri görselleştirme ile ilgileniyorum." },
  { id: "ek", name: "Emre Kaya", role: "Katılımcı", school: "Ankara Üniversitesi", department: "İşletme", about: "Sosyal girişimlerin finansmanı üzerine çalışıyorum; pitch provalarına her zaman varım." },
  { id: "da", name: "Deniz Arslan", role: "Katılımcı", school: "ODTÜ", department: "Bilgisayar Mühendisliği", about: "Erişilebilir arayüzler ve çevrimdışı web uygulamaları geliştiriyorum." },
  { id: "ma", name: "Mert Aydın", role: "Katılımcı", school: "İTÜ", department: "Elektronik Mühendisliği", about: "Düşük maliyetli sensörlerle tarım verisi topluyorum." },
  { id: "bd", name: "Burak Demir", role: "Mentor", school: "Boğaziçi Üniversitesi", department: "Endüstri Mühendisliği", about: "Ürün yönetimi ve müşteri keşfi üzerine mentorluk yapıyorum." },
  { id: "zk", name: "Zehra Koç", role: "Katılımcı", school: "Hacettepe Üniversitesi", department: "Sosyoloji", about: "Etki ölçümü ve saha araştırması tasarımında deneyimliyim." },
];

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
