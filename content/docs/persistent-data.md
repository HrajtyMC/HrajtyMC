---
title: Persistent world and player data
description: Save typed mod records by world, mod ID and player UUID, with lifecycle and thread rules.
section: Gameplay
---

`context.data()` provides the experimental `ModData` service in
**HrajtyMC 0.1.0-alpha.4**. It stores strings, longs, doubles and booleans in the
current server world. Compile against the public `hrajtymc-api.jar` and require
`"hrajtymc": ">=0.1.0-alpha.4"` in your [metadata](../mod-metadata/).

## Choose the record's scope

| Call | Record |
|---|---|
| `DataView world()` | This mod's shared record in the active world, across all its dimensions. |
| `DataView player(UUID playerId)` | This mod's record for that UUID in the same world. The UUID must be non-null. |
| `void save()` | Immediately flush changed, loaded records belonging to this mod. |

Player records belong to a world save. Opening another singleplayer world starts
with that world's records, even for the same player account. Changing dimensions
within one world keeps the same records. Other mods get their own namespace.

Record files live under the current world save:

```text
<world>/hrajtymc-data/<mod-id>/
  world.json
  players/
    <player-uuid>.json
```

Use `player.uuid()` from a live [PlayerRef](../api-reference/) as the
key. A player name can change and is useful as a stored display value rather
than the identity of a record. A player record can be accessed by UUID while the
world is running even when that player is offline; the data API does not look up
an online Minecraft player.

## Lifecycle and game threads

Obtain the `ModData` facade during `onInitialize`, but wait for a server world
before calling `world()`, `player()` or `save()`. The data session opens before
`onServerStarting` and closes after `onServerStopped`, following a final flush.
`onServerStarted` is a convenient place to initialize world defaults. See the
[event lifecycle](../events/).

All record access, including reads, `contains()` and `keys()`, must run on that
world's logical server thread. Server event listeners, command handlers, C2S
message receivers and item-use handlers already run there. A singleplayer
process still has a separate logical server thread; `context.environment()`
being `CLIENT` does not make its client thread a valid place to read records.

A retained `ModData` facade resolves the currently active world. A retained
`DataView` belongs to the session in which it was opened. Once that world closes,
using the old view throws instead of reading or changing the next world's data.
Open a fresh view inside each relevant callback.

## Complete example

Create `src/main/java/example/PersistenceMod.java`. This example initializes
world defaults, counts each player's joins, stores their last name and exposes
commands for inspecting and saving data. It uses only the public API and JDK.

```java
package example;

import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ModContext;

public final class PersistenceMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        var data = context.data(); // A facade is safe here; records are opened later.

        context.events().onServerStarted(event -> {
            var world = data.world();
            world.putLong("starts", world.getLong("starts", 0) + 1);
            if (!world.contains("greeting")) world.putString("greeting", "Welcome back!");
            if (!world.contains("greetingsEnabled")) world.putBoolean("greetingsEnabled", true);
            if (!world.contains("visitWeight")) world.putDouble("visitWeight", 1.0);
        });

        context.events().onPlayerJoin(player -> {
            var world = data.world();
            var record = data.player(player.uuid());
            record.putLong("visits", record.getLong("visits", 0) + 1);
            record.putString("lastName", player.name());
            record.putDouble("weightedVisits", record.getDouble("weightedVisits", 0)
                + world.getDouble("visitWeight", 1.0));
            if (world.getBoolean("greetingsEnabled", true)) {
                player.sendMessage(world.getString("greeting", "Welcome!"));
            }
        });

        context.commands().register("example:visits", 0, invocation -> {
            if (!invocation.arguments().isEmpty()) {
                invocation.source().error("Usage: /example:visits");
                return 0;
            }
            var player = invocation.source().player();
            if (player.isPresent()) {
                var record = data.player(player.get().uuid());
                invocation.source().reply("Visits in this world: " + record.getLong("visits", 0)
                    + ", weighted visits: " + record.getDouble("weightedVisits", 0));
            } else {
                invocation.source().reply("World starts: " + data.world().getLong("starts", 0));
            }
            return 1;
        });

        context.commands().register("example:checkpoint", 2, invocation -> {
            if (!invocation.arguments().isEmpty()) {
                invocation.source().error("Usage: /example:checkpoint");
                return 0;
            }
            data.save();
            invocation.source().reply("This mod's loaded data records have been saved.");
            return 1;
        });
    }
}
```

Use this complete `src/main/resources/hrajty.mod.json` for the example:

```json
{
  "schemaVersion": 1,
  "id": "example",
  "version": "1.0.0",
  "name": "Persistence Example",
  "description": "World defaults and per-player visit records.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "example.PersistenceMod",
  "depends": {
    "minecraft": "26.3",
    "hrajtymc": ">=0.1.0-alpha.4"
  }
}
```

The page is a standalone tutorial project using ID `example`. If you combine it
with another example, combine its registrations in one entrypoint or rename its
ID, package and command namespace together. See [project structure](../project-structure/).

## Every DataView method

| Method | Behavior |
|---|---|
| `String getString(String key, String fallback)` | Return a stored string, or the supplied fallback when absent. |
| `long getLong(String key, long fallback)` | Return a stored signed Java `long`, or the supplied fallback when absent. |
| `double getDouble(String key, double fallback)` | Return a stored finite `double`, or the supplied fallback when absent. |
| `boolean getBoolean(String key, boolean fallback)` | Return a stored boolean, or the supplied fallback when absent. |
| `void putString(String key, String value)` | Store a non-null string. |
| `void putLong(String key, long value)` | Store a signed Java `long`. |
| `void putDouble(String key, double value)` | Store a finite double; NaN and infinities are rejected. |
| `void putBoolean(String key, boolean value)` | Store a boolean. |
| `boolean contains(String key)` | Test whether a key is present, regardless of its type. |
| `void remove(String key)` | Remove a key if present. |
| `Set<String> keys()` | Return an immutable snapshot of the keys. |

A fallback is returned only for a missing key. Reading an existing long with
`getString`, for example, throws `IllegalStateException`; there is no implicit
conversion or replacement with the fallback. A `put...` call can deliberately
replace a value with another type. For a format change in your mod, inspect old
values using their old types and perform an explicit migration.

## Limits and stored JSON

| Limit | Value |
|---|---|
| Key syntax | `[a-zA-Z0-9_.-]{1,64}`; case-sensitive. |
| Keys per record | At most 256. Updating an existing key does not add a key. |
| String value length | At most 16,384 Java `String.length()` units. |
| Encoded record size | At most 1,048,576 bytes, including UTF-8 JSON formatting. |
| Value kinds | String, signed 64-bit long, finite double, boolean. |

The byte limit is independent of the string-length limit: Unicode characters
and JSON escaping can use multiple bytes. A put that would exceed the encoded
size is rejected and its previous value is restored in the record.

The persisted format is typed JSON, for example:

```json
{
  "format": 1,
  "values": {
    "starts": {"type": "long", "value": 3},
    "greeting": {"type": "string", "value": "Welcome back!"},
    "greetingsEnabled": {"type": "boolean", "value": true},
    "visitWeight": {"type": "double", "value": 1.0}
  }
}
```

The format marker, allowed fields, primitive types and limits are checked when
loading. Duplicate keys/fields, unknown fields/types, invalid numbers, trailing
JSON, oversized files and incomplete records are errors. The file is not
silently reset when loading fails. Stop the world and keep a copy of the
existing file before investigating a malformed record.

## Saving and checking the result

Changes mark a record dirty. Normal server saves and shutdown flush changed
records. `data.save()` writes this mod's loaded, dirty records immediately;
unchanged records are not rewritten. It does not force a Minecraft world save
or flush another mod's records. Save at a meaningful checkpoint instead of every
tick.

Each record is written to a temporary file in the destination directory, forced
to disk, then replaced using an atomic move where supported, with a replacement
fallback on filesystems that do not support it. This is a per-record operation,
not one transaction across every player and world file. An I/O failure is
reported as `UncheckedIOException`; invalid existing data and invalid session
access are reported as `IllegalStateException`.

Build and install the example using [Your first mod](../first-mod/). Join a test
world twice and run `/example:visits`, then `/example:checkpoint` as an operator.
Close and reopen that world and confirm the values survive. Open a second world
and confirm it has independent values. Its saved records are server data and
are not automatically copied to the client; use declared
[play messages](../play-networking/) if a client feature needs a validated view
of a value.
