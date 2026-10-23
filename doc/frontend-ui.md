# Frontend UI ve pratik tasarım standartları

## Ortak tasarım kaynağı

- Renk, radius ve yazı tipi tokenları: `frontend/src/assets/main.css`.
- `primary`: ana aksiyon ve seçili kontrol. `success`: doğru cevap veya olumlu
  öz değerlendirme. `destructive`: yanlış cevap, hata ve silme işlemi.
- Sayfa yerleşimi: `page-shell`; pratik ekranında `data-width="practice"` ile
  daha dar okuma alanı. Koleksiyon listelerinde `collection-grid` kullanılır.
- Mod seçimi: shadcn `Label` ve `RadioGroupItem` üzerine `selection-card` uygulanır.
  Görünüm `data-selected` ve `data-disabled` durumlarından türetilir.
- Kontroller `frontend/src/components/ui` içindeki resmi shadcn kaynaklarından
  gelir. Yeni bir kontrol gerektiğinde mevcut `components.json` ile resmi CLI
  üzerinden eklenir. Uygulamaya özgü ortak akışlar, bu kontrolleri birleştirir.

## Koleksiyon kartları

Kartlarda sırasıyla koleksiyon türü/seviyesi, başlık, açıklama, cümle sayısı ve
aksiyonlar gösterilir. Başlık ve ok butonu cümle listesine gider; metinli
`Practice` butonu pratik ayarlarını açar. Sabitleme ayrı, erişilebilir adı olan
bir aksiyondur. Boş koleksiyonlarda pratik kapalı, cümle listesi erişilebilir kalır.

Henüz backend'de tutulmayan öğrenme yüzdeleri, mastery veya geçmiş istatistikleri
kartlarda gösterilmez. Arama alanı görünür kalır; sıralama ad veya cümle sayısına
uygulanır. Mobilde kartlar ve cevap alanları tek sütuna geçer.

## Pratik mimarisi

- `src/lib/practice-session.js`: framework bağımsız cevap kontrolü, karıştırma,
  mod doğrulama ve oturum uzunluğu seçenekleri.
- `src/lib/practice-options.js`: mod ve pratik türlerinin ortak adları,
  açıklamaları, ikonları, yönergeleri ve kullanılabilirlik durumu.
- `src/hooks/use-practice-session.js`: cümleleri yükleme, soru ilerletme, cevap
  açma, değerlendirme ve yeniden başlatma davranışı.
- `PracticeDialog`: seçenekleri shadcn radio/select kontrolleriyle sunar.
- `PracticeSessionView`: aynı oturum davranışını seçilen cevap moduna göre sunar.

Desteklenen modlar:

| URL `mode` değeri | Kullanıcı davranışı | Oturum sonucu |
| --- | --- | --- |
| `choice` | Mevcut seçeneklerden cevabı seçer. | Doğru / yanlış |
| `typed` | Cevabı yazar; alternatif doğru cevaplar kabul edilir. | Doğru / yanlış |
| `flashcard` | Cevabı açar, ardından hatırlayıp hatırlamadığını değerlendirir. | Hatırlanan / tekrar çalışılacak |

`limit` parametresi 5, 10 veya 20 olabilir; geçersiz veya eksik değer 10 kabul
edilir. Koleksiyonda daha az cümle varsa tamamı kullanılır. Her yeniden başlatmada
rastgele bir set seçilir. Flashcard öz değerlendirmesi otomatik doğruluk ölçümü
olarak sunulmaz. Sonuçlar yalnızca mevcut oturumda tutulur; backend'e yazılmaz.

## Dinleme için hazırlık

Pratik türü, cevap modundan ayrıdır: `reading` (Vocabulary) cümlenin okunmasını,
gelecekteki `listening` ise sesle sunulmasını ifade eder. Böylece dinleme daha
sonra çoktan seçmeli veya yazarak cevapla birleştirilebilir.

Şimdilik yalnızca `reading` kullanılabilir. `listening`, ortak seçenek tanımında
`available: false` olarak yer alır ve arayüzde gelecek özellik olarak gösterilir.
Ses çalma, tarayıcı TTS, mikrofon erişimi veya yeni backend endpoint'i eklenmemiştir.

Dinleme etkinleştirilmeden önce cümlelerin ses kaynağı, oynatma/hata durumları,
tekrar dinleme davranışı ve metnin ne zaman gösterileceği tasarlanmalıdır.
Sadece kullanılabilirlik bayrağını değiştirmek özelliği tamamlamaz.

## Erişilebilirlik ve doğrulama

- İkon butonlarında açıklayıcı ad; formlarda bağlı label; seçimlerde gerçek
  shadcn radio/select kontrolleri kullanılır.
- Cevap geri bildirimi renk yanında metin ve ikon içerir. Değerlendirmeden sonra
  odak sonraki aksiyona taşınır. Flashcard cevabı açılmadan öz değerlendirme yapılamaz.
- Çoktan seçmeli cevaplarda 1–4 tuşları, sayfa açıldığında veya sonraki soruya
  geçildiğinde ayrıca bir cevap butonuna odaklanmadan kullanılabilir. Dinleyici
  yalnızca aktif soruyu değerlendirir; metin alanları, açık menü/dialoglar, IME,
  basılı tutulan tuş tekrarları ve Ctrl/Alt/Meta kısayolları engellenmez.
- Kontrol komutları: `npm --prefix frontend run test:unit -- --run`,
  `npm --prefix frontend run build`, `npm --prefix frontend run check`.


## Cümle içi cevap alanı

Yazılı cevapta shadcn `Input`, eksik kelimenin yerinde gösterilir ve HTML `form`
özelliğiyle alttaki tek aksiyon butonuna bağlanır. Input genişliği doğru cevabın
uzunluğundan değil, kullanıcının yazdığı metinden türetilir. Böylece cevap
uzunluğu önceden açığa çıkmaz. Çok uzun girişler alanın içinde kaydırılır.

`cloze-input`, `cloze-blank` ve `cloze-answer` stilleri aynı metin hizasını ve
kompakt görünümü kullanır. Yazılmayan boşluk tek kesintisiz çizgidir; alt çizgi
karakterleri kullanılmaz. Kontrol sonrasında sonuç cümlede renk ve kısa ikonlu
metinle gösterilir. Yanlış cevapta doğru kelime cümleye yerleşir; kullanıcının
cevabı kısa bir satırda korunur. Ayrı bir sonuç kartı oluşturulmaz.

Aynı buton önce `Check answer`, sonra `Next sentence` veya `Finish session`
olur. Enter bu iki adımı da çalıştırır; IME kompozisyonu sırasında Enter cevabı
göndermez. Yeni soruda odak yeniden cümledeki cevap alanına geçer.
