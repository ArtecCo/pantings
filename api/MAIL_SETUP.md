# ARAmane Arts mailer setup

The API uses PHPMailer over SMTP. The production configuration is designed for a local mail transfer agent on the same server, so **no SMTP username or password is required** when the local MTA accepts mail from `127.0.0.1`.

## PHPMailer

Composer is **not required**. The API loader looks first for these official PHPMailer source files:

```text
api/lib/PHPMailer/src/Exception.php
api/lib/PHPMailer/src/PHPMailer.php
api/lib/PHPMailer/src/SMTP.php
```

Download the PHPMailer release source from the official PHPMailer project and copy those three files into the paths above. The repository does not contain a Composer `vendor` directory and does not require the `composer` command.

## SMTP

For a mail service running locally on the same server, use:

```text
MAIL_HOST=127.0.0.1
MAIL_PORT=25
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=
```

An empty username means PHPMailer uses `SMTPAuth=false`; therefore no password is read or required. TLS is also disabled for the local unauthenticated connection.

If the hosting provider does **not** expose a local unauthenticated MTA, then the provider's SMTP hostname/port/authentication settings must be used instead. Being on the same physical server does not by itself guarantee that port 25 accepts unauthenticated submissions.

## Production origins

```text
ALLOWED_ORIGINS=https://arts.araha.co.in,https://artsadmin.araha.co.in
ALLOWED_ADMIN_ORIGINS=https://artsadmin.araha.co.in
```

The frontend builds automatically use `https://api.arts.araha.co.in` when opened from a non-localhost host. `VITE_API_BASE_URL` can still override this for staging or local development.

## Database

Run migrations in order, including:

- `008_maintenance_mode.sql`
- `009_mail_groups.sql`

Migration `009_mail_groups.sql` creates `mail_groups` and `mail_group_recipients` and seeds the `ORDER_UPDATES` and `SYSTEM_UPDATES` groups.

Recipients are edited from **Admin → Settings** and saved without a page refresh.

## Mail flow

- New order: `orders@arts.araha.co.in` → customer confirmation.
- New order: `systems@arts.araha.co.in` → `ORDER_UPDATES` recipients.
- Order status changes: `orders@arts.araha.co.in` → customer.
- Administrator OTP when `2fa_enabled = 1`: `systems@arts.araha.co.in` → administrator email.

Mail delivery failures are logged server-side and do not roll back a successfully created/updated order.
