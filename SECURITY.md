\# Security Policy



\## Reporting a Vulnerability



If you discover a security vulnerability in Project Flashback, please report it responsibly.



Do not publicly disclose:



\* Passwords

\* OAuth client secrets

\* Session tokens

\* Private keys

\* Database credentials

\* Access tokens

\* Personal information

\* Other sensitive credentials



Please provide enough information to reproduce and investigate the issue without exposing sensitive information.



\## Scope



Security reports may include issues affecting:



\* Authentication

\* Session management

\* Account authorization

\* Locker ownership

\* Rewards

\* Administrative authorization

\* Backend API security

\* Launcher security

\* Update and download mechanisms



\## Server-Side Security



Project Flashback is designed so that security-sensitive account state is controlled by the backend rather than trusted from the launcher client.



This includes:



\* Account authentication

\* Session validation

\* Administrative authorization

\* Locker entitlements

\* Account rewards

\* Player account state



\## Secrets



Secrets must never be committed to the repository.



This includes:



\* Discord OAuth client secrets

\* Database credentials

\* API keys

\* Session secrets

\* Private signing keys

\* Access tokens



Development secrets should be stored using appropriate local secret-management mechanisms.



\## Code Signing



Official release binaries may be code signed when an appropriate trusted signing service is available.



Private signing keys and signing credentials must never be committed to this repository.



\## Responsible Disclosure



Please allow the maintainers reasonable time to investigate and address a security issue before publicly disclosing technical details.



