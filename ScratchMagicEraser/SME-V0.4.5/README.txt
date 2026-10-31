SCRATCH MAGIC ERASER v0.1.0

WHAT IT DOES
- Adds a floating “✦ Magic Eraser” button on scratch.mit.edu.
- Loads a local image into a private preview canvas.
- Removes background pixels connected to the image edges, using sampled edge colours.
- Offers click-to-remove connected region mode.
- Exports a transparent PNG for importing as a Scratch costume.
- Does not upload images anywhere and does not modify a Scratch project automatically.

INSTALL (Opera GX / Chromium)
1. Extract this folder to a permanent location, e.g. Documents\ScratchMagicEraser.
2. Open opera://extensions
3. Enable Developer mode.
4. Choose “Load unpacked”.
5. Select the extracted ScratchMagicEraser folder (the one containing manifest.json).
6. Reload your Scratch project tab.

USE
1. Open your project on scratch.mit.edu.
2. Click “✦ Magic Eraser” at the lower-right.
3. Choose the original PNG/JPG/WebP image.
4. Start with tolerance 20–35 and click “Remove edge background”.
5. Inspect the image. Use Reset and reduce tolerance if car details disappear.
6. If automatic edge removal misses a patch, use “Pick a background area” and click that patch.
7. Export transparent PNG.
8. In Scratch, open Costumes → Upload Costume and select the exported PNG.

IMPORTANT LIMITATIONS
- v0.1 is a safe preprocessing panel embedded on the Scratch website, not a direct editor-canvas integration. It does not yet read or replace the currently selected costume automatically.
- Use a copy of your artwork. Inspect the result before importing.
- Connected-region removal preserves enclosed white details, but artwork touching the outside background can still be affected depending on tolerance and connectivity.
- This is an independent, locally running extension, not an official Scratch or Scratch Addons release.
