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
| HrajtyMC | `0.1.0-alpha.4` |
| Minecraft Java Edition | `26.3` |
| Operating system | Windows |
| Runtime | 64-bit Java 25 |
| Mod development | Java 25 JDK and the public API JAR |

This alpha release supports items, solid blocks and crafting recipes, plus
experimental gameplay services for events, commands, persistent world/player
data, custom item use and client/server messages. Test mods in a separate game
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

Ruby Example 1.1.0 adds a ruby, a Ruby Block, a durable Ruby Charm and a Ruby Snack.
It also demonstrates `/ruby:stats`, `/ruby:ping` and operator-only
`/ruby:protect on|off`. Find items in **Ingredients** and blocks in **Building
Blocks**, or use creative **Search**. Its four crafting recipes use HrajtyMC JSON.

## For mod authors

Download the SDK and follow [Your first mod](../first-mod/). The SDK includes the
public API JAR, a Java template, examples and documentation. You do not need the
loader implementation or a private source checkout to develop a mod.

Next, learn about [items and blocks](../items-and-blocks/),
[JSON recipes](../json-recipes/) and [mod metadata](../mod-metadata/).
The [gameplay guide](../gameplay-api/) explains the new services, and the
[API reference](../api-reference/) describes the supported Java types. The SDK
includes buildable Ruby Example source under `examples/ruby/`.

Start with a focused tutorial for [food and durability](../food-and-durability/),
[custom item use](../item-behaviors/), [events](../events/),
[commands and permissions](../commands/), [persistent data](../persistent-data/)
or [client/server messages](../play-networking/). Each includes a complete Java
entrypoint and its required metadata. The [API reference](../api-reference/)
covers all 32 public types in this release.

HrajtyMC loads its own mod format. Existing mods written for a different loader
need a HrajtyMC-compatible implementation. Additional gameplay APIs, such as mob
registration, world generation, custom screens and block entities, are outside
this release's public content API.

[Download HrajtyMC and the SDK](/HrajtyMC/download/) ·
[Troubleshooting](../troubleshooting/) · [Updating](../updating/)
