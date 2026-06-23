<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SproutIcon from '@lucide/svelte/icons/sprout';

	let { data, children } = $props();

	const navItems = [
		{ href: '/', label: 'My Plants', icon: SproutIcon },
		{ href: '/catalog', label: 'Catalog', icon: BookOpenIcon },
		{ href: '/notifications', label: 'Notifications', icon: BellIcon },
		{ href: '/settings', label: 'Settings', icon: SettingsIcon }
	];

	const mobileNavItems = navItems.filter((item) => item.href !== '/notifications');

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<!-- Mobile shell (standard phone app experience) -->
<div class="md:hidden mx-auto flex min-h-svh max-w-lg flex-col bg-background">
	<header class="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
		<div class="flex items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<div class="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
					<!-- Nice custom leaf logo SVG -->
					<svg
						class="size-5"
						viewBox="0 0 24 24"
						fill="currentColor"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 3c-4 2.5-6 6-6 10 0 4.5 2.5 7.5 6 8 3.5-.5 6-3.5 6-8 0-4-2-7.5-6-10z" />
						<path d="M12 5.5v13" fill="none" />
						<path d="M9.2 9.8c1.3 1.1 2.1 2.2 2.4 4.2" fill="none" />
						<path d="M14.8 9.8c-1.3 1.1-2.1 2.2-2.4 4.2" fill="none" />
					</svg>
				</div>
				<div>
					<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">LeafBuddy</p>
					<p class="text-sm font-semibold text-foreground">Plant care companion</p>
				</div>
			</div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="relative inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
					<BellIcon class="size-5" />
					{#if data.unreadCount > 0}
						<Badge class="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
							{data.unreadCount > 9 ? '9+' : data.unreadCount}
						</Badge>
					{/if}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-80" align="end">
					<div class="flex items-center justify-between px-4 py-3 border-b">
						<span class="font-semibold text-sm">Notifications</span>
						{#if data.notifications.some((n) => !n.readAt)}
							<form method="POST" action="/notifications?/markAllRead" use:enhance>
								<button type="submit" class="text-xs text-primary hover:underline font-medium">
									Read all
								</button>
							</form>
						{/if}
					</div>
					{#if data.notifications.length === 0}
						<div class="p-8 text-center text-sm text-muted-foreground">
							<BellIcon class="mx-auto mb-2 size-6 opacity-50" />
							No notifications yet
						</div>
					{:else}
						<div class="max-h-[60vh] overflow-y-auto">
							{#each data.notifications as notification}
								<form
									method="POST"
									action="/notifications?/markRead"
									use:enhance={() => {
										return async ({ update }) => {
											await update({ reset: false });
											if (notification.relatedUserPlantId) {
												goto(`/my-plants/${notification.relatedUserPlantId}`);
											}
										};
									}}
								>
									<input type="hidden" name="id" value={notification.id} />
									<button type="submit" class="w-full text-left p-4 hover:bg-muted transition-colors flex gap-3 border-b last:border-0 relative {notification.readAt ? 'opacity-70' : ''}">
										<div class="flex-1">
											<div class="flex items-start justify-between gap-1 mb-1">
												<span class="text-sm font-medium {notification.readAt ? '' : 'text-foreground'}">
													{notification.title}
												</span>
												{#if !notification.readAt}
													<span class="flex size-2 mt-1.5 shrink-0 rounded-full bg-primary"></span>
												{/if}
											</div>
											<p class="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
										</div>
									</button>
								</form>
							{/each}
						</div>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</header>

	<main class="flex-1 px-4 py-4 pb-24">
		{@render children()}
	</main>

	<!-- Mobile bottom nav (app drawer style - only on mobile) -->
	<nav class="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-border/60 bg-background/95 backdrop-blur">
		<div class="grid grid-cols-3 gap-1 px-2 py-2">
			{#each mobileNavItems as item (item.href)}
				<a
					href={item.href}
					class="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors {isActive(item.href)
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<item.icon class="size-5" />
					<span>{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>

<!-- Desktop shell - standard web app layout with sidebar (no bottom drawer) -->
<div class="hidden md:flex min-h-svh bg-background">
	<!-- Left sidebar navigation -->
	<aside class="w-64 shrink-0 border-r border-border/60 bg-card/30 flex flex-col h-screen sticky top-0">
		<div class="p-5 flex-1 overflow-y-auto">
			<!-- Desktop logo -->
			<div class="flex items-center gap-2.5 mb-6">
				<div class="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
					<svg
						class="size-5"
						viewBox="0 0 24 24"
						fill="currentColor"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 3c-4 2.5-6 6-6 10 0 4.5 2.5 7.5 6 8 3.5-.5 6-3.5 6-8 0-4-2-7.5-6-10z" />
						<path d="M12 5.5v13" fill="none" />
						<path d="M9.2 9.8c1.3 1.1 2.1 2.2 2.4 4.2" fill="none" />
						<path d="M14.8 9.8c-1.3 1.1-2.1 2.2-2.4 4.2" fill="none" />
					</svg>
				</div>
				<div>
					<p class="text-xs font-medium tracking-[1.5px] text-muted-foreground uppercase">LeafBuddy</p>
					<p class="text-base font-semibold text-foreground">Plant care companion</p>
				</div>
			</div>

			<!-- Standard vertical sidebar nav -->
			<nav class="flex flex-col gap-0.5">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors {isActive(item.href)
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<div class="relative">
							<item.icon class="size-4.5" />
							{#if item.href === '/notifications' && data.unreadCount > 0}
								<span class="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-medium text-primary-foreground ring-1 ring-background">
									{data.unreadCount > 9 ? '9+' : data.unreadCount}
								</span>
							{/if}
						</div>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>
		</div>

		<!-- Sidebar footer -->
		<div class="p-5 text-[10px] text-muted-foreground/60 border-t border-border/40">
			Your plants, cared for.
		</div>
	</aside>

	<!-- Main content area -->
	<div class="flex-1 flex flex-col min-w-0">
		<main class="flex-1 p-6 lg:p-8 overflow-auto">
			{@render children()}
		</main>
	</div>
</div>

<Toaster richColors position="top-center" />