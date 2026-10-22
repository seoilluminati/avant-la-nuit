# Security policy

## Supported versions

The latest release and the `main` branch (which is what the hosted web app runs).

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's
[private vulnerability reporting](https://github.com/seoilluminati/avant-la-nuit/security/advisories/new).
You should get a first answer within 7 days.

Relevant issues include anything that could leak a user's GPX route off their device,
script injection through GPX content (for example a crafted track name), or a supply
chain risk in the hosted page.

Because the output is used for outdoor safety decisions, **an error that makes the tool
dangerously optimistic** (for example a wrong sunset time somewhere in the world) is
treated with the same priority as a security issue. Those can be reported in public issues.
