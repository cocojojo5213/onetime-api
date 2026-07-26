# Release and updater maintenance

This project uses the Tauri v2 updater with signed artifacts published through GitHub Releases.

## Update trust model

- `src-tauri/tauri.conf.json` contains the public updater key and the HTTPS `latest.json` endpoint.
- The private signing key is never committed to the repository.
- GitHub Actions receives the private key through the `TAURI_SIGNING_PRIVATE_KEY` secret and its password through `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- `bundle.createUpdaterArtifacts` must remain enabled. Every package offered to the updater is signed during the release build.
- The application refuses unsigned artifacts or artifacts whose signature does not match the embedded public key.

Loss of the private key prevents future releases from updating existing installations. Keep a protected, independently recoverable backup and test its checksum after creation. Never print the key or password in CI logs, documentation, issues, or Release notes.

## Supported installer paths

The release matrix publishes installer-specific entries in `latest.json`:

- `linux-x86_64-deb` and `linux-aarch64-deb`
- `linux-x86_64-appimage` and `linux-aarch64-appimage`
- `windows-x86_64-nsis` and `windows-x86_64-msi`
- universal macOS application entries for both Intel and Apple Silicon

The updater selects the entry matching the package type used to install the running application. Debian package updates use the operating system's authorization prompt; AppImage updates replace the writable AppImage in place. Windows uses the installer mode configured in `tauri.conf.json` and macOS replaces the application bundle before restart.

`v0.2.2` is the updater bridge release. Installations at `v0.2.1` or earlier must install this version manually once because those binaries do not contain the updater plugin or public key.

## Preparing a release

1. Update the version consistently in:
   - `package.json`
   - `package-lock.json`
   - `src-tauri/Cargo.toml`
   - the `onetime-api` package entry in `src-tauri/Cargo.lock`
   - `src-tauri/tauri.conf.json`
2. Move the relevant changelog entries into a dated version section.
3. Run the directly affected checks and one platform-native bundle build.
4. Confirm the signing secrets exist by name in the repository settings. Do not attempt to print or retrieve their values.
5. Commit and push `main`.
6. Create a new immutable `vX.Y.Z` tag and push it. Never move or overwrite a published tag.
7. The workflow keeps the Release as a draft while matrix jobs upload assets. A final job verifies every installer-specific `latest.json` entry and publishes the Release only after the complete matrix succeeds.

## Release verification

A completed Release must contain normal installers, signature files, and `latest.json`. The final workflow job performs the manifest gate before publication. Verify at least:

- the Release is public and not marked as a prerelease;
- every expected platform and architecture is represented;
- `latest.json` reports the released version and contains installer-specific platform keys;
- each platform entry has a non-empty HTTPS URL and signature;
- a downloaded package reports the expected version and architecture;
- an installation from the previous updater-enabled version detects the new version and can complete the signed in-app flow.

## Local signed build

The signing variables must be present in the process environment; `.env` files are not loaded automatically by Tauri:

```bash
export TAURI_SIGNING_PRIVATE_KEY="/secure/path/to/onetime-api.key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="..."
npm run tauri -- build --bundles deb
```

Do not place the private key or password inside the repository.

## Rollback and key rotation

Do not rewrite a bad Release tag. Revert the faulty source change and publish a newer patch release.

Updater downgrades are disabled by default, so rollback is performed by publishing a corrected higher version rather than serving an older version number. If the signing key must be rotated, first ship a normally signed bridge release that trusts the replacement public key; only then switch the CI secrets. Losing the old key before that bridge is installed prevents automatic rotation for existing clients.
