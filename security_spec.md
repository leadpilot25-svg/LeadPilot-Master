# Security Specification - LeadPilot CRM

## Data Invariants
1. A Lead must belong to a valid Client (clientId).
2. Only authorized users (emails in client.users) can read or update leads belonging to that client.
3. Access to Leads is derived from the Client document.
4. Public users can create leads but not read or update them.
5. Clients can only be modified by the ownerEmail.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Unauthorized Lead Read**: Attempting to read a lead without being in the client users list.
2. **Lead Spoofing**: Creating a lead with a fake `clientId`.
3. **Status Shortcut**: A non-admin user trying to close a lead directly without intermediate steps (if we had such rules, currently status is open).
4. **Identity Spoofing**: Setting `assignedTo` to another user's email if not allowed.
5. **Client Takeover**: Malicious user trying to add themselves to `client.users`.
6. **Sheet URL Poisoning**: Injecting malicious script URLs into `sheetUrl`.
7. **Cross-Tenant Update**: User from Client A trying to update a lead from Client B.
8. **Junk ID injection**: Using a 1MB string as doc ID.
9. **Timestamp Spoofing**: Client-side setting of `createdAt`.
10. **Shadow Field injection**: Adding extra hidden fields to `Lead` documents.
11. **Blanket List Read**: Attempting to list all leads across all clients.
12. **Owner Email Modification**: Attempting to change the `ownerEmail` of a client.

## Security Rules Implementation
The rules will use the `Master Gate` pattern, fetching the Client document to verify membership.
