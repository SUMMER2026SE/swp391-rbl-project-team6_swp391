# Midori Project Setup

This document describes how to set up the Midori Japanese learning platform.

## Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.8+
- PostgreSQL 14+

## Backend Setup

### 1. Environment Variables

Copy the environment variable template:

```powershell
cd midori-be
copy-item .env.example .env
```

Open `midori-be/.env` and fill in all values. See `midori-be/.env.example` for the complete list of supported variables.

Key required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL JDBC connection URL |
| `DATABASE_USERNAME` | Database username |
| `DATABASE_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing secret (minimum 32 characters) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `SPRING_MAIL_USERNAME` | Gmail sender address |
| `SPRING_MAIL_PASSWORD` | Gmail App Password (16 characters) |

> **Do not commit `midori-be/.env`** — it is gitignored.

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

### Automated Download (Recommended)

Use the provided script to download KANJIDIC2.xml:

```powershell
cd midori-be
.\scripts\download-kanjidic.ps1
```

This script will:
- Download the file from the official EDRDG source
- Create the required directory structure
- Verify the downloaded file is valid XML

### Manual Download

1. Visit https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
2. Download `KANJIDIC2.xml`
3. Copy to:

```
midori-be/src/main/resources/dictionary/
```

### Using a Custom Path

You can specify a custom path using the `KANJIDIC2_PATH` environment variable:

```powershell
$env:KANJIDIC2_PATH = "C:\path\to\KANJIDIC2.xml"
```

Or in your `.env` file:

```
KANJIDIC2_PATH=C:\path\to\KANJIDIC2.xml
```

### Final Structure

```
dictionary/
├── KANJIDIC2.xml
├── JMdict.xml
├── sudachi/
│   ├── LEGAL
│   └── LICENSE-2.0.txt
└── kanjivg/
```

### License and Attribution

KANJIDIC2 is provided by the Electronic Dictionary Research and Development Group (EDRDG). See: https://www.edrdg.org/edrdg/licence.html

Note: KANJIDIC2 is optional. If not present, Kanji Dictionary features will be disabled but the application will continue to run.

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

FFmpeg is not bundled with the repository. Install FFmpeg using one of these methods:

**Method 1: Winget (Recommended)**
```powershell
winget install ffmpeg
```

**Method 2: Chocolatey**
```powershell
choco install ffmpeg
```

**Method 3: Scoop**
```powershell
scoop install ffmpeg
```

**Method 4: Manual Download**
1. Download from https://www.gyan.dev/ffmpeg/builds/
2. Extract to a folder (e.g., `C:\ffmpeg`)
3. Add the `bin` folder to your system PATH:
   ```powershell
   # Add to PATH temporarily for current session
   $env:PATH = "C:\ffmpeg\bin;$env:PATH"

   # Or add permanently via System Properties > Environment Variables
   ```
4. Restart your terminal/IDE

After installation, verify FFmpeg is working:
```powershell
ffmpeg -version
ffprobe -version
```

### Linux / macOS

Install FFmpeg using your package manager:

```bash
# Debian/Ubuntu
sudo apt-get update && sudo apt-get install -y ffmpeg

# macOS (with Homebrew)
brew install ffmpeg

# CentOS/RHEL
sudo yum install -y ffmpeg
```

### Alternative: Environment Variables (All Platforms)

You can also set environment variables to override system PATH:

```bash
# Linux/macOS (PowerShell)
$env:FFMPEG_PATH = "/usr/local/bin/ffmpeg"
$env:FFPROBE_PATH = "/usr/local/bin/ffprobe"

# Windows (PowerShell)
$env:FFMPEG_PATH = "C:\ffmpeg\bin\ffmpeg.exe"
$env:FFPROBE_PATH = "C:\ffmpeg\bin\ffprobe.exe"
```

### Docker / Deployment

For Docker-based deployment, add to your Dockerfile:

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
```

Note: FFmpeg is optional. If not installed, shadowing video processing will be disabled but the application will continue to run.

---

## Graceful Degradation

All external resources are **optional**. The application will continue to run with reduced functionality if any resources are missing:

| Resource Missing | Behavior |
|------------------|----------|
| KANJIDIC2.xml | Log warning, disable Kanji Dictionary features |
| JMdict.xml | Log warning, disable Vocabulary Dictionary features |
| kanjivg/ | Return HTTP 404 for SVG requests, frontend shows "Stroke animation is unavailable" |
| FFmpeg | Log warning, disable Shadowing video processing |

The application will **NOT crash** when resources are missing. It will continue to run with reduced functionality.

To download missing resources, use the provided scripts:
```powershell
# Download KANJIDIC2.xml
.\midori-be\scripts\download-kanjidic.ps1
```

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
