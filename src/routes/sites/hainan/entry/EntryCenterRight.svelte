<script lang="ts">
    import FacilityModel from "$lib/components/FacilityModel.svelte";
    let {
        panel,
        heading,
        action,
        readings,
        temperature,
        labels,
        feedTotal,
        clock,
        showTrace = $bindable(false)
    }: any = $props();
    function points(values: number[], min: number, max: number) {
        return values
            .map(
                (v, i) =>
                    `${40 + (i * 400) / (values.length - 1)},${150 - ((v - min) / (max - min)) * 125}`
            )
            .join(" ");
    }
</script>

<div class="flex min-w-0 flex-col gap-5">
    <FacilityModel initialMode="complex" dark selectedPool="" onSelectPool={() => {}} />
    <section class={panel} aria-labelledby="water-title">
        <h2 id="water-title" class={heading}>水质 · 增氧</h2>
        <div class="grid grid-cols-[1fr_1.1fr] items-center gap-4">
            <div>
                <p class="text-center text-xs text-slate-400">pH 水体酸碱度</p>
                <svg
                    viewBox="0 0 200 160"
                    class="mx-auto w-full max-w-52"
                    role="img"
                    aria-label={`pH ${readings.ph.toFixed(2)}`}
                    ><path
                        d="M 29 120 A 82 82 0 1 1 171 120"
                        fill="none"
                        stroke="#132a4a"
                        stroke-width="12"
                    /><path
                        d="M 29 120 A 82 82 0 0 1 71 32"
                        fill="none"
                        stroke="#10b981"
                        stroke-width="12"
                    /><path
                        d="M 71 32 A 82 82 0 0 1 163 48"
                        fill="none"
                        stroke="#00e5ff"
                        stroke-width="12"
                    /><path
                        d="M 163 48 A 82 82 0 0 1 171 120"
                        fill="none"
                        stroke="#ef4444"
                        stroke-width="12"
                    /><line
                        x1="100"
                        y1="80"
                        x2={100 + 50 * Math.cos(((200 - (readings.ph / 14) * 220) * Math.PI) / 180)}
                        y2={80 - 50 * Math.sin(((200 - (readings.ph / 14) * 220) * Math.PI) / 180)}
                        stroke="#e2e8f0"
                        stroke-width="3"
                    /><circle cx="100" cy="80" r="5" fill="#e2e8f0" /><text
                        x="100"
                        y="125"
                        text-anchor="middle"
                        fill="white"
                        font-size="28"
                        font-family="monospace">{readings.ph.toFixed(2)}</text
                    ></svg
                >
            </div>
            <dl class="grid gap-4 text-xs text-slate-400">
                <div>
                    <dt>水温</dt>
                    <dd class="mt-1">
                        <strong class="font-mono text-2xl text-cyan-300"
                            >{readings.water.toFixed(2)}</strong
                        > ℃
                    </dd>
                </div>
                <div>
                    <dt>溶氧</dt>
                    <dd class="mt-1">
                        <strong class="font-mono text-2xl text-emerald-400"
                            >{readings.oxygen.toFixed(2)}</strong
                        > mg/L
                    </dd>
                </div>
                <div>
                    <dt>氨氮</dt>
                    <dd class="mt-1">
                        <strong class="font-mono text-2xl text-amber-400"
                            >{readings.ammonia.toFixed(3)}</strong
                        > mg/L
                    </dd>
                </div>
            </dl>
        </div>
        <p class="mt-3 text-xs text-slate-400">水温趋势 / ℃ · 最近 5 秒</p>
        <svg viewBox="0 0 480 190" class="w-full" role="img" aria-label="水温趋势"
            ><rect
                x="40"
                y="25"
                width="400"
                height="125"
                fill="none"
                stroke="#132a4a"
            />{#each [23.5, 24, 24.5, 25] as tick, index}<line
                    x1="40"
                    y1={150 - (index * 125) / 3}
                    x2="440"
                    y2={150 - (index * 125) / 3}
                    stroke="#132a4a"
                    stroke-dasharray="4 4"
                /><text
                    x="32"
                    y={154 - (index * 125) / 3}
                    text-anchor="end"
                    fill="#94a3b8"
                    font-size="11">{tick}</text
                >{/each}{#each labels as label, index}<text
                    x={40 + index * 100}
                    y="174"
                    text-anchor="middle"
                    fill="#94a3b8"
                    font-size="11">{label}</text
                >{/each}<polyline
                points={points(temperature, 23.5, 25)}
                fill="none"
                stroke="#00e5ff"
                stroke-width="2"
            /></svg
        >
        <div
            class="mt-3 grid gap-2 border border-dashed border-emerald-500/60 bg-emerald-500/5 p-3 text-xs"
        >
            <div class="flex justify-between">
                <span class="text-slate-400">紫外线杀菌模块</span><span class="text-emerald-400"
                    >正常运转中</span
                >
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">微滤机反冲洗压力</span><span
                    >{readings.pressure.toFixed(3)} MPa</span
                >
            </div>
            <div class="flex justify-between">
                <span class="text-slate-400">生物滤池硝化效率</span><span class="text-cyan-300"
                    >优良 ({readings.efficiency.toFixed(1)}%)</span
                >
            </div>
        </div>
    </section>
</div>
<div class="flex min-w-0 flex-col gap-5">
    <section class={panel} aria-labelledby="behavior-title">
        <h2 id="behavior-title" class={heading}>行为分析</h2>
        <div class="grid gap-3 sm:grid-cols-2">
            {#each ["3D Vision · 体重估算", "YOLOv8-Pose · 姿态追踪", "目标检测 · 群体密度", "异常活动 · 特征捕获"] as stream, index}<div
                    class="relative aspect-video overflow-hidden border border-[#132a4a] bg-black"
                >
                    {#if index === 1}<video
                            class="h-full w-full object-cover"
                            src="https://www.imlast.top/iaqua/yolo1.mp4"
                            aria-label="游动姿态追踪演示视频"
                            autoplay
                            muted
                            loop
                            playsinline
                            controls
                            preload="metadata"
                        ></video>{:else}<p
                            class="flex h-full items-center justify-center pt-6 text-xs text-slate-500"
                        >
                            暂无视频源
                        </p>{/if}
                    <p
                        class="pointer-events-none absolute top-0 left-0 bg-black/80 px-2 py-1 text-[10px] text-cyan-300"
                    >
                        {stream}
                    </p>
                </div>{/each}
        </div>
        <div class="mt-3 flex items-center justify-between border border-white/5 bg-black/30 p-3">
            <span class="text-xs text-slate-400">样例推算总生物量</span><strong
                class="font-mono text-2xl text-cyan-300"
                >25.68 <small class="text-xs text-slate-400">吨</small></strong
            >
        </div>
    </section>
    <section class={panel} aria-labelledby="trace-title">
        <h2 id="trace-title" class={heading}>溯源</h2>
        <dl class="grid gap-3 text-sm">
            <div class="flex justify-between border-b border-white/5 pb-2">
                <dt class="text-slate-400">批次追踪</dt>
                <dd class="font-mono text-cyan-300">TEST-FJW-001</dd>
            </div>
            <div class="flex justify-between border-b border-white/5 pb-2">
                <dt class="text-slate-400">投饲记录</dt>
                <dd class="font-mono text-cyan-300">累计 {feedTotal.toFixed(2)} kg</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-slate-400">最近同步</dt>
                <dd class="font-mono text-cyan-300">{clock}</dd>
            </div>
        </dl>
        <button
            type="button"
            class={`${action} mt-4 w-full`}
            aria-expanded={showTrace}
            onclick={() => (showTrace = !showTrace)}
            >{showTrace ? "收起说明" : "查阅溯源说明"}</button
        >{#if showTrace}<p class="mt-3 text-xs leading-relaxed text-slate-400">
                测试批次 TEST-FJW-001；模拟投喂速率 0.5–1.5
                kg/min，累计投饲量与同步时间每秒更新。批次编号和基地规模不会随机改变；以上均为测试数据，并非真实生产记录。
            </p>{/if}
    </section>
    <section class={panel} aria-labelledby="alert-title">
        <h2 id="alert-title" class={heading}>风险预警</h2>
        <p class="border-l-3 border-red-500 bg-red-500/5 p-3 text-xs text-red-300">
            3F 养成区 B 仓 · 体表形态异常 · 89.5%
        </p>
        <a class={`${action} mt-4 w-full`} href="/sites/hainan/fish-disease">查看鱼病识别记录 →</a>
    </section>
</div>
