import Dexie from "dexie";
import dexieCloud, { type DexieCloudTable } from "dexie-cloud-addon";

export const VAULT_REALM_ID = "rlm-vault" as const;

export type ISODateTimeString = string;

export type TransactionStatus = "active" | "archived";

export interface DeviceInfo {
	appVersion?: string;
	locale?: string;
	platform?: string;
	timezone?: string;
	userAgent?: string;
}

export interface AuditLog {
	deletedAt: ISODateTimeString;
	deletedBy: string;
	deviceInfo: DeviceInfo;
	reason: string;
}

/**
 * Dexie Cloud reserved fields:
 * - realmId controls visibility/sync scope.
 * - owner controls permissions (ownership gives full permissions).
 */
export interface CloudAccessControlled {
	owner?: string;
	realmId?: string;
}

export interface DonationRecord extends CloudAccessControlled {
	amountCents: number;
	auditLog?: AuditLog;
	category: string;

	createdAt: number;
	createdBy: string;
	currency: string;
	deleted: boolean;
	description?: string;
	donatedAt: number;

	donorName: string;
	id: string;

	notes?: string;
	paymentMethod: string;

	status: TransactionStatus;
	updatedAt?: number;
	updatedBy?: string;
}

export interface ExpenseRecord extends CloudAccessControlled {
	amountCents: number;
	auditLog?: AuditLog;
	category: string;

	createdAt: number;
	createdBy: string;
	currency: string;
	deleted: boolean;
	description?: string;
	id: string;

	notes?: string;

	payeeName: string;
	paymentMethod: string;
	spentAt: number;

	status: TransactionStatus;
	updatedAt?: number;
	updatedBy?: string;
}

export interface ExpenseReceiptRecord extends CloudAccessControlled {
	createdAt: number;
	createdBy: string;

	deleted: boolean;
	expenseId: string;

	file: Blob;
	fileName?: string;
	id: string;
	mimeType?: string;
	size?: number;
}

export type AuditEntityType = "donation" | "expense" | "expenseReceipt";

export type AuditEventType = "created" | "updated" | "archived" | "restored";

export interface AuditEventRecord extends CloudAccessControlled {
	after?: unknown;
	at: number;

	before?: unknown;
	byUserId: string;
	deviceInfo?: DeviceInfo;
	entityId: string;

	entityType: AuditEntityType;
	eventType: AuditEventType;
	id: string;

	reason?: string;
}

// Dexie Cloud permission object shape used in members/roles.
export interface DBPermissionSet {
	add?: "*" | string[];
	manage?: "*" | string[];
	update?:
		| "*"
		| {
				[tableName: string]: "*" | string[];
		  };
}

export interface TodoRecord extends CloudAccessControlled {
	completed: boolean;
	createdAt: number;
	id: string;
	title: string;
}

export class Database extends Dexie {
	// Sample / legacy
	todos!: DexieCloudTable<TodoRecord, "id">;

	// Business tables
	donations!: DexieCloudTable<DonationRecord, "id">;
	expenses!: DexieCloudTable<ExpenseRecord, "id">;
	expenseReceipts!: DexieCloudTable<ExpenseReceiptRecord, "id">;
	auditEvents!: DexieCloudTable<AuditEventRecord, "id">;

	constructor() {
		super("DonationClientDB", {
			addons: [dexieCloud],
			cache: "immutable",
		});

		// Version 1: legacy sample table
		this.version(1).stores({
			todos: "@id, completed, createdAt",
		});

		// Version 2: Foundation Flow schema + access-control tables
		this.version(2).stores({
			// Sample / legacy
			todos: "@id, completed, createdAt",

			// Business
			donations:
				"@id, donatedAt, deleted, status, category, paymentMethod, realmId, owner, [realmId+donatedAt], [deleted+donatedAt]",
			expenses:
				"@id, spentAt, deleted, status, category, paymentMethod, realmId, owner, [realmId+spentAt], [deleted+spentAt]",
			expenseReceipts:
				"@id, expenseId, createdAt, deleted, realmId, owner, [expenseId+createdAt]",
			auditEvents:
				"@id, at, entityType, entityId, eventType, realmId, owner, [entityType+entityId], [realmId+at]",

			// Access control (Dexie Cloud)
			realms: "@realmId",
			members: "@id, realmId, email, [email+realmId]",
			roles: "[realmId+name]",
		});

		if (import.meta.env.VITE_DBURL) {
			this.cloud.configure({
				customLoginGui: true,
				databaseUrl: import.meta.env.VITE_DBURL,
				requireAuth: true,
			});
		}
	}
}

export const DB = new Database();
