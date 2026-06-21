<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { suggestNickname } from '$lib/plant-names';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
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
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let plantSpeciesId = $state(data.preselectedId || data.species[0]?.id || '');
	let nickname = $state(data.suggestedNickname);
	let useRecommended = $state(true);
	let customIntervalDays = $state('7');

	const selectedSpecies = $derived(data.species.find((s) => s.id === plantSpeciesId));

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
					<Select type="single" bind:value={plantSpeciesId}>
						<SelectTrigger class="w-full">
							{selectedSpecies?.name ?? 'Select species'}
						</SelectTrigger>
						<SelectContent>
							{#each data.species as species (species.id)}
								<SelectItem value={species.id}>{species.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
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
					<Input id="coverImage" name="coverImage" type="file" accept="image/*" />
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