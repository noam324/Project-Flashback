\# Code Signing Policy



\## Purpose



Project Flashback uses code signing to help users verify the authenticity and integrity of official Windows release binaries.



\## Official Releases



Only official Project Flashback release artifacts should be distributed as official releases.



Release artifacts should be produced from the Project Flashback source repository and associated with the corresponding source revision and build workflow.



\## Signing



Project Flashback intends to sign official Windows release binaries using a trusted code-signing service when available.



Development and test builds may remain unsigned.



\## Signing Credentials



Code-signing certificates, private keys, authentication credentials, and related secrets must never be committed to the public repository.



Signing credentials must be stored and accessed through secure secret-management mechanisms.



\## Build Integrity



The project uses automated GitHub Actions workflows to build Windows artifacts.



Where practical, official release artifacts should be traceable to:



\* The source revision used to build them

\* The GitHub Actions workflow that produced them

\* The corresponding release version



\## Windows Security



Project Flashback does not intentionally disable or bypass Windows security features such as Smart App Control.



The project aims to distribute legitimate, verifiable release binaries through official project channels.



\## Development Builds



Development and locally compiled binaries are not necessarily signed and should not be considered official release artifacts.



\## Policy Changes



This policy may be updated as the project's release and code-signing infrastructure evolves.



