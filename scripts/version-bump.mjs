// npm's version lifecycle has already updated package.json before this runs.
import { readFileSync, writeFileSync } from "node:fs";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const { version } = readJson("package.json");
const manifest = readJson("manifest.json");
const bundledManifest = readJson("obsidian_local_images_plus_latest/manifest.json");
const versions = readJson("versions.json");
manifest.version = version;
bundledManifest.version = version;
versions[version] = manifest.minAppVersion;
writeJson("manifest.json", manifest);
writeJson("obsidian_local_images_plus_latest/manifest.json", bundledManifest);
writeJson("versions.json", versions);
