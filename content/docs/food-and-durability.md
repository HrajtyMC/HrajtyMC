---
title: Food and durability
description: Create edible items, set hunger and saturation, and define durable items with the public API.
section: Gameplay
---

HrajtyMC **0.1.0-alpha.4** supports food and durability through immutable
`ItemDefinition` values. Register these items during `onInitialize` in a shared
`environment: "both"` mod. This guide uses Java 25 and only
`hrajtymc-api.jar`; no Minecraft classes are needed in your source.

## A complete food mod

Place this class at `src/main/java/example/FoodMod.java`:

```java
package example;

import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ItemDefinition;
import studio.hrajto.hrajtymc.api.ModContext;
import studio.hrajto.hrajtymc.api.item.FoodDefinition;

public final class FoodMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        ItemDefinition berry = new ItemDefinition(16)
            .withFood(new FoodDefinition(4, 0.3f, false));
        context.content().registerItem("example:berry", berry);
    }
}
```

Use this `src/main/resources/hrajty.mod.json`:

```json
{
  "schemaVersion": 1,
  "id": "example",
  "version": "1.0.0",
  "name": "Food Example",
  "description": "An edible berry using the HrajtyMC food API.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "example.FoodMod",
  "depends": {
    "minecraft": "26.3",
    "hrajtymc": ">=0.1.0-alpha.4"
  }
}
```

The item stacks to 16. Its normal vanilla eating behavior supplies nutrition 4
with saturation modifier 0.3. An ordinary food needs no item-use handler.

## Food settings

Import `studio.hrajto.hrajtymc.api.item.FoodDefinition`.

| Setting | Meaning and accepted values |
|---|---|
| `nutrition` | Hunger points restored by eating; an integer from 0 through 100. A full normal hunger bar is 20 points. |
| `saturationModifier` | A finite float from 0 through 10. Minecraft derives saturation gained as `nutrition * saturationModifier * 2`. This is a multiplier, not the final saturation amount. |
| `alwaysEdible` | `false` requires the usual hunger condition; `true` permits eating with a full hunger bar. It does not increase the maximum hunger level. |

`new FoodDefinition(4, 0.3f)` is shorthand for
`new FoodDefinition(4, 0.3f, false)`. There is no no-argument food constructor.
The record exposes `nutrition()`, `saturationModifier()` and `alwaysEdible()`.

For the example, the potential gain is **4 hunger points and 2.4 saturation**.
Minecraft caps hunger at 20 and saturation at the resulting hunger level, so
the actual gain can be smaller. Food does not directly set health or add a
custom status effect through this API.

The `f` suffix in `0.3f` makes the Java literal a float. Negative values,
out-of-range values, `Float.NaN` and infinite saturation modifiers are rejected
when the definition is constructed.

## Add appearance and a name

All paths below are relative to `src/main/resources/`.

Create `assets/example/items/berry.json`:

```json
{"model":{"type":"minecraft:model","model":"example:item/berry"}}
```

Create `assets/example/models/item/berry.json`:

```json
{"parent":"minecraft:item/generated","textures":{"layer0":"minecraft:item/sweet_berries"}}
```

This model references the game's existing sweet-berries texture. For your own
texture, change `layer0` to `example:item/berry` and add
`assets/example/textures/item/berry.png`. Supply both the modern item-definition
file and its model; a PNG alone does not define an item's appearance.

Create `assets/example/lang/en_us.json`:

```json
{"item.example.berry":"Example Berry"}
```

HrajtyMC mounts these resources automatically. See
[Items and blocks](../items-and-blocks/) for the complete resource conventions.

## Add a crafting recipe

Create `hrajtymc/recipes/berry.json`:

```json
{
  "format": 1,
  "crafting": {"combine": ["minecraft:apple", "minecraft:sugar"]},
  "output": {"item": "example:berry", "count": 1}
}
```

One apple and one sugar craft one berry. This is the HrajtyMC JSON structure;
do not put it in a vanilla `data/example/recipe/` directory or also register the
same recipe ID in Java. Read [JSON recipes](../json-recipes/) for shaped recipes,
validation and recipe-book discovery.

## Durability

Use `ItemDefinition.simple().withDurability(64)` to declare an item with 64
maximum damage. A positive durability automatically selects stack size 1.
This property alone does not turn the item into a pickaxe, weapon or armor
piece, and does not automatically damage it when your custom action runs.
An [item-use handler](../item-behaviors/) can apply `damageItem(1)` when the
action succeeds.

| Item API | Result |
|---|---|
| `new ItemDefinition()` or `ItemDefinition.simple()` | Stack size 64, durability 0, no food. |
| `new ItemDefinition(int maxStackSize)` | Stack size 1–64, durability 0, no food. |
| `new ItemDefinition(int maxStackSize, int durability, FoodDefinition food)` | Explicit settings; `food` may be `null`. Durability must be 0–1,000,000; positive durability requires stack size 1. |
| `withDurability(int value)` | A new definition with the requested durability; a positive value sets stack size 1. Setting 0 preserves the definition's current stack size. |
| `withFood(FoodDefinition value)` | A new definition with the supplied non-null food settings, preserving stack size and durability. |
| `maxStackSize()`, `durability()`, `food()` | Read the declaration; `food()` is `null` for a non-food item. |

Definitions are immutable. Retain the value returned by `withFood` or
`withDurability`; these methods do not modify an earlier value. Complete all
settings before registration, because the registry retains that definition.

For example, `new ItemDefinition(16).withFood(new FoodDefinition(4, 0.3f))`
keeps stack size 16. Calling `withDurability(64)` on that result creates a
non-stackable definition. A direct `new ItemDefinition(16, 64, null)` is invalid.

## Build and test

1. Build the project with the SDK template's `build.ps1` or `build.bat`.
2. Install the resulting JAR on an alpha.4 client and dedicated server, or test
   it in a singleplayer instance. Restart after changing the mod.
3. Open creative **Ingredients** or **Search** and find **Example Berry**.
   With command access, `/give @s example:berry 16` also supplies a stack.
4. In Survival, reduce hunger and eat a berry. Check that it consumes one item,
   restores hunger and keeps the remaining stack below the configured limit.
5. With `alwaysEdible=false`, check that a full hunger bar prevents eating.
   To test the other behavior, rebuild with `true` and restart the instance.
6. Craft an apple plus sugar and confirm the result is the same registered item.
7. Check texture and translation files if the icon or name is missing; check
   [Troubleshooting](../troubleshooting/) for loading or recipe errors.

If you later register a use handler on this food, its result controls whether
vanilla eating is reached on the server. `SUCCESS` handles the action; `PASS`
delegates to vanilla. Read [Item behaviors](../item-behaviors/) before combining
custom use and food. Eating duration, potion effects, tool materials and armor
attributes are not additional `FoodDefinition` settings in alpha.4.
