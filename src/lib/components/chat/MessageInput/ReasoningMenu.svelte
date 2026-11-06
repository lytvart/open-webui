<script lang="ts">
	import { getContext } from 'svelte';
	const i18n = getContext<any>('i18n');

	import { reasoningVariant } from '$lib/stores';
	import { REASONING_VARIANTS } from '$lib/constants/reasoningVariants';

	import Dropdown from '$lib/components/common/Dropdown.svelte';
	import DropdownMenu from '$lib/components/common/DropdownMenu.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Sparkles from '$lib/components/icons/Sparkles.svelte';

	export let show = false;

	$: selectedVariant = REASONING_VARIANTS.find((variant) => variant.id === $reasoningVariant);
	$: selectedLabel = selectedVariant?.shortLabel ?? $i18n.t('Fast');

	const select = (id: string) => {
		reasoningVariant.set(id);
		show = false;
	};

	$: triggerClass = `flex items-center gap-1 translate-y-[1px] rounded-lg px-1.5 py-1 text-[0.8125rem] transition-colors duration-100 cursor-pointer text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-50/40 dark:hover:bg-gray-800/40`;
</script>

<div class="flex items-center">
	<Dropdown bind:show align="end">
		<Tooltip content={$i18n.t('Reasoning effort')} placement="top">
			<button type="button" aria-label={$i18n.t('Reasoning effort')} class={triggerClass}>
				<Sparkles className="size-3.5" strokeWidth="2" />
				<span class="truncate">{selectedLabel}</span>
			</button>
		</Tooltip>

		<div slot="content">
			<DropdownMenu className="min-w-52 max-w-60">
				<div
					class="px-2.5 pb-1 pt-1.5 text-[0.625rem] font-normal text-gray-400 uppercase tracking-wider"
				>
					{$i18n.t('Reasoning effort')}
				</div>

				{#each REASONING_VARIANTS as variant (variant.id)}
					<!-- Wrapper keeps DropdownMenu's forced [&>button] height off these two-line items -->
					<div class="px-0.5 py-px">
						<button
							type="button"
							role="menuitemradio"
							aria-checked={$reasoningVariant === variant.id}
							class="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-[0.8125rem] font-normal cursor-pointer {$reasoningVariant ===
							variant.id
								? 'bg-brand/25 dark:bg-brand/25'
								: 'hover:bg-gray-50/40 dark:hover:bg-gray-800/40'}"
							on:click={() => select(variant.id)}
						>
							<div class="flex min-w-0 flex-1 flex-col items-start">
								<span class="truncate">{$i18n.t(variant.label)}</span>
								<span class="truncate text-[0.625rem] text-gray-400 dark:text-gray-500">
									{$i18n.t(variant.description)}
								</span>
							</div>
							{#if $reasoningVariant === variant.id}
								<div class="shrink-0 text-emerald-600 dark:text-emerald-400">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="size-3.5"
									>
										<path
											fill-rule="evenodd"
											d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							{/if}
						</button>
					</div>
				{/each}
			</DropdownMenu>
		</div>
	</Dropdown>
</div>
