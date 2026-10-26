<script lang="ts">
    let {
        selectedPool,
        selectedGroup,
        temperature,
        oxygen,
        ph,
        actionMessage,
        feedMode = $bindable(),
        feedAmount = $bindable(),
        isFeeding,
        feed
    }: any = $props();
</script>

<section
    class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]"
    aria-label="选中池位详情"
>
    <div
        class="border border-[#c6d6d1] bg-[#f9fcfa] p-4 shadow-sm md:p-5 dark:border-[#304947] dark:bg-[#11201f]"
    >
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
                <p class="m-0 text-sm font-bold text-[#607572]">当前选中池位</p>
                <h2 class="m-0 text-2xl font-bold">{selectedPool}</h2>
                <p class="mt-1 text-xs text-[#607572] dark:text-[#a4bbb5]">
                    {selectedGroup.title} · {selectedGroup.subtitle} · 独立演示数据
                </p>
            </div>
            <span class="rounded border border-[#2b8a61] px-2 py-1 text-sm font-bold text-[#287b4e]"
                >运行正常</span
            >
        </div>
        <div class="grid gap-3 md:grid-cols-[1.35fr_1fr]">
            <div class="relative aspect-video overflow-hidden bg-[#173438]">
                <video
                    class="h-full w-full object-cover"
                    src="https://www.imlast.top/iaqua/cam1_30s.mp4"
                    aria-label="{selectedPool}演示视频"
                    autoplay
                    muted
                    loop
                    playsinline
                    controls
                    preload="metadata"
                ></video><span
                    class="absolute bottom-2 left-2 text-xs text-white drop-shadow-[0_1px_2px_black]"
                    >{selectedPool} · 演示画面</span
                >
            </div>
            <div class="grid grid-cols-3 gap-2 md:grid-cols-1">
                {#each [["水温", temperature.toFixed(1), "℃"], ["溶氧", oxygen.toFixed(1), "mg/L"], ["pH", ph.toFixed(1), ""]] as item}<div
                        class="border-t-3 border-[#74aeb0] bg-[#f1f8f6] p-3 dark:bg-[#19302d]"
                    >
                        <span class="block text-xs text-[#607572] dark:text-[#a4bbb5]"
                            >{item[0]}</span
                        ><strong class="mt-1 block text-2xl"
                            >{item[1]}<small class="ml-1 text-xs">{item[2]}</small></strong
                        >
                    </div>{/each}
            </div>
        </div>
    </div>
    <aside
        class="border border-[#c6d6d1] bg-[#f9fcfa] p-4 shadow-sm dark:border-[#304947] dark:bg-[#11201f]"
        aria-labelledby="control-title"
    >
        <div class="border-l-4 border-[#1b8585] bg-[#e5f0f0] p-4 dark:bg-[#173336]">
            <p class="m-0 text-sm text-[#547176]">当前控制对象</p>
            <h2 id="control-title" class="m-0 text-2xl font-bold">{selectedPool}</h2>
            <span class="mt-2 block text-sm text-[#26716d]">{actionMessage}</span>
        </div>
        <section class="mt-4">
            <h3 class="mb-3 text-base font-bold">投喂控制 · 演示</h3>
            <div class="grid grid-cols-2 border border-[#b9c9cc]">
                <button
                    class={`border-0 px-3 py-2 text-sm font-bold ${feedMode === "auto" ? "bg-[#246c73] text-white" : "bg-transparent text-[#51676c]"}`}
                    type="button"
                    onclick={() => (feedMode = "auto")}>自动</button
                ><button
                    class={`border-0 px-3 py-2 text-sm font-bold ${feedMode === "manual" ? "bg-[#246c73] text-white" : "bg-transparent text-[#51676c]"}`}
                    type="button"
                    onclick={() => (feedMode = "manual")}>手动</button
                >
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                    class="min-h-10 border border-[#27747a] bg-[#21767a] px-2 py-2 font-bold text-white"
                    type="button"
                    onclick={() => feed(false)}>{isFeeding ? "演示投喂中" : "开始投喂"}</button
                ><button
                    class="min-h-10 border border-[#27747a] bg-[#f7fbfb] px-2 py-2 font-bold text-[#1c646b]"
                    type="button"
                    onclick={() => feed(true)}>手动下料</button
                >
            </div>
            <label class="mt-4 grid gap-1 text-sm text-[#536c72]"
                >单次投喂量 <input
                    class="h-9 w-full border border-[#becdd0] bg-white px-2 text-[#21383d]"
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    bind:value={feedAmount}
                /></label
            >
        </section>
        <p class="mt-4 text-xs leading-relaxed text-[#718782]">
            点击上方任意池位，可切换独立演示详情。页面不绑定真实池塘和设备指令。
        </p>
    </aside>
</section>
