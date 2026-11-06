import type { Action } from 'svelte/action';

/**
 * Keeps a clipped container scrolled to its bottom as content grows.
 * Used by collapsed reasoning previews so the newest thinking lines stay
 * visible instead of the first ones.
 */
export const stickToBottom: Action<HTMLElement> = (node: HTMLElement) => {
	const stick = () => {
		node.scrollTop = node.scrollHeight;
	};

	stick();

	const observer = new MutationObserver(stick);
	observer.observe(node, { childList: true, subtree: true, characterData: true });

	return {
		destroy() {
			observer.disconnect();
		}
	};
};
