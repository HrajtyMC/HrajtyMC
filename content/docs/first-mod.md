---
title: Your first mod
description: Build and load a Java mod using the public HrajtyMC SDK.
section: Mod development
---

You need a **Java 25 JDK**, an editor, and the HrajtyMC SDK from the
[download page](/HrajtyMC/download/). The public `hrajtymc-api.jar` is the only
HrajtyMC compile-time dependency needed by the template.

## Open the template

Extract the SDK and keep its API JAR beside the `mod-template` directory:

```text
HrajtyMC-SDK\
  hrajtymc-api.jar
  mod-template\
    build.ps1
    build.bat
    src\
```

Open `mod-template` in your editor. The entrypoint is
`src/main/java/com/example/mymod/ExampleMod.java`:

```java
package com.example.mymod;

import studio.hrajto.hrajtymc.api.HrajtyMod;
import studio.hrajto.hrajtymc.api.ModContext;

public final class ExampleMod implements HrajtyMod {
    @Override
    public void onInitialize(ModContext context) {
        context.logger().info("Hello from " + context.modId());
    }
}
```

HrajtyMC constructs the entrypoint and calls it once during content
initialization. Keep a public no-argument constructor; the example has one
implicitly.

## Describe the mod

Edit `src/main/resources/hrajty.mod.json`:

```json
{
  "schemaVersion": 1,
  "id": "mymod",
  "version": "1.0.0",
  "name": "My Mod",
  "description": "My first HrajtyMC mod.",
  "authors": ["Your name"],
  "environment": "both",
  "entrypoint": "com.example.mymod.ExampleMod",
  "depends": {
    "minecraft": "26.3",
    "hrajtymc": ">=0.1.0-alpha.2"
  }
}
```

The entrypoint must match the Java package and class exactly. If you rename the
mod, update its metadata and use its new ID as the namespace for its content.

## Build and run

From the template directory, point `JAVA_HOME` at your installed JDK if needed:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-25'
.\build.ps1
```

The script finds the SDK's API JAR automatically. For another location, use
`.\build.ps1 -ApiJar C:\SDK\hrajtymc-api.jar`. Add the API JAR as a dependency in
your editor as well, so it can resolve imports.

Copy `build/mymod-1.0.0.jar` into your installed HrajtyMC instance's `mods` folder
and restart Minecraft. Open **Mods** to check the metadata, then inspect
`logs/hrajtymc.log` for the initialization message. Do not bundle the API or loader
classes inside the mod JAR.

Next, [register items and blocks](../items-and-blocks/) and add
[JSON recipes](../json-recipes/). The unmodified template contains no gameplay
content or recipes; it is a small working starting point.

To add events, commands, persistent records, networking or item use, follow the
[Gameplay API guide](../gameplay-api/) and require `>=0.1.0-alpha.4` in metadata.
The SDK's `examples/ruby/` contains a complete buildable example of these services.

For a small first gameplay feature, [create an edible item](../food-and-durability/).
That tutorial includes the Java class, metadata, item/model files, translation,
crafting recipe and in-game test steps.
