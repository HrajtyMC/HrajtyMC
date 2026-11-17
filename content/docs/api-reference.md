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
| `Logger logger()` | A `java.util.logging.Logger` for diagnostics. |

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
| `ItemDefinition` | `(int maxStackSize)`, from 1 to 64. No-argument constructor and `simple()` use 64. |
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

## Current scope

The public content API covers plain items, cube blocks and crafting recipes.
This release does not expose general event hooks, mob or world-generation
registration, custom screens, block entities, or a general transformation API.
Start with [Your first mod](../first-mod/) for a complete buildable entrypoint.
