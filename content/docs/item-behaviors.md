---
title: Item behaviors
description: Handle server-side item use with cooldowns, durability, consumption and live interaction data.
section: Gameplay
---

`context.itemBehaviors()` provides the experimental alpha.4 item-use API. It
handles the item's normal use-in-air path in either hand. It does not provide
an attack callback or a general block-interaction callback.

Register the item and its one use handler during `onInitialize`. Content mods
use `environment: "both"` and require `hrajtymc >=0.1.0-alpha.4`. See
[Food and durability](../food-and-durability/) for declarative settings and
[Items and blocks](../items-and-blocks/) for models, textures and names.

## A complete behavior mod

Put this class at `src/main/java/example/ItemBehaviorMod.java`:

```java
package example;

import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ItemDefinition;
import studio.hrajto.hrajtymc.api.ModContext;
import studio.hrajto.hrajtymc.api.item.Hand;
import studio.hrajto.hrajtymc.api.item.UseResult;

public final class ItemBehaviorMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        context.content().registerItem("example:charm",
            ItemDefinition.simple().withDurability(64));
        context.content().registerItem("example:token", new ItemDefinition(16));

        context.itemBehaviors().onUse("example:charm", use -> {
            var player = use.player();
            String hand = use.hand() == Hand.MAIN ? "main hand" : "off hand";
            player.sendMessage("Used " + use.itemId() + " from " + hand
                + "; count " + use.count() + ", damage " + use.damage());
            use.cooldown(20);
            // This can break the held item. Finish other context work first.
            use.damageItem(1);
            return UseResult.SUCCESS;
        });

        context.itemBehaviors().onUse("example:token", use -> {
            if (!use.player().hasPermission(2)) {
                use.player().sendMessage("An operator must use this token.");
                return UseResult.FAIL;
            }
            use.player().sendMessage("Token action completed.");
            use.cooldown(40);
            use.consume(1);
            return UseResult.SUCCESS;
        });
    }
}
```

Use this metadata at `src/main/resources/hrajty.mod.json`:

```json
{
  "schemaVersion": 1,
  "id": "example",
  "version": "1.0.0",
  "name": "Item Behavior Example",
  "description": "Durable charm and consumable token use handlers.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "example.ItemBehaviorMod",
  "depends": {
    "minecraft": "26.3",
    "hrajtymc": ">=0.1.0-alpha.4"
  }
}
```

The two complete mod classes in these guides are independent examples. Choose
one entrypoint, or combine their registrations into one class before packaging
your own mod. Each mod JAR contains one `hrajty.mod.json`.

## Registration and execution

`ItemBehaviors.onUse(String itemId, ItemUseHandler handler)` accepts one
non-null handler per item. The ID must use your mod's namespace and match an
item registered by that mod. A block's automatically created block item is not
a separate custom-item behavior declaration. Missing items, duplicate handlers
and registration after initialization are errors.

The callback executes **once on the logical server thread**. This also applies
to singleplayer: its physical client process runs an integrated logical server.
The logical client predicts success without executing the mod callback or
changing inventory and counters. Do not run the action a second time based on
`context.environment()`; that method reports the physical side.

When the held stack is on cooldown, the use is rejected before your handler
runs. Otherwise the callback receives a live `UseContext`.

## UseContext reference

| Method | Available information or effect |
|---|---|
| `PlayerRef player()` | The player performing this server-side interaction. |
| `String itemId()` | The registered item ID. |
| `Hand hand()` | `Hand.MAIN` or `Hand.OFF`, matching the hand used. |
| `int count()` | The held stack's current count. |
| `int damage()` | Its current accumulated damage; this is not remaining durability. |
| `void damageItem(int amount)` | Apply vanilla item damage/break behavior. Amount must be 0–1,000,000; 0 does nothing. Use it on a durable item. |
| `void consume(int amount)` | Shrink the held stack by 0 through its current count. Creative-mode items are not removed by this helper. |
| `void cooldown(int ticks)` | Apply a vanilla cooldown for 0–72,000 ticks. At the normal 20 ticks/second, 20 ticks is about one second. |

`PlayerRef` supplies `uuid()`, `name()`, `isClientSide()`, `dimension()`,
`sendMessage(String)` and `hasPermission(int)`. Permission levels are vanilla
command levels 0–4. A message displays plain text rather than parsing a command
or applying an effect to the player.

All context methods are valid only during that callback, on its owning thread,
while the same held stack remains in the hand. Do not store `UseContext` for a
later tick, use it from a background task, or replace the held stack and then
continue accessing it. Capture any needed player or scalar values before a
destructive operation.

`damageItem` can break an item, and `consume` can empty a stack. Set cooldowns,
read state and perform other context operations first; make the destructive
operation your final context call. Vanilla durability behavior also applies in
Creative mode. The cooldown helper uses vanilla stack cooldown rules.

## Returning a result

Every handler must return a non-null `UseResult`:

| Value | Server behavior |
|---|---|
| `PASS` | Continue with vanilla `Item.use` behavior, such as ordinary eating for a food item. |
| `SUCCESS` | Handle the use as a successful custom action. Vanilla use is not called afterward. |
| `FAIL` | Reject the use. Vanilla use is not called afterward. |

These results do not roll back earlier side effects. Check permissions,
arguments and preconditions before consuming items or applying damage. In the
token example, returning `FAIL` happens before any stack change.

With no handler, the item follows its normal vanilla use behavior. With a
handler, the client's prediction is still success; the result in this table is
the logical server's final decision. Returning `PASS` does not create a separate
client callback.

A thrown runtime exception is reported as an item-use handler failure with the
item ID; it is not converted into a `FAIL` result. Use `FAIL` for expected
rejections. A null result is an error as well. Keep callbacks short and perform
world/player record changes on that server thread; see the
[Gameplay API guide](../gameplay-api/#persistent-world-and-player-records).

## Appearance and recipes

Both example items still need ordinary item definitions, models and translation
keys. For the charm, create `assets/example/items/charm.json`:

```json
{"model":{"type":"minecraft:model","model":"example:item/charm"}}
```

Create `assets/example/models/item/charm.json`:

```json
{"parent":"minecraft:item/generated","textures":{"layer0":"minecraft:item/amethyst_shard"}}
```

Repeat those files for `token`, using `example:item/token` for its model and
`minecraft:item/paper` as its texture reference. Add names to
`assets/example/lang/en_us.json`:

```json
{"item.example.charm":"Example Charm","item.example.token":"Example Token"}
```

You can supply custom PNGs instead of referencing existing vanilla textures.
Use [HrajtyMC recipe JSON](../json-recipes/) to craft the registered items;
behavior registration does not generate a recipe automatically.

## Test both hands and permissions

Build with the SDK template, install the JAR, then restart the instance. Obtain
the items from **Ingredients**, **Search**, or `/give @s example:charm` and
`/give @s example:token 16` with command access.

- Use a charm from the main hand and off hand. The message should identify the
  correct hand, and one successful Survival use should add one damage.
- Use it rapidly. Its cooldown should prevent another callback until it expires.
  On the last available use, the charm should break without a later context call.
- Use a token as a player with permission below 2. It should reject the action
  without reducing the stack. A player with permission 2 or higher should consume
  one token on success in Survival.
- Check Creative mode separately: the token stack is preserved by the helper,
  and durability follows vanilla rules.
- Repeat on a dedicated server with matching alpha.4 loaders and the same shared
  mod. Item use should not apply the action twice because of client prediction.

The SDK's `examples/ruby/` provides a buildable reference: its Ruby Charm adds a
saved use count, starts a cooldown and client/server ping, then applies damage.
See [Gameplay API](../gameplay-api/#try-ruby-example-110) for that walkthrough.
