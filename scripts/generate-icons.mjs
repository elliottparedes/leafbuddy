import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const THEME = { r: 0x15, g: 0x80, b: 0x3d };

function crc32(buf) {
	let crc = 0xffffffff;
	for (let i = 0; i < buf.length; i++) {
		crc ^= buf[i];
		for (let j = 0; j < 8; j++) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	const typeBuf = Buffer.from(type);
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
	return Buffer.concat([length, typeBuf, data, crcBuf]);
}

/** Minimal valid solid-color PNG (no external deps). */
function createSolidPng(size, { r, g, b }) {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;

	const rowLen = 1 + size * 3;
	const raw = Buffer.alloc(rowLen * size);
	for (let y = 0; y < size; y++) {
		const offset = y * rowLen;
		raw[offset] = 0;
		for (let x = 0; x < size; x++) {
			const px = offset + 1 + x * 3;
			raw[px] = r;
			raw[px + 1] = g;
			raw[px + 2] = b;
		}
	}

	return Buffer.concat([
		signature,
		pngChunk('IHDR', ihdr),
		pngChunk('IDAT', deflateSync(raw)),
		pngChunk('IEND', Buffer.alloc(0))
	]);
}

async function tryResvg(svgPath, size) {
	try {
		const { Resvg } = await import('@resvg/resvg-js');
		const svgData = readFileSync(svgPath, 'utf8');
		const resvg = new Resvg(svgData, { fitTo: { mode: 'width', value: size } });
		return resvg.render().asPng();
	} catch {
		return null;
	}
}

const icons = [
	{ size: 192, name: 'pwa-192x192.png' },
	{ size: 512, name: 'pwa-512x512.png' },
	{ size: 180, name: 'apple-touch-icon.png' }
];

for (const { size, name } of icons) {
	const fromSvg = await tryResvg('static/favicon.svg', size);
	const png = fromSvg ?? createSolidPng(size, THEME);
	writeFileSync(`static/${name}`, png);
	console.log(`✓ static/${name} (${size}×${size})`);
}