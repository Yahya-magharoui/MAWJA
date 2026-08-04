import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildGradlePath = path.join(projectRoot, "android", "app", "build.gradle");

if (!fs.existsSync(buildGradlePath)) {
  console.error(`[doctor:android-gradle] Missing file: ${buildGradlePath}`);
  process.exit(1);
}

let text = fs.readFileSync(buildGradlePath, "utf8");

const reactBlockPattern = /react\s*\{[\s\S]*?^\}/m;
const explicitReactBlock = `react {
    root = file("../..")
    reactNativeDir = file("../../node_modules/react-native")
    codegenDir = file("../../node_modules/@react-native/codegen")
    cliFile = file("../../node_modules/@expo/cli/build/bin/cli")
    entryFile = file("../index.js")
    bundleCommand = "export:embed"
    hermesCommand = "../../node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
}`;

const reactMatches = text.match(reactBlockPattern);
if (!reactMatches) {
  console.error("[doctor:android-gradle] Could not find react { ... } block in android/app/build.gradle");
  process.exit(1);
}

text = text.replace(reactBlockPattern, explicitReactBlock);
text = text.replace(/^[ \t]*[A-Za-z0-9_.]+[ \t]*=[ \t]*file\((['"])\1\)[ \t]*\n?/gm, "");

fs.writeFileSync(buildGradlePath, text);

console.log(`[doctor:android-gradle] Normalized ${buildGradlePath}`);
