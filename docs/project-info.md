# Project Identity: Foundation Flow (In-House Donation Management)

## 1. Executive Summary
An in-house, **Local-First PWA** designed for foundation members to record donations and expenses. The system prioritizes data integrity through an immutable audit trail, ensuring that no data is ever truly "deleted," only archived with rich metadata for oversight.


## 3. Data Integrity & Immutability Rules
* **No Hard Deletes:** The application must never call a delete method on a record. 
* **Soft-Delete Pattern:** "Deletion" involves setting a `deleted: true` flag and moving the record to an `archive` state.
* **Metadata Requirement:** Every archived record must attach an `auditLog` object containing:
    * `deletedBy`: User ID.
    * `deletedAt`: ISO Timestamp.
    * `reason`: Required text input from the user.
    * `deviceInfo`: Metadata about the hardware/browser used.
* **Edit History:** Any update to a record should ideally preserve the previous state in a `versions` array or a separate `history` table.

## 4. User Roles & Access Control
* ** User:**
    * **Create:** Can record new donations and expenses.
    * **Read/Edit:** Can only view and modify records they personally created.
    * **Constraints:** Cannot see other members' data or foundation-wide totals.
* **Super User:**
    * **Global Oversight:** Can view all data from all members.
    * **Management:** Can edit/archive any record.
    * **Tools:** Access to Import/Export (CSV/JSON) and the global Audit/Archive vault.
    * **Analytics:** Access to the foundation-wide dashboard and financial trends.

## 5. Architectural Requirements
* **Local-First Sync:** Data must be saved locally first for offline capability. Dexie Cloud manages the background sync to the server when a connection is available.
* **Responsive PWA:** The UI must be optimized for mobile (for members in the field) and desktop (for Super User oversight).

## 6. Functional Modules
* **Transaction Module For Donations:** Fields for  Donor Name, Donation Amount, Date-time of donation, Category, Payment method, notes, and Description.
* **Transaction Module For Expenses:** Fields for  Payee Name, Expense Amount, Date-time of expense, Category, Receipt, notes, and Description.
* **Archive Module:** A dedicated view for the Super User to inspect soft-deleted entries.
* **Dashboard Module:** Visualizations for "Total In vs. Total Out" and member activity logs.
* **Export/Import:** Logic to handle bulk data migration for the Super User.
* **Authentication Module:** User login/logout and session management via Dexie Cloud.