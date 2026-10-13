# Alumni Website - University of Peradeniya

The Alumni Relations Office (ARO) portal: alumni registration, events, projects, patrons and an alumni directory.

> 📖 **New to the code?** Read the [Project Guide](doc/PROJECT_GUIDE.md): how the site works, every file
> explained, and a "where do I change X" lookup table.

| Layer    | Tech                                                    | Folder                |
| -------- | ------------------------------------------------------- | --------------------- |
| Frontend | React 19, React Router, Tailwind CSS 4, Vite            | [frontend/](frontend/) |
| Backend  | PHP 8 REST API (plain PHP + PDO, no framework/Composer) | [backend/](backend/)   |
| Database | MySQL 5.7+ / MariaDB 10.3+                              | [backend/database/](backend/database/) |

```
frontend/              React app
  public/              images, videos, .htaccess for deployment
  src/pages/           one file per page (Home, Events, Register, ...)
  src/components/      header, footer, form helpers, faculty grid ...
  src/api/             fetch wrapper used to call the PHP API
backend/
  public/index.php     single entry point for every /api request
  src/routes.php       list of all API endpoints
  src/handlers/        the code behind each endpoint
  config/              config.example.php -> copy to config.php
  database/            schema.sql + seed.sql
  storage/uploads/     uploaded degree certificates (never public)
```

## Requirements

- **Node.js 20+** (for the React app)
- **PHP 8.0+** with `pdo_mysql` and `mbstring` enabled
- **MySQL or MariaDB**

The easiest way to get PHP + MySQL on Windows is [XAMPP](https://www.apachefriends.org/).

## Setup (first time)

### 1. Database

Start MySQL (XAMPP Control Panel → MySQL → Start), then from the project folder:

```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p aro_alumni < backend/database/seed.sql
```

Or in **phpMyAdmin**: open the *Import* tab and import `schema.sql`, then select the `aro_alumni` database and import `seed.sql`.

The seed creates two demo alumni accounts. **Delete them before going live.**

| Email             | Alumni Login                                   |
| ----------------- | ---------------------------------------------- |
| `alumni@demo.lk`  | Works (verified)                               |
| `pending@demo.lk` | Refused: registration still pending verification |

For **Student Login** use any made-up university address, e.g. `test.student@sci.pdn.ac.lk`.
The account is created on first login.

> **Upgrading a database you created before passwordless login?** Run
> `mysql -u root -p aro_alumni < backend/database/migrations/001_passwordless_login.sql`
> (or re-import `schema.sql` + `seed.sql` if it only holds test data).

### 2. Backend config

```bash
cp backend/config/config.example.php backend/config/config.php
```

Edit `config.php`:

- your database user/password,
- **`jwt.secret`**: replace it with a long random string. The API refuses to start until you do.
  Generate one with `php -r "echo bin2hex(random_bytes(32));"`,
- keep `'debug' => true` while developing.

### 3. Frontend packages

```bash
cd frontend
npm install
```

## Running locally

You need two terminals.

**Terminal 1: PHP API** (from the project folder):

```bash
php -S localhost:8000 -t backend/public backend/public/index.php
```

Check it works: <http://localhost:8000/api/health> should show `{"ok":true}`.

> **Using XAMPP's Apache instead of `php -S`?** Put the project in `C:\xampp\htdocs\Alumni_website`, then create
> `frontend/.env.local` containing
> `VITE_API_PROXY=http://localhost/Alumni_website/backend/public`

**Terminal 2: React app**:

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>. Vite forwards every `/api/...` request to the PHP server, so the browser
sees a single site and the login cookie works without CORS setup.

### How login works (passwordless)

There are no passwords. Both tabs on the Login page work the same way:
**Enter email → Send OTP → enter the 6-digit code → Verify & Login.**

| Tab           | Who may log in                                                                    |
| ------------- | --------------------------------------------------------------------------------- |
| Student Login | Emails on `@pdn.ac.lk` or any subdomain (`@sci.pdn.ac.lk`, `@eng.pdn.ac.lk`…)    |
| Alumni Login  | Emails of alumni accounts with `verification_status = 'verified'`                 |

- Codes expire after **5 minutes**. Max **3 codes per email per 15 minutes**, 10 per IP address, and
  5 wrong guesses per code.
- After a correct code the API issues a **JWT** (signed with `jwt.secret`, valid 7 days) in an
  **httpOnly cookie**, so page scripts can never read it.
- All of these numbers and the student domains are in `config.php`.

### Email codes (OTP) during development

With `'debug' => true` the API also returns the code and the page shows it on screen, so you can log in
and register without a mail server. In production set `'debug' => false` and configure PHP's `mail()`
(or swap in an SMTP library such as PHPMailer in `otp_issue()` in
[backend/src/handlers/otp.php](backend/src/handlers/otp.php)).

## API

All responses are JSON. Errors look like `{"error": "message", "fields": {"email": "..."}}`.

| Method   | Path                        | Login | Purpose                                    |
| -------- | --------------------------- | :---: | ------------------------------------------ |
| `GET`    | `/api/auth/me`              |       | Current user (or `null`)                   |
| `POST`   | `/api/auth/login/otp`       |       | Email a login code `{email, role}`         |
| `POST`   | `/api/auth/login/verify`    |       | `{email, role, code}` → sets JWT cookie    |
| `POST`   | `/api/auth/logout`          |       | Clears the JWT cookie                      |
| `POST`   | `/api/auth/register/otp`    |       | Email a verification code `{email}`        |
| `POST`   | `/api/auth/register/verify` |       | `{email, code}` → `registration_token`     |
| `POST`   | `/api/auth/register`        |       | multipart form + `registration_token`      |
| `GET`    | `/api/faculties`            |       |                                            |
| `GET`    | `/api/people`               |       | Patrons grouped by committee               |
| `GET`    | `/api/projects`             |       |                                            |
| `GET`    | `/api/events`               |       | Includes attendee count and your RSVP      |
| `POST`   | `/api/events/{id}/register` |  ✔   | Confirm attendance                         |
| `DELETE` | `/api/events/{id}/register` |  ✔   | Cancel attendance                          |
| `GET`    | `/api/directory`            |  ✔   | `?q=&faculty=&year=&page=`                 |
| `PUT`    | `/api/profile`              |  ✔   | Update your details                        |

To add an endpoint, write a function in `backend/src/handlers/` and register it in
[backend/src/routes.php](backend/src/routes.php).

## How verification works

New registrations are saved with `verification_status = 'pending'` and **cannot log in yet**.
The ARO checks the registration number or uploaded certificate and then sets the status to `verified`,
after which Alumni Login works. Until there is an admin panel, do it in phpMyAdmin or with:

```sql
UPDATE users SET verification_status = 'verified' WHERE email = 'someone@example.com';
```

Only **verified** alumni who ticked the directory consent box appear in the Directory, and only their
name, faculty and batch are shown, which is what the registration form promises.

## Deploying (Apache / cPanel / XAMPP)

1. `cd frontend && npm run build`
2. Upload the **contents** of `frontend/dist/` to the web root (e.g. `public_html/`).
3. Upload the `backend/` folder into the same web root, so you have `public_html/backend/`.
4. Create `backend/config/config.php` on the server with the live database details, a new random
   `jwt.secret`, and `'debug' => false`. Serve the site over **HTTPS**.
5. Import `schema.sql` (and optionally `seed.sql`, minus the demo users) into the live database.
6. Make sure `backend/storage/uploads/` is writable by the web server.

The `.htaccess` that ships in `dist/` sends `/api/*` to PHP and everything else to the React app.
The `.htaccess` files inside `backend/` block web access to config, source code and uploads.
The site is built to run at the root of a domain or subdomain (e.g. `alumni.pdn.ac.lk`).

## Not built yet

- Admin panel (verify alumni, manage events/projects/people). Use phpMyAdmin for now.
- Blog (linked in the old design but never built)
- Admin login screens (an `admin` account can already log in on either tab)
