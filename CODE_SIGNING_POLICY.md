# Code Signing Policy

## Purpose

Project Flashback maintains this Code Signing Policy for official Windows release binaries.

## SignPath Foundation

Project Flashback is applying for the SignPath Foundation open-source signing program.

**Free code signing provided by SignPath.io, certificate by SignPath Foundation**

The current public release is unsigned. This policy does not claim that SignPath Foundation has approved the project before that approval actually occurs.

## Team Roles

The current project signing and maintenance team is:

* **Authors:** Noam (@noam324)
* **Reviewers:** Noam (@noam324)
* **Approvers:** Noam (@noam324)

Authors are trusted to modify the source code. Changes proposed by contributors who are not project committers are subject to review by a project reviewer. Each signing request requires approval by the designated approver.

## Official Releases

Only official Project Flashback release artifacts should be distributed as official releases.

Release artifacts should be produced from the Project Flashback source repository and associated with the corresponding source revision and build workflow.

## What Can Be Signed

Only binaries built from the Project Flashback source repository and its maintained build scripts are eligible for project signing.

Development builds, local developer builds, and externally supplied binaries are not intended to be submitted for signing.

## Signing Credentials

Code-signing certificates, private keys, authentication credentials, and related secrets must never be committed to the public repository.

## Build Integrity

Project Flashback uses automated GitHub Actions workflows to build Windows artifacts.

Where practical, official release artifacts should be traceable to:

- The source revision used to build them
- The GitHub Actions workflow that produced them
- The corresponding release version

Every release signing request is intended to require manual approval.

## Privacy

Project Flashback will not transfer information to other networked systems unless specifically requested by the user or the person installing or operating it.

Project Flashback uses Discord OAuth for authentication and communicates with the Project Flashback backend for account-related functionality.

See [PRIVACY.md](PRIVACY.md) for additional information.

## Windows Security

Project Flashback does not intentionally disable or bypass Windows security features such as Smart App Control.

## Development Builds

Development and locally compiled binaries are not necessarily signed and should not be considered official release artifacts.

## Policy Changes

This policy may be updated as the project's release and code-signing infrastructure evolves.
