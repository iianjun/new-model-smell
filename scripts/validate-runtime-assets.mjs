import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import validator from "gltf-validator";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const runtimeAssetRoot = resolve(repositoryRoot, "public/assets/runtime");
const metricsPath = resolve(
  repositoryRoot,
  "assets/runtime-asset-metrics.generated.json",
);
const shouldUpdateMetrics = process.argv.includes("--update");

async function findGlbFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);

      if (entry.isDirectory()) {
        return findGlbFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".glb")
        ? [entryPath]
        : [];
    }),
  );

  return files.flat().sort();
}

async function readAdjacentResource(assetPath, resourceUri) {
  const assetDirectory = dirname(assetPath);
  const resourcePath = resolve(
    assetDirectory,
    decodeURIComponent(resourceUri),
  );
  const relativeResourcePath = relative(assetDirectory, resourcePath);

  if (
    relativeResourcePath.startsWith("..") ||
    isAbsolute(relativeResourcePath)
  ) {
    throw new Error(
      `Runtime GLB resource escapes its asset directory: ${resourceUri}`,
    );
  }

  return new Uint8Array(await readFile(resourcePath));
}

async function measureAsset(assetPath) {
  const report = await validator.validateBytes(
    new Uint8Array(await readFile(assetPath)),
    {
      externalResourceFunction: (resourceUri) =>
        readAdjacentResource(assetPath, resourceUri),
      maxIssues: 0,
      uri: relative(repositoryRoot, assetPath),
      writeTimestamp: false,
    },
  );
  const errors = report.issues.messages.filter(
    (message) => message.severity === 0,
  );

  if (errors.length > 0) {
    throw new Error(
      [
        `${relative(repositoryRoot, assetPath)} failed Khronos validation:`,
        ...errors.map(
          (error) =>
            `${error.code} ${error.pointer ?? ""} — ${error.message}`,
        ),
      ].join("\n"),
    );
  }

  return {
    path: relative(repositoryRoot, assetPath),
    bytes: (await stat(assetPath)).size,
    drawCalls: report.info.drawCallCount,
    vertices: report.info.totalVertexCount,
    triangles: report.info.totalTriangleCount,
    warnings: report.issues.numWarnings,
    infos: report.issues.numInfos,
    issueCodes: [
      ...new Set(report.issues.messages.map((message) => message.code)),
    ].sort(),
  };
}

const assetPaths = await findGlbFiles(runtimeAssetRoot);
const metrics = {
  schemaVersion: 1,
  validatorVersion: validator.version(),
  assets: await Promise.all(assetPaths.map(measureAsset)),
};
const serializedMetrics = `${JSON.stringify(metrics, null, 2)}\n`;

if (shouldUpdateMetrics) {
  await writeFile(metricsPath, serializedMetrics);
  console.log(
    `Updated ${relative(repositoryRoot, metricsPath)} for ${assetPaths.length} GLBs.`,
  );
} else {
  const expectedMetrics = await readFile(metricsPath, "utf8");

  if (expectedMetrics !== serializedMetrics) {
    console.error(
      "Runtime GLB metrics changed. Run `pnpm assets:measure`, review the diff, and commit the updated record.",
    );
    process.exitCode = 1;
  }
}

console.table(
  metrics.assets.map(({ issueCodes, ...asset }) => ({
    ...asset,
    issueCodes: issueCodes.join(","),
  })),
);
