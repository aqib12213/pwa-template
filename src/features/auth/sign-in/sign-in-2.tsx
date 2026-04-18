import { Logo } from "@/assets/logo";
import { cn } from "@/lib/utils";
import dashboardDark from "./assets/dashboard-dark.png";
import dashboardLight from "./assets/dashboard-light.png";
import { UserAuthForm } from "./components/user-auth-form";

export function SignIn2() {
	return (
		<div className="container relative grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
			<div className="lg:p-8">
				<div className="mx-auto flex w-full flex-col justify-center space-y-2 py-8 sm:w-120 sm:p-8">
					<div className="mb-4 flex items-center justify-center">
						<Logo className="me-2" />
						<h1 className="font-medium text-xl">Donation Client</h1>
					</div>
				</div>
				<div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-2">
					<div className="flex flex-col space-y-2 text-start">
						<h2 className="font-semibold text-lg tracking-tight">Sign in</h2>
						<p className="text-muted-foreground text-sm">
							Use your email to get a one-time passcode <br />
							and log into your account.
						</p>
					</div>
					<UserAuthForm />
					<p className="px-8 text-center text-muted-foreground text-sm">
						By clicking sign in, you agree to our{" "}
						<a
							className="underline underline-offset-4 hover:text-primary"
							href="/terms"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							className="underline underline-offset-4 hover:text-primary"
							href="/privacy"
						>
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>

			<div
				className={cn(
					"relative h-full overflow-hidden bg-muted max-lg:hidden",
					"[&>img]:absolute [&>img]:top-[15%] [&>img]:left-20 [&>img]:h-full [&>img]:w-full [&>img]:select-none [&>img]:object-cover [&>img]:object-top-left"
				)}
			>
				<img
					alt="DONATIONS-CLIENT"
					className="dark:hidden"
					height={1151}
					src={dashboardLight}
					width={1024}
				/>
				<img
					alt="DONATIONS-CLIENT"
					className="hidden dark:block"
					height={1138}
					src={dashboardDark}
					width={1024}
				/>
			</div>
		</div>
	);
}
