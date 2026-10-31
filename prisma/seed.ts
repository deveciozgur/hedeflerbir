import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const fromNow = (days: number, hour = 19) => {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
};

/**
 * Local development seed. Every account uses SEED_PASSWORD (see .env.example).
 *   admin@hedeflerbir.com       ADMIN
 *   egitmen@hedeflerbir.com     INSTRUCTOR
 *   mentor@hedeflerbir.com      MENTOR
 *   katilimci@hedeflerbir.com   STUDENT
 */
async function main() {
  if ((await prisma.user.count()) > 0) {
    console.info("Veritabanı boş değil, seed atlandı. Sıfırlamak için: npx prisma migrate reset");
    return;
  }

  const password = process.env.SEED_PASSWORD ?? "Hedefler123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const upsertUser = (email: string, data: { name: string; surname: string; role: Role }, profile: Record<string, unknown>) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, ...data, profile: { create: profile } },
    });

  const admin = await upsertUser(
    "admin@hedeflerbir.com",
    { name: "Selin", surname: "Aydın", role: Role.ADMIN },
    { title: "Program Yöneticisi" },
  );
  const instructor = await upsertUser(
    "egitmen@hedeflerbir.com",
    { name: "Mert", surname: "Kaya", role: Role.INSTRUCTOR },
    {
      title: "Kıdemli Oyun Geliştirici",
      expertiseArea: "Unity · C# · Oyun Mimarisi",
      bio: "10 yılı aşkın süredir mobil ve PC oyunları geliştiriyor.",
      socialLinks: { linkedin: "https://linkedin.com", github: "https://github.com" },
    },
  );
  const mentor = await upsertUser(
    "mentor@hedeflerbir.com",
    { name: "Elif", surname: "Demir", role: Role.MENTOR },
    {
      title: "Product Lead",
      expertiseArea: "Ürün Yönetimi · Kariyer Planlama",
      bio: "Ekiplerin doğru ürünü doğru zamanda çıkarmasına yardımcı oluyor.",
      meetingUrl: "https://meet.google.com/demo",
      socialLinks: { linkedin: "https://linkedin.com", website: "https://hedeflerbir.com" },
    },
  );
  const student = await upsertUser(
    "katilimci@hedeflerbir.com",
    { name: "Can", surname: "Yılmaz", role: Role.STUDENT },
    { goals: "İlk oyunumu Steam'de yayınlamak ve bir stüdyoda junior pozisyon bulmak." },
  );

  const course = await prisma.course.upsert({
    where: { slug: "oyun-gelistirmeye-giris" },
    update: {},
    create: {
      slug: "oyun-gelistirmeye-giris",
      title: "Oyun Geliştirmeye Giriş",
      description: "Unity ile sıfırdan oynanabilir bir prototipe uzanan 8 haftalık program.",
      instructorId: instructor.id,
      sessions: {
        create: [
          { order: 1, title: "Unity Arayüzü ve Proje Yapısı", scheduleDate: fromNow(-14), recordingUrl: "https://example.com/rec-1.mp4" },
          { order: 2, title: "C# Temelleri ve MonoBehaviour", scheduleDate: fromNow(-7), recordingUrl: "https://example.com/rec-2.mp4" },
          { order: 3, title: "Fizik, Çarpışmalar ve Input System", scheduleDate: fromNow(2) },
          { order: 4, title: "UI Toolkit ve Oyun Döngüsü", scheduleDate: fromNow(9) },
        ],
      },
      assignments: {
        create: [
          { title: "Mini Platformer Prototipi", description: "Zıplayan bir karakter ve 3 platform içeren sahne.", dueDate: fromNow(4, 23) },
          { title: "Oyun Tasarım Dokümanı", description: "1 sayfalık GDD hazırlayın.", dueDate: fromNow(11, 23) },
        ],
      },
    },
    include: { sessions: true },
  });

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: {},
    create: { studentId: student.id, courseId: course.id },
  });

  const watched = course.sessions.find((s) => s.order === 2);
  if (watched) {
    await prisma.lessonView.upsert({
      where: { userId_sessionId: { userId: student.id, sessionId: watched.id } },
      update: {},
      create: { userId: student.id, sessionId: watched.id, positionSeconds: 1260 },
    });
  }

  const project = await prisma.project.create({
    data: {
      title: "Dönem Projesi: Oynanabilir Demo",
      description: "Program sonunda yayınlanabilir bir demo oyun.",
      startDate: fromNow(-21),
      endDate: fromNow(45),
      progress: { create: { studentId: student.id, completionPercentage: 42, status: "IN_PROGRESS" } },
    },
  });

  const slots = await Promise.all(
    [1, 3, 5].map((d) =>
      prisma.mentorSlot.upsert({
        where: { mentorId_startTime: { mentorId: mentor.id, startTime: fromNow(d, 14) } },
        update: {},
        create: { mentorId: mentor.id, startTime: fromNow(d, 14), endTime: fromNow(d, 15) },
      }),
    ),
  );
  const booked = slots[0];
  if (booked && !booked.isBooked) {
    await prisma.$transaction([
      prisma.mentorSlot.update({ where: { id: booked.id }, data: { isBooked: true } }),
      prisma.appointment.create({
        data: { slotId: booked.id, studentId: student.id, mentorId: mentor.id, meetingLink: "https://meet.google.com/demo" },
      }),
    ]);
  }

  await prisma.announcement.create({
    data: {
      authorId: admin.id,
      title: "Demo Day tarihi açıklandı",
      content: "Dönem sonu proje sunumları 15 Aralık'ta yapılacak.",
      pinned: true,
    },
  });

  await prisma.message.create({
    data: {
      senderId: instructor.id,
      receiverId: student.id,
      subject: "Prototip hakkında",
      content: "Mini platformer ödevinde takıldığın bir yer olursa yazabilirsin.",
    },
  });

  console.info(`Seed tamamlandı · proje: ${project.title}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
