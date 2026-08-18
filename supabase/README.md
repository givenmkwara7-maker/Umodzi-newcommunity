# Supabase setup

1. In the Supabase dashboard, open **SQL Editor**, create a query, paste `schema.sql`, and run it.
2. Open **Authentication > Users > Add user**. Add `givenmkwara7@gmail.com`, set a strong password, and enable auto-confirm.
3. In **Authentication > URL Configuration**, add `https://givenmkwara7-maker.github.io/newcommunity-/` as the Site URL and an allowed Redirect URL.
4. For email alerts, create a [Resend](https://resend.com) account, verify a sending domain, then install the Supabase CLI and run:

   ```sh
   supabase login
   supabase link --project-ref ftsqsqhuqafjhwhtgbna
   supabase secrets set RESEND_API_KEY=re_your_key NOTIFICATION_FROM="New Community <notifications@your-domain.com>"
   supabase functions deploy send-notification --no-verify-jwt
   supabase functions deploy send-reply
   ```

The browser submits forms even before the notification function is deployed; the forms are stored securely and appear in the Admin Panel. Email notifications begin after step 4.
