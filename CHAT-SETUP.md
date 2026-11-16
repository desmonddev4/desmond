# Live chat: setup (about 10 minutes)

The site is static, so real-time chat needs a small backend. This uses **Firebase Realtime Database** (free Spark plan is plenty). The browser talks to Firebase over plain REST and EventSource; the Vercel build injects its public Firebase configuration from environment variables.

Until you do this, the chat runs in **demo mode** (messages stay in the same browser, synced between tabs). Open `contact.html` in one tab and `inbox.html` in another to try it.

## 1. Create the project
1. Go to https://console.firebase.google.com, **Add project** (name it anything, skip Analytics).
2. **Build > Realtime Database > Create database** (pick the region closest to Ghana, start in *locked mode*).
3. Copy the database URL shown at the top (looks like `https://xxxx-default-rtdb.firebaseio.com`).

## 2. Turn on sign-in for you only
1. **Build > Authentication > Get started > Email/Password > Enable**.
2. **Users > Add user**: email `damedzie4@gmail.com` and a strong password.
3. Firebase marks admin-created users as unverified. Rules require a verified email. After deploying the site, open `admin/login.html` and try signing in with the account. The site sends a verification email automatically; open the link in your inbox (check spam too), then sign in again. A password-reset link does not verify the email.

## 3. Paste the rules
**Realtime Database > Rules**: replace everything with the contents of `firebase-rules.json` and **Publish**.
These rules let visitors write only to their own (unguessable) thread, never read anyone else's, and let only your verified email read the inbox and reply.

## 4. Connect the site
Get the **Web API key** from your Firebase project settings. In Vercel, add `NST_FIREBASE_DATABASE_URL` and `NST_FIREBASE_API_KEY` as environment variables for the Production environment. Never paste the key into tracked source files. Configure Vercel's build command as `node tools/build.mjs` and its output directory as `dist`; details are in `DEPLOY.md`.

The web API key is necessarily visible in the deployed browser code; it is not an admin password. Database access is controlled by the published Firebase rules. After deploying, open `admin/login.html`, sign in, and keep the inbox tab open when you want to be reachable.

## Adding projects from the admin
Open `admin/projects.html` and press **Add project**. Fill in the name, category, a short description and a cover image (it is resized in your browser), then save. The project appears at once in the home page carousel, the Work page and on its own case study page. The case study fields (client, role, tech, brief, what you built, result) are optional. The portfolio starts empty; you can edit or delete the projects you add here.
- **Live mode:** projects are saved in your Firebase database under `projects` and `projectImgs`. You must **re-publish `firebase-rules.json`** (Realtime Database > Rules) once, because it now includes those two paths. Everyone can read them, only your verified email can write.
- **Demo mode:** projects are saved in the same browser as the admin, which is enough to try it out.

## Good to know
- **You only get alerts while the inbox tab is open** (sound, tab title count, and desktop notifications once you click "Enable alerts"). On your phone, open `inbox.html` and "Add to Home Screen". True background push needs a server function later.
- Toggle **Show me as available** off when you're away: visitors then see "Away" plus an email box and the WhatsApp link.
- The inbox page is not linked from the site and is marked `noindex`; it also requires the admin sign-in.
- Messages are capped at 2,000 characters. There is no rate limit yet; if you ever see spam, add Firebase App Check.

## Admin sign-in
Every admin page and `inbox.html` send you to `admin/login.html` when you are not signed in, and bring you back to the page you wanted afterwards. Only the account in `owner.email` (in `js/chat-config.js`) is let in; anyone else is signed straight back out. Features: show/hide password, "Keep me signed in" (untick on shared computers), Forgot password, a wait after 5 wrong attempts, and a clear message if your email is not verified yet.

## Admin dashboard
Open `admin/index.html` (not linked from the site, marked `noindex`). It has six pages: Overview, Conversations, Leads, Projects, Audience and System, with a sticky sidebar and header.
- It uses the same sign-in and database as `inbox.html`, so no extra setup. In demo mode the sign-in accepts any password, and only on localhost or a local file; on a real domain with no Firebase details the admin switches itself off instead. In demo mode it fills itself with sample data (flagged with a "Sample data" badge) until the first real conversation arrives.
- Lead stages and the setup checklist are saved in the browser you use. Projects you add and their status are saved with the site (see above).
- The Audience page shows sample numbers only. Nothing on the site records visits yet.
