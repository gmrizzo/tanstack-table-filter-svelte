<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let debounce = 500;
    export let placeholder;
    const dispatch = createEventDispatcher();

    export let value = "";

    let timer;
    function debounceFn(e) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            dispatch("change", e.target.value);
        }, debounce);
    }

    let className = "";
    export { className as class };
</script>

<input {value} class={className} on:input={debounceFn} {placeholder} {...$$props} />
