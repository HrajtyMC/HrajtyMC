---
title: Client and server networking
description: Register directional play channels and exchange validated bytes on the game threads.
section: Gameplay
---

`context.network()` provides the experimental `ModNetwork` API in
**HrajtyMC 0.1.0-alpha.4**. It transports byte arrays between a connected client
and server, with receivers running on the receiving game's main thread.
Require `"hrajtymc": ">=0.1.0-alpha.4"` and use
`"environment": "both"` in [mod metadata](../mod-metadata/).

## Register the receiving directions

Obtain the facade and register every receiver during `onInitialize`. Declare
the same channels and directions on both physical sides; initialization freezes
their registration, and the channel directions participate in the login
compatibility check. Do not register only the server half behind a physical-side
condition.

| Public method | Direction and purpose |
|---|---|
| `void registerServerReceiver(String channel, ServerReceiver receiver)` | Register one client-to-server (C2S) receiver. |
| `void registerClientReceiver(String channel, ClientReceiver receiver)` | Register one server-to-client (S2C) receiver. |
| `void sendToServer(String channel, byte[] payload)` | Send from a connected client to its negotiated server. |
| `void sendToPlayer(PlayerRef player, String channel, byte[] payload)` | Send from the server to that live server-side player handle. |

`ServerReceiver.receive(PlayerRef sender, byte[] payload)` and
`ClientReceiver.receive(byte[] payload)` may throw `Exception`. Their sender and
thread rules are described below.

Channel IDs use the current mod's namespace, such as `example:ping`, and must
pass `ResourceId` validation. The full ID may contain at most 256 characters.
The same channel can have one receiver in each direction. Registering a second
receiver in the same direction, using another mod's namespace, passing null or
registering after initialization is an error. Sending requires a registered
receiver in that direction and completed initialization.

## Complete ping and reply example

Create `src/main/java/example/NetworkMod.java`. The two-byte messages below use
an application version and message kind: `[1, 1]` is a ping and `[1, 2]` is a
pong. Each receiver checks the exact expected bytes. Only a player with a
pending server-issued ping gets a successful reply notification.

```java
package example;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ModContext;

public final class NetworkMod implements HrajtyMod {
    private static final byte[] PING = {1, 1};
    private static final byte[] PONG = {1, 2};

    @Override
    public void onInitialize(ModContext context) {
        var network = context.network();
        Set<UUID> awaitingReply = new HashSet<>();

        // Register both receivers on both physical sides.
        network.registerClientReceiver("example:ping", payload -> {
            if (Arrays.equals(payload, PING)) {
                network.sendToServer("example:pong", PONG);
            }
        });
        network.registerServerReceiver("example:pong", (sender, payload) -> {
            if (!Arrays.equals(payload, PONG)) return;
            if (!awaitingReply.remove(sender.uuid())) return;
            sender.sendMessage("HrajtyMC client/server round trip completed.");
        });

        context.commands().register("example:ping", 0, invocation -> {
            if (!invocation.arguments().isEmpty()
                    || invocation.source().player().isEmpty()) {
                invocation.source().error("Usage: /example:ping (player only)");
                return 0;
            }
            var player = invocation.source().player().orElseThrow();
            awaitingReply.add(player.uuid());
            try {
                network.sendToPlayer(player, "example:ping", PING);
            } catch (RuntimeException failure) {
                awaitingReply.remove(player.uuid());
                throw failure;
            }
            return 1;
        });

        // These callbacks and the set's server-side accesses share the server thread.
        context.events().onPlayerQuit(player -> awaitingReply.remove(player.uuid()));
        context.events().onServerStopping(event -> awaitingReply.clear());
    }
}
```

Use this complete `src/main/resources/hrajty.mod.json`:

```json
{
  "schemaVersion": 1,
  "id": "example",
  "version": "1.0.0",
  "name": "Networking Example",
  "description": "A validated client/server ping and reply.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "example.NetworkMod",
  "depends": {
    "minecraft": "26.3",
    "hrajtymc": ">=0.1.0-alpha.4"
  }
}
```

This is an independent tutorial project using ID `example`. Combine the
registrations in one entrypoint or rename the ID and channel/command namespace
when using several examples together. Build as described in
[Your first mod](../first-mod/). Install the same mod on the client and server,
join the world and run `/example:ping` as a player. No item assets are needed
for this example. See [commands](../commands/) and [events](../events/) for those
services.

## Identity, connection and thread rules

C2S receivers run on the logical server thread. `sender` comes from the actual
server connection; clients cannot choose a player by putting a UUID or name in
the message. Use that handle for permission checks and for selecting the
sender's [persistent record](../persistent-data/).

S2C receivers run on the client game thread and receive bytes only. They cannot
read server-world records directly. The public API exposes no Minecraft object,
and this example imports no client game classes, so the shared entrypoint can
load on a dedicated server.

Send using the current live `PlayerRef` supplied to an event, command or receiver.
`sendToPlayer` rejects a fabricated handle, a client-side handle, a disconnected
player or an unnegotiated connection. Outgoing sends are scheduled on the
appropriate game executor and may be dropped if the connection changes before
they run. The server also checks that the captured player has not been replaced.
Delivery of queued incoming messages is skipped when the connection or server
player is no longer current.

Singleplayer uses the same channel handlers over its local connection. Its
physical process is `CLIENT`, while C2S callbacks still run on its logical
server thread. A dedicated server cannot call `sendToServer`; that operation
requires a connected physical client.

## Payload ownership and limits

| Limit | Value |
|---|---|
| `ModNetwork.MAX_PAYLOAD_BYTES` | 32,768 bytes per mod message. |
| `ModNetwork.MAX_PACKETS_PER_SECOND` | 128 received messages per connection, across all mod channels. |
| Pending callbacks | At most 128 per connection. |
| Channel ID length | At most 256 characters, with valid namespaced resource-ID syntax. |

The receive-rate window lasts one second from its current window start; the
pending limit also applies when messages have not yet executed on the game
thread. These are transport bounds for the connection, not independent allowances
for each channel. They are not a bandwidth reservation or a guarantee of a
delivery time.

Payload arrays are copied when messages are created and when delivered to a
receiver. The receiver may change its received array without changing another
message. Null and oversized outgoing arrays are rejected before sending.

Messages use bytes, so your mod defines and validates its own application format.
For larger formats, check an application version, message type, length and value
ranges before using the data. In permission-sensitive features, check
`sender.hasPermission(...)` on the server and derive the affected player from
`sender`. Transport validation alone does not authorize an inventory, economy or
world change.

## Negotiation and failure behavior

Remote channels require successful HrajtyMC login **protocol 2** negotiation.
Shared mod IDs/versions, registered content and channel directions must match.
Use alpha.4 loaders on both peers. Vanilla or unnegotiated connections are
rejected when sending; the API does not send exploratory mod play messages to a
vanilla server. Client-only and server-only mods cannot obtain this play
networking facade in this version.

A received unknown channel, wrong direction, pre-initialization or unnegotiated
message, or receive-rate/pending-limit violation refuses the connection. A
receiver exception is logged with its channel and disconnects the affected
connection; it does not escape as an unhandled game-executor exception. Failure
to schedule a delivery is also logged and refuses the connection. Invalid
application bytes in the example simply return before changing state; a real
mod should choose its own response to invalid application requests.

The initial API sends raw play messages. It does not automatically synchronize
arbitrary fields, inventories, entities or saved data, and provides no public
request timeout/retry or broadcast helper. Add application-level request IDs,
timeouts and bounded state when building a larger exchange. For a server-side
interaction that also changes the held item, follow
[item behaviors](../item-behaviors/); for item nutrition and durability see
[food and durability](../food-and-durability/).
