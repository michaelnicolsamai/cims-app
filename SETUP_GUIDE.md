# Setup Guide - Fixing JWT Session Error

## JWT Session Error Fix

If you're getting this error:
```
[next-auth][error][JWT_SESSION_ERROR] "decryption operation failed"
```

This means the `NEXTAUTH_SECRET` environment variable is missing or has changed.

## Solution

### Step 1: Generate a Secret Key

Run this command in your terminal to generate a secure secret:

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
```

**Windows (Command Prompt):**
```cmd
powershell -Command "[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))"
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

### Step 2: Add to .env File

Create or update your `.env` file in the root directory:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-your-generated-secret-here"
```

### Step 3: Clear Browser Cookies

1. Open your browser's developer tools (F12)
2. Go to Application/Storage tab
3. Clear all cookies for `localhost:3000`
4. Or use an incognito/private window

### Step 4: Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Important Notes

- **Never commit your `.env` file** to version control
- The secret should be at least 32 characters long
- If you change the secret, all existing sessions will be invalidated
- Each environment (development, production) should have its own unique secret

## Complete .env Example

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cims_db"
DIRECT_URL="postgresql://user:password@localhost:5432/cims_db"

# NextAuth - REQUIRED
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SUPABASE_BUCKET="cims-app-files"
```

## Verification

After setting up, try:
1. Register a new account
2. Login with your credentials
3. You should be redirected to the dashboard without errors

If you still get errors, make sure:
- The `.env` file is in the root directory (same level as `package.json`)
- You've restarted the development server after adding the secret
- You've cleared your browser cookies

