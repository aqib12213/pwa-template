import { DB, type DBPermissionSet } from "@/db/db";

const textEncoder = new TextEncoder();

const base64UrlEncode = (bytes: Uint8Array): string => {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCodePoint(byte);
	}
	const base64 = btoa(binary);
	return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

export const normalizeEmail = (email: string): string =>
	email.trim().toLowerCase();

export const computeLedgerRealmId = async (email: string): Promise<string> => {
	const normalizedEmail = normalizeEmail(email);

	const subtle = globalThis.crypto?.subtle;
	if (!subtle) {
		// Fallback: stable but not privacy-preserving; only used in non-browser runtimes.
		return `rlm-ledger-${encodeURIComponent(normalizedEmail)}`;
	}

	const digest = await subtle.digest(
		"SHA-256",
		textEncoder.encode(normalizedEmail)
	);
	return `rlm-ledger-${base64UrlEncode(new Uint8Array(digest))}`;
};

export const getMemberPermissions = (): DBPermissionSet => ({
	add: ["donations", "expenses", "expenseReceipts", "auditEvents"],
	update: {
		donations: [
			"donorName",
			"amountCents",
			"currency",
			"donatedAt",
			"category",
			"paymentMethod",
			"notes",
			"description",
			"updatedAt",
			"updatedBy",
		],
		expenses: [
			"payeeName",
			"amountCents",
			"currency",
			"spentAt",
			"category",
			"paymentMethod",
			"notes",
			"description",
			"updatedAt",
			"updatedBy",
		],
		expenseReceipts: ["file", "fileName", "mimeType", "size", "deleted"],
		auditEvents: ["*"],
	},
});

export const getSuperUserPermissions = (): DBPermissionSet => ({
	manage: "*",
});

export const ensureVaultRealm = async (params: {
	realmId: string;
	superUserEmails: readonly string[];
}): Promise<string> => {
	const { realmId, superUserEmails } = params;

	await DB.transaction("rw", [DB.realms, DB.members], async () => {
		await DB.realms.put({
			realmId,
			name: "Archive Vault",
			represents: "an archive vault",
		});

		const normalizedEmails = superUserEmails.map(normalizeEmail);
		await DB.members.bulkPut(
			normalizedEmails.map((email) => ({
				realmId,
				email,
				invite: false,
				permissions: getSuperUserPermissions(),
			}))
		);
	});

	return realmId;
};

export const createMemberLedgerRealm = async (params: {
	memberEmail: string;
	superUserEmails: readonly string[];
}): Promise<string> => {
	const memberEmail = normalizeEmail(params.memberEmail);
	const superUserEmails = params.superUserEmails.map(normalizeEmail);
	const realmId = await computeLedgerRealmId(memberEmail);

	await DB.transaction("rw", [DB.realms, DB.members], async () => {
		await DB.realms.put({
			realmId,
			name: `Ledger: ${memberEmail}`,
			represents: "a donation ledger",
		});

		await DB.members.put({
			realmId,
			email: memberEmail,
			invite: true,
			permissions: getMemberPermissions(),
		});

		await DB.members.bulkPut(
			superUserEmails.map((email) => ({
				realmId,
				email,
				invite: false,
				permissions: getSuperUserPermissions(),
			}))
		);
	});

	return realmId;
};
