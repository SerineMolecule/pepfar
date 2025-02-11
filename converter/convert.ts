import * as fs from 'node:fs/promises';
import markdownit from 'markdown-it';
import markdownitFootnote from 'markdown-it-footnote';

// converts a Markdown file exported from Google Docs to HTML supported by the web site
// doesn't include images (there's commented out code to extract them from the Markdown,
// but grabbing them from the HTML ZIP file exported from Google Docs will get them in
// much higher quality)

// in Google Docs, export HTML (zipped) (unzip it) and Markdown. Put `in.html` and `in.md`
// in this directory, then run this file in Node (you'll need a very recent version, like
// at least 23.3). Using Build in VS Code also works.

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

// links open in a new tab
contents = contents.replace(/<a href="http/g, '<a target="_blank" href="http');

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

let idmap = Object.create(null);
contents = contents.replace(/<h([1-6])>(.*?)<\/h/g, (str, hNum, title) => {
	const matches = title.match(/^<strong>(.*)<\/strong> {#([^}]*)}$/) || title.match(/^(.*) {#([^}]*)}$/);
	let oldId;
	if (matches) {
		[, title, oldId] = matches;
	}
	let id = title.toLowerCase().normalize('NFKD').replace(/ /g, '-').replace(/[^a-z0-9-]+/g, '');
	if (oldId) idmap[oldId] = id;
	return `<h${hNum} id="${id}">${title}</h`;
});
contents = contents.replace(/ href="#([^"]*)"/g, (str, oldId) => {
	return ` href="#${idmap[oldId] || oldId}"`;
});

contents = contents.replace(/<h1/g, '</article><article><h1');
contents = contents.replace('<article></article><article>', '<article>');

// CUSTOM FOR OUR OWN PAPER
contents = contents.replace(/<a target="_blank" href="[^"]*"><code>pepfarreport.org\/([a-z0-9-]*)<\/code><\/a>/g, (str, linkId) => {
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

// just the first article (bylines)
contents = contents.replace(/<h1 .*?<\/h1>/, ''); // original header
contents = contents.replace('<article>', '<article style="background:transparent;font-size:12pt;margin:-8px 0"><div class="byline">');
contents = contents.replace('</article>', `</div><p><a class="button" href="pepfar-summary.pdf">Executive summary (PDF)</a> <a class="button" href="pepfar-report.pdf">Full essay (PDF)</a></p>
</article>`);

contents = contents.replace(/<img src="([^"]*)" width="([^"]*)" height="([^"]*)" alt="([^"]*)">/g, (str, src, w, h, alt) => {
	if (src === 'images/image1.png') {
		return '<div class="owid fullwidth"><iframe src="https://ourworldindata.org/grapher/hiv-death-rates?tab=chart&country=~OWID_WRL" loading="lazy" style="width: 100%; height: 600px; border: 0px none;" allow="web-share; clipboard-write"></iframe></div>';
	}
	if (src === 'images/image10.png') {
		return '<div class="owid fullwidth"><iframe src="https://ourworldindata.org/grapher/deaths-from-hiv-by-age?tab=chart" loading="lazy" style="width: 100%; height: 600px; border: 0px none;" allow="web-share; clipboard-write"></iframe></div>';
	}
	return `<div class="fullwidth"><img src="/${src}" width="${w}" height="${h}" alt="${alt}" style="object-fit:contain;max-width:100%"></div>`;
});
contents = contents.replace('<table', '<div class="fullwidth"><table');
contents = contents.replace('</table>', '</table></div>');

contents = contents.replace(/<p>(In the end, America is idealistic because it is the creation of an ideal[^<]*)<\/p>\s<p>([^<]*)<\/p>/, '<blockquote>\n<p>$1</p>\n<p>$2</p>\n</blockquote>');
contents = contents.replace(/<p>(One person from a rural area.*?)<\/p>/, '<blockquote>\n<p>$1</p>\n</blockquote>');

console.log('writing out...');
await fs.writeFile(`${import.meta.dirname}/out.html`, contents, 'utf-8');

console.log('replacing index...');
const oldIndex = await fs.readFile(`${import.meta.dirname}/../index.html`, 'utf-8');
await fs.writeFile(`${import.meta.dirname}/../index.html`, oldIndex.replace(/<main>.*?<\/main>/s, `<main>\n\n${contents}\n\n</main>`), 'utf-8');
