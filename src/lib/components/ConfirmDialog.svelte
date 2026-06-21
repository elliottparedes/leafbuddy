<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	let {
		open = $bindable(false),
		title = 'Are you sure?',
		description = 'This action cannot be undone.',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		destructive = true,
		onConfirm
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		destructive?: boolean;
		onConfirm?: () => void | Promise<void>;
	} = $props();

	let isProcessing = $state(false);

	async function handleConfirm() {
		if (!onConfirm) {
			open = false;
			return;
		}
		isProcessing = true;
		try {
			await onConfirm();
		} finally {
			isProcessing = false;
			open = false;
		}
	}

	function handleCancel() {
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[380px]">
		<Dialog.Header>
			{#if destructive}
				<div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
					<TriangleAlertIcon class="size-6 text-destructive" />
				</div>
			{/if}
			<Dialog.Title class="text-center text-base">{title}</Dialog.Title>
			<Dialog.Description class="text-center text-sm">
				{description}
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
			<Button
				variant="outline"
				onclick={handleCancel}
				disabled={isProcessing}
			>
				{cancelText}
			</Button>
			<Button
				variant={destructive ? 'destructive' : 'default'}
				onclick={handleConfirm}
				disabled={isProcessing}
			>
				{isProcessing ? 'Please wait...' : confirmText}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
