"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * KVKK (6698) notice shown under the login form.
 * NOTE: this is a template; the data controller's legal team must review it and fill in the official
 * contact address before production use.
 */
const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "1. Veri sorumlusu",
    body: [
      "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında kişisel verileriniz, veri sorumlusu sıfatıyla HedeflerBir programı tarafından aşağıda açıklanan çerçevede işlenmektedir.",
    ],
  },
  {
    title: "2. İşlenen kişisel veriler",
    body: [
      "Kimlik (ad, soyad), iletişim (e-posta), eğitim bilgileri (okuduğunuz bölüm, şehir, takım), profil fotoğrafı ve hakkınızda yazdıklarınız; canlı eğitim yoklamaları, ödev teslimleri, mentorluk seansları, rozetler ve platform içi mesajlar; güvenlik amacıyla giriş kayıtları.",
    ],
  },
  {
    title: "3. İşleme amaçları ve hukuki sebepler",
    body: [
      "Programın yürütülmesi, canlı eğitim ve mentorluk süreçlerinin planlanması, katılımın ve başarının takibi, rozet ve sertifika verilmesi, iletişimin sağlanması ve platform güvenliği. Verileriniz KVKK m.5/2 kapsamında sözleşmenin ifası, hukuki yükümlülük ve meşru menfaat sebeplerine; bunların dışında kalan işlemler için açık rızanıza dayanılarak işlenir.",
    ],
  },
  {
    title: "4. Aktarım",
    body: [
      "Verileriniz program yönetimi, eğitmenler ve mentorlarla görevleri gereği sınırlı olarak paylaşılır. Platform altyapısı (barındırma, veritabanı, e-posta) için hizmet aldığımız sağlayıcıların sunucuları yurt dışında bulunabilir; bu aktarım KVKK m.9 uyarınca açık rızanıza dayanır.",
    ],
  },
  {
    title: "5. Haklarınız",
    body: [
      "KVKK m.11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri öğrenme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Taleplerinizi platformdaki Destek Masası üzerinden iletebilirsiniz.",
    ],
  },
  {
    title: "Açık rıza",
    body: [
      "Giriş yaparak bu aydınlatma metnini okuduğunuzu; profil bilgilerinizin program katılımcıları, eğitmenler ve mentorlarla paylaşılmasına ve platform altyapısı için verilerinizin yurt dışındaki sunuculara aktarılmasına açık rıza verdiğinizi kabul edersiniz. Rızanızı dilediğiniz zaman Destek Masası üzerinden geri alabilirsiniz.",
    ],
  },
];

export function KvkkNotice() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      Giriş yaparak{" "}
      <Dialog>
        <DialogTrigger className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-brand-soft focus-visible:ring-2 focus-visible:ring-ring">
          KVKK Aydınlatma Metni ve Açık Rıza
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KVKK Aydınlatma Metni ve Açık Rıza</DialogTitle>
            <DialogDescription>Kişisel verilerinizin nasıl işlendiğine dair bilgilendirme</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[60dvh] flex-col gap-5 overflow-y-auto pr-1 text-sm leading-relaxed">
            {SECTIONS.map((section) => (
              <section key={section.title} className="flex flex-col gap-1.5">
                <h3 className="font-semibold">{section.title}</h3>
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>{" "}
      metnini okuduğunu ve kabul ettiğini onaylarsın.
    </p>
  );
}
