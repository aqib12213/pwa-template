import { t } from "@lingui/core/macro";
import {
	AudioWaveform,
	ChartPie,
	Command,
	CreditCard,
	GalleryVerticalEnd,
	HandCoins,
	LayoutDashboard,
} from "lucide-react";
import type { SidebarData } from "../nav-group-types";

export const getSidebarData = (): SidebarData => ({
	user: {
		name: "satnaing",
		email: "satnaingdev@gmail.com",
		avatar: "/avatars/shadcn.jpg",
	},
	teams: [
		{
			name: "Donation Client",
			logo: Command,
			plan: "Vite + ShadcnUI",
		},
		{
			name: "Acme Inc",
			logo: GalleryVerticalEnd,
			plan: t`Enterprise`,
		},
		{
			name: "Acme Corp.",
			logo: AudioWaveform,
			plan: t`Startup`,
		},
	],
	navGroups: [
		{
			title: t`General`,
			items: [
				{
					title: t`Dashboard`,
					url: "/",
					icon: LayoutDashboard,
				},
				{
					title: t`Donations`,
					url: "/donations",
					icon: HandCoins,
				},
				{
					title: t`Expenses`,
					url: "/expenses",
					icon: CreditCard,
				},
				{
					title: t`Reports`,
					url: "/reports",
					icon: ChartPie,
				},
			],
		},
		// {
		// 	title: t`Pages`,
		// 	items: [
		// 		{
		// 			title: t`Auth`,
		// 			icon: ShieldCheck,
		// 			items: [
		// 				{
		// 					title: t`Sign In`,
		// 					url: "/sign-in",
		// 				},
		// 				{
		// 					title: t`Sign In (2 Col)`,
		// 					url: "/sign-in-2",
		// 				},
		// 				{
		// 					title: t`Sign Up`,
		// 					url: "/sign-up",
		// 				},
		// 				{
		// 					title: t`Forgot Password`,
		// 					url: "/forgot-password",
		// 				},
		// 				{
		// 					title: t`OTP`,
		// 					url: "/otp",
		// 				},
		// 			],
		// 		},
		// 		{
		// 			title: t`Errors`,
		// 			icon: Bug,
		// 			items: [
		// 				{
		// 					title: t`Unauthorized`,
		// 					url: "/errors/unauthorized",
		// 					icon: Lock,
		// 				},
		// 				{
		// 					title: t`Forbidden`,
		// 					url: "/errors/forbidden",
		// 					icon: UserX,
		// 				},
		// 				{
		// 					title: t`Not Found`,
		// 					url: "/errors/not-found",
		// 					icon: FileX,
		// 				},
		// 				{
		// 					title: t`Internal Server Error`,
		// 					url: "/errors/internal-server-error",
		// 					icon: ServerOff,
		// 				},
		// 				{
		// 					title: t`Maintenance Error`,
		// 					url: "/errors/maintenance-error",
		// 					icon: Construction,
		// 				},
		// 			],
		// 		},
		// 	],
		// },
		// {
		// 	title: t`Other`,
		// 	items: [
		// 		{
		// 			title: t`Settings`,
		// 			icon: Settings,
		// 			items: [
		// 				{
		// 					title: t`Profile`,
		// 					url: "/settings",
		// 					icon: UserCog,
		// 				},
		// 				{
		// 					title: t`Account`,
		// 					url: "/settings/account",
		// 					icon: Wrench,
		// 				},
		// 				{
		// 					title: t`Appearance`,
		// 					url: "/settings/appearance",
		// 					icon: Palette,
		// 				},
		// 				{
		// 					title: t`Notifications`,
		// 					url: "/settings/notifications",
		// 					icon: Bell,
		// 				},
		// 				{
		// 					title: t`Display`,
		// 					url: "/settings/display",
		// 					icon: Monitor,
		// 				},
		// 			],
		// 		},
		// 		// {
		// 		// 	title: t`Help Center`,
		// 		// 	url: "/help-center",
		// 		// 	icon: HelpCircle,
		// 		// },
		// 	],
		// },
	],
});
