# Design findings

What surfaced while building the prototype, in rough order of how much it
matters to the Sprint 25 work.

---

## 1. Per-category rows is the right structure, and it's also less to build

Having both built and switchable, the structure agreed on 25 Aug wins on almost
every axis:

* No mode. Every category is visible and editable at once; nothing is hidden
  behind a selector, so there is no "which series am I editing?" state to hold.
* No mixed state to design. A series selector set to "Apply to all series" over
  three different shapes has to show *something* — the reference build shows
  "Mixed" and a three-color swatch, which is a new pattern CODAP does not have
  anywhere else.
* It is a strictly smaller change to the shipped panel: today's categorical
  color list already renders one row per category. This adds a second dropdown
  to each row. The series-selector model adds a new control, a new scoping
  concept and a new mixed state.
* Comparing categories is a scan down a column instead of three round trips
  through a dropdown.

What it does not have is a way to set every category at once — giving all three
a triangle is three interactions. If that turns out to matter, the cheap fix is
a single "apply to all" affordance *inside* the row list rather than adopting
the Sheets model wholesale. I would not build it until someone asks.

**Recommendation: build this.** The prototype opens on it.

## 2. Why the Sheets model is a reference and not the proposal

Beyond the extra code, it has a scoping problem that is not theoretical.

The *Series* dropdown sits at the top of *Data Points* with five controls
underneath it. But per the 25 Aug agreement, Point Size and Point Border Color
are global — they always apply to every series. So the dropdown reads like it
scopes everything below it, and it scopes Point Shape and Point Fill Color
only. A teacher who picks "water", drags Point Size, and watches the land
points grow has been actively misled.

If we ever did go this way, the fix is to **move the two global controls above
the Series dropdown** so it genuinely governs everything beneath it. Labeling
them instead — which the reference build does, via a footnote that appears once
a specific series is selected — is the weakest option: it is a caption
apologizing for a layout.

Switch *Format menu → Series selector* in the prototype to see it.

## 3. Row width is the real constraint, not row count

At the agreed 256 px, a category row is:

```
[ category name ] [ shape ▾ ] [ color ▾ ]
```

With the shape dropdown showing an icon *and* a text label ("Diamond"), the
category name is squeezed to about 55 px and "water" truncates to "wa…".
That is with three short, English, one-word categories.

Making the shape dropdown **icon-only** in the per-category rows fixes it — the
glyph is self-describing, the name is what the user actually needs to read, and
the row then fits comfortably even at 216 px. The prototype does this: icon plus
caret in the rows, icon plus label in the series selector's single full-width
control and in the open menu.

This also softens Kirk's translated-strings concern, because the shape names
(*Diamond*, *Raute*, *Ρόμβος*) never appear in the row at all — only in the open
menu, which can be as wide as it needs to be.

## 4. What 216 px vs 256 px actually costs

Labels are no longer the deciding factor. With the section headings carrying
the context — *Data Points* and *Graph* — the panel no longer has to repeat it
in every label, so *Graph Background Color* goes back to the shipped
*Background Color* and nothing truncates at either width in English.

What still differs is the **category row**, and it is measurable:

| Menu width | Row width | Shape + color controls | Left for the category name |
|---|---|---|---|
| 216 px | 196 px | 98 px | 88 px — about 11 characters |
| 256 px | 236 px | 98 px | 128 px — about 16 characters |

Eleven characters covers `land`, `water`, `plants`, `meat`. It does not cover
`Proboscidea`, `invertebrate`, `New England`, or most of what a teacher's own
column actually contains — and translated categories are longer again. That is
the argument for 256 px now, and it is a better one than the label argument was,
because it is about the user's data rather than our copy.

Worth noting the reverse: at 216 px the panel is *complete*, just tight. If Kirk
would rather not touch the width, the fallback is a tooltip on truncated names
rather than a redesign.

## 5. The scroll window really was wrong

Kate was right. Zeplin's >2-category variant shows a clipped third row. The
shipped CSS is `height: 75px` on `.cat-color-setting` against a 38 px row —
**1.97 rows**, so the third row is entirely invisible and the list gives no
signal that it scrolls. The prototype measures the row and uses
`2.5 × rowHeight`, which is a two-line change in
`display-item-format-control.scss` and is worth doing regardless of the shape
work.

Row height grows with the shape dropdown (34 px in the prototype), so this
should be computed rather than hard-coded.

**Update, 28 Aug.** This is going in as an acceptance criterion on CODAP-1506
rather than as its own bug. The 1.97-row window is a defect in shipped CODAP
today, independent of the shape work, so a standalone ticket was considered —
but CODAP-1506 rewrites this panel and the same stylesheet, so fixing it there
avoids two changes to one file.

## 6. Plus and X: fill vs border

They are filled shapes with a single outline, like the other five. That was the
25 Aug decision and it is the right one — it avoids a two-section menu and it
keeps *Border color same as fill* meaningful for all seven.

But the geometry has a consequence. A Plus has roughly **2.4× the perimeter** of
a circle of the same area. At CODAP's normal 1 px, 40 %-opacity border nobody
will notice. At the **2 px opaque red border CODAP uses for a selected point**,
a selected Plus at r=5 is more border than interior — it reads as a heavier,
larger mark than a selected circle next to it. Open the prototype’s **Shape geometry** view, the
"fill and border behavior" row, to see it at 2 px.

**Decided 28 Aug: leave it.** Kate reviewed the 2 px border on Plus and X and
is happy with it as it stands. All seven shapes keep the same 2 px selection
border — no special-casing for Plus and X, and no scaling border width with
radius. The prototype already behaves this way, so nothing changes in it.

The three options, for the record:

* **(a)** Leave it. Selection is transient and arguably *should* be loud.
  **← chosen**
* **(b)** Scale border width with radius (`max(1, r/5)`) for all shapes, which
  also fixes selected circles looking chunky at r=3.
* **(c)** Special-case Plus and X to a thinner border. Cheapest visually, worst
  for the model — it puts shape-specific logic in the styling path.

(b) is still a reasonable general improvement to CODAP's selection styling if
chunky selected circles at small radii ever come up on their own, but it is out
of scope for this work. Recorded on CODAP-1504.

## 7. Below r≈4 the pointed shapes stop working

`computePointRadius` floors at **3**, which is what a several-thousand-case
dataset gets. In the geometry sheet at r=3, Star loses its points and reads as a
blob, and Plus and X are 2 px of ink. They are distinguishable from a circle,
but barely, and the accessibility argument for shapes — "you can tell the
categories apart without color" — is not true at that size.

The Point Size slider makes this easy to see in the prototype: drag it down with
Star or X selected and watch where each shape stops being itself.

Two things worth deciding:

* Should choosing a non-circle shape **raise the minimum radius** (say to 4 or
  5)? That is a deliberate distortion of point size, which is exactly the kind
  of thing Kirk flagged, so it needs his call.
* Should the Point Shape control **warn or disable** when the current dataset
  is large enough that shapes will not be distinguishable?

Doing nothing is defensible. Doing nothing *silently* is worse than saying so.

## 8. Shape has to live where legend color lives, not on the point description

In the model, `pointColor` / `pointStrokeColor` / `pointSizeMultiplier` sit on
`DisplayItemDescriptionModel` (one value for the display), while per-category
color lives on the data configuration via
`dataConfiguration.setLegendColorForCategory()`.

Per-category shape needs the **second** of those, not the first. If shape is
added as a single value on the point description — the obvious first move, since
that is where the other point styling lives — per-category shape becomes a
retrofit later. Worth settling before the 1.5 weeks starts, because it decides
where the undo strings, the notifications (`changePointShapeNotification`) and
the v2 import/export live.

Related: v2 documents have no shape, so import needs a `circle` default, and
`v2-graph-exporter` needs to decide whether to drop shape silently or refuse.

## 9. The legend keys — and a selection behavior worth checking

The prototype can draw legend keys two ways, switchable from the prototype bar:

* **Squares** — CODAP today. A 15 × 15 color square (`keySize = 15`).
* **Shapes** — the key carries the shape as well as the color.

The shape version is a proposal nobody asked for, so treat it as a question
rather than a decision. The argument for it is the same argument that motivates
the whole feature: if shape is a second encoding channel, a legend that shows
only color does not describe the graph, and a reader who cannot separate the
three colors gets nothing from three identical squares. The argument against is
scope — it touches a component this ticket does not own, and it affects dot
plots and maps too.

**Whichever way it goes, the keys have to stay clickable.** In CODAP today the
legend key is a hit target: clicking it selects that category's cases. Both
prototype modes keep that, matching `categorical-legend.tsx` exactly:

| Action | CODAP today | Prototype |
|---|---|---|
| Click a key | `setSelectedCases(caseIds)` — replaces the selection | same |
| Shift-click a key | `selectCases(caseIds)` — adds to the selection | same |
| Selected key | `.legend-rect-selected` → black 2 px stroke | same |

### The bit for Kirk

**A second click on the same key does not deselect.** Because a plain click calls
`setSelectedCases` rather than a toggle, clicking "land" twice just re-selects
the same 27 cases — there is no way to clear the selection from the legend. Most
people expect the second click to undo the first.

This looks deliberate rather than accidental. `handleLegendKeyClick` in
`v3/src/components/data-display/components/legend/categorical-legend.tsx` has the
toggling version sitting right there, commented out:

```js
// This is breaking the graph-legend cypress test
// setOrExtendSelection(caseIds, dataConfiguration?.dataset, event.shiftKey)
if (event.shiftKey) selectCases(caseIds, dataConfiguration?.dataset)
else setSelectedCases(caseIds, dataConfiguration?.dataset)
```

So someone tried it and reverted it over a Cypress test. Worth asking Kirk
whether that was a considered decision or a stalled fix — it is unrelated to the
shape work, but if the legend key is about to become a more prominent control,
it is a good moment to settle it. **The prototype reproduces today's
behavior**, deliberately, so nobody reviews a difference we did not intend.

## 10. Fused points / bars — out of scope, but here is what it implies

Not designed, per the meeting. Two notes for Kirk's check:

* The fuse animation morphs circles to squares and then to bars. Points that are
  *already* squares have a trivial first leg; points that are stars or pluses
  need a morph target. The cheapest correct behavior is to fuse from whatever
  shape to a square, exactly as circles do today — i.e. shape is ignored once
  points are fused.
* If shape is ignored while fused, the Point Shape control should probably be
  disabled in that state, the way Point Size already is
  (`isDisabled={pointDisplayType === "bars"}`). That is a one-line change and it
  is worth adding to the ticket now.

## 11. Accessibility, and two things CODAP would inherit

The prototype was audited against WCAG 2.1 AA with measured ratios and keyboard
traversal. It passes on contrast, keyboard operation, focus visibility,
structure and target size. Two findings are not mine to fix, and both are
pre-existing in CODAP:

* **The color swatch button's border is 2.6:1 against its own fill.** WCAG
  1.4.11 asks for 3:1 on the visual boundary of a control. This is the shipped
  `color-picker-thumb` (`$charcoal-light-1` border on `$palette-hover-bg`). The
  disclosure caret does most of the work of identifying it, so the practical
  impact is small, but the new panel gives color controls more prominence, so
  it will be seen more often. A one-line token change would fix it.
* **Plotted points are not reachable by keyboard or screen reader.** The graph
  is one image with a summary label. Adding shape improves things for a
  low-vision or color-blind user who can see the plot, and does nothing for a
  screen reader user. Worth being precise about that when this feature is
  described as an accessibility improvement, because it is one for a specific
  group and not for everyone.

The accessibility case for the feature also depends on two decisions elsewhere
in this document: whether the legend carries the shape (§9), and whether the
shapes stay distinguishable at small radii (§7). If the legend keeps plain color
squares, a color-blind reader gains very little from shaped points, because
nothing tells them which shape means what.

## 12. Smaller things

* **Border color is nearly invisible today.** Unselected points draw the border
  at `strokeOpacity: 0.4`. Change *Point Border Color* from white to black on a
  default graph and the effect is subtle enough that a user may think the
  control is broken. Not caused by this work, but the new panel gives the border
  control more prominence, so it will get noticed more.
* **`Data Points` / `Graph` headings** are new to the panel. They read well,
  they make the *Series* dropdown's scope slightly clearer, and they let the
  labels underneath drop the words the heading already carries — which is how
  *Graph Background Color* got back to *Background Color*. They cost ~44 px of
  height. The prototype uses a bold 14 px label with a hairline under it.
* **The row menus have to escape the category list.** `.cat-color-setting` is a
  scroll container, so a shape or color menu rendered inside a row is clipped
  by it — in this prototype the shape menu showed one and a half options until
  the popovers were portalled to the document and positioned from the trigger's
  rect. CODAP gets this free from React Aria's `<Popover>` portal (which is why
  `inspector-panel.scss` styles `.react-aria-Popover` at the top level rather
  than nested), so it should be a non-issue in the real build — but it is worth
  a deliberate check, because the shape dropdown is the first menu CODAP will
  have opened from *inside* that scrolling list.
* **Shape is not in the v2 API surface**, so plugins that create graphs cannot
  set it. If that matters for LEADS, it needs a `graph` handler property.
* **Undo strings** — `DG.Undo.graph.changePointShape` and the redo twin need
  adding to `en-US.json5` plus every translation file.

---

## Questions to bring back

1. Confirm **per-category rows** as the structure to build. (§1, §2)
2. Is **256 px** signed off, and are truncating labels acceptable in
   translation, or do rows need to wrap? (§4)
3. **Settled 28 Aug.** Selected-point border on Plus and X — leave it at 2 px
   for all seven shapes. (§6)
4. Do we clamp the minimum point radius, or warn, when a non-circle shape is
   used on a large dataset? (§7)
5. Does per-category shape go on the data configuration alongside legend color?
   (§8) — worth confirming with Kirk before development starts.
6. Do legend keys get the shape? And should a second click on a legend key
   deselect, or is `setSelectedCases` deliberate? (§9)
7. Disable Point Shape while points are fused into bars? (§10)
8. Should the color swatch border contrast be fixed as its own ticket? (§11)
