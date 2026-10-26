<script lang="ts">
    import type { Pond } from "$lib/site-data";

    let { pond }: { pond: Pond } = $props();
</script>

<section class="videos" aria-labelledby="video-title">
    <div class="video-heading">
        <h2 id="video-title">池塘视频监控</h2>
    </div>
    <div class="video-grid">
        {#each [{ name: "池塘全景", src: pond.videoUrl1 }, { name: "投饵机位", src: pond.videoUrl2 }, { name: "料线入口", src: pond.videoUrl3 }] as video, index}<div
                class="video-card"
                data-video={index}
            >
                <video src={video.src} aria-label={video.name} autoplay loop muted playsinline
                ></video>
            </div>{/each}
    </div>
</section>

<style>
    .videos {
        margin-top: 16px;
    }
    .video-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 9px;
    }
    .video-heading h2 {
        margin: 0;
        font-size: 16px;
    }
    .video-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 9px;
    }
    .video-card {
        position: relative;
        overflow: hidden;
        aspect-ratio: 16 / 8;
        background: #172a2c;
    }
    .video-card :global(video) {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    @media (max-width: 640px) {
        .video-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
