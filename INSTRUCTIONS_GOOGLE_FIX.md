# CRITICAL FIX FOR GOOGLE LOGIN

The "Dangerous Site" or "Access Denied" error is happening because Google thinks requests from `hievly.com` are unauthorized.

I have updated the code to be more robust (`trustHost: true`), but you **MUST** update the Google Cloud Console settings for it to work.

## STEP 1: Run the Configuration Script
I have created a script that prints the EXACT values you need.
Run this in your terminal (or just read the file `google-auth-config.js`):

```bash
node google-auth-config.js
```

## STEP 2: Update Google Cloud Console
1. Go to: [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your **OAuth 2.0 Client ID** (e.g. "Hievly Web").
3. **Javascript Origins**: Remove old ones. Add `https://hievly.com` and `https://www.hievly.com`.
4. **Redirect URIs**: Remove old ones. Add `https://hievly.com/api/auth/callback/google` and `https://www.hievly.com/api/auth/callback/google`.
5. **SAVE**.

## STEP 3: Verify "Publishing Status"
1. Click the **OAuth consent screen** tab on the left.
2. Look at "Publishing Status".
3. If it says **Testing**, your login will FAIL for anyone not added to the test users list.
4. Click **PUBLISH APP** to make it accessible to everyone. This removes the "Dangerous/Unverified App" warning.

## STEP 4: Vercel Environment
1. Go to Vercel Settings.
2. Ensure `NEXTAUTH_URL` is set to `https://hievly.com` (no trailing slash).
3. Redeploy.
