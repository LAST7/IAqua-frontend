<script lang="ts">
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import ChongmingDetail from "$lib/components/ChongmingDetail.svelte";
    import { type Site } from "$lib/site-data";

    let { site }: { site: Site } = $props();

    const aerators = [
        {
            id: 1,
            name: "1 号增氧机",
            power: 78,
            runtime: "08:12",
            status: "运行中",
            statusTone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
        },
        {
            id: 2,
            name: "2 号增氧机",
            power: 62,
            runtime: "07:48",
            status: "待机",
            statusTone: "bg-slate-500/10 text-slate-500 border-slate-400/30"
        },
        {
            id: 3,
            name: "3 号增氧机",
            power: 81,
            runtime: "08:25",
            status: "运行中",
            statusTone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
        },
        {
            id: 4,
            name: "4 号增氧机",
            power: 54,
            runtime: "06:36",
            status: "联动中",
            statusTone: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30"
        },
        {
            id: 5,
            name: "5 号增氧机",
            power: 69,
            runtime: "07:20",
            status: "运行中",
            statusTone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
        },
        {
            id: 6,
            name: "6 号增氧机",
            power: 47,
            runtime: "05:58",
            status: "待机",
            statusTone: "bg-slate-500/10 text-slate-500 border-slate-400/30"
        }
    ] as const;

    const sensorTiles = [
        { label: "水温", value: "27.4", unit: "°C", tone: "text-cyan-700 dark:text-cyan-300" },
        { label: "pH", value: "7.6", unit: "", tone: "text-emerald-700 dark:text-emerald-300" },
        { label: "溶氧", value: "6.9", unit: "mg/L", tone: "text-sky-700 dark:text-sky-300" },
        { label: "液位", value: "92", unit: "%", tone: "text-amber-700 dark:text-amber-300" }
    ] as const;

    let selectedAerator = $state(1);
    let isRunning = $state(true);
    let targetSpeed = $state(1280);
    let intervalMinutes = $state(18);
    let boostMinutes = $state(12);
    let temperatureAlarm = $state(28);
    let phLow = $state(7.2);
    let phHigh = $state(7.8);
    let actionMessage = $state("增氧机组联动正常");

    let currentAerator = $derived(
        aerators.find((item) => item.id === selectedAerator) ?? aerators[0]
    );

    function selectAerator(id: number) {
        selectedAerator = id;
        actionMessage = `${id} 号增氧机参数已切换`;
    }

    function toggleAerator() {
        isRunning = !isRunning;
        actionMessage = isRunning
            ? `${currentAerator.name}已重新启动`
            : `${currentAerator.name}已停止`;
    }
</script>

<svelte:head><title>{site.name} | 水产养殖 GIS 集成视图</title></svelte:head>

<main
    class="min-h-screen bg-[#edf2f3] p-4 text-[#15242b] md:p-7 dark:bg-[#0d171c] dark:text-[#dce8ec]"
>
    <header
        class="mx-auto flex max-w-420 flex-wrap items-center justify-between gap-4 border-b border-[#cbd8dc] pb-4 dark:border-[#31464d]"
    >
        <div class="flex items-center gap-4">
            <a
                class="text-base font-bold text-[#176876] no-underline hover:underline dark:text-[#75d1cd]"
                href="/"
            >
                返回基地地图
            </a>
            <span class="hidden h-5 border-l border-[#b9c8cc] sm:block"></span>
            <div>
                <p class="m-0 text-sm font-bold text-[#60757b]">基地监控</p>
                <h1 class="m-0 text-2xl font-bold md:text-3xl">{site.name}</h1>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <span
                class="rounded border border-[#b6c7cb] bg-[#f4f8f9] px-2.5 py-1.5 text-sm font-bold text-[#567079] dark:border-[#445b61] dark:bg-[#132126] dark:text-[#bdd7dc]"
            >
                在线监控
            </span>
            <span class="hidden text-sm text-[#60757b] md:block">6 台增氧机</span>
            <ThemeToggle />
        </div>
    </header>

    <section class="mx-auto mt-5 grid max-w-420 gap-5 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <aside class="space-y-5">
            <section
                class="rounded-none border border-[#cad7da] bg-white p-4 dark:border-[#3b555a] dark:bg-[#15242a]"
            >
                <div class="flex items-center justify-between">
                    <h2 class="m-0 text-lg font-bold">基础传感器</h2>
                    <span class="text-sm text-[#60757b]">实时</span>
                </div>
                <div class="mt-4 grid gap-3">
                    {#each sensorTiles as sensor}
                        <div
                            class="flex items-end justify-between border border-[#d8e2e5] bg-[#f9fbfb] px-3 py-2 dark:border-[#31464d] dark:bg-[#102027]"
                        >
                            <div>
                                <span class="block text-sm text-[#60757b] dark:text-[#9fb8bc]"
                                    >{sensor.label}</span
                                >
                                <strong class={`block text-xl font-bold ${sensor.tone}`}
                                    >{sensor.value}<small
                                        class="ml-1 text-xs text-[#7b8b90] dark:text-[#94aab0]"
                                        >{sensor.unit}</small
                                    ></strong
                                >
                            </div>
                            <span class="text-xs text-[#71868a] dark:text-[#90a4ab]">在线</span>
                        </div>
                    {/each}
                </div>
            </section>

            <section
                class="rounded-none border border-[#cad7da] bg-white p-4 dark:border-[#3b555a] dark:bg-[#15242a]"
            >
                <h2 class="m-0 text-lg font-bold">运行状态</h2>
                <div class="mt-4 space-y-3 text-sm">
                    <div
                        class="flex items-center justify-between border-b border-dashed border-[#dbe4e7] pb-2 dark:border-[#31464d]"
                    >
                        <span class="text-[#60757b]">总电流</span><strong>16.8 A</strong>
                    </div>
                    <div
                        class="flex items-center justify-between border-b border-dashed border-[#dbe4e7] pb-2 dark:border-[#31464d]"
                    >
                        <span class="text-[#60757b]">联动模式</span><strong>自动</strong>
                    </div>
                    <div
                        class="flex items-center justify-between border-b border-dashed border-[#dbe4e7] pb-2 dark:border-[#31464d]"
                    >
                        <span class="text-[#60757b]">最近告警</span><strong
                            class="text-amber-700 dark:text-amber-300">无</strong
                        >
                    </div>
                </div>
            </section>
        </aside>

        <ChongmingDetail
            {aerators}
            {currentAerator}
            {isRunning}
            {actionMessage}
            bind:targetSpeed
            bind:intervalMinutes
            bind:boostMinutes
            {temperatureAlarm}
            {phLow}
            {phHigh}
            {toggleAerator}
            {selectAerator}
        />

        <aside aria-labelledby="video-title">
            <div class="border-l-[5px] border-[#1b8585] bg-[#e5f0f0] p-4 dark:bg-[#173336]">
                <p class="m-0 text-sm text-[#547176]">当前控制对象</p>
                <h2 id="video-title" class="m-0 text-2xl font-bold">{currentAerator.name}</h2>
                <span class="mt-2 block text-sm text-[#26716d]">{actionMessage}</span>
            </div>

            <section
                class="border border-t-0 border-[#cad7da] bg-[#fbfcfc] p-4 dark:border-[#3b555a] dark:bg-[#15242a]"
            >
                <h3 class="mb-3 text-base font-bold">增氧机详情</h3>
                <div class="space-y-3 text-sm text-[#587077] dark:text-[#b0c1c7]">
                    <div class="flex items-center justify-between">
                        <span>当前设备</span><strong>{currentAerator.name}</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>运行时长</span><strong>{currentAerator.runtime}</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>当前功率</span><strong>{currentAerator.power}%</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>运行状态</span><strong>{isRunning ? "运行中" : "已停止"}</strong>
                    </div>
                </div>
            </section>

            <section
                class="mt-5 border border-[#cad7da] bg-[#fbfcfc] p-4 dark:border-[#3b555a] dark:bg-[#15242a]"
            >
                <h3 class="mb-3 text-base font-bold">现场画面</h3>
                <div class="grid gap-3">
                    <div class="relative aspect-video overflow-hidden bg-[#172a2c]">
                        <video
                            class="h-full w-full object-cover"
                            src="https://www.imlast.top/iaqua/fish_chongming_15s.mp4"
                            autoplay
                            muted
                            loop
                            playsinline
                        ></video>
                    </div>
                </div>
            </section>
        </aside>
    </section>
</main>
