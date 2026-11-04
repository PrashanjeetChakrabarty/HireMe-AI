# Security policy

If you find a security problem in HireMe AI, please report it privately. Do not open a public issue.

Email: workbuildwithus@gmail.com

Please include what you found, the steps to reproduce it and, if you can, how serious you think it is. We will reply as
soon as possible and tell you when it is fixed.

## What the project does to stay safe

- Passwords are stored as BCrypt hashes. Sign-in uses short-lived JWT tokens.
- Sign-up, login and password reset are protected by Cloudflare Turnstile and by one-time email codes.
- Every API call checks the token, and a person can only read or change their own data.
- No secret is kept in the code. Keys, passwords and connection strings are settings of the hosting service.
- Uploaded resumes are personal data. They are never committed to Git and the uploads folder is ignored.
