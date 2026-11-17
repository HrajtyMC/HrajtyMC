---
title: Dedicated server
description: Install and run a Windows server with the same HrajtyMC installer.
section: Getting started
---

Use the HrajtyMC installer for both players and dedicated servers. This release
targets **Minecraft Java 26.3**, **Windows** and **64-bit Java 25**.

## Install

1. Download the installer from the [download page](/HrajtyMC/download/).
2. Open it with Java and select **Server**.
3. Choose a dedicated server folder, separate from your client game folder.
4. Select **Install** and wait for completion.
5. Read the Minecraft EULA linked in the generated `eula.txt`. If you agree, set
   `eula=true` yourself.
6. Put compatible mods into the server's `mods` folder.
7. Run `start.bat`.

The installer leaves a new EULA file set to `false` and preserves an existing
file. The server stops before starting a world until you accept the EULA.

## Server files

```text
minecraft-server-26.3.jar
hrajtymc-loader.jar
start.bat
eula.txt
HrajtyMC-server-README.txt
mods\
config\
logs\
```

The vanilla server download is verified against Mojang's published checksum.
`start.bat` selects Java from `JAVA_HOME` when set, otherwise from `PATH`, checks
the runtime version, and launches Minecraft with the HrajtyMC agent. Its default
maximum heap is 2 GB; adjust the `-Xmx2G` argument if your server needs more memory.

## Match the client and server

Shared content mods use `environment: "both"`. Install the same shared mod
versions on the server and its clients. Client-only mods belong on players'
machines; server-only mods belong on the dedicated server.

The current public content API allows item, block and recipe registration only
from shared mods. See [mod metadata](../mod-metadata/) for environment rules.

## Command-line installation

```powershell
java -jar .\HrajtyMC-Installer-0.1.0-alpha.2.jar --server --directory "C:\Games\HrajtyMC-Server"
```

Run the installer again to update server files. Existing worlds, mods,
configuration and EULA choices are preserved; the generated `start.bat` is
replaced, so keep a copy if you customize it.

See [Updating](../updating/) for release changes and
[Troubleshooting](../troubleshooting/) for startup or mod errors.
