---
title: Items and blocks
description: Register content and supply its models, textures, names and block drops.
section: Mod development
---

Register content during your mod's `onInitialize` method. This example uses
`mymod` as the metadata ID and registers a crystal plus a solid crystal block.
Use `environment: "both"` for content mods.

```java
package com.example.mymod;

import studio.hrajto.hrajtymc.api.BlockDefinition;
import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ItemDefinition;
import studio.hrajto.hrajtymc.api.ModContext;

public final class ExampleMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        context.content().registerItem("mymod:crystal", new ItemDefinition(64));
        context.content().registerBlock("mymod:crystal_block",
                new BlockDefinition(3f, 6f, false));
    }
}
```

`registerBlock` also registers its matching block item. Do not register a second
item at `mymod:crystal_block`. Plain items appear in creative **Ingredients** and
blocks in **Building Blocks**; both are included in creative **Search**.

## Settings

| Definition | Settings |
|---|---|
| `ItemDefinition(int maxStackSize)` | Stack size from 1 to 64. Default constructor and `simple()` use 64. |
| `BlockDefinition(float hardness, float resistance, boolean requiresCorrectTool)` | Finite hardness of zero or more, or `-1` for unbreakable; finite non-negative resistance. Defaults are `3f`, `3f`, `false`. |

When a block requires a correct tool, supply the appropriate Minecraft mining
and tool tags for its intended behavior. Registration does not generate those
tags or a loot table for you.

## Item appearance

Under `src/main/resources`, add the item definition
`assets/mymod/items/crystal.json`:

```json
{"model":{"type":"minecraft:model","model":"mymod:item/crystal"}}
```

Add `assets/mymod/models/item/crystal.json`:

```json
{"parent":"minecraft:item/generated","textures":{"layer0":"mymod:item/crystal"}}
```

Supply a PNG at `assets/mymod/textures/item/crystal.png`. The first file is
required by Minecraft 26.3 in addition to the model.

## Block appearance

Add `assets/mymod/blockstates/crystal_block.json`:

```json
{"variants":{"":{"model":"mymod:block/crystal_block"}}}
```

Add `assets/mymod/models/block/crystal_block.json`:

```json
{"parent":"minecraft:block/cube_all","textures":{"all":"mymod:block/crystal_block"}}
```

Point the block item at that model in
`assets/mymod/items/crystal_block.json`:

```json
{"model":{"type":"minecraft:model","model":"mymod:block/crystal_block"}}
```

Supply `assets/mymod/textures/block/crystal_block.png`.

## Names and drops

Create `assets/mymod/lang/en_us.json`:

```json
{
  "item.mymod.crystal": "Crystal",
  "block.mymod.crystal_block": "Crystal Block"
}
```

To make the block drop itself, add
`data/mymod/loot_table/blocks/crystal_block.json`:

```json
{
  "type": "minecraft:block",
  "pools": [{
    "condition": {"type": "minecraft:survives_explosion"},
    "entries": [{"type": "minecraft:item", "name": "mymod:crystal_block"}],
    "rolls": 1
  }]
}
```

HrajtyMC mounts these resources automatically. Restart the game after rebuilding
the mod, and test placement, breaking and save/reload behavior in a test world.
Next, add [JSON crafting recipes](../json-recipes/) for your content.
