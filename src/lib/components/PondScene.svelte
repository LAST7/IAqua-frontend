<script lang="ts">
    import type { Pond, PondStatus } from "$lib/site-data";
    import PondSceneVideos from "$lib/components/PondSceneVideos.svelte";

    type DevicePin = {
        id: string;
        name: string;
        code: string;
        x: number;
        y: number;
        detail: string;
    };
    const devicePins: DevicePin[] = [
        {
            id: "feed",
            name: "自动投饵机",
            code: "FEED-01",
            x: 72,
            y: 27,
            detail: "待机，料线连接正常"
        },
        {
            id: "water",
            name: "水质监测点",
            code: "WQ-01",
            x: 41,
            y: 62,
            detail: "水温、溶氧、pH 在线采集"
        },
        { id: "oxygen", name: "增氧机", code: "OXY-01", x: 55, y: 59, detail: "自动联动模式" },
        {
            id: "camera",
            name: "固定摄像机",
            code: "CAM-01",
            x: 13,
            y: 58,
            detail: "养殖池监控画面"
        }
    ];
    const statusLabels: Record<PondStatus, string> = {
        normal: "运行正常",
        feeding: "投喂中",
        warning: "待关注",
        disabled: "已禁用",
        calibrating: "校准中"
    };

    let {
        pond,
        status,
        selectedDeviceId = $bindable("water")
    }: { pond: Pond; status: PondStatus; selectedDeviceId?: string } = $props();
    let selectedDevice = $derived(
        devicePins.find((device) => device.id === selectedDeviceId) ?? devicePins[0]
    );
</script>

<section class="scene-panel" aria-labelledby="scene-title">
    <div class="scene-heading">
        <div>
            <p>现场实景</p>
            <h2 id="scene-title">{pond.name}</h2>
        </div>
        <span class="status-tag status-{status}">{statusLabels[status]}</span>
    </div>
    <div class="scene">
        <img src="https://www.imlast.top/iaqua/facility_wenchang.jpg" alt="养殖水面现场" />
        <div class="scene-shade"></div>
        <div class="scene-label"><strong>{pond.name}</strong><span>池塘运行实景</span></div>
        {#each devicePins as device}<button
                class:chosen={device.id === selectedDeviceId}
                class="device-pin"
                type="button"
                style={`left:${device.x}%;top:${device.y}%`}
                onclick={() => (selectedDeviceId = device.id)}
                title={device.name}><span></span><b>{device.name}</b></button
            >{/each}
        <div class="device-popover">
            <strong>{selectedDevice.name}</strong><span>{selectedDevice.code}</span>
            <p>{selectedDevice.detail}</p>
        </div>
    </div>
    <div class="metrics">
        <div
            class="border-t-3 border-[#74aeb0] bg-[#f9fbfb] p-2.75 text-[#15242b] dark:border-[#4c777b] dark:bg-[#15242a] dark:text-[#dce9eb]"
        >
            <span class="text-[#61787d] dark:text-[#9fb8bc]">水温</span><strong
                >{pond.temperature}<small class="text-[#60767b] dark:text-[#9fb8bc]">C</small
                ></strong
            >
        </div>
        <div
            class="border-t-3 border-[#74aeb0] bg-[#f9fbfb] p-2.75 text-[#15242b] dark:border-[#4c777b] dark:bg-[#15242a] dark:text-[#dce9eb]"
        >
            <span class="text-[#61787d] dark:text-[#9fb8bc]">溶氧</span><strong
                >{pond.dissolvedOxygen}<small class="text-[#60767b] dark:text-[#9fb8bc]">mg/L</small
                ></strong
            >
        </div>
        <div
            class="border-t-3 border-[#74aeb0] bg-[#f9fbfb] p-2.75 text-[#15242b] dark:border-[#4c777b] dark:bg-[#15242a] dark:text-[#dce9eb]"
        >
            <span class="text-[#61787d] dark:text-[#9fb8bc]">pH</span><strong
                >{pond.ph}<small class="text-[#60767b] dark:text-[#9fb8bc]">pH</small></strong
            >
        </div>
    </div>
    <PondSceneVideos {pond} />
</section>

<style>
    .scene-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 9px;
    }
    .scene-heading p {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: #60757b;
    }
    .scene-heading h2 {
        margin: 0;
        font-size: 21px;
    }
    .status-tag {
        padding: 5px 9px;
        border: 1px solid currentColor;
        font-size: 13px;
        font-weight: 700;
    }
    .status-normal {
        color: #14736f;
    }
    .status-feeding,
    .status-calibrating {
        color: #286fa1;
    }
    .status-warning {
        color: #af6b09;
    }
    .status-disabled {
        color: #67777c;
    }
    .scene {
        position: relative;
        min-height: 560px;
        overflow: hidden;
        border: 1px solid #bdcccf;
        background: #203e42;
    }
    .scene > img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .scene-shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgb(5 22 24 / 12%), rgb(5 22 24 / 48%));
    }
    .scene-label {
        position: absolute;
        left: 20px;
        bottom: 19px;
        display: grid;
        color: white;
        text-shadow: 0 1px 3px rgb(0 0 0 / 55%);
    }
    .scene-label strong {
        font-size: 26px;
    }
    .scene-label span {
        font-size: 14px;
    }
    .device-pin {
        position: absolute;
        z-index: 2;
        display: grid;
        justify-items: center;
        gap: 5px;
        transform: translate(-50%, -50%);
        border: 0;
        background: none;
        color: white;
        cursor: pointer;
        text-shadow: 0 1px 3px black;
    }
    .device-pin span {
        width: 17px;
        height: 17px;
        border: 3px solid white;
        border-radius: 50%;
        background: #22a4a5;
        box-shadow: 0 0 0 5px rgb(34 164 165 / 28%);
    }
    .device-pin b {
        max-width: 120px;
        font-size: 12px;
        white-space: nowrap;
    }
    .device-pin.chosen span {
        background: #f3b544;
        box-shadow: 0 0 0 7px rgb(243 181 68 / 30%);
    }
    .device-popover {
        position: absolute;
        z-index: 3;
        top: 18px;
        right: 18px;
        width: min(215px, calc(100% - 36px));
        border-left: 3px solid #21a1a4;
        background: rgb(8 30 33 / 85%);
        padding: 12px 14px;
        color: #f5ffff;
    }
    .device-popover strong,
    .device-popover span {
        display: block;
    }
    .device-popover strong {
        font-size: 15px;
    }
    .device-popover span,
    .device-popover p {
        margin: 4px 0 0;
        font-size: 12px;
        color: #bee6e3;
    }
    .device-popover p {
        color: #e1efef;
    }
    .metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 9px;
        margin-top: 12px;
    }
    .metrics span,
    .metrics strong {
        display: block;
    }
    .metrics span {
        font-size: 13px;
    }
    .metrics strong {
        margin-top: 3px;
        font-size: 24px;
    }
    .metrics small {
        margin-left: 3px;
        font-size: 11px;
    }
    @media (max-width: 640px) {
        .scene {
            min-height: 410px;
        }
        .device-pin b {
            display: none;
        }
    }
</style>
