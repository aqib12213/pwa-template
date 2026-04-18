import type { DonationRecord } from "@/db/db";

export interface DonationDraft {
	amount: string;
	category: string;
	currency: string;
	description: string;
	donatedOn: string;
	donorName: string;
	notes: string;
	paymentMethod: string;
}

export interface NormalizedDonationInput {
	amountCents: number;
	category: string;
	currency: string;
	description?: string;
	donatedAt: number;
	donorName: string;
	notes?: string;
	paymentMethod: string;
}

export const getDefaultDateInputValue = (): string => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const formatEpochMsToDateInputValue = (epochMs: number): string => {
	const date = new Date(epochMs);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const parseDateInputToEpochMs = (value: string): number | null => {
	const [yyyy, mm, dd] = value.split("-").map((part) => Number(part));
	if (!(yyyy && mm && dd)) {
		return null;
	}

	const date = new Date(yyyy, mm - 1, dd);
	const epochMs = date.getTime();
	return Number.isNaN(epochMs) ? null : epochMs;
};

export const amountToCents = (value: string): number | null => {
	const asNumber = Number(value);
	if (!Number.isFinite(asNumber) || asNumber < 0) {
		return null;
	}
	return Math.round(asNumber * 100);
};

export const centsToAmountInput = (amountCents: number): string => {
	return (amountCents / 100).toFixed(2);
};

export const formatMoney = (amountCents: number, currency: string): string => {
	const amount = amountCents / 100;
	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency,
		}).format(amount);
	} catch {
		return `${amount.toFixed(2)} ${currency}`;
	}
};

export const getEmptyDraft = (): DonationDraft => ({
	donorName: "",
	amount: "",
	currency: "USD",
	donatedOn: getDefaultDateInputValue(),
	category: "",
	paymentMethod: "",
	notes: "",
	description: "",
});

export const donationToDraft = (donation: DonationRecord): DonationDraft => {
	return {
		donorName: donation.donorName,
		amount: centsToAmountInput(donation.amountCents),
		currency: donation.currency,
		donatedOn: formatEpochMsToDateInputValue(donation.donatedAt),
		category: donation.category,
		paymentMethod: donation.paymentMethod,
		notes: donation.notes ?? "",
		description: donation.description ?? "",
	};
};

export const normalizeDonationDraft = (
	draft: DonationDraft
): NormalizedDonationInput | null => {
	const trimmedDonorName = draft.donorName.trim();
	const trimmedCurrency = draft.currency.trim().toUpperCase();
	const trimmedCategory = draft.category.trim();
	const trimmedPaymentMethod = draft.paymentMethod.trim();
	const trimmedNotes = draft.notes.trim();
	const trimmedDescription = draft.description.trim();

	const amountCents = amountToCents(draft.amount);
	const donatedAt = parseDateInputToEpochMs(draft.donatedOn);

	if (!trimmedDonorName) {
		return null;
	}
	if (!(trimmedCurrency && trimmedCategory && trimmedPaymentMethod)) {
		return null;
	}
	if (amountCents === null || donatedAt === null) {
		return null;
	}

	return {
		donorName: trimmedDonorName,
		amountCents,
		currency: trimmedCurrency,
		donatedAt,
		category: trimmedCategory,
		paymentMethod: trimmedPaymentMethod,
		notes: trimmedNotes ? trimmedNotes : undefined,
		description: trimmedDescription ? trimmedDescription : undefined,
	};
};
