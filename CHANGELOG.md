# Changelog

## [0.2.3] - 2026-07-26

### Changed

- Published a signed patch release for end-to-end verification of the `v0.2.2` in-app updater.
- Kept the configuration format, CLI launch behavior, and updater trust key unchanged.

## [0.2.2] - 2026-07-26

### Added

- Added a signed in-app updater with download progress, package verification, installation, and application restart.
- Added automatic update support for Linux `.deb` and AppImage packages, Windows NSIS/MSI installers, and macOS application bundles.

### Changed

- Replaced the browser-only update action with an in-app “Download and install” flow while retaining the Release page as a fallback.
- Updated the release pipeline to publish signed updater artifacts and a multi-installer `latest.json` manifest.

## [0.2.1] - 2026-07-26

### Changed

- Replaced the application branding with a new scalable icon and regenerated Windows, macOS, and Linux icon assets.

## [0.2.0] - 2026-07-26

### Added

- Automatic GitHub Release checks with a clickable version and manual download entry.
- Native Linux ARM64 release builds alongside x64 packages.
- Search, theme switching, launch feedback, and improved empty states in the desktop UI.

### Changed

- Reworked the desktop interface with a lighter, more approachable visual design.
- Made `.deb` the recommended Ubuntu/Debian install path and documented architecture selection.
- Restored shell `PATH` values when launched from a desktop icon so user-installed CLI agents can be found.
- Added bilingual release download guidance and Linux.do acknowledgements.

### Fixed

- Linux release assets previously only targeted `amd64`, which could not run on ARM64 systems.
- Browser-downloaded AppImages now have explicit executable-permission guidance.

## [0.1.0] - 2026-07-26

- Initial public release.
