---
title: Mod metadata
description: Define a mod's identity, entrypoint, environment and dependencies.
section: Reference
---

Every mod JAR contains one UTF-8 `hrajty.mod.json` at its root. In the template,
edit `src/main/resources/hrajty.mod.json`.

```json
{
  "schemaVersion": 1,
  "id": "mymod",
  "version": "1.0.0",
  "name": "My Mod",
  "description": "A small HrajtyMC content mod.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "com.example.mymod.ExampleMod",
  "depends": {
    "minecraft": "26.3",
    "hrajtymc": ">=0.1.0-alpha.2"
  }
}
```

## Fields

| Field | Meaning |
|---|---|
| `schemaVersion` | Required number `1`. |
| `id` | Stable ID, 1–64 characters, matching `[a-z][a-z0-9_-]{0,63}`. |
| `version` | The mod's version, such as `1.0.0`. |
| `name` | Display name in the Mods screen. |
| `description` | Optional human-readable description. |
| `authors` | Array of author names. |
| `environment` | `both`, `client`, or `server`. |
| `entrypoint` | Fully qualified class implementing `HrajtyMod`, with a public no-argument constructor. |
| `depends` | Required dependency IDs mapped to version constraints. |

All listed fields except `description` are required. The IDs `minecraft` and
`hrajtymc` are reserved. Keep a published mod's ID stable: it also determines its
content namespace.

## Environments

`both` loads in the player process and dedicated server process. Use it for
items, blocks and recipes, and install the mod on both sides of multiplayer.

`client` and `server` select only the corresponding process. In the current
public API, side-only mods can initialize and log, but cannot register shared
items, blocks or recipes. Singleplayer runs in `Environment.CLIENT`.

## Dependencies

Always declare `minecraft` and `hrajtymc`. Add another mod's ID when your mod
requires it:

```json
"depends": {
  "minecraft": "26.3",
  "hrajtymc": ">=0.1.0-alpha.2",
  "anothermod": ">=1.0.0 <2.0.0"
}
```

Constraints support exact versions with an optional `=`, comparisons `>`, `>=`,
`<`, `<=`, caret `^`, tilde `~`, and wildcards such as `1.x`, `1.2.*` or `*`.
Whitespace or a comma combines constraints with AND; `||` means OR. Hyphen
ranges are unsupported.

Prereleases sort before the matching stable version. `>=0.1.0` does not accept
`0.1.0-alpha.2`; declare the alpha minimum explicitly for the current release.

Required dependencies initialize before their dependants. Missing or
incompatible dependencies, duplicate mod IDs and dependency cycles stop loading
with a diagnostic. An environment-ineligible mod does not satisfy a dependency
in that process.

The SDK includes `docs/hrajty-mod.schema.json` for structural editor validation.
See [Project structure](../project-structure/) for packaging and
[Troubleshooting](../troubleshooting/) for loading errors.
