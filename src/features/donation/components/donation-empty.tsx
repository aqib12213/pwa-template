import { Trans } from "@lingui/react/macro";
import { PencilLine } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

export function DonationEmpty() {
    return (
        <Empty className="rounded-lg border border-dashed bg-muted/20 py-10">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <PencilLine className="size-4" />
                </EmptyMedia>
                <EmptyTitle>
                    <Trans>No donations</Trans>
                </EmptyTitle>
                <EmptyDescription>
                    <Trans>Record your first donation to start tracking.</Trans>
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
