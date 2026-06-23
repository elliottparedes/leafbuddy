<script lang="ts">
	import { enhance, deserialize } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import { formatWateringDue, formatRelativeDate } from '$lib/format';
	import { log } from '$lib/log';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import {
		Empty,
		EmptyContent,
		EmptyDescription,
		EmptyHeader,
		EmptyMedia,
		EmptyTitle
	} from '$lib/components/ui/empty/index.js';
	import DropletsIcon from '@lucide/svelte/icons/droplets';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SproutIcon from '@lucide/svelte/icons/sprout';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { data }: { data: PageData } = $props();

	let carouselIndices = $state<Record<string, number>>({});

	let uploadPrompts = $state<Record<string, {
		file: File | null;
		caption: string;
		show: boolean;
	}>>({});

	let photoInputs = $state<Record<string, HTMLInputElement | null>>({});

	// Edit dialog state (shared)
	let editOpen = $state(false);
	let editId = $state('');
	let editNickname = $state('');
	let editLocation = $state('');
	let editNotes = $state('');

	// Schedule fields for the edit dialog (moved from inline card editor)
	let editRecommendedDays = $state(7);
	let editUseRecommended = $state(true);
	let editCustomIntervalDays = $state('');
	let editReminderEnabled = $state(true);

	// Confirmation dialog for destructive actions (photos)
	let confirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmDescription = $state('');
	let pendingPhotoRemoval: { plantId: string; curr: any } | null = $state(null);

	// Delete plant confirmation
	let deleteConfirmOpen = $state(false);
	let pendingDeleteId = $state('');
	let pendingDeleteName = $state('');

	$effect(() => {
		for (const p of data.plants) {
			if (!carouselIndices[p.id]) {
				carouselIndices[p.id] = 0;
			}
			if (!uploadPrompts[p.id]) {
				uploadPrompts[p.id] = { file: null, caption: '', show: false };
			}
		}
	});


	function triggerUpload(plantId: string) {
		log(`Trigger add photo for plant ${plantId}`);
		photoInputs[plantId]?.click();
	}

	function onPhotoSelected(e: Event, plantId: string) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			log(`Photo selected for plant ${plantId}: ${file.name} (${file.size} bytes)`);
			uploadPrompts[plantId] = { file, caption: '', show: true };
		}
		input.value = '';
	}

	function cancelUpload(plantId: string) {
		log(`Cancel add photo for plant ${plantId}`);
		uploadPrompts[plantId] = { file: null, caption: '', show: false };
	}

	function submitUpload(plantId: string) {
		const prompt = uploadPrompts[plantId];
		if (!prompt?.file) return;

		log(`Manually submitting upload for plant ${plantId}`);

		const fd = new FormData();
		fd.append('id', plantId);
		fd.append('photo', prompt.file);
		if (prompt.caption) fd.append('caption', prompt.caption);

		// Fetch to the action URL so SvelteKit invokes the named action
		fetch(window.location.href + '?/uploadPhoto', {
			method: 'POST',
			body: fd,
			headers: {
				'x-sveltekit-action': 'true'
			}
		}).then(async res => {
			const text = await res.text();
			let result: ActionResult;
			try {
				result = deserialize(text);
			} catch (err) {
				toast.error('Upload failed with an unknown error.');
				uploadPrompts[plantId] = { file: null, caption: '', show: false };
				return;
			}
			
			if (result.type === 'success' || result.type === 'redirect') {
				log('Upload response ok, reloading to see new photo in carousel');
				uploadPrompts[plantId] = { file: null, caption: '', show: false };
				window.location.reload();
			} else if (result.type === 'failure') {
				log('Upload response not ok: ' + (result.data?.message || 'unknown failure'));
				toast.error(result.data?.message || 'Failed to upload photo');
				uploadPrompts[plantId] = { file: null, caption: '', show: false };
			} else {
				log('Upload response not ok: ' + result.type);
				toast.error('Failed to upload photo');
				uploadPrompts[plantId] = { file: null, caption: '', show: false };
			}
		}).catch(err => {
			log('Upload error', err);
			toast.error('Upload error occurred');
			uploadPrompts[plantId] = { file: null, caption: '', show: false };
		});
	}

	function startEdit(plant: any) {
		editId = plant.id;
		editNickname = plant.nickname;
		editLocation = plant.location || '';
		editNotes = plant.notes || '';
		editRecommendedDays = plant.recommendedWateringIntervalDays || 7;
		if (plant.schedule) {
			editUseRecommended = plant.schedule.useRecommendedSchedule ?? true;
			editCustomIntervalDays = plant.schedule.customIntervalDays ? String(plant.schedule.customIntervalDays) : '';
			editReminderEnabled = plant.schedule.reminderEnabled ?? true;
		} else {
			editUseRecommended = true;
			editCustomIntervalDays = '';
			editReminderEnabled = true;
		}
		editOpen = true;
	}

	function requestRemoveImage(plantId: string, curr: any) {
		if (!curr) return;
		pendingPhotoRemoval = { plantId, curr };
		confirmTitle = curr.type === 'cover' ? 'Remove cover photo?' : 'Remove this progress photo?';
		confirmDescription = curr.type === 'cover'
			? 'This will remove the cover image from the plant.'
			: 'This progress photo will be permanently deleted.';
		confirmOpen = true;
	}

	async function performPhotoRemoval() {
		const removal = pendingPhotoRemoval;
		if (!removal) return;

		const { plantId, curr } = removal;
		log(`Remove image for plant ${plantId}, type=${curr.type}`);

		const fd = new FormData();
		fd.append('id', plantId);
		if (curr.type === 'cover') {
			fd.append('removeCover', 'true');
		} else if (curr.id) {
			fd.append('photoId', curr.id);
		} else {
			pendingPhotoRemoval = null;
			return;
		}

		try {
			const res = await fetch(window.location.href + '?/removePhoto', {
				method: 'POST',
				body: fd
			});
			if (res.ok) {
				log('Remove photo ok, reloading');
				window.location.reload();
			} else {
				log('Remove photo failed: ' + res.status);
			}
		} catch (err) {
			log('Remove photo error', err);
		} finally {
			pendingPhotoRemoval = null;
		}
	}

	function goPrev(plantId: string, len: number, cidx: number) {
		if (len <= 1) return;
		carouselIndices[plantId] = (cidx - 1 + len) % len;
	}

	function goNext(plantId: string, len: number, cidx: number) {
		if (len <= 1) return;
		carouselIndices[plantId] = (cidx + 1) % len;
	}

	function requestDeletePlant(plantId: string, plantName: string) {
		pendingDeleteId = plantId;
		pendingDeleteName = plantName;
		deleteConfirmOpen = true;
	}

	async function performDeletePlant() {
		if (!pendingDeleteId) return;

		log(`Delete plant ${pendingDeleteId}`);

		const fd = new FormData();
		fd.append('id', pendingDeleteId);

		try {
			const res = await fetch(window.location.href + '?/deletePlant', {
				method: 'POST',
				body: fd
			});
			if (res.ok) {
				log('Delete plant ok, reloading');
				window.location.reload();
			} else {
				log('Delete plant failed: ' + res.status);
			}
		} catch (err) {
			log('Delete plant error', err);
		} finally {
			pendingDeleteId = '';
			pendingDeleteName = '';
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">My Plants</h1>
			<p class="text-sm text-muted-foreground md:text-base">Keep your green friends thriving</p>
		</div>
		<Button href="/my-plants/new" size="sm">
			<PlusIcon class="size-4" />
			Add
		</Button>
	</div>

	{#if data.plants.length === 0}
		<Empty class="border border-dashed border-primary/20 bg-primary/5">
			<EmptyHeader>
				<EmptyMedia class="bg-primary/10 text-primary">
					<SproutIcon class="size-6" />
				</EmptyMedia>
				<EmptyTitle>No plants yet</EmptyTitle>
				<EmptyDescription>
					Add your first plant buddy or browse the catalog to get started.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent class="flex gap-2">
				<Button href="/my-plants/new">Add a plant</Button>
				<Button href="/catalog" variant="outline">Browse catalog</Button>
			</EmptyContent>
		</Empty>
	{:else}
		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each data.plants as plant (plant.id)}
			{@const watering = formatWateringDue(plant.nextWaterAt)}
			{@const canMarkWatered = watering.status === 'overdue' || watering.status === 'due_today' || watering.status === 'due_now'}
				{@const imgs = [
					...(plant.hasCoverImage ? [{ type: 'cover', src: `/api/images/plant/${plant.id}` }] : []),
					...(plant.progressPhotos || []).map((pp) => ({
						type: 'progress',
						id: pp.id,
						src: `/api/images/progress/${pp.id}`,
						caption: pp.caption,
						takenAt: pp.takenAt
					}))
				]}
				{@const cidx = carouselIndices[plant.id] ?? 0}
				{@const curr = imgs[cidx]}
				<Card class="overflow-hidden flex flex-col h-full">
					<div class="p-3 flex flex-col flex-1 gap-3">
						<!-- Carousel for images -->
						<div class="relative aspect-video overflow-hidden rounded-xl bg-muted group">
							{#if curr}
								<div
									role="button"
									tabindex={imgs.length > 1 ? 0 : -1}
									class="size-full focus:outline-none focus:ring-2 focus:ring-primary rounded-xl overflow-hidden cursor-pointer"
									aria-label={`Cycle to next image for ${plant.nickname}`}
									onclick={() => {
										if (imgs.length > 1) {
											goNext(plant.id, imgs.length, cidx);
										}
									}}
									onkeydown={(e) => {
										if (imgs.length > 1 && (e.key === 'Enter' || e.key === ' ')) {
											e.preventDefault();
											goNext(plant.id, imgs.length, cidx);
										}
									}}
								>
									<img
										src={curr.src}
										alt={plant.nickname}
										class="size-full object-cover pointer-events-none"
										loading="lazy"
										decoding="async"
									/>
								</div>
								<!-- Prev / Next arrows (visible on hover, desktop friendly) -->
								{#if imgs.length > 1}
									<button
										type="button"
										class="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1 rounded-full opacity-70 group-hover:opacity-100 transition z-10"
										aria-label="Previous image"
										onclick={(e) => { e.stopPropagation(); goPrev(plant.id, imgs.length, cidx); }}
									>
										<ChevronLeftIcon class="size-4" />
									</button>
									<button
										type="button"
										class="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1 rounded-full opacity-70 group-hover:opacity-100 transition z-10"
										aria-label="Next image"
										onclick={(e) => { e.stopPropagation(); goNext(plant.id, imgs.length, cidx); }}
									>
										<ChevronRightIcon class="size-4" />
									</button>
								{/if}
								<!-- Remove current image (hover reveal) -->
								<button
									type="button"
									class="absolute top-1 right-1 bg-black/50 hover:bg-destructive/90 text-white p-1 rounded-full opacity-70 group-hover:opacity-100 transition z-10"
									aria-label="Remove current image"
									title="Remove image"
									onclick={(e) => { e.stopPropagation(); requestRemoveImage(plant.id, curr); }}
								>
									<Trash2Icon class="size-3.5" />
								</button>
								{#if imgs.length > 1}
									<div class="absolute bottom-1 right-1 flex gap-1 z-10">
										{#each imgs as _, i}
											<button
												type="button"
												aria-label={`Go to image ${i + 1} of ${imgs.length} for ${plant.nickname}`}
												class="h-1.5 rounded-full bg-white/70 transition-all {i === cidx ? 'w-3 bg-white' : 'w-1.5'}"
												onclick={(e) => { e.stopPropagation(); carouselIndices[plant.id] = i; }}
											></button>
										{/each}
									</div>
								{/if}
							{:else}
								<div class="flex size-full items-center justify-center text-primary/50">
									<SproutIcon class="size-8" />
								</div>
							{/if}
						</div>

						<!-- Add to carousel button -->
						<div class="flex justify-end -mt-1">
							<Button 
								size="sm" 
								variant="ghost" 
								onclick={() => triggerUpload(plant.id)}
								class="h-6 px-1 text-[10px]"
							>
								<PlusIcon class="size-3 mr-1" /> Add photo
							</Button>
						</div>

					<!-- Hidden picker input -->
					<input 
						bind:this={photoInputs[plant.id]} 
						type="file" 
						accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
						onchange={(e) => onPhotoSelected(e, plant.id)}
						style="display: none"
					/>

						<!-- Upload prompt -->
						{#if uploadPrompts[plant.id]?.show && uploadPrompts[plant.id].file}
							<div class="space-y-1 text-[10px] border rounded p-1.5 bg-muted/20">
								<div class="truncate font-medium">Selected: {uploadPrompts[plant.id].file?.name}</div>

								<Textarea 
									bind:value={uploadPrompts[plant.id].caption} 
									placeholder="Caption (optional)" 
									rows={1} 
									class="text-[10px] h-6 min-h-6 py-1 resize-none overflow-hidden"
								/>

								<div class="flex gap-1">
									<Button type="button" size="sm" class="px-2 text-[9px]" onclick={() => submitUpload(plant.id)}>Add</Button>
									<Button type="button" size="sm" variant="ghost" class="px-2 text-[9px]" onclick={() => { log(`Cancel upload for plant ${plant.id}`); cancelUpload(plant.id); }}>Cancel</Button>
								</div>
							</div>
						{/if}

						<div>
							<CardHeader class="p-0">
								<div class="flex items-center gap-1">
									<CardTitle class="truncate text-base">{plant.nickname}</CardTitle>
									<Button 
										type="button" 
										variant="ghost" 
										size="icon" 
										class="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
										onclick={() => startEdit(plant)}
										aria-label="Edit {plant.nickname}"
									>
										<PencilIcon class="size-3.5" />
									</Button>
								</div>
								<CardDescription class="truncate">{plant.speciesName}</CardDescription>
								{#if plant.speciesScientificName}
									<p class="text-xs italic text-muted-foreground truncate">{plant.speciesScientificName}</p>
								{/if}
							</CardHeader>
							{#if plant.location}
								<p class="text-xs text-muted-foreground mt-0.5">{plant.location}</p>
							{/if}
						</div>

						<div>
							<div class="flex items-center gap-2 text-sm">
								<DropletsIcon class="size-4 text-primary" />
							<span>{watering.label}</span>
							{#if watering.status === 'overdue'}
								<Badge variant="destructive">Overdue</Badge>
							{:else if watering.status === 'due_now'}
								<Badge variant="default">Due now</Badge>
							{:else if watering.status === 'due_today'}
								<Badge>Today</Badge>
							{/if}
							</div>
							{#if plant.lastWateredAt}
								<p class="text-xs text-muted-foreground">Last watered {formatRelativeDate(plant.lastWateredAt)}</p>
							{/if}
						</div>

						{#if plant.notes}
							<div class="text-xs">
								<div class="font-medium text-muted-foreground">Notes</div>
								<p class="whitespace-pre-wrap text-muted-foreground">{plant.notes}</p>
							</div>
						{/if}

						<div class="mt-auto pt-1">
							<!-- Mark as watered -->
							<form method="POST" action="?/markWatered" use:enhance>
								<input type="hidden" name="id" value={plant.id} />
								<Button
									type="submit"
									size="sm"
									class="w-full"
									disabled={!canMarkWatered}
									title={!canMarkWatered ? 'Not due for watering yet' : null}
								>
									<DropletsIcon class="size-4" />
									Mark as watered
								</Button>
							</form>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- Edit plant dialog -->
<Dialog.Root bind:open={editOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Edit plant</Dialog.Title>
			<Dialog.Description>Update details and watering schedule.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/updatePlant" use:enhance={() => {
			return async ({ update }) => {
				await update();
				editOpen = false;
			};
		}} class="space-y-4 py-2">
			<input type="hidden" name="id" value={editId} />
			<div class="space-y-2">
				<Label for="edit-nickname">Nickname</Label>
				<Input id="edit-nickname" name="nickname" bind:value={editNickname} required />
			</div>
			<div class="space-y-2">
				<Label for="edit-location">Location (optional)</Label>
				<Input id="edit-location" name="location" bind:value={editLocation} />
			</div>
			<div class="space-y-2">
				<Label for="edit-notes">Notes (optional)</Label>
				<Textarea id="edit-notes" name="notes" bind:value={editNotes} rows={3} />
			</div>

			<Separator class="my-2" />
			<div class="space-y-3">
				<div class="text-sm font-medium">Watering schedule</div>
				<div class="flex items-center gap-2">
					<Checkbox id="edit-useRecommended" bind:checked={editUseRecommended} />
					<input type="hidden" name="useRecommendedSchedule" value={editUseRecommended ? 'true' : 'false'} />
					<Label for="edit-useRecommended" class="font-normal">
						Use recommended ({editRecommendedDays} days)
					</Label>
				</div>
				{#if !editUseRecommended}
					<div class="space-y-1">
						<Label for="edit-custom" class="text-xs">Custom interval (days)</Label>
						<Input
							id="edit-custom"
							name="customIntervalDays"
							type="number"
							min="1"
							bind:value={editCustomIntervalDays}
							class="h-8 text-sm"
						/>
					</div>
				{/if}
				<div class="flex items-center gap-2">
					<Checkbox id="edit-reminder" bind:checked={editReminderEnabled} />
					<input type="hidden" name="reminderEnabled" value={editReminderEnabled ? 'true' : 'false'} />
					<Label for="edit-reminder" class="font-normal">Reminders</Label>
				</div>
			</div>

			<Dialog.Footer class="flex flex-row items-center justify-between mt-4">
				<Button 
					type="button" 
					variant="destructive" 
					onclick={() => {
						editOpen = false;
						requestDeletePlant(editId, editNickname);
					}}
				>
					<Trash2Icon class="size-4 mr-1" />
					Delete
				</Button>
				<div class="flex items-center gap-2">
					<Button type="button" variant="ghost" onclick={() => (editOpen = false)}>Cancel</Button>
					<Button type="submit">Save</Button>
				</div>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Shared confirmation modal for destructive actions -->
<ConfirmDialog
	bind:open={confirmOpen}
	title={confirmTitle}
	description={confirmDescription}
	confirmText="Remove"
	onConfirm={performPhotoRemoval}
/>

<!-- Delete plant confirmation modal -->
<ConfirmDialog
	bind:open={deleteConfirmOpen}
	title="Delete plant?"
	description={`"${pendingDeleteName}" and all its photos will be permanently deleted.`}
	confirmText="Delete"
	onConfirm={performDeletePlant}
/>