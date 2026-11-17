---
title: Documentation overview
description: Install HrajtyMC or start building your first Java content mod.
section: Getting started
---

HrajtyMC is a Minecraft Java mod loader and content API by **Hrajto Studio**.
Mods use Java for initialization and content registration, with HrajtyMC JSON
files for crafting recipes.

## Supported release

| Component | Target |
|---|---|
| HrajtyMC | `0.1.0-alpha.3` |
| Minecraft Java Edition | `26.3` |
| Operating system | Windows |
| Runtime | 64-bit Java 25 |
| Mod development | Java 25 JDK and the public API JAR |

This is an alpha release. Its current public API covers plain items, solid cube
blocks, and shaped or shapeless crafting recipes. Test mods in a separate game
instance before using them with an existing world.

## For players

Start with [client installation](../installation/), or use the same installer to
[set up a dedicated server](../server/). Add compatible mod JARs to the instance's
`mods` folder, then restart the game. The **Mods** screen shows each loaded mod's
name, version, author and description.

The installer selects its own bundled version by default. You can choose another
offered GitHub release; Minecraft choices are filtered to that release's actual
compatibility. Updates remain manual. Read [Updating](../updating/) for the
installer check and in-game notifications.

The Ruby Example adds a ruby, a ruby block and reversible crafting recipes. Find
rubies in the creative **Ingredients** tab and blocks in **Building Blocks**;
both also appear in creative **Search**. Nine rubies need a 3x3 crafting table.

## For mod authors

Download the SDK and follow [Your first mod](../first-mod/). The SDK includes the
public API JAR, a Java template, examples and documentation. You do not need the
loader implementation or a private source checkout to develop a mod.

Next, learn about [items and blocks](../items-and-blocks/),
[JSON recipes](../json-recipes/) and [mod metadata](../mod-metadata/).
The [API reference](../api-reference/) describes the supported Java types.

HrajtyMC loads its own mod format. Existing mods written for a different loader
need a HrajtyMC-compatible implementation. Additional gameplay APIs, such as mob
registration, world generation, custom screens and block entities, are outside
this release's public content API.

[Download HrajtyMC and the SDK](/HrajtyMC/download/) ·
[Troubleshooting](../troubleshooting/) · [Updating](../updating/)
