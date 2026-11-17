---
title: Events and player callbacks
description: Register server lifecycle, tick and player listeners, and cancel block-break attempts.
section: Gameplay
---

Use `context.events()` to react to the logical server. This experimental API
requires **HrajtyMC 0.1.0-alpha.4 or newer**. Register listeners inside your
mod's `onInitialize`; registration closes after mod initialization.

The same callbacks run on dedicated servers and the integrated server in
singleplayer. `context.environment()` describes the physical process: it remains
`CLIENT` in singleplayer. It does not mean that a callback is on the client
thread. These event callbacks run synchronously on the **server game thread**.

Use `environment: "both"` for one mod that should load in both singleplayer and
dedicated-server processes. A mod declared `"server"` loads only on the physical
server, so it is not loaded by the singleplayer client process. See
[mod metadata](../mod-metadata/) for environment and dependency rules.

## Complete example

This entrypoint records world starts and player joins, and protects diamond
blocks from players below permission level 2. It uses only the public API JAR.
Create `src/main/java/example/EventsMod.java`:

```java
package example;

import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ModContext;

public final class EventsMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        var events = context.events();
        var data = context.data();

        events.onServerStarted(server -> {
            var world = data.world();
            world.putLong("starts", world.getLong("starts", 0) + 1);
            context.logger().info("World started: " + server.worldDirectory());
        });

        events.onPlayerJoin(player -> {
            var record = data.player(player.uuid());
            record.putLong("joins", record.getLong("joins", 0) + 1);
            player.sendMessage("Welcome, " + player.name() + ". Joins: "
                + record.getLong("joins", 0));
        });

        events.beforeBlockBreak(event -> {
            if (event.blockId().equals("minecraft:diamond_block")
                    && !event.player().hasPermission(2)) {
                event.cancel();
                event.player().sendMessage("An operator must break this block.");
            }
        });
    }
}
```

Use this `src/main/resources/hrajty.mod.json` with the usual
[project layout](../project-structure/):

```json
{
  "schemaVersion": 1,
  "id": "example",
  "version": "1.0.0",
  "name": "Events Example",
  "description": "World starts, player joins and block protection.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "example.EventsMod",
  "depends": {"minecraft": "26.3", "hrajtymc": ">=0.1.0-alpha.4"}
}
```

Build with the SDK template, install the mod, then open a test world. Rejoin to
increase the saved join count. In Survival mode, try breaking a diamond block
with permission level below 2 and again as an operator. Read
[persistent data](../persistent-data/) for record lifetime and save behavior.

## Every available event

Each method accepts a `Consumer` of the callback value and returns a
`Subscription`. The callbacks below are the currently supported event set.

| Registration | Callback value | Delivery time |
|---|---|---|
| `onServerStarting(listener)` | `ServerEvent` | When level loading begins, after the world's mod-data session opens. |
| `onServerStarted(listener)` | `ServerEvent` | After server initialization succeeds. |
| `onServerStopping(listener)` | `ServerEvent` | At the start of normal server shutdown. |
| `onServerStopped(listener)` | `ServerEvent` | At the end of shutdown, before the final mod-data flush and session close. |
| `onServerTick(listener)` | `ServerEvent` | At the end of each completed server tick. |
| `onPlayerJoin(listener)` | `PlayerRef` | After the player enters the world and its connection is ready. |
| `onPlayerQuit(listener)` | `PlayerRef` | Before vanilla removes and saves the player. |
| `onPlayerDeath(listener)` | `PlayerDeathEvent` | Immediately before vanilla handles the player's death. |
| `beforeBlockBreak(listener)` | `BlockBreakEvent` | Before vanilla validates and performs a block-break attempt. |

All types are in `studio.hrajto.hrajtymc.api.event`, except `PlayerRef`, which is
in `studio.hrajto.hrajtymc.api.game`.

## Server lifecycle and snapshots

The normal world lifecycle is `starting` → `started` → repeated `tick` callbacks
→ `stopping` → `stopped`. A startup failure can prevent later phases from being
reached; do not assume every server attempt reaches `started` or emits a normal
shutdown sequence.

The mod-data session is available from `onServerStarting` through
`onServerStopped`. `onServerStarted` is a useful place for world initialization.
Obtain `context.data()` during initialization, then open its records from a
callback, as the example does. Opening a world record inside `onInitialize` is
too early. The session is closed after the stopped callbacks and final flush.

`ServerEvent` is a snapshot with these accessors:

| Method | Value |
|---|---|
| `worldDirectory()` | Absolute, normalized `Path` for the current server save. |
| `tick()` | The server's tick counter at delivery, represented as a `long`. |
| `dedicated()` | Whether this is a dedicated server. |
| `playerCount()` | Current player count, or 0 before a player list is available. |

Keep tick work small. A callback runs synchronously and delays the tick until it
returns. For periodic work, test the tick counter, for example
`server.tick() % 20 == 0`; do not use a sleep in a callback. Twenty ticks are a
game-time interval and are not a wall-clock timer when the server falls behind.

## Player and death values

`PlayerRef` provides the following methods without exposing a Minecraft object:

| Method | Value or action |
|---|---|
| `uuid()` | Player UUID; use it for [player data](../persistent-data/). |
| `name()` | Display name as a plain string. |
| `isClientSide()` | Logical side of the player's level; server event players are server-side. |
| `dimension()` | Namespaced dimension ID, such as `minecraft:overworld`. |
| `sendMessage(String)` | Send a plain-text system message to this player. |
| `hasPermission(int)` | Test vanilla command permission level 0–4. |

Treat it as a live handle for the current callback on the game thread. Save the
UUID when you need persistent identity, rather than retaining a player object
for background work or across disconnects and respawns.

`PlayerDeathEvent` has `player()` and `damageType()`. The latter is a string
describing the damage source's message ID; it is not a complete damage-source
object or a namespaced registry key. This is a notification, with no death
cancellation method.

## Block-break cancellation

`BlockBreakEvent` exposes `player()`, `blockId()`, `dimension()`, block coordinates
`x()`, `y()`, `z()`, `isCancelled()` and `cancel()`. Cancellation is monotonic:
there is no method to reverse a cancellation. Later listeners still receive the
event and can observe its cancelled state.

Call `cancel()` synchronously inside the callback. A cancelled attempt skips
vanilla destruction and the loader corrects the client's predicted block state.
Do not use this event as proof of a successful break: an uncancelled attempt can
still fail vanilla permission, tool or other validation afterward. Rewarding a
player simply for receiving this event would reward failed attempts too.

## Listener order, errors and removal

Listeners run in registration order. Other mods' initializers and registrations
therefore influence the global order; the API has no listener-priority parameter.
Notification listener runtime/linkage failures are logged with the owning mod,
and later listeners still run. If a block-break listener fails, that attempt is
cancelled and later listeners still observe it.

Registration returns `Subscription`, an `AutoCloseable` with a no-argument
`close()` method. Closing it is idempotent and removes it from subsequent
dispatches. For a one-time callback, retain the subscription and close it after
the event you need. Registration still belongs in `onInitialize`; closing one
subscription does not reopen registration after initialization.

Continue with [commands](../commands/), [persistent data](../persistent-data/)
or [play networking](../play-networking/). The [gameplay overview](../gameplay-api/)
contains an example combining all five services.
