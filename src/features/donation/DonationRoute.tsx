import { Trans } from "@lingui/react/macro";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { LanguageSwitch } from "@/components/language-switch";
import { Header } from "@/components/layout/header";
import { ThemeSwitch } from "@/components/theme-switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { DB, type DonationRecord } from "@/db/db";
import { DonationDrawer } from "@/features/donation/components/donation-drawer";
import { DonationEmpty } from "@/features/donation/components/donation-empty";
import { DonationTable } from "@/features/donation/components/donation-table";
import {
    type DonationDraft,
    donationToDraft,
    getEmptyDraft,
    normalizeDonationDraft,
} from "@/features/donation/donation-utils";

export function DonationRoute() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingDonationId, setEditingDonationId] = useState<string | null>(
        null
    );
    const [draft, setDraft] = useState<DonationDraft>(() => getEmptyDraft());
    const [drawerInstanceKey, setDrawerInstanceKey] = useState(0);

    const donations = useLiveQuery(
        async () => DB.donations.orderBy("donatedAt").reverse().toArray(),
        []
    );

    const donationList = useMemo(() => {
        const list = donations ?? [];
        return list.filter((donation) => donation.deleted !== true);
    }, [donations]);

    const openForCreate = (): void => {
        setEditingDonationId(null);
        setDraft(getEmptyDraft());
        setDrawerInstanceKey((previous) => previous + 1);
        setDrawerOpen(true);
    };

    const openForEdit = (donation: DonationRecord): void => {
        setEditingDonationId(donation.id);
        setDraft(donationToDraft(donation));
        setDrawerInstanceKey((previous) => previous + 1);
        setDrawerOpen(true);
    };

    const closeDrawer = (): void => {
        setDrawerOpen(false);
    };

    const createDonation = async (
        input: Exclude<ReturnType<typeof normalizeDonationDraft>, null>
    ): Promise<void> => {
        const now = Date.now();
        const currentUserId = DB.cloud.currentUserId || "unknown";

        await DB.donations.add({
            donorName: input.donorName,
            amountCents: input.amountCents,
            currency: input.currency,
            donatedAt: input.donatedAt,
            category: input.category,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
            description: input.description,
            status: "active",
            deleted: false,
            createdAt: now,
            createdBy: currentUserId,
        });
    };

    const updateDonation = async (params: {
        donationId: string;
        input: Exclude<ReturnType<typeof normalizeDonationDraft>, null>;
    }): Promise<void> => {
        const { donationId, input } = params;
        const now = Date.now();
        const currentUserId = DB.cloud.currentUserId || "unknown";

        await DB.donations.update(donationId, {
            donorName: input.donorName,
            amountCents: input.amountCents,
            currency: input.currency,
            donatedAt: input.donatedAt,
            category: input.category,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
            description: input.description,
            updatedAt: now,
            updatedBy: currentUserId,
        });
    };

    const saveDonation = async (submittedDraft: DonationDraft): Promise<void> => {
        const input = normalizeDonationDraft(submittedDraft);
        if (!input) {
            return;
        }

        if (editingDonationId) {
            await updateDonation({ donationId: editingDonationId, input });
        } else {
            await createDonation(input);
        }

        closeDrawer();
    };

    const archiveDonation = async (donation: DonationRecord): Promise<void> => {
        const now = Date.now();
        const currentUserId = DB.cloud.currentUserId || "unknown";

        await DB.donations.update(donation.id, {
            deleted: true,
            status: "archived",
            updatedAt: now,
            updatedBy: currentUserId,
        });
    };

    return (
        <>
            <Header className="border-b">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                <Trans>Dashboard</Trans>
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="ms-auto flex items-center space-x-4">
                    <LanguageSwitch />
                    <ThemeSwitch />
                    <Avatar size="sm">
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                </div>
            </Header>

            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate pb-2 font-heading font-semibold text-2xl">
                            <Trans>Donations</Trans>
                        </h1>
                        <p className="truncate text-base text-muted-foreground">
                            <Trans>Record and edit donations</Trans>
                        </p>
                    </div>

                    <DonationDrawer
                        editingDonationId={editingDonationId}
                        initialDraft={draft}
                        key={drawerInstanceKey}
                        onOpenChange={(open) => {
                            setDrawerOpen(open);
                            if (!open) {
                                setEditingDonationId(null);
                            }
                        }}
                        onRecordClick={openForCreate}
                        onSubmit={saveDonation}
                        open={drawerOpen}
                    />
                </div>
                {donationList.length === 0 ? (
                    <DonationEmpty />
                ) : (
                    <DonationTable
                        donations={donationList}
                        onDelete={archiveDonation}
                        onEdit={openForEdit}
                    />
                )}
            </main>
        </>
    );
}
