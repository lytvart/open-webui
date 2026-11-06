<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	import Collapsible from '$lib/components/common/Collapsible.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import ChevronRight from './icons/ChevronRight.svelte';
	import Plus from './icons/Plus.svelte';

	const dispatch = createEventDispatcher();
	type AddHandler = () => void | Promise<void>;

	export let open = true;
	export let id = '';
	export let name = '';
	export let collapsible = true;
	export let className = '';
	export let buttonClassName = '';
	export let contentClassName = 'px-1.5';
	export let onAddLabel = '';
	export let onAdd: null | AddHandler = null;
	export let dragAndDrop = true;
	// Fork addition: optional leading icon component for the section title
	export let icon: any = null;

	let sectionElement: HTMLDivElement;
	let loaded = false;
	let draggedOver = false;

	// Fork: the group borders below the title must only render when the slot
	// actually produced content (e.g. Folders open with zero folders has none).
	// Svelte leaves comment/whitespace anchors, so :empty can't do this in CSS.
	let contentElement: HTMLDivElement;
	let hasContent = false;
	let contentObserver: MutationObserver | undefined;

	const refreshHasContent = () => {
		hasContent =
			!!contentElement &&
			(contentElement.children.length > 0 || (contentElement.textContent ?? '').trim() !== '');
	};

	$: if (contentElement) {
		refreshHasContent();
		contentObserver?.disconnect();
		contentObserver = new MutationObserver(refreshHasContent);
		contentObserver.observe(contentElement, { childList: true, subtree: true });
	} else {
		contentObserver?.disconnect();
		hasContent = false;
	}

	const setOpen = (state: boolean) => {
		open = state;
		dispatch('change', state);
		localStorage.setItem(`${id}-folder-state`, `${state}`);
	};

	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		draggedOver = true;
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!sectionElement.contains(e.target as Node)) {
			return;
		}

		if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
			for (const item of Array.from(e.dataTransfer.items)) {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					if (file && file.type === 'application/json') {
						const reader = new FileReader();
						reader.onload = async function (event) {
							try {
								const fileContent = JSON.parse(event.target?.result as string);
								open = true;
								dispatch('import', fileContent);
							} catch (error) {
								console.error('Error parsing JSON file:', error);
							}
						};
						reader.readAsText(file);
					}
				} else {
					open = true;
					try {
						const dataTransfer = e.dataTransfer.getData('text/plain');
						if (dataTransfer) {
							dispatch('drop', JSON.parse(dataTransfer));
						}
					} catch {
						// Ignore drops that are not sidebar JSON payloads.
					} finally {
						draggedOver = false;
					}
					break;
				}
			}
		}

		draggedOver = false;
	};

	const onDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		draggedOver = false;
	};

	onMount(() => {
		const state = localStorage.getItem(`${id}-folder-state`);
		if (state !== null) {
			open = state === 'true';
		}

		loaded = true;

		if (!dragAndDrop) {
			return;
		}

		sectionElement.addEventListener('dragover', onDragOver);
		sectionElement.addEventListener('drop', onDrop);
		sectionElement.addEventListener('dragleave', onDragLeave);
	});

	onDestroy(() => {
		contentObserver?.disconnect();

		if (!dragAndDrop) {
			return;
		}

		sectionElement.removeEventListener('dragover', onDragOver);
		sectionElement.removeEventListener('drop', onDrop);
		sectionElement.removeEventListener('dragleave', onDragLeave);
	});
</script>

<div bind:this={sectionElement} class="relative {className}">
	{#if loaded}
		{#if draggedOver}
			<div
				class="absolute inset-0 z-50 rounded-md bg-gray-100/50 pointer-events-none touch-none dark:bg-gray-700/20"
			></div>
		{/if}

		{#if collapsible}
			<Collapsible bind:open className="w-full" buttonClassName="w-full" onChange={setOpen}>
				<div
					class="flex items-center justify-between h-8 mx-1 w-[calc(100%-0.5rem)] px-2 shrink-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
				>
					<h2 class="flex flex-1 h-full">
						<button
							type="button"
							class="group flex flex-1 h-full items-center gap-2 text-left text-[0.8125rem] leading-5 text-[#00163a] dark:text-gray-200 transition-colors duration-100 {buttonClassName}"
							aria-expanded={open}
							aria-controls="{id}-content"
						>
							{#if icon}
								<svelte:component this={icon} className="size-4 shrink-0" />
							{/if}
							<span>{name}</span>
							<span
								class="flex opacity-70 transition-all duration-100"
								style="transform: rotate({open ? '-90deg' : '90deg'})"
							>
								<ChevronRight className="size-[0.9375rem]" />
							</span>
						</button>
					</h2>

					<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
					<div class="contents" on:click={(e) => e.stopPropagation()}>
						<slot name="action" />
					</div>

					{#if onAdd}
						<button
							type="button"
							class="flex items-center justify-center w-7 h-7 rounded-lg text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors duration-100"
							aria-label={onAddLabel}
							on:click={(e) => {
								e.stopPropagation();
								onAdd();
							}}
						>
							<Tooltip content={onAddLabel}>
								<Plus className="size-3.5" />
							</Tooltip>
						</button>
					{/if}
				</div>

				<!-- Content only mounts while open: matching faint brand-blue rules above
					and below mark the expanded group's boundaries. -->
				<!-- Group indicator: left rail (same language as the reasoning block,
					thinner). Previous top/bottom variant, for reference:
					hasContent ? 'border-y border-brand/10 pt-1.5 pb-1.5' : '' -->
				<div
					id="{id}-content"
					slot="content"
					bind:this={contentElement}
					class="w-full {contentClassName} {hasContent ? 'border-l-[2px] border-l-brand/35' : ''}"
				>
					<slot></slot>
				</div>
			</Collapsible>
		{:else}
			<slot></slot>
		{/if}
	{/if}
</div>
