OM SARVA BHUTA CRM - Android APK build project

This is source code, NOT an APK. Original logo used as Android launcher icon.

Cloud build using GitHub Actions:
1. Create a private GitHub repository.
2. Upload the CONTENTS of this folder to the repository root (including .github folder).
3. Open Actions > Build SARVA Android APK > Run workflow.
4. After success, open the run > Artifacts > SARVA-CRM-Android-APK.
5. Download and extract the artifact ZIP. The contained app-debug.apk installs on Android.

Alternative: Open in Android Studio (JDK 17 + SDK 35) > Build > Build APK(s).

IMPORTANT SECURITY:
- This Android wrapper opens https://om-sarva-bhuta-crm-secure.vercel.app/ (existing production dashboard).
- It DOES NOT automatically make KYC/OTP functionality production-ready.
- The newer Vercel preview domain was flagged as deceptive by Chrome; it is NOT used as the app start URL.
- Do not upload real identity documents until site security and KYC access controls are validated.
- The APK from GitHub Actions is debug-signed for testing, not release-signed for public distribution.
- App requires internet and the live website; this is a WebView wrapper, not a native/offline CRM.
