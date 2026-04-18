import { createFileRoute } from "@tanstack/react-router";
import { DonationRoute } from "@/features/donation/DonationRoute";

export const Route = createFileRoute("/_authenticated/donations")({
    component: DonationRoute,
});
