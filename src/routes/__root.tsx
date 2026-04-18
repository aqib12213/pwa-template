import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import "../styles.css";
import PWABadge from "@/components/pwa-badg";
import { Toaster } from "@/components/ui/sonner";
import { DexieCloudAuthDialog } from "@/features/auth/dexie-cloud-auth-dialog";
import { GeneralError } from "@/features/errors/general-error";
import { NotFoundError } from "@/features/errors/not-found-error";

export const Route = createRootRoute({
	component: RootComponent,
	notFoundComponent: NotFoundError,
	errorComponent: GeneralError,
});

function RootComponent() {
	return (
		<>
			<Outlet />
			<DexieCloudAuthDialog />
			<Toaster position="top-center" />
			<PWABadge />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "TanStack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</>
	);
}
