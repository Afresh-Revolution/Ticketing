# Email Setup for Gatewave

This guide explains how to configure email delivery in the Ticketing backend. The app uses **Resend** for:

- **Signup verification** – 6-digit OTP sent when a user creates an account (required on first login)
- **Forgot password** – 6-digit OTP sent for password reset

## Resend Setup

### Environment Variables

Add these to your backend `.env` file:

| Variable          | Description                          | Example                                  |
|-------------------|--------------------------------------|------------------------------------------|
| `RESEND_API_KEY`  | Resend API key                       | `re_xxxxxxxxxxxx`                         |
| `RESEND_FROM`     | From address (must be verified)      | `Gatewave <onboarding@resend.dev>`        |

### Getting an API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create an API key and copy it

### From Address

- **Testing:** Use `Gatewave <onboarding@resend.dev>` (Resend's test domain, works without verification)
- **Production:** Add and verify your domain in the [Resend Dashboard](https://resend.com/domains), then use e.g. `Gatewave <noreply@yourdomain.com>`

Example `.env`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=Gatewave <onboarding@resend.dev>
```

## Development Without Resend

If `RESEND_API_KEY` is not set, the backend will **not** send real emails. Instead, it will log what would be sent:

```
[email] (Resend not configured) Would send: { to: 'user@example.com', subject: 'Verify your email...', ... }
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

- Never commit `.env` or your Resend API key to version control.
- Use environment variables or secrets management in production (e.g. Render, Vercel, Railway).
- OTP codes expire in 10 minutes.
- Only one active OTP per email/type at a time (new code invalidates the previous one).
