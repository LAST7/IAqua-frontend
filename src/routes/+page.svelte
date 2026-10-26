<script lang="ts">
    import ChinaMap from "$lib/components/ChinaMap.svelte";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import { sites } from "$lib/site-data";
</script>

<svelte:head>
    <title>水产养殖 GIS 集成视图</title>
    <meta
        name="description"
        content="水产养殖场 GIS 集成展示原型，包含中国省级边界、崇明基地和海南基地入口。"
    />
</svelte:head>

<main
    class="min-h-screen bg-[#f4f7f8] p-4 text-[#17212b] md:p-6 dark:bg-[#101820] dark:text-[#dce7ec]"
>
    <header
        class="mx-auto flex max-w-330 flex-col gap-6 pb-5 sm:items-stretch lg:flex-row lg:items-end lg:justify-between"
    >
        <div>
            <p class="mb-2 text-[13px] leading-snug font-bold text-slate-500">GIS 原型入口</p>
            <h1
                class="m-0 text-[clamp(28px,4vw,44px)] leading-[1.1] font-bold tracking-normal text-[#101923] dark:text-[#edf4f6]"
            >
                水产养殖 GIS 集成视图
            </h1>
        </div>
        <div class="flex items-center gap-4 lg:gap-5">
            <ThemeToggle />
            <div
                class="grid min-w-0 gap-1.5 border-l-[3px] border-l-[#2f6f7e] bg-white px-4 py-3.5 lg:min-w-45 dark:border-l-[#4db6a9] dark:bg-[#17212b]"
            >
                <span class="text-sm text-slate-700 dark:text-[#c5d3da]">2 个基地</span>
                <!-- <strong class="text-sm text-teal-700">摄像头待接入</strong> -->
            </div>
        </div>
    </header>

    <section
        class="mx-auto grid max-w-330 grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_320px]"
        aria-label="基地地图与入口"
    >
        <div class="min-w-0">
            <ChinaMap />
        </div>

        <aside
            class="min-w-0 rounded-lg border border-[#d6dee3] bg-white p-3.5 md:p-4 dark:border-[#334452] dark:bg-[#17212b]"
            aria-labelledby="site-list-title"
        >
            <h2
                id="site-list-title"
                class="mb-3.5 text-[17px] leading-snug font-bold tracking-normal text-[#17212b] dark:text-[#edf4f6]"
            >
                基地列表
            </h2>

            <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {#each Object.values(sites) as site}
                    <a
                        class="grid gap-1.5 rounded-lg border border-[#dbe3e8] bg-[#f9fbfc] p-3.5 text-inherit no-underline hover:border-[#7c9aac] hover:bg-[#f2f7f8] dark:border-[#334452] dark:bg-[#1c2a35] dark:hover:border-[#5b7888] dark:hover:bg-[#233541]"
                        href={site.entryHref ?? site.href}
                    >
                        <span
                            class="text-base leading-snug font-bold text-[#17212b] dark:text-[#edf4f6]"
                            >{site.name}</span
                        >
                        <span class="text-[13px] leading-normal text-slate-600 dark:text-[#b2c2ca]"
                            >{site.type}</span
                        >
                        <!-- <span class="text-[13px] leading-normal font-semibold text-teal-700" -->
                        <!--     >{site.status}</span -->
                        <!-- > -->
                    </a>
                {/each}
            </div>
        </aside>
    </section>
</main>
