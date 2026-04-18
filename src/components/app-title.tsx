import { Link } from "@tanstack/react-router";
import { Signature } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function AppTitle() {
	return (
		<Link to="/">
			<SidebarMenuButton
				className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				size="lg"
			>
				<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
					<Signature className="size-4" />
				</div>
				<div className="relative grid flex-1 text-start text-sm leading-tight">
					<span className="overflow-visible truncate font-semibold text-lg">
						DONATIONS-CLIENT
					</span>
					{/* <Badge
						className="absolute -top-1 left-18 rounded-none"
						variant="outline"
					>
						Beta
					</Badge> */}
				</div>
			</SidebarMenuButton>
		</Link>
	);
}
