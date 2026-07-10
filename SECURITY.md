# Security

Juris is a demonstration project, not a production legal system. Never enter real client data, privileged documents, or legal secrets.

The hosted demo uses anonymous Supabase sessions. Row-level security isolates each visitor's workspace, while the public publishable key remains safe to expose in the frontend. Service-role keys must never be used in browser code.

Please report a vulnerability through GitHub's private security advisory flow instead of a public issue.
