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

      return entry.isFile() && entry.name.endsWith(".glb") ? [entryPath] : [];
    }),
  );

  return files.flat().sort();
}

const ACCESSOR_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
};
const COMPONENT_BYTES = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};

function readComponent(buffer, offset, componentType) {
  switch (componentType) {
    case 5120:
      return buffer.readInt8(offset);
    case 5121:
      return buffer.readUInt8(offset);
    case 5122:
      return buffer.readInt16LE(offset);
    case 5123:
      return buffer.readUInt16LE(offset);
    case 5125:
      return buffer.readUInt32LE(offset);
    case 5126:
      return buffer.readFloatLE(offset);
    default:
      throw new Error(`Unsupported GLB accessor component: ${componentType}`);
  }
}

function parseGlb(buffer) {
  if (buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error("Runtime geometry validation requires a binary GLB");
  }

  let offset = 12;
  let json;
  let binary;

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + chunkLength);

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(chunk.toString("utf8").trim());
    } else if (chunkType === 0x004e4942) {
      binary = chunk;
    }

    offset += 8 + chunkLength;
  }

  if (!json || !binary) {
    throw new Error("Runtime GLB must contain JSON and binary chunks");
  }

  return { binary, json };
}

function readAccessor({ binary, json }, accessorIndex) {
  const accessor = json.accessors?.[accessorIndex];

  if (!accessor) {
    throw new Error(`GLB accessor ${accessorIndex} is missing`);
  }
  if (accessor.sparse) {
    throw new Error(
      `GLB accessor ${accessorIndex} uses unsupported sparse storage`,
    );
  }

  const bufferView = json.bufferViews?.[accessor.bufferView];
  const componentCount = ACCESSOR_COMPONENTS[accessor.type];
  const componentBytes = COMPONENT_BYTES[accessor.componentType];

  if (!bufferView || !componentCount || !componentBytes) {
    throw new Error(`GLB accessor ${accessorIndex} has unsupported storage`);
  }
  if (bufferView.buffer !== 0) {
    throw new Error(`GLB accessor ${accessorIndex} is not embedded`);
  }

  const start = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = bufferView.byteStride ?? componentCount * componentBytes;

  return Array.from({ length: accessor.count }, (_, elementIndex) =>
    Array.from({ length: componentCount }, (_, componentIndex) =>
      readComponent(
        binary,
        start + elementIndex * stride + componentIndex * componentBytes,
        accessor.componentType,
      ),
    ),
  );
}

function positionKey(position) {
  return position
    .map((component) => Number(component).toPrecision(9))
    .join(",");
}

function findDuplicateTriangles(buffer) {
  const glb = parseGlb(buffer);
  const duplicates = [];

  for (const [meshIndex, mesh] of (glb.json.meshes ?? []).entries()) {
    const seenTriangles = new Map();

    for (const [primitiveIndex, primitive] of (
      mesh.primitives ?? []
    ).entries()) {
      if ((primitive.mode ?? 4) !== 4) {
        continue;
      }

      const positionAccessor = primitive.attributes?.POSITION;

      if (positionAccessor === undefined) {
        continue;
      }

      const positions = readAccessor(glb, positionAccessor);
      const indices =
        primitive.indices === undefined
          ? positions.map((_, index) => [index])
          : readAccessor(glb, primitive.indices);

      for (
        let triangleOffset = 0;
        triangleOffset + 2 < indices.length;
        triangleOffset += 3
      ) {
        const triangle = indices
          .slice(triangleOffset, triangleOffset + 3)
          .map(([index]) => positions[index])
          .map(positionKey)
          .sort()
          .join("|");
        const existing = seenTriangles.get(triangle);

        if (existing) {
          duplicates.push(
            `mesh ${meshIndex} primitive ${primitiveIndex} triangle ${triangleOffset / 3} duplicates ${existing}`,
          );
        } else {
          seenTriangles.set(
            triangle,
            `primitive ${primitiveIndex} triangle ${triangleOffset / 3}`,
          );
        }
      }
    }
  }

  return duplicates;
}

async function readAdjacentResource(assetPath, resourceUri) {
  const assetDirectory = dirname(assetPath);
  const resourcePath = resolve(assetDirectory, decodeURIComponent(resourceUri));
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
  const assetBuffer = await readFile(assetPath);
  const report = await validator.validateBytes(new Uint8Array(assetBuffer), {
    externalResourceFunction: (resourceUri) =>
      readAdjacentResource(assetPath, resourceUri),
    maxIssues: 0,
    uri: relative(repositoryRoot, assetPath),
    writeTimestamp: false,
  });
  const errors = report.issues.messages.filter(
    (message) => message.severity === 0,
  );

  if (errors.length > 0) {
    throw new Error(
      [
        `${relative(repositoryRoot, assetPath)} failed Khronos validation:`,
        ...errors.map(
          (error) => `${error.code} ${error.pointer ?? ""} — ${error.message}`,
        ),
      ].join("\n"),
    );
  }

  const duplicateTriangles = findDuplicateTriangles(assetBuffer);

  if (duplicateTriangles.length > 0) {
    throw new Error(
      [
        `${relative(repositoryRoot, assetPath)} contains coplanar duplicate triangles:`,
        ...duplicateTriangles,
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
