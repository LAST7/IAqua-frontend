import * as THREE from "three";
import type {
    CanvasRecipeCommand,
    ModelQuality,
    PackedMaterial,
    ModelMesh,
    PackedModel,
    ProgressiveModel,
    ViewMode,
    WorkerResponse
} from "./types";

export interface ModelLoadState {
    quality: ModelQuality;
    progress: number;
    stage: string;
    ready: boolean;
    loadingLow?: boolean;
    error?: string;
    fatal?: boolean;
}

interface ProgressiveModelsOptions {
    activate: (
        model: ProgressiveModel,
        mode: ViewMode,
        quality: ModelQuality,
        resetCamera: boolean
    ) => void;
    status: (state: ModelLoadState) => void;
    interaction: () => number;
}

const idle = () =>
    new Promise<void>((resolve) => {
        if (document.hidden) {
            window.setTimeout(resolve, 100);
        } else if ("requestIdleCallback" in window) {
            window.requestIdleCallback(() => resolve(), { timeout: 200 });
        } else {
            requestAnimationFrame(() => window.setTimeout(resolve, 0));
        }
    });

export function disposeModel(model: ProgressiveModel | undefined): void {
    if (!model) return;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    model.root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        if (object instanceof THREE.InstancedMesh) object.dispose();
        geometries.add(object.geometry);
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of list) {
            materials.add(material);
            const map = Reflect.get(material, "map");
            if (map instanceof THREE.Texture) textures.add(map);
        }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    model.root.clear();
}

function replayRecipe(context: CanvasRenderingContext2D, commands: CanvasRecipeCommand[]): void {
    for (const command of commands) {
        if ("property" in command) Reflect.set(context, command.property, command.value);
        else {
            const method = Reflect.get(context, command.method);
            if (typeof method === "function") Reflect.apply(method, context, command.args);
        }
    }
}

function createMaterial(value: PackedMaterial, textures: THREE.Texture[]): THREE.Material {
    const common = {
        color: value.color,
        opacity: value.opacity,
        transparent: value.transparent,
        side: value.side as THREE.Side,
        depthWrite: value.depthWrite,
        vertexColors: value.vertexColors,
        map: value.map === null ? null : textures[value.map]
    };
    if (value.type === "MeshStandardMaterial") {
        return new THREE.MeshStandardMaterial({
            ...common,
            emissive: value.emissive,
            emissiveIntensity: value.emissiveIntensity,
            roughness: value.roughness,
            metalness: value.metalness
        });
    }
    if (value.type === "MeshBasicMaterial") {
        const material = new THREE.MeshBasicMaterial(common);
        material.forceSinglePass = true;
        return material;
    }
    const material = new THREE.MeshLambertMaterial({
        ...common,
        emissive: value.emissive,
        emissiveIntensity: value.emissiveIntensity
    });
    material.forceSinglePass = true;
    return material;
}

async function unpack(
    data: PackedModel,
    alive: () => boolean,
    report: (value: number, stage: string) => void
): Promise<ProgressiveModel> {
    const root = new THREE.Group();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const objects = new Map<string, THREE.Mesh>();
    const clean = () => {
        root.traverse((object) => {
            if (object instanceof THREE.InstancedMesh) object.dispose();
        });
        for (const geometry of geometries) geometry.dispose();
        for (const material of materials) material.dispose();
        for (const texture of textures) texture.dispose();
        root.clear();
    };
    const tasks: Array<() => void> = [];
    for (const value of data.textures) {
        tasks.push(() => {
            const canvas = document.createElement("canvas");
            canvas.width = value.width;
            canvas.height = value.height;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("无法创建模型纹理画布");
            if (value.recipe) replayRecipe(context, value.recipe);
            else if (value.data)
                context.putImageData(
                    new ImageData(new Uint8ClampedArray(value.data), value.width, value.height),
                    0,
                    0
                );
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            textures.push(texture);
        });
    }
    for (const value of data.materials)
        tasks.push(() => materials.push(createMaterial(value, textures)));
    for (const value of data.geometries) {
        tasks.push(() => {
            const geometry = new THREE.BufferGeometry();
            for (const [name, attribute] of Object.entries(value.attrs))
                geometry.setAttribute(
                    name,
                    new THREE.BufferAttribute(
                        attribute.array,
                        attribute.itemSize,
                        attribute.normalized
                    )
                );
            if (value.index) geometry.setIndex(new THREE.BufferAttribute(value.index, 1));
            geometry.boundingSphere = new THREE.Sphere(
                new THREE.Vector3(...value.bounds.center),
                value.bounds.radius
            );
            geometries.push(geometry);
        });
    }
    for (const value of data.meshes) {
        tasks.push(() => {
            const geometry = geometries[value.geometry];
            const material = materials[value.material];
            const mesh: THREE.Mesh = value.instances
                ? new THREE.InstancedMesh(geometry, material, value.count ?? 0)
                : new THREE.Mesh(geometry, material);
            if (mesh instanceof THREE.InstancedMesh && value.instances) {
                mesh.instanceMatrix.array.set(value.instances);
                mesh.instanceMatrix.needsUpdate = true;
                mesh.frustumCulled = false;
            }
            mesh.matrix.fromArray(value.matrix);
            mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
            mesh.visible = value.visible;
            mesh.userData = value.userData;
            root.add(mesh);
            objects.set(value.id, mesh);
        });
    }
    try {
        let done = 0;
        while (done < tasks.length) {
            await idle();
            if (!alive()) throw new DOMException("已切换模型", "AbortError");
            const started = performance.now();
            do tasks[done++]();
            while (done < tasks.length && performance.now() - started < 4);
            report(85 + Math.floor((done / tasks.length) * 14), "分批准备显示");
        }
        root.userData = data.userData;
        root.updateMatrixWorld(true);
        const requireObject = (id: string) => {
            const object = objects.get(id);
            if (!object) throw new Error(`模型对象缺失: ${id}`);
            return object;
        };
        const requireMesh = (id: string) => requireObject(id) as unknown as ModelMesh;
        const requireInstances = (id: string) =>
            requireObject(id) as unknown as THREE.InstancedMesh;
        const model: ProgressiveModel = {
            root,
            pickables: data.pickables.map(requireObject),
            poolSurfaces: new Map<string, ModelMesh>(
                data.surfaces.map(([name, id]) => [name, requireMesh(id)])
            ),
            animatedRipples: data.ripples.map(requireMesh),
            farmSchools: data.schools.map(({ id, ...school }) => ({
                ...school,
                instances: requireInstances(id)
            })),
            farmFlows: data.flows.map(({ id, points, ...flow }) => {
                const path = new THREE.CurvePath<THREE.Vector3>();
                for (let index = 1; index < points.length; index++)
                    path.add(
                        new THREE.LineCurve3(
                            new THREE.Vector3(...points[index - 1]),
                            new THREE.Vector3(...points[index])
                        )
                    );
                return { ...flow, dot: requireInstances(id), path };
            }),
            stats: {
                drawCalls: data.meshes.filter((mesh) => mesh.visible).length,
                triangles: data.meshes
                    .filter((mesh) => mesh.visible)
                    .reduce((sum, mesh) => {
                        const geometry = data.geometries[mesh.geometry];
                        const vertices =
                            geometry.index?.length ?? geometry.attrs.position.array.length / 3;
                        return sum + (vertices / 3) * (mesh.count ?? 1);
                    }, 0)
            }
        };
        return model;
    } catch (error) {
        clean();
        throw error;
    }
}

export class ProgressiveModels {
    readonly cache = new Map<string, ProgressiveModel>();
    private mode: ViewMode = "complex";
    private quality: ModelQuality = "low";
    private generation = 0;
    private worker: Worker | null = null;
    private timer: number | undefined;
    private shown = false;
    private disposed = false;
    private progress = 0;
    private jobQuality: ModelQuality | undefined;
    private rejectJob: ((reason: DOMException) => void) | undefined;

    constructor(private readonly options: ProgressiveModelsOptions) {
        document.addEventListener("visibilitychange", this.handleVisibility);
    }

    private readonly handleVisibility = () => {
        if (document.hidden && this.jobQuality === "high") {
            this.cancel();
            this.options.status({
                quality: this.quality,
                progress: this.progress,
                stage: "后台准备已暂停",
                ready: false
            });
        } else if (
            !document.hidden &&
            !this.jobQuality &&
            this.cache.has(`${this.mode}:low`) &&
            !this.cache.has(`${this.mode}:high`)
        )
            this.scheduleHigh();
    };

    private cancel(): void {
        this.generation++;
        this.worker?.terminate();
        this.worker = null;
        window.clearTimeout(this.timer);
        const rejectJob = this.rejectJob;
        this.rejectJob = undefined;
        rejectJob?.(new DOMException("已取消后台模型", "AbortError"));
        this.jobQuality = undefined;
    }

    show(mode: ViewMode): void {
        if (this.disposed || (this.shown && mode === this.mode)) return;
        this.shown = true;
        this.cancel();
        this.mode = mode;
        this.quality = "low";
        this.progress = 0;
        for (const [key, model] of this.cache) {
            if (key.endsWith(":high") && !key.startsWith(`${mode}:`)) {
                disposeModel(model);
                this.cache.delete(key);
            }
        }
        const low = this.cache.get(`${mode}:low`);
        if (low) {
            this.options.activate(low, mode, "low", true);
            this.scheduleHigh();
        } else {
            this.options.status({
                quality: "low",
                progress: 0,
                stage: "加载轻量模型",
                ready: false,
                loadingLow: true
            });
            void this.load(mode, "low");
        }
    }

    private scheduleHigh(): void {
        window.clearTimeout(this.timer);
        const ready = this.cache.has(`${this.mode}:high`);
        this.options.status({
            quality: this.quality,
            progress: ready ? 100 : 0,
            stage: ready ? "高精度已就绪" : "轻量模式 · 后台准备高精度",
            ready
        });
        if (ready || document.hidden) return;
        this.timer = window.setTimeout(() => {
            if (this.disposed) return;
            if (document.hidden || performance.now() - this.options.interaction() < 350) {
                this.scheduleHigh();
                return;
            }
            void this.load(this.mode, "high");
        }, 900);
    }

    private async load(mode: ViewMode, quality: ModelQuality): Promise<void> {
        this.cancel();
        const generation = this.generation;
        this.jobQuality = quality;
        this.progress = 0;
        const alive = () => !this.disposed && generation === this.generation;
        const report = (progress: number, stage: string) => {
            if (!alive()) return;
            this.progress = Math.max(this.progress, progress);
            this.options.status({
                quality: this.quality,
                progress: this.progress,
                stage,
                ready: false,
                loadingLow: quality === "low"
            });
        };
        try {
            const data = await this.loadWorker(mode, quality, alive, report);
            if (!alive()) return;
            const model = await unpack(data, alive, report);
            if (!alive()) {
                disposeModel(model);
                return;
            }
            model.quality = quality;
            this.jobQuality = undefined;
            this.cache.set(`${mode}:${quality}`, model);
            if (quality === "low") {
                this.quality = "low";
                this.options.activate(model, mode, "low", true);
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => alive() && this.scheduleHigh())
                );
            } else {
                this.options.status({
                    quality: this.quality,
                    progress: 100,
                    stage: "高精度已就绪 · 可切换",
                    ready: true
                });
            }
        } catch (error) {
            if (alive()) this.jobQuality = undefined;
            if (!alive() || (error instanceof DOMException && error.name === "AbortError")) return;
            if (quality === "high") {
                this.options.status({
                    quality: this.quality,
                    progress: 0,
                    stage: "轻量模式可用 · 高精度准备失败",
                    ready: false,
                    error: error instanceof Error ? error.message : String(error)
                });
                return;
            }
            await this.loadFallback(mode, alive, report);
        }
    }

    private loadWorker(
        mode: ViewMode,
        quality: ModelQuality,
        alive: () => boolean,
        report: (value: number, stage: string) => void
    ): Promise<PackedModel> {
        return new Promise((resolve, reject) => {
            this.rejectJob = reject;
            const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
            this.worker = worker;
            const finish = () => {
                worker.terminate();
                this.worker = null;
                this.rejectJob = undefined;
            };
            worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
                if (!alive()) return;
                if (data.type === "progress") report(data.value, data.stage);
                else if (data.type === "model") {
                    finish();
                    resolve(data.data);
                } else {
                    finish();
                    reject(new Error(data.message));
                }
            };
            worker.onerror = (event) => {
                finish();
                reject(new Error(event.message || "后台线程未能启动"));
            };
            worker.postMessage({ mode, quality });
        });
    }

    private async loadFallback(
        mode: ViewMode,
        alive: () => boolean,
        report: (value: number, stage: string) => void
    ): Promise<void> {
        this.jobQuality = "low";
        try {
            await idle();
            if (!alive()) return;
            // Defer fallback-only construction modules until worker loading is unavailable.
            const [{ buildModel }, { packModel }] = await Promise.all([
                import("./factory"),
                import("./pack")
            ]);
            if (!alive()) return;
            const { data } = packModel(buildModel(mode, "low"));
            const model = await unpack(data, alive, report);
            if (!alive()) {
                disposeModel(model);
                return;
            }
            model.quality = "low";
            this.jobQuality = undefined;
            this.cache.set(`${mode}:low`, model);
            this.options.activate(model, mode, "low", true);
            this.options.status({
                quality: "low",
                progress: 0,
                stage: "轻量兼容模式",
                ready: false
            });
        } catch (error) {
            if (alive()) {
                this.jobQuality = undefined;
                this.options.status({
                    quality: "low",
                    progress: 0,
                    stage: "模型加载失败",
                    ready: false,
                    error: error instanceof Error ? error.message : String(error),
                    fatal: true
                });
            }
        }
    }

    select(quality: ModelQuality): void {
        if (this.disposed) return;
        const model = this.cache.get(`${this.mode}:${quality}`);
        if (!model) return;
        this.quality = quality;
        this.options.activate(model, this.mode, quality, false);
        const ready = this.cache.has(`${this.mode}:high`);
        this.options.status({
            quality,
            progress: ready ? 100 : this.progress,
            stage: ready ? "高精度已就绪 · 可切换" : "后台准备高精度",
            ready
        });
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.cancel();
        document.removeEventListener("visibilitychange", this.handleVisibility);
        for (const model of this.cache.values()) disposeModel(model);
        this.cache.clear();
    }
}
