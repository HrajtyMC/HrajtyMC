---
title: Gameplay API
description: Events, commands, persistent records, play networking and item behaviors in alpha.4.
section: Mod development
---

HrajtyMC **0.1.0-alpha.4** adds experimental gameplay services for events,
commands, persistent world/player data, play messages and item-use behavior.
Compile with Java 25 against `hrajtymc-api.jar`; these examples need no Minecraft
classes or private loader source. Declare the alpha minimum explicitly:

```json
{
  "depends": {
    "minecraft": "26.3",
    "hrajtymc": ">=0.1.0-alpha.4"
  }
}
```

Use a shared `"environment": "both"` mod for content and networking. This API is
experimental: require the version you develop against and check the changelog
before upgrading. It currently targets Minecraft Java 26.3.

## Initialization and game threads

Register content, event listeners, commands, network receivers and item handlers
inside `onInitialize`. Registrations freeze after all mod initializers and JSON
recipes have loaded. Duplicate declarations and another mod's namespace are
errors. A retained service facade may be used later; registering new handlers
after initialization is not supported.

`context.environment()` describes the physical process. It is `CLIENT` in
singleplayer even while the integrated server runs. Server events, commands,
server network receivers and item-use handlers run on the **logical server
thread** in both singleplayer and a dedicated server. Client network receivers
run on the client game thread. World data is available only on its owning server
thread; a client network callback cannot read it.

## An API-only example

This complete entrypoint demonstrates all five services. Use metadata ID
`example`, point `entrypoint` at `example.GameplayMod`, and supply the usual item
assets and recipe JSON separately.

```java
package example;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ItemDefinition;
import studio.hrajto.hrajtymc.api.ModContext;
import studio.hrajto.hrajtymc.api.item.FoodDefinition;
import studio.hrajto.hrajtymc.api.item.UseResult;

public final class GameplayMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        context.content().registerItem("example:charm",
            ItemDefinition.simple().withDurability(64));
        context.content().registerItem("example:snack",
            ItemDefinition.simple().withFood(new FoodDefinition(6, 0.6f)));

        var data = context.data();
        var network = context.network();
        byte[] ping = "ping".getBytes(StandardCharsets.UTF_8);
        byte[] pong = "pong".getBytes(StandardCharsets.UTF_8);

        // Declare these on both physical sides. Callbacks use only the API.
        network.registerClientReceiver("example:ping", bytes -> {
            if (Arrays.equals(bytes, ping)) {
                network.sendToServer("example:pong", pong);
            }
        });
        network.registerServerReceiver("example:pong", (sender, bytes) -> {
            if (!Arrays.equals(bytes, pong)) return;
            var player = data.player(sender.uuid());
            player.putLong("replies", player.getLong("replies", 0) + 1);
            sender.sendMessage("Client/server round trip completed.");
        });

        context.events().onPlayerJoin(player -> {
            var record = data.player(player.uuid());
            record.putLong("joins", record.getLong("joins", 0) + 1);
        });

        context.commands().register("example:stats", 0, invocation -> {
            if (!invocation.arguments().isEmpty()
                    || invocation.source().player().isEmpty()) {
                invocation.source().error("Usage: /example:stats (player only)");
                return 0;
            }
            var player = invocation.source().player().orElseThrow();
            var record = data.player(player.uuid());
            invocation.source().reply("Joins: " + record.getLong("joins", 0)
                + ", charm uses: " + record.getLong("uses", 0));
            return 1;
        });

        context.itemBehaviors().onUse("example:charm", use -> {
            var player = use.player();
            var record = data.player(player.uuid());
            record.putLong("uses", record.getLong("uses", 0) + 1);
            use.cooldown(20);
            network.sendToPlayer(player, "example:ping", ping);
            use.damageItem(1);
            return UseResult.SUCCESS;
        });
    }
}
```

No custom payload is trusted simply because it passed the transport checks. The
server receiver validates the expected bytes and uses the connection's actual
sender. Check permissions and application-specific values before changing game
state in a real mod.

## Server events

`context.events()` returns `ModEvents`. Listeners run synchronously in
registration order. Each registration returns a `Subscription`; calling `close()`
is idempotent and prevents subsequent deliveries to that listener.

| Registration | Callback value and timing |
|---|---|
| `onServerStarting` | `ServerEvent` when level loading begins, after this world's data session opens. |
| `onServerStarted` | `ServerEvent` after successful server initialization. |
| `onServerStopping` | `ServerEvent` when normal server shutdown begins. |
| `onServerStopped` | `ServerEvent` at the end of shutdown, before the final mod-data flush and session close. |
| `onServerTick` | `ServerEvent` after a completed server tick. |
| `onPlayerJoin` | `PlayerRef` after the player enters the world and its connection is ready. |
| `onPlayerQuit` | `PlayerRef` before vanilla removes and saves the player. |
| `onPlayerDeath` | `PlayerDeathEvent` immediately before vanilla death handling; includes `player()` and `damageType()`. |
| `beforeBlockBreak` | Cancellable `BlockBreakEvent` before vanilla validates and performs a break attempt. |

`ServerEvent` exposes `worldDirectory()`, `tick()`, `dedicated()` and
`playerCount()`. `PlayerRef` exposes `uuid()`, `name()`, `isClientSide()`,
`dimension()`, `sendMessage(String)` and `hasPermission(int)` without exposing a
Minecraft player object.

For example, register protection during initialization:

```java
context.events().beforeBlockBreak(event -> {
    if (event.blockId().equals("minecraft:diamond_block")
            && !event.player().hasPermission(2)) {
        event.cancel();
        event.player().sendMessage("An operator must break this block.");
    }
});
```

The event also includes the dimension and `x()`, `y()`, `z()` coordinates.
Cancellation is monotonic: later listeners still see the cancelled event and
cannot reverse it. A break attempt may subsequently fail vanilla checks even
when no mod cancels it, so this event is not an after-break reward hook. Listener
failures are logged with the owning mod; a failed break listener cancels that
attempt. Other notification-listener failures do not stop later listeners.

## Commands

`context.commands()` returns `CommandRegistry`. Register a namespaced literal
with `register(String id, int permissionLevel, CommandHandler handler)`. The
overload without a level uses 0. Levels range from 0 through 4, and vanilla
permission checks apply to players, console, command blocks and other sources.
Only your mod's namespace is allowed; command names cannot contain slashes.
Commands are attached to the vanilla Brigadier dispatcher and restored during
resource reloads.

Handlers receive an immutable `CommandInvocation`:

- `source()` has `name()`, optional `player()`, `hasPermission(int)`, `reply(String)`
  and `error(String)`.
- `arguments()` contains parsed words. `/example:say "hello world"` supplies one
  argument containing `hello world`; quoted strings use Brigadier escaping.
- `rawArguments()` retains the argument text, including quotes and spacing.

Check argument counts and account for non-player sources. Return 1 for ordinary
success and 0 for ordinary failure. A handler exception is logged with the mod
and command and reported as a command failure.

```java
context.commands().register("example:say", 2, invocation -> {
    if (invocation.arguments().size() != 1) {
        invocation.source().error("Usage: /example:say \"message\"");
        return 0;
    }
    invocation.source().reply(invocation.arguments().getFirst());
    return 1;
});
```

## Persistent world and player records

Obtain `context.data()` during initialization, then call `world()` or
`player(UUID)` from a server callback once level loading has opened the data
session. `onServerStarting` through `onServerStopped` callbacks have an active
session; `onServerStarted` is the usual place for world initialization.
Do not open records inside `onInitialize`, from a background/client thread, or
after that world stops. Retained `DataView` handles belong to one world session
and become invalid when it closes.

`world()` is shared by the mod across dimensions in the current save.
`player(UUID)` is scoped to that UUID in the same save; it is not global data for
the account across different worlds. Data is isolated by mod ID under the save's
`hrajtymc-data/<mod-id>/` directory, with `world.json` and
`players/<uuid>.json` records.

`DataView` provides typed `getString`, `getLong`, `getDouble` and `getBoolean`
methods with a fallback for missing keys, matching `put...` methods, and
`contains`, `remove`, `keys`. Reading an existing key through the wrong type is
an error. Doubles must be finite; values are primitives rather than arbitrary
Java objects. Keys contain 1–64 letters, digits, dots, underscores or hyphens.
Each record supports at most 256 keys, strings up to 16,384 characters and an
encoded size of 1 MiB.

Changed records flush during normal server saves and shutdown. `data.save()`
forces a save of this mod's loaded records on the server thread; use it at a
meaningful checkpoint rather than every tick. Writes use a temporary file and
replacement, and invalid existing records are reported instead of silently
resetting a player's data.

```java
var data = context.data();
context.events().onServerStarted(event -> {
    var world = data.world();
    world.putLong("starts", world.getLong("starts", 0) + 1);
});
```

## Play networking

`context.network()` returns `ModNetwork` for a shared `environment: "both"` mod.
Declare the receiving direction during initialization on both physical sides:

| API | Use |
|---|---|
| `registerServerReceiver(id, (sender, bytes) -> ...)` | Client-to-server receiving; sender comes from the server connection. |
| `registerClientReceiver(id, bytes -> ...)` | Server-to-client receiving. |
| `sendToServer(id, bytes)` | Send from a connected client to its negotiated server. |
| `sendToPlayer(player, id, bytes)` | Send to a live server-side `PlayerRef`. |

IDs must belong to the current mod. A channel may have one receiver in either
direction or one in both directions. Sending in an undeclared direction is an
error. Arrays are copied when messages are created and delivered. Payloads are
limited to `MAX_PAYLOAD_BYTES` (32,768); per connection, across channels, delivery
is limited to `MAX_PACKETS_PER_SECOND` (128) and 128 pending messages.

Both sides require matching HrajtyMC protocol-2 mod/content negotiation before
remote play messages are accepted. Channel directions contribute to the login
compatibility check. Vanilla/unnegotiated connections refuse sends; the API does
not probe vanilla servers with mod play messages. Singleplayer uses the same
handlers over its local connection.

Delivery schedules on the receiving game executor: C2S receivers run on the
server thread, S2C receivers on the client thread. A queued message is discarded
if the connection closes or its player is replaced. Unknown channels, invalid
directions and receive limits refuse the connection; callback exceptions are
logged with the channel and contained. Register both callbacks with API-only
code so a dedicated server never needs client game classes.

## Item properties and use behavior

The existing `ItemDefinition(int maxStackSize)`, no-argument constructor and
`simple()` remain available. New immutable settings are:

```java
ItemDefinition charm = ItemDefinition.simple().withDurability(64);
ItemDefinition snack = ItemDefinition.simple()
    .withFood(new FoodDefinition(6, 0.6f, false));
```

Durability is 0–1,000,000; a positive value makes the item non-stackable. A direct
three-argument definition must already use stack size 1 for a durable item.
Food takes nutrition (0–100), a finite saturation modifier (0–10) and
`alwaysEdible`; the two-argument food constructor uses `false`.

Register one `context.itemBehaviors().onUse(itemId, handler)` for an item owned
and registered by the mod. This initial hook handles an item's use-in-air path;
it is not a general block interaction or attack hook. The callback runs once on
the logical server thread. The logical client predicts success without running
mod actions. On the server, `PASS` falls through to vanilla use, `SUCCESS`
consumes the action and `FAIL` rejects it.

`UseContext` exposes `player()`, `itemId()`, `hand()` (`MAIN` or `OFF`), `count()`
and `damage()`. It can `damageItem(amount)`, `consume(amount)` and
`cooldown(ticks)`. These operations respect the supported vanilla item path;
consumption does not remove creative-mode items. A cooldown may be 0–72,000
ticks. The live context is valid only during its callback on that thread; do not
retain it or change the held stack and then continue using it.

## Try Ruby Example 1.1.0

Install the matching example on the client and server:

- `/ruby:stats` shows player joins, charm uses, deaths and network replies. The
  console shows world starts and active seconds.
- `/ruby:ping` is player-only and sends a server-to-client ping followed by a
  validated client-to-server pong. A successful reply increments saved player
  statistics and prints a confirmation.
- `/ruby:protect on` or `/ruby:protect off` requires permission level 2. Enabled
  protection cancels non-operator attempts to break Ruby Blocks.
- `ruby:ruby_charm` has 64 durability. A successful use adds a saved use count,
  applies a 20-tick cooldown, sends a ping and damages the item by 1. Creative
  mode follows vanilla durability behavior.
- `ruby:ruby_snack` supplies nutrition 6 with saturation modifier 0.6 and is not
  always edible.

The charm's shaped recipe uses rows `" R "`, `"RGR"`, `" R "`, where `R` is
`ruby:ruby` and `G` is `minecraft:gold_ingot`. One apple plus one ruby makes the
snack in a shapeless recipe. The existing nine-rubies-to-block and
block-to-nine-rubies recipes remain. Recipes use HrajtyMC JSON under
`hrajtymc/recipes/`.

This iteration provides these focused gameplay services. Full tool/armor
materials, block entities and machine screens, entity registration, world
generation and dimensions remain future API work.
