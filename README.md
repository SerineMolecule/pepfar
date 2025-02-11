# PEPFAR Report

Code for [`pepfarreport.org`](https://pepfarreport.org)

This is several things:

- the pepfar essay
- some CSS and JS to make an essay super readable (dark mode, heading nav,
  sidenote-style footnotes)
- a conversion script from Google Docs to aforementioned essay format
  (see `converter/convert.ts` for usage)

I don't think I ever saw an off-the-shelf solution that makes some text
maximally readable. I'm a person who is kinda NIH about things, because
for a lot of these things it's easier to rewrite than to take an existing
solution and customize it for my needs, and it also ends up a lot more
lightweight, too! Who needs React when I can make tooltips in 50 lines
of vanilla JS?

So yeah, vanilla JS, optimized very much for an absolutely tiny download.
(Besides the embeds, nothing I can do about those.) If you want to host
your own essays, this is probably not a bad starting point.
