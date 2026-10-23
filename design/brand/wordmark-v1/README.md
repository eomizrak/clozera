# Clozera wordmark — v1 review set

Seçilen yön: küçük harfli `clozera`, turuncu `o` içinde yatay boşluk ve favicon
için C monogramı. Seçilen açık zemin wordmark'ı ve açık/koyu favicon sürümleri
uygulamaya bağlandı. Çalışma dosyaları burada; optimize edilmiş kullanılan
kopyalar `frontend/public/brand` klasöründedir.

## Dosyalar

- `logo-on-light.png`: açık zemin için koyu yazılı, şeffaf PNG wordmark.
- `logo-on-dark-preview.png`: koyu zeminli wordmark önizlemesi; **şeffaf değildir**.
- `symbol-on-light.png`: açık zemin için koyu C + turuncu çizgi; şeffaf PNG.
- `symbol-on-dark.png`: koyu zemin için açık C + turuncu çizgi; şeffaf PNG.
- `favicon-on-light.ico` ve `favicon-on-dark.ico`: 16, 32 ve 48 px kareleri içerir.
- `icon-on-{light,dark}-{16,32,48,180,192,512}.png`: ayrı boyutlardaki PNG ikonlar.

`on-light`, açık zeminde kullanılacak koyu çizimli dosyayı; `on-dark`, koyu
zeminde kullanılacak açık çizimli dosyayı belirtir. Arayüz teması ile tarayıcı
sekmesinin teması her zaman aynı olmayabilir; uygulama sırasında ayrı seçilmelidir.

## Bilinen sınır

ImageGen'in şeffaf beyaz wordmark çıktılarında kenar lekeleri oluştu. Bu çıktılar
bu pakete alınmadı. Koyu zemin sürümü bu nedenle yalnızca zeminli bir önizlemedir;
şeffaf, üretime hazır koyu wordmark olarak kullanılmamalıdır. İki wordmarkı da
aynı geometriye sahip temiz bir vektör masterdan dışa aktarmak sonraki adımdır.

İkon PNG boyutları ve ICO içindeki üç çözünürlük dosya düzeyinde doğrulandı.
SVG master bu pakete dahil değildir. Navbar, uygulamanın mevcut açık temasına
uygun sürümü kullanır; favicon ise tarayıcının renk şeması tercihine göre seçilir.
Koyu wordmark önizlemesi uygulamaya bağlanmamıştır.

Üretim yöntemi: yerleşik ImageGen. Son kullanılan üretim tarifleri `PROMPTS.md`
dosyasında bulunur. Pillow yalnızca boyut ve PNG/ICO dışa aktarma işlemleri için
kullanıldı; görseller yeniden çizilmedi veya renklendirilmedi.
