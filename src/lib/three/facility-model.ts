import type * as ThreeTypes from "three";
import type { ModelLoadState, ProgressiveModels } from "./progressive/loader";
import type {
    FarmFlow,
    FarmSchool,
    ModelMesh,
    ModelQuality,
    ProgressiveModel,
    ViewMode
} from "./progressive/types";

export type { ModelLoadState } from "./progressive/loader";
export type { ModelQuality, ViewMode } from "./progressive/types";

export type FacilityFloor = { level: number; title: string; detail: string; accent: string };
export const FACILITY_FLOORS: FacilityFloor[] = [
    {
        level: -1,
        title: "B1 集中水处理区",
        detail: "源水沉淀、过滤消毒；尾水处理后循环利用。",
        accent: "#11c6d9"
    },
    {
        level: 1,
        title: "1F 东星斑大规格苗种培育区",
        detail: "20 个圆角池 · 11 × 14 m。",
        accent: "#16c9d8"
    },
    {
        level: 2,
        title: "2F 东星斑大规格苗种培育区",
        detail: "每层独立循环水系统。",
        accent: "#24d3ca"
    },
    {
        level: 3,
        title: "3F 东星斑中规格苗种培育区",
        detail: "40 个长方形培育池。",
        accent: "#37bddd"
    },
    {
        level: 4,
        title: "4F 东星斑中小规格苗种培育区",
        detail: "20 个方池与 48 个圆池。",
        accent: "#3aa9d1"
    },
    { level: 5, title: "5F 东风螺螺种培育区", detail: "长方形养殖池。", accent: "#36c7a5" },
    { level: 6, title: "6F 东风螺繁育区", detail: "分区培育。", accent: "#84c95f" },
    { level: 7, title: "7F 管理与生活区", detail: "智能监控与配套。", accent: "#d1b75a" },
    { level: 8, title: "8F 海马养殖区", detail: "圆形与矩形池。", accent: "#4ac7b3" },
    { level: 9, title: "9F 观赏鱼与海葡萄养殖区", detail: "分区布置。", accent: "#22cbbd" },
    { level: 10, title: "10F 生态体验区", detail: "采光屋顶与展示空间。", accent: "#48cfa2" }
];

export type FacilityModelOptions = {
    host: HTMLDivElement;
    initialMode?: ViewMode;
    selectedPool?: string;
    onPoolHover?: (name: string) => void;
    onPoolClick?: (name: string) => void;
    onFloorClick?: (level: number) => void;
    onInfo?: (title: string, detail: string) => void;
    onStatus?: (state: ModelLoadState) => void;
    onError?: (error: unknown) => void;
};

export type FacilityModelEngine = {
    setMode: (mode: ViewMode) => void;
    selectPool: (name: string) => void;
    selectQuality: (quality: ModelQuality) => void;
    zoom: (factor: number) => void;
    reset: () => void;
    dispose: () => void;
};

type SelectedDetails = { title: string; detail: string };

export function createFacilityModel(options: FacilityModelOptions): FacilityModelEngine {
    const host = options.host;
    let active = true;
    let observer: ResizeObserver | undefined;
    let renderer: ThreeTypes.WebGLRenderer | undefined;
    let controls: import("three/addons/controls/OrbitControls.js").OrbitControls | undefined;
    let manager: ProgressiveModels | undefined;
    let currentMode = options.initialMode ?? "farm";
    let activeQuality: ModelQuality = "low";
    let selectedPool = options.selectedPool ?? "虾苗池 01";
    let setMode = (mode: ViewMode) => {
        currentMode = mode;
    };
    let selectPool = (name: string) => {
        selectedPool = name;
    };
    let selectQuality = (_quality: ModelQuality) => {};
    let zoom = (_factor: number) => {};
    let reset = () => {};
    let disposeSceneResources = () => {};
    let frame = 0;

    const start = async () => {
        const [THREE, { OrbitControls }, { ProgressiveModels }] = await Promise.all([
            import("three"),
            import("three/addons/controls/OrbitControls.js"),
            import("./progressive/loader")
        ]);
        if (!active) return;
        const conservative =
            navigator.maxTouchPoints > 1 ||
            (navigator.hardwareConcurrency || 4) <= 4 ||
            ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 4;
        const canvasRenderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "low-power"
        });
        renderer = canvasRenderer;
        canvasRenderer.setPixelRatio(1);
        canvasRenderer.outputColorSpace = THREE.SRGBColorSpace;
        canvasRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        canvasRenderer.toneMappingExposure = 1.18;
        host.appendChild(canvasRenderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#020914");
        scene.fog = new THREE.Fog("#020914", 115, 260);
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 320);
        camera.position.set(102, 77, 112);
        scene.add(new THREE.HemisphereLight(0x83eaff, 0x112038, 1.35));
        const keyLight = new THREE.DirectionalLight(0xe3f8ff, 2.2);
        keyLight.position.set(-80, 120, 70);
        scene.add(keyLight);
        const rimLight = new THREE.PointLight(0x00dfff, 145, 190, 1.7);
        rimLight.position.set(35, 36, -35);
        scene.add(rimLight);
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(300, 300),
            new THREE.MeshStandardMaterial({ color: "#06101d", roughness: 1 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5.4;
        scene.add(ground);
        const grid = new THREE.GridHelper(200, 40, 0x0b9eba, 0x12405b);
        grid.position.y = -5.35;
        scene.add(grid);

        const orbit = new OrbitControls(camera, canvasRenderer.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.dampingFactor = 0.06;
        orbit.minDistance = 24;
        orbit.maxDistance = 240;
        orbit.maxPolarAngle = Math.PI * 0.48;

        let modelRoot: ThreeTypes.Object3D = new THREE.Group();
        scene.add(modelRoot);
        let pickables: ThreeTypes.Object3D[] = [];
        let poolSurfaces = new Map<string, ModelMesh>();
        let animatedRipples: ModelMesh[] = [];
        let farmSchools: FarmSchool[] = [];
        let farmFlows: FarmFlow[] = [];
        let selectedOverlay: ThreeTypes.Mesh | undefined;
        let selectedDetails: SelectedDetails | undefined;
        let lastInteraction = -1000;
        let lastPick = 0;
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const dummy = new THREE.Object3D();

        const defaultInfo = () => {
            if (currentMode === "complex")
                options.onInfo?.(
                    "规划 11 层 · 地上 10 层 · 地下 B1",
                    "建筑面积约 55,000 m² · 点击楼层查看功能分区"
                );
            else
                options.onInfo?.(
                    "凡纳滨对虾 · 三段闭环养殖",
                    "Φ4m 两列四行 / Φ2.5m、Φ1.5m 各单列八池 · 各段独立水循环"
                );
        };
        const updateInfo = (title: string, detail: string) => {
            options.onPoolHover?.(title);
            options.onInfo?.(title, detail);
        };
        const clearOverlay = () => {
            if (!selectedOverlay) return;
            selectedOverlay.removeFromParent();
            (selectedOverlay.material as ThreeTypes.Material).dispose();
            selectedOverlay = undefined;
        };
        disposeSceneResources = () => {
            clearOverlay();
            ground.geometry.dispose();
            ground.material.dispose();
            grid.geometry.dispose();
            const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
            for (const material of gridMaterials) material.dispose();
        };
        const highlightSelectedPool = () => {
            clearOverlay();
            const surface = poolSurfaces.get(selectedPool);
            if (!surface) return;
            const material = new THREE.MeshBasicMaterial({
                color: "#ffe271",
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            material.forceSinglePass = true;
            selectedOverlay = new THREE.Mesh(surface.geometry, material);
            selectedOverlay.matrix.copy(surface.matrixWorld);
            selectedOverlay.matrix.decompose(
                selectedOverlay.position,
                selectedOverlay.quaternion,
                selectedOverlay.scale
            );
            selectedOverlay.position.y += 0.018;
            selectedOverlay.renderOrder = 4;
            scene.add(selectedOverlay);
        };
        const resize = () => {
            const bounds = host.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return;
            camera.aspect = bounds.width / bounds.height;
            camera.updateProjectionMatrix();
            canvasRenderer.setSize(bounds.width, bounds.height, false);
        };
        observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();
        const pointAt = (event: PointerEvent | MouseEvent) => {
            const bounds = canvasRenderer.domElement.getBoundingClientRect();
            pointer.set(
                ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
                -((event.clientY - bounds.top) / bounds.height) * 2 + 1
            );
            raycaster.setFromCamera(pointer, camera);
        };
        const hitInfo = (hit: ThreeTypes.Object3D | undefined) => {
            if (typeof hit?.userData.poolName === "string")
                return {
                    title: hit.userData.poolName,
                    detail: hit.userData.poolInfo || "运行正常 · 点击选择该池位"
                };
            if (typeof hit?.userData.title === "string")
                return { title: hit.userData.title, detail: String(hit.userData.detail ?? "") };
            if (currentMode === "complex" && Number.isInteger(hit?.userData.floorLevel)) {
                const floor = FACILITY_FLOORS.find(
                    (item) => item.level === hit?.userData.floorLevel
                );
                if (floor) return floor;
            }
            return undefined;
        };

        orbit.addEventListener("start", () => {
            lastInteraction = performance.now();
        });
        orbit.addEventListener("change", () => {
            lastInteraction = performance.now();
        });
        canvasRenderer.domElement.addEventListener("pointermove", (event) => {
            lastInteraction = performance.now();
            if (event.buttons || performance.now() - lastPick < 60) return;
            lastPick = performance.now();
            pointAt(event);
            const hit = raycaster.intersectObjects(pickables, false)[0]?.object;
            const info = hitInfo(hit);
            if (info) updateInfo(info.title, info.detail);
            canvasRenderer.domElement.style.cursor = info ? "pointer" : "grab";
        });
        canvasRenderer.domElement.addEventListener("pointerleave", () => {
            if (selectedDetails) updateInfo(selectedDetails.title, selectedDetails.detail);
            else defaultInfo();
        });
        canvasRenderer.domElement.addEventListener("click", (event) => {
            pointAt(event);
            const hit = raycaster.intersectObjects(pickables, false)[0]?.object;
            const info = hitInfo(hit);
            if (!info) return;
            selectedDetails = info;
            updateInfo(info.title, info.detail);
            if (typeof hit?.userData.poolName === "string") {
                selectedPool = hit.userData.poolName;
                options.onPoolClick?.(selectedPool);
                highlightSelectedPool();
            } else if (currentMode === "complex" && Number.isInteger(hit?.userData.floorLevel))
                options.onFloorClick?.(Number(hit.userData.floorLevel));
        });

        manager = new ProgressiveModels({
            interaction: () => lastInteraction,
            status: (state) => {
                options.onStatus?.(state);
                if (state.fatal) options.onError?.(new Error(state.error || state.stage));
            },
            activate: (model: ProgressiveModel, mode, quality, resetCamera) => {
                clearOverlay();
                scene.remove(modelRoot);
                modelRoot = model.root;
                scene.add(modelRoot);
                ({ pickables, poolSurfaces, animatedRipples, farmSchools, farmFlows } = model);
                currentMode = mode;
                activeQuality = quality;
                rimLight.visible = quality === "high";
                canvasRenderer.setPixelRatio(
                    quality === "low" || conservative ? 1 : Math.min(devicePixelRatio || 1, 1.5)
                );
                ground.visible = grid.visible = mode === "complex";
                host.dataset.model = mode;
                host.dataset.quality = quality;
                host.dataset.modelStats = JSON.stringify(model.stats);
                host.dataset.layout =
                    mode === "farm" ? JSON.stringify(modelRoot.userData.layout) : "";
                host.dataset.transfers =
                    mode === "farm" ? JSON.stringify(modelRoot.userData.transfers) : "";
                highlightSelectedPool();
                resize();
                if (resetCamera) {
                    selectedDetails = undefined;
                    orbit.target.set(
                        0,
                        mode === "complex" ? 15 : 1.6,
                        mode === "complex" ? 0 : -1.2
                    );
                    if (mode === "complex") camera.position.set(102, 77, 112);
                    else camera.position.set(29, 31, 39);
                    orbit.minDistance = mode === "complex" ? 24 : 3;
                    orbit.maxDistance = mode === "complex" ? 240 : 110;
                    orbit.update();
                    orbit.saveState();
                    defaultInfo();
                }
                canvasRenderer.domElement.dataset.rendered = "false";
            }
        });
        manager.show(currentMode);

        setMode = (mode) => manager?.show(mode);
        selectPool = (name) => {
            selectedPool = name;
            highlightSelectedPool();
        };
        selectQuality = (quality) => manager?.select(quality);
        zoom = (factor) => {
            const offset = camera.position.clone().sub(orbit.target);
            const distance = THREE.MathUtils.clamp(
                offset.length() * factor,
                orbit.minDistance,
                orbit.maxDistance
            );
            camera.position.copy(orbit.target).add(offset.setLength(distance));
            orbit.update();
        };
        reset = () => orbit.reset();

        const clock = new THREE.Clock();
        let lastFrame = 0;
        const animateFarm = (time: number) => {
            for (const school of farmSchools) {
                for (let index = 0; index < school.count; index++) {
                    const angle = index * 2.39996 + school.seed + time * 0.015;
                    const radius = Math.sqrt((index + 0.5) / school.count) * school.r * 0.76;
                    const y =
                        index % 4 === 0
                            ? school.waterY - 0.11
                            : school.base + 0.17 + (index % 3) * 0.035;
                    dummy.position.set(
                        school.x + Math.cos(angle) * radius,
                        y,
                        school.z + Math.sin(angle) * radius
                    );
                    dummy.rotation.set(0, -angle + Math.PI, Math.sin(time + index) * 0.012);
                    dummy.scale.setScalar(school.size);
                    dummy.updateMatrix();
                    school.instances.setMatrixAt(school.start + index, dummy.matrix);
                }
                school.instances.instanceMatrix.needsUpdate = true;
            }
            for (const flow of farmFlows) {
                dummy.position.copy(flow.path.getPoint((time * flow.speed + flow.offset) % 1));
                dummy.position.y += 0.02;
                dummy.rotation.set(0, 0, 0);
                dummy.scale.setScalar(flow.radius);
                dummy.updateMatrix();
                if (flow.dot instanceof THREE.InstancedMesh) {
                    flow.dot.setMatrixAt(flow.index, dummy.matrix);
                    flow.dot.instanceMatrix.needsUpdate = true;
                }
            }
        };
        const animate = (now = 0) => {
            if (!active) return;
            frame = requestAnimationFrame(animate);
            const fps = activeQuality === "low" || conservative ? 30 : 45;
            if (document.hidden || now - lastFrame < 1000 / fps || !manager?.cache.size) return;
            lastFrame = now;
            const time = clock.getElapsedTime();
            if (currentMode === "farm") animateFarm(time);
            for (const ripple of animatedRipples) {
                const phase = time * 0.72 + Number(ripple.userData.phase ?? 0);
                ripple.scale.setScalar(0.78 + (Math.sin(phase) + 1) * 0.11);
                ripple.material.opacity = 0.18 + (Math.sin(phase) + 1) * 0.09;
            }
            orbit.update();
            canvasRenderer.render(scene, camera);
            canvasRenderer.domElement.dataset.rendered = "true";
        };
        animate();
    };
    void start().catch(options.onError);

    return {
        setMode: (mode) => setMode(mode),
        selectPool: (name) => selectPool(name),
        selectQuality: (quality) => selectQuality(quality),
        zoom: (factor) => zoom(factor),
        reset: () => reset(),
        dispose: () => {
            active = false;
            cancelAnimationFrame(frame);
            observer?.disconnect();
            manager?.dispose();
            disposeSceneResources();
            controls?.dispose();
            renderer?.dispose();
            renderer?.domElement.remove();
        }
    };
}
