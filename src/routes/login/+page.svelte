<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let email = $state('');
	let password = $state('');
</script>

<div class="flex min-h-svh items-center justify-center bg-background p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Sign in</CardTitle>
			<CardDescription>Welcome back to LeafBuddy</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if data.registered}
				<p class="text-sm text-muted-foreground">Account created. Sign in to continue.</p>
			{/if}
			{#if form?.message}
				<p class="text-sm text-destructive">{form.message}</p>
			{/if}
			<form method="POST" class="space-y-4">
				<input type="hidden" name="providerId" value="credentials" />
				<input type="hidden" name="redirectTo" value="/" />
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						name="email"
						bind:value={email}
						required
						autocomplete="email"
					/>
				</div>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						name="password"
						bind:value={password}
						required
						autocomplete="current-password"
					/>
				</div>
				<Button type="submit" class="w-full">Sign in</Button>
			</form>
			<p class="text-center text-sm text-muted-foreground">
				No account?
				<a href="/register" class="text-primary underline-offset-4 hover:underline">Register</a>
			</p>
		</CardContent>
	</Card>
</div>