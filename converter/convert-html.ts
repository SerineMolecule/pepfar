import * as fs from 'node:fs/promises';

let contents = await fs.readFile('./in.html', 'utf-8');

contents = contents.replace(/<style\b.*?<\/style>/g, '');
// none of their classes seem relevant to us
contents = contents.replace(/ class="[^"]*"/g, '');
contents = contents.replace(/<\/?span>/g, '');
contents = contents.replace(/<span style="[^"]*">/g, '');
// empty p tags seem to do nothing at all
contents = contents.replace(/<p><\/p>/g, '');
// these seem mostly useless, they don't even correspond to actual spaces in the doc
contents = contents.replace(/<br>/g, '');

// comment stuff (why is this even exported?)
contents = contents.replace(/<div><p><a href="#cmnt_ref[0-9]+".*/g, '');
contents = contents.replace(/<sup><a href="#cmnt[0-9]+" id="cmnt_ref[0-9]+">\[[a-z]+\]<\/a><\/sup>/g, '');

// only used by footnotes
// contents = contents.replace(/<div><p/g, '<p class="footnote"');
contents = contents.replace(/<\/?div>/g, '');
contents = contents.replace(/<sup>/g, '<sup class="footnote">');

// wtf google why would you put your interestitial in an export
// anyway we might as well make the links open in a new tab
contents = contents.replace(/<a href="http/g, '<a target="_blank" href="http');
// contents = contents.replace(/&amp;sa=D[^"]*"/g, '"');

contents = contents.replace(/<h([1-6])/g, '\n<h$1');
contents = contents.replace(/<p>/g, '\n<p>');
contents = contents.replace('<html><head><meta content="text/html; charset=UTF-8" http-equiv="content-type"></head><body>\n', '');

// images
contents = contents.replace(/ style="width: ([0-9.]+)px; height: ([0-9.]+)px; margin-left: 0.00px; margin-top: 0.00px; transform: rotate\(0.00rad\) translateZ\(0px\); -webkit-transform: rotate\(0.00rad\) translateZ\(0px\);"/g, ' width="$1" height="$2" style="height:auto;max-width:90vw"');

// nicer footnote IDs
contents = contents.replace(/<p><a href="#ftnt_ref([0-9]+)" id="ftnt/g, '<p id="footnote-$1"><a class="footnote-backlink" href="#footnote-ref-');
contents = contents.replace(/id="ftnt_ref/g, 'id="footnote-ref-');
contents = contents.replace(/href="#ftnt/g, 'href="#footnote-');
contents = contents.replace(/id="ftnt/g, 'id="footnote-');

contents = '<article>' + contents + '\n</article>';
contents = contents.replace('<hr>', '</article><article class="footnotes">');

contents = contents.replace(/<h([1-6]) id="[^"]+">(.*?)<\//g, (str, hNum, title) => {
	const id = title.toLowerCase().normalize('NFKD').replace(/ /g, '-').replace(/[^a-z0-9-]+/g, '');
	return `<h${hNum} id="${id}">${title}</`;
});

contents = contents.replace(/<h1/g, '</article><article><h1');
contents = contents.replace('<article></article><article>', '<article>');

fs.writeFile('./out.html', contents, 'utf-8');
