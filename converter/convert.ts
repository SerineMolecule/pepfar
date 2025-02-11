import * as fs from 'node:fs/promises';
import markdownit from 'markdown-it';
import markdownitFootnote from 'markdown-it-footnote';

// converts a Markdown file exported from Google Docs to HTML supported by the web site
// doesn't include images (there's commented out code to extract them from the Markdown,
// but grabbing them from the HTML ZIP file exported from Google Docs will get them in
// much higher quality)

const md = markdownit().use(markdownitFootnote);

let contents = await fs.readFile(`${import.meta.dirname}/in.md`, 'utf-8');

contents = md.render(contents);

// images
let i = 0;
contents = contents.replace(/<img src="(.*?)"/g, (str, oldSrc) => {
	// n.b. these are notably worse than the ones from gdocs's HTML ZIP export
	// void fs.writeFile(`${import.meta.dirname}/images/image${i + 1}.png`, Buffer.from(oldSrc.split(',')[1], 'base64'));
	const src = `images/image${i + 1}.png`;
    i++;
	return `<img style="object-fit:contain;max-width:100%" src="${src}"`;
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

// contents = contents.replace(/<h1/g, '</article><article><h1');
// contents = contents.replace('<article></article><article>', '<article>');

console.log('writing out...');
await fs.writeFile(`${import.meta.dirname}/out.html`, contents, 'utf-8');

console.log('replacing index...');
const oldIndex = await fs.readFile(`${import.meta.dirname}/../index.html`, 'utf-8');
await fs.writeFile(`${import.meta.dirname}/../index.html`, oldIndex.replace(/<main>.*?<\/main>/s, `<main>\n\n${contents}\n\n</main>`), 'utf-8');
