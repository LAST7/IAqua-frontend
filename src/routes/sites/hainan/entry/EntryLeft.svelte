<script lang="ts">
    let {
        panel,
        heading,
        action,
        sites,
        readings,
        species = $bindable(),
        speciesStorageMessage,
        saveSpecies,
        devices
    }: any = $props();
</script>

<div class="flex min-w-0 flex-col gap-5">
    <section class={panel} aria-labelledby="overview-title">
        <h2 id="overview-title" class={heading}>概况 · 养殖场基础信息</h2>
        <dl class="grid gap-3 text-sm">
            <div>
                <dt class="text-xs text-slate-400">基地名称</dt>
                <dd class="mt-1">{sites.hainan.name}</dd>
            </div>
            <div>
                <dt class="text-xs text-slate-400">养殖模式</dt>
                <dd class="mt-1">{sites.hainan.type}</dd>
            </div>
            <div>
                <dt>
                    <label for="farm-species" class="text-xs text-slate-400"
                        >养殖种类（可编辑）</label
                    >
                </dt>
                <dd class="mt-1">
                    <input
                        id="farm-species"
                        type="text"
                        maxlength="80"
                        bind:value={species}
                        oninput={saveSpecies}
                        aria-describedby="species-storage"
                        class="w-full min-w-0 border border-cyan-500/50 bg-[#020610] px-3 py-2 text-sm text-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-300"
                    />
                    <p id="species-storage" class="mt-1 text-xs text-slate-400" role="status">
                        {speciesStorageMessage}
                    </p>
                </dd>
            </div>
            <div>
                <dt class="text-xs text-slate-400">养殖规模（测试设定）</dt>
                <dd class="mt-1">存栏约 20,000 尾 · 养殖水体 1,600 m³</dd>
            </div>
            <div>
                <dt class="text-xs text-slate-400">基地规模（测试设定）</dt>
                <dd class="mt-1">占地 20 亩 · 建筑面积 6,000 m²</dd>
            </div>
            <div>
                <dt class="text-xs text-slate-400">养殖池数量</dt>
                <dd class="mt-1 font-mono text-xl text-cyan-300">
                    8 <span class="text-xs">个</span>
                </dd>
            </div>
        </dl>
        <a class={`${action} mt-4 w-full`} href="/sites/hainan">进入池塘监控 →</a>
    </section>
    <section class={panel} aria-labelledby="weather-title">
        <h2 id="weather-title" class={heading}>环境 · 气象信息</h2>
        <p class="text-sm">海南 · 文昌冯家湾</p>
        <dl class="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-400">
            {#each [["气温", `${readings.air.toFixed(2)} ℃`], ["空气湿度", `${readings.humidity.toFixed(1)} %`], ["风速", `${readings.wind.toFixed(2)} m/s`], ["累计降雨", `${readings.rain.toFixed(3)} mm`]] as [label, value]}<div
                >
                    <dt>{label}</dt>
                    <dd class="mt-2 font-mono text-sm text-cyan-300">{value}</dd>
                </div>{/each}
        </dl>
        <p class="mt-4 text-xs text-slate-400">每秒模拟采样 · 气象缓慢波动，累计降雨单调增加。</p>
    </section>
    <section class={panel} aria-labelledby="device-title">
        <div class="flex items-center justify-between gap-2">
            <h2 id="device-title" class={heading}>设备状态</h2>
            <span class="font-mono text-[10px] text-cyan-300">Modbus RTU</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
            {#each devices as device}<div
                    class="border border-white/5 bg-black/30 px-2 py-4 text-center"
                >
                    <span class={`font-mono text-xl font-bold ${device[3]}`}>{device[0]}</span>
                    <p class="mt-2 text-sm">{device[1]}</p>
                    <p class={`mt-2 text-xs ${device[3]}`}>{device[2]}</p>
                </div>{/each}
        </div>
    </section>
</div>
