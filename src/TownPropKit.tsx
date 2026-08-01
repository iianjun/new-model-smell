import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import {
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  Shape,
  ShapeGeometry,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TOWN_RUNTIME_ASSETS } from "./assetCatalog";
import {
  createTownRoadNetworkLayout,
  type TownRoadJunction,
  type TownRoadSegment,
} from "./townRoadNetwork";
import { MOTOR_TOWN_PALETTE, MOTOR_TOWN_SURFACE } from "./visualLanguage";

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

function createHorizontalShapeGeometry(
  vertices: TownRoadJunction["surfaceVertices"],
) {
  const shape = new Shape();

  vertices.forEach(([x, z], index) => {
    if (index === 0) {
      shape.moveTo(x, -z);
    } else {
      shape.lineTo(x, -z);
    }
  });
  shape.closePath();

  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);

  return geometry;
}

function RoadJunctionSurface({ junction }: { junction: TownRoadJunction }) {
  const geometries = useMemo(
    () => ({
      curb: createHorizontalShapeGeometry(junction.curbVertices),
      edge: createHorizontalShapeGeometry(junction.edgeVertices),
      surface: createHorizontalShapeGeometry(junction.surfaceVertices),
    }),
    [junction],
  );

  return (
    <group position={junction.position}>
      {[
        {
          color: MOTOR_TOWN_PALETTE.warmIvory,
          geometry: geometries.curb,
          key: "curb",
          y: 0,
        },
        {
          color: MOTOR_TOWN_PALETTE.charcoal,
          geometry: geometries.edge,
          key: "edge",
          y: 0.003,
        },
        {
          color: MOTOR_TOWN_PALETTE.fadedGreen,
          geometry: geometries.surface,
          key: "surface",
          y: 0.006,
        },
      ].map((layer) => (
        <mesh
          geometry={layer.geometry}
          key={layer.key}
          position={[0, layer.y, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color={layer.color}
            flatShading
            metalness={MOTOR_TOWN_SURFACE.enamelMetalness}
            roughness={MOTOR_TOWN_SURFACE.matteRoughness}
          />
        </mesh>
      ))}
    </group>
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
  const roadLayout = useMemo(() => createTownRoadNetworkLayout(roads), [roads]);

  return (
    <group name="kenney-town-kit">
      <group name="kenney-roads">
        {roadLayout.segments.map(({ key, position, rotation, scale }) => (
          <SharedAssetInstance
            key={key}
            position={[...position]}
            rotation={rotation}
            scale={[...scale]}
            source={assets.roadStraight}
          />
        ))}
        {roadLayout.junctions.map((junction) => (
          <RoadJunctionSurface junction={junction} key={junction.key} />
        ))}
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
