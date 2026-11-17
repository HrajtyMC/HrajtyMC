---
title: Install HrajtyMC
description: Add HrajtyMC to the Minecraft Launcher and install compatible mods.
section: Getting started
---

HrajtyMC `0.1.0-alpha.4` targets **Minecraft Java 26.3 on Windows**. Install a
64-bit Java 25 runtime before opening the installer. Mod authors need a JDK,
which also supplies the Java compiler.

## Run the installer

Get the installer from the [download page](/HrajtyMC/download/). Open the JAR
with Java, or run it in the folder containing the downloaded file:

```powershell
java --version
java -jar .\HrajtyMC-Installer-0.1.0-alpha.4.jar
```

If Windows opens the JAR as an archive, use the terminal command above. Java
25 or newer must be selected by the `java` command.

## Choose a release

The loader selector starts with the version bundled in the installer you opened.
An alpha.4 installer starts with alpha.4 selected, even if a newer GitHub release
exists. Loading the catalog does not automatically switch you to the latest
version.

You can choose another available release from the official GitHub catalog. Its
`hrajtymc-release.json` metadata determines the compatible Minecraft choices.
Selecting a loader release filters the Minecraft selector accordingly. Current
published support is **26.3**, without additional implied game versions.

If the catalog is unavailable, the bundled loader remains available. Installation
still needs internet access for Mojang metadata and missing Minecraft files;
installing another release also needs its release download. The bundled catalog
fallback is not a fully offline Minecraft installation mode.

## Install the client

1. Close the Minecraft Launcher.
2. Select **Client** in the HrajtyMC installer.
3. Keep the bundled HrajtyMC **0.1.0-alpha.4**, or choose another offered release,
   then select a compatible Minecraft version. Current support is **26.3**.
4. Choose your Minecraft installation folder. The usual Windows location is
   `%APPDATA%\.minecraft`.
5. Keep **Create launcher profile after installation** enabled.
6. Select **Install** and wait for the success message.
7. Open the official Minecraft Launcher and select **HrajtyMC 26.3**.

The HrajtyMC launcher profile has a green-and-white icon. The installer downloads
the vanilla client and metadata from Mojang and verifies their published SHA-1
checksums. The Minecraft Launcher supplies the remaining vanilla libraries and
assets. Sign in through your normal launcher; the installer does not request
Minecraft account credentials.

## Add mods

The profile uses its own game folder inside the selected installation:

```text
<Minecraft folder>\hrajtymc\
  mods\
  config\
  logs\
  saves\
```

Place **HrajtyMC-compatible `.jar` mods** in `hrajtymc\mods`, then restart the
game. Confirm them in the main menu's **Mods** screen. A shared content mod must
also be installed on the dedicated server you join.

## Command-line installation

```powershell
java -jar .\HrajtyMC-Installer-0.1.0-alpha.4.jar --client --directory "$env:APPDATA\.minecraft"
```

Add `--no-profile` if you want to manage the launcher profile yourself.
Reinstallation preserves existing mods, configuration and saved worlds. Other
launcher profiles are kept, and the profile file is backed up before merging.

The installer's **Check for updates** action checks for a newer installer.
Opening an offered download requires your explicit action, and you run the new
JAR yourself. The check does not replace the running installer or change its
selected installation target. See [Updating](../updating/) for details and the
runtime notification settings enabled by new alpha.4 installations.

Need a server? Follow [Dedicated server](../server/). If installation fails,
use [Troubleshooting](../troubleshooting/) before retrying.
