SCRATCH VARIABLE STUDIO v0.7.0
Standalone Opera GX / Chromium Manifest V3 extension

V0.7 BUG-FIX RELEASE
- Onion skin now uses a genuine DOM snapshot of the original Scratch variable monitor, captured before SVS changes or hides the monitor's native contents. This preserves the original label, value, shape and styling as an editing reference.
- Onion skin is enabled by default and starts at 35% opacity. Its opacity cannot be reduced below 30%.
- Added an explicit "Refresh original monitor reference" control and a status message showing whether the selected native monitor was detected.
- Fixed a major selection bug: canvas selection had been blocked whenever drawing mode was open. Selecting a layer now makes the drawing canvas pointer-transparent, allowing a click on the artwork to select and drag that component without closing drawing mode.
- Moved the text controls above the canvas so the entry field is visible when the Text tool is selected. Selecting Text now focuses the entry field.
- Added an "Add text at centre" button as an alternative to click-to-place. Both methods create independent editable vector layers.
- Existing designs migrate from v0.6, v0.5, v0.4, v0.3 and v0.2 into a fresh v0.7 localStorage key.

INSTALLATION
1. Disable/remove the older SVS version in opera://extensions.
2. Extract this ZIP to a permanent folder.
3. Open opera://extensions and enable Developer mode.
4. Choose Load unpacked.
5. Select the extracted SVS-v0.7.0 folder (the one containing manifest.json).
6. Refresh the Scratch project page.
7. Make the original variable monitor visible using the Data category checkbox in Scratch.
8. Open SVS, create/edit a variable costume, select the variable, and leave monitor binding on Auto-match or choose the matching monitor.

ONION SKIN
- The original Scratch monitor is cloned before SVS applies its replacement style. The clone is shown inside the costume editor only; it is not saved as part of the costume.
- Onion skin is enabled by default at 35%. The range is 30–80%.
- If the reference is not detected, keep the matching Scratch monitor visible, confirm the selected variable and use Refresh original monitor reference.
- A status line reports whether SVS located the original monitor. If Scratch changes its internal monitor DOM, the reference may need a compatibility update.

EDITOR
- Import PNG, JPEG, WebP or safe self-contained SVG. PNG alpha transparency is preserved.
- Draw brush strokes, lines, rectangles, ellipses and text. Every finished item is a separate SVG vector object/layer.
- Choose Text, type in the visible field above the canvas, then click the canvas to position the text. Alternatively choose "Add text at centre" to insert it at the costume centre.
- Select / move remains available while drawing mode is open. Choose the arrow tool, then click and drag a component. Layer-list selection also works.
- Press Delete/Backspace to remove only the selected layer. Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) undo/redo individual object additions and removals.
- The eraser removes the topmost vector object under the cursor; imported image layers should be selected and deleted from the layer list.
- Set where the live variable value appears on the original monitor. Choose a preset or custom X/Y position, then choose size, colour and outline.
- Layer properties include position, size, rotation, scale, opacity, visibility, ordering, copy/paste and variable mappings.
- Programmable costumes accept JavaScript returning an object such as {parts:[{rotation:0},{x:20}], text:value}. Context variables include value, previousValue, delta, elapsed, min, max, clamp(), abs(), sqrt(), sin(), cos(), tan(), PI.
- C-style syntax is a limited C-like subset translated to JavaScript, not native C compilation.

MONITOR INTEGRATION NOTES
Scratch's existing variable monitor remains the host object. SVS applies the rendered costume to that monitor's DOM root and hides its normal inner label/value. It does not create a sprite or separate Stage object. The monitor must already exist and be visible in Scratch.

DATA / PRIVACY
- Designs are stored in this browser's localStorage. Nothing is uploaded to a server.
- v0.7 reads prior v0.6, v0.5, v0.4, v0.3 and v0.2 design stores and writes to a new v0.7 store.
- Imported images are limited to 2 MB each. Browser localStorage quota may limit large collections of assets.
- Programmable JavaScript is evaluated in the Scratch page context. Only run code you wrote or understand.

LIMITATIONS
- SVS is a browser extension that customises the existing Scratch monitor DOM. It is not a native Scratch feature and is not embedded in exported .sb3 projects.
- Scratch GUI internals can change. Monitor matching and the native DOM snapshot depend on the current Scratch editor DOM and still require live testing in Opera GX.
- The C-style option is not a full C compiler.

Scratch Variable Studio is an independent community prototype, not affiliated with or endorsed by Scratch.
