<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import StarIcon from '@lucide/svelte/icons/star';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let name = $state('');
	let scientificName = $state('');
	let description = $state('');
	let careTips = $state('');
	let recommendedWateringIntervalDays = $state(0);
	let recommendedFertilizingIntervalDays = $state(0);
	let lightRequirement = $state('bright_indirect');
	let humidityPreference = $state('moderate');

	// Confirmation for image delete
	let confirmOpen = $state(false);
	let pendingDeleteImageId = $state<string | null>(null);
	let deleteForms = $state<Record<string, HTMLFormElement | null>>({});

	function requestDeleteImage(imageId: string) {
		pendingDeleteImageId = imageId;
		confirmOpen = true;
	}

	function confirmDeleteImage() {
		if (!pendingDeleteImageId) return;
		const form = deleteForms[pendingDeleteImageId];
		if (form) {
			form.requestSubmit();
		}
		pendingDeleteImageId = null;
	}

	$effect(() => {
		name = data.species.name;
		scientificName = data.species.scientificName ?? '';
		description = data.species.description ?? '';
		careTips = data.species.careTips ?? '';
		recommendedWateringIntervalDays = data.species.recommendedWateringIntervalDays;
		recommendedFertilizingIntervalDays = data.species.recommendedFertilizingIntervalDays;
		lightRequirement = data.species.lightRequirement;
		humidityPreference = data.species.humidityPreference ?? 'moderate';
	});
</script>

<div class="space-y-4">
	<Button href="/catalog/{data.species.id}" variant="ghost" size="sm" class="-ml-2">
		<ArrowLeftIcon class="size-4" />
		Back
	</Button>

	<Card>
		<CardHeader>
			<CardTitle>Edit species</CardTitle>
			<CardDescription>Update the details for this community species. You can manage images below.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if form?.message}
				<p class="mb-4 text-sm text-destructive">{form.message}</p>
			{/if}

			<!-- Current Images Gallery with edit controls -->
			{#if data.images && data.images.length > 0}
				<div class="mb-4">
					<Label class="mb-2 block">Current images</Label>
					<div class="flex flex-wrap gap-3">
						{#each data.images as image (image.id)}
							<div class="relative">
								<img 
									src="/api/images/species/{image.id}" 
									alt={`Reference photo for ${data.species.name}`} 
									class="h-20 w-20 object-cover rounded border {image.isPrimary ? 'ring-2 ring-primary' : ''}"
								/>
								<div class="absolute -top-1 -right-1 flex gap-1">
									{#if !image.isPrimary}
										<form method="POST" action="?/setPrimary">
											<input type="hidden" name="imageId" value={image.id} />
											<Button type="submit" variant="outline" size="icon" class="h-6 w-6 bg-background" title="Set as primary">
												<StarIcon class="size-3" />
											</Button>
										</form>
									{/if}
									<form method="POST" action="?/deleteImage" bind:this={deleteForms[image.id]}>
										<input type="hidden" name="imageId" value={image.id} />
										<Button
											type="button"
											variant="destructive"
											size="icon"
											class="h-6 w-6"
											title="Delete image"
											onclick={() => requestDeleteImage(image.id)}
										>
											<TrashIcon class="size-3" />
										</Button>
									</form>
								</div>
								{#if image.isPrimary}
									<div class="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[10px] px-1 rounded">Primary</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<form method="POST" action="?/update" enctype="multipart/form-data" class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Common name</Label>
					<Input id="name" name="name" bind:value={name} required />
				</div>
				<div class="space-y-2">
					<Label for="scientificName">Scientific name</Label>
					<Input id="scientificName" name="scientificName" bind:value={scientificName} />
				</div>
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea id="description" name="description" bind:value={description} rows={3} />
				</div>
				<div class="space-y-2">
					<Label for="careTips">Care tips</Label>
					<Textarea id="careTips" name="careTips" bind:value={careTips} rows={3} />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-2">
						<Label for="recommendedWateringIntervalDays">Water every (days)</Label>
						<Input id="recommendedWateringIntervalDays" name="recommendedWateringIntervalDays" type="number" min="1" bind:value={recommendedWateringIntervalDays} />
					</div>
					<div class="space-y-2">
						<Label for="recommendedFertilizingIntervalDays">Fertilize every (days)</Label>
						<Input id="recommendedFertilizingIntervalDays" name="recommendedFertilizingIntervalDays" type="number" min="1" bind:value={recommendedFertilizingIntervalDays} />
					</div>
				</div>
				<div class="space-y-2">
					<Label>Light requirement</Label>
					<input type="hidden" name="lightRequirement" value={lightRequirement} />
					<Select type="single" bind:value={lightRequirement}>
						<SelectTrigger class="w-full">{lightRequirement.replaceAll('_', ' ')}</SelectTrigger>
						<SelectContent>
							<SelectItem value="low">Low</SelectItem>
							<SelectItem value="medium">Medium</SelectItem>
							<SelectItem value="bright_indirect">Bright indirect</SelectItem>
							<SelectItem value="direct">Direct</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="humidityPreference">Humidity preference</Label>
					<input type="hidden" name="humidityPreference" value={humidityPreference} />
					<Select type="single" bind:value={humidityPreference}>
						<SelectTrigger class="w-full">{humidityPreference}</SelectTrigger>
						<SelectContent>
							<SelectItem value="low">Low</SelectItem>
							<SelectItem value="moderate">Moderate</SelectItem>
							<SelectItem value="high">High</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Label for="image">Add new reference photo (optional, max 5MB)</Label>
					<Input id="image" name="image" type="file" accept="image/*" />
					<p class="text-xs text-muted-foreground">New photo will be added (you can set it as primary after).</p>
				</div>
				<Button type="submit" class="w-full">Save changes</Button>
			</form>
		</CardContent>
	</Card>

	<!-- Confirmation modal for deleting images -->
	<ConfirmDialog
		bind:open={confirmOpen}
		title="Delete this image?"
		description="The reference image will be removed. You cannot delete the last image for a species."
		confirmText="Delete image"
		onConfirm={confirmDeleteImage}
	/>
</div>
