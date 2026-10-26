<script lang="ts">
    import { goto } from "$app/navigation";
    import { sites } from "$lib/site-data";

    type DiseaseRecord = {
        id: string;
        name: string;
        location: string;
        time: string;
        confidence: string;
        level: "高风险" | "中风险" | "观察";
        description: string;
        imageUrl: string;
    };

    // Replace imageUrl values with the image addresses supplied by the server.
    const diseaseRecords: DiseaseRecord[] = [
        {
            id: "DF-20260615-001",
            name: "体表形态变异 / 溃疡特征",
            location: "3F 养成区 · B 仓",
            time: "2026-06-15 14:24:18",
            confidence: "89.5%",
            level: "高风险",
            description: "检测到鱼体局部体表异常，建议隔离观察并取样复核。",
            imageUrl: "https://www.imlast.top/iaqua/ulcer.jpg"
        },
        {
            id: "DF-20260615-002",
            name: "活动轨迹突变 / 潜在缺氧",
            location: "2F 幼苗区 · A 仓",
            time: "2026-06-15 13:58:42",
            confidence: "68.0%",
            level: "中风险",
            description: "鱼群活动范围出现短时聚集，底层增氧策略已自动提升。",
            imageUrl: "https://www.imlast.top/iaqua/schooling.png"
        },
        {
            id: "DF-20260615-003",
            name: "摄食行为下降",
            location: "3F 养成区 · C 仓",
            time: "2026-06-15 12:36:09",
            confidence: "54.7%",
            level: "观察",
            description: "连续两个观测周期摄食响应减弱，建议结合水质指标持续观察。",
            imageUrl: "https://www.imlast.top/iaqua/anorexia.jpg"
        },
        {
            id: "DF-20260615-004",
            name: "游动姿态异常",
            location: "2F 幼苗区 · D 仓",
            time: "2026-06-15 10:15:33",
            confidence: "61.2%",
            level: "中风险",
            description: "识别到短时侧游行为，当前记录已进入复核队列。",
            imageUrl: "https://www.imlast.top/iaqua/abnormal_posture.jpg"
        }
    ];

    let activeRecordId = $state(diseaseRecords[0].id);
    let activeRecord = $derived(
        diseaseRecords.find((record) => record.id === activeRecordId) ?? diseaseRecords[0]
    );
</script>

<svelte:head>
    <title>鱼病形态与活动行为评估预警 | {sites.hainan.name}</title>
    <meta name="description" content="海南基地鱼病识别记录与预警图片展示页面。" />
</svelte:head>

<main
    class="min-h-screen bg-[#020610] bg-[linear-gradient(rgb(0_229_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(0_229_255/0.035)_1px,transparent_1px)] bg-size-[40px_40px] text-slate-200"
>
    <header
        class="mx-auto flex min-h-20 max-w-400 items-center justify-between gap-4 border-b border-[#132a4a] px-4 py-4 lg:px-8"
    >
        <div class="flex items-center gap-4">
            <button
                class="border border-[#236184] bg-[#061326] px-3 py-2 text-sm font-bold text-cyan-300 transition hover:border-cyan-400 hover:bg-[#0a1d36]"
                type="button"
                onclick={() => goto("/sites/hainan/entry")}>返回系统总览</button
            >
            <span class="hidden h-6 border-l border-[#1c4160] sm:block"></span>
            <div>
                <p class="m-0 text-xs font-bold tracking-[0.18em] text-slate-500">
                    AI 视觉识别子系统
                </p>
                <h1 class="m-0 text-lg font-bold tracking-wide text-white md:text-2xl">
                    渔病形态与活动行为评估预警
                </h1>
            </div>
        </div>
        <div class="hidden items-center gap-3 text-xs md:flex">
            <span
                class="border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 font-bold text-emerald-400"
                >识别引擎运行中</span
            ><span class="font-mono text-cyan-300">ARCHIVE / 04</span>
        </div>
    </header>

    <section class="mx-auto max-w-400 px-4 py-5 lg:px-8">
        <div class="mb-5 grid gap-3 sm:grid-cols-3">
            <div
                class="border border-[#132a4a] bg-[#060f1e]/90 p-4 shadow-[inset_0_0_30px_rgb(0_0_0/0.4)]"
            >
                <p class="m-0 text-xs text-slate-500">今日识别记录</p>
                <strong class="mt-2 block font-mono text-3xl text-cyan-300">24</strong><span
                    class="text-xs text-slate-500">较昨日 +6 条</span
                >
            </div>
            <div
                class="border border-[#132a4a] bg-[#060f1e]/90 p-4 shadow-[inset_0_0_30px_rgb(0_0_0/0.4)]"
            >
                <p class="m-0 text-xs text-slate-500">高风险预警</p>
                <strong class="mt-2 block font-mono text-3xl text-red-400">03</strong><span
                    class="text-xs text-slate-500">待人工复核</span
                >
            </div>
            <div
                class="border border-[#132a4a] bg-[#060f1e]/90 p-4 shadow-[inset_0_0_30px_rgb(0_0_0/0.4)]"
            >
                <p class="m-0 text-xs text-slate-500">最近同步</p>
                <strong class="mt-2 block font-mono text-3xl text-emerald-400">14:24</strong><span
                    class="text-xs text-slate-500">视觉节点 CAM-03</span
                >
            </div>
        </div>

        <div class="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
            <section
                class="border border-[#132a4a] bg-[#060f1e]/90 p-4 shadow-[inset_0_0_30px_rgb(0_0_0/0.55)] md:p-5"
                aria-labelledby="record-list-title"
            >
                <div
                    class="mb-4 flex items-end justify-between gap-3 border-l-4 border-cyan-400 bg-linear-to-r from-[#1e3a5f]/60 to-transparent px-3 py-2"
                >
                    <div>
                        <p class="m-0 text-xs text-slate-500">IMAGE RECORDS</p>
                        <h2 id="record-list-title" class="m-0 text-lg font-bold text-white">
                            系统监控记录
                        </h2>
                    </div>
                    <span class="font-mono text-xs text-slate-500"
                        >{diseaseRecords.length} ITEMS</span
                    >
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                    {#each diseaseRecords as record}
                        <button
                            class={`group border bg-black/30 text-left transition hover:border-cyan-400/80 hover:bg-cyan-400/4 ${record.id === activeRecordId ? "border-cyan-400" : "border-[#193455]"}`}
                            type="button"
                            onclick={() => (activeRecordId = record.id)}
                        >
                            <div
                                class="relative aspect-video overflow-hidden border-b border-[#193455] bg-[#020610]"
                            >
                                <img
                                    class="h-full w-full object-cover opacity-80 transition group-hover:scale-105 group-hover:opacity-100"
                                    src={record.imageUrl}
                                    alt={`${record.name}识别图片`}
                                /><span
                                    class={`absolute top-2 left-2 border px-2 py-1 text-[11px] font-bold ${record.level === "高风险" ? "border-red-500/80 bg-red-950/80 text-red-300" : record.level === "中风险" ? "border-amber-500/80 bg-amber-950/80 text-amber-300" : "border-cyan-500/80 bg-cyan-950/80 text-cyan-300"}`}
                                    >{record.level}</span
                                ><span
                                    class="absolute right-2 bottom-2 bg-black/80 px-2 py-1 font-mono text-[10px] text-cyan-300"
                                    >{record.id}</span
                                >
                            </div>
                            <div class="p-3">
                                <h3 class="m-0 text-sm font-bold text-white">{record.name}</h3>
                                <div class="mt-2 flex justify-between gap-2 text-xs text-slate-500">
                                    <span>{record.location}</span><time
                                        >{record.time.slice(11)}</time
                                    >
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
            </section>

            <aside
                class="border border-[#132a4a] bg-[#060f1e]/90 p-4 shadow-[inset_0_0_30px_rgb(0_0_0/0.55)] md:p-5"
                aria-labelledby="detail-title"
            >
                <div
                    class="mb-4 border-l-4 border-red-400 bg-linear-to-r from-red-950/50 to-transparent px-3 py-2"
                >
                    <p class="m-0 text-xs text-slate-500">SELECTED ALERT</p>
                    <h2 id="detail-title" class="m-0 text-lg font-bold text-white">记录详情</h2>
                </div>
                <div class="relative overflow-hidden border border-[#24466a] bg-black">
                    <img
                        class="aspect-4/3 w-full object-cover"
                        src={activeRecord.imageUrl}
                        alt={`${activeRecord.name}详情图片`}
                    /><span
                        class="absolute top-3 left-3 border border-red-500/80 bg-red-950/80 px-2 py-1 text-xs font-bold text-red-300"
                        >{activeRecord.level}</span
                    >
                </div>
                <div class="mt-4 space-y-3 text-sm">
                    <div>
                        <span class="text-xs text-slate-500">识别类型</span><strong
                            class="mt-1 block text-white">{activeRecord.name}</strong
                        >
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <span class="text-xs text-slate-500">发生时间</span><strong
                                class="mt-1 block font-mono text-cyan-300"
                                >{activeRecord.time}</strong
                            >
                        </div>
                        <div>
                            <span class="text-xs text-slate-500">模型置信度</span><strong
                                class="mt-1 block font-mono text-cyan-300"
                                >{activeRecord.confidence}</strong
                            >
                        </div>
                    </div>
                    <div>
                        <span class="text-xs text-slate-500">识别定位</span><strong
                            class="mt-1 block text-white">{activeRecord.location}</strong
                        >
                    </div>
                    <div
                        class="border-l-2 border-amber-400 bg-amber-400/5 p-3 text-xs leading-6 text-slate-300"
                    >
                        {activeRecord.description}
                    </div>
                </div>
                <button
                    class="mt-5 w-full border border-cyan-400/70 bg-cyan-400/10 px-3 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                    type="button"
                    onclick={() => (activeRecordId = diseaseRecords[0].id)}>定位最新预警记录</button
                >
            </aside>
        </div>
    </section>
</main>
