---
title: Updating HrajtyMC
description: Install new releases manually and configure optional update notifications.
section: Getting started
---

HrajtyMC updates are **manual**. Download a newer installer from the
[download page](/HrajtyMC/download/) and run it against the same client or server
installation folder.

## Version selection and installer checks

An alpha.3 installer opens with its own bundled release selected. Its GitHub
catalog can offer other releases, using their `hrajtymc-release.json` metadata.
Choosing one filters the Minecraft choices to that release's compatibility.
Current supported Minecraft compatibility is **26.3**.

Catalog loading does not automatically select the latest release. If the catalog
is unavailable, the bundled choice remains available, although installation still
needs Mojang metadata and missing game files from the internet.

Choose **Check for updates** to check the running installer's version. An equal
or older available version reports **Up to date**, without repeatedly offering
the same download. A newer release offers a download action; you explicitly
choose it, then run the downloaded JAR yourself.

Checking or opening a download does not replace the running installer or change
its selected loader target. Selecting an older loader release also does not make
the running installer itself older; the update check and installation target are
separate choices.

## Install an update

1. Stop Minecraft or the server. Close the Minecraft Launcher for a client update.
2. Keep a backup of important worlds and any customized server startup script.
3. Run the newer installer and select the same installation mode and folder.
4. Check that your mods support the selected HrajtyMC and Minecraft versions.
5. Start the updated profile or server.

The installer preserves existing worlds, mods and configuration. It merges its
own launcher profile while keeping other profiles, and preserves an existing
server EULA choice. The server's generated `start.bat` is replaced during
reinstallation.

## Runtime release notifications

New installations made by alpha.3 enable notifications using this site's public
feed. The original alpha.2 installer left `updates.url` empty; an alpha.3 upgrade
migrates an empty default URL to the official feed. A custom URL and an explicit
`updates.enabled=false` setting are preserved.

The instance's `config/hrajtymc.properties` contains these default settings:

```properties
updates.enabled=true
updates.url=https://hrajtymc.github.io/HrajtyMC/updates.json
```

Restart the game after changing these settings. When the feed reports a newer
version, HrajtyMC displays a notification; you still download and run the new
installer yourself. Equal or older versions do not trigger an update notice.
An empty URL leaves release checking unconfigured. Set `updates.enabled=false`
to disable the check and keep it disabled across installer upgrades. An empty
default URL can be filled by a later installer migration, so use the explicit
enabled setting to record that preference.

The checker does not download installers, replace JARs, restart the game or run
update commands. A failed or offline check is logged and leaves the installed
game usable.

## Release-feed format

The feed is a JSON object with a version string:

```json
{"version":"0.1.0-alpha.3"}
```

Versions use three numeric components and may include a prerelease or build
suffix. Build metadata does not affect ordering; a stable `0.1.0` is newer than
`0.1.0-alpha.3`. Public feeds must use HTTPS.

Need installation details? Read [Install HrajtyMC](../installation/) or
[Dedicated server](../server/).
