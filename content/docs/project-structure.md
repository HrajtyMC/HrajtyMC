---
title: Project structure
description: Find Java sources, metadata, models, textures and recipe files.
section: Mod development
---

The template separates Java sources from resources. Its build script compiles
the Java files and packages the contents of the resources directory at the JAR
root.

```text
mod-template/
  build.ps1
  build.bat
  src/main/
    java/com/example/mymod/ExampleMod.java
    resources/
      hrajty.mod.json
      hrajtymc/recipes/
        crystal_block.json
      assets/mymod/
        items/crystal.json
        models/item/crystal.json
        textures/item/crystal.png
        lang/en_us.json
      data/mymod/
        loot_table/blocks/crystal_block.json
```

The recipe and content resources shown above are examples to add after
registering the matching content. The starting template contains only its Java
entrypoint and metadata.

## What belongs where

| Location | Purpose |
|---|---|
| `src/main/java/` | Mod entrypoint and other Java classes. |
| `src/main/resources/hrajty.mod.json` | Identity, version, entrypoint, environment and dependencies. |
| `src/main/resources/hrajtymc/recipes/` | HrajtyMC recipe JSON. |
| `src/main/resources/assets/<namespace>/` | Item definitions, blockstates, models, PNG textures and translations. |
| `src/main/resources/data/<namespace>/` | Other Minecraft data, such as block loot tables. |
| `build/` | Compiled classes and the resulting mod JAR. |

## Resource IDs

An ID has a namespace and path, such as `mymod:crystal` or
`mymod:storage/crystal_block`. Use lowercase names. Registration IDs belong to
the current mod's namespace; ingredients can refer to Minecraft items or content
from a declared dependency.

For recipe files, the mod ID supplies the namespace. A file at
`hrajtymc/recipes/storage/crystal_block.json` becomes
`mymod:storage/crystal_block` when the metadata ID is `mymod`.

## Resources in Minecraft 26.3

An item's file under `assets/<namespace>/items/` points to its render model.
The model then points to a texture. A model JSON alone does not replace the item
definition. See [Items and blocks](../items-and-blocks/) for complete paths.

HrajtyMC mounts mod `assets/` and `data/` automatically and supplies the pack
metadata appropriate for Minecraft 26.3. A mod does not need its own
`pack.mcmeta`. The loader also converts its recipe format into Minecraft data;
avoid adding a second raw recipe resource at the same ID.

Continue with [mod metadata](../mod-metadata/) or
[crafting recipes](../json-recipes/).
