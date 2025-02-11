import * as fs from 'node:fs/promises';
import markdownit from 'markdown-it';
import markdownitFootnote from 'markdown-it-footnote';

// converts a Markdown file exported from Google Docs to HTML supported by the web site
// doesn't include images (there's commented out code to extract them from the Markdown,
// but grabbing them from the HTML ZIP file exported from Google Docs will get them in
// much higher quality)

const md = markdownit().use(markdownitFootnote);

let contents = await fs.readFile(`${import.meta.dirname}/in.md`, 'utf-8');

const htmlContents = await fs.readFile(`${import.meta.dirname}/in.html`, 'utf-8');
const images = [...htmlContents.matchAll(/<img alt="[^"]*" src="([^"]*)" style="width: ([0-9.]+)px; height: ([0-9.]+)px;[^"]*"[^>]*>/g)].map(
	([, src, width, height]) => ({src, width: Number(width), height: Number(height)})
);

contents = md.render(contents);

// images
let i = 0;
contents = contents.replace(/<img src="(.*?)"/g, (str, oldSrc) => {
	// n.b. these are notably worse than the ones from gdocs's HTML ZIP export
	// void fs.writeFile(`${import.meta.dirname}/images/image${i + 1}.png`, Buffer.from(oldSrc.split(',')[1], 'base64'));
	const image = images[i];
	const width = 780;
	const height = Math.round(780 * image.height / image.width);
    i++;
	return `<img src="${image.src}" width="${width}" height="${height}"`;
});

// we use different footnote syntax
contents = '<article>' + contents + '\n</article>';
contents = contents.replace('<hr class="footnotes-sep">', '</article><article class="footnotes">');
contents = contents.replace(/<\/?section(?: [^>]*)?>/g, '');

contents = contents.replace(
	/<sup class="footnote-ref"><a href="#fn([0-9]+)" id="fnref[0-9]+">[[0-9]+]<\/a><\/sup>/g,
	'<sup class="footnote"><a href="#footnote-$1" id="footnote-ref-$1">$1</a></sup>',
);
contents = contents.replace(/<ol class="footnotes-list">\s*(.*?)\s*<\/ol>/s, (str, list) => {
	return list.replace(/<li id="fn([0-9]+)" class="footnote-item"><p>/g, '<p id="footnote-$1"><sup>$1</sup> ')
		.replace(/<a href="#fnref([0-9]+)" class="footnote-backref">↩︎<\/a><\/p>\s*<\/li>/g, '<a href="#footnote-ref-$1" class="footnote-backlink">↩︎<\/a></p>');
});

contents = contents.replace(/<h([1-6])>(.*?)<\//g, (str, hNum, title) => {
	const id = title.toLowerCase().normalize('NFKD').replace(/ /g, '-').replace(/[^a-z0-9-]+/g, '');
	return `<h${hNum} id="${id}">${title}</`;
});

contents = contents.replace(/<h1/g, '</article><article><h1');
contents = contents.replace('<article></article><article>', '<article>');

// CUSTOM FOR OUR OWN PAPER
contents = contents.replace(/<a target="_blank" href="[^"]*"><code>https:\/\/pepfar.k55.io\/([a-z0-9-]*)<\/code><\/a>/g, (str, linkId) => {
	let title;
	switch (linkId) {
	case 'subscribe':
		return '<iframe src="https://docs.google.com/forms/d/e/1FAIpQLScGE2AdcYWkRFIhBmW47y9JPZXBLIr6s9NFCIXyOyN-wjdNiA/viewform?embedded=true" width="100%" height="460" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>';
		break;
	case 'cost-benefit-antiretrovirals':
		title = 'Cost-Benefit Analysis: Antiretrovirals';
		break;
	case 'cost-benefit-mortality':
		title = 'Cost-Benefit Analysis: Country-Level Mortality';
		break;
	default:
		throw new Error("unrecognized minilink");
	}
	return `<a class="button" href="/${linkId}" target="_blank">${title}</a>`;
});

contents = contents.replace(/<img src="([^"]*)" width="([^"]*)" height="([^"]*)" alt="([^"]*)">/g, (str, src, w, h, alt) => {
	return `<img src="/${src}" width="${w}" height="${h}" alt="${alt}" style="object-fit:contain;max-width:100%">`;
});

console.log('writing out...');
await fs.writeFile(`${import.meta.dirname}/out.html`, contents, 'utf-8');

console.log('replacing index...');
const oldIndex = await fs.readFile(`${import.meta.dirname}/../index.html`, 'utf-8');
await fs.writeFile(`${import.meta.dirname}/../index.html`, oldIndex.replace(/<main>.*?<\/main>/s, `<main>\n\n${contents}\n\n</main>`), 'utf-8');
