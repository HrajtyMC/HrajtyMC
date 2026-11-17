---
title: API reference
description: The supported Java interfaces and immutable content definitions.
section: Reference
---

The public API is in `studio.hrajto.hrajtymc.api`, supplied as
`hrajtymc-api.jar` in the [SDK](/HrajtyMC/download/). Compile with Java 25 and keep
the API as a compile-time dependency; HrajtyMC provides it at runtime.

## Entrypoint

```java
public interface HrajtyMod {
    void onInitialize(ModContext context) throws Exception;
}
```

The class named in [mod metadata](../mod-metadata/) implements this interface
and has a public no-argument constructor. Initialization runs once while content
registration is open. An initialization failure is reported as a mod-loading
error.

## ModContext

| Method | Result |
|---|---|
| `String modId()` | Current metadata mod ID. |
| `Path gameDirectory()` | Game or server instance directory. |
| `Environment environment()` | `CLIENT` or `SERVER`; singleplayer uses `CLIENT`. |
| `ContentRegistry content()` | Registration interface for the current mod. |
| `ModEvents events()` | Server lifecycle/player events and cancellable block-break attempts. |
| `CommandRegistry commands()` | Namespaced Brigadier server commands. |
| `ModData data()` | Typed, mod-private records in the active server world. |
| `ModNetwork network()` | Declared C2S/S2C messages for a shared mod. |
| `ItemBehaviors itemBehaviors()` | Server-authoritative item-use callbacks. |
| `Logger logger()` | A `java.util.logging.Logger` for diagnostics. |

The five gameplay services are experimental in **0.1.0-alpha.4**; see the
[Gameplay API guide](../gameplay-api/) for complete examples, lifecycle and
thread rules. Obtain their facades during initialization. Registration freezes
after initialization; world data is accessed later from server callbacks.
`environment()` is the physical side, so a singleplayer client also has logical
server callbacks.

## ContentRegistry

```java
void registerItem(String id, ItemDefinition definition);
void registerBlock(String id, BlockDefinition definition);
void registerShapedRecipe(String id, ShapedRecipe definition);
void registerShapelessRecipe(String id, ShapelessRecipe definition);
```

Call these during `onInitialize`. Registration IDs must belong to the current
mod's namespace. A block creates a matching block item at the same ID. Duplicate
registrations are errors, and registration is closed after initialization and
recipe-file loading. Only mods declared as `environment: "both"` may register
this shared content.

Prefer [JSON recipes](../json-recipes/) for ordinary crafting definitions. Java
recipes remain available when definitions need to be generated in code. Both
routes share the same recipe-ID namespace.

## Definition records

| Type | Constructor and rules |
|---|---|
| `ItemDefinition` | `(int maxStackSize)`, from 1 to 64, or `(int maxStackSize, int durability, FoodDefinition food)`. No-argument constructor and `simple()` use 64. `withDurability(int)` returns a non-stackable durable definition; `withFood(FoodDefinition)` returns a food definition. Positive durability requires stack size 1. |
| `FoodDefinition` | In `api.item`: `(int nutrition, float saturationModifier, boolean alwaysEdible)`. Nutrition 0–100, finite saturation modifier 0–10. The two-argument constructor uses `alwaysEdible=false`. |
| `BlockDefinition` | `(float hardness, float resistance, boolean requiresCorrectTool)`. Hardness is finite and non-negative, or `-1`; resistance is finite and non-negative. No-argument constructor and `simple()` use `(3f, 3f, false)`. |
| `ShapedRecipe` | `(List<String> pattern, Map<Character, String> ingredients, String result, int count)`. Rectangular 1–3 by 1–3 pattern, exact matching non-space symbols, namespaced item IDs and result count 1–64. |
| `ShapelessRecipe` | `(List<String> ingredients, String result, int count)`. Between 1 and 9 ingredient slots, namespaced item IDs and result count 1–64. |

The recipe records copy their collections into immutable values and validate
their shape. Item references are resolved by Minecraft when loading the generated
recipe data.

## ResourceId

| Method | Purpose |
|---|---|
| `String requireValid(String id)` | Validate and return a lowercase namespaced ID. |
| `String namespace(String id)` | Validate the ID and return its namespace. |
| `String path(String id)` | Validate the ID and return its path. |

Empty path segments and `.` or `..` segments are rejected. Validation checks
syntax; it does not register or look up Minecraft content.

## Gameplay types

All package names below begin with `studio.hrajto.hrajtymc.api`.

| Package/types | Supported surface |
|---|---|
| `game.PlayerRef` | UUID, name, logical side, dimension, text messages and permission checks; no Minecraft object is exposed. |
| `event.ModEvents`, `Subscription` | Starting/started/stopping/stopped, server tick, player join/quit/death, before-block-break; registration-order server callbacks and removable subscriptions. |
| `event.ServerEvent`, `PlayerDeathEvent`, `BlockBreakEvent` | Lifecycle snapshots, death notification and monotonic break-attempt cancellation. |
| `command.CommandRegistry`, `CommandHandler` | `register(id, permissionLevel, handler)`, with vanilla permission levels 0–4. |
| `command.CommandInvocation`, `CommandSource` | Immutable parsed/raw arguments, optional player source and success/error replies. |
| `data.ModData`, `DataView` | `world()`, `player(UUID)`, `save()`; typed string/long/double/boolean records confined to the active world's server thread. |
| `network.ModNetwork`, `ServerReceiver`, `ClientReceiver` | Init-time receivers and client/server sends; 32,768-byte payloads, 128 messages per second and 128 pending per connection, matching protocol-2 peers. |
| `item.ItemBehaviors`, `ItemUseHandler` | One server-side use-in-air handler per owned registered item. |
| `item.UseContext`, `Hand`, `UseResult` | Live interaction, damage/consume/cooldown, `MAIN`/`OFF`, and `PASS`/`SUCCESS`/`FAIL` vanilla behavior. |

Use the [Gameplay API guide](../gameplay-api/) for availability, persistence,
network direction/identity checks and the Ruby Example 1.1.0 walkthrough. Declare
`"hrajtymc": ">=0.1.0-alpha.4"` when using these types.

## Current scope

This release supports registered items and cube blocks, JSON crafting recipes,
the gameplay services above, food and durability. Full tool/armor materials,
entity registration, world generation, dimensions, custom machine screens,
block entities and a general transformation API remain future work. Start with
[Your first mod](../first-mod/) for packaging and a complete buildable entrypoint.
