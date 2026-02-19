# SMTP Setup for Gatewave

This guide explains how to configure SMTP for email delivery in the Ticketing backend. SMTP is used for:

- **Signup verification** – 6-digit OTP sent when a user creates an account (required on first login)
- **Forgot password** – 6-digit OTP sent for password reset

## Environment Variables

Add these to your backend `.env` file:

| Variable      | Description                    | Example                     |
|---------------|--------------------------------|-----------------------------|
| `SMTP_HOST`   | SMTP server hostname           | `smtp.gmail.com`            |
| `SMTP_PORT`   | SMTP port (587 for TLS)        | `587`                       |
| `SMTP_SECURE` | Use SSL/TLS (set to `true` for 465) | `false`               |
| `SMTP_USER`   | SMTP username / email          | `your-app@gmail.com`        |
| `SMTP_PASS`   | SMTP password or app password  | `your-app-password`         |
| `SMTP_FROM`   | From address (optional)        | `noreply@yourdomain.com`     |

## Gmail Setup

1. Create or use a Gmail account.
2. Enable 2-Step Verification (required for app passwords).
3. Go to [Google Account → Security → App passwords](https://myaccount.google.com/apppasswords).
4. Create an app password for "Mail" and "Other (custom name)" (e.g. "Gatewave").
5. Use that 16-character password as `SMTP_PASS`.

Example `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-app@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=noreply@gatewave.com
```

## Other Providers

### SendGrid
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your SendGrid API key>
```

### Mailgun
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=<your Mailgun SMTP password>
```

### Outlook / Microsoft 365
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=<your account password>
```

## Development Without SMTP

If `SMTP_USER` and `SMTP_PASS` are not set, the backend will **not** send real emails. Instead, it will log what would be sent to the console:

```
[email] (SMTP not configured) Would send: { to: 'user@example.com', subject: 'Verify your email...', ... }
```

Use this for local development. You can inspect the OTP in logs or temporarily add a `console.log(code)` in the verification flow (remove before production).

## Schema Migration

Run the schema to create the `VerificationCode` table and add `emailVerified` to `User`:

```bash
cd Ticketing-back
npm run db:schema
```

Or manually:

```bash
psql $DATABASE_URL -f db/schema.sql
```

## Existing Users (emailVerified)

After adding the `emailVerified` column, existing users default to `FALSE` and would be prompted for an OTP on their next login. To avoid that, run:

```sql
UPDATE "User" SET "emailVerified" = TRUE;
```

This marks all current users as verified so they can log in without an OTP.

## Security Notes

- Never commit `.env` or SMTP credentials to version control.
- Use environment variables or secrets management in production (e.g. Render, Vercel, Railway).
- OTP codes expire in 10 minutes.
- Only one active OTP per email/type at a time (new code invalidates the previous one).
