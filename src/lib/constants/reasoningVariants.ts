// Reasoning-effort presets injected into the chat completion request params.
// Modeled on the `variants` option of opencode provider configs: selecting a
// variant merges its values into the request body (see Chat.svelte), so keys
// must be accepted by the provider (e.g. LiteLLM `allowed_openai_params`).
export type ReasoningVariant = {
	id: string;
	label: string;
	shortLabel: string;
	description: string;
	params: Record<string, unknown>;
};

const thinkingParams = (effort: 'low' | 'medium' | 'xhigh') => ({
	reasoningEffort: effort,
	reasoning_effort: effort,
	temperature: 0.6,
	top_p: 0.95,
	top_k: 20,
	min_p: 0.0,
	presence_penalty: 0.0,
	repetition_penalty: 1.0,
	chat_template_kwargs: {
		enable_thinking: true
	}
});

export const REASONING_VARIANTS: ReasoningVariant[] = [
	{
		id: 'fast',
		label: 'Fast',
		shortLabel: 'Fast',
		description: 'No thinking — direct answers',
		params: {
			temperature: 0.7,
			top_p: 0.8,
			top_k: 20,
			min_p: 0.0,
			presence_penalty: 1.5,
			repetition_penalty: 1.0,
			chat_template_kwargs: {
				enable_thinking: false
			}
		}
	},
	{
		id: 'low-thinking',
		label: 'Low thinking',
		shortLabel: 'Low',
		description: 'Light reasoning',
		params: thinkingParams('low')
	},
	{
		id: 'medium-thinking',
		label: 'Medium thinking',
		shortLabel: 'Med',
		description: 'Balanced reasoning',
		params: thinkingParams('medium')
	},
	{
		id: 'xhigh-thinking',
		label: 'Extra high thinking',
		shortLabel: 'Xhigh',
		description: 'Deepest reasoning',
		params: thinkingParams('xhigh')
	}
];

export const getReasoningVariantParams = (id: string): Record<string, unknown> =>
	REASONING_VARIANTS.find((variant) => variant.id === id)?.params ?? {};
