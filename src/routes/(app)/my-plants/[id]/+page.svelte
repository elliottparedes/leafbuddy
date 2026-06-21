<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { formatRelativeDate, formatWateringDue } from '$lib/format';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import DropletsIcon from '@lucide/svelte/icons/droplets';
	import SproutIcon from '@lucide/svelte/icons/sprout';
	import { toast } from 'svelte-sonner';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let useRecommended = $state(data.schedule?.useRecommendedSchedule ?? true);
	let reminderEnabled = $state(data.schedule?.reminderEnabled ?? true);
	let customIntervalDays = $state(String(data.schedule?.customIntervalDays ?? data.species.recommendedWateringIntervalDays));

	const watering = $derived(formatWateringDue(data.schedule?.nextWaterAt ?? null));

	$effect(() => {
		if (form?.success) {
			toast.success('Saved!');
		}
		if (form?.message) {
			toast.error(form.message);
		}
	});
</script>

<div class="space-y-4">
	<Button href="/" variant="ghost" size="sm" class="-ml-2">
		<ArrowLeftIcon class="size-4" />
		Back
	</Button>

	<div class="overflow-hidden rounded-2xl bg-muted">
		{#if data.plant.hasCoverImage}
			<img
				src="/api/images/plant/{data.plant.id}"
				alt={data.plant.nickname}
				class="aspect-[4/3] w-full object-cover"
			/>
		{:else}
			<div class="flex aspect-[4/3] items-center justify-center text-primary/40">
				<SproutIcon class="size-16" />
			</div>
		{/if}
	</div>

	<div>
		<h1 class="text-2xl font-semibold">{data.plant.nickname}</h1>
		<p class="text-sm text-muted-foreground">{data.species.name}</p>
		{#if data.plant.location}
			<p class="mt-1 text-xs text-muted-foreground">{data.plant.location}</p>
		{/if}
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
				{:else if watering.status === 'due_today'}
					<Badge>Due today</Badge>
				{/if}
			</div>

			<form method="POST" action="?/markWatered" use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}>
				<Button type="submit" class="w-full">
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
				<Button type="submit" variant="outline" class="w-full">Save schedule</Button>
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

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2 text-base">
				<CameraIcon class="size-4" />
				Progress photos
			</CardTitle>
			<CardDescription>Track growth over time</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<form method="POST" action="?/uploadPhoto" enctype="multipart/form-data" use:enhance class="space-y-3">
				<div class="space-y-2">
					<Label for="photo">Upload photo (max 5MB)</Label>
					<Input id="photo" name="photo" type="file" accept="image/*" required />
				</div>
				<div class="space-y-2">
					<Label for="caption">Caption (optional)</Label>
					<Textarea id="caption" name="caption" rows={2} />
				</div>
				<Button type="submit" variant="outline" class="w-full">Add progress photo</Button>
			</form>

			{#if data.progressPhotos.length > 0}
				<div class="space-y-3">
					{#each data.progressPhotos as photo (photo.id)}
						<div class="overflow-hidden rounded-xl border">
							<img
								src="/api/images/progress/{photo.id}"
								alt={photo.caption ?? 'Progress photo'}
								class="aspect-video w-full object-cover"
							/>
							<div class="p-3 text-sm">
								<p class="font-medium">{formatRelativeDate(photo.takenAt)}</p>
								{#if photo.caption}
									<p class="text-muted-foreground">{photo.caption}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>