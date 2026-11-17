---
title: Troubleshooting
description: Resolve installation, mod-loading, rendering and crafting problems.
section: Reference
---

Start by checking the versions involved: **HrajtyMC 0.1.0-alpha.2**, **Minecraft
Java 26.3**, **Windows**, and **64-bit Java 25** are this release's target.

## The installer JAR does not open

Run it from a terminal to see the error:

```powershell
java --version
java -jar .\HrajtyMC-Installer-0.1.0-alpha.2.jar
```

If another application opens the JAR, use the command above. Ensure the terminal
selects Java 25 or newer. For mod builds, `javac -version` must also report a
suitable JDK.

## The launcher profile is missing

Close the Minecraft Launcher, rerun the installer with profile creation enabled,
and select the launcher's actual Minecraft folder. The profile is named
**HrajtyMC 26.3**. See [Installation](../installation/) for the complete steps.

## A mod does not appear or loading stops

Check the correct folder: clients use `<Minecraft folder>\hrajtymc\mods`, while
servers use `<server folder>\mods`. Restart the process after adding or replacing
a mod. Use HrajtyMC-compatible JARs rather than mods built for another loader.

For authors, ensure the JAR contains `hrajty.mod.json` at its root and the
entrypoint matches the packaged Java class. Check the declared Minecraft,
HrajtyMC and mod dependencies. Duplicate mod IDs, dependency cycles and failed
initialization are errors, rather than reasons to silently skip content.

Read `logs/hrajtymc.log` and the Minecraft log for the named mod and underlying
error. Include the loader, game and mod versions plus the relevant exception
when reporting a problem.

## An item has a missing texture or name

Check the namespace and spelling in its resource paths. Minecraft 26.3 needs an
item definition under `assets/<namespace>/items/`, a model, the referenced PNG,
and an appropriate translation key. Blocks also need a blockstate file and a
block-item definition. Follow [Items and blocks](../items-and-blocks/), rebuild
the JAR and restart the game.

## A crafting recipe does not work

- Use a **3x3 crafting table** for a nine-item recipe. It cannot fit in the
  player's 2x2 grid.
- Use `0.1.0-alpha.2` or newer for HrajtyMC recipe JSON and the Create World pack
  discovery fix. Restart after updating the loader or mod JAR.
- For authors, verify `hrajtymc/recipes/<path>.json`, `format: 1`, exact item IDs,
  and either `layout` with `using` or `combine`. Avoid duplicate recipe IDs.
- Separate a missing crafting result from a recipe-book discovery issue. Obtaining
  an ingredient can unlock a generated recipe; a world's existing discovery and
  limited-crafting settings still apply.

The server or integrated server loads the crafting data. Inspect its log for
unknown item references, invalid JSON or data-pack errors. See
[JSON recipes](../json-recipes/) for the exact format.

## A fresh server stops immediately

Read its log, check Java 25 and review `eula.txt`. The installer leaves a new EULA
file set to `false`; accept it yourself only if you agree. Also match shared mod
versions with the connecting clients. Follow [Dedicated server](../server/).

## No update notification appears

An empty `updates.url` is unconfigured, and the original alpha.2 installer leaves
it empty. Follow [Updating](../updating/) to add the public feed. Equal versions
do not produce a notification, and network failures are logged without blocking
the game.
