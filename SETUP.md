# Midori Project Setup

This document describes how to set up the Midori Japanese learning platform.

## Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.8+
- PostgreSQL 14+

## Backend Setup

### 1. Database Configuration

Create `midori-be/src/main/resources/application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/midori
    username: your_username
    password: your_password
```

### 2. External Resources

The following resources must be downloaded separately. They are not included in the repository because they are large and can be downloaded from official sources.

---

## Download KANJIDIC2

### Purpose

KANJIDIC2 provides Kanji information including:

- Onyomi (Chinese reading)
- Kunyomi (Japanese reading)
- Stroke Count
- Radical
- JLPT Level
- Grade
- English Meanings

### Official Source

https://www.edrdg.org/wiki/index.php/KANJIDIC_Project

### Instructions

1. Visit https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
2. Download `KANJIDIC2.xml`
3. Copy to:

```
midori-be/src/main/resources/dictionary/
```

### Final Structure

```
dictionary/
├── KANJIDIC2.xml
├── JMdict.xml
├── sudachi/
└── kanjivg/
```

---

## Download JMdict

### Purpose

JMdict provides Japanese vocabulary with:

- Japanese definitions
- English translations
- Part of speech
- Example sentences

### Official Source

https://www.edrdg.org/jmdict/j_jmdict.html

### Instructions

1. Visit https://www.edrdg.org/jmdict/j_jmdict.html
2. Download `JMdict.xml` (choose the XML version)
3. Copy to:

```
midori-be/src/main/resources/dictionary/
```

### Final Structure

```
dictionary/
├── KANJIDIC2.xml
├── JMdict.xml
├── sudachi/
└── kanjivg/
```

---

## Download KanjiVG

### Purpose

KanjiVG provides SVG stroke order animations for learning proper stroke writing.

### Official Repository

https://github.com/KanjiVG/kanjivg

### Instructions

1. Visit https://github.com/KanjiVG/kanjivg
2. Download the repository as ZIP or clone it
3. Extract the archive
4. Copy the `kanji` folder into:

```
midori-be/src/main/resources/dictionary/kanjivg/
```

Note: Rename the folder from `kanji` to `kanjivg` if needed.

### Final Structure

```
dictionary/
├── KANJIDIC2.xml
├── JMdict.xml
├── sudachi/
└── kanjivg/
    ├── 04e00.svg
    ├── 04e01.svg
    ├── 04e02.svg
    └── ...
```

---

## Install FFmpeg

### Purpose

FFmpeg is required for:

- Shadowing: Audio extraction from videos
- Video processing: Format conversion and thumbnail generation
- Thumbnail generation: Create preview images

### Official Website

https://ffmpeg.org/download.html

### Windows

1. Download FFmpeg release from https://www.gyan.dev/ffmpeg/builds/
2. Extract to:

```
midori-be/ffmpeg/
```

### Expected Structure

```
ffmpeg/
└── bin/
    ├── ffmpeg.exe
    └── ffprobe.exe
```

### Alternative: Environment Variables

You can also set environment variables instead:

```
FFMPEG_PATH=C:\path\to\ffmpeg.exe
FFPROBE_PATH=C:\path\to\ffprobe.exe
```

---

## Graceful Degradation

If any external resource is missing, the application will:

| Resource Missing | Behavior |
|------------------|----------|
| KANJIDIC2.xml | Log warning, disable Kanji Dictionary features |
| JMdict.xml | Log warning, disable Vocabulary Dictionary features |
| kanjivg/ | Return HTTP 404 for SVG requests, frontend shows "Stroke animation is unavailable" |
| FFmpeg | Log warning, disable Shadowing video processing |

The application will NOT crash when resources are missing. It will continue to run with reduced functionality.

---

## Running the Application

### Backend

```bash
cd midori-be
./mvnw spring-boot:run
```

Or with imports:

```bash
cd midori-be
./mvnw spring-boot:run --import-dictionary --import-kanji
```

### Frontend

```bash
cd midori-fe
npm install
npm run dev
```

---

## Troubleshooting

### FFmpeg Not Found

```
[WARN] FFmpegValidator - FFmpeg is not fully configured.
Shadowing video processing will be disabled.
```

**Solution**: Download FFmpeg and extract to `midori-be/ffmpeg/` or set environment variables.

### Dictionary Files Not Found

```
[WARN] Dictionary resource not found: src/main/resources/dictionary/JMdict.xml
```

**Solution**: Download the dictionary files from the official sources listed above.

### KanjiVG Not Found

```
[WARN] KanjiSvgService - KanjiVG dataset is missing from the classpath
Stroke order animations will be unavailable.
```

**Solution**: Download KanjiVG from GitHub and place in `dictionary/kanjivg/`.
