"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Block = { kind: "p"; text: string } | { kind: "ul" | "ol"; items: string[] };

/**
 * HedeflerBir's KVKK (6698) general information notice, from the organisation's KVKK.docx.
 * NOTE: the data controller is shown as "HedeflerBir" until the full legal name is provided.
 */
const SECTIONS: Array<{ title: string; blocks: Block[] }> = [
  {
    title: "1. Veri sorumlusunun kimliği",
    blocks: [
      {
        kind: "p",
        text: "6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK” veya “Kanun”) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla HedeflerBir (“HedeflerBir” veya “Kurum”) tarafından işlenebilecektir.",
      },
    ],
  },
  {
    title: "2. İşlenebilecek kişisel veriler",
    blocks: [
      {
        kind: "ul",
        items: [
          "Kimlik bilgileri: ad, soyad ve benzeri bilgiler.",
          "İletişim bilgileri: telefon numarası, e-posta adresi ve benzeri iletişim bilgileri.",
          "Eğitim bilgileri: okul, bölüm, sınıf, mezuniyet ve eğitim durumuna ilişkin bilgiler.",
          "Mesleki bilgiler: meslek, çalışma durumu, kariyer bilgileri ve özgeçmiş bilgileri.",
          "Başvuru bilgileri: program başvurularında tarafınızca sunulan bilgi ve açıklamalar.",
          "Program bilgileri: katılım, devam, geri bildirim ve program süreçlerine ilişkin bilgiler.",
          "Görsel ve işitsel kayıtlar: etkinlik veya programlar sırasında alınan fotoğraf ve video kayıtları.",
          "İletişim kayıtları: HedeflerBir ile gerçekleştirdiğiniz yazışma ve iletişimlere ilişkin bilgiler.",
          "Teknik bilgiler: internet sitesinin kullanımı sırasında, kullanılan çerezlerin niteliğine göre oluşabilecek IP adresi, tarayıcı, cihaz ve ziyaret bilgileri.",
        ],
      },
      { kind: "p", text: "İlgili program veya faaliyetin niteliğine göre yukarıdaki veri kategorilerinin tamamı işlenmeyebilir." },
    ],
  },
  {
    title: "3. Kişisel verilerinizin işlenme amaçları",
    blocks: [
      {
        kind: "ul",
        items: [
          "HedeflerBir tarafından düzenlenen eğitim, bootcamp, atölye, mentorluk ve benzeri programların planlanması ve yürütülmesi.",
          "Programlara ilişkin başvuru, değerlendirme, seçim, kayıt ve katılım süreçlerinin gerçekleştirilmesi.",
          "Katılımcıların program ve hizmetlerden yararlandırılması.",
          "Eğitim, etkinlik, toplantı, seminer ve diğer organizasyonların planlanması ve yürütülmesi.",
          "Katılımcılar, mentorlar, eğitmenler, konuşmacılar ve proje paydaşları arasındaki iletişim ve koordinasyonun sağlanması.",
          "Katılımcılardan geri bildirim alınması ve programların geliştirilmesi.",
          "Programların etki ve çıktı ölçümlerinin gerçekleştirilmesi.",
          "HedeflerBir'in sosyal etki ve gençlik çalışmalarının planlanması ve yürütülmesi.",
          "Program ve projelere ilişkin istatistiksel çalışma ve raporlamaların yapılması.",
          "HedeflerBir'in faaliyetleri hakkında bilgilendirme ve duyuruların gerçekleştirilmesi.",
          "HedeflerBir'in internet sitesi ve sosyal medya hesaplarında faaliyetlerinin tanıtılması.",
          "HedeflerBir'in iş süreçlerinin yürütülmesi.",
          "Bilgi güvenliği ve kurum güvenliğinin sağlanması.",
          "Hukuki süreçlerin yürütülmesi.",
          "Mevzuattan kaynaklanan yükümlülüklerin yerine getirilmesi.",
          "Yetkili kamu kurum ve kuruluşlarından gelen taleplerin karşılanması.",
        ],
      },
    ],
  },
  {
    title: "4. Kişisel verilerinizin işlenmesinin hukuki sebepleri",
    blocks: [
      {
        kind: "p",
        text: "Kişisel verileriniz, somut veri işleme faaliyetinin niteliğine göre Kanun'un 5. ve 6. maddelerinde düzenlenen hukuki sebeplerden bir veya birkaçına dayanılarak işlenmektedir.",
      },
      {
        kind: "p",
        text: "Kanunlarda açıkça öngörülmesi; bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması; HedeflerBir'in hukuki yükümlülüğünü yerine getirebilmesi; bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması; HedeflerBir'in meşru menfaatleri için veri işlenmesinin zorunlu olması; Kanun'da öngörülen diğer kişisel veri işleme şartlarının bulunması veya işleme faaliyetinin açık rıza gerektirmesi hâlinde açık rızanızın bulunması hukuki sebep olarak uygulanabilecektir.",
      },
    ],
  },
  {
    title: "5. Kişisel verilerinizin toplanma yöntemi",
    blocks: [
      {
        kind: "p",
        text: "HedeflerBir internet sitesi; online veya fiziki başvuru formları; program ve etkinlik kayıt formları; e-posta ve diğer iletişim kanalları; sosyal medya ve dijital iletişim kanalları; etkinlik ve programlar sırasında gerçekleştirilen kayıt işlemleri; HedeflerBir ile doğrudan gerçekleştirilen iletişimler ve internet sitesinde kullanılan çerezler aracılığıyla otomatik veya otomatik olmayan yöntemlerle toplanabilecektir.",
      },
    ],
  },
  {
    title: "6. Kişisel verilerinizin aktarılması",
    blocks: [
      {
        kind: "p",
        text: "Kişisel verileriniz, Kanun'un 8. ve 9. maddelerinde öngörülen şartlara uygun olarak ve işlenme amaçlarıyla sınırlı olmak üzere; program ve projelerin gerçekleştirilmesi kapsamında iş birliği yapılan kurum ve kuruluşlara; eğitim, organizasyon, iletişim ve teknoloji alanlarında hizmet alınan tedarikçilere; programların yürütülmesine katkı sağlayan eğitmen, mentor, konuşmacı ve proje paydaşlarına; teknik altyapı ve dijital hizmet sağlayıcılarına; hukuken yetkili kamu kurum ve kuruluşlarına ve kanunen yetkili özel hukuk tüzel kişilerine aktarılabilecektir.",
      },
    ],
  },
  {
    title: "7. Kişisel verilerin yurt dışına aktarılması",
    blocks: [
      {
        kind: "p",
        text: "HedeflerBir'in kullandığı bazı dijital hizmetlerin veya teknik altyapıların yurt dışında bulunan hizmet sağlayıcılar tarafından sunulması hâlinde kişisel verilerinizin yurt dışına aktarılması söz konusu olabilir.",
      },
      { kind: "p", text: "Bu durumda aktarım, Kanun'un 9. maddesinde ve ilgili mevzuatta öngörülen şartlara uygun olarak gerçekleştirilecektir." },
      {
        kind: "p",
        text: "Yurt dışına veri aktarımında; yeterlilik kararı, uygun güvenceler veya Kanun'da düzenlenen istisnai aktarım şartlarından somut olaya uygulanabilir olanı esas alınacaktır.",
      },
    ],
  },
  {
    title: "8. Kişisel verilerin saklanma süresi",
    blocks: [
      {
        kind: "p",
        text: "Kişisel verileriniz, işlenme amaçlarının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen saklama süreleri dikkate alınarak muhafaza edilecektir.",
      },
      {
        kind: "p",
        text: "İşleme amacının ortadan kalkması ve verilerin saklanmasını gerektiren başka bir hukuki sebebin bulunmaması hâlinde kişisel verileriniz Kanun ve ilgili mevzuata uygun şekilde silinecek, yok edilecek veya anonim hâle getirilecektir.",
      },
    ],
  },
  {
    title: "9. Kişisel verilerin güvenliği",
    blocks: [
      {
        kind: "p",
        text: "HedeflerBir, kişisel verilerin hukuka aykırı olarak işlenmesini ve kişisel verilere hukuka aykırı olarak erişilmesini önlemek ve kişisel verilerin güvenli şekilde muhafazasını sağlamak amacıyla gerekli teknik ve idari tedbirleri almaktadır.",
      },
    ],
  },
  {
    title: "10. Kişisel veri sahibi olarak haklarınız",
    blocks: [
      {
        kind: "ol",
        items: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme.",
          "Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme.",
          "Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme.",
          "Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme.",
          "Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme.",
          "Kanun'da öngörülen şartların oluşması hâlinde kişisel verilerinizin silinmesini veya yok edilmesini isteme.",
          "Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme.",
          "Münhasıran otomatik sistemler vasıtasıyla analiz sonucu aleyhe bir sonuç ortaya çıkmasına itiraz etme.",
          "Kanuna aykırı işleme nedeniyle zarara uğranması hâlinde zararın giderilmesini talep etme.",
        ],
      },
    ],
  },
  {
    title: "11. Başvuru yöntemi",
    blocks: [{ kind: "p", text: "Yukarıda belirtilen haklarınıza ilişkin taleplerinizi HedeflerBir web sitesi kanalları üzerinden iletebilirsiniz." }],
  },
];

function BlockView({ block }: { block: Block }) {
  if (block.kind === "p") return <p className="text-muted-foreground">{block.text}</p>;
  const List = block.kind === "ol" ? "ol" : "ul";
  return (
    <List className={block.kind === "ol" ? "flex list-decimal flex-col gap-1 pl-5 text-muted-foreground" : "flex list-disc flex-col gap-1 pl-5 text-muted-foreground"}>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </List>
  );
}

/** Link-styled trigger that opens the full notice; used inside the login form's consent checkbox label. */
export function KvkkDialogLink() {
  return (
    <Dialog>
      <DialogTrigger className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-brand-soft focus-visible:ring-2 focus-visible:ring-ring">
        KVKK Aydınlatma Metni ve Açık Rıza
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kişisel Verilerin Korunması ve İşlenmesi Genel Aydınlatma Metni</DialogTitle>
          <DialogDescription>HedeflerBir, 6698 sayılı KVKK kapsamında</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[60dvh] flex-col gap-5 overflow-y-auto pr-1 text-sm leading-relaxed">
          {SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-1.5">
              <h3 className="font-semibold">{section.title}</h3>
              {section.blocks.map((block, index) => (
                <BlockView key={index} block={block} />
              ))}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
