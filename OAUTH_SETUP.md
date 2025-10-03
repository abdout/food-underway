# OAuth Setup Verification

## Required Vercel Environment Variables ✅
- `AUTH_SECRET`: A random 32+ character string (generate with: openssl rand -base64 32)
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret from Google Cloud Console
- `NEXTAUTH_URL`: https://me.databayt.org

## Required Google OAuth Redirect URIs
Add ALL of these to your Google Cloud Console OAuth 2.0 Client:

### Production
- `https://me.databayt.org/api/auth/callback/google` ✅ (You have this)

### Vercel Deployments
- `https://food-underway.vercel.app/api/auth/callback/google`
- `https://food-underway-git-main-osman-abdouts-projects.vercel.app/api/auth/callback/google`

### Development
- `http://localhost:3000/api/auth/callback/google` ✅ (You have this)

## Troubleshooting Steps

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Functions tab
   - Look for errors in the `/api/auth/[...nextauth]` function

2. **Clear Browser Cookies**
   - Clear all cookies for `me.databayt.org`
   - Try incognito/private browsing mode

3. **Verify Google OAuth Settings**
   - OAuth consent screen is published (not in testing mode)
   - Application type is "Web application"
   - Authorized JavaScript origins includes: `https://me.databayt.org`

4. **Check for Mixed Content**
   - Ensure all resources load over HTTPS in production
   - Check browser console for mixed content warnings

## Common Issues and Solutions

### "Configuration" Error
- **Cause**: Missing or invalid environment variables
- **Solution**: Verify all env vars are set in Vercel

### "OAuthCallback" Error
- **Cause**: Redirect URI mismatch
- **Solution**: Add exact URI to Google Console

### "OAuthAccountNotLinked" Error
- **Cause**: Email already exists with different provider
- **Solution**: User should sign in with original method

## Testing Checklist
- [ ] Environment variables are set in Vercel
- [ ] Deployment has been redeployed after adding env vars
- [ ] Google OAuth redirect URIs match exactly
- [ ] OAuth consent screen is published
- [ ] Browser cookies have been cleared
- [ ] Tested in incognito mode