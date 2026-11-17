---
title: Updating HrajtyMC
description: Install new releases manually and configure optional update notifications.
section: Getting started
---

HrajtyMC updates are **manual**. Download a newer installer from the
[download page](/HrajtyMC/download/) and run it against the same client or server
installation folder.

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

## Optional release notifications

The original `0.1.0-alpha.2` installer creates an empty `updates.url`. Publishing
this website does not change an already installed configuration.

To use this site's release feed, edit the instance's
`config/hrajtymc.properties`:

```properties
updates.enabled=true
updates.url=https://hrajtymc.github.io/HrajtyMC/updates.json
```

Restart the game after changing these settings. When the feed reports a newer
version, HrajtyMC displays a notification; you still download and run the new
installer yourself. Equal or older versions do not trigger an update notice.
An empty URL leaves release checking unconfigured. Set `updates.enabled=false`
to disable the check.

The checker does not download installers, replace JARs, restart the game or run
update commands. A failed or offline check is logged and leaves the installed
game usable.

## Release-feed format

The feed is a JSON object with a version string:

```json
{"version":"0.1.0-alpha.2"}
```

Versions use three numeric components and may include a prerelease or build
suffix. Build metadata does not affect ordering; a stable `0.1.0` is newer than
`0.1.0-alpha.2`. Public feeds must use HTTPS.

Need installation details? Read [Install HrajtyMC](../installation/) or
[Dedicated server](../server/).
