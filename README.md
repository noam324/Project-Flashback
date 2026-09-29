# Project Flashback

Project Flashback is a Windows desktop launcher built to provide a clean, modern interface for managing supported game builds, user accounts, profiles, Locker entitlements, and community features.

> **Status:** Active development

## ✨ Features

* Discord OAuth authentication
* Server-side account and session management
* Player profiles and Flashback Credits
* Build selection and launcher integration
* Server-side Locker entitlements
* Admin Locker management
* News and tournament sections
* Windows desktop launcher
* Automated Windows builds with GitHub Actions
* Secure server-side authorization for administrative features

## 🏗️ Project Structure

Project Flashback is organized into several components:

* **Flashback.Launcher** — Windows launcher functionality.
* **Flashback.Web** — frontend and Tauri desktop interface.
* **Flashback.DownloadServer** — download and update infrastructure.
* **Backend API** — authentication, sessions, profiles, Locker, rewards, and administrative operations.

## 🔐 Authentication & Security

Authentication is handled by the Project Flashback backend.

The authentication flow uses Discord OAuth and server-side sessions:

1. The launcher starts a Discord OAuth login.
2. Discord authenticates the user.
3. The backend validates the OAuth callback.
4. A server-side session is created.
5. The launcher validates the session through the backend.

Raw session tokens are not stored directly in the database. Session tokens are stored using server-side hashes.

Security-sensitive operations are performed by the backend rather than being trusted to the launcher client.

This includes:

* Account authentication
* Session validation
* Admin authorization
* Locker ownership
* Player profiles
* Account rewards
* Server-side account state

Discord OAuth credentials and other sensitive configuration values are stored outside the source code using server-side secret configuration.

## 🎒 Locker System

Project Flashback includes a server-side Locker entitlement system.

Locker items are associated with user accounts through the backend database.

Administrators can manage authorized users' Locker entitlements through the Admin Panel.

The launcher does not have authority to arbitrarily grant itself items. Ownership is determined by the backend.

## 👑 Admin System

Administrative functionality is protected by server-side authorization.

Authorized administrators can:

* Search for accounts
* View a user's Locker
* Grant Locker items
* Remove Locker items
* Enable or disable Full Locker access

Administrative permissions are validated by the backend and are not based solely on client-side UI state.

## 💰 Rewards

Project Flashback supports server-side account rewards and Flashback Credits.

Rewards are intended to be calculated and stored by the backend rather than being trusted to values supplied by the launcher client.

## 🌐 Backend

The Project Flashback launcher communicates with a dedicated backend API for authentication and account functionality.

Production and development environments may use different API endpoints.

Sensitive credentials and secrets are never intended to be committed to the public repository.

## 🛠️ Building

The repository contains the source code and CI configuration required to build Project Flashback.

A local development environment may require:

* Windows
* .NET SDK compatible with the project
* Node.js and npm
* Tauri prerequisites
* Git

Additional configuration may be required for local development.

Secrets and environment-specific credentials should be configured locally and must not be committed to the repository.

## ⚙️ Continuous Integration

Project Flashback uses GitHub Actions to automate Windows builds.

The build pipeline is intended to:

1. Restore dependencies.
2. Build the project.
3. Produce the Windows application/setup artifact.
4. Publish the resulting build artifact.

Release artifacts should be traceable to the source code and workflow that produced them.

## 📦 Releases

Official releases are published through GitHub Releases.

Each release should correspond to a specific version of the Project Flashback source code and its associated automated build.

Release notes should document important changes, fixes, and known issues.

## 🔏 Code Signing Policy

Project Flashback's **Code Signing Policy** is to sign official release binaries when an appropriate trusted code-signing service is available.

Only official release artifacts produced from the Project Flashback source repository and intended for distribution should be submitted for signing.

Signing certificates, private keys, authentication credentials, and other signing secrets must never be committed to this repository.

Development and test builds may remain unsigned.

Users should obtain official releases from the project's published release channels and verify the release information before running downloaded software.

The project does not intentionally disable or bypass Windows security features such as Smart App Control.

## 🛡️ Security Reporting

If you discover a security vulnerability, please avoid publicly posting:

* Passwords
* OAuth credentials
* Session tokens
* Private keys
* Database credentials
* Other sensitive information

Security issues should be reported responsibly so they can be investigated without exposing users or credentials.

## 🔒 Privacy

Project Flashback uses Discord OAuth for authentication.

The launcher communicates with the Project Flashback backend for authentication and account-related functionality.

The project does not intentionally commit Discord OAuth client secrets, database credentials, session secrets, private keys, or other sensitive credentials to the public repository.

## 🤝 Contributing

Project Flashback is under active development.

Bug reports, feature requests, documentation improvements, and code contributions are welcome.

Before submitting a contribution, please ensure that:

* No secrets or credentials are included.
* No personal data is unintentionally committed.
* Changes are relevant to the project.
* The project continues to build successfully.

## 📄 License

Project Flashback is released under the MIT License.

See [LICENSE](LICENSE) for the full license text.

## ⚠️ Disclaimer

Project Flashback is an independent community project.

It is not affiliated with, endorsed by, or sponsored by Epic Games.

Fortnite and related trademarks are property of their respective owners.
