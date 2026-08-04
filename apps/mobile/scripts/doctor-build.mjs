import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "app.json",
  "babel.config.js",
  "metro.config.js",
  "index.js",
  "app/_layout.tsx",
];

function resolvePackageFromProject(id) {
  return require.resolve(id, { paths: [projectRoot] });
}

function resolveExpoCli() {
  try {
    return resolvePackageFromProject("@expo/cli/package.json");
  } catch {
    const expoPath = resolvePackageFromProject("expo/package.json");
    return require.resolve("@expo/cli/package.json", {
      paths: [path.dirname(expoPath)],
    });
  }
}

function resolveCodegen() {
  try {
    return resolvePackageFromProject("@react-native/codegen/package.json");
  } catch {
    const reactNativePath = resolvePackageFromProject("react-native/package.json");
    return require.resolve("@react-native/codegen/package.json", {
      paths: [path.dirname(reactNativePath)],
    });
  }
}

const packageResolutions = [
  { label: "@expo/cli", resolve: resolveExpoCli },
  { label: "@react-native/codegen", resolve: resolveCodegen },
  { label: "@react-native/gradle-plugin", resolve: () => resolvePackageFromProject("@react-native/gradle-plugin/package.json") },
  { label: "react-native", resolve: () => resolvePackageFromProject("react-native/package.json") },
  { label: "expo", resolve: () => resolvePackageFromProject("expo/package.json") },
];

const failures = [];

function assertFile(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

function assertPackageResolution(label, resolve) {
  try {
    const resolved = resolve();
    console.log(`[resolve] ${label}: ${resolved}`);
  } catch (error) {
    failures.push(`Unable to resolve ${label} from apps/mobile: ${error.message}`);
  }
}

for (const file of requiredFiles) {
  assertFile(file);
}

for (const pkg of packageResolutions) {
  assertPackageResolution(pkg.label, pkg.resolve);
}

const appConfigPath = path.join(projectRoot, "app.json");
if (fs.existsSync(appConfigPath)) {
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath, "utf8"));
  const expo = appConfig.expo ?? {};
  if (!expo.android?.package) {
    failures.push("app.json is missing expo.android.package");
  }
  if (!expo.ios?.bundleIdentifier) {
    failures.push("app.json is missing expo.ios.bundleIdentifier");
  }
}

if (failures.length > 0) {
  console.error("\n[doctor:build] Mobile build validation failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\n[doctor:build] Mobile build validation passed.");
