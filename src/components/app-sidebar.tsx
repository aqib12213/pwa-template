import { t } from "@lingui/core/macro";
import { Link } from "@tanstack/react-router";
import { HelpCircle, Settings } from "lucide-react";
import type * as React from "react";
import { useDirection } from "@/components/ui/direction";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AppTitle } from "./app-title";
import { getSidebarData } from "./data/sidebar-data";
import { NavGroup } from "./nav-group";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const side = useDirection();
	const sidebarData = getSidebarData();
	return (
		<Sidebar
			collapsible="icon"
			dir={side}
			side={side === "rtl" ? "right" : "left"}
			variant="sidebar"
			{...props}
		>
			<SidebarHeader>
				<AppTitle />
			</SidebarHeader>
			<SidebarContent>
				{sidebarData.navGroups.map((props: Parameters<typeof NavGroup>[0]) => (
					<NavGroup key={props.title} {...props} />
				))}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenuItem>
					<SidebarMenuButton
						render={<Link to={"/settings"} />}
						tooltip={t`Settings`}
					>
						<Settings className="size-5" />
						<span>{t`Settings`}</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						render={<Link to={"/help-center"} />}
						tooltip={t`Help Center`}
					>
						<HelpCircle className="size-5" />
						<span>{t`Help Center`}</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarFooter>
		</Sidebar>
	);
}
