<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { formatRelativeDate } from '$lib/format';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Notifications</h1>
			<p class="text-sm text-muted-foreground md:text-base">Watering reminders and updates</p>
		</div>
		{#if data.notifications.some((n) => !n.readAt)}
			<form method="POST" action="?/markAllRead" use:enhance>
				<Button type="submit" variant="outline" size="sm">
					<CheckCheckIcon class="size-4" />
					Mark all read
				</Button>
			</form>
		{/if}
	</div>

	{#if data.notifications.length === 0}
		<div class="rounded-xl border border-dashed p-8 text-center">
			<BellIcon class="mx-auto mb-3 size-8 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No notifications yet. You're all caught up!</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each data.notifications as notification (notification.id)}
				<Card class={notification.readAt ? 'opacity-70' : 'border-primary/30'}>
					<CardHeader class="pb-2">
						<div class="flex items-start justify-between gap-2">
							<div>
								<CardTitle class="text-base">{notification.title}</CardTitle>
								<CardDescription>{formatRelativeDate(notification.createdAt)}</CardDescription>
							</div>
							{#if !notification.readAt}
								<Badge>New</Badge>
							{/if}
						</div>
					</CardHeader>
					<CardContent class="space-y-3 text-sm text-muted-foreground">
						<p>{notification.body}</p>
						<div class="flex gap-2">
							{#if notification.relatedUserPlantId}
								<Button href="/my-plants/{notification.relatedUserPlantId}" size="sm" variant="outline">
									View plant
								</Button>
							{/if}
							{#if !notification.readAt}
								<form method="POST" action="?/markRead" use:enhance>
									<input type="hidden" name="id" value={notification.id} />
									<Button type="submit" size="sm" variant="ghost">Mark read</Button>
								</form>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>