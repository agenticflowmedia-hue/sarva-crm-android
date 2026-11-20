# OM SARVA BHUTA CRM — Android build

**Status:** Debug testing APK built successfully. Do **not** distribute as a production KYC app until the security and live tests below pass.

## Android APK

- Latest signature-verified cloud build: https://github.com/agenticflowmedia-hue/sarva-crm-android/actions/runs/44692266430
- Download the **SARVA-CRM-Android-APK** artifact from the workflow run, extract its ZIP, and obtain `app-debug.apk`.
- This debug APK has the original SARVA logo and loads https://om-sarva-bhuta-crm-secure.vercel.app/enroll.html via an Android WebView; a hardening step restricts in-app browser navigation to the official production hostname.
- No Android handset installation or end-to-end real-world KYC test has been verified.
- **Important:** The APK points to the older production CRM, which has not received the full new KYC workflow.

## CRM environments

- Existing production: https://om-sarva-bhuta-crm-secure.vercel.app
- KYC operations preview: https://om-sarva-bhuta-crm-secure-g2cik1vq1-agenticflowmedia-9781.vercel.app/operations.html
- Supabase project: `ezzvalwtvcadizcwlptm`
- Existing customer records: 2 approved; KYC documents: 0 (checked 2026-11-20).
- Private KYC bucket configured with 5 MB size cap; PDF, JPEG, PNG, WebP allowed.
- Database blocks approvals of new pending enrollments that lack a verified private uploaded document.
- KYC admin/reviewer verification RPC validates the caller and the backed private file.

## Release blockers

1. **Chrome security:** Prior Chrome warning indicated a potentially deceptive page/password. Verify domain-specific issues in [Google Search Console](https://search.google.com/search-console). Investigate and correct any finding; obtain a successful security review before customers enter credentials. The Google Transparency Report stating "no data" is not a clearance.
2. **Existing customers:** Two approved enrollments need authentic KYC documents uploaded by a permitted admin; do not manufacture documents or imply they have been backfilled.
3. **End-to-end QA:** Using authorized test accounts and **synthetic** identification documents (not real customer IDs), test enrollment → private upload → reviewer verification → approval → read permissions and rollback/error cases. Independently confirm on Android device.
4. **OTP:** SMS service has not been configured; select a compliant SMS provider, create an account, and set credentials securely in Supabase. This must not be faked with client-side OTP.
5. **Auth settings:** Enable Supabase leaked password protection if available on the plan. Review security advisors and all policies.
6. **Release signing:** Generate a long-term signing keystore, store it in a secure secret manager, and produce a **release-signed** APK. Do not reuse one-off keys or ship a debug APK as a production release.
7. **Release:** After security clearance and QA, deploy the consolidated CRM to the production hostname, update/rebuild APK as required, and run full phone install test.

## APK building

A GitHub Actions workflow on push or manual dispatch verifies the uploaded source ZIP, compiles with Android SDK 35, restricts the WebView host, checks the APK signature/ZIP integrity, and uploads a debug APK.

**Privacy:** The repository may currently be public. It must not contain passwords, KYC images, access tokens, signing keystores, or service-role keys. Review repository visibility in GitHub Settings.
