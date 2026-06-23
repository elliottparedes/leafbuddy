<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SproutIcon from '@lucide/svelte/icons/sprout';

	let { data }: { data: PageData } = $props();
	let query = $state(data.search);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Catalog</h1>
			<p class="text-sm text-muted-foreground md:text-base">Browse community plant species</p>
		</div>
		<Button href="/catalog/new" size="sm" variant="outline">
			<PlusIcon class="size-4" />
			Contribute
		</Button>
	</div>

	<form method="GET" class="relative">
		<SearchIcon class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			name="q"
			placeholder="Search plants..."
			class="pl-9"
			bind:value={query}
		/>
	</form>

	{#if data.species.length === 0}
		<p class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
			No species found. Try another search or contribute a new one.
		</p>
	{:else}
		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each data.species as species (species.id)}
				<a href="/catalog/{species.id}">
					<Card class="transition-colors hover:border-primary/40">
						<div class="flex gap-3 p-3">
							<div class="size-16 shrink-0 overflow-hidden rounded-lg bg-muted md:size-20">
								{#if species.imageId}
									<img
										src="/api/images/species/{species.imageId}"
										alt={species.name}
										class="size-full object-cover"
										loading="lazy"
										decoding="async"
									/>
								{:else}
									<div class="flex size-full items-center justify-center text-primary/50">
										<SproutIcon class="size-6" />
									</div>
								{/if}
							</div>
							<div class="min-w-0">
								<CardHeader class="p-0">
									<CardTitle class="truncate text-base">{species.name}</CardTitle>
									{#if species.scientificName}
										<CardDescription class="truncate italic">{species.scientificName}</CardDescription>
									{/if}
								</CardHeader>
								<CardContent class="mt-1 p-0 text-xs text-muted-foreground">
									Water every {species.recommendedWateringIntervalDays} days · {species.lightRequirement.replaceAll('_', ' ')}
								</CardContent>
							</div>
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>