# Google Login Fix Instructions

The "Access Denied" error occurs because the Google OAuth configuration is still pointing to the old Vercel URL or `localhost`. You must update the following settings to match your new domain: **https://hievly.com**.

## 1. Google Cloud Console (Credentials)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Select your project.
3. Under **OAuth 2.0 Client IDs**, click on your web client (e.g., "Hievly Web").
4. **Authorized JavaScript origins**:
   - Remove old URLs (like `https://music-web-git-main...vercel.app`).
   - Add: `https://hievly.com`
   - Add: `https://www.hievly.com`
5. **Authorized redirect URIs**:
   - Remove old URLs.
   - Add: `https://hievly.com/api/auth/callback/google`
   - Add: `https://www.hievly.com/api/auth/callback/google`
6. Click **Save**.

## 2. Google Cloud Console (OAuth Consent Screen)
1. Go to the **OAuth consent screen** tab.
2. If the "Publishing status" says **Testing**, there is a user cap (100 users).
3. If you are ready for the public, click **Publish App** to move to **Production** mode. This removes the "Access Denied" error for new users not in the test list.

## 3. Vercel Environment Variables
1. Go to your Vercel Dashboard -> Project Settings -> Environment Variables.
2. Find `NEXTAUTH_URL`.
3. Update its value to: `https://hievly.com` (Ensure there is no trailing slash).
4. If you have `NEXT_PUBLIC_APP_URL` or similar, update that as well.
5. **Redeploy** the application for the changes to take effect (Environment variables usually require a new deployment).

## 4. Verification
After waiting 5-10 minutes (Google changes can take time to propagate):
1. Open Incognito mode.
2. Go to `https://hievly.com/login`.
3. Click "Sign in with Google".
4. It should now proceed without the "Access Denied" error.
