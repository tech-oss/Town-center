# Supabase Auth email templates

Paste each into Supabase → Authentication → Email Templates. Use the subject
line shown, and paste the whole HTML file as the message body.

| Supabase template | Subject | File |
|---|---|---|
| Confirm signup | Confirm your email | `confirm-signup.html` |
| Invite user | You've been invited to Maidenhead | `invite-user.html` |
| Magic Link | Your Maidenhead sign-in link | `magic-link.html` |
| Change Email Address | Confirm your new email address | `change-email.html` |
| Reset Password | Reset your Maidenhead password | `reset-password.html` |

`{{ .ConfirmationURL }}` is filled in by Supabase. These are sent through
Resend once Resend is set as Supabase's SMTP server (Authentication → SMTP Settings).
