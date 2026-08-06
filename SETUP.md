# Warqaa Admin Panel — Supabase Setup Guide

The admin panel runs entirely in the browser. No Node.js, no local server,
no install step. Once configured, you edit the site at
`yoursite.com/admin/login.html` from any device.

---

## Overview

| Layer       | What it does |
|-------------|--------------|
| Vercel      | Hosts and auto-deploys the site from your GitHub repo |
| Supabase    | Stores essays, designs, decorations, and settings |
| imgBB       | Hosts uploaded images (free, browser-to-imgBB direct) |
| GitHub      | Source of truth — push a change, Vercel redeploys |

---

## Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign in.
2. Click **New Project**. Choose any name (e.g. `warqaa`).
3. Save your database password somewhere safe (you will not need it often).
4. Wait for the project to finish provisioning (about 60 seconds).

---

## Step 2 — Run the database schema

1. In your Supabase project, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/schema.sql` from this project folder.
4. Copy the entire file contents and paste it into the SQL Editor.
5. Click **Run**.

This creates four tables (`essays`, `designs`, `decorations`, `settings`),
enables Row Level Security so only you can write data, and inserts the
default settings row.

---

## Step 3 — Create your admin user

1. In Supabase, go to **Authentication** → **Users** → **Add user**.
2. Enter your email address and choose a strong password.
3. Click **Create user**.

This is the account you will use to log in to the admin panel.

---

## Step 4 — Add your Supabase keys to the project

1. In Supabase, go to **Project Settings** → **API**.
2. Copy two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public key** (a long string starting with `eyJ...`)
3. Open `js/supabase-client.js` in the project and replace the placeholder values:

```js
var WARQAA_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
var WARQAA_SUPABASE_KEY = 'YOUR_ANON_PUBLIC_KEY_HERE';
```

The anon key is safe to include in client-side code. Supabase's Row Level
Security ensures public visitors can only read data, never write it.

---

## Step 5 — Commit and push to GitHub

```
git add js/supabase-client.js
git commit -m "add Supabase connection"
git push
```

Vercel will redeploy automatically. Your site and admin panel are now live.

---

## Step 6 — Log in to the admin panel

Go to: `https://yoursite.vercel.app/admin/login.html`

Enter the email and password you created in Step 3.

---

## Step 7 — Set your imgBB API key

1. Get a free API key at https://api.imgbb.com
2. In the admin panel, go to **Settings**.
3. Paste the key into the **imgBB API key** field and click **Save Settings**.

The key is stored in your browser only (not in Supabase) so your images
are private. You will need to re-enter it if you use a different browser or device.

---

## Admin panel sections

| Section     | What you can do |
|-------------|-----------------|
| Essays      | Add, edit, delete essays. Separate paragraphs with a blank line. |
| Designs     | Add projects with title, tag, category, concept, and image URLs. |
| Decorations | Place PNG images anywhere on the site by zone, position, and size. |
| Settings    | Update name, bio, contact info, portrait URL, and imgBB key. |
| Upload Tool | Compress any image with presets, upload to imgBB, copy the URL. |

---

## Adding content

### Essays
1. Go to **Essays** → **New Essay**.
2. Write your content in the text area (blank line between paragraphs).
3. Save. Changes are live on the site immediately.

### Designs
1. Go to **Designs** → **New Design**.
2. Go to **Upload Tool**, compress and upload your project images to imgBB.
3. Copy the URLs and paste them into the design (one per line).
4. Save.

### Decorations (flowers, illustrations, PNG overlays)
1. Go to **Upload Tool**, upload your PNG to imgBB, copy the URL.
2. Go to **Decorations** → **Add Decoration**.
3. Choose which zone of the site to place it (hero, about section, etc.).
4. Paste the URL, set position and size, save.
5. The image appears on the live site immediately.

---

## Local preview

To preview the site locally with live Supabase data, use any static server.
The quickest options:

- **VS Code** — install the Live Server extension, right-click `index.html`, Open with Live Server.
- **Python** — run `python -m http.server 3000` in the project folder, open `http://localhost:3000`.

The admin panel at `/admin/login.html` works the same way locally.

---

## Backup and restore

In the admin panel sidebar, use **Export backup** to download all your
content as a single JSON file. Use **Import backup** to restore it on a
new Supabase project or after an accidental deletion.
