<script lang="ts">
    let {
        aerators,
        currentAerator,
        isRunning,
        actionMessage,
        targetSpeed = $bindable(),
        intervalMinutes = $bindable(),
        boostMinutes = $bindable(),
        temperatureAlarm,
        phLow,
        phHigh,
        toggleAerator,
        selectAerator
    }: any = $props();
</script>

<section aria-labelledby="aerator-board-title">
    <div class="mb-3 flex items-end justify-between gap-3">
        <div>
            <p class="m-0 text-sm font-bold text-[#60757b]">增氧机控制面板</p>
            <h2 id="aerator-board-title" class="m-0 text-xl font-bold">{currentAerator.name}</h2>
        </div>
        <span
            class={`rounded border px-2 py-1 text-sm font-bold ${isRunning ? "border-emerald-500/30 text-emerald-700" : "border-slate-400/30 text-slate-600"}`}
            >{isRunning ? "运行中" : "已停止"}</span
        >
    </div>
    <section
        class="rounded-none border border-[#cad7da] bg-white p-4 dark:border-[#3b555a] dark:bg-[#15242a]"
    >
        <div class="flex items-center justify-between gap-3">
            <div>
                <h3 class="m-0 text-base font-bold">当前控制</h3>
                <p class="mt-1 text-sm text-[#60757b]">{actionMessage}</p>
            </div>
            <button
                class="border border-[#27747a] bg-[#21767a] px-4 py-2 font-bold text-white"
                type="button"
                onclick={toggleAerator}>{isRunning ? "停止" : "启动"}</button
            >
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-3">
            {#each [["目标转速", targetSpeed], ["间隔", intervalMinutes], ["增氧时长", boostMinutes]] as item}<label
                    class="grid gap-2 text-sm text-[#536c72]"
                    >{item[0]}<input
                        class="h-10 border border-[#becdd0] bg-white px-3 text-[#21383d]"
                        type="number"
                        bind:value={item[1]}
                    /></label
                >{/each}
        </div>
    </section>
    <section
        class="mt-5 rounded-none border border-[#cad7da] bg-white p-4 dark:border-[#3b555a] dark:bg-[#15242a]"
    >
        <h3 class="m-0 text-base font-bold">联动阈值</h3>
        <div class="mt-4 grid gap-3 md:grid-cols-3">
            {#each [["温度上限", temperatureAlarm, "C"], ["pH 下限", phLow, ""], ["pH 上限", phHigh, ""]] as item}<div
                    class="border-t-2 border-[#74aeb0] bg-[#f9fbfb] p-3"
                >
                    <span class="block text-sm text-[#61787d]">{item[0]}</span><strong
                        class="mt-1 block text-2xl"
                        >{item[1]}<small class="ml-1 text-xs">{item[2]}</small></strong
                    >
                </div>{/each}
        </div>
    </section>
</section>
<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {#each aerators as aerator}<button
            class="min-h-28 border border-l-4 border-[#cdd8db] bg-[#f9fbfb] p-4 text-left shadow-sm"
            class:active={currentAerator.id === aerator.id}
            type="button"
            onclick={() => selectAerator(aerator.id)}
            ><strong class="block text-lg">{aerator.name}</strong><span
                class={`mt-2 inline-flex rounded border px-2 py-0.5 text-xs font-bold ${aerator.statusTone}`}
                >{aerator.status}</span
            >
            <div class="mt-3 grid gap-1 text-sm text-[#587077]">
                <div class="flex items-center justify-between">
                    <span>当前功率</span><strong>{aerator.power}%</strong>
                </div>
                <div class="flex items-center justify-between">
                    <span>累计运行</span><strong>{aerator.runtime}</strong>
                </div>
            </div></button
        >{/each}
</div>
