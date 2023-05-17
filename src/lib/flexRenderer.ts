import type { ComponentType, SvelteComponentTyped } from "svelte";
import { flexRender as flexRenderOrig  } from "@tanstack/svelte-table";

export const flexRender = <P extends Record<string, any>, C = any>(
    component: C,
    props: P
  ): ComponentType<SvelteComponentTyped> =>
    flexRenderOrig(component, props) as ComponentType<SvelteComponentTyped>;