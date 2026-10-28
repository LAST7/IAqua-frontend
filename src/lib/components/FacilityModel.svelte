<script lang="ts">
    import { onMount } from "svelte";
    import {
        createFacilityModel,
        FACILITY_FLOORS,
        type ModelLoadState,
        type ModelQuality,
        type ViewMode
    } from "$lib/three/facility-model";

    let {
        selectedPool = "",
        onSelectPool,
        onFloorClick,
        initialMode = "farm",
        dark = false
    }: {
        selectedPool?: string;
        onSelectPool: (name: string) => void;
        onFloorClick?: (level: number) => void;
        initialMode?: ViewMode;
        dark?: boolean;
    } = $props();
    const mode = $derived(initialMode);
    let hoveredPool = $state("");
    let selectedFloor = $state(2);
    let error = $state("");
    let infoTitle = $state("");
    let infoDetail = $state("");
    let loadState = $state<ModelLoadState>({
        quality: "low",
        progress: 0,
        stage: "准备轻量模型",
        ready: false,
        loadingLow: true
    });
    let canvasHost: HTMLDivElement;
    let engine: ReturnType<typeof createFacilityModel>;
    const floorInfo = $derived(
        FACILITY_FLOORS.find((floor) => floor.level === selectedFloor) ?? FACILITY_FLOORS[2]
    );
    const currentPool = $derived(hoveredPool || selectedPool);

    onMount(() => {
        engine = createFacilityModel({
            host: canvasHost,
            initialMode,
            selectedPool,
            onPoolClick: onSelectPool,
            onFloorClick: (level) => {
                selectedFloor = level;
                onFloorClick?.(level);
            },
            onInfo: (title, detail) => {
                infoTitle = title;
                infoDetail = detail;
            },
            onPoolHover: (name) => (hoveredPool = name),
            onStatus: (state) => (loadState = state),
            onError: (cause) => {
                error = String(cause);
            }
        });
        return () => engine.dispose();
    });
    $effect(() => engine?.setMode(mode));
    $effect(() => engine?.selectPool(selectedPool));
</script>

<section
    class="mt-[22px] bg-transparent text-slate-900 dark:text-slate-100"
    aria-labelledby="model-title"
>
    <div class="mb-3 flex items-end justify-between gap-5">
        <div>
            <p
                class="m-0 text-[13px] font-bold text-slate-500 dark:text-cyan-300"
                class:text-cyan-300={dark}
            >
                空间模型 · 可交互浏览
            </p>
            <h2
                id="model-title"
                class="m-0 text-[23px] font-bold text-slate-900 dark:text-white"
                class:text-white={dark}
            >
                {mode === "complex" ? "高层立体养殖综合体" : "二层三级循环水养殖工厂"}
            </h2>
        </div>
        <span
            class="border border-teal-600/50 px-3 py-2 text-xs font-bold text-teal-700 dark:text-teal-200"
            class:!text-teal-200={dark}>{mode === "complex" ? "总览模型" : "二层设施模型"}</span
        >
    </div>
    <div class="mb-3 border border-slate-700 bg-slate-950/90 p-3 text-cyan-100">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs" role="status">{loadState.stage} · {loadState.progress}%</p>
            <div class="flex gap-2" role="group" aria-label="模型精度">
                {#each ["low", "high"] as quality}
                    <button
                        type="button"
                        class="min-h-10 border border-cyan-700 px-3 py-2 text-xs text-cyan-100 enabled:hover:bg-cyan-900 disabled:cursor-wait disabled:opacity-40"
                        class:bg-cyan-900={loadState.quality === quality}
                        aria-pressed={loadState.quality === quality}
                        disabled={quality === "high"
                            ? !loadState.ready
                            : loadState.loadingLow || loadState.fatal}
                        onclick={() => engine?.selectQuality(quality as ModelQuality)}
                        >{quality === "low" ? "低精度 · 流畅" : "高精度 · 细节"}</button
                    >
                {/each}
            </div>
        </div>
        <progress
            class="mt-2 h-1 w-full accent-cyan-400"
            value={loadState.progress}
            max="100"
            aria-label={loadState.loadingLow ? "低精度模型加载进度" : "高精度模型准备进度"}
        ></progress>
    </div>
    <div class="min-h-[590px] overflow-hidden border border-slate-700 bg-[#020914] text-slate-100">
        <div
            class="relative min-h-[590px] overflow-hidden max-[620px]:min-h-[480px]"
            bind:this={canvasHost}
            aria-label={mode === "complex"
                ? "十层地上、一层地下的养殖综合体三维模型"
                : "二层三级循环水养殖工厂三维模型"}
        >
            <div
                class="pointer-events-none absolute top-4 left-4 z-10 grid max-w-[min(390px,calc(100%-92px))] gap-1 border-l-[3px] border-teal-500 bg-slate-950/90 px-3 py-2 text-white"
            >
                {#if mode === "complex"}<span class="text-xs text-teal-200"
                        >冯家湾 · 高层立体养殖</span
                    ><strong>{floorInfo.title}</strong><small>{floorInfo.detail}</small>{:else}<span
                        class="text-xs text-teal-200">分级闭环养殖 · 凡纳滨对虾</span
                    ><strong>{currentPool || "三级养殖池组"}</strong><small
                        >池径 1.5 / 2.5 / 4 m　·　密度 6,000 / 1,700 / 640 尾/m³</small
                    >{/if}
            </div>
            <div class="absolute top-4 right-4 z-10 grid gap-1">
                <button
                    type="button"
                    class="size-9 border border-slate-500 bg-slate-950/90 text-xl text-teal-200"
                    aria-label="放大模型"
                    onclick={() => engine?.zoom(0.82)}>+</button
                ><button
                    type="button"
                    class="size-9 border border-slate-500 bg-slate-950/90 text-xl text-teal-200"
                    aria-label="缩小模型"
                    onclick={() => engine?.zoom(1.22)}>−</button
                ><button
                    type="button"
                    class="size-9 border border-slate-500 bg-slate-950/90 text-xl text-teal-200"
                    aria-label="重置视角"
                    onclick={() => engine?.reset()}>↺</button
                >
            </div>
            {#if infoTitle}<div
                    class="pointer-events-none absolute inset-x-4 bottom-12 bg-slate-950/90 p-3 text-xs text-cyan-100"
                >
                    <strong>{infoTitle}</strong>
                    <p>{infoDetail}</p>
                </div>{/if}
            <span
                class="pointer-events-none absolute bottom-3 left-4 bg-slate-950/80 px-2 py-1 text-xs text-teal-100"
                >拖动旋转 · 滚轮缩放 · 点击楼层或池位查看</span
            >{#if error}<p
                    class="absolute bottom-12 left-4 z-10 bg-red-950/90 p-2 text-sm text-red-100"
                    role="alert"
                >
                    三维模型加载失败：{error}
                </p>{/if}
        </div>
    </div>
</section>
