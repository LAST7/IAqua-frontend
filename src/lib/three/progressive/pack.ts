import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type {
    CanvasRecipeCommand,
    PackedAttribute,
    PackedGeometry,
    PackedMaterial,
    PackedMesh,
    PackedModel,
    PackedModelTransfer,
    PackedTexture,
    ProgressiveModel,
    ProgressReport,
    Vec3
} from "./types";

type Batch = { material: number; parts: THREE.BufferGeometry[] };
type RecipeCanvas = OffscreenCanvas & { recipe?: CanvasRecipeCommand[] };

export function packModel(
    model: ProgressiveModel,
    report: ProgressReport = () => undefined
): PackedModelTransfer {
    const { root, pickables, poolSurfaces, animatedRipples, farmSchools, farmFlows } = model;
    batchSchools(root, farmSchools);
    batchFlows(root, farmFlows);
    root.updateMatrixWorld(true);

    const geometries: PackedGeometry[] = [],
        materials: PackedMaterial[] = [];
    const textures: PackedTexture[] = [],
        meshes: PackedMesh[] = [],
        transfers: Transferable[] = [];
    const geometryIds = new Map<string, number>(),
        materialIds = new Map<string, number>(),
        textureIds = new Map<string, number>();
    const keep = new Set<THREE.Object3D>([
        ...animatedRipples,
        ...farmSchools.map((school) => school.instances),
        ...farmFlows.map((flow) => flow.dot)
    ]);
    const interactive = new Set<THREE.Object3D>([...pickables, ...poolSurfaces.values()]);
    const batches = new Map<string, Batch>();

    const addTransfer = (array: THREE.TypedArray) => {
        if (array.buffer instanceof ArrayBuffer && !transfers.includes(array.buffer))
            transfers.push(array.buffer);
    };
    const textureId = (texture: THREE.Texture | null): number | null => {
        if (!texture) return null;
        const known = textureIds.get(texture.uuid);
        if (known !== undefined) return known;
        const image = texture.image as RecipeCanvas | HTMLCanvasElement;
        const id = textures.length,
            recipe = (image as RecipeCanvas).recipe;
        if (recipe) textures.push({ width: image.width, height: image.height, recipe });
        else {
            const context = image.getContext("2d");
            if (!context || !("getImageData" in context)) throw new Error("模型标签纹理无法读取");
            const data = context.getImageData(0, 0, image.width, image.height).data;
            textures.push({ width: image.width, height: image.height, data });
            addTransfer(data);
        }
        textureIds.set(texture.uuid, id);
        return id;
    };
    const materialId = (source: THREE.Material): number => {
        const mat = source as THREE.MeshStandardMaterial;
        const value: PackedMaterial = {
            type: source.type,
            color: mat.color?.getHex(),
            emissive: mat.emissive?.getHex(),
            emissiveIntensity: mat.emissiveIntensity,
            roughness: mat.roughness,
            metalness: mat.metalness,
            opacity: source.opacity,
            transparent: source.transparent,
            side: source.side,
            depthWrite: source.depthWrite,
            vertexColors: mat.vertexColors,
            map: textureId(mat.map)
        };
        const key = JSON.stringify(value),
            known = materialIds.get(key);
        if (known !== undefined) return known;
        const id = materials.length;
        materialIds.set(key, id);
        materials.push(value);
        return id;
    };
    const geometryId = (geometry: THREE.BufferGeometry): number => {
        const known = geometryIds.get(geometry.uuid);
        if (known !== undefined) return known;
        const attrs: Record<string, PackedAttribute> = {};
        for (const name of ["position", "normal", "uv", "color"]) {
            const attribute = geometry.getAttribute(name);
            if (!attribute || !("itemSize" in attribute)) continue;
            attrs[name] = {
                array: attribute.array,
                itemSize: attribute.itemSize,
                normalized: attribute.normalized
            };
            addTransfer(attribute.array);
        }
        const index = geometry.index?.array;
        if (index) addTransfer(index);
        if (!geometry.boundingSphere) geometry.computeBoundingSphere();
        const sphere = geometry.boundingSphere;
        if (!sphere) throw new Error("模型几何缺少包围球");
        const id = geometries.length;
        geometries.push({
            attrs,
            index,
            bounds: { center: sphere.center.toArray() as Vec3, radius: sphere.radius }
        });
        geometryIds.set(geometry.uuid, id);
        return id;
    };
    const addMesh = (mesh: THREE.Mesh, visible: boolean, matrix = mesh.matrixWorld) => {
        if (Array.isArray(mesh.material)) throw new Error("不支持多材质模型打包");
        const record: PackedMesh = {
            id: mesh.uuid,
            geometry: geometryId(mesh.geometry),
            material: materialId(mesh.material),
            matrix: matrix.toArray(),
            visible,
            userData: mesh.userData
        };
        if (mesh instanceof THREE.InstancedMesh) {
            record.instances = mesh.instanceMatrix.array as Float32Array;
            record.count = mesh.count;
            addTransfer(record.instances);
        }
        meshes.push(record);
    };

    root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        if (keep.has(object) || object instanceof THREE.InstancedMesh) {
            addMesh(object, true);
            return;
        }
        if (interactive.has(object)) addMesh(object, false);
        if (Array.isArray(object.material)) throw new Error("不支持多材质模型打包");
        const material = materialId(object.material);
        const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
        const mat = object.material as THREE.MeshStandardMaterial;
        if (!mat.map) geometry.deleteAttribute("uv");
        const key = `${material}:${Object.keys(geometry.attributes).sort().join(",")}:${Boolean(geometry.index)}`;
        const batch = batches.get(key) ?? { material, parts: [] };
        batch.parts.push(geometry);
        batches.set(key, batch);
    });

    let done = 0;
    for (const batch of batches.values()) {
        const geometry = mergeGeometries(batch.parts, false);
        if (!geometry) throw new Error("合并模型几何失败");
        meshes.push({
            id: `batch-${geometry.uuid}`,
            geometry: geometryId(geometry),
            material: batch.material,
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: true,
            userData: {}
        });
        batch.parts.forEach((part) => part.dispose());
        report(55 + Math.round((++done / batches.size) * 30), "合并几何与打包");
    }

    const data: PackedModel = {
        geometries,
        materials,
        textures,
        meshes,
        userData: root.userData,
        pickables: pickables.map((object) => object.uuid),
        surfaces: [...poolSurfaces].map(([name, object]) => [name, object.uuid]),
        ripples: animatedRipples.map((object) => object.uuid),
        schools: farmSchools.map(({ instances, ...school }) => ({ ...school, id: instances.uuid })),
        flows: farmFlows.map(({ dot, path, ...flow }) => ({
            ...flow,
            id: dot.uuid,
            points: path.curves
                .map((curve) => (curve as THREE.LineCurve3).v1.toArray() as Vec3)
                .concat(
                    path.curves.length
                        ? [(path.curves.at(-1) as THREE.LineCurve3).v2.toArray() as Vec3]
                        : []
                )
        }))
    };
    disposeConstruction(root);
    return { data, transfers };
}

function batchSchools(root: THREE.Object3D, schools: ProgressiveModel["farmSchools"]): void {
    if (!schools.length) return;
    const first = schools[0].instances;
    const batch = new THREE.InstancedMesh(
        first.geometry,
        first.material,
        schools.reduce((sum, school) => sum + school.count, 0)
    );
    let offset = 0;
    for (const school of schools) {
        const previous = school.instances;
        previous.removeFromParent();
        previous.dispose();
        school.instances = batch;
        school.start = offset;
        offset += school.count;
    }
    batch.count = offset;
    root.add(batch);
}

function batchFlows(root: THREE.Object3D, flows: ProgressiveModel["farmFlows"]): void {
    const groups = new Map<number, typeof flows>();
    for (const flow of flows) {
        const material = flow.dot.material;
        if (Array.isArray(material) || !(material instanceof THREE.MeshBasicMaterial))
            throw new Error("流动标记材质无效");
        const key = material.color.getHex(),
            group = groups.get(key) ?? [];
        group.push(flow);
        groups.set(key, group);
    }
    for (const group of groups.values()) {
        const source = group[0].dot,
            sourceMaterial = source.material;
        if (Array.isArray(sourceMaterial)) throw new Error("流动标记材质无效");
        const batch = new THREE.InstancedMesh(
            new THREE.SphereGeometry(1, 6, 4),
            sourceMaterial,
            group.length
        );
        group.forEach((flow, index) => {
            const previous = flow.dot;
            const radius = previous.geometry.boundingSphere?.radius ?? flow.radius;
            previous.geometry.dispose();
            if (previous.material !== sourceMaterial && !Array.isArray(previous.material))
                previous.material.dispose();
            previous.removeFromParent();
            flow.radius = radius;
            flow.dot = batch;
            flow.index = index;
        });
        root.add(batch);
    }
}

function disposeConstruction(root: THREE.Object3D): void {
    const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
    root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of list) {
            materials.add(material);
            const map = (material as THREE.MeshStandardMaterial).map;
            if (map) textures.add(map);
        }
    });
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    root.clear();
}
