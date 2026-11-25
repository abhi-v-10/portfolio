# Environment assets

| File | Source | Author | Licence | Size | Notes |
|---|---|---|---|---|---|
| `studio_small_09_1k.hdr` | https://polyhaven.com/a/studio_small_09 (downloaded 2026-11-25 from `dl.polyhaven.org/.../1k/studio_small_09_1k.hdr`) | Sergej Majboroda | CC0 1.0 | 1.5 MB (1,615,248 bytes), 1024 x 512 RGBE | Image-based lighting for every physical material; prefiltered at runtime with PMREM. 1k is the smallest published size and is enough for blurred reflections. |

All other textures (brushed grain, contact shadows, device screens) are generated procedurally in code; no other third-party assets are shipped.

## GLB / model assessment (2026-11-25)

Poly Haven's CC0 model library (522 models, queried 2026-11-25) was searched for the objects the site needs: a modern laptop, a phone, an industrial robot arm, editorial photo frames and machined sculpture. The closest matches (`classic_laptop`, a vintage notebook; `fancy_picture_frame_01/02`, ornate gilt frames; `desk_lamp_arm_01`, a domestic lamp) do not fit the era or the brief, and no other CC0 source with direct, account-free downloads offered better matches. The robot arm, devices, photo prints, Engineering assembly and Curiosity model are therefore built procedurally (`experience/world/materials.ts`, `parts.ts`, `machined.ts`) with real construction and physical materials. No GLB files are shipped. If a licensed GLB is supplied later, load it with GLTFLoader, traverse it to set shadows and the shared PBR finishes, and compress it with Draco or meshopt before adding it here with its source, licence and size.
