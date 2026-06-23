<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { suggestNickname } from '$lib/plant-names';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let plantSpeciesId = $state(data.preselectedId || '');
	let nickname = $state(data.suggestedNickname);
	let useRecommended = $state(true);
	let customIntervalDays = $state('7');
	let searchTerm = $state('');
	let dropdownOpen = $state(!data.preselectedId);
	let searchContainer = $state<HTMLDivElement | null>(null);
	let coverPreview = $state<string | null>(null);

	const selectedSpecies = $derived(data.species.find((s) => s.id === plantSpeciesId));

	const filteredSpecies = $derived.by(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return data.species;

		return data.species
			.filter((s) => {
				const nameMatch = s.name.toLowerCase().includes(q);
				const sciMatch = s.scientificName ? s.scientificName.toLowerCase().includes(q) : false;
				return nameMatch || sciMatch;
			})
			.sort((a, b) => {
				const qa = a.name.toLowerCase();
				const qb = b.name.toLowerCase();
				const aStarts = qa.startsWith(q) ? 0 : 1;
				const bStarts = qb.startsWith(q) ? 0 : 1;
				if (aStarts !== bStarts) return aStarts - bStarts;
				return qa.localeCompare(qb);
			});
	});

	// Close dropdown when clicking outside the search container
	$effect(() => {
		if (!dropdownOpen || typeof window === 'undefined') return;

		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainer && !searchContainer.contains(event.target as Node)) {
				dropdownOpen = false;
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});

	function regenerateNickname() {
		if (selectedSpecies) {
			nickname = suggestNickname(selectedSpecies.name);
		}
	}

	$effect(() => {
		if (selectedSpecies) {
			customIntervalDays = String(selectedSpecies.recommendedWateringIntervalDays);
		}
	});
</script>

<div class="space-y-4">
	<Button href="/" variant="ghost" size="sm" class="-ml-2">
		<ArrowLeftIcon class="size-4" />
		Back
	</Button>

	<Card>
		<CardHeader>
			<CardTitle>Add a plant</CardTitle>
			<CardDescription>Give your new green buddy a name and watering schedule.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if form?.message}
				<p class="mb-4 text-sm text-destructive">{form.message}</p>
			{/if}

			<form method="POST" enctype="multipart/form-data" class="space-y-4">
				<div class="space-y-2">
					<Label>Species</Label>
					<input type="hidden" name="plantSpeciesId" value={plantSpeciesId} />

					{#if selectedSpecies}
						<!-- Just the selected one -->
						<div class="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
							<div class="min-w-0 truncate">
								<span class="font-medium">{selectedSpecies.name}</span>
								{#if selectedSpecies.scientificName}
									<span class="ml-1 text-xs italic text-muted-foreground">{selectedSpecies.scientificName}</span>
								{/if}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-6 px-2 text-[10px]"
								onclick={() => {
									plantSpeciesId = '';
									searchTerm = '';
									dropdownOpen = true;
								}}
							>
								Change
							</Button>
						</div>
					{:else}
						<!-- Search + dropdown -->
						<div class="relative" bind:this={searchContainer}>
							<Input
								placeholder="Type to search species..."
								bind:value={searchTerm}
								onfocus={() => (dropdownOpen = true)}
								class="w-full"
							/>

							{#if dropdownOpen}
								<div class="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-background shadow-md species-scroll">
									{#each filteredSpecies.slice(0, searchTerm ? 8 : 15) as species (species.id)}
										<button
											type="button"
											class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted {plantSpeciesId === species.id
												? 'bg-primary/10 font-medium'
												: ''}"
											onclick={() => {
												plantSpeciesId = species.id;
												searchTerm = '';
												dropdownOpen = false;
											}}
										>
											<div class="min-w-0 truncate">
												<span>{species.name}</span>
												{#if species.scientificName}
													<span class="ml-1 text-xs italic text-muted-foreground">{species.scientificName}</span>
												{/if}
											</div>
										</button>
									{/each}

									{#if filteredSpecies.length === 0 && searchTerm.length > 1}
										<div class="px-3 py-3 text-sm">
											<div class="text-muted-foreground mb-2">No close matches.</div>
											<Button
												href={`/catalog/new?name=${encodeURIComponent(searchTerm)}`}
												variant="outline"
												size="sm"
											>
												Add new species to catalog
											</Button>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="nickname">Nickname</Label>
					<div class="flex gap-2">
						<Input id="nickname" name="nickname" bind:value={nickname} required />
						<Button type="button" variant="outline" size="icon" onclick={regenerateNickname} aria-label="Suggest nickname">
							<SparklesIcon class="size-4" />
						</Button>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="location">Location (optional)</Label>
					<Input id="location" name="location" placeholder="Living room window" />
				</div>

				<div class="space-y-2">
					<Label for="notes">Notes (optional)</Label>
					<Textarea id="notes" name="notes" rows={2} />
				</div>

				<div class="space-y-2">
					<Label for="coverImage">Cover photo (max 5MB)</Label>
					<Input 
						id="coverImage" 
						name="coverImage" 
						type="file" 
						accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif" 
						capture="environment"
						onchange={(e) => {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (file) {
							const url = URL.createObjectURL(file);
							coverPreview = url;
						} else {
							coverPreview = null;
						}
					}} />
					{#if coverPreview}
						<div class="mt-2 w-24 overflow-hidden rounded-lg border">
							<img src={coverPreview} alt="Cover preview" class="aspect-square w-full object-cover" />
						</div>
					{/if}
				</div>

				<div class="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
					<div class="flex items-center gap-2">
						<Checkbox id="useRecommended" bind:checked={useRecommended} />
						<input type="hidden" name="useRecommendedSchedule" value={useRecommended ? 'true' : 'false'} />
						<Label for="useRecommended" class="font-normal">
							Use recommended watering schedule
							{#if selectedSpecies}
								<span class="text-muted-foreground">({selectedSpecies.recommendedWateringIntervalDays} days)</span>
							{/if}
						</Label>
					</div>
					{#if !useRecommended}
						<div class="space-y-2">
							<Label for="customIntervalDays">Custom interval (days)</Label>
							<Input
								id="customIntervalDays"
								name="customIntervalDays"
								type="number"
								min="1"
								bind:value={customIntervalDays}
							/>
						</div>
					{/if}
				</div>

				<Button type="submit" class="w-full">Add plant</Button>
			</form>
		</CardContent>
	</Card>
</div>