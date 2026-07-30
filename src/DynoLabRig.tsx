import type { ThreeEvent } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import {
  type MutableRefObject,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  CanvasTexture,
  type Group,
  LinearFilter,
  type Mesh,
  type MeshStandardMaterial,
  SRGBColorSpace,
} from "three";
import {
  DYNO_SHEET_DRAG_TOLERANCE_PX,
  DYNO_SHEET_OPEN_THRESHOLD,
  DYNO_SHEET_PULL_DISTANCE_PX,
} from "./dossier";
import { DYNO_ALIGNMENT_POSITION, DYNO_SHEET_LENGTH } from "./dyno";

const CHARCOAL = "#252723";
const FLOOR = "#c7b994";
const PALE_BLUE = "#b9d8dc";
const SAFETY_ORANGE = "#ef6d32";
const WARM_IVORY = "#f2e7d2";
export const DYNO_PIXEL_EFFECTS = Array.from({ length: 16 }, (_, index) => ({
  angle: (index / 16) * Math.PI * 2,
  id: `dyno-pixel-${index}`,
  radius: 0.65 + (index % 4) * 0.22,
  size: 0.055 + (index % 3) * 0.025,
}));
const DYNO_SHEET_LINES = Array.from({ length: 11 }, (_, index) => ({
  id: `dyno-sheet-line-${index}`,
  index,
}));

function useDynoDisplayTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1_024;
    canvas.height = 512;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create the Dyno Lab instruction display");
    }

    context.fillStyle = CHARCOAL;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = WARM_IVORY;
    context.font = "900 92px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("DYNO LAB", 512, 126);
    context.fillStyle = SAFETY_ORANGE;
    context.font = "900 54px ui-monospace, monospace";
    context.fillText("FLAGSHIP ONLY", 512, 220);
    context.fillStyle = WARM_IVORY;
    context.font = "800 37px ui-monospace, monospace";
    context.fillText("ALIGN  →  BRAKE  →  HOLD ACCELERATOR", 512, 320);
    context.fillStyle = PALE_BLUE;
    context.font = "700 29px ui-monospace, monospace";
    context.fillText("RELEASE TO PAUSE · CURATED RECORDS STAY FIXED", 512, 390);

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.minFilter = LinearFilter;

    return nextTexture;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

function DynoFan({ fan, x }: { fan: (fan: Group | null) => void; x: number }) {
  return (
    <group position={[x, 1.42, -2.2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.22, 12]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      <group position={[0, 0, 0.13]} ref={fan} rotation={[Math.PI / 2, 0, 0]}>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((rotation) => (
          <mesh key={rotation} rotation={[0, 0, rotation]} position={[0, 0, 0]}>
            <boxGeometry args={[0.14, 0.94, 0.06]} />
            <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.13, 0.13, 0.1, 8]} />
          <meshStandardMaterial
            color={SAFETY_ORANGE}
            flatShading
            roughness={1}
          />
        </mesh>
      </group>
    </group>
  );
}

export type DynoSheetInteraction = {
  canPull: () => boolean;
  onOpenDossier: () => void;
  onPullProgress: (progress: number) => void;
};

type DynoSheetProps = {
  interaction: DynoSheetInteraction;
  sheet: RefObject<Group | null>;
};

type R3fPointerCaptureTarget = {
  releasePointerCapture: (pointerId: number) => void;
  setPointerCapture: (pointerId: number) => void;
};

function getPointerCaptureTarget(event: ThreeEvent<PointerEvent>) {
  return event.target as unknown as R3fPointerCaptureTarget;
}

function DynoSheet({
  interaction: { canPull, onOpenDossier, onPullProgress },
  sheet,
}: DynoSheetProps) {
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const pullProgress = useRef(0);

  const finishPull = (event: ThreeEvent<PointerEvent>) => {
    if (!dragOrigin.current) {
      return;
    }

    dragOrigin.current = null;
    document.body.style.cursor = "";
    getPointerCaptureTarget(event).releasePointerCapture(event.pointerId);

    if (pullProgress.current < DYNO_SHEET_OPEN_THRESHOLD) {
      pullProgress.current = 0;
      onPullProgress(0);
    }
  };

  const movePull = (event: ThreeEvent<PointerEvent>) => {
    const origin = dragOrigin.current;

    if (!origin) {
      return;
    }

    event.stopPropagation();
    const distance = Math.max(
      0,
      Math.hypot(event.clientX - origin.x, event.clientY - origin.y) -
        DYNO_SHEET_DRAG_TOLERANCE_PX,
    );
    const progress = Math.min(1, distance / DYNO_SHEET_PULL_DISTANCE_PX);
    pullProgress.current = progress;
    onPullProgress(progress);

    if (progress < DYNO_SHEET_OPEN_THRESHOLD) {
      return;
    }

    pullProgress.current = 1;
    dragOrigin.current = null;
    document.body.style.cursor = "";
    getPointerCaptureTarget(event).releasePointerCapture(event.pointerId);
    onPullProgress(1);
    onOpenDossier();
  };

  return (
    <group
      name="dyno-sheet"
      position={[0, 1.62, -2.14]}
      ref={sheet}
      scale={[1, 1, 0]}
      visible={false}
    >
      <mesh position={[0, 0, DYNO_SHEET_LENGTH / 2]} rotation={[-0.03, 0, 0]}>
        <boxGeometry args={[1.36, 0.035, DYNO_SHEET_LENGTH]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      {DYNO_SHEET_LINES.map(({ id, index }) => (
        <mesh
          key={id}
          position={[0, 0.021, 0.42 + index * 0.48]}
          rotation={[-0.03, 0, 0]}
        >
          <boxGeometry args={[index % 3 === 0 ? 0.98 : 0.72, 0.012, 0.055]} />
          <meshStandardMaterial
            color={index % 3 === 0 ? SAFETY_ORANGE : CHARCOAL}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
      <group position={[0, 0.14, DYNO_SHEET_LENGTH - 0.35]}>
        <mesh castShadow>
          <boxGeometry args={[1.02, 0.08, 0.56]} />
          <meshStandardMaterial
            color={SAFETY_ORANGE}
            emissive={SAFETY_ORANGE}
            emissiveIntensity={0.24}
            flatShading
            roughness={1}
          />
        </mesh>
        <mesh
          onPointerCancel={finishPull}
          onPointerDown={(event) => {
            if (!canPull()) {
              return;
            }

            event.stopPropagation();
            dragOrigin.current = {
              x: event.clientX,
              y: event.clientY,
            };
            pullProgress.current = 0;
            onPullProgress(0);
            document.body.style.cursor = "grabbing";
            getPointerCaptureTarget(event).setPointerCapture(event.pointerId);
          }}
          onPointerLeave={() => {
            if (!dragOrigin.current) {
              document.body.style.cursor = "";
            }
          }}
          onPointerMove={movePull}
          onPointerOver={() => {
            if (canPull()) {
              document.body.style.cursor = "grab";
            }
          }}
          onPointerUp={finishPull}
        >
          <boxGeometry args={[2.2, 0.52, 1.32]} />
          <meshBasicMaterial
            color={SAFETY_ORANGE}
            depthWrite={false}
            opacity={0}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
}

export type DynoRigHandles = {
  clamps: MutableRefObject<Mesh[]>;
  fans: MutableRefObject<Group[]>;
  gaugeNeedle: RefObject<Group | null>;
  machine: RefObject<Group | null>;
  particles: RefObject<Group | null>;
  rollers: MutableRefObject<Mesh[]>;
  sheet: RefObject<Group | null>;
  statusMaterial: RefObject<MeshStandardMaterial | null>;
};

export function useDynoRigHandles(): DynoRigHandles {
  return {
    clamps: useRef<Mesh[]>([]),
    fans: useRef<Group[]>([]),
    gaugeNeedle: useRef<Group>(null),
    machine: useRef<Group>(null),
    particles: useRef<Group>(null),
    rollers: useRef<Mesh[]>([]),
    sheet: useRef<Group>(null),
    statusMaterial: useRef<MeshStandardMaterial>(null),
  };
}

export function DynoLabRig({
  handles: {
    clamps,
    fans,
    gaugeNeedle,
    machine,
    particles,
    rollers,
    sheet,
    statusMaterial,
  },
  sheetInteraction,
}: {
  handles: DynoRigHandles;
  sheetInteraction: DynoSheetInteraction;
}) {
  const displayTexture = useDynoDisplayTexture();

  return (
    <group
      name="dyno-lab"
      position={[DYNO_ALIGNMENT_POSITION.x, 0, DYNO_ALIGNMENT_POSITION.z]}
    >
      <RigidBody colliders={false} name="dyno-lab-structure" type="fixed">
        <CuboidCollider args={[2.65, 1.15, 0.22]} position={[0, 1.15, -2.75]} />
        <CuboidCollider
          args={[0.22, 1.15, 1.5]}
          position={[-2.43, 1.15, -1.5]}
        />
        <CuboidCollider
          args={[0.22, 1.15, 1.5]}
          position={[2.43, 1.15, -1.5]}
        />
        <mesh receiveShadow position={[0, 0.13, -1.25]}>
          <cylinderGeometry args={[3.15, 3.15, 0.26, 8]} />
          <meshStandardMaterial color={FLOOR} flatShading roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 1.15, -2.75]}>
          <boxGeometry args={[5.3, 2.3, 0.44]} />
          <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
        </mesh>
        {[-2.43, 2.43].map((x) => (
          <mesh castShadow key={x} position={[x, 1.15, -1.5]}>
            <boxGeometry args={[0.44, 2.3, 3]} />
            <meshStandardMaterial
              color={WARM_IVORY}
              flatShading
              roughness={1}
            />
          </mesh>
        ))}
        <mesh castShadow position={[0, 2.45, -1.55]}>
          <boxGeometry args={[5.45, 0.34, 3.1]} />
          <meshStandardMaterial
            color={SAFETY_ORANGE}
            flatShading
            roughness={1}
          />
        </mesh>
      </RigidBody>

      <group ref={machine}>
        <mesh receiveShadow position={[0, 0.18, 0]}>
          <boxGeometry args={[2.65, 0.24, 3.15]} />
          <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
        </mesh>

        {[-0.93, 0.93].flatMap((x) =>
          [-0.77, 0.77].map((z, index) => (
            <mesh
              castShadow
              key={`roller-${x}-${z}`}
              position={[x, 0.38, z]}
              ref={(roller) => {
                if (roller) {
                  rollers.current[(x < 0 ? 0 : 2) + index] = roller;
                }
              }}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.31, 0.31, 0.64, 10]} />
              <meshStandardMaterial
                color={CHARCOAL}
                flatShading
                roughness={1}
              />
            </mesh>
          )),
        )}

        {[-0.77, 0.77].flatMap((z, axleIndex) =>
          [-1.32, 1.32].map((x, sideIndex) => (
            <mesh
              castShadow
              key={`clamp-${x}-${z}`}
              position={[x, 0.55, z]}
              ref={(clamp) => {
                if (clamp) {
                  clamps.current[axleIndex * 2 + sideIndex] = clamp;
                }
              }}
            >
              <boxGeometry args={[0.34, 0.42, 0.58]} />
              <meshStandardMaterial
                color={SAFETY_ORANGE}
                flatShading
                roughness={1}
              />
            </mesh>
          )),
        )}

        {[0.48, 1.08, 1.68, 2.28].map((z) => (
          <group key={z} position={[0, 0.17, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.7 - z * 0.22, 0.38]} />
              <meshStandardMaterial
                color={SAFETY_ORANGE}
                emissive={SAFETY_ORANGE}
                emissiveIntensity={0.18}
                flatShading
                roughness={1}
              />
            </mesh>
          </group>
        ))}

        <DynoFan
          fan={(fan) => {
            if (fan) {
              fans.current[0] = fan;
            }
          }}
          x={-1.45}
        />
        <DynoFan
          fan={(fan) => {
            if (fan) {
              fans.current[1] = fan;
            }
          }}
          x={1.45}
        />

        <group position={[0, 2.03, -2.47]}>
          <mesh castShadow>
            <boxGeometry args={[1.28, 0.68, 0.18]} />
            <meshStandardMaterial
              color={WARM_IVORY}
              flatShading
              roughness={1}
            />
          </mesh>
          <mesh position={[0, 0, 0.105]}>
            <boxGeometry args={[1.02, 0.43, 0.04]} />
            <meshStandardMaterial
              color={CHARCOAL}
              emissive={SAFETY_ORANGE}
              emissiveIntensity={0.08}
              flatShading
              ref={statusMaterial}
              roughness={1}
            />
          </mesh>
          <group position={[0, -0.16, 0.15]} ref={gaugeNeedle}>
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.055, 0.36, 0.045]} />
              <meshStandardMaterial
                color={SAFETY_ORANGE}
                flatShading
                roughness={1}
              />
            </mesh>
          </group>
        </group>

        <mesh position={[0, 2.73, -2.3]} rotation={[-0.08, 0, 0]}>
          <planeGeometry args={[4.4, 1.42]} />
          <meshStandardMaterial map={displayTexture} roughness={1} />
        </mesh>

        <group name="dyno-pixel-effects" ref={particles} visible={false}>
          {DYNO_PIXEL_EFFECTS.map(({ angle, id, radius, size }, index) => (
            <mesh
              key={id}
              position={[
                Math.cos(angle) * radius,
                0.65 + (index % 4) * 0.2,
                Math.sin(angle) * radius,
              ]}
              scale={size}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color={index % 3 === 0 ? WARM_IVORY : SAFETY_ORANGE}
                emissive={index % 3 === 0 ? WARM_IVORY : SAFETY_ORANGE}
                emissiveIntensity={0.45}
                flatShading
                roughness={1}
              />
            </mesh>
          ))}
        </group>

        <mesh castShadow position={[0, 1.56, -2.25]}>
          <boxGeometry args={[1.72, 0.44, 0.72]} />
          <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
        </mesh>
        <DynoSheet interaction={sheetInteraction} sheet={sheet} />
      </group>
    </group>
  );
}
