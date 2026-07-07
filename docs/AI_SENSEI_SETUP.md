# AI Sensei Setup Guide

## Overview

AI Sensei uses **OpenRouter** as the primary AI provider for real LLM responses in Study and Practice modes.

OpenRouter provides access to various LLM models including free tiers, making it an excellent choice for educational applications.

## IMPORTANT: Security Rules

- **NEVER commit API keys to Git**
- **NEVER put real API keys in any source code or config file that is tracked by Git**
- API keys should only exist in:
  - Environment variables (recommended)
  - Local-only config files like `application-local.yml` (which is in .gitignore)

## Supported Providers

### Primary: OpenRouter (Recommended)

OpenRouter provides access to multiple free LLM models including:
- Google Gemini models
- Anthropic Claude models
- Meta Llama models
- And many more...

**Benefits:**
- Multiple free models available
- Unified API for different providers
- Generous free tier limits

### Secondary: Gemini (Optional)

Google Gemini can be used as an alternative or fallback provider.

## How to Get OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Give it a name (e.g., "MIDORI Dev")
6. Copy the generated key

**Note:** OpenRouter free tier provides limited credits. You can add more credits or use different free models.

## Setting Up OPENROUTER_API_KEY

### Option 1: Environment Variable (Recommended)

**PowerShell (Session only - resets when you close terminal):**
```powershell
$env:OPENROUTER_API_KEY="your_openrouter_api_key_here"
```

**PowerShell (Permanent - survives terminal restart):**
```powershell
[System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "your_openrouter_api_key_here", "User")
```
Then restart your terminal.

**Command Prompt:**
```cmd
setx OPENROUTER_API_KEY "your_openrouter_api_key_here"
```
Then restart your terminal.

### Option 2: Spring Config Property

Edit `midori-be/src/main/resources/application-local.yml` (this file is gitignored):

```yaml
ai:
  provider: openrouter
  openrouter:
    api-key: your_openrouter_api_key_here
    model: openrouter/free  # or specific model like "google/gemini-2.0-flash"
```

## Configuring AI Provider

### Using OpenRouter (Default)

```yaml
ai:
  provider: openrouter
  openrouter:
    api-key: "PASTE_YOUR_OPENROUTER_API_KEY_HERE"
    model: "openrouter/free"
```

### Using Gemini (Alternative)

```yaml
ai:
  provider: gemini
  gemini:
    api-key: "PASTE_YOUR_GEMINI_API_KEY_HERE"
```

## Practice Mode Fallback

If the AI provider fails (quota exceeded, network error, etc.), Practice mode will automatically fall back to generating simple quizzes from the lesson material content.

When this happens, you'll see a note:
> "Quiz được tạo từ dữ liệu bài học."

## Running Backend and Frontend

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL database configured
- OpenRouter API key

### Backend

```powershell
cd midori-be

# Set API key (if not already set globally)
$env:OPENROUTER_API_KEY="your_openrouter_api_key_here"

# Run with local profile
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

Backend will start at: http://localhost:8080

### Frontend

```powershell
cd midori-fe
npm run dev
```

Frontend will start at: http://localhost:8081

## Troubleshooting

### Error: "AI provider chưa được cấu hình"

**Cause:** OPENROUTER_API_KEY is not set or is still the placeholder.

**Solution:**
1. Check if key is set:
   ```powershell
   $env:OPENROUTER_API_KEY
   ```
2. If empty or contains "PASTE_", set your real key:
   ```powershell
   $env:OPENROUTER_API_KEY="your_openrouter_api_key_here"
   ```
3. Restart backend

### Error: "API key AI không hợp lệ"

**Cause:** The API key is invalid or expired.

**Solution:**
1. Verify API key is correct at https://openrouter.ai/keys
2. Try generating a new key

### Error: "AI đang quá tải"

**Cause:** OpenRouter quota exceeded or rate limited.

**Solutions:**
1. Wait a few minutes and try again
2. Practice mode will automatically use local fallback
3. Check your OpenRouter credit balance at https://openrouter.ai/credits

### Practice mode shows "Quiz được tạo từ dữ liệu bài học"

**This is expected behavior** when AI provider is unavailable or quota exceeded. The quiz will still work using simple pattern matching from the lesson content.

### Backend starts but AI doesn't work

Check logs for:
- `[OpenRouterAiProvider] API key not configured`
- `[OpenRouterAiProvider] Error calling OpenRouter`
- `[AiService] Using local fallback`

## Gitignore Verification

The following files are ignored by Git (do NOT commit):
- `.env`
- `.env.local`
- `.env.*`
- `application-local.yml` (all locations)
- `midori-be/.env`
- `midori-be/.env.local`
- `midori-be/.env.*`

Verify with:
```bash
git status --short
```

## File Structure

```
midori-be/
├── src/main/resources/
│   ├── application-local.yml      # Local config (gitignored)
│   └── ...
├── src/main/java/com/midori/
│   └── service/impl/
│       └── OpenRouterAiProvider.java  # OpenRouter API integration
│       └── GeminiAiProvider.java      # Gemini API (optional)
│       └── AiServiceImpl.java    # Business logic + local fallback
│   └── controller/
│       └── AiController.java     # REST endpoints
```

## Support

If you encounter issues:
1. Check the error message in browser/terminal
2. Verify OPENROUTER_API_KEY is set correctly
3. Check network connectivity to OpenRouter
4. Verify API key has not exceeded quota
5. For Practice mode, local fallback will work even without AI
