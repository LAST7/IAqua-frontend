<script lang="ts">
    import "leaflet/dist/leaflet.css";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import type { Feature, FeatureCollection, Geometry } from "geojson";
    import type * as Leaflet from "leaflet";
    import { sites } from "$lib/site-data";

    type ProvinceProperties = {
        name?: string;
        adcode?: number;
    };

    let mapElement: HTMLDivElement;
    let loadError = $state("");

    const mapColors = {
        light: {
            provinceStroke: "#9aa8b2",
            provinceFill: "#dbe5e8",
            hainanStroke: "#0f766e",
            hainanFill: "#5eead4"
        },
        dark: {
            provinceStroke: "#5d7280",
            provinceFill: "#263943",
            hainanStroke: "#65c7bb",
            hainanFill: "#24645f"
        }
    } as const;

    function isHainan(feature: Feature<Geometry, ProvinceProperties> | undefined) {
        return feature?.properties?.name === "海南省";
    }

    onMount(() => {
        let map: Leaflet.Map | undefined;

        async function setupMap() {
            const L = await import("leaflet");

            map = L.map(mapElement, {
                attributionControl: false,
                zoomControl: true,
                minZoom: 3,
                maxZoom: 8,
                scrollWheelZoom: true,
                preferCanvas: true
            }).setView([35.5, 104], 4);

            const response = await fetch("/data/china-provinces.geojson");
            if (!response.ok) {
                throw new Error("无法加载 /data/china-provinces.geojson");
            }

            const provinces = (await response.json()) as FeatureCollection<
                Geometry,
                ProvinceProperties
            >;

            const provinceStyle = (feature: Feature<Geometry, ProvinceProperties> | undefined) => {
                const colors = document.documentElement.classList.contains("dark")
                    ? mapColors.dark
                    : mapColors.light;
                const hainan = isHainan(feature);

                return {
                    color: hainan ? colors.hainanStroke : colors.provinceStroke,
                    weight: hainan ? 1.8 : 0.9,
                    opacity: 1,
                    fillColor: hainan ? colors.hainanFill : colors.provinceFill,
                    fillOpacity: hainan ? 0.72 : 0.54
                };
            };

            const provinceLayer = L.geoJSON(provinces, {
                style: provinceStyle,
                onEachFeature: (feature, layer) => {
                    if (!isHainan(feature)) return;

                    const pathLayer = layer as Leaflet.Path;

                    layer.on({
                        click: () => goto(sites.hainan.entryHref ?? sites.hainan.href),
                        mouseover: () => {
                            pathLayer.setStyle({ fillOpacity: 0.86, weight: 2.4 });
                        },
                        mouseout: () => {
                            provinceLayer.resetStyle(layer);
                        }
                    });
                }
            }).addTo(map);

            map.fitBounds(provinceLayer.getBounds(), { padding: [18, 18] });

            Object.values(sites).forEach((site) => {
                const marker = L.circleMarker([site.coordinates[1], site.coordinates[0]], {
                    radius: site.id === "chongming" ? 8 : 7,
                    color: "#ffffff",
                    weight: 2,
                    fillColor: site.id === "chongming" ? "#2563eb" : "#0f766e",
                    fillOpacity: 0.95,
                    className: "site-marker"
                });

                marker
                    .bindTooltip(site.name, {
                        permanent: true,
                        direction: "top",
                        offset: [0, -8],
                        className: "site-tooltip"
                    })
                    .on("click", () => goto(site.entryHref ?? site.href))
                    .on("mouseover", () => marker.setStyle({ radius: 10, fillOpacity: 1 }))
                    .on("mouseout", () =>
                        marker.setStyle({
                            radius: site.id === "chongming" ? 8 : 7,
                            fillOpacity: 0.95
                        })
                    )
                    .addTo(map as Leaflet.Map);
            });

            const themeObserver = new MutationObserver(() => {
                provinceLayer.setStyle(provinceStyle);
            });

            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["class"]
            });

            map.on("unload", () => themeObserver.disconnect());
        }

        setupMap().catch((error: unknown) => {
            loadError = error instanceof Error ? error.message : "地图初始化失败";
        });

        return () => map?.remove();
    });
</script>

<div
    class="map-shell relative min-h-107.5 overflow-hidden rounded-lg border border-[#d6dee3] bg-[#eef3f4] md:min-h-130 dark:border-[#334452] dark:bg-[#182630]"
>
    <div
        bind:this={mapElement}
        class="h-full w-full bg-[#eef3f4] dark:bg-[#182630]"
        aria-label="中国省级边界地图"
    ></div>
    {#if loadError}
        <div
            class="absolute inset-4 flex flex-col justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-5 text-center text-red-900"
            role="alert"
        >
            <strong>地图数据加载失败</strong>
            <span>{loadError}</span>
            <span
                >请确认文件存在：static/data/china-provinces.geojson，格式为 GeoJSON
                FeatureCollection。</span
            >
        </div>
    {/if}
</div>

<style>
    .map-shell {
        height: clamp(520px, 72vh, 760px);
    }

    :global(.site-tooltip) {
        border: 1px solid #cbd5df;
        border-radius: 4px;
        background: #ffffff;
        color: #1f2937;
        box-shadow: 0 8px 18px rgb(15 23 42 / 12%);
        font-size: 12px;
        font-weight: 650;
        padding: 4px 8px;
    }

    :global(.site-tooltip::before) {
        display: none;
    }

    :global(.dark .leaflet-control-zoom a) {
        border-color: #425665;
        background: #17212b;
        color: #dce7ec;
    }

    :global(.dark .leaflet-control-zoom a:hover) {
        background: #263943;
        color: #ffffff;
    }

    :global(.dark .site-tooltip) {
        border-color: #425665;
        background: #17212b;
        color: #edf4f6;
        box-shadow: 0 8px 18px rgb(0 0 0 / 28%);
    }

    :global(.dark .leaflet-container) {
        background: #182630;
    }

    @media (max-width: 760px) {
        .map-shell {
            height: 58vh;
        }
    }
</style>
