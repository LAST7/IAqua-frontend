<script lang="ts">
    import FacilityModel from "$lib/components/FacilityModel.svelte";
    import HainanPoolDetail from "$lib/components/HainanPoolDetail.svelte";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import type { Site } from "$lib/site-data";

    let { site }: { site: Site } = $props();
    type PoolGroup = {
        id: string;
        title: string;
        subtitle: string;
        tone: string;
        pools: string[];
    };
    type ProcessUnit = { name: string; code: string; detail: string };

    const poolGroups: PoolGroup[] = [
        {
            id: "seedling",
            title: "第一级循环水",
            subtitle: "4 个虾苗池",
            tone: "#3c9d6d",
            pools: ["虾苗池 01", "虾苗池 02", "虾苗池 03", "虾苗池 04"]
        },
        {
            id: "growing",
            title: "第二级循环水",
            subtitle: "8 个养殖池",
            tone: "#248b9a",
            pools: Array.from(
                { length: 8 },
                (_, index) => `养殖池 ${(index + 1).toString().padStart(2, "0")}`
            )
        },
        {
            id: "large",
            title: "第三级循环水",
            subtitle: "8 个大池",
            tone: "#3569a4",
            pools: Array.from(
                { length: 8 },
                (_, index) => `大池 ${(index + 1).toString().padStart(2, "0")}`
            )
        }
    ];

    const processUnits: ProcessUnit[] = [
        { name: "紫外", code: "UV", detail: "杀菌模块 · 运行" },
        { name: "微滤", code: "MF", detail: "固液分离 · 运行" },
        { name: "蛋白分离", code: "PS", detail: "泡沫分离 · 运行" }
    ];

    let selectedPool = $state("虾苗池 01");
    let selectedGroup = $derived(
        poolGroups.find((group) => group.pools.includes(selectedPool)) ?? poolGroups[0]
    );
    let actionMessage = $state("演示设备状态已同步");
    let feedMode = $state<"auto" | "manual">("auto");
    let isFeeding = $state(false);
    let feedAmount = $state(12.5);
    let oxygen = $state(7.8);
    let temperature = $state(26.4);
    let ph = $state(7.5);

    function selectPool(pool: string) {
        selectedPool = pool;
        isFeeding = false;
        actionMessage = `${pool} 演示数据已同步`;
    }

    function feed(manual = false) {
        isFeeding = true;
        actionMessage = manual
            ? `${selectedPool}正在执行演示手动投喂`
            : `${selectedPool}正在执行演示自动投喂`;
        window.setTimeout(() => {
            isFeeding = false;
            actionMessage = `${selectedPool}本次演示投喂已完成`;
        }, 2500);
    }
</script>

<svelte:head>
    <title>{site.name} | 二层三级循环水池塘监控</title>
</svelte:head>

<main
    class="min-h-screen bg-[#eef3f1] p-4 text-[#183338] md:p-7 dark:bg-[#0b1719] dark:text-[#dcebea]"
>
    <header
        class="mx-auto flex max-w-440 flex-wrap items-center justify-between gap-4 border-b border-[#cbd8d4] pb-4 dark:border-[#304b4b]"
    >
        <div class="flex items-center gap-4">
            <a
                class="text-base font-bold text-[#176876] no-underline hover:underline dark:text-[#75d1cd]"
                href="/">返回基地地图</a
            >
            <span class="hidden h-5 border-l border-[#b9c8c4] sm:block"></span>
            <div>
                <p class="m-0 text-sm font-bold text-[#607572]">基地监控 · 大楼第二层</p>
                <h1 class="m-0 text-2xl font-bold md:text-3xl">{site.name}</h1>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <span
                class="rounded border border-[#b6c7c0] bg-[#f7fbf8] px-2.5 py-1.5 text-sm font-bold text-[#567067] dark:border-[#445b57] dark:bg-[#132321] dark:text-[#bdd7d2]"
                >三级循环水</span
            ><span class="hidden text-sm text-[#607570] md:block">20 个池位 · 演示监控</span
            ><ThemeToggle />
        </div>
    </header>

    <div class="mx-auto max-w-440">
        <FacilityModel {selectedPool} onSelectPool={selectPool} />

        <section
            class="mt-5 border border-[#c6d6d1] bg-[#f9fcfa] p-4 shadow-sm md:p-6 dark:border-[#304947] dark:bg-[#11201f]"
            aria-labelledby="layout-title"
        >
            <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p class="m-0 text-sm font-bold text-[#607572]">二层养殖大厅 · 平面布局</p>
                    <h2 id="layout-title" class="m-0 text-2xl font-bold md:text-3xl">
                        三级循环水系统
                    </h2>
                </div>
                <div class="flex flex-wrap gap-3 text-xs text-[#607572] dark:text-[#a4bbb5]">
                    <span class="flex items-center gap-1.5"
                        ><i class="h-2.5 w-2.5 rounded-full bg-[#39a866]"></i>运行</span
                    ><span class="flex items-center gap-1.5"
                        ><i class="h-2.5 w-2.5 rounded-full bg-[#e4b83f]"></i>预警</span
                    ><span class="flex items-center gap-1.5"
                        ><i class="h-2.5 w-2.5 rounded-full bg-[#e47777]"></i>停止</span
                    >
                </div>
            </div>

            <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
                <div class="grid gap-4 md:grid-cols-3">
                    {#each poolGroups as group, groupIndex}
                        <section
                            class="rounded-[28px] border-2 p-3 md:p-4"
                            style={`border-color:${group.tone}66;background:${group.tone}0b`}
                            aria-labelledby={`${group.id}-title`}
                        >
                            <div class="mb-4 text-center">
                                <h3
                                    id={`${group.id}-title`}
                                    class="m-0 text-base font-bold"
                                    style={`color:${group.tone}`}
                                >
                                    {group.title}
                                </h3>
                                <p class="mt-1 text-xs text-[#607572] dark:text-[#a4bbb5]">
                                    {group.subtitle}
                                </p>
                            </div>
                            <div
                                class={`grid gap-3 ${groupIndex === 0 ? "grid-cols-2" : "grid-cols-2"}`}
                            >
                                {#each group.pools as pool, poolIndex}
                                    <button
                                        type="button"
                                        class={`relative min-h-20 border-2 bg-[#fdfefd] p-2 text-center transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[#172725] ${selectedPool === pool ? "ring-2 ring-[#176876] ring-offset-2 ring-offset-[#f9fcfa] dark:ring-offset-[#11201f]" : ""} ${groupIndex === 0 ? "rounded-full" : "rounded-xl"}`}
                                        style={`border-color:${group.tone}99`}
                                        onclick={() => selectPool(pool)}
                                        aria-pressed={selectedPool === pool}
                                    >
                                        <span
                                            class="absolute top-2 right-2 h-2.5 w-2.5 rounded-full"
                                            class:bg-[#39a866]={poolIndex % 5 !== 3}
                                            class:bg-[#e4b83f]={poolIndex % 5 === 3}
                                        ></span>
                                        <strong class="block text-xs md:text-sm">{pool}</strong
                                        ><small
                                            class="mt-2 block text-[10px] text-[#718782] dark:text-[#9bb1aa]"
                                            >{poolIndex % 5 === 3 ? "预警" : "运行"}</small
                                        >
                                    </button>
                                {/each}
                            </div>
                        </section>
                    {/each}
                </div>

                <section
                    class="rounded-[28px] border-2 border-[#c4d2ce] bg-[#f4f8f5] p-4 dark:border-[#39504c] dark:bg-[#152522]"
                    aria-labelledby="equipment-title"
                >
                    <div class="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 id="equipment-title" class="m-0 text-lg font-bold">
                                循环水处理设备
                            </h3>
                            <p class="mt-1 text-xs text-[#607572] dark:text-[#a4bbb5]">
                                三类设备 · 每类 3 台
                            </p>
                        </div>
                        <span
                            class="rounded-full bg-[#d9f1df] px-3 py-1 text-xs font-bold text-[#287b4e] dark:bg-[#183d2b] dark:text-[#8ed7a6]"
                            >系统运行</span
                        >
                    </div>
                    <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                        {#each processUnits as unit}
                            <div
                                class="rounded-2xl border border-[#c9d8d2] bg-white p-3 dark:border-[#3b554e] dark:bg-[#1a2d29]"
                            >
                                <div class="mb-3 flex items-center justify-between">
                                    <span class="text-sm font-bold">{unit.name}</span><span
                                        class="font-mono text-xs text-[#287b4e]">{unit.code}</span
                                    >
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    {#each [1, 2, 3] as number}<div
                                            class="rounded-lg border border-[#b9d5c2] bg-[#f1faf3] p-3 text-center dark:border-[#345745] dark:bg-[#183226]"
                                        >
                                            <span
                                                class="mx-auto block h-3 w-3 rounded-full bg-[#39a866]"
                                            ></span><strong class="mt-2 block text-xs"
                                                >{unit.name}-{number}</strong
                                            ><small
                                                class="mt-1 block text-[10px] text-[#607572] dark:text-[#a4bbb5]"
                                                >运行</small
                                            >
                                        </div>{/each}
                                </div>
                                <p class="mt-3 text-xs text-[#607572] dark:text-[#a4bbb5]">
                                    {unit.detail}
                                </p>
                            </div>
                        {/each}
                    </div>
                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                        <div
                            class="rounded-xl border border-[#c9d8d2] bg-white p-3 dark:border-[#3b554e] dark:bg-[#1a2d29]"
                        >
                            <span class="text-xs text-[#607572] dark:text-[#a4bbb5]">风机</span
                            ><strong class="mt-1 block text-lg text-[#287b4e]">运行</strong>
                        </div>
                        <div
                            class="rounded-xl border border-[#c9d8d2] bg-white p-3 dark:border-[#3b554e] dark:bg-[#1a2d29]"
                        >
                            <span class="text-xs text-[#607572] dark:text-[#a4bbb5]">循环流量</span
                            ><strong class="mt-1 block text-lg text-[#176876]">128 m³/h</strong>
                        </div>
                    </div>
                </section>
            </div>
        </section>

        <HainanPoolDetail
            {selectedPool}
            {selectedGroup}
            {temperature}
            {oxygen}
            {ph}
            {actionMessage}
            bind:feedMode
            bind:feedAmount
            {isFeeding}
            {feed}
        />
    </div>
</main>
