<script lang="ts">
	import type { PageData } from './$types';
	import { formatWateringDue } from '$lib/format';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import {
		Empty,
		EmptyContent,
		EmptyDescription,
		EmptyHeader,
		EmptyMedia,
		EmptyTitle
	} from '$lib/components/ui/empty/index.js';
	import DropletsIcon from '@lucide/svelte/icons/droplets';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SproutIcon from '@lucide/svelte/icons/sprout';

	let { data }: { data: PageData } = $props();
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
				<a href="/my-plants/{plant.id}" class="block">
					<Card class="overflow-hidden transition-colors hover:border-primary/40">
						<div class="flex gap-3 p-3">
							<div
								class="size-20 shrink-0 overflow-hidden rounded-xl bg-muted md:size-24"
							>
								{#if plant.hasCoverImage}
									<img
										src="/api/images/plant/{plant.id}"
										alt={plant.nickname}
										class="size-full object-cover"
									/>
								{:else}
									<div class="flex size-full items-center justify-center text-primary/50">
										<SproutIcon class="size-8" />
									</div>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<CardHeader class="p-0">
									<CardTitle class="truncate text-base">{plant.nickname}</CardTitle>
									<CardDescription class="truncate">{plant.speciesName}</CardDescription>
								</CardHeader>
								<CardContent class="mt-2 flex items-center gap-2 p-0">
									<DropletsIcon class="size-4 text-primary" />
									<span class="text-sm">{watering.label}</span>
									{#if watering.status === 'overdue'}
										<Badge variant="destructive">Overdue</Badge>
									{:else if watering.status === 'due_today'}
										<Badge>Today</Badge>
									{/if}
								</CardContent>
							</div>
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>