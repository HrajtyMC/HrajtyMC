---
title: API reference
description: Every public API type, constructor, method and constant supported in HrajtyMC alpha.4.
section: Reference
---

The public API is in `studio.hrajto.hrajtymc.api`, supplied as
`hrajtymc-api.jar` in the [SDK](/HrajtyMC/download/). Compile with Java 25 and keep
the API as a compile-time dependency; HrajtyMC provides it at runtime.

This reference covers all **32 public types** in the alpha.4 API. Package names
below are relative to `studio.hrajto.hrajtymc.api`; subpackages must be imported
explicitly. The linked guides contain complete entrypoints, resource files and
testing steps.

| Area | Types | Guide |
|---|---|---|
| Entrypoint and version | `HrajtyMod`, `ModContext`, `Environment`, `HrajtyApi`, `Experimental` | [First mod](../first-mod/) and [gameplay overview](../gameplay-api/) |
| Content and IDs | `ContentRegistry`, `ItemDefinition`, `BlockDefinition`, `ResourceId` | [Items and blocks](../items-and-blocks/) |
| Crafting | `ShapedRecipe`, `ShapelessRecipe` | [JSON recipes](../json-recipes/) |
| Food | `item.FoodDefinition` | [Food and durability](../food-and-durability/) |
| Item use | `item.ItemBehaviors`, `item.ItemUseHandler`, `item.UseContext`, `item.Hand`, `item.UseResult` | [Custom item use](../item-behaviors/) |
| Players and events | `game.PlayerRef`, `event.ModEvents`, `event.Subscription`, `event.ServerEvent`, `event.PlayerDeathEvent`, `event.BlockBreakEvent` | [Events and players](../events/) |
| Commands | `command.CommandRegistry`, `command.CommandHandler`, `command.CommandInvocation`, `command.CommandSource` | [Commands](../commands/) |
| Saved records | `data.ModData`, `data.DataView` | [Persistent data](../persistent-data/) |
| Play messages | `network.ModNetwork`, `network.ServerReceiver`, `network.ClientReceiver` | [Client/server messages](../play-networking/) |

## Version and experimental APIs

`HrajtyApi.VERSION` is a public static final `String`: `"0.1.0-alpha.4"` in this
API JAR. It identifies the library used at compile time, so do not use the
inlined constant to detect the version of a different running loader. Declare
the required loader version in [mod metadata](../mod-metadata/).

`@Experimental` marks the five gameplay service methods on `ModContext`. It is
a documented annotation for types and methods, retained in class files, and has
no parameters. Experimental signatures can change between alpha releases; mods
using these services require `"hrajtymc": ">=0.1.0-alpha.4"`.

`Environment` has `CLIENT` and `SERVER` values. It describes the physical process,
so singleplayer uses `CLIENT` while its integrated server executes logical-server
callbacks. Environment names in metadata are the separate `client`, `server`
and `both` strings.

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

Record accessors and convenience methods are:

| Type | Methods |
|---|---|
| `ItemDefinition` | `int maxStackSize()`, `int durability()`, `FoodDefinition food()`, `static ItemDefinition simple()`, `ItemDefinition withDurability(int value)`, `ItemDefinition withFood(FoodDefinition value)` |
| `item.FoodDefinition` | `int nutrition()`, `float saturationModifier()`, `boolean alwaysEdible()` |
| `BlockDefinition` | `float hardness()`, `float resistance()`, `boolean requiresCorrectTool()`, `static BlockDefinition simple()` |
| `ShapedRecipe` | `List<String> pattern()`, `Map<Character, String> ingredients()`, `String result()`, `int count()` |
| `ShapelessRecipe` | `List<String> ingredients()`, `String result()`, `int count()` |

`ItemDefinition()` and `simple()` mean `(64, 0, null)`. Durability accepts
0–1,000,000, with 0 meaning no durability. `food()` is nullable. The `with...`
methods return new records: keep or register their return values. Positive
`withDurability` sets stack size to 1; setting it back to 0 keeps the current
stack size. `withFood(null)` is rejected. See [Food and durability](../food-and-durability/)
for hunger, saturation, resource files and combining these settings.

## ResourceId

| Method | Purpose |
|---|---|
| `String requireValid(String id)` | Validate and return a lowercase namespaced ID. |
| `String namespace(String id)` | Validate the ID and return its namespace. |
| `String path(String id)` | Validate the ID and return its path. |

Empty path segments and `.` or `..` segments are rejected. Validation checks
syntax; it does not register or look up Minecraft content.

## PlayerRef

`game.PlayerRef` is a live player handle supplied by the game. Use it on the
appropriate game thread during a callback. Copy its UUID or name when retaining
an identifier; it is not a serializable player object.

| Method | Result |
|---|---|
| `UUID uuid()` | Player identity for player-scoped records. |
| `String name()` | Player name. |
| `boolean isClientSide()` | Logical side of the player's level, rather than the physical process. |
| `String dimension()` | Namespaced dimension ID. |
| `void sendMessage(String message)` | Send a literal text system message. |
| `boolean hasPermission(int level)` | Test a vanilla command permission level from 0 through 4; other values are errors. |

## Events

`event.ModEvents` has these registration methods. Each returns an
`event.Subscription` and takes a `java.util.function.Consumer` of the listed type.

| Registration | Listener type |
|---|---|
| `onServerStarting(Consumer<ServerEvent> listener)` | World-data session has opened and level loading begins. |
| `onServerStarted(Consumer<ServerEvent> listener)` | Successful server initialization. |
| `onServerStopping(Consumer<ServerEvent> listener)` | Normal shutdown begins. |
| `onServerStopped(Consumer<ServerEvent> listener)` | End of shutdown, before final mod-data flush and close. |
| `onServerTick(Consumer<ServerEvent> listener)` | End of a completed server tick. |
| `onPlayerJoin(Consumer<PlayerRef> listener)` | Player placed in the world with a ready connection. |
| `onPlayerQuit(Consumer<PlayerRef> listener)` | Before vanilla removes and saves the player. |
| `onPlayerDeath(Consumer<PlayerDeathEvent> listener)` | Immediately before vanilla death handling. |
| `beforeBlockBreak(Consumer<BlockBreakEvent> listener)` | Before vanilla break validation and mutation; cancellation is supported. |

Register during `onInitialize`. Listeners run synchronously in registration
order on the logical server thread. `Subscription` extends `AutoCloseable` and
has `void close()` without checked exceptions. Closing it repeatedly is safe;
it removes future deliveries. See [Events](../events/) for lifecycle order,
errors and a complete cancellation example.

### Event values

| Type | Public constructors and methods |
|---|---|
| `event.ServerEvent` | `ServerEvent(Path worldDirectory, long tick, boolean dedicated, int playerCount)`; `Path worldDirectory()`, `long tick()`, `boolean dedicated()`, `int playerCount()` |
| `event.PlayerDeathEvent` | `PlayerDeathEvent(PlayerRef player, String damageType)`; `PlayerRef player()`, `String damageType()` |
| `event.BlockBreakEvent` | `BlockBreakEvent(PlayerRef player, String blockId, String dimension, int x, int y, int z)`; `PlayerRef player()`, `String blockId()`, `String dimension()`, `int x()`, `int y()`, `int z()`, `boolean isCancelled()`, `void cancel()` |

The event constructors reject null required handles/fields; block and dimension
IDs are validated. The loader supplies these values for real callbacks; making
one yourself does not dispatch it. `cancel()` is monotonic and must be called
synchronously. Later listeners still observe the cancelled attempt. A permitted
attempt can still fail vanilla checks; it is not a successful-break notification.

## Commands

All types here are in `api.command`.

| Type | Public methods |
|---|---|
| `CommandRegistry` | `void register(String id, int permissionLevel, CommandHandler handler)`; `void register(String id, CommandHandler handler)` (level 0) |
| `CommandHandler` | `int execute(CommandInvocation invocation) throws Exception` |
| `CommandSource` | `String name()`, `Optional<PlayerRef> player()`, `boolean hasPermission(int level)`, `void reply(String text)`, `void error(String text)` |

`CommandInvocation(CommandSource source, List<String> arguments, String rawArguments)`
provides `CommandSource source()`, `List<String> arguments()` and
`String rawArguments()`. It rejects null values and copies the argument list.

Register mod-owned namespaced literals during initialization. Command paths
cannot contain `/`. Permission levels are 0–4. Handlers normally return 1 for
success or 0 for failure. A source can be a console or command block, so account
for an empty `player()`. Both single- and double-quoted words and escaped quotes follow
Brigadier rules; `rawArguments()` preserves the argument text. See
[Commands and permissions](../commands/) for parsing, reloads and errors.

## Persistent data

`data.ModData` selects records inside this mod's active server-world save.

| Method | Result |
|---|---|
| `DataView world()` | One record for this mod across dimensions of the current save. |
| `DataView player(UUID playerId)` | Record for this player UUID in this save. |
| `void save()` | Flush this mod's loaded changed records on the logical server thread. |

`data.DataView` exposes the complete typed record interface:

| Read | Write |
|---|---|
| `String getString(String key, String fallback)` | `void putString(String key, String value)` |
| `long getLong(String key, long fallback)` | `void putLong(String key, long value)` |
| `double getDouble(String key, double fallback)` | `void putDouble(String key, double value)` |
| `boolean getBoolean(String key, boolean fallback)` | `void putBoolean(String key, boolean value)` |

It also has `boolean contains(String key)`, `void remove(String key)` and
`Set<String> keys()`. The key set is an immutable snapshot. A fallback applies to
missing keys; an existing value of another type is an error.

Limits: 256 keys per record, 1–64 letters/digits/dots/underscores/hyphens per key,
16,384 Java string code units per value, finite doubles and 1 MiB of encoded
record data. Null stored strings are rejected. Obtain the facade during init,
but open records only while the world session is active on its server thread.
Records save during server saves and shutdown; stale views do not transfer to
another world. See [Persistent data](../persistent-data/) for paths, file format
and atomic writes.

## Play networking

All types here are in `api.network`.

| Type/member | Contract |
|---|---|
| `ModNetwork.MAX_PAYLOAD_BYTES` | Public `int` constant, 32,768 bytes. |
| `ModNetwork.MAX_PACKETS_PER_SECOND` | Public `int` constant, 128 received messages per connection across channels; the pending callback bound is also 128. |
| `void registerServerReceiver(String channel, ServerReceiver receiver)` | Declare a client-to-server receiver. |
| `void registerClientReceiver(String channel, ClientReceiver receiver)` | Declare a server-to-client receiver. |
| `void sendToServer(String channel, byte[] payload)` | Send from a connected physical client to its negotiated server. |
| `void sendToPlayer(PlayerRef player, String channel, byte[] payload)` | Send to a live server-side player supplied by the game. |
| `ServerReceiver.receive(PlayerRef sender, byte[] payload) throws Exception` | `void` callback on the logical server thread; sender comes from the connection. |
| `ClientReceiver.receive(byte[] payload) throws Exception` | `void` callback on the client game thread. |

The facade requires `environment: "both"`. Register the same directions on both
physical sides during init, using this mod's namespaced channel IDs (at most 256
characters). One receiver per direction is allowed for a channel. Arrays are
copied. Sends require declared directions, completed initialization and a
negotiated connection. Actual player handles cannot be replaced with a fabricated
implementation. Delivery is scheduled and can be dropped after disconnect.

Malformed/unknown/wrong-direction messages, exceeded receive limits, a failed
receiver or an unavailable receiving executor disconnect the affected connection.
Receiver exceptions are logged with their channel. See
[Client/server messages](../play-networking/) for full send and receive examples.

## Item use

All types here are in `api.item`.

| Type | Public method or values |
|---|---|
| `ItemBehaviors` | `void onUse(String itemId, ItemUseHandler handler)` |
| `ItemUseHandler` | `UseResult use(UseContext context)` |
| `Hand` | `MAIN`, `OFF` |
| `UseResult` | `PASS` (vanilla fallthrough), `SUCCESS` (consume the interaction), `FAIL` (reject the interaction) |

`UseContext` is live only during the logical-server callback:

| Method | Meaning |
|---|---|
| `PlayerRef player()` | Acting player. |
| `String itemId()` | Registered item ID. |
| `Hand hand()` | Which hand is being used. |
| `int count()` | Current held stack count. |
| `int damage()` | Current damage value. |
| `void damageItem(int amount)` | Apply vanilla durability damage, from 0 to 1,000,000; the item may break. |
| `void consume(int amount)` | Consume from 0 through the current stack count, respecting creative-mode inventory. |
| `void cooldown(int ticks)` | Set a cooldown of 0–72,000 ticks. |

Register one handler for an owned, registered item during init. This hook is
for use in air; it does not add a general block-use or attack callback. A logical
client predicts success without executing the handler. The server checks its
thread and cooldown before calling it. Return a non-null `UseResult`; a runtime
failure is reported as an item-handler error. Do not retain the context or use it
after replacing the held stack. See [Custom item use](../item-behaviors/) for
safe ordering around item breakage and vanilla food fallthrough.

Records also provide Java's generated `equals`, `hashCode` and `toString` methods;
enums provide standard `values()` and `valueOf(String)` methods. The tables above
list the API-specific public surface.

## Current scope

This release supports registered items and cube blocks, JSON crafting recipes,
the gameplay services above, food and durability. Full tool/armor materials,
entity registration, world generation, dimensions, custom machine screens,
block entities and a general transformation API remain future work. Start with
[Your first mod](../first-mod/) for packaging and a complete buildable entrypoint.
