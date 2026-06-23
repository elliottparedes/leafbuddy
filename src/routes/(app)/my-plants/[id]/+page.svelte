<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { formatRelativeDate, formatWateringDue } from '$lib/format';
	import { log } from '$lib/log';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import DropletsIcon from '@lucide/svelte/icons/droplets';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SproutIcon from '@lucide/svelte/icons/sprout';
	import { toast } from 'svelte-sonner';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let useRecommended = $state(data.schedule?.useRecommendedSchedule ?? true);
	let reminderEnabled = $state(data.schedule?.reminderEnabled ?? true);
	let customIntervalDays = $state(String(data.schedule?.customIntervalDays ?? data.species.recommendedWateringIntervalDays));

	// For inline progress photo upload next to image
	let photoInput = $state<HTMLInputElement | null>(null);
	let uploadFileRef = $state<HTMLInputElement | null>(null);
	let pendingUploadFile = $state<File | null>(null);
	let pendingUploadCaption = $state('');
	let showUploadPrompt = $state(false);

	// Ensure selected file is attached to the upload form's input
	$effect(() => {
		if (showUploadPrompt && pendingUploadFile && uploadFileRef) {
			const dt = new DataTransfer();
			dt.items.add(pendingUploadFile);
			uploadFileRef.files = dt.files;
		}
	});

	const watering = $derived(formatWateringDue(data.schedule?.nextWaterAt ?? null));
	const canMarkWatered = $derived(watering.status === 'overdue' || watering.status === 'due_today' || watering.status === 'due_now');

	$effect(() => {
		if (form?.success) {
			toast.success('Saved!');
		}
		if (form?.message) {
			toast.error(form.message);
		}
	});

	function triggerPhotoUpload() {
		log('Trigger progress photo upload from detail');
		photoInput?.click();
	}

	function onPhotoSelected(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			log(`Progress photo selected: ${file.name}`);
			pendingUploadFile = file;
			pendingUploadCaption = '';
			showUploadPrompt = true;

			// Attach file to the upload form's input using DataTransfer
			if (uploadFileRef) {
				const dt = new DataTransfer();
				dt.items.add(file);
				uploadFileRef.files = dt.files;
			}
		}
		input.value = ''; // allow re-select same file
	}

	async function submitProgressPhoto() {
		if (!pendingUploadFile) return;

		const formData = new FormData();
		formData.append('photo', pendingUploadFile);
		if (pendingUploadCaption) {
			formData.append('caption', pendingUploadCaption);
		}

		try {
			const response = await fetch('', {
				method: 'POST',
				body: formData,
				headers: {
					'X-SvelteKit-Action': '?/uploadPhoto'
				}
			});

			if (response.ok) {
				log('Progress photo upload success');
				toast.success('Progress photo added!');
				// Reset
				pendingUploadFile = null;
				pendingUploadCaption = '';
				showUploadPrompt = false;
				// Refresh the page data (simple way: reload or let SvelteKit handle)
				window.location.reload(); // simple for now, or enhance could update
			} else {
				log('Progress photo upload failed', { status: response.status });
				toast.error('Failed to upload photo');
			}
		} catch (err) {
			log('Progress photo upload error', err);
			toast.error('Error uploading photo');
		}
	}

	function cancelUpload() {
		log('Cancel progress photo upload');
		pendingUploadFile = null;
		pendingUploadCaption = '';
		showUploadPrompt = false;
	}
</script>

<div class="space-y-4">
	<Button href="/" variant="ghost" size="sm" class="-ml-2">
		<ArrowLeftIcon class="size-4" />
		Back
	</Button>

	<div class="flex items-start gap-3 max-w-sm mx-auto">
		<div class="flex-1 overflow-hidden rounded-2xl bg-muted">
			{#if data.plant.hasCoverImage}
				<img
					src="/api/images/plant/{data.plant.id}"
					alt={data.plant.nickname}
					class="aspect-[4/3] w-full object-cover"
				/>
			{:else}
				<div class="flex aspect-[4/3] items-center justify-center text-primary/40">
					<SproutIcon class="size-10" />
				</div>
			{/if}
		</div>

		<!-- Upload button next to the image -->
		<Button 
			variant="outline" 
			size="icon" 
			class="mt-1 shrink-0"
			onclick={triggerPhotoUpload}
			aria-label="Add progress photo"
		>
			<PlusIcon class="size-4" />
		</Button>
	</div>

	<!-- Hidden file input for progress photo upload -->
	<input
		bind:this={photoInput}
		type="file"
		accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
		capture="environment"
		onchange={onPhotoSelected}
		style="display: none"
	/>

	<!-- Upload prompt next to image -->
	{#if showUploadPrompt && pendingUploadFile}
		<form 
			method="POST" 
			action="?/uploadPhoto" 
			enctype="multipart/form-data" 
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					// Clear after submit (page will update via load)
					pendingUploadFile = null;
					pendingUploadCaption = '';
					showUploadPrompt = false;
				};
			}}
			class="max-w-sm mx-auto rounded-lg border bg-muted/40 p-3 space-y-2 text-sm"
		>
			<input 
				bind:this={uploadFileRef} 
				type="file" 
				name="photo" 
				style="display: none" 
			/>
			<input type="hidden" name="caption" bind:value={pendingUploadCaption} />

			<div class="font-medium text-sm">Add progress photo</div>
			<div class="text-[10px] text-muted-foreground truncate">Selected: {pendingUploadFile.name}</div>

			<Textarea 
				bind:value={pendingUploadCaption} 
				placeholder="Caption (optional)" 
				rows={1} 
				class="text-sm h-8 min-h-8 py-1 resize-none overflow-hidden"
			/>

			<div class="flex gap-2">
				<Button type="submit" size="sm" class="px-3">Upload</Button>
				<Button type="button" variant="ghost" size="sm" class="px-3" onclick={cancelUpload}>Cancel</Button>
			</div>
		</form>
	{/if}

	<div class="max-w-lg mx-auto space-y-4">
		<div>
			<h1 class="text-2xl font-semibold">{data.plant.nickname}</h1>
			<p class="text-sm text-muted-foreground">{data.species.name}</p>
			{#if data.species.scientificName}
				<p class="text-xs italic text-muted-foreground">{data.species.scientificName}</p>
			{/if}
			{#if data.plant.location}
				<p class="mt-1 text-xs text-muted-foreground">{data.plant.location}</p>
			{/if}
			<div class="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
				<span>Light: {data.species.lightRequirement.replaceAll('_', ' ')}</span>
				<span>·</span>
				<span>Humidity: {data.species.humidityPreference}</span>
			</div>
		</div>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="flex items-center gap-2 text-base">
				<DropletsIcon class="size-4 text-primary" />
				Watering
			</CardTitle>
			<CardDescription>{watering.label}</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex flex-wrap gap-2 text-sm text-muted-foreground">
				{#if data.schedule?.lastWateredAt}
					<span>Last watered {formatRelativeDate(data.schedule.lastWateredAt)}</span>
				{/if}
			{#if watering.status === 'overdue'}
								<Badge variant="destructive">Overdue</Badge>
							{:else if watering.status === 'due_now'}
								<Badge variant="default">Due now</Badge>
							{:else if watering.status === 'due_today'}
								<Badge>Due today</Badge>
							{/if}
			</div>

			<form method="POST" action="?/markWatered" use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}>
				<Button
					type="submit"
					class="w-full md:w-auto"
					disabled={!canMarkWatered}
					title={!canMarkWatered ? 'Not due for watering yet' : null}
				>
					<DropletsIcon class="size-4" />
					Mark as watered
				</Button>
			</form>

			<Separator />

			<form method="POST" action="?/updateSchedule" use:enhance class="space-y-3">
				<div class="flex items-center gap-2">
					<Checkbox id="useRecommended" bind:checked={useRecommended} />
					<input type="hidden" name="useRecommendedSchedule" value={useRecommended ? 'true' : 'false'} />
					<Label for="useRecommended" class="font-normal">Use recommended schedule ({data.species.recommendedWateringIntervalDays} days)</Label>
				</div>
				{#if !useRecommended}
					<div class="space-y-2">
						<Label for="customIntervalDays">Custom interval (days)</Label>
						<Input id="customIntervalDays" name="customIntervalDays" type="number" min="1" bind:value={customIntervalDays} />
					</div>
				{/if}
				<div class="flex items-center gap-2">
					<Checkbox id="reminderEnabled" bind:checked={reminderEnabled} />
					<input type="hidden" name="reminderEnabled" value={reminderEnabled ? 'true' : 'false'} />
					<Label for="reminderEnabled" class="font-normal">Watering reminders</Label>
				</div>
				<Button type="submit" variant="outline" class="w-full md:w-auto">Save schedule</Button>
			</form>
		</CardContent>
	</Card>

	{#if data.plant.notes}
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-base">Notes</CardTitle>
			</CardHeader>
			<CardContent class="text-sm text-muted-foreground whitespace-pre-wrap">{data.plant.notes}</CardContent>
		</Card>
	{/if}

	{#if data.progressPhotos.length > 0}
		<div class="max-w-sm mx-auto">
			<p class="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Progress photos</p>
			<div class="flex gap-3 overflow-x-auto pb-2 species-scroll">
				{#each data.progressPhotos as photo (photo.id)}
					<div class="shrink-0 w-28 overflow-hidden rounded-lg border bg-card text-[9px]">
						<img
							src="/api/images/progress/{photo.id}"
							alt={photo.caption ?? 'Progress photo'}
							class="aspect-square w-full object-cover"
						/>
						<div class="p-1.5">
							<p class="font-medium truncate">{formatRelativeDate(photo.takenAt)}</p>
							{#if photo.caption}
								<p class="truncate text-muted-foreground">{photo.caption}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	</div>
</div>