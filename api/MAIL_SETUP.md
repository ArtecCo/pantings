# ARAmane Arts mailer setup

The API uses PHPMailer over SMTP. The default production configuration assumes the mail service is on the same server and listens on localhost port 25.

## Server setup

From the `api` directory on the server:

```bash
composer install --no-dev --optimize-autoloader
```

Do not commit the `vendor` directory. The committed `composer.json` supplies PHPMailer.

## Environment

Set the API process/environment values from `.env.example` (or your hosting control panel):

```text
MAIL_HOST=127.0.0.1
MAIL_PORT=25
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=
```

If the local mail server requires authentication or TLS/SSL, set the corresponding username, password and encryption values.

Production origins:

```text
ALLOWED_ORIGINS=https://arts.araha.co.in,https://artsadmin.araha.co.in
ALLOWED_ADMIN_ORIGINS=https://artsadmin.araha.co.in
```

The frontend builds use `https://api.arts.araha.co.in` automatically when they are not running on localhost. `VITE_API_BASE_URL` can still override this for staging or local setups.

## Database

Run migrations in order, including:

- `008_maintenance_mode.sql`
- `009_mail_groups.sql`

Migration `009_mail_groups.sql` creates `mail_groups` and `mail_group_recipients` and seeds the `ORDER_UPDATES` and `SYSTEM_UPDATES` groups.

Recipients are edited from **Admin → Settings** and are stored in the database. Saving a group updates it in place and displays a toast; the page does not reload.

## Mail flow

- New order: `orders@arts.araha.co.in` → customer confirmation.
- New order: `systems@arts.araha.co.in` → `ORDER_UPDATES` recipients.
- Order status changes: `orders@arts.araha.co.in` → customer.
- Administrator OTP when `2fa_enabled = 1`: `systems@arts.araha.co.in` → the administrator's email.

Mail delivery failures are logged server-side and do not roll back a successfully created/updated order.
