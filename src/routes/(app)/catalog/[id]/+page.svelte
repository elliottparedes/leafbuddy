<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SproutIcon from '@lucide/svelte/icons/sprout';

	let { data }: { data: PageData } = $props();

	let currentImageIndex = $state(0);
	const currentImage = $derived(data.images[currentImageIndex] || null);

	function selectImage(index: number) {
		currentImageIndex = index;
	}
</script>

<div class="space-y-4">
	<Button href="/catalog" variant="ghost" size="sm" class="-ml-2">
		<ArrowLeftIcon class="size-4" />
		Back to catalog
	</Button>

	<div class="max-w-sm mx-auto">
		<div class="overflow-hidden rounded-2xl bg-muted">
			{#if currentImage}
				<img
					src="/api/images/species/{currentImage.id}"
					alt={data.species.name}
					class="aspect-[4/3] w-full object-cover"
				/>
			{:else}
				<div class="flex aspect-[4/3] items-center justify-center text-primary/40">
					<SproutIcon class="size-10" />
				</div>
			{/if}
		</div>

		{#if data.images.length > 1}
			<div class="mt-2 flex gap-2 overflow-x-auto pb-1 species-scroll">
				{#each data.images as image, index (image.id)}
					<button
						type="button"
						class="shrink-0 overflow-hidden rounded-lg border-2 transition-all {currentImageIndex === index ? 'border-primary scale-105' : 'border-transparent hover:border-muted-foreground/50'}"
						onclick={() => selectImage(index)}
					>
						<img
							src="/api/images/species/{image.id}"
							alt={data.species.name}
							class="h-14 w-14 object-cover"
						/>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold">{data.species.name}</h1>
			{#if data.species.scientificName}
				<p class="text-sm text-muted-foreground italic">{data.species.scientificName}</p>
			{/if}
		</div>
		{#if data.canEdit}
			<Button href="/catalog/{data.species.id}/edit" variant="outline" size="sm" class="ml-auto">Edit species / images</Button>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2">
		<Badge variant="secondary">{data.species.lightRequirement.replaceAll('_', ' ')}</Badge>
		<Badge variant="secondary">{data.species.humidityPreference} humidity</Badge>
		<Badge variant="secondary">Water every {data.species.recommendedWateringIntervalDays}d</Badge>
	</div>

	{#if data.species.description}
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-base">About</CardTitle>
			</CardHeader>
			<CardContent class="text-sm text-muted-foreground">{data.species.description}</CardContent>
		</Card>
	{/if}

	{#if data.species.careTips}
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-base">Care tips</CardTitle>
			</CardHeader>
			<CardContent class="text-sm text-muted-foreground whitespace-pre-wrap">{data.species.careTips}</CardContent>
		</Card>
	{/if}

	<Button href="/my-plants/new?species={data.species.id}" class="w-full">
		<PlusIcon class="size-4" />
		Add to my plants
	</Button>
</div>