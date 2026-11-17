---
title: JSON recipes
description: Author shaped and shapeless crafting recipes in HrajtyMC format 1.
section: Mod development
---

HrajtyMC **0.1.0-alpha.2** loads recipes from UTF-8 JSON files inside a mod JAR at
`hrajtymc/recipes/<path>.json`. In a source project, put them under
`src/main/resources/hrajtymc/recipes/`.

The mod ID supplies the namespace. In mod `mymod`, the file
`hrajtymc/recipes/crystal_block.json` defines `mymod:crystal_block`.
Subdirectories are allowed: `storage/crystal_block.json` defines
`mymod:storage/crystal_block`.

## Shaped crafting

Create `hrajtymc/recipes/crystal_block.json` after
[registering the crystal and block](../items-and-blocks/):

```json
{
  "format": 1,
  "crafting": {
    "layout": ["CCC", "CCC", "CCC"],
    "using": {"C": "mymod:crystal"}
  },
  "output": {"item": "mymod:crystal_block", "count": 1}
}
```

`layout` contains 1–3 rows with equal widths of 1–3 characters. A space is an
empty slot. Every other symbol needs one `using` entry, and every entry must be
used. A nine-item recipe needs a **3x3 crafting table**.

## Shapeless crafting

Create `hrajtymc/recipes/crystals_from_block.json`:

```json
{
  "format": 1,
  "crafting": {"combine": ["mymod:crystal_block"]},
  "output": {"item": "mymod:crystal", "count": 9}
}
```

`combine` is an unordered list of 1–9 ingredient slots. Repeat an item ID to use
more than one slot of that ingredient.

## Format rules

| Field | Requirement |
|---|---|
| `format` | Required integer `1`. |
| `crafting` | Either `layout` with `using`, or `combine`. |
| `output.item` | Required exact namespaced item ID. |
| `output.count` | Optional integer 1–64; defaults to 1. |

Use lowercase filenames and forward-slash paths. Each file is limited to 64 KiB.
Unknown fields, duplicate JSON keys, unsafe paths and mismatched pattern symbols
are errors. The initial format supports exact item IDs, without ingredient tags,
alternatives, custom item components or non-crafting recipe types.

The SDK includes `docs/hrajty-recipe.schema.json` for editor validation. The
runtime checks the format and ID syntax; Minecraft's registry-loading step
resolves ingredient and output IDs to actual registered items.

## Loading and discovery

Use `environment: "both"` in [mod metadata](../mod-metadata/). The loader reads
recipe files after the Java entrypoint registers content, then supplies the
corresponding Minecraft data automatically, including during Create World.

Generated advancements allow ingredient acquisition to discover recipes in the
recipe book. An existing world's discovery state still applies. In a normal
world with limited crafting disabled, a valid manual crafting grid can work
before the recipe is discovered in the book.

JSON files and Java API recipes share one recipe-ID namespace. Do not register
the same ID twice, or ship a raw Minecraft recipe resource at an ID the loader
generates. The Java methods remain available for programmatic recipes; JSON is
the ordinary authoring workflow.

For missing recipes, check [Troubleshooting](../troubleshooting/).
