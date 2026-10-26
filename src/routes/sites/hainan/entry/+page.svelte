<script lang="ts">
    import EntryLeft from "./EntryLeft.svelte";
    import EntryCenterRight from "./EntryCenterRight.svelte";
    import { onMount } from "svelte";
    import { sites } from "$lib/site-data";

    let clock = $state("--");
    let showTrace = $state(false);
    let species = $state("金鲳鱼");
    let speciesStorageMessage = $state("修改自动保存在当前浏览器");
    const speciesKey = "iaqua:hainan:species";
    let readings = $state({
        air: 28.6,
        humidity: 78,
        wind: 3.2,
        rain: 1.2,
        water: 24.5,
        oxygen: 8.2,
        ph: 7.6,
        ammonia: 0.15,
        pressure: 0.32,
        efficiency: 88,
        frequency: 50,
        flow: 1.5
    });
    let feedTotal = $state(42.5);
    let labels = $state(["-4s", "-3s", "-2s", "-1s", "现在"]);
    let temperature = $state([24.5, 24.5, 24.5, 24.5, 24.5]);

    // One-second simulation: bounded random walk with a weak restoring drift.
    function fluctuate(value: number, baseline: number, step: number, min: number, max: number) {
        const delta = Math.max(
            -step,
            Math.min(step, (Math.random() * 2 - 1) * step + (baseline - value) * 0.02)
        );
        return Math.max(min, Math.min(max, value + delta));
    }

    function saveSpecies() {
        try {
            localStorage.setItem(speciesKey, species);
            speciesStorageMessage = "已自动保存到当前浏览器";
        } catch {
            speciesStorageMessage = "浏览器存储不可用，修改仅在本次页面中保留";
        }
    }
    const panel =
        "min-w-0 border border-[#132a4a] bg-[#060f1e]/95 p-4 shadow-[inset_0_0_30px_rgb(0_0_0/0.35)]";
    const heading =
        "mb-4 border-l-4 border-cyan-400 bg-linear-to-r from-[#1e3a5f]/60 to-transparent px-3 py-2 text-base font-bold text-white";
    const action =
        "inline-flex min-h-10 items-center justify-center border border-cyan-500/60 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/15";
    const devices = $derived([
        ["O₂", "变频增氧", `ON / ${readings.frequency.toFixed(1)} Hz`, "text-emerald-400"],
        ["FEED", "精准投喂", "定量就绪", "text-cyan-300"],
        ["TEMP", "温光控制", "光照期", "text-amber-400"],
        ["H₂O", "循环水泵", `${readings.flow.toFixed(2)} m/s`, "text-emerald-400"]
    ]);

    function points(values: number[], min: number, max: number) {
        return values
            .map(
                (value, index) =>
                    `${40 + (index * 400) / (values.length - 1)},${150 - ((value - min) / (max - min)) * 125}`
            )
            .join(" ");
    }

    onMount(() => {
        try {
            species = localStorage.getItem(speciesKey) ?? species;
        } catch {
            speciesStorageMessage = "浏览器存储不可用，修改仅在本次页面中保留";
        }
        const updateClock = () => (clock = new Date().toLocaleString("zh-CN", { hour12: false }));
        updateClock();
        const timer = window.setInterval(() => {
            updateClock();
            readings.air = fluctuate(readings.air, 28.6, 0.02, 27, 31);
            readings.humidity = fluctuate(readings.humidity, 78, 0.15, 65, 90);
            readings.wind = fluctuate(readings.wind, 3.2, 0.15, 0.5, 6);
            // Light rain, 0–0.6 mm/hour; cumulative rainfall never decreases.
            readings.rain += (Math.random() * 0.6) / 3600;
            readings.water = fluctuate(readings.water, 24.5, 0.003, 24, 25);
            readings.oxygen = fluctuate(readings.oxygen, 8.2, 0.015, 7.5, 8.8);
            readings.ph = fluctuate(readings.ph, 7.6, 0.002, 7.3, 7.9);
            readings.ammonia = fluctuate(readings.ammonia, 0.15, 0.0005, 0.1, 0.2);
            readings.pressure = fluctuate(readings.pressure, 0.32, 0.001, 0.28, 0.36);
            readings.efficiency = fluctuate(readings.efficiency, 88, 0.03, 85, 91);
            readings.frequency = fluctuate(readings.frequency, 50, 0.1, 45, 55);
            readings.flow = fluctuate(readings.flow, 1.5, 0.005, 1.3, 1.7);
            // Simulated active feeder: 0.5–1.5 kg/minute, no negative consumption.
            feedTotal += (0.5 + Math.random()) / 60;
            temperature = [...temperature.slice(1), readings.water];
            labels = [
                ...labels.slice(1),
                new Date().toLocaleTimeString("zh-CN", { hour12: false })
            ];
        }, 1000);
        return () => window.clearInterval(timer);
    });
</script>

<svelte:head>
    <title>全场景智能管控系统 | {sites.hainan.name}</title>
    <meta name="description" content="文昌冯家湾养殖基地智能管控总览。" />
</svelte:head>

{#snippet chartGrid()}
    {#each [23.5, 24, 24.5, 25] as tick, index}
        <line
            x1="40"
            y1={150 - (index * 125) / 3}
            x2="440"
            y2={150 - (index * 125) / 3}
            stroke="#132a4a"
            stroke-dasharray="4 4"
        />
        <text x="32" y={154 - (index * 125) / 3} text-anchor="end" fill="#94a3b8" font-size="11"
            >{tick}</text
        >
    {/each}
    {#each labels as label, index}
        <text x={40 + index * 100} y="174" text-anchor="middle" fill="#94a3b8" font-size="11"
            >{label}</text
        >
    {/each}
{/snippet}

<main
    class="min-h-screen bg-[#020610] bg-[linear-gradient(rgb(0_229_255/0.03)_1px,transparent_1px),linear-gradient(90deg,rgb(0_229_255/0.03)_1px,transparent_1px)] bg-size-[40px_40px] text-slate-200"
>
    <header class="border-b border-[#132a4a] bg-[#060f1e]/80">
        <div
            class="mx-auto flex max-w-480 flex-wrap items-center justify-between gap-5 px-4 py-5 md:px-8"
        >
            <div>
                <a href="/" class="text-xs text-cyan-300 hover:underline">← 返回基地地图</a>
                <p class="mt-2 text-xs tracking-widest text-slate-400">
                    文昌冯家湾 · 高层立体智能化养殖
                </p>
                <h1 class="mt-1 text-xl font-bold tracking-wide text-white md:text-3xl">
                    立体高层养殖全场景智能管控系统
                </h1>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <time class="font-mono text-sm text-cyan-300">{clock}</time><span
                    class="border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
                    >测试数据 · 每秒模拟刷新</span
                ><a class={action} href="/sites/hainan">进入 8 池监控 →</a>
            </div>
        </div>
    </header>

    <div class="mx-auto max-w-480 px-4 py-5 md:px-8">
        <div class="mb-5 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
            <p>全要素物联感知 / 边缘智能决策 / 养殖风险评估</p>
            <p>随机模拟数据，非生产读数 · 规模为测试设定 · 视频为演示素材</p>
        </div>
        <div
            class="grid items-start gap-5 xl:grid-cols-[minmax(230px,1fr)_minmax(420px,1.7fr)_minmax(260px,1fr)]"
        >
            <EntryLeft
                {panel}
                {heading}
                {action}
                {sites}
                {readings}
                bind:species
                {speciesStorageMessage}
                {saveSpecies}
                {devices}
            />

            <EntryCenterRight
                {panel}
                {heading}
                {action}
                {readings}
                {temperature}
                {labels}
                {feedTotal}
                {clock}
                bind:showTrace
            />
        </div>
    </div>
</main>
