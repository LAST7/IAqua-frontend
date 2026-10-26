<script lang="ts">
    let {
        pondName,
        actionMessage,
        isCalibrating,
        onfeed,
        oncalibrate,
        isDisabled = $bindable(false)
    }: {
        pondName: string;
        actionMessage: string;
        isCalibrating: boolean;
        onfeed: (manual: boolean) => void;
        oncalibrate: () => void;
        isDisabled?: boolean;
    } = $props();

    let feedMode = $state<"auto" | "manual">("auto");
    let feedLevel = $state(3);
    let feedInterval = $state(30);
    let preClean = $state(10);
    let maxFeed = $state(120);
    let postClean = $state(20);
    let calibrationAmount = $state(500);
    let calibrationTime = $state(30);
    let motorSpeed = $state(1200);

    function executeFeed(manual: boolean) {
        if (isDisabled) return;
        onfeed(manual);
    }
</script>

<aside aria-labelledby="control-title">
    <div class="control-header">
        <p>当前控制对象</p>
        <h2 id="control-title">{pondName}</h2>
        <span>{actionMessage}</span>
    </div>
    <section class="control-section">
        <h3>投喂控制</h3>
        <div class="mode-switch">
            <button
                class:mode-active={feedMode === "auto"}
                type="button"
                onclick={() => (feedMode = "auto")}>自动</button
            ><button
                class:mode-active={feedMode === "manual"}
                type="button"
                onclick={() => (feedMode = "manual")}>手动</button
            >
        </div>
        <div class="action-grid">
            <button
                class="primary-action"
                type="button"
                disabled={isDisabled}
                onclick={() => executeFeed(false)}>开始打料</button
            ><button
                class="secondary-action"
                type="button"
                disabled={isDisabled}
                onclick={() => executeFeed(true)}>手动下料</button
            >
        </div>
        <label class="toggle-row"
            ><span><b>禁用水池</b><small>暂停该池所有投喂指令</small></span><input
                type="checkbox"
                bind:checked={isDisabled}
            /></label
        >
    </section>
    <section class="control-section">
        <h3>投喂参数</h3>
        <div class="fields">
            <label>档位<input type="number" min="1" max="8" bind:value={feedLevel} /></label><label
                >间隔 <small>秒</small><input type="number" bind:value={feedInterval} /></label
            ><label>打料前清料 <small>秒</small><input type="number" bind:value={preClean} /></label
            ><label>最大打料 <small>秒</small><input type="number" bind:value={maxFeed} /></label
            ><label
                >满料后清料 <small>秒</small><input type="number" bind:value={postClean} /></label
            >
        </div>
    </section>
    <section class="control-section">
        <h3>饲喂校准</h3>
        <div class="fields">
            <label
                >校准量 <small>g</small><input
                    type="number"
                    bind:value={calibrationAmount}
                /></label
            ><label
                >校准时间 <small>秒</small><input
                    type="number"
                    bind:value={calibrationTime}
                /></label
            ><label>转速 <small>rpm</small><input type="number" bind:value={motorSpeed} /></label>
        </div>
        <button
            class="calibrate"
            type="button"
            disabled={isDisabled || isCalibrating}
            onclick={oncalibrate}>{isCalibrating ? "校准进行中" : "开始校准"}</button
        >
    </section>
</aside>

<style>
    .control-header {
        border-left: 5px solid #1b8585;
        background: #e5f0f0;
        padding: 15px;
    }
    .control-header p,
    .control-header h2,
    .control-header span {
        margin: 0;
    }
    .control-header p {
        font-size: 12px;
        color: #547176;
    }
    .control-header h2 {
        font-size: 23px;
    }
    .control-header span {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: #26716d;
    }
    .control-section {
        border: 1px solid #cad7da;
        border-top: 0;
        background: #fbfcfc;
        padding: 15px;
    }
    .control-section h3 {
        margin: 0 0 12px;
        font-size: 16px;
    }
    .mode-switch {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 1px solid #b9c9cc;
    }
    .mode-switch button {
        border: 0;
        background: transparent;
        padding: 9px;
        font-size: 14px;
        color: #51676c;
        cursor: pointer;
    }
    .mode-switch .mode-active {
        background: #246c73;
        color: white;
    }
    .action-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
        margin-top: 9px;
    }
    .primary-action,
    .secondary-action,
    .calibrate {
        min-height: 39px;
        border: 1px solid #27747a;
        padding: 8px;
        font-weight: 700;
        cursor: pointer;
    }
    .primary-action,
    .calibrate {
        background: #21767a;
        color: white;
    }
    .secondary-action {
        background: #f7fbfb;
        color: #1c646b;
    }
    button:disabled {
        cursor: not-allowed;
        opacity: 0.48;
    }
    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 13px;
        cursor: pointer;
    }
    .toggle-row b,
    .toggle-row small {
        display: block;
    }
    .toggle-row b {
        font-size: 13px;
    }
    .toggle-row small {
        margin-top: 2px;
        font-size: 11px;
        color: #71868a;
    }
    .toggle-row input {
        accent-color: #17777a;
        width: 18px;
        height: 18px;
    }
    .fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
    .fields label {
        position: relative;
        display: grid;
        gap: 5px;
        font-size: 12px;
        color: #536c72;
    }
    .fields label small {
        position: absolute;
        right: 8px;
        bottom: 9px;
        font-size: 10px;
        color: #829297;
    }
    .fields input {
        min-width: 0;
        width: 100%;
        height: 35px;
        border: 1px solid #becdd0;
        background: white;
        padding: 5px 30px 5px 8px;
        color: #21383d;
    }
    .calibrate {
        width: 100%;
        margin-top: 12px;
    }
    :global(.dark) .control-section {
        border-color: #3b555a;
        background: #15242a;
        color: #dce9eb;
    }
    :global(.dark) .control-header {
        background: #173336;
    }
    :global(.dark) .fields input {
        border-color: #405b60;
        background: #0e1d22;
        color: #e8f1f2;
    }
</style>
