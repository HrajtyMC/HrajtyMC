---
title: Commands and permissions
description: Create namespaced server commands, parse quoted arguments and handle players or console sources.
section: Gameplay
---

Use `context.commands()` to register server commands during `onInitialize`.
This experimental API requires **HrajtyMC 0.1.0-alpha.4 or newer**. Commands run
on the logical server in dedicated servers and singleplayer, and use the
vanilla Brigadier dispatcher and permission checks.

Use `environment: "both"` when the same mod should load in singleplayer and on
a dedicated server. A mod declared `"server"` only loads in the physical server
process. Commands alone do not require registering items or network channels;
see [mod metadata](../mod-metadata/) for environment rules.

## Complete example

This mod adds a public player greeting and an operator-only echo command.
Create `src/main/java/example/CommandsMod.java`:

```java
package example;

import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ModContext;

public final class CommandsMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        var commands = context.commands();

        commands.register("example:hello", invocation -> {
            if (!invocation.arguments().isEmpty()) {
                invocation.source().error("Usage: /example:hello");
                return 0;
            }
            var player = invocation.source().player();
            if (player.isEmpty()) {
                invocation.source().error("This command requires a player.");
                return 0;
            }
            invocation.source().reply("Hello, " + player.get().name() + "!");
            return 1;
        });

        commands.register("example:say", 2, invocation -> {
            if (invocation.arguments().size() != 1) {
                invocation.source().error("Usage: /example:say \"message\"");
                return 0;
            }
            invocation.source().reply(invocation.arguments().getFirst());
            return 1;
        });
    }
}
```

The example compiles against `hrajtymc-api.jar` and Java 25, with no Minecraft
dependency. Use this `src/main/resources/hrajty.mod.json`:

```json
{
  "schemaVersion": 1,
  "id": "example",
  "version": "1.0.0",
  "name": "Commands Example",
  "description": "Player greetings and an operator-only echo command.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "example.CommandsMod",
  "depends": {"minecraft": "26.3", "hrajtymc": ">=0.1.0-alpha.4"}
}
```

Build with the [SDK template](../first-mod/), install the mod and open a test
world. Run `/example:hello`, then `/example:say "hello world"` with permission
level 2 or higher. The echo replies only to the command source; it does not
broadcast to every player. In a server console, omit the leading slash.

## Registration and command names

`CommandRegistry` has two overloads:

| Method | Permission requirement |
|---|---|
| `register(String id, CommandHandler handler)` | Level 0. |
| `register(String id, int permissionLevel, CommandHandler handler)` | Explicit vanilla level 0–4. |

The ID is a namespaced literal such as `example:hello`, without a leading slash.
Its namespace must equal the metadata mod ID. Command path characters are
lowercase letters, digits, underscores, dots and hyphens. Slashes are not allowed
in the command path. The ID also follows the general
[ResourceId rules](../api-reference/#resourceid), so empty or dot-only path
segments are invalid.

Names must be unique. A null handler, duplicate registration, out-of-range
permission level or another mod's namespace is rejected. Registration is frozen
after initialization. The loader adds declarations to new vanilla command
dispatchers, including dispatchers rebuilt during resource reloads; do not
register the same commands again from an event callback.

This API registers a literal with an optional free-form argument string. It does
not expose arbitrary Brigadier argument-tree builders or a custom suggestion
provider. Vanilla can suggest registered literal names to permitted sources.

## Permissions

The integer is checked against the command source's actual vanilla permission
set; it is not a separate HrajtyMC role database.

| Level | Required permission |
|---|---|
| `0` | No command permission required. |
| `1` | Vanilla moderator command permission. |
| `2` | Vanilla gamemaster command permission. |
| `3` | Vanilla admin command permission. |
| `4` | Vanilla owner command permission. |

The same checks apply to players, console, command blocks and other vanilla
sources. `source.hasPermission(level)` and `PlayerRef.hasPermission(level)` use
the same 0–4 mapping. Both reject values outside that range. Use the registration
level for the command's base permission and explicit checks in the handler when
different actions require different permissions.

## Arguments, quotes and escaping

`CommandHandler.execute(CommandInvocation)` receives:

| Accessor | Result |
|---|---|
| `source()` | The live `CommandSource` executing the command. |
| `arguments()` | An immutable `List<String>` of parsed words, without the command literal. |
| `rawArguments()` | The argument text supplied to the parser, retaining quotes and spacing within it. |

No arguments means an empty list and an empty raw string. Validate counts and
convert numeric or other application values in the handler; the API does not
automatically interpret every word as a number or registry ID.

Quoted strings and escaping follow Brigadier's string reader. Both double
quotes and single quotes are accepted, and the closing quote must match:

| Invocation | Parsed arguments |
|---|---|
| `/example:say hello` | One word: `hello`. |
| `/example:say hello world` | Two words: `hello`, `world`; the example rejects this count. |
| `/example:say "hello world"` | One word: `hello world`. |
| `/example:say 'hello world'` | One word: `hello world`. |
| `/example:say "say \"hi\""` | One word containing `say "hi"`. |
| `/example:say ""` | One empty string. |

Quoted strings must be followed by whitespace or the end of the argument text.
Malformed quotes, unsupported escapes inside a quoted string or a missing
separator are reported as command syntax errors before the handler runs. Inside
a quoted string, escape its matching quote or a backslash with a backslash;
other escape sequences are invalid. Unquoted words are separated by whitespace.

## Sources, replies and results

`CommandSource` provides all of these methods:

| Method | Use |
|---|---|
| `name()` | Plain-text name of the source. |
| `player()` | `Optional<PlayerRef>`; empty for sources that are not players. |
| `hasPermission(int level)` | Check a vanilla permission level. |
| `reply(String text)` | Send a plain-text success reply to the source. |
| `error(String text)` | Send a plain-text failure reply to the source. |

Always account for the empty player case. A command can come from the console,
a command block or another vanilla source. The player's `uuid()` and other live
methods are described in [events and player callbacks](../events/#player-and-death-values).

Return the command result, normally `1` for success or `0` for ordinary failure.
Calling `reply` or `error` does not itself choose that integer result. These are
simple text replies; there is no broadcast or rich-component builder in this
interface.

Handlers may throw `Exception`. Command syntax exceptions are returned through
vanilla's syntax reporting. Other handler exceptions and linkage errors are
logged with the mod and command ID, produce a generic failure reply and return
0. Validate expected user mistakes yourself so players receive a useful message.

## Thread and data rules

Handlers execute on the logical server thread. They may use the current world's
[persistent data](../persistent-data/) or send declared
[play messages](../play-networking/) to a live server-side player. Treat the
command source and `PlayerRef` as callback-scoped live handles. The argument list
is immutable; a background task must not use those live game handles or a
world's `DataView` from another thread.

The [gameplay overview](../gameplay-api/) combines commands with item use,
events, persistence and a client/server ping example.
