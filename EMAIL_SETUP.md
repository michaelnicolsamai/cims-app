# Email Service Setup Guide

This guide explains how to configure the email service for the Customer Insight Management System (CIMS).

## Features

The email service provides:
- **Email Verification**: Sends verification emails when users register
- **Password Reset**: Allows users to reset their passwords via email
- **Email Notifications**: Can be extended for system notifications

## Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Step Verification** on your Gmail account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "CIMS" as the name
   - Copy the generated 16-character app password (format: `xxxx xxxx xxxx xxxx`)

3. **Configure Environment Variables**:

Add the following to your `.env` file:

```env
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=gitu guwu odjk fsym
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=CIMS

# Application URL (for email links)
NEXTAUTH_URL=http://localhost:3000
```

### Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
```

## Testing Email Service

1. **Register a new account** - You should receive a verification email
2. **Request password reset** - Go to `/forgot-password` and enter your email
3. **Check email inbox** - Verify that emails are being sent correctly

## Troubleshooting

### Emails not sending

1. **Check SMTP credentials**:
   - Verify `SMTP_USER` and `SMTP_PASSWORD` are correct
   - For Gmail, ensure you're using an App Password, not your regular password

2. **Check firewall/network**:
   - Ensure port 587 (or 465 for SSL) is not blocked
   - Some networks block SMTP ports

3. **Check email service logs**:
   - Check the server console for error messages
   - Look for "Email service configuration error" messages

4. **Gmail-specific issues**:
   - Ensure "Less secure app access" is enabled (if not using App Password)
   - Check if your account has any security restrictions
   - Verify the App Password was generated correctly

### Email in spam folder

- Add the sender email to your contacts
- Check spam folder settings
- For production, consider using a professional email service (SendGrid, Mailgun, etc.)

## Security Notes

- **Never commit** `.env` file to version control
- **Use App Passwords** instead of regular passwords for Gmail
- **Rotate passwords** regularly
- **Use environment-specific** email accounts for development/production

## Production Recommendations

For production environments, consider using:
- **SendGrid** - Professional email service with better deliverability
- **Mailgun** - Transactional email API
- **AWS SES** - Amazon Simple Email Service
- **Resend** - Modern email API for developers

These services provide:
- Better deliverability rates
- Email analytics
- Bounce handling
- Better spam prevention

## Current Configuration

Based on your provided app password, the system is configured to use:
- **SMTP Host**: smtp.gmail.com
- **Port**: 587 (TLS)
- **App Password**: `gitu guwu odjk fsym`

Make sure to set `SMTP_USER` to your Gmail address in the `.env` file.

