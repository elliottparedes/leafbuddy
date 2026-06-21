<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SproutIcon from '@lucide/svelte/icons/sprout';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-4">
	<Button href="/catalog" variant="ghost" size="sm" class="-ml-2">
		<ArrowLeftIcon class="size-4" />
		Back to catalog
	</Button>

	<div class="overflow-hidden rounded-2xl bg-muted">
		{#if data.images[0]}
			<img
				src="/api/images/species/{data.images[0].id}"
				alt={data.species.name}
				class="aspect-[4/3] w-full object-cover"
			/>
		{:else}
			<div class="flex aspect-[4/3] items-center justify-center text-primary/40">
				<SproutIcon class="size-16" />
			</div>
		{/if}
	</div>

	<div>
		<h1 class="text-2xl font-semibold">{data.species.name}</h1>
		{#if data.species.scientificName}
			<p class="text-sm text-muted-foreground italic">{data.species.scientificName}</p>
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