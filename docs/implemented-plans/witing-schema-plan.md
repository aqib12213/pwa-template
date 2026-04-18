## Plan: Dexie Cloud Schema for Foundation Flow

Local-first Dexie + Dexie Cloud schema with strict “no hard deletes” semantics, per-member data isolation, and a super-user-only archive vault. Uses Dexie Cloud’s realm-based sync visibility (`realmId`) plus reserved ownership (`owner`) to keep members from ever syncing other members’ ledgers, while giving super users cross-ledger oversight and an Archive module.

**Steps**
1. Define core record types (Donation, Expense, Receipt, AuditEvent)
   1. Add TS interfaces that include Dexie Cloud reserved props `realmId` and `owner` on every synced table.
   2. Use integer money storage: `amountCents: number` + `currency: string` (avoids floating rounding).
   3. Standardize timestamps as epoch millis (`number`) for consistent indexing and range queries.
2. Replace the current sample DB schema with the Foundation Flow schema (Dexie version bump)
   1. Update the Dexie schema version from 1 → 2.
   2. Add application tables: `donations`, `expenses`, `expenseReceipts`, `auditEvents`.
   3. Add Dexie Cloud access-control tables (names and primary keys must match Dexie Cloud): `realms`, `members`, and optionally `roles`.
   4. Keep the existing `cache: "immutable"` setting.
3. Access control model (meets the project’s role rules)
   1. One ledger realm per member (visibility isolation): each member is invited to exactly one realm that contains their donations/expenses.
   2. One archive vault realm (super-user-only): archived records are moved into this realm so members stop syncing archived data.
   3. Super users are identified in-app via a fixed allowlist of emails; only those accounts get the UI to create realms/memberships and archive records.

4. Realm onboarding flow (invite-email, Dexie Cloud default)
   1. Prereq: user must be authenticated (Dexie Cloud requireAuth=true) because creating realms/memberships is a synced write.
   2. Super user gates: only allowlisted super-user emails can access the onboarding UI (create realms, invite members, create vault).
   3. Create the Archive Vault realm (one-time)
      1. Use a stable realmId, e.g. `rlm-vault` (avoid `rlm-public`). Create if missing.
      2. Add a `db.members` row for each super-user email with `invite: false` and full permissions (`manage: '*'`) so they can accept in-app (via `db.cloud.invites`) and then sync vault data offline (no extra email spam).
      3. UX note: super users should also see these invites in-app via `db.cloud.invites` and can accept without relying on email.
   4. Create a member ledger realm (one per member)
      1. Compute a deterministic realmId from the member email (lowercased + trimmed), preferably hashed to avoid PII in IDs, e.g. `rlm-ledger-<sha256(email)>`.
      2. In a single Dexie transaction (`rw` on `realms` + `members`):
         - `db.realms.upsert(realmId, { name: `Ledger: ${email}`, represents: 'a donation ledger' })`
         - `db.members.add({ realmId, email: memberEmail, invite: true, permissions: <member-permissions> })`
         - `db.members.bulkAdd(superUserEmails.map(email => ({ realmId, email, invite: false, permissions: { manage: '*' } })))`
      3. Member-permissions recommendation (prevents hard delete / archive-at-will)
         - Give `add` permission for `donations`, `expenses`, `expenseReceipts`, `auditEvents`.
         - Give `update` permission only for business fields (amount/date/category/payment/notes/description) and `updatedAt/updatedBy`.
         - Do NOT grant `manage` permission to members.
         - Ensure business records are written with `owner: null` so ownership doesn’t implicitly grant delete/update privileges.
   5. Invite acceptance (member side)
      1. Member receives invite email (because `invite: true`) and accepts via link, OR accepts inside the app.
      2. In-app acceptance: show pending invites by observing `db.cloud.invites` (Observable of Invite[]) and provide Accept/Reject actions calling `invite.accept()` / `invite.reject()`.
      3. After acceptance, next sync will start downloading that realm and its connected objects; member now has offline access.
   6. Operational notes
      1. Super-user “global oversight” is achieved by being a member of every ledger realm (invite + accept).
      2. Revoking access: remove the member row from `db.members` for that realm (this is OK to hard-delete because it’s access-control state, not business data).
      3. If you later want to bypass invites (enterprise provisioning), switch to server-side REST API for members (set `userId` + `accepted`, `invite: false`).

5. Soft-delete + immutable audit trail
   1. Never call `.delete()` / `.bulkDelete()` on business tables (`donations`, `expenses`, `expenseReceipts`, `auditEvents`).
   2. “Archive” operation (super user): set `deleted: true`, `status: "archived"`, and populate required `auditLog` on the record, then move `realmId` to the vault realm.
   3. Append-only `auditEvents` table captures create/update/archive actions, with `before` snapshots (or field-level diffs) to satisfy the “edit history” rule.
   4. Receipts are soft-deleted too (mark `deleted: true`) rather than removed.
6. Realm moves for related entities (consistency)
   1. When archiving an `expense`, also move its related `expenseReceipts` and related `auditEvents` to the vault realm.
   2. When archiving a `donation`, also move its related `auditEvents` to the vault realm.
   3. Ensure the DB schema includes indexes that make these updates deterministic (by foreign keys and by `[entityType+entityId]`).
7. Verification
   1. Validate that a normal member device only syncs their own realm objects.
   2. Validate that archived records disappear from a member after a sync (because they moved to vault realm).
   3. Validate that super user can still view archived records and audit history offline.

**Relevant files**
- src/db/db.ts — replace the current Todo DB with the new tables + access-control tables; bump Dexie version.
- src/routes/_authenticated/todo.tsx — currently uses hard deletes; should be treated as a sample and not copied for business entities.
- src/features/auth/** — currently has stubbed login UI; later implementation will call `db.cloud.login()` and reflect `db.cloud.currentUser`.

**Schema details (tables, key fields, indexes)**
1. donations
   - Primary key: `id` (Dexie Cloud universal id, `@id`)
   - Required fields: `donorName`, `amountCents`, `currency`, `donatedAt`, `category`, `paymentMethod`
   - Optional fields: `notes`, `description`
   - Lifecycle fields: `status` ("active" | "archived"), `deleted` (boolean), `auditLog` (required when `deleted=true`)
   - Metadata fields: `createdAt`, `createdBy`, `updatedAt?`, `updatedBy?`
   - Access-control reserved fields: `realmId`, `owner` (recommend explicitly setting `owner: null` for business records)
   - Indexes to include:
     - `donatedAt` (list/order)
     - `[realmId+donatedAt]` (super user range queries per realm)
     - `deleted` and `[deleted+donatedAt]` (archive vs active screens)
     - `category`, `paymentMethod` (filters / dashboard groupings)
2. expenses
   - Primary key: `id` (`@id`)
   - Required fields: `payeeName`, `amountCents`, `currency`, `spentAt`, `category`, `paymentMethod`
   - Optional fields: `notes`, `description`
   - Lifecycle fields: same as donations (`status`, `deleted`, `auditLog`)
   - Metadata fields: `createdAt`, `createdBy`, `updatedAt?`, `updatedBy?`
   - Access-control reserved fields: `realmId`, `owner` (recommend `owner: null`)
   - Indexes to include:
     - `spentAt`
     - `[realmId+spentAt]`
     - `deleted` and `[deleted+spentAt]`
     - `category`, `paymentMethod`
3. expenseReceipts
   - Primary key: `id` (`@id`)
   - Foreign key: `expenseId`
   - Payload fields: `file` (Blob/File) OR alternatively `{blobRef}`-style payload handled by Dexie Cloud blob offloading
   - Metadata: `fileName?`, `mimeType?`, `size?`, `createdAt`, `createdBy`
   - Lifecycle: `deleted` boolean (soft-delete receipts)
   - Reserved: `realmId`, `owner` (recommend `owner: null`)
   - Indexes:
     - `expenseId`
     - `[expenseId+createdAt]`
     - `deleted`
4. auditEvents (append-only history)
   - Primary key: `id` (`@id`)
   - Link fields: `entityType` ("donation" | "expense" | "expenseReceipt"), `entityId`
   - Event fields: `eventType` ("created" | "updated" | "archived" | "restored"), `at`, `byUserId`, `reason?`, `deviceInfo?`
   - Snapshot fields: `before?`, `after?` (store minimal snapshots; for expenses, avoid duplicating receipt blobs)
   - Reserved: `realmId`, `owner` (recommend `owner: null`)
   - Indexes:
     - `[entityType+entityId]` (fetch full history for an entity)
     - `[realmId+at]` (audit timeline by ledger/vault)
     - `at` (global ordering)
5. realms / members / roles (Dexie Cloud access control)
   - realms: primary key `@realmId`, keep `name` descriptive (e.g., `Ledger: <member-email>`, `Archive Vault`)
   - members: primary key `@id`, index `[email+realmId]`, plus `realmId` for queries; store permissions here (avoid CLI-imported roles initially)
   - roles: optional; only needed if you want to manage permissions via `npx dexie-cloud import` later

**Verification**
1. Run the app with two non-super users + one super user:
   - Confirm each member only sees their own ledger.
   - Confirm super user sees all ledgers (after accepting memberships).
2. Archive a record as super user:
   - Confirm it moves to vault realm and disappears from member list after sync.
   - Confirm audit log fields are present (`deletedBy`, `deletedAt` ISO, `reason`, `deviceInfo`).
3. Confirm no business entity uses Dexie `.delete()` calls.

**Decisions**
- Use separate `donations` and `expenses` tables.
- Archived items move to a super-user-only vault realm.
- Super users are identified in-app via a fixed allowlist of emails.

**Further Considerations**
1. Permissions vs UX: decide how strict member `update` permissions should be (explicit allowlist of editable fields vs `"*"`), and whether members should be allowed to set `deleted/status/auditLog` (recommended: super-user-only).
2. Blob/receipt handling: `dexie-cloud-addon` supports blob offloading; verify your target server version supports it so receipts don’t bloat sync payloads.
