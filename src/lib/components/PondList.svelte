<script lang="ts">
    import type { Pond, PondStatus } from "$lib/site-data";

    let {
        ponds,
        selectedId,
        onselect
    }: { ponds: Pond[]; selectedId: string; onselect: (id: string) => void } = $props();

    const statusLabels: Record<PondStatus, string> = {
        normal: "运行正常",
        feeding: "投喂中",
        warning: "待关注",
        disabled: "已禁用",
        calibrating: "校准中"
    };
</script>

<aside aria-labelledby="pond-list-title">
    <div class="pond-list-heading">
        <h2 id="pond-list-title">养殖池</h2>
        <span>8 个池</span>
    </div>
    <div class="pond-list">
        {#each ponds as pond}
            <button
                class:active={pond.id === selectedId}
                class="pond-button status-{pond.status}"
                type="button"
                onclick={() => onselect(pond.id)}
            >
                <strong>{pond.name}</strong><span>{statusLabels[pond.status]}</span><small
                    >DO {pond.dissolvedOxygen} mg/L</small
                >
            </button>
        {/each}
    </div>
</aside>

<style>
    .pond-list-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 9px;
    }
    .pond-list-heading h2 {
        margin: 0;
        font-size: 17px;
    }
    .pond-list-heading span {
        font-size: 13px;
        color: #60757b;
    }
    .pond-list {
        display: grid;
        gap: 9px;
    }
    .pond-button {
        min-height: 84px;
        border: 1px solid #cad7da;
        border-left: 5px solid #5e8d94;
        background: #f9fbfb;
        padding: 12px;
        text-align: left;
        color: #23383d;
        cursor: pointer;
    }
    .pond-button strong,
    .pond-button span,
    .pond-button small {
        display: block;
    }
    .pond-button strong {
        font-size: 16px;
    }
    .pond-button span {
        margin-top: 4px;
        font-size: 13px;
        color: #516970;
    }
    .pond-button small {
        margin-top: 4px;
        font-size: 12px;
        color: #71878c;
    }
    .pond-button:hover,
    .pond-button.active {
        border-color: #15717a;
        background: #e7f4f3;
    }
    .pond-button.status-warning {
        border-left-color: #d69124;
    }
    .pond-button.status-disabled {
        border-left-color: #849397;
    }
    .pond-button.status-calibrating,
    .pond-button.status-feeding {
        border-left-color: #347aaf;
    }
    :global(.dark) .pond-button {
        border-color: #3b555a;
        background: #15242a;
        color: #dce9eb;
    }
    :global(.dark) .pond-button.active,
    :global(.dark) .pond-button:hover {
        background: #1b383a;
    }
    @media (max-width: 1279px) {
        .pond-list {
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }
    }
    @media (max-width: 640px) {
        .pond-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
</style>
