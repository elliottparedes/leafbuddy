<script lang="ts">
	import type { ActionData } from './$types';
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

	let { data, form }: { data: { initialName?: string }; form: ActionData } = $props();

	let name = $state(data.initialName || '');
	let lightRequirement = $state('bright_indirect');
</script>

<div class="space-y-4">
	<Button href="/catalog" variant="ghost" size="sm" class="-ml-2">
		<ArrowLeftIcon class="size-4" />
		Back
	</Button>

	<Card>
		<CardHeader>
			<CardTitle>Contribute a species</CardTitle>
			<CardDescription>Share a plant with the community. Submissions are reviewed before publishing.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if form?.message}
				<p class="mb-4 text-sm text-destructive">{form.message}</p>
			{/if}

			<form method="POST" enctype="multipart/form-data" class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Common name</Label>
					<Input id="name" name="name" bind:value={name} required />
				</div>
				<div class="space-y-2">
					<Label for="scientificName">Scientific name</Label>
					<Input id="scientificName" name="scientificName" />
				</div>
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea id="description" name="description" rows={3} />
				</div>
				<div class="space-y-2">
					<Label for="careTips">Care tips</Label>
					<Textarea id="careTips" name="careTips" rows={3} />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-2">
						<Label for="recommendedWateringIntervalDays">Water every (days)</Label>
						<Input id="recommendedWateringIntervalDays" name="recommendedWateringIntervalDays" type="number" min="1" value="7" />
					</div>
					<div class="space-y-2">
						<Label for="recommendedFertilizingIntervalDays">Fertilize every (days)</Label>
						<Input id="recommendedFertilizingIntervalDays" name="recommendedFertilizingIntervalDays" type="number" min="1" value="30" />
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
					<Label for="image">Reference photo (max 5MB)</Label>
					<Input id="image" name="image" type="file" accept="image/*" required />
				</div>
				<Button type="submit" class="w-full">Submit for review</Button>
			</form>
		</CardContent>
	</Card>
</div>