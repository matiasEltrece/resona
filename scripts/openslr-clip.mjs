/**
 * Extrae UNOS POCOS clips de un .zip remoto de OpenSLR usando HTTP range —
 * sin bajar el archivo entero (lee el índice central del zip y trae solo los clips).
 *
 * Uso:
 *   node scripts/openslr-clip.mjs list  <zipUrl>
 *   node scripts/openslr-clip.mjs grab  <zipUrl> <speakerSubstr> <count> <outDir>
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const [, , mode, URL, spk, countArg, outDir] = process.argv;

async function range(url, start, end) {
  const headers = end == null ? { Range: `bytes=${start}` } : { Range: `bytes=${start}-${end}` };
  const r = await fetch(url, { headers });
  if (!(r.status === 206 || r.status === 200)) throw new Error(`range ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
async function size(url) {
  const r = await fetch(url, { method: "HEAD" });
  return Number(r.headers.get("content-length"));
}

async function readCentralDir(url) {
  const total = await size(url);
  const tailLen = Math.min(131072, total);
  const tail = await range(url, total - tailLen, total - 1);
  // EOCD sig 0x06054b50
  let eo = -1;
  for (let i = tail.length - 22; i >= 0; i--) { if (tail.readUInt32LE(i) === 0x06054b50) { eo = i; break; } }
  if (eo < 0) throw new Error("no EOCD");
  let cdSize = tail.readUInt32LE(eo + 12);
  let cdOff = tail.readUInt32LE(eo + 16);
  let entries = tail.readUInt16LE(eo + 10);
  // ZIP64 si hay marcadores 0xFFFFFFFF
  if (cdOff === 0xffffffff || entries === 0xffff) {
    let z = -1;
    for (let i = eo - 20; i >= 0; i--) { if (tail.readUInt32LE(i) === 0x07064b50) { z = i; break; } } // ZIP64 locator
    if (z < 0) throw new Error("ZIP64 locator no encontrado");
    const z64off = Number(tail.readBigUInt64LE(z + 8));
    const z64 = await range(url, z64off, z64off + 56);
    entries = Number(z64.readBigUInt64LE(32));
    cdSize = Number(z64.readBigUInt64LE(40));
    cdOff = Number(z64.readBigUInt64LE(48));
  }
  const cd = await range(url, cdOff, cdOff + cdSize - 1);
  const list = [];
  let p = 0;
  while (p + 46 <= cd.length && cd.readUInt32LE(p) === 0x02014b50) {
    const method = cd.readUInt16LE(p + 10);
    const csize = cd.readUInt32LE(p + 20);
    const fnLen = cd.readUInt16LE(p + 28);
    const exLen = cd.readUInt16LE(p + 30);
    const cmLen = cd.readUInt16LE(p + 32);
    const lho = cd.readUInt32LE(p + 42);
    const name = cd.toString("utf8", p + 46, p + 46 + fnLen);
    list.push({ name, method, csize, lho });
    p += 46 + fnLen + exLen + cmLen;
  }
  return { entries, list, total };
}

async function fetchEntry(url, e) {
  const lh = await range(url, e.lho, e.lho + 30 - 1);
  const fnLen = lh.readUInt16LE(26), exLen = lh.readUInt16LE(28);
  const dataStart = e.lho + 30 + fnLen + exLen;
  const raw = await range(url, dataStart, dataStart + e.csize - 1);
  return e.method === 8 ? zlib.inflateRawSync(raw) : raw;
}

const { entries, list } = await readCentralDir(URL);
const wavs = list.filter((e) => e.name.toLowerCase().endsWith(".wav"));
console.log(`Entradas: ${entries} · wavs: ${wavs.length}`);

if (mode === "list") {
  for (const w of wavs.slice(0, 14)) console.log(`  ${w.name}  (${w.csize}b, m${w.method})`);
} else if (mode === "grab") {
  const count = Number(countArg) || 4;
  const pick = wavs.filter((w) => w.name.includes(spk)).slice(0, count);
  if (!pick.length) { console.error(`sin wavs que matcheen "${spk}"`); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  for (const w of pick) {
    const buf = await fetchEntry(URL, w);
    const out = path.join(outDir, path.basename(w.name));
    fs.writeFileSync(out, buf);
    console.log(`✓ ${path.basename(w.name)}  ${buf.length}b`);
  }
}
