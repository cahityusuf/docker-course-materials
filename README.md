# Docker Course Materials

> Sıfırdan ileri seviyeye 3 günlük kapsamlı Docker eğitim programı — tüm belgeler, sunum slaytları, sınav, çalışan lab projeleri.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Language: Turkish](https://img.shields.io/badge/lang-Türkçe-blue.svg)]()
[![Docker](https://img.shields.io/badge/docker-23%2B-2496ED.svg)]()

## İçindekiler

- [Hakkında](#hakkında)
- [Repo Yapısı](#repo-yapısı)
- [Hedef Kitle](#hedef-kitle)
- [Kursun Genel Akışı](#kursun-genel-akışı)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Lab Uygulamaları](#lab-uygulamaları)
- [Önkoşullar](#önkoşullar)
- [Katkı](#katkı)
- [Lisans](#lisans)

## Hakkında

Bu repo, **3 günlük (09:30 – 16:30) ve 12 modüllük** kapsamlı bir Docker eğitiminin tüm materyallerini içerir. Container teknolojisinin felsefesinden başlayıp Dockerfile, multi-stage build, Docker Compose, networking, volume yönetimi, güvenlik sertleştirmesi, CI/CD entegrasyonuna kadar uzanır. **Docker Swarm hariç** tüm konular ele alınmıştır.

Kurs, daha önce container teknolojisiyle hiç çalışmamış ama temel Linux bilgisine sahip kişiler için tasarlanmıştır. Her modül; teorik açıklama → komut örnekleri → laboratuvar çalışması yapısında ilerler.

## Repo Yapısı

```
docker-course-materials/
├── README.md
├── LICENSE
├── .gitignore
│
├── docs/
│   ├── 01-tam-kurs-dokumani.docx       # Word formatında ana doküman (~37 sayfa)
│   ├── 01-tam-kurs-dokumani.pdf        # PDF versiyonu (Mac/Pages için ideal)
│   └── 02-mufredat-listesi.docx        # Tek sayfalık günlük program özeti
│
├── sunum/
│   └── docker-kursu-sunum.pptx         # 36 slaytlık eğitim sunumu
│
├── sinavlar/
│   └── seviye-tespit-sinavi.docx       # 10 soruluk başlangıç seviye tespit sınavı
│
└── labs/                               # Çalışan, test edilebilir lab projeleri
    ├── README.md                       # Lab'lara genel bakış
    ├── 01-nodejs-basit/                # Tek aşamalı Node.js Dockerfile
    ├── 02-go-multistage/               # 10 MB distroless Go imajı
    ├── 03-node-typescript-multistage/  # 3 aşamalı TS build pipeline
    ├── 04-python-buildkit/             # BuildKit cache mount + Flask
    ├── 05-postgresql-volume-lab/       # Veri kalıcılığı kanıtlama
    └── 06-web-db-network-lab/          # User-defined bridge + DNS ispatı
```

## Hedef Kitle

- Container teknolojisine ilk kez giren geliştiriciler ve sistem yöneticileri
- Production'da Docker kullanmak isteyen ekipler
- Eğitmenler (kurs içeriği yeniden kullanım için)

**Önkoşullar:** Temel Linux komutları (cd, ls, cat, grep, ps), bir terminal kullanma yeteneği ve metin editörü deneyimi.

## Kursun Genel Akışı

| Gün | Tema | Modüller |
|---|---|---|
| **Gün 1** | Temeller | Containerization felsefesi → Kurulum → Image/layer/registry → Container yaşam döngüsü |
| **Gün 2** | Üretim | Dockerfile talimatları → Multi-stage & BuildKit → Volume & veri kalıcılığı → Networking |
| **Gün 3** | Operasyon | Compose temelleri → Compose ileri seviye → Güvenlik & kaynak yönetimi → Registry, CI/CD, prod |

### Günlük Standart Program

| Saat | Aktivite |
|---|---|
| 09:30 – 11:00 | 1. Modül (90 dk) |
| 11:00 – 11:15 | Kahve arası |
| 11:15 – 12:30 | 2. Modül (75 dk) |
| 12:30 – 13:30 | Öğle yemeği |
| 13:30 – 15:00 | 3. Modül (90 dk) |
| 15:00 – 15:15 | Kahve arası |
| 15:15 – 16:30 | 4. Modül + Soru-Cevap (75 dk) |

**Toplam net öğretim süresi:** 18 saat (3 gün × 6 saat)

## Hızlı Başlangıç

```bash
# Repoyu klonla
git clone https://github.com/cahityusuf/docker-course-materials.git
cd docker-course-materials

# Eğitim dokümanını oku (Mac'te PDF önerilir)
open docs/01-tam-kurs-dokumani.pdf

# Veya .docx versiyonunu Word/LibreOffice/Google Docs ile aç
open docs/01-tam-kurs-dokumani.docx

# İlk lab'ı dene
cd labs/01-nodejs-basit
cat README.md
docker build -t lab/nodejs-basit:1.0 .
docker run -d --name web -p 8080:3000 lab/nodejs-basit:1.0
curl http://localhost:8080
```

## Lab Uygulamaları

Her lab klasöründe **çalışan kaynak kod**, hazır `Dockerfile`, `.dockerignore` ve adım adım komutlu `README.md` bulunur. Tipik kullanım:

```bash
cd labs/<lab-klasoru>
cat README.md     # adım adım talimatlar
docker build -t lab/<isim> .
docker run -d -p <host>:<container> lab/<isim>
```

| # | Lab | Modül | Öğrettiği |
|---|---|---|---|
| 1 | `01-nodejs-basit` | 5 | Tek aşamalı Dockerfile, layer caching, healthcheck |
| 2 | `02-go-multistage` | 6 | 350 MB → 10 MB küçülmesinin gözle ispatı |
| 3 | `03-node-typescript-multistage` | 6 | 3 aşamalı (deps → build → runtime) pipeline |
| 4 | `04-python-buildkit` | 6 | `--mount=type=cache` ile pip cache kalıcılığı |
| 5 | `05-postgresql-volume-lab` | 7 | Volume varken/yokken veri kalıcılığı karşılaştırması |
| 6 | `06-web-db-network-lab` | 8 | User-defined bridge'te DNS ile container'lar arası iletişim |

### İlk lab'ı çalıştırmak için en az ne lazım?

- Docker Engine 23.0 veya üstü (`docker --version` ile kontrol)
- BuildKit aktif (Docker 23+'da varsayılan; eski sürümlerde `export DOCKER_BUILDKIT=1`)
- 8080 portunun müsait olması

## Önkoşullar

- **macOS:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Windows:** WSL2 + [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** [resmi kurulum talimatları](https://docs.docker.com/engine/install/) — Ubuntu/Debian, Fedora, RHEL için ayrı yönergeler vardır
- En az 4 GB RAM, 10 GB boş disk (image cache için)

## Lisans

Bu materyaller [MIT Lisansı](LICENSE) ile yayınlanmıştır. Eğitimde, atölye çalışmalarında, kişisel öğrenmede özgürce kullanılabilir, çoğaltılabilir ve değiştirilebilir.

## Katkı

Hata bildirimi, içerik düzeltme veya yeni lab önerileri için issue açın veya pull request gönderin. Pull request'lerde:

- Türkçe kullanın (tutarlılık için)
- Yeni bir lab ekliyorsanız, `labs/` altında numaralı klasör + kendi `README.md`'si olsun
- Dockerfile değişikliklerinde test edip çalıştığından emin olun

## Sıkça Sorulanlar

**Soru:** Docker Swarm neden yok?
**Cevap:** Modern container orkestraları için Kubernetes'e geçiş yapılması önerilir. Swarm öğrenmek yerine Compose'da derinleşip sonra Kubernetes'e geçmek daha verimli bir öğrenme yolu.

**Soru:** Pages/Word'de doküman bozuk görünüyor.
**Cevap:** `docs/01-tam-kurs-dokumani.pdf` versiyonunu kullanın — Pages'in docx render kısıtlamalarından etkilenmez.

**Soru:** Sunum hangi yazılımda açılır?
**Cevap:** PowerPoint, Keynote, LibreOffice Impress, Google Slides — her birinde açılır.

---

⭐ Yararlı bulduysanız repo'yu yıldızlamayı unutmayın!
