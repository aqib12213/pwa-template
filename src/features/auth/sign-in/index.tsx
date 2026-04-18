import { useSearch } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "../auth-layout";
import { UserAuthForm } from "./components/user-auth-form";

export function SignIn() {
	const { redirect } = useSearch({ from: "/(auth)/sign-in" });

	return (
		<AuthLayout>
			<Card className="gap-4">
				<CardHeader>
					<CardTitle className="text-lg tracking-tight">Sign in</CardTitle>
					<CardDescription>
						Enter your email to receive a one-time <br />
						passcode and sign in securely.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<UserAuthForm redirectTo={redirect} />
				</CardContent>
				<CardFooter>
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
				</CardFooter>
			</Card>
		</AuthLayout>
	);
}
