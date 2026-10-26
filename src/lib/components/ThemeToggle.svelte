<script lang="ts">
    import { onMount } from "svelte";

    let isDark = $state(false);

    function applyTheme(dark: boolean) {
        isDark = dark;
        document.documentElement.classList.toggle("dark", dark);
        localStorage.setItem("iaqua-theme", dark ? "dark" : "light");
    }

    function toggleTheme() {
        applyTheme(!isDark);
    }

    onMount(() => {
        const storedTheme = localStorage.getItem("iaqua-theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(storedTheme ? storedTheme === "dark" : prefersDark);
    });
</script>

<button
    class="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#cbd5df] bg-white px-3 text-sm font-semibold text-[#334155] transition-colors hover:border-[#8aa0b2] hover:bg-[#f8fbfc] dark:border-[#3b4a59] dark:bg-[#17212b] dark:text-[#d5e1e8] dark:hover:border-[#6d8292] dark:hover:bg-[#22303c]"
    type="button"
    aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
    title={isDark ? "切换到亮色模式" : "切换到暗色模式"}
    onclick={toggleTheme}
>
    <span aria-hidden="true" class="text-base leading-none">{isDark ? "☀" : "◐"}</span>
    <span>{isDark ? "亮色" : "暗色"}</span>
</button>
