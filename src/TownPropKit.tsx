import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TOWN_RUNTIME_ASSETS } from "./assetCatalog";
import { MOTOR_TOWN_SURFACE } from "./visualLanguage";

type TownRuntimeAssetKey = keyof typeof TOWN_RUNTIME_ASSETS;
type PreparedTownAssets = Record<TownRuntimeAssetKey, Object3D>;

const TOWN_RUNTIME_ASSET_ENTRIES = Object.entries(TOWN_RUNTIME_ASSETS) as [
  TownRuntimeAssetKey,
  string,
][];
const TOWN_RUNTIME_ASSET_URLS = TOWN_RUNTIME_ASSET_ENTRIES.map(
  ([, url]) => url,
);

type PropTransform = {
  position: [number, number, number];
  rotation: number;
};

export const TOWN_BUILDING_KIT = {
  "building-a": {
    assetKey: "buildingTypeA",
    colliderSize: [1.3, 0.84, 1.03],
  },
  "building-b": {
    assetKey: "buildingTypeB",
    colliderSize: [1.83, 1.14, 1.14],
  },
} as const;

export type TownBuildingKind = keyof typeof TOWN_BUILDING_KIT;

export type TownBuildingTransform = PropTransform & {
  kind: TownBuildingKind;
  scale: number;
};

export type TownRoadSegment = {
  end: readonly [x: number, z: number];
  start: readonly [x: number, z: number];
  width?: number;
};

export type TownTreeTransform = PropTransform & {
  kind: "large" | "small";
  scale: number;
};

function prepareSharedAsset(source: Object3D) {
  source.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const material of materials) {
      if (material instanceof MeshStandardMaterial) {
        material.flatShading = true;
        material.metalness = MOTOR_TOWN_SURFACE.enamelMetalness;
        material.roughness = MOTOR_TOWN_SURFACE.matteRoughness;
        material.needsUpdate = true;
      }
    }
  });

  return source;
}

function SharedAssetInstance({
  position,
  rotation,
  scale,
  source,
}: PropTransform & {
  scale: number | [number, number, number];
  source: Object3D;
}) {
  // Object nodes must have one parent, while clone(true) intentionally keeps
  // the cached geometry and materials shared across every repeated prop.
  const instance = useMemo(() => source.clone(true), [source]);

  return (
    <primitive
      dispose={null}
      object={instance}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
    />
  );
}

export function TownPropKit({
  buildings,
  roadClosures,
  roads,
  trees,
}: {
  buildings: readonly TownBuildingTransform[];
  roadClosures: readonly PropTransform[];
  roads: readonly TownRoadSegment[];
  trees: readonly TownTreeTransform[];
}) {
  const loadedAssets = useLoader(GLTFLoader, TOWN_RUNTIME_ASSET_URLS);
  const assets = useMemo(
    () =>
      Object.fromEntries(
        TOWN_RUNTIME_ASSET_ENTRIES.map(([key], index) => {
          const loadedAsset = loadedAssets[index];

          if (!loadedAsset) {
            throw new Error(`Town runtime asset failed to load: ${key}`);
          }

          return [key, prepareSharedAsset(loadedAsset.scene)];
        }),
      ) as PreparedTownAssets,
    [loadedAssets],
  );

  return (
    <group name="kenney-town-kit">
      <group name="kenney-roads">
        {roads.map(({ end, start, width = 4.1 }) => {
          const deltaX = end[0] - start[0];
          const deltaZ = end[1] - start[1];
          const length = Math.hypot(deltaX, deltaZ);

          return (
            <SharedAssetInstance
              key={`${start[0]}-${start[1]}-${end[0]}-${end[1]}`}
              position={[
                (start[0] + end[0]) / 2,
                0.035,
                (start[1] + end[1]) / 2,
              ]}
              rotation={Math.atan2(deltaX, deltaZ)}
              scale={[width, 1, length]}
              source={assets.roadStraight}
            />
          );
        })}
      </group>

      <group name="kenney-road-closures">
        {roadClosures.map((closure) => (
          <group
            key={`${closure.position[0]}-${closure.position[2]}`}
            position={closure.position}
            rotation={[0, closure.rotation, 0]}
          >
            {[-1.1, 1.1].map((x) => (
              <SharedAssetInstance
                key={`barrier-${x}`}
                position={[x, 0.02, 0]}
                rotation={Math.PI / 2}
                scale={8}
                source={assets.constructionBarrier}
              />
            ))}
            {[-2.15, 0, 2.15].map((x) => (
              <SharedAssetInstance
                key={`cone-${x}`}
                position={[x, 0.02, 0.58]}
                rotation={0}
                scale={8}
                source={assets.constructionCone}
              />
            ))}
          </group>
        ))}
      </group>

      <group name="kenney-background-buildings">
        {buildings.map((building) => (
          <SharedAssetInstance
            key={`${building.kind}-${building.position[0]}`}
            position={building.position}
            rotation={building.rotation}
            scale={building.scale}
            source={assets[TOWN_BUILDING_KIT[building.kind].assetKey]}
          />
        ))}
      </group>

      <group name="kenney-town-trees">
        {trees.map((tree) => (
          <SharedAssetInstance
            key={`${tree.position[0]}-${tree.position[2]}`}
            position={tree.position}
            rotation={tree.rotation}
            scale={tree.scale}
            source={tree.kind === "large" ? assets.treeLarge : assets.treeSmall}
          />
        ))}
      </group>

      <SharedAssetInstance
        position={[11.4, 0.04, 9.5]}
        rotation={-Math.PI / 3}
        scale={0.86}
        source={assets.deliveryFlat}
      />
    </group>
  );
}
