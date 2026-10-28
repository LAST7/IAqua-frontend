import type {
    BufferGeometry,
    InstancedMesh,
    Material,
    Mesh,
    Object3D,
    Texture,
    TypedArray,
    Vector3
} from "three";

export type ViewMode = "complex" | "farm";
export type ModelQuality = "low" | "high";
export type Vec3 = [number, number, number];
export type ProgressReport = (value: number, stage: string) => void;

export type ModelMesh = Mesh<BufferGeometry, Material>;

export interface FarmSchool {
    instances: InstancedMesh;
    count: number;
    start: number;
    x: number;
    z: number;
    r: number;
    base: number;
    waterY: number;
    size: number;
    seed: number;
}

export interface FarmFlow {
    dot: ModelMesh | InstancedMesh;
    path: import("three").CurvePath<Vector3>;
    speed: number;
    offset: number;
    index: number;
    radius: number;
}

export interface ProgressiveModel {
    root: Object3D;
    pickables: Object3D[];
    poolSurfaces: Map<string, ModelMesh>;
    animatedRipples: ModelMesh[];
    farmSchools: FarmSchool[];
    farmFlows: FarmFlow[];
    stats?: { drawCalls: number; triangles: number };
    quality?: ModelQuality;
}

export interface CanvasRecipeProperty {
    property: string;
    value: string | number | boolean;
}

export interface CanvasRecipeMethod {
    method: string;
    args: Array<string | number>;
}

export type CanvasRecipeCommand = CanvasRecipeProperty | CanvasRecipeMethod;

export interface PackedTexture {
    width: number;
    height: number;
    recipe?: CanvasRecipeCommand[];
    data?: Uint8ClampedArray;
}

export interface PackedMaterial {
    type: string;
    color?: number;
    emissive?: number;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    opacity: number;
    transparent: boolean;
    side: number;
    depthWrite: boolean;
    vertexColors: boolean;
    map: number | null;
}

export interface PackedAttribute {
    array: TypedArray;
    itemSize: number;
    normalized: boolean;
}

export interface PackedGeometry {
    attrs: Record<string, PackedAttribute>;
    index?: TypedArray;
    bounds: { center: Vec3; radius: number };
}

export interface PackedMesh {
    id: string;
    geometry: number;
    material: number;
    matrix: number[];
    visible: boolean;
    userData: Record<string, unknown>;
    instances?: Float32Array;
    count?: number;
}

export interface PackedSchool extends Omit<FarmSchool, "instances"> {
    id: string;
}

export interface PackedFlow extends Omit<FarmFlow, "dot" | "path"> {
    id: string;
    points: Vec3[];
}

export interface PackedModel {
    geometries: PackedGeometry[];
    materials: PackedMaterial[];
    textures: PackedTexture[];
    meshes: PackedMesh[];
    userData: Record<string, unknown>;
    pickables: string[];
    surfaces: Array<[string, string]>;
    ripples: string[];
    schools: PackedSchool[];
    flows: PackedFlow[];
}

export interface PackedModelTransfer {
    data: PackedModel;
    transfers: Transferable[];
}

export type WorkerRequest = { mode: ViewMode; quality: ModelQuality };
export type WorkerResponse =
    | { type: "progress"; value: number; stage: string }
    | { type: "model"; data: PackedModel }
    | { type: "error"; message: string; stack?: string };

export interface DisposableResources {
    geometries: Set<BufferGeometry>;
    materials: Set<Material>;
    textures: Set<Texture>;
}
