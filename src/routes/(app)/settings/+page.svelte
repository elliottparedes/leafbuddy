<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { isPushSupported, syncPushSubscription } from '$lib/push/client';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { toast } from 'svelte-sonner';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let wateringDueEnabled = $state(data.preferences.wateringDueEnabled);
	let wateringReminderEnabled = $state(data.preferences.wateringReminderEnabled);
	let communityUpdateEnabled = $state(data.preferences.communityUpdateEnabled);
	let systemEnabled = $state(data.preferences.systemEnabled);
	let pushEnabled = $state(data.preferences.pushEnabled);
	let pushLoading = $state(false);

	async function enablePush() {
		if (!isPushSupported()) {
			toast.error('Push notifications are not supported in this browser.');
			return;
		}
		pushLoading = true;
		try {
			await syncPushSubscription('subscribe');
			pushEnabled = true;
			toast.success('Push notifications enabled');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to enable push');
		} finally {
			pushLoading = false;
		}
	}

	async function disablePush() {
		pushLoading = true;
		try {
			await syncPushSubscription('unsubscribe');
			pushEnabled = false;
			toast.success('Push notifications disabled');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to disable push');
		} finally {
			pushLoading = false;
		}
	}

	async function sendTestPush() {
		if (!pushEnabled) {
			toast.error('Enable push notifications first (and click Save if needed).');
			return;
		}
		pushLoading = true;
		try {
			const res = await fetch('/api/test/push', { method: 'POST' });
			if (!res.ok) {
				throw new Error(await res.text());
			}
			const data = await res.json();
			if (data.sent > 0) {
				toast.success(`Test push sent! (${data.sent} subscription${data.sent === 1 ? '' : 's'})`);
			} else {
				toast.success('Test notification created. No active push subscriptions found.');
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to send test push');
		} finally {
			pushLoading = false;
		}
	}

	$effect(() => {
		if (form?.success) toast.success('Preferences saved');
		if (form?.message) toast.error(form.message);
	});
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
		<p class="text-sm text-muted-foreground md:text-base">Notification preferences and account</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2 text-base">
				<BellIcon class="size-4" />
				Notifications
			</CardTitle>
			<CardDescription>Choose what you'd like to hear about</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updatePreferences" use:enhance class="space-y-4">
				<div class="flex items-center gap-2">
					<Checkbox id="wateringDue" bind:checked={wateringDueEnabled} />
					<input type="hidden" name="wateringDueEnabled" value={wateringDueEnabled ? 'true' : 'false'} />
					<Label for="wateringDue" class="font-normal">Watering due alerts</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox id="wateringReminder" bind:checked={wateringReminderEnabled} />
					<input type="hidden" name="wateringReminderEnabled" value={wateringReminderEnabled ? 'true' : 'false'} />
					<Label for="wateringReminder" class="font-normal">Watering reminders</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox id="communityUpdate" bind:checked={communityUpdateEnabled} />
					<input type="hidden" name="communityUpdateEnabled" value={communityUpdateEnabled ? 'true' : 'false'} />
					<Label for="communityUpdate" class="font-normal">Community updates</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox id="system" bind:checked={systemEnabled} />
					<input type="hidden" name="systemEnabled" value={systemEnabled ? 'true' : 'false'} />
					<Label for="system" class="font-normal">System messages</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox id="pushEnabled" bind:checked={pushEnabled} />
					<input type="hidden" name="pushEnabled" value={pushEnabled ? 'true' : 'false'} />
					<Label for="pushEnabled" class="font-normal">Allow push notifications</Label>
				</div>
				<Button type="submit" class="w-full">Save preferences</Button>
			</form>

			<Separator class="my-4" />

			<div class="space-y-2">
				<p class="text-sm font-medium">Browser push</p>
				<p class="text-xs text-muted-foreground">
					Enable browser push to get watering reminders even when LeafBuddy isn't open.
				</p>
				<div class="flex gap-2">
					<Button onclick={enablePush} disabled={pushLoading || !isPushSupported()} class="flex-1">
						Enable push
					</Button>
					<Button onclick={disablePush} disabled={pushLoading} variant="outline" class="flex-1">
						Disable push
					</Button>
				</div>

				<div class="pt-1">
					<Button
						onclick={sendTestPush}
						variant="outline"
						size="sm"
						disabled={pushLoading || !pushEnabled || !isPushSupported()}
						class="w-full"
					>
						Send test notification
					</Button>
					<p class="mt-1 text-[10px] text-muted-foreground">
						Sends a test push + records an in-app notification.
					</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle class="text-base">Account</CardTitle>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/signOut" use:enhance>
				<Button type="submit" variant="destructive" class="w-full">
					<LogOutIcon class="size-4" />
					Sign out
				</Button>
			</form>
		</CardContent>
	</Card>
</div>