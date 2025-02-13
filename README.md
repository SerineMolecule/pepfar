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

If you want to join [the essay meta](https://davekasten.substack.com/p/welcome-to-the-essay-meta),
forking this repo might be quite a nice starting point.

## License

Dual-licensed under MIT and CC-BY-4.0.

## Unusual tech choices FAQ

Q: Where are `<html>`, `<head>`, and `<body>`?

A: Those are technically optional.

Q: Why is the CSS and JS embedded?

A: Fewer requests, faster loading. It's not like we have multiple pages
to cache styles/scripts for. Splitting up the JS also lets dark mode be
chosen instantly, so it doesn't flash white while loading.

Q: Sidenotes, tooltips, table of contents highlighting the active
heading... you know there are libraries for that?

A: Vanilla JS makes for a very tiny download and therefore a very fast-
loading site. (Besides the embeds, nothing I can do about those, but
you don't need those to start reading.)

I'm aware that this isn't great for maintainability, but for a site
like this, I think it's the right trade-off.
