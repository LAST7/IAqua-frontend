import type * as ThreeTypes from "three";
type Vec3 = [number, number, number];
type ModelMaterial = ThreeTypes.MeshStandardMaterial;
type ModelMesh = ThreeTypes.Mesh<
    ThreeTypes.BufferGeometry,
    ThreeTypes.Material | ThreeTypes.Material[]
>;
type UserData = {
    poolName?: string;
    poolInfo?: string;
    title?: string;
    detail?: string;
    floorLevel?: number;
    phase?: number;
};
type PoolOptions = { baseY?: number; stageIndex?: number; poolInfo?: string };
type Tank = {
    x: number;
    z: number;
    stage: Stage;
    i: number;
    id: string;
    name: string;
    r: number;
    top: number;
    waterY: number;
    base: number;
    inlet: string;
    outlet: string;
    air: string;
    control: string;
    sensor: string;
    transferOut: Vec3;
};
type Stage = {
    index: number;
    title: string;
    prefix: string;
    diameter: number;
    depth: number;
    base: number;
    density: number;
    rate: number;
    supplyX: number;
    wasteX: number;
    airX: number;
    feedX: number;
    equipmentX: number;
    equipmentZ: number;
    color: string;
    centres: Vec3[];
};
type FarmSchool = {
    instances: ThreeTypes.InstancedMesh;
    count: number;
    x: number;
    z: number;
    r: number;
    base: number;
    waterY: number;
    size: number;
    seed: number;
};
type FarmFlow = {
    dot: ModelMesh;
    path: ThreeTypes.Curve<ThreeTypes.Vector3>;
    speed: number;
    offset: number;
};
type FarmEdge = { from: string; to: string; kind: string; points: Vec3[]; radius?: number };
export type ViewMode = "complex" | "farm";
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
] as FacilityFloor[];
export type FacilityModelOptions = {
    host: HTMLDivElement;
    initialMode?: ViewMode;
    selectedPool?: string;
    onPoolHover?: (name: string) => void;
    onPoolClick?: (name: string) => void;
    onFloorClick?: (level: number) => void;
    onInfo?: (title: string, detail: string) => void;
    onError?: (error: unknown) => void;
};
export type FacilityModelEngine = {
    setMode: (mode: ViewMode) => void;
    selectPool: (name: string) => void;
    zoom: (factor: number) => void;
    reset: () => void;
    dispose: () => void;
};
export function createFacilityModel(options: FacilityModelOptions): FacilityModelEngine {
    let host = options.host;
    let active = true;
    let observer: ResizeObserver | undefined;
    let renderer: ThreeTypes.WebGLRenderer | undefined;
    let controls: import("three/addons/controls/OrbitControls.js").OrbitControls | undefined;
    let currentMode = options.initialMode ?? "farm";
    let selected = options.selectedPool ?? "";
    let rebuild: (m: ViewMode) => void = () => {};
    let select: () => void = () => {};
    let zoom: (f: number) => void = () => {};
    let reset = () => {};
    let frame = 0;
    const start = async () => {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        host.appendChild(renderer.domElement);

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

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.minDistance = 24;
        controls.maxDistance = 240;
        controls.maxPolarAngle = Math.PI * 0.48;

        const floors = [
            {
                level: -1,
                title: "B1 集中水处理区",
                detail: "源水沉淀、过滤消毒；尾水物理过滤与生化处理后循环利用。",
                color: "#11c6d9"
            },
            {
                level: 1,
                title: "1F 东星斑大规格苗种培育区",
                detail: "20 个圆角池 · 11 × 14 m · 水深 0.6–0.8 m。",
                color: "#16c9d8"
            },
            {
                level: 2,
                title: "2F 东星斑大规格苗种培育区",
                detail: "每层独立循环水系统 · 养殖与处理分区布置。",
                color: "#24d3ca"
            },
            {
                level: 3,
                title: "3F 东星斑中规格苗种培育区",
                detail: "40 个长方形培育池 · 11 × 7 m。",
                color: "#37bddd"
            },
            {
                level: 4,
                title: "4F 东星斑中小规格苗种培育区",
                detail: "20 个方池与 48 个直径 6 m 圆池，按规格分区。",
                color: "#3aa9d1"
            },
            {
                level: 5,
                title: "5F 东风螺螺种培育区",
                detail: "长方形池 · 3 × 8 m · 水深 0.4 m。",
                color: "#36c7a5"
            },
            {
                level: 6,
                title: "6F 东风螺繁育区",
                detail: "小规格与大规格玻璃钢池分区培育。",
                color: "#84c95f"
            },
            {
                level: 7,
                title: "7F 管理与生活区",
                detail: "智能监控、实验科教、办公、生活与住宿配套。",
                color: "#d1b75a"
            },
            {
                level: 8,
                title: "8F 海马养殖区",
                detail: "32 个 4 × 8 m 池与圆形养殖池分区。",
                color: "#4ac7b3"
            },
            {
                level: 9,
                title: "9F 观赏鱼与海葡萄养殖区",
                detail: "海葡萄栽培池沿两侧布置，中部为观赏鱼池。",
                color: "#22cbbd"
            },
            {
                level: 10,
                title: "10F 生态体验区",
                detail: "采光屋顶、观光步道与水族展示空间。",
                color: "#48cfa2"
            }
        ];
        const material = (
            color: string,
            options: ThreeTypes.MeshStandardMaterialParameters = {}
        ): ThreeTypes.MeshStandardMaterial =>
            new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...options });
        const box = (
            parent: ThreeTypes.Object3D,
            w: number,
            h: number,
            d: number,
            mat: ModelMaterial,
            x: number,
            y: number,
            z: number
        ): ThreeTypes.Mesh<ThreeTypes.BoxGeometry, ModelMaterial> => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.position.set(x, y, z);
            parent.add(mesh);
            return mesh;
        };
        const cylinder = (
            parent: ThreeTypes.Object3D,
            radius: number,
            height: number,
            mat: ModelMaterial,
            x: number,
            y: number,
            z: number,
            segments = 24
        ): ThreeTypes.Mesh<ThreeTypes.CylinderGeometry, ModelMaterial> => {
            const mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(radius, radius, height, segments, 1, true),
                mat
            );
            mesh.position.set(x, y, z);
            parent.add(mesh);
            return mesh;
        };
        const pipe = (
            parent: ThreeTypes.Object3D,
            points: Vec3[],
            color: string,
            radius = 0.13
        ): ThreeTypes.Mesh<ThreeTypes.TubeGeometry, ModelMaterial> => {
            const curve = new THREE.CatmullRomCurve3(
                points.map((point: Vec3) => new THREE.Vector3(...point))
            );
            const mesh = new THREE.Mesh(
                new THREE.TubeGeometry(curve, Math.max(16, points.length * 8), radius, 8, false),
                material(color, { metalness: 0.32 })
            );
            parent.add(mesh);
            return mesh;
        };
        let modelRoot = new THREE.Group();
        scene.add(modelRoot);
        let activeMode: ViewMode = options.initialMode ?? "farm";
        const pickables: ThreeTypes.Object3D[] = [];
        const poolSurfaces = new Map<
            string,
            ThreeTypes.Mesh<ThreeTypes.BufferGeometry, ModelMaterial>
        >();
        const animatedWater: ThreeTypes.Mesh<ThreeTypes.BufferGeometry, ModelMaterial>[] = [];
        const animatedRipples: ThreeTypes.Mesh<ThreeTypes.BufferGeometry, ModelMaterial>[] = [];
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        function circlePool(
            parent: ThreeTypes.Object3D,
            name: string,
            x: number,
            z: number,
            diameter: number,
            depth: number,
            accent: string,
            options: PoolOptions = {}
        ) {
            const radius = diameter / 2;
            const wallHeight = Math.max(0.56, depth + 0.26);
            const baseY = options.baseY || 0;
            const wallMat = material("#83b8c8", {
                metalness: 0.38,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.88,
                roughness: 0.3
            });
            const wall = cylinder(
                parent,
                radius,
                wallHeight,
                wallMat,
                x,
                baseY + wallHeight / 2,
                z,
                40
            );
            wall.userData.poolName = name;
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.1, 40),
                material("#315360", { metalness: 0.25, roughness: 0.5 })
            );
            base.position.set(x, baseY + 0.05, z);
            parent.add(base);
            const water = new THREE.Mesh(
                new THREE.CircleGeometry(radius * 0.92, 40),
                material(accent, {
                    color: accent,
                    emissive: accent,
                    emissiveIntensity: 0.24,
                    transparent: true,
                    opacity: 0.9,
                    roughness: 0.18,
                    side: THREE.DoubleSide
                })
            );
            water.rotation.x = -Math.PI / 2;
            water.position.set(x, baseY + depth, z);
            water.userData.poolName = name;
            parent.add(water);
            const rim = new THREE.Mesh(
                new THREE.TorusGeometry(radius, Math.max(0.055, diameter * 0.025), 10, 48),
                material("#b8e0df", {
                    emissive: accent,
                    emissiveIntensity: 0.14,
                    metalness: 0.48,
                    roughness: 0.24
                })
            );
            rim.rotation.x = Math.PI / 2;
            rim.position.set(x, baseY + wallHeight, z);
            rim.userData.poolName = name;
            parent.add(rim);
            if (options.stageIndex !== undefined) {
                const reinforcement = material("#4c8490", { metalness: 0.58, roughness: 0.32 });
                for (const bandY of [baseY + 0.16, baseY + wallHeight * 0.56]) {
                    const band = new THREE.Mesh(
                        new THREE.TorusGeometry(
                            radius * 1.008,
                            Math.max(0.025, diameter * 0.012),
                            6,
                            40
                        ),
                        reinforcement
                    );
                    band.rotation.x = Math.PI / 2;
                    band.position.set(x, bandY, z);
                    parent.add(band);
                }
                const airRing = new THREE.Mesh(
                    new THREE.TorusGeometry(
                        radius * 0.62,
                        Math.max(0.022, diameter * 0.012),
                        6,
                        40
                    ),
                    material("#58e6d4", {
                        emissive: "#14c5ba",
                        emissiveIntensity: 0.52,
                        metalness: 0.2
                    })
                );
                airRing.rotation.x = Math.PI / 2;
                airRing.position.set(x, baseY + depth + 0.035, z);
                parent.add(airRing);
                const drain = new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        Math.max(0.045, diameter * 0.035),
                        Math.max(0.06, diameter * 0.045),
                        0.07,
                        16
                    ),
                    material("#d1e6df", { metalness: 0.55 })
                );
                drain.position.set(x, baseY + depth + 0.075, z);
                parent.add(drain);
                const supportRadius = Math.max(0.055, diameter * 0.035);
                for (const sx of [-1, 1])
                    for (const sz of [-1, 1]) {
                        const leg = new THREE.Mesh(
                            new THREE.CylinderGeometry(
                                supportRadius,
                                supportRadius * 1.25,
                                Math.max(0.18, baseY),
                                8
                            ),
                            reinforcement
                        );
                        leg.position.set(x + sx * radius * 0.72, baseY / 2, z + sz * radius * 0.72);
                        parent.add(leg);
                        const shoe = new THREE.Mesh(
                            new THREE.BoxGeometry(supportRadius * 3, 0.06, supportRadius * 3),
                            material("#9eb8b8", { metalness: 0.46 })
                        );
                        shoe.position.set(leg.position.x, 0.03, leg.position.z);
                        parent.add(shoe);
                    }
                const drainPipeY = Math.max(0.12, baseY - 0.12);
                pipe(
                    parent,
                    [
                        [x, baseY + 0.04, z],
                        [x, drainPipeY, z + radius * 0.82],
                        [x, drainPipeY, z + radius + 0.2]
                    ],
                    "#39bcca",
                    Math.max(0.035, diameter * 0.018)
                );
                for (let bubble = 0; bubble < 3; bubble++) {
                    const ripple = new THREE.Mesh(
                        new THREE.TorusGeometry(
                            radius * (0.18 + bubble * 0.12),
                            Math.max(0.012, diameter * 0.006),
                            5,
                            28
                        ),
                        material("#b1fff2", {
                            transparent: true,
                            opacity: 0.32,
                            emissive: accent,
                            emissiveIntensity: 0.15
                        })
                    );
                    ripple.rotation.x = Math.PI / 2;
                    ripple.position.set(x, baseY + depth + 0.025, z);
                    ripple.userData.phase = bubble * 1.9 + (x + z) * 0.13;
                    parent.add(ripple);
                    animatedRipples.push(ripple);
                }
                water.userData.poolInfo = options.poolInfo;
                wall.userData.poolInfo = options.poolInfo;
                rim.userData.poolInfo = options.poolInfo;
            }
            pickables.push(water, wall, rim);
            poolSurfaces.set(name, water);
            animatedWater.push(water);
        }

        function rectanglePool(
            parent: ThreeTypes.Object3D,
            name: string,
            x: number,
            z: number,
            width: number,
            depth: number,
            wallHeight: number,
            accent: string
        ) {
            const wall = box(
                parent,
                width,
                wallHeight,
                depth,
                material("#397b91", { transparent: true, opacity: 0.55, metalness: 0.32 }),
                x,
                wallHeight / 2,
                z
            );
            wall.userData.poolName = name;
            const water = box(
                parent,
                width - 0.4,
                0.07,
                depth - 0.4,
                material(accent, {
                    emissive: accent,
                    emissiveIntensity: 0.08,
                    transparent: true,
                    opacity: 0.82,
                    roughness: 0.2
                }),
                x,
                wallHeight - 0.1,
                z
            );
            water.userData.poolName = name;
            pickables.push(wall, water);
            poolSurfaces.set(name, water);
            animatedWater.push(water);
        }

        function makeComplex() {
            const root = new THREE.Group();
            const width = 70;
            const depth = 68;
            const floorHeight = 3.6;
            const structure = material("#6596a3", { metalness: 0.55, roughness: 0.32 });
            const slabMat = material("#0d3448", {
                emissive: "#062237",
                emissiveIntensity: 0.18,
                transparent: true,
                opacity: 0.28,
                metalness: 0.24
            });
            const edgeMat = material("#00cfe8", {
                emissive: "#00b7d9",
                emissiveIntensity: 0.55,
                metalness: 0.3
            });
            const waterMat = material("#087b9f", {
                transparent: true,
                opacity: 0.72,
                emissive: "#034a70",
                emissiveIntensity: 0.24
            });
            box(
                root,
                width + 4,
                0.5,
                depth + 4,
                material("#10283a", { metalness: 0.24 }),
                0,
                -4.5,
                0
            );
            for (const floor of floors) {
                const y = floor.level < 0 ? -floorHeight : (floor.level - 1) * floorHeight;
                const slab = box(root, width, 0.28, depth, slabMat, 0, y, 0);
                slab.userData.floorLevel = floor.level;
                pickables.push(slab);
                box(root, width, 0.035, 0.1, edgeMat, 0, y + 0.16, -depth / 2);
                box(root, width, 0.035, 0.1, edgeMat, 0, y + 0.16, depth / 2);
                box(root, 0.1, 0.035, depth, edgeMat, -width / 2, y + 0.16, 0);
                box(root, 0.1, 0.035, depth, edgeMat, width / 2, y + 0.16, 0);
                const tagCanvas = document.createElement("canvas");
                tagCanvas.width = 768;
                tagCanvas.height = 128;
                const tagContext = tagCanvas.getContext("2d");
                if (!tagContext) continue;
                tagContext.fillStyle = "rgba(3, 14, 28, 0.94)";
                tagContext.fillRect(0, 0, 768, 128);
                tagContext.strokeStyle = floor.color;
                tagContext.lineWidth = 5;
                tagContext.strokeRect(3, 3, 762, 122);
                tagContext.fillStyle = floor.color;
                tagContext.font = "bold 44px 'PingFang SC', 'Microsoft YaHei', sans-serif";
                tagContext.fillText(floor.title, 22, 82, 720);
                const tag = new THREE.Mesh(
                    new THREE.PlaneGeometry(9.4, 1.57),
                    new THREE.MeshBasicMaterial({
                        map: new THREE.CanvasTexture(tagCanvas),
                        transparent: true,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    })
                );
                tag.position.set(width / 2 + 4.9, y + 1.9, depth / 2 + 0.2);
                root.add(tag);

                for (let x = -width / 2 + 3; x <= width / 2 - 2; x += 13) {
                    for (const z of [-depth / 2 + 1, depth / 2 - 1])
                        box(root, 0.42, 3.55, 0.42, structure, x, y - 1.93, z);
                }
                for (let z = -depth / 2 + 4; z <= depth / 2 - 2; z += 13) {
                    for (const x of [-width / 2 + 1, width / 2 - 1])
                        box(root, 0.42, 3.55, 0.42, structure, x, y - 1.93, z);
                }
                const interior = new THREE.Group();
                interior.position.y = y + 0.16;
                root.add(interior);

                if (floor.level === -1) {
                    const units = [
                        { name: "源水沉淀", x: -22, z: -17, w: 24, d: 17, color: "#087f9b" },
                        { name: "砂滤与消毒", x: 7, z: -17, w: 25, d: 17, color: "#07817e" },
                        { name: "尾水物理过滤", x: -22, z: 12, w: 24, d: 17, color: "#117a9a" },
                        { name: "生化处理与回用", x: 7, z: 12, w: 25, d: 17, color: "#168c6b" }
                    ];
                    units.forEach((unit, index) => {
                        box(interior, unit.w, 1.5, unit.d, structure, unit.x, 0.9, unit.z);
                        const basin = box(
                            interior,
                            unit.w - 0.7,
                            0.08,
                            unit.d - 0.7,
                            material(unit.color, {
                                emissive: unit.color,
                                emissiveIntensity: 0.4,
                                transparent: true,
                                opacity: 0.86
                            }),
                            unit.x,
                            1.72,
                            unit.z
                        );
                        basin.userData.floorInfo = unit.name;
                        if (index < 3)
                            pipe(
                                interior,
                                [
                                    [unit.x + unit.w / 2, 1.5, unit.z],
                                    [unit.x + unit.w / 2 + 4, 1.5, unit.z],
                                    [unit.x + unit.w / 2 + 4, 2.1, unit.z]
                                ],
                                "#08bed1",
                                0.2
                            );
                    });
                    for (let i = 0; i < 6; i++)
                        cylinder(interior, 1.5, 2.5, structure, -29 + i * 11.5, 1.35, 30, 20);
                } else if (floor.level === 7) {
                    for (let row = 0; row < 3; row++)
                        for (let col = 0; col < 5; col++) {
                            const x = -26 + col * 12;
                            const z = -16 + row * 15;
                            box(
                                interior,
                                9.7,
                                2.3,
                                11.7,
                                material((row + col) % 2 ? "#33465a" : "#3d5262"),
                                x,
                                1.35,
                                z
                            );
                            box(interior, 0.2, 3.2, 0.2, edgeMat, x - 4.7, 1.8, z - 5.7);
                        }
                    box(
                        interior,
                        18,
                        2.8,
                        12,
                        material("#213d50", { metalness: 0.28 }),
                        18,
                        1.6,
                        17
                    );
                    for (let x = 12; x <= 25; x += 4)
                        box(interior, 0.16, 2.5, 9, edgeMat, x, 1.4, 17);
                } else if (floor.level === 10) {
                    const roof = new THREE.Mesh(
                        new THREE.BoxGeometry(54, 0.16, 48),
                        material("#16869d", {
                            transparent: true,
                            opacity: 0.22,
                            side: THREE.DoubleSide,
                            metalness: 0.15
                        })
                    );
                    roof.position.set(0, 3.5, 0);
                    root.add(roof);
                    for (let x = -25; x <= 25; x += 10)
                        box(interior, 0.16, 3.3, 46, structure, x, 1.7, 0);
                    for (let z = -21; z <= 21; z += 10)
                        box(interior, 52, 0.12, 0.12, structure, 0, 0.38, z);
                    for (let row = 0; row < 3; row++)
                        for (let col = 0; col < 4; col++) {
                            circlePool(
                                interior,
                                `F10 展示池 ${row * 4 + col + 1}`,
                                -18 + col * 12,
                                -10 + row * 11,
                                4.2,
                                0.8,
                                floor.color
                            );
                        }
                } else if (floor.level === 1 || floor.level === 2) {
                    for (let i = 0; i < 20; i++) {
                        const col = i % 4;
                        const row = Math.floor(i / 4);
                        rectanglePool(
                            interior,
                            `F${floor.level} 大规格池 ${i + 1}`,
                            -25 + col * 16.5,
                            -24 + row * 12.5,
                            14,
                            11,
                            0.82,
                            floor.color
                        );
                    }
                    box(interior, 54, 0.1, 2.2, edgeMat, 0, 0.25, 29);
                } else if (floor.level === 3) {
                    for (let i = 0; i < 40; i++) {
                        const col = i % 5;
                        const row = Math.floor(i / 5);
                        rectanglePool(
                            interior,
                            `F3 中规格池 ${i + 1}`,
                            -29 + col * 13.4,
                            -26 + row * 7.3,
                            11,
                            6.7,
                            0.78,
                            floor.color
                        );
                    }
                } else if (floor.level === 4) {
                    for (let i = 0; i < 20; i++) {
                        const col = i % 4;
                        const row = Math.floor(i / 4);
                        rectanglePool(
                            interior,
                            `F4 中规格池 ${i + 1}`,
                            -30 + col * 8,
                            -23 + row * 10,
                            7,
                            9,
                            0.72,
                            floor.color
                        );
                    }
                    for (let i = 0; i < 48; i++) {
                        const col = i % 6;
                        const row = Math.floor(i / 6);
                        circlePool(
                            interior,
                            `F4 中小规格圆池 ${i + 1}`,
                            1 + col * 6.3,
                            -24 + row * 6.7,
                            6,
                            0.55,
                            floor.color
                        );
                    }
                } else if (floor.level === 5) {
                    for (let i = 0; i < 60; i++) {
                        const col = i % 10;
                        const row = Math.floor(i / 10);
                        rectanglePool(
                            interior,
                            `F5 螺种培育池 ${i + 1}`,
                            -29 + col * 6.35,
                            -21 + row * 8.2,
                            3,
                            7.7,
                            0.46,
                            floor.color
                        );
                    }
                } else if (floor.level === 6) {
                    for (let i = 0; i < 60; i++) {
                        const col = i % 10;
                        const row = Math.floor(i / 10);
                        const z = -27 + row * 9;
                        rectanglePool(
                            interior,
                            `F6 小规格繁育池 ${i + 1}`,
                            -29 + col * 6.35,
                            z,
                            2,
                            7,
                            0.42,
                            floor.color
                        );
                        rectanglePool(
                            interior,
                            `F6 大规格培育池 ${i + 1}`,
                            -29 + col * 6.35,
                            z + 4.5,
                            3,
                            8,
                            0.42,
                            waterMat.color.getHexString()
                        );
                    }
                } else if (floor.level === 8 || floor.level === 9) {
                    const rectangleCount = floor.level === 8 ? 32 : 16;
                    const rectangleCols = 4;
                    for (let i = 0; i < rectangleCount; i++) {
                        const col = i % rectangleCols;
                        const row = Math.floor(i / rectangleCols);
                        const widthRect = floor.level === 8 ? 4 : 8;
                        const depthRect = floor.level === 8 ? 8 : 10;
                        const x = floor.level === 8 ? -29 + col * 4.8 : -29 + col * 8.4;
                        const z = floor.level === 8 ? -26 + row * 7.4 : -22 + row * 10.8;
                        rectanglePool(
                            interior,
                            `F${floor.level} ${floor.level === 8 ? "海马池" : "海葡萄池"} ${i + 1}`,
                            x,
                            z,
                            widthRect,
                            depthRect,
                            0.7,
                            floor.color
                        );
                    }
                    const roundCount = 56;
                    for (let i = 0; i < roundCount; i++) {
                        const cols = floor.level === 8 ? 7 : 7;
                        const col = i % cols;
                        const row = Math.floor(i / cols);
                        const x = floor.level === 8 ? -9 + col * 6 : 2.5 + col * 5;
                        const z = floor.level === 8 ? -24 + row * 6.8 : -24 + row * 6.4;
                        circlePool(
                            interior,
                            `F${floor.level} ${floor.level === 8 ? "海马圆池" : "观赏鱼池"} ${i + 1}`,
                            x,
                            z,
                            5,
                            floor.level === 8 ? 0.5 : 0.6,
                            floor.color
                        );
                    }
                }
            }
            const glass = material("#00bfe8", {
                transparent: true,
                opacity: 0.055,
                side: THREE.DoubleSide,
                metalness: 0.1,
                roughness: 0.15
            });
            for (const z of [-depth / 2, depth / 2]) {
                const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, 39), glass);
                wall.position.set(0, 16.8, z);
                root.add(wall);
            }
            for (const x of [-width / 2, width / 2]) {
                const wall = new THREE.Mesh(new THREE.PlaneGeometry(depth, 39), glass);
                wall.rotation.y = Math.PI / 2;
                wall.position.set(x, 16.8, 0);
                root.add(wall);
            }
            return root;
        }

        // Pool centres follow the plan on slide 14: two columns of 4 m tanks,
        // then one longitudinal column each of 2.5 m and 1.5 m tanks.
        // Metres are retained throughout; only maintenance clearance is expanded.
        const farmSchools: FarmSchool[] = [];
        const farmFlows: FarmFlow[] = [];
        const farmInfo = new Map<string, string>();

        function makeFarm() {
            const root = new THREE.Group();
            root.name = "ppt-three-stage-farm";
            const steel = material("#a2b8bc", { metalness: 0.62, roughness: 0.32 });
            const shell = material("#28343a", { metalness: 0.12, roughness: 0.4 });
            const liner = material("#364c50", { side: THREE.BackSide, roughness: 0.58 });
            const blue = material("#177fbd", { metalness: 0.23, roughness: 0.4 });
            const dark = material("#183946", { roughness: 0.7 });
            const gold = material("#b99c53", { metalness: 0.28, roughness: 0.58 });
            const pipeColors: Record<string, string> = {
                supply: "#369dd4",
                return: "#558b9b",
                air: "#5ec9ba",
                feed: "#c6ac71",
                control: "#74888e",
                transfer: "#9cc6cd"
            };
            const nodes = new Map<string, Vec3>();
            const edges: FarmEdge[] = [];
            const temp = new THREE.Object3D();
            const vec = (p: Vec3) => new THREE.Vector3(...p);
            const cyl = (r: number, h: number, mat: ThreeTypes.Material, p: Vec3, rt = r) => {
                const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, r, h, 48), mat);
                mesh.position.copy(vec(p));
                root.add(mesh);
                return mesh;
            };
            const ring = (
                r: number,
                tube: number,
                mat: ThreeTypes.Material,
                p: Vec3,
                axis: Vec3 = [0, 1, 0]
            ) => {
                const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 64), mat);
                mesh.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 0, 1),
                    vec(axis).normalize()
                );
                mesh.position.copy(vec(p));
                root.add(mesh);
                return mesh;
            };
            const beam = (
                a: Vec3,
                b: Vec3,
                width: number,
                mat: ModelMaterial
            ): ThreeTypes.Mesh<ThreeTypes.BoxGeometry, ModelMaterial> => {
                const from = vec(a),
                    to = vec(b),
                    d = to.clone().sub(from);
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, d.length(), width), mat);
                mesh.position.copy(from.add(to).multiplyScalar(0.5));
                mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
                root.add(mesh);
                return mesh;
            };
            const note = (text: string, p: Vec3, width = 3.4, color = "#a5dbe4") => {
                const canvas = document.createElement("canvas");
                canvas.width = 768;
                canvas.height = 112;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas 2D context unavailable");
                ctx.fillStyle = "rgba(4,18,29,.94)";
                ctx.fillRect(0, 0, 768, 112);
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 7, 112);
                ctx.font = "500 46px 'PingFang SC','Microsoft YaHei',sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillText(text, 25, 58, 716);
                const mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(width, (width * 112) / 768),
                    new THREE.MeshBasicMaterial({
                        map: new THREE.CanvasTexture(canvas),
                        transparent: true,
                        side: THREE.DoubleSide
                    })
                );
                mesh.position.copy(vec(p));
                root.add(mesh);
                return mesh;
            };
            const info = <T extends ThreeTypes.Object3D>(
                object: T,
                title: string,
                detail: string
            ): T => {
                object.userData = { ...object.userData, title, detail };
                pickables.push(object);
                return object;
            };
            const node = (id: string): Vec3 => {
                const point = nodes.get(id);
                if (!point) throw new Error(`管线端口缺失 ${id}`);
                return point;
            };
            const port = (
                id: string,
                p: Vec3,
                axis: Vec3 = [1, 0, 0],
                radius = 0.075,
                draw = true
            ) => {
                if (nodes.has(id)) throw new Error(`重复端口 ${id}`);
                nodes.set(id, p);
                if (draw) {
                    ring(radius * 1.48, radius * 0.26, steel, p, axis);
                    const neck = cyl(radius, 0.16, blue, p);
                    neck.quaternion.setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0),
                        vec(axis).normalize()
                    );
                }
                return id;
            };
            const link = (
                from: string,
                to: string,
                kind: string,
                bends: Vec3[] = [],
                radius = 0.065,
                animate = false
            ) => {
                const fromPoint = nodes.get(from),
                    toPoint = nodes.get(to);
                if (!fromPoint || !toPoint) throw new Error(`管线端口缺失 ${from} → ${to}`);
                const points: Vec3[] = [fromPoint, ...bends, toPoint].filter(
                    (p, i, all) => i === 0 || vec(p).distanceTo(vec(all[i - 1])) > 0.00001
                );
                const path = new THREE.CatmullRomCurve3(points.map(vec));
                const mesh = new THREE.Mesh(
                    new THREE.TubeGeometry(path, Math.max(8, points.length * 8), radius, 10, false),
                    material(pipeColors[kind], { roughness: 0.36, metalness: 0.27 })
                );
                root.add(mesh);
                for (const p of bends) {
                    const elbow = new THREE.Mesh(
                        new THREE.SphereGeometry(radius * 1.02, 10, 8),
                        mesh.material
                    );
                    elbow.position.copy(vec(p));
                    root.add(elbow);
                }
                mesh.userData.route = { from, to, kind };
                edges.push({ from, to, kind, points, radius });
                if (animate) {
                    const dot = new THREE.Mesh(
                        new THREE.SphereGeometry(radius * 0.74, 8, 6),
                        new THREE.MeshBasicMaterial({
                            color: kind === "feed" ? "#ffdf94" : "#a2eff2"
                        })
                    );
                    root.add(dot);
                    farmFlows.push({
                        dot,
                        path,
                        speed: kind === "feed" ? 0.06 : 0.045,
                        offset: farmFlows.length * 0.19
                    });
                }
                return mesh;
            };
            const internal = (from: string, to: string) =>
                edges.push({ from, to, kind: "internal", points: [] });
            const valve = (p: Vec3, axis: Vec3 = [1, 0, 0]) => {
                ring(0.115, 0.022, steel, p, axis);
                beam(p, [p[0], p[1] + 0.19, p[2]], 0.035, steel);
                box(root, 0.22, 0.035, 0.055, material("#b96954"), p[0], p[1] + 0.2, p[2]);
            };
            const gauge = (p: Vec3) => {
                beam([p[0], p[1] - 0.18, p[2]], p, 0.025, steel);
                const face = cyl(0.12, 0.04, steel, p);
                face.rotation.x = Math.PI / 2;
                const dial = new THREE.Mesh(
                    new THREE.CircleGeometry(0.096, 24),
                    material("#dbe7e4")
                );
                dial.position.set(p[0], p[1], p[2] + 0.025);
                root.add(dial);
                const needle = box(
                    root,
                    0.012,
                    0.12,
                    0.008,
                    dark,
                    p[0] + 0.015,
                    p[1] + 0.015,
                    p[2] + 0.032
                );
                needle.rotation.z = -0.6;
            };
            const grating = (x: number, z: number, w: number, d: number, y: number) => {
                box(root, w, 0.11, d, frameMat, x, y - 0.06, z);
                const count = Math.max(2, Math.floor(d / 0.105));
                const bars = new THREE.InstancedMesh(
                    new THREE.BoxGeometry(w, 0.035, 0.037),
                    gold,
                    count
                );
                for (let i = 0; i < count; i++) {
                    temp.position.set(
                        x,
                        y + 0.012,
                        z - d / 2 + 0.05 + (i * (d - 0.1)) / (count - 1)
                    );
                    temp.rotation.set(0, 0, 0);
                    temp.scale.set(1, 1, 1);
                    temp.updateMatrix();
                    bars.setMatrixAt(i, temp.matrix);
                }
                root.add(bars);
                for (const side of [-1, 1])
                    box(root, 0.055, 0.06, d, gold, x + (side * w) / 2, y + 0.01, z);
            };
            const frameMat = material("#256887", { metalness: 0.55, roughness: 0.4 });

            // Open architectural section, as in the site photos; roof omitted for inspection.
            box(root, 23, 0.36, 29, material("#283c47", { roughness: 0.84 }), -0.6, -0.22, -1.5);
            box(
                root,
                22.8,
                0.05,
                28.8,
                material("#344b53", { roughness: 0.88 }),
                -0.6,
                -0.015,
                -1.5
            );
            for (const z of [-15.5, -8.5, -1.5, 5.5, 12.5]) {
                for (const x of [-11.8, 10.6]) {
                    box(root, 0.28, 4.8, 0.28, steel, x, 2.4, z);
                    box(root, 0.48, 0.08, 0.48, steel, x, 0.04, z);
                }
            }
            for (const x of [-11.8, 10.6]) box(root, 0.15, 0.22, 28, steel, x, 4.75, -1.5);
            box(root, 22.4, 0.22, 0.16, steel, -0.6, 4.75, -15.5);
            // Rear glazing and low sill keep the building readable without concealing machinery.
            box(root, 22.3, 0.5, 0.15, material("#58747b"), -0.6, 0.25, -15.48);
            for (let x = -11; x < 10; x += 2.7) {
                box(root, 0.07, 3.7, 0.07, steel, x, 2.65, -15.45);
                box(
                    root,
                    2.57,
                    2.8,
                    0.025,
                    material("#86c0cb", { transparent: true, opacity: 0.1, depthWrite: false }),
                    x + 1.31,
                    2.6,
                    -15.45
                );
            }

            const stages: Stage[] = [
                {
                    index: 0,
                    title: "一级 · 幼虾",
                    prefix: "虾苗池",
                    diameter: 1.5,
                    depth: 0.85,
                    base: 2.1,
                    density: 6000,
                    rate: 30,
                    supplyX: 5.78,
                    wasteX: 9.24,
                    airX: 9.54,
                    feedX: 7.1,
                    equipmentX: 7.1,
                    equipmentZ: -10.7,
                    color: "#65c9b5",
                    centres: Array.from({ length: 4 }, (_, i): Vec3 => [7.1, 0, -3.1 + i * 3.7])
                },
                {
                    index: 1,
                    title: "二级 · 过渡虾",
                    prefix: "养殖池",
                    diameter: 2.5,
                    depth: 1.05,
                    base: 1.3,
                    density: 1700,
                    rate: 30,
                    supplyX: 1.48,
                    wasteX: 5.12,
                    airX: 5.46,
                    feedX: 3.5,
                    equipmentX: 3.5,
                    equipmentZ: -13,
                    color: "#4ab0d2",
                    centres: Array.from({ length: 8 }, (_, i): Vec3 => [3.5, 0, -10.65 + i * 2.85])
                },
                {
                    index: 2,
                    title: "三级 · 成虾",
                    prefix: "大池",
                    diameter: 4,
                    depth: 1.2,
                    base: 0.22,
                    density: 640,
                    rate: 60,
                    supplyX: -10.9,
                    wasteX: 0,
                    airX: -0.32,
                    feedX: -4.3,
                    equipmentX: -5.6,
                    equipmentZ: -11.25,
                    color: "#549bbf",
                    centres: Array.from({ length: 8 }, (_, i): Vec3 => [
                        -7.2 + (i % 2) * 4.45,
                        0,
                        -4.8 + Math.floor(i / 2) * 4.45
                    ])
                }
            ];
            const tanksByStage: Tank[][] = stages.map((stage) =>
                stage.centres.map(([x, , z], i): Tank => ({
                    x,
                    z,
                    stage,
                    i,
                    id: `S${stage.index + 1}-${String(i + 1).padStart(2, "0")}`,
                    name: `${stage.prefix} ${String(i + 1).padStart(2, "0")}`,
                    r: 0,
                    top: 0,
                    waterY: 0,
                    base: stage.base,
                    inlet: "",
                    outlet: "",
                    air: "",
                    control: "",
                    sensor: "",
                    transferOut: [0, 0, 0]
                }))
            );
            // Grating follows the longitudinal aisles and the stage height steps in the section.
            grating(0.78, 0.6, 0.72, 23.4, 0.18);
            grating(5.77, 0.9, 0.72, 23.1, 0.46);
            grating(9.94, 3.0, 0.72, 17.5, 0.9);
            grating(-10.0, 1.7, 0.72, 20.3, 0.15);
            for (let i = 0; i < 3; i++) grating(5.77, -10.6 - i * 0.25, 0.72, 0.25, 0.18 + i * 0.1);

            const shrimpGeometry = createFarmShrimpGeometry();
            const shrimpMat = material("#ffffff", { vertexColors: true, roughness: 0.46 });
            function makeTank(tank: Tank) {
                const { x, z, stage, name, id } = tank;
                const r = stage.diameter / 2,
                    base = stage.base,
                    top = base + stage.depth + 0.2,
                    waterY = base + stage.depth;
                Object.assign(tank, { r, top, waterY, base });
                const detail = `${stage.title} · Φ${stage.diameter} m · 水深 ${stage.depth} m · 设计密度 ${stage.density.toLocaleString()} 尾/m³ · 循环处理 ${stage.rate} m³/h`;
                farmInfo.set(name, detail);
                // Square galvanised cradle, bracing and footplates, sized to the actual tank.
                const legR = r * 0.71;
                for (const dx of [-legR, legR])
                    for (const dz of [-legR, legR]) {
                        box(
                            root,
                            0.09,
                            base + 0.1,
                            0.09,
                            frameMat,
                            x + dx,
                            (base + 0.1) / 2,
                            z + dz
                        );
                        box(root, 0.25, 0.045, 0.25, steel, x + dx, 0.025, z + dz);
                        for (const boltX of [-0.07, 0.07])
                            cyl(0.018, 0.025, steel, [x + dx + boltX, 0.055, z + dz]);
                    }
                for (const dz of [-legR, legR]) {
                    beam([x - legR, base, z + dz], [x + legR, base, z + dz], 0.1, frameMat);
                    if (base > 0.6)
                        beam(
                            [x - legR, 0.15, z + dz],
                            [x + legR, base - 0.1, z + dz],
                            0.045,
                            frameMat
                        );
                }
                const floor = cyl(r + 0.03, 0.1, shell, [x, base, z]);
                floor.userData.poolName = name;
                // Real inner/outer walls and a gate opening on the west side of stages 1 and 2.
                const gateH = 0.3,
                    gateW = Math.min(0.4, r * 0.48),
                    gap = 2 * Math.asin(gateW / (2 * r));
                const hasGate = stage.index < 2;
                const wallH = stage.depth + 0.2;
                const walls: Array<[number, ModelMaterial]> = [
                    [r + 0.045, shell],
                    [r, liner]
                ];
                for (const [radius, mat] of walls) {
                    const lower = new THREE.Mesh(
                        new THREE.CylinderGeometry(
                            radius,
                            radius,
                            hasGate ? wallH - gateH : wallH,
                            64,
                            1,
                            true
                        ),
                        mat
                    );
                    lower.position.set(x, base + (hasGate ? wallH - gateH : wallH) / 2, z);
                    root.add(lower);
                    lower.userData = { poolName: name, poolInfo: detail };
                    pickables.push(lower);
                    if (hasGate) {
                        const upper = new THREE.Mesh(
                            new THREE.CylinderGeometry(
                                radius,
                                radius,
                                gateH,
                                64,
                                1,
                                true,
                                Math.PI * 1.5 + gap / 2,
                                Math.PI * 2 - gap
                            ),
                            mat
                        );
                        upper.position.set(x, top - gateH / 2, z);
                        root.add(upper);
                    }
                }
                ring(r + 0.02, 0.035, steel, [x, top, z]);
                for (const f of [0.12, 0.7])
                    ring(r + 0.052, 0.016, steel, [x, base + wallH * f, z]);
                // Flexible lifting membrane stays at the bottom during normal operation.
                const membrane = cyl(r - 0.05, 0.025, material("#50676d", { roughness: 0.7 }), [
                    x,
                    base + 0.085,
                    z
                ]);
                info(
                    membrane,
                    `${name} · 池底充气膜`,
                    "传感器判定规格后联动充气与闸门，沿阶梯水槽流转至下一级池。"
                );
                const water = new THREE.Mesh(
                    new THREE.CircleGeometry(r - 0.015, 64),
                    material("#377f91", {
                        transparent: true,
                        opacity: 0.56,
                        roughness: 0.25,
                        metalness: 0.12,
                        depthWrite: false,
                        emissive: "#164655",
                        emissiveIntensity: 0.12,
                        side: THREE.DoubleSide
                    })
                );
                water.rotation.x = -Math.PI / 2;
                water.position.set(x, waterY, z);
                root.add(water);
                water.userData = { poolName: name, poolInfo: detail };
                pickables.push(water);
                poolSurfaces.set(name, water);
                animatedWater.push(water);
                ring(r * 0.65, 0.019, blue, [x, base + 0.13, z]);
                cyl(0.12, 0.07, steel, [x, base + 0.15, z]);
                for (let n = 0; n < 2; n++) {
                    const ripple = ring(
                        r * (0.34 + n * 0.24),
                        0.006,
                        material("#c2e6e8", {
                            transparent: true,
                            opacity: 0.18,
                            depthWrite: false
                        }),
                        [x, waterY + 0.008, z]
                    );
                }
                // Distinct physical connections: side inlet, centre bottom drain and aeration ring.
                tank.inlet = port(id + ":in", [x, waterY + 0.06, z - r + 0.12], [0, 0, 1], 0.06);
                tank.outlet = port(id + ":out", [x, base - 0.055, z], [0, 1, 0], 0.075);
                internal(tank.inlet, tank.outlet);
                tank.air = port(id + ":air", [x + r * 0.65, base + 0.13, z], [0, 1, 0], 0.025);
                const sensorX = x + r * 0.52,
                    sensorZ = z - r * 0.82;
                beam([sensorX, top - 0.04, sensorZ], [sensorX, top + 0.5, sensorZ], 0.035, steel);
                const sensor = box(root, 0.17, 0.13, 0.22, dark, sensorX, top + 0.5, sensorZ);
                info(
                    sensor,
                    name + " · 视觉传感器",
                    "规格监测、溶氧探头与转池挡板联动；参数为方案设计值。"
                );
                const lens = cyl(
                    0.035,
                    0.025,
                    material("#64d5d2", { emissive: "#3aa9ad", emissiveIntensity: 0.5 }),
                    [sensorX, top + 0.425, sensorZ]
                );
                const cabinet = box(
                    root,
                    0.23,
                    0.28,
                    0.1,
                    material("#b9c8c6"),
                    x + r * 0.72,
                    top - 0.18,
                    z + r * 0.72
                );
                tank.control = port(
                    id + ":control",
                    [cabinet.position.x, cabinet.position.y + 0.14, cabinet.position.z],
                    [0, 1, 0],
                    0.012,
                    false
                );
                tank.sensor = port(
                    id + ":sensor",
                    [sensorX, top + 0.5, sensorZ],
                    [0, 1, 0],
                    0.012,
                    false
                );
                link(
                    tank.sensor,
                    tank.control,
                    "control",
                    [
                        [sensorX, top + 0.08, sensorZ],
                        [cabinet.position.x, top + 0.08, sensorZ],
                        [cabinet.position.x, top + 0.08, cabinet.position.z]
                    ],
                    0.009
                );
                for (let i = 0; i < 3; i++)
                    cyl(0.015, 0.015, material(i === 0 ? "#4ec8a5" : "#899b9c"), [
                        cabinet.position.x - 0.06 + i * 0.06,
                        cabinet.position.y,
                        cabinet.position.z + 0.06
                    ]).rotation.x = Math.PI / 2;
                if (hasGate) {
                    const gy = top - gateH;
                    for (const dz of [-gateW / 2 - 0.035, gateW / 2 + 0.035])
                        box(root, 0.05, 0.66, 0.05, steel, x - r - 0.035, gy + 0.31, z + dz);
                    const gate = box(
                        root,
                        0.045,
                        gateH,
                        gateW,
                        steel,
                        x - r - 0.025,
                        gy + gateH / 2,
                        z
                    );
                    info(
                        gate,
                        name + " · 转池闸门",
                        "池底充气膜顶升后，开启挡板，水流经有坡度的水槽进入下一级池。"
                    );
                    tank.transferOut = [x - r - 0.035, gy + 0.015, z];
                }
                // Small, correctly coloured live shrimp; detailed geometry is shared across pools.
                const count = [12, 10, 8][stage.index];
                const instances = new THREE.InstancedMesh(shrimpGeometry, shrimpMat, count);
                instances.raycast = () => {};
                root.add(instances);
                farmSchools.push({
                    instances,
                    count,
                    x,
                    z,
                    r,
                    base,
                    waterY,
                    size: [0.045, 0.09, 0.16][stage.index],
                    seed: tank.i * 1.8
                });
                note(
                    `${id}  Φ${stage.diameter}m`,
                    [x, top - 0.14, z + r + 0.075],
                    Math.min(1.2, r * 1.1),
                    "#a9d1d5"
                );
            }
            tanksByStage.flat().forEach(makeTank);

            // Independent treatment loop for each stage, located at its head as in the drawing.
            const banks = stages.map((stage) => {
                const x = stage.equipmentX,
                    z = stage.equipmentZ,
                    scale = stage.index === 2 ? 1.35 : 0.83;
                const cx = x - 0.45 * scale;
                box(root, 3.8 * scale, 0.12, 3.1 * scale, dark, x, 0.12, z);
                // MBBR/biological tank beside the microfilter/protein separator unit.
                const bioR = 0.9 * scale,
                    bioY = 0.22;
                cyl(bioR, 1.62, shell, [cx - 0.72 * scale, bioY + 0.81, z]);
                ring(bioR + 0.015, 0.035, steel, [cx - 0.72 * scale, bioY + 1.64, z]);
                for (let n = 0; n < 8; n++)
                    beam(
                        [cx - 0.72 * scale, 1.87, z],
                        [
                            cx - 0.72 * scale + Math.cos((n * Math.PI) / 4) * bioR,
                            1.87,
                            z + Math.sin((n * Math.PI) / 4) * bioR
                        ],
                        0.025,
                        steel
                    );
                const unit = box(
                    root,
                    1.05 * scale,
                    1.1,
                    1.45 * scale,
                    material("#a4b8b9", { metalness: 0.54, roughness: 0.35 }),
                    x + 0.95 * scale,
                    0.85,
                    z
                );
                info(
                    unit,
                    stage.title + " · 微滤/蛋白分离组合",
                    `${stage.rate} m³/h；集污回水 → 微滤 → 蛋白分离 → 生化过滤 → UV → 循环泵 → 池侧供水。各阶段独立循环。`
                );
                box(root, 1.1 * scale, 0.055, 1.51 * scale, steel, x + 0.95 * scale, 1.43, z);
                // Removable microfilter cover with hinges, fasteners and a drive housing.
                box(
                    root,
                    0.7 * scale,
                    0.028,
                    0.95 * scale,
                    material("#778d94", { metalness: 0.62 }),
                    x + 0.95 * scale,
                    1.472,
                    z + 0.1 * scale
                );
                for (const dx of [-0.34, 0.34])
                    for (const dz of [-0.46, 0.46])
                        cyl(0.024, 0.032, steel, [
                            x + (0.95 + dx) * scale,
                            1.505,
                            z + (0.1 + dz) * scale
                        ]);
                box(root, 0.25, 0.21, 0.3, blue, x + 1.51 * scale, 1.1, z - 0.3 * scale);
                const skimmer = cyl(
                    0.23 * scale,
                    1.5,
                    material("#b0d3d1", { metalness: 0.15, transparent: true, opacity: 0.72 }),
                    [x + 0.96 * scale, 2.2, z - 0.37 * scale]
                );
                cyl(0.27 * scale, 0.22, shell, [x + 0.96 * scale, 3.03, z - 0.37 * scale]);
                ring(0.23 * scale, 0.025, steel, [x + 0.96 * scale, 2.78, z - 0.37 * scale]);
                // UV chamber and pump are connected to the tank inlet/outlet ports below.
                const uv = cyl(0.12, 0.95 * scale, steel, [x + 0.3 * scale, 0.63, z + 1.1 * scale]);
                uv.rotation.z = Math.PI / 2;
                box(
                    root,
                    0.66 * scale,
                    0.11,
                    0.56,
                    frameMat,
                    x - 0.85 * scale,
                    0.25,
                    z + 1.1 * scale
                );
                const motor = cyl(0.17, 0.45, blue, [x - 0.83 * scale, 0.55, z + 1.1 * scale]);
                motor.rotation.z = Math.PI / 2;
                const pumpCase = cyl(0.23, 0.2, steel, [x - 1.12 * scale, 0.55, z + 1.1 * scale]);
                pumpCase.rotation.z = Math.PI / 2;
                for (let f = 0; f < 5; f++)
                    ring(
                        0.172,
                        0.012,
                        steel,
                        [x - 0.68 * scale - f * 0.06, 0.55, z + 1.1 * scale],
                        [1, 0, 0]
                    );
                gauge([x - 1.15 * scale, 0.94, z + 1.1 * scale]);
                const prefix = `treatment-${stage.index}`;
                const filterIn = port(prefix + ":filter-in", [
                    x + 1.5 * scale,
                    0.55,
                    z + 0.5 * scale
                ]);
                const filterOut = port(
                    prefix + ":filter-out",
                    [x + 0.95 * scale, 0.65, z - 0.8 * scale],
                    [0, 0, 1]
                );
                const bioIn = port(
                    prefix + ":bio-in",
                    [cx - 0.72 * scale, 1.14, z - bioR],
                    [0, 0, 1]
                );
                const bioOut = port(
                    prefix + ":bio-out",
                    [cx - 0.72 * scale, 0.63, z + bioR],
                    [0, 0, 1]
                );
                const uvIn = port(prefix + ":uv-in", [x + 0.775 * scale, 0.63, z + 1.1 * scale]);
                const uvOut = port(prefix + ":uv-out", [x - 0.175 * scale, 0.63, z + 1.1 * scale]);
                const pumpIn = port(prefix + ":pump-in", [x - 0.55 * scale, 0.55, z + 1.1 * scale]);
                const pumpOut = port(prefix + ":pump-out", [
                    x - 1.25 * scale,
                    0.55,
                    z + 1.1 * scale
                ]);
                internal(filterIn, filterOut);
                internal(bioIn, bioOut);
                internal(uvIn, uvOut);
                internal(pumpIn, pumpOut);
                link(filterOut, bioIn, "return", [
                    [x + 0.95 * scale, 0.65, z - 1.1 * scale],
                    [cx - 0.72 * scale, 0.65, z - 1.1 * scale],
                    [cx - 0.72 * scale, 1.14, z - 1.1 * scale]
                ]);
                link(bioOut, uvIn, "supply", [
                    [cx - 0.72 * scale, 0.63, z + 1.49 * scale],
                    [x + 0.775 * scale, 0.63, z + 1.49 * scale]
                ]);
                link(uvOut, pumpIn, "supply", [
                    [x - 0.35 * scale, 0.63, z + 1.1 * scale],
                    [x - 0.35 * scale, 0.55, z + 1.1 * scale]
                ]);
                // Dedicated blower, compressor and a 150 L feed silo per stage.
                const airX = x + 1.45 * scale,
                    airZ = z - 1.42 * scale;
                box(root, 0.46, 0.38, 0.47, blue, airX, 0.32, airZ);
                const airOut = port(prefix + ":air", [airX, 0.51, airZ], [0, 1, 0], 0.025);
                const siloX = x - 1.7 * scale,
                    siloZ = z - 1.55 * scale;
                for (const dx of [-0.24, 0.24])
                    beam([siloX + dx, 0.06, siloZ], [siloX + dx, 1.25, siloZ], 0.05, steel);
                cyl(0.33, 0.64, material("#c1c7b7", { metalness: 0.12 }), [siloX, 1.57, siloZ]);
                cyl(0.08, 0.4, steel, [siloX, 1.05, siloZ], 0.33);
                const siloOut = port(prefix + ":feed", [siloX, 0.85, siloZ], [0, 1, 0], 0.035);
                note(`${stage.title}  ${stage.rate}m³/h`, [x, 3.35, z + 0.4], 3.2, stage.color);
                return { filterIn, pumpOut, airOut, siloOut };
            });

            // Every trunk is segmented at its branch junction, ensuring shared endpoints.
            stages.forEach((stage, stageIndex) => {
                const tanks = tanksByStage[stageIndex],
                    bank = banks[stageIndex];
                const supplyY = stage.base + 0.4,
                    returnY = 0.09,
                    airY = stage.base + 0.16,
                    feedY = 4.05;
                const headZ = Math.min(
                    stage.equipmentZ + 2,
                    Math.min(...tanks.map((t) => t.z - t.r)) - 0.6
                );
                let prevSupply = port(
                    `s${stageIndex}:supply-head`,
                    [stage.supplyX, supplyY, headZ],
                    [0, 0, 1],
                    0.07
                );
                let prevReturn = port(
                    `s${stageIndex}:return-head`,
                    [stage.wasteX, returnY, headZ],
                    [0, 0, 1],
                    0.085
                );
                let prevAir = port(
                    `s${stageIndex}:air-head`,
                    [stage.airX, airY, headZ],
                    [0, 0, 1],
                    0.025
                );
                let prevFeed = port(
                    `s${stageIndex}:feed-head`,
                    [stage.feedX, feedY, headZ],
                    [0, 0, 1],
                    0.035
                );
                const supplyHead = node(prevSupply),
                    returnHead = node(prevReturn),
                    airHead = node(prevAir),
                    feedHead = node(prevFeed);
                const bankPump = node(bank.pumpOut),
                    filterIn = node(bank.filterIn),
                    airOut = node(bank.airOut),
                    silo = node(bank.siloOut);
                link(
                    bank.pumpOut,
                    prevSupply,
                    "supply",
                    [
                        [bankPump[0], 0.55, supplyHead[2]],
                        [supplyHead[0], 0.55, supplyHead[2]]
                    ],
                    0.085,
                    true
                );
                link(
                    prevReturn,
                    bank.filterIn,
                    "return",
                    [
                        [returnHead[0], returnY, filterIn[2]],
                        [filterIn[0] + 0.28, returnY, filterIn[2]],
                        [filterIn[0] + 0.28, filterIn[1], filterIn[2]]
                    ],
                    0.09,
                    true
                );
                link(
                    bank.airOut,
                    prevAir,
                    "air",
                    [
                        [airOut[0], airOut[1], airHead[2]],
                        [airHead[0], airOut[1], airHead[2]]
                    ],
                    0.025
                );
                link(
                    bank.siloOut,
                    prevFeed,
                    "feed",
                    [
                        [silo[0], feedY, silo[2]],
                        [feedHead[0], feedY, silo[2]]
                    ],
                    0.035,
                    true
                );
                const rows = [...new Set(tanks.map((t) => t.z))].sort((a, b) => a - b);
                rows.forEach((z, rowIndex) => {
                    const row = tanks.filter((t) => t.z === z),
                        r = row[0].r;
                    const supplyZ = z - r - 0.16,
                        returnZ = z + r + 0.16;
                    const sj = port(
                        `s${stageIndex}:s${rowIndex}`,
                        [stage.supplyX, supplyY, supplyZ],
                        [0, 0, 1],
                        0.065
                    );
                    const rj = port(
                        `s${stageIndex}:r${rowIndex}`,
                        [stage.wasteX, returnY, returnZ],
                        [0, 0, 1],
                        0.075
                    );
                    const aj = port(
                        `s${stageIndex}:a${rowIndex}`,
                        [stage.airX, airY, returnZ],
                        [0, 0, 1],
                        0.025
                    );
                    const fj = port(
                        `s${stageIndex}:f${rowIndex}`,
                        [stage.feedX, feedY, z],
                        [0, 0, 1],
                        0.035
                    );
                    link(prevSupply, sj, "supply", [], 0.075, true);
                    link(rj, prevReturn, "return", [], 0.085, true);
                    link(prevAir, aj, "air", [], 0.025);
                    link(prevFeed, fj, "feed", [], 0.035, true);
                    prevSupply = sj;
                    prevReturn = rj;
                    prevAir = aj;
                    prevFeed = fj;
                    row.forEach((tank) => {
                        const air = node(tank.air);
                        link(
                            sj,
                            tank.inlet,
                            "supply",
                            [
                                [tank.x, supplyY, supplyZ],
                                [tank.x, tank.waterY + 0.06, supplyZ]
                            ],
                            0.055
                        );
                        valve([tank.x, supplyY, supplyZ]);
                        link(
                            tank.outlet,
                            rj,
                            "return",
                            [
                                [tank.x, returnY, tank.z],
                                [tank.x, returnY, returnZ]
                            ],
                            0.065
                        );
                        link(
                            aj,
                            tank.air,
                            "air",
                            [
                                [air[0], airY, returnZ],
                                [air[0], airY, tank.z]
                            ],
                            0.021
                        );
                        const hopperY = tank.top + 0.48,
                            hopperX = tank.x + tank.r * 0.42;
                        const hopper = cyl(0.115, 0.26, material("#c5ceca", { metalness: 0.15 }), [
                            hopperX,
                            hopperY,
                            tank.z
                        ]);
                        cyl(0.035, 0.12, steel, [hopperX, hopperY - 0.19, tank.z], 0.115);
                        beam(
                            [hopperX, tank.top, tank.z + tank.r * 0.65],
                            [hopperX, hopperY + 0.18, tank.z],
                            0.03,
                            steel
                        );
                        const feedPort = port(
                            tank.id + ":feed",
                            [hopperX, hopperY + 0.16, tank.z],
                            [0, 1, 0],
                            0.025
                        );
                        link(fj, feedPort, "feed", [[hopperX, feedY, tank.z]], 0.026);
                        info(
                            hopper,
                            tank.name + " · 定量投喂",
                            "料仓 → 顶部输料总管 → 池位分配支路 → 投饲料桶；与本阶段供料系统连接。"
                        );
                        const braceX = stageIndex === 2 ? -9.45 : stageIndex === 1 ? 2.05 : 8.15;
                        if (tank.i % (stageIndex === 2 ? 2 : 3) === 0) {
                            beam([braceX, 0.05, z], [braceX, feedY + 0.12, z], 0.045, steel);
                            beam([braceX, feedY, z], [stage.feedX, feedY, z], 0.035, steel);
                        }
                    });
                });
            });

            // Signal wires terminate in each local cabinet and join the shared overhead tray.
            const plc = box(
                root,
                0.7,
                1.15,
                0.3,
                material("#a3b7b8", { metalness: 0.32 }),
                -10.5,
                1.2,
                -13.9
            );
            info(
                plc,
                "联动控制柜",
                "视觉规格检测 → 池底充气膜 → 池壁挡板；供料与各段水循环设备由同一控制网络连接。"
            );
            box(
                root,
                0.31,
                0.22,
                0.025,
                material("#22758b", { emissive: "#165668", emissiveIntensity: 0.3 }),
                -10.5,
                1.44,
                -13.74
            );
            const plcPort = port("control:plc", [-10.5, 1.78, -13.9], [0, 1, 0], 0.012, false);
            let lastControl = plcPort;
            stages
                .slice()
                .reverse()
                .forEach((stage) => {
                    const head = port(
                        `control:stage${stage.index}`,
                        [stage.feedX + 0.2, 4.34, -14.7],
                        [0, 0, 1],
                        0.012,
                        false
                    );
                    const prev = node(lastControl),
                        point = node(head);
                    link(
                        lastControl,
                        head,
                        "control",
                        lastControl === plcPort
                            ? [
                                  [prev[0], 4.34, prev[2]],
                                  [prev[0], 4.34, -14.7]
                              ]
                            : [],
                        0.018
                    );
                    box(
                        root,
                        Math.abs(point[0] - prev[0]),
                        0.045,
                        0.12,
                        steel,
                        (point[0] + prev[0]) / 2,
                        4.29,
                        -14.7
                    );
                    lastControl = head;
                    let trunk = head;
                    tanksByStage[stage.index].forEach((tank) => {
                        const junction = port(
                            tank.id + ":control-junction",
                            [stage.feedX + 0.2, 4.34, tank.z],
                            [0, 0, 1],
                            0.012,
                            false
                        );
                        const from = node(trunk),
                            to = node(junction);
                        if (vec(from).distanceTo(vec(to)) > 0.0001)
                            link(trunk, junction, "control", [], 0.012);
                        else internal(trunk, junction);
                        const end = node(tank.control);
                        link(junction, tank.control, "control", [[end[0], 4.34, end[2]]], 0.009);
                        trunk = junction;
                    });
                });

            function trough(points: Vec3[], title: string) {
                const shellPositions: number[] = [],
                    waterPositions: number[] = [];
                const quad = (
                    array: number[],
                    a: ThreeTypes.Vector3,
                    b: ThreeTypes.Vector3,
                    c: ThreeTypes.Vector3,
                    d: ThreeTypes.Vector3
                ) => [a, b, d, b, c, d].forEach((p) => array.push(p.x, p.y, p.z));
                const w = 0.32,
                    h = 0.15;
                for (let i = 1; i < points.length; i++) {
                    const a = vec(points[i - 1]),
                        b = vec(points[i]);
                    const side = new THREE.Vector3(b.z - a.z, 0, a.x - b.x)
                        .normalize()
                        .multiplyScalar(w / 2);
                    const p = a.clone().add(side),
                        q = a.clone().sub(side),
                        r = b.clone().sub(side),
                        s = b.clone().add(side);
                    const lift = new THREE.Vector3(0, h, 0),
                        waterLift = new THREE.Vector3(0, 0.034, 0);
                    quad(shellPositions, p, q, r, s);
                    quad(shellPositions, p, s, s.clone().add(lift), p.clone().add(lift));
                    quad(shellPositions, r, q, q.clone().add(lift), r.clone().add(lift));
                    quad(
                        waterPositions,
                        p.clone().add(waterLift),
                        q.clone().add(waterLift),
                        r.clone().add(waterLift),
                        s.clone().add(waterLift)
                    );
                }
                const layers: Array<[number[], ModelMaterial]> = [
                    [
                        shellPositions,
                        material("#8caeb6", {
                            metalness: 0.48,
                            roughness: 0.4,
                            side: THREE.DoubleSide
                        })
                    ],
                    [
                        waterPositions,
                        material("#4698b3", {
                            transparent: true,
                            opacity: 0.65,
                            side: THREE.DoubleSide
                        })
                    ]
                ];
                for (const [positions, mat] of layers) {
                    const geo = new THREE.BufferGeometry();
                    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
                    geo.computeVertexNormals();
                    const mesh = info(
                        new THREE.Mesh(geo, mat),
                        title,
                        "与池壁转运开口对接；按池面高差向下一级流转。水槽和日常循环管线分别布置。"
                    );
                    root.add(mesh);
                }
                root.userData.transfers.push({ title, points });
            }
            root.userData.transfers = [];
            tanksByStage[0].forEach((tank, i) => {
                const target = tanksByStage[1][i];
                const start = tank.transferOut,
                    end: Vec3 = [target.x + target.r - 0.07, target.top + 0.035, target.z];
                trough(
                    [start, [5.58, start[1] - 0.08, start[2]], [5.58, end[1] + 0.12, end[2]], end],
                    `${tank.name} → ${target.name}`
                );
            });
            tanksByStage[1].forEach((tank, i) => {
                const target = tanksByStage[2][i];
                const start = tank.transferOut,
                    approachZ = target.z + target.r + 0.22;
                const end: Vec3 = [target.x, target.top + 0.035, target.z + target.r - 0.06];
                trough(
                    [
                        start,
                        [0.15, start[1] - 0.08, start[2]],
                        [0.15, end[1] + 0.18, approachZ],
                        [target.x, end[1] + 0.07, approachZ],
                        end
                    ],
                    `${tank.name} → ${target.name}`
                );
            });
            note("三级成虾  Φ4m · 2列×4池", [-5.1, 0.6, 11.8], 5.3);
            note("二级过渡虾  Φ2.5m · 单列8池", [3.2, 1.0, 11.65], 4.0);
            note("一级幼虾  Φ1.5m · 单列8池", [7.4, 1.55, 11.65], 3.5);
            root.userData.layout = {
                source: "渔机所汇报0406 / 第14、17、18、24页",
                tanks: tanksByStage
                    .flat()
                    .map((t) => ({
                        id: t.id,
                        name: t.name,
                        x: t.x,
                        z: t.z,
                        diameter: t.stage.diameter,
                        base: t.base,
                        top: t.top,
                        waterY: t.waterY,
                        inlet: t.inlet,
                        outlet: t.outlet,
                        air: t.air
                    })),
                nodes: Object.fromEntries(nodes),
                edges
            };
            return root;
        }

        // Same anatomy as RAS: vertex-coloured shell, six abdomen segments,
        // rostrum, paired antennae, stalked eyes, five pairs of legs and tail fan.
        function createFarmShrimpGeometry(): ThreeTypes.BufferGeometry {
            const parts: ThreeTypes.BufferGeometry[] = [];
            const shell = new THREE.Color("#a1b0a0"),
                stripe = new THREE.Color("#687f72");
            const add = (geometry: ThreeTypes.BufferGeometry, color: ThreeTypes.Color) => {
                const g = geometry.index ? geometry.toNonIndexed() : geometry;
                if (g !== geometry) geometry.dispose();
                const colors = new Float32Array(g.attributes.position.count * 3);
                for (let i = 0; i < colors.length; i += 3) {
                    colors[i] = color.r;
                    colors[i + 1] = color.g;
                    colors[i + 2] = color.b;
                }
                g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
                parts.push(g);
            };
            const ellipsoid = (
                x: number,
                y: number,
                z: number,
                sx: number,
                sy: number,
                sz: number,
                color: ThreeTypes.Color = shell
            ) => {
                const g = new THREE.SphereGeometry(1, 8, 5);
                g.scale(sx, sy, sz);
                g.translate(x, y, z);
                add(g, color);
            };
            const limb = (points: Vec3[], radius: number, color: ThreeTypes.Color = shell) =>
                add(
                    new THREE.TubeGeometry(
                        new THREE.CatmullRomCurve3(
                            points.map((p: Vec3) => new THREE.Vector3(...p))
                        ),
                        points.length * 3,
                        radius,
                        4,
                        false
                    ),
                    color
                );
            ellipsoid(0, 0.06, 0.24, 0.105, 0.1, 0.23);
            for (let i = 0; i < 6; i++)
                ellipsoid(
                    0,
                    0.035 - i * i * 0.004,
                    -0.015 - i * 0.078,
                    0.09 * (1 - i * 0.1),
                    0.075 * (1 - i * 0.1),
                    0.058,
                    i % 2 ? stripe : shell
                );
            limb(
                [
                    [0, 0.09, 0.38],
                    [0, 0.13, 0.53]
                ],
                0.012
            );
            for (const side of [-1, 1]) {
                ellipsoid(side * 0.09, 0.12, 0.37, 0.025, 0.025, 0.025, new THREE.Color("#19372e"));
                limb(
                    [
                        [side * 0.05, 0.06, 0.4],
                        [side * 0.17, 0.1, 0.64],
                        [side * 0.36, 0.11, 0.85]
                    ],
                    0.006
                );
                for (let i = 0; i < 5; i++)
                    limb(
                        [
                            [side * 0.07, 0, 0.29 - i * 0.065],
                            [side * 0.18, -0.075, 0.2 - i * 0.065],
                            [side * 0.23, -0.08, 0.31 - i * 0.09]
                        ],
                        0.008
                    );
                ellipsoid(side * 0.075, -0.12, -0.48, 0.085, 0.018, 0.1, stripe);
            }
            ellipsoid(0, -0.12, -0.5, 0.045, 0.02, 0.1);
            const geometry = new THREE.BufferGeometry();
            for (const attr of ["position", "normal", "color"] as const) {
                const data = new Float32Array(
                    parts.reduce((n, p) => n + p.attributes[attr].array.length, 0)
                );
                let offset = 0;
                parts.forEach((p) => {
                    data.set(p.attributes[attr].array, offset);
                    offset += p.attributes[attr].array.length;
                });
                geometry.setAttribute(attr, new THREE.BufferAttribute(data, 3));
            }
            parts.forEach((p) => p.dispose());
            geometry.computeBoundingSphere();
            return geometry;
        }

        function animateFarm(time: number) {
            const dummy = new THREE.Object3D();
            farmSchools.forEach((school) => {
                for (let i = 0; i < school.count; i++) {
                    const phase = i * 2.39996 + school.seed,
                        angle = phase + time * 0.015;
                    const r = Math.sqrt((i + 0.5) / school.count) * school.r * 0.76;
                    const y =
                        i % 4 === 0 ? school.waterY - 0.11 : school.base + 0.17 + (i % 3) * 0.035;
                    dummy.position.set(
                        school.x + Math.cos(angle) * r,
                        y,
                        school.z + Math.sin(angle) * r
                    );
                    dummy.rotation.set(0, -angle + Math.PI, Math.sin(time + i) * 0.012);
                    dummy.scale.setScalar(school.size);
                    dummy.updateMatrix();
                    school.instances.setMatrixAt(i, dummy.matrix);
                }
                school.instances.instanceMatrix.needsUpdate = true;
            });
            farmFlows.forEach((flow) => {
                const p = flow.path.getPoint((time * flow.speed + flow.offset) % 1);
                flow.dot.position.copy(p);
                flow.dot.position.y += 0.02;
            });
        }

        function updateLabel(title: string, detail: string) {
            options.onPoolHover?.(title);
            options.onInfo?.(title, detail);
        }

        function highlightSelectedPool() {
            poolSurfaces.forEach((surface, poolName) => {
                surface.material.emissive.set(
                    poolName === selected ? "#ffe271" : surface.material.color
                );
                surface.material.emissiveIntensity = poolName === selected ? 0.65 : 0.12;
            });
        }

        function renderModel(mode: ViewMode) {
            activeMode = mode;
            scene.remove(modelRoot);
            modelRoot.traverse((object) => {
                const mesh = object as ThreeTypes.Mesh<
                    ThreeTypes.BufferGeometry,
                    ThreeTypes.Material | ThreeTypes.Material[]
                >;
                if (!mesh.isMesh) return;
                mesh.geometry.dispose();
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((item: ThreeTypes.Material) => {
                    const texture = (item as ThreeTypes.MeshStandardMaterial).map;
                    texture?.dispose();
                    item.dispose();
                });
            });
            poolSurfaces.clear();
            animatedWater.length = 0;
            animatedRipples.length = 0;
            pickables.length = 0;
            farmSchools.length = 0;
            farmFlows.length = 0;
            farmInfo.clear();
            modelRoot = mode === "complex" ? makeComplex() : makeFarm();
            scene.add(modelRoot);
            host.dataset.model = mode;
            host.dataset.layout = mode === "farm" ? JSON.stringify(modelRoot.userData.layout) : "";
            host.dataset.transfers =
                mode === "farm" ? JSON.stringify(modelRoot.userData.transfers) : "";
            highlightSelectedPool();
            const orbit = controls;
            if (!orbit) return;
            orbit.target.set(0, mode === "complex" ? 15 : 1.6, mode === "complex" ? 0 : -1.2);
            ground.visible = mode === "complex";
            grid.visible = mode === "complex";
            const position: [number, number, number] =
                mode === "complex" ? [102, 77, 112] : [29, 31, 39];
            camera.position.set(...position);
            orbit.minDistance = mode === "complex" ? 24 : 3;
            orbit.maxDistance = mode === "complex" ? 240 : 110;
            orbit.update();
            orbit.saveState();
            if (mode === "complex")
                updateLabel(
                    "规划 11 层 · 地上 10 层 · 地下 B1",
                    "建筑面积约 55,000 m² · 点击楼层查看功能分区"
                );
            else
                updateLabel(
                    "凡纳滨对虾 · 三段闭环养殖",
                    "按原图布置 · Φ4m 两列四行 / Φ2.5m、Φ1.5m 各单列八池 · 各段独立水循环"
                );
        }

        const zoomModel = (factor: number) => {
            const orbit = controls;
            if (!orbit) return;
            const offset = camera.position.clone().sub(orbit.target);
            const distance = THREE.MathUtils.clamp(
                offset.length() * factor,
                orbit.minDistance,
                orbit.maxDistance
            );
            camera.position.copy(orbit.target).add(offset.setLength(distance));
            orbit.update();
        };

        const canvasRenderer = renderer;
        if (!canvasRenderer) throw new Error("WebGL renderer unavailable");
        canvasRenderer.domElement.addEventListener("pointermove", (event) => {
            const bounds = canvasRenderer.domElement.getBoundingClientRect();
            pointer.set(
                ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
                -((event.clientY - bounds.top) / bounds.height) * 2 + 1
            );
            raycaster.setFromCamera(pointer, camera);
            const hit = raycaster.intersectObjects(pickables, false)[0]?.object;
            if (hit?.userData.poolName) {
                updateLabel(
                    hit.userData.poolName,
                    hit.userData.poolInfo || "运行正常 · 点击选择该池位"
                );
                canvasRenderer.domElement.style.cursor = "pointer";
            } else if (hit?.userData.title) {
                updateLabel(hit.userData.title, hit.userData.detail);
                canvasRenderer.domElement.style.cursor = "pointer";
            } else if (activeMode === "complex" && Number.isInteger(hit?.userData.floorLevel)) {
                const floor = floors.find((item) => item.level === hit.userData.floorLevel);
                if (floor) updateLabel(floor.title, floor.detail);
                canvasRenderer.domElement.style.cursor = "pointer";
            } else canvasRenderer.domElement.style.cursor = "grab";
        });
        canvasRenderer.domElement.addEventListener("pointerleave", () => {
            if (activeMode === "complex")
                updateLabel(
                    "规划 11 层 · 地上 10 层 · 地下 B1",
                    "建筑面积约 55,000 m² · 点击楼层查看功能分区"
                );
            else
                updateLabel(
                    "凡纳滨对虾 · 三段闭环养殖",
                    "按原图布置 · Φ4m 两列四行 / Φ2.5m、Φ1.5m 各单列八池 · 各段独立水循环"
                );
        });
        canvasRenderer.domElement.addEventListener("click", () => {
            const hit = raycaster.intersectObjects(pickables, false)[0]?.object;
            if (hit?.userData.poolName) {
                selected = hit.userData.poolName;
                options.onPoolClick?.(selected);
                highlightSelectedPool();
                updateLabel(selected, hit.userData.poolInfo || "已选池位 · 当前模型中已高亮");
            } else if (activeMode === "complex" && Number.isInteger(hit?.userData.floorLevel))
                options.onFloorClick?.(Number(hit.userData.floorLevel));
        });

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
        const clock = new THREE.Clock();
        const animate = () => {
            if (!active || !renderer || !controls) return;
            frame = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();
            if (activeMode === "farm") animateFarm(time);
            animatedWater.forEach((water, index) => {
                water.material.emissiveIntensity =
                    water.userData.poolName === selected
                        ? 0.65
                        : 0.09 + (Math.sin(time * 1.7 + index * 0.3) + 1) * 0.035;
            });
            animatedRipples.forEach((ripple) => {
                const phase = time * 0.72 + (ripple.userData.phase ?? 0);
                ripple.scale.setScalar(0.78 + (Math.sin(phase) + 1) * 0.11);
                ripple.material.opacity = 0.18 + (Math.sin(phase) + 1) * 0.09;
            });
            controls.update();
            renderer.render(scene, camera);
            renderer.domElement.dataset.rendered = "true";
        };
        animate();
        rebuild = renderModel;
        select = highlightSelectedPool;
        zoom = zoomModel;
        reset = () => controls?.reset();
        renderModel(currentMode);
    };
    void start().catch(options.onError);
    return {
        setMode: (m) => {
            currentMode = m;
            rebuild(m);
        },
        selectPool: (n) => {
            selected = n;
            select();
        },
        zoom: (f) => zoom(f),
        reset: () => reset(),
        dispose: () => {
            active = false;
            cancelAnimationFrame(frame);
            observer?.disconnect();
            renderer?.dispose();
            controls?.dispose();
            renderer?.domElement.remove();
        }
    };
}
