# Going live: checklist

Do these in order. The first four are required; the rest are strongly recommended.

## 1. Connect Firebase (required)
Follow `CHAT-SETUP.md` steps 1 to 3. Until the Vercel build has both Firebase environment variables:
- the admin pages and inbox are **switched off** on any real domain (they only open on localhost for testing),
- the chat button is replaced by a WhatsApp link, so visitors are never shown a chat that goes nowhere.

For Vercel, add `NST_FIREBASE_DATABASE_URL` and `NST_FIREBASE_API_KEY` in **Project Settings > Environment Variables**. Use the Production environment (and Preview if you want preview deployments to use Firebase too). Set **Framework Preset** to Other, **Build Command** to `node tools/build.mjs`, and **Output Directory** to `dist`. The build writes the Firebase config into the deployment output; it is not committed to Git.

## 2. Publish the database rules (required)
Paste `firebase-rules.json` into Realtime Database > Rules and publish. **The rules are the real lock**: the sign-in page is a convenience, the rules are what stop anyone else reading your inbox or editing projects. Check that your email in the rules matches `owner.email` in `js/chat-config.js`.

## 3. Verify your admin email (required)
Rules need a verified email. In Firebase Authentication > Users use **Send verification email** (or use *Forgot password?* on the login page; opening the link also verifies it). Use a long unique password.

## 4. Firebase web key visibility
The Firebase web API key is included in the deployed JavaScript because browser code needs it. Storing it as a Vercel environment variable keeps it out of Git-tracked source, but does not make it secret after deployment. Firebase database rules—not the key—protect chat and project data.

## 5. Add your real links
In `js/chat-config.js` fill `owner.social` (github, linkedin, x). Any left empty is hidden from the footer rather than linking to "#".

## 6. Set your domain, then deploy
```
node tools/finalize.mjs https://your-domain.com
```
This writes canonical links, share-image URLs, `sitemap.xml` and `robots.txt`. Commit the generated public metadata and let Vercel deploy the repository.

## 7. Host settings
Security headers (CSP, HSTS, no-framing), caching and the 404 page are already prepared:
- **Netlify / Cloudflare Pages**: `_headers` is picked up automatically.
- **Vercel**: `vercel.json`.
- **cPanel / Apache hosting**: `.htaccess`.
Serve over **HTTPS** at the domain root (not a sub-folder).

## 8. After deploying
- Open `https://your-domain.com/admin/login.html`, sign in, open the inbox, and send yourself a test message from the site in another browser.
- Add the site to Google Search Console and submit `sitemap.xml`.
- Optional: turn on Firebase **App Check** if you ever see spam; set a Firebase budget alert.

## Known limits
- Alerts only arrive while the inbox tab is open (no server-side push).
- Audience page shows sample numbers; nothing records visits yet.
- No rate limit on visitor messages beyond Firebase's own (see App Check above).
