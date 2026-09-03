# Warqaa Nizar . site

A static site for Warqaa Nizar, writer and designer in Baghdad. Built from the concept
document: three pages (home, essays, designs) plus a reading page and a project page.

## Run it

```bash
node warqaa-site/serve.js
```

Then open `http://localhost:5173`. Any static host works too (Netlify, Vercel, GitHub
Pages): the whole thing is plain HTML, one stylesheet and one script, no build step.

## Files

```
index.html     home: name lockup, statement, about, two portals, contact
essays.html    all essays, sidebar filter (all / general / design)
essay.html     a single essay, khatam pattern behind a brown reading card
designs.html   project grid, filter (all / interior / architectural)
design.html    a single project, scattered plates with parallax, concept and execution
assets/css/main.css
assets/js/main.js
serve.js       local preview server
```

The header, menu, footer and the drawing sprite are copied into every page. If you edit
one of those blocks, edit it in `index.html` and copy it across, or rerun the sync script
that was used to build the pages.

## What to swap in

1. **The calligraphy.** `index.html` renders `ورقاء نزار` in Aref Ruqaa as a stand in.
   When Warqaa draws her own, export it as SVG and replace the `<h1 class="calligraphy">`
   with the inline SVG (keep the class and `data-reveal="mask"` so the wipe still plays,
   and set `fill="currentColor"` so it follows the theme).
2. **Photography.** Every image slot is a `div.plate`, a generated placeholder. Replace
   each one with `<img src="..." alt="...">` inside the same parent. The parents already
   set the aspect ratio and the hover zoom.
3. **The portrait.** In the about section, `.portrait__arch` is the arch shaped slot for
   the 2d image of her. The graphic ground behind it stays.
4. **Contact.** Only her Instagram is shown, because the email and the number are not
   decided yet. Nothing fake is on the page. When she chooses, they go in through the
   editor and the contact block shows them; a blank field stays hidden.
5. **Essays and designs.** Copy one `.essayrow` or one `.designcard` and edit it. The
   filters read `data-cat` on each item, so a new essay only needs
   `data-cat="general"` or `data-cat="design"`, and a project needs
   `data-cat="interior"` or `data-cat="architectural"`. The counters update themselves.

## Design notes

- **Palette.** Warm and earthy: bone and clay in light, near black with brown tiles in
  dark. All of it lives in the token block at the top of `main.css`, so a colour change
  is one line.
- **Type.** Cormorant Garamond for display, EB Garamond for reading, Courier Prime for
  the typewriter labels and tags, Aref Ruqaa for Arabic.
- **Graphics.** A khatam (eight point star) tessellation drawn as a CSS mask, so it
  takes the theme colour; a film grain overlay; and one hand built bloom in SVG, mirrored
  so the two flowers face each other across the name.
- **Motion.** Scroll reveals through IntersectionObserver, a mask wipe for headings, line
  by line rises for the statement, cross document view transitions between pages, a
  circular wipe out of the toggle when the theme changes, parallax on the project plates,
  and a marquee of the key ideas. Everything collapses under
  `prefers-reduced-motion: reduce`.
- **Themes.** Follows the system by default, remembers a manual choice in localStorage,
  and applies it before first paint so there is no flash.

## Browser support

Chrome, Edge, Safari 18 and Firefox render everything. Older browsers that lack view
transitions simply navigate normally; nothing else depends on them.
