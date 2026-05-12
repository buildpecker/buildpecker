import * as React from "react";

export default function AppLoading() {
	return (
		<div>
			<div className="sticky top-0 z-20 flex h-12 items-center border-b border-border bg-background/95 px-6">
				<div className="h-3 w-32 animate-pulse bg-muted" />
			</div>
			<div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
				<div className="grid gap-3">
					<div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
						<div className="h-2.5 w-24 animate-pulse bg-muted" />
						<div className="h-px bg-border" />
						<div className="h-2.5 w-20 animate-pulse bg-muted" />
					</div>
					<div className="h-7 w-48 animate-pulse bg-muted" />
					<div className="h-3 w-96 max-w-full animate-pulse bg-muted/60" />
				</div>
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="border border-border bg-card/40 p-5"
							style={{ animationDelay: `${i * 80}ms` }}
						>
							<div className="mb-3 h-2 w-16 animate-pulse bg-muted" />
							<div className="h-8 w-20 animate-pulse bg-muted" />
						</div>
					))}
				</div>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
					<div className="border border-border bg-card/40 p-4 lg:col-span-3">
						<div className="mb-4 flex items-center justify-between border-b border-border pb-2">
							<div className="h-3 w-32 animate-pulse bg-muted" />
							<div className="h-2.5 w-16 animate-pulse bg-muted/60" />
						</div>
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center gap-3">
									<div className="h-4 w-20 animate-pulse bg-muted" />
									<div className="h-3 flex-1 animate-pulse bg-muted/60" />
									<div className="h-2.5 w-16 animate-pulse bg-muted/60" />
								</div>
							))}
						</div>
					</div>
					<div className="border border-border bg-card/40 p-4 lg:col-span-2">
						<div className="mb-4 flex items-center justify-between border-b border-border pb-2">
							<div className="h-3 w-24 animate-pulse bg-muted" />
							<div className="h-2.5 w-16 animate-pulse bg-muted/60" />
						</div>
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex flex-col gap-1.5">
									<div className="h-3 w-24 animate-pulse bg-muted" />
									<div className="h-2.5 w-40 max-w-full animate-pulse bg-muted/60" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
