<script lang="ts">
	import { getContext } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	const i18n = getContext<any>('i18n');
	const dispatch = createEventDispatcher();

	import { initiateOAuthRedirect } from '$lib/apis/configs';
	import { selectedToolIds, tools, user } from '$lib/stores';
	import Switch from '$lib/components/common/Switch.svelte';
	import Wrench from '$lib/components/icons/Wrench.svelte';
	import Plus from '$lib/components/icons/Plus.svelte';
	import Cog6 from '$lib/components/icons/Cog6.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	// MCP tool servers available to the user (admin-defined + personal)
	$: mcpTools = ($tools ?? []).filter((tool) => String(tool.id).startsWith('server:mcp:'));

	const toggleTool = (tool, enabled: boolean) => {
		const selected = $selectedToolIds;
		selectedToolIds.set(
			enabled
				? selected.includes(tool.id)
					? selected
					: [...selected, tool.id]
				: selected.filter((id) => id !== tool.id)
		);
	};

	const connectOAuth = (tool) => {
		const parts = tool.id.split(':');
		initiateOAuthRedirect({
			id: tool.id,
			serverId: parts.at(-1) ?? tool.id,
			authType: parts.length > 1 ? (parts[0] === 'server' ? parts[1] : parts[0]) : null
		});
	};
</script>

<div class="flex flex-col gap-0.5 px-1 py-0.5">
	{#each mcpTools as tool (tool.id)}
		<div
			class="group flex w-full items-center gap-1.5 rounded-lg py-1 pe-1.5 ps-1.5 text-xs hover:bg-brand/10 dark:hover:bg-brand/10"
		>
			<div class="shrink-0 text-gray-500 dark:text-gray-400">
				<Wrench />
			</div>

			<div class="flex min-w-0 flex-1 items-center gap-1.5">
				<div class="truncate" title={tool.meta?.description ?? ''}>
					{tool.name}
				</div>

				{#if tool.personal}
					<div
						class="shrink-0 rounded-md bg-gray-500/10 px-1.5 py-0.5 text-[0.5625rem] leading-none text-gray-500 dark:text-gray-400"
					>
						{$i18n.t('Personal')}
					</div>
				{/if}
			</div>

			<div class="flex shrink-0 items-center">
				{#if tool.personal || $user?.role === 'admin'}
					<button
						class="rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
						aria-label={$i18n.t('Configure connection')}
						on:click={() => dispatch('configure', tool)}
					>
						<Cog6 className="size-3.5" />
					</button>
				{/if}
				{#if !(tool.authenticated ?? true)}
					<button
						class="rounded-lg px-2 py-1 text-[0.6875rem] font-medium text-gray-700 transition-colors hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-gray-800"
						on:click={() => connectOAuth(tool)}
					>
						{$i18n.t('Connect')}
					</button>
				{:else}
					<Switch
						id={`sidebar-mcp-${tool.id}`}
						state={$selectedToolIds.includes(tool.id)}
						on:change={(e) => toggleTool(tool, e.detail)}
					/>
				{/if}
			</div>
		</div>
	{:else}
		<div class="px-2 py-1 text-[0.6875rem] text-gray-400 dark:text-gray-600">
			{#if $tools === null}
				<Spinner className="size-3" />
			{:else}
				{$i18n.t('No MCP connections yet.')}
			{/if}
		</div>
	{/each}

	<!-- Always-available entry point for creating a connection from the sidebar -->
	<button
		class="flex w-full items-center gap-1.5 rounded-lg py-1 pe-1.5 ps-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100/60 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-850/60 dark:hover:text-gray-200"
		on:click={() => dispatch('add')}
	>
		<div class="shrink-0">
			<Plus className="size-4" />
		</div>
		<div class="flex min-w-0 flex-1 items-center gap-1.5">
			<div class="truncate">{$i18n.t('Connect MCP')}</div>
		</div>
	</button>
</div>
