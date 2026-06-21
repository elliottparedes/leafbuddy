<script lang="ts">
	import type { ActionData } from './$types';
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

	let { form }: { form: ActionData } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
</script>

<div class="flex min-h-svh items-center justify-center bg-background p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Create account</CardTitle>
			<CardDescription>Start tracking your plants with LeafBuddy</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if form?.message}
				<p class="text-sm text-destructive">{form.message}</p>
			{/if}
			<form method="POST" class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Name</Label>
					<Input
						id="name"
						type="text"
						name="name"
						bind:value={name}
						required
						autocomplete="name"
					/>
				</div>
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
					<Label for="password">Password (min 8 characters)</Label>
					<Input
						id="password"
						type="password"
						name="password"
						bind:value={password}
						required
						minlength={8}
						autocomplete="new-password"
					/>
				</div>
				<Button type="submit" class="w-full">Register</Button>
			</form>
			<p class="text-center text-sm text-muted-foreground">
				Already have an account?
				<a href="/login" class="text-primary underline-offset-4 hover:underline">Sign in</a>
			</p>
		</CardContent>
	</Card>
</div>