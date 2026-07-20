# Security Specification: An sinh xã hội - Phú Lợi

This document outlines the security architecture, invariants, and threat-modeling payloads used to secure our Firestore database against unauthorized access, integrity violations, and Denial of Wallet attacks.

## 1. Data Invariants

1. **Campaigns**: Only administrative personnel should manage campaigns, but citizens are allowed to read them and update `currentAmount` when donating.
2. **Jobs**: Publicly visible job listings, only seeded or written by authorized/local processes.
3. **Requests**: General citizens (and authenticated users) can submit help requests. Status defaults to `SUBMITTED` or `VERIFYING`. Only authorized operations can modify status.
4. **Donations**: Citizens can view donations (the Sổ Vàng record). New donations are tracked.
5. **Users**: Strictly owned by the user matching their authenticated Firestore UID. No public list or reading other citizens' PII (Personally Identifiable Information).

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific JSON payloads designed to violate Identity, Integrity, and State boundaries to verify security rules:

1. **PII Extraction (Read bypass)**:
   * Collection: `users`
   * Attack: Try to list all users as a guest or another user.
   * Expected: `PERMISSION_DENIED`.

2. **Self-Elevated Privilege (User update)**:
   * Collection: `users`
   * Payload: `{ "uid": "USER1", "fullName": "Attacker", "isVolunteer": true, "isAdmin": true }`
   * Expected: `PERMISSION_DENIED` (if `isAdmin` is not an allowed field or fails verification).

3. **Orphaned Donation Creation**:
   * Collection: `donations`
   * Payload: `{ "id": "DON-BAD", "amount": 1000000 }` (missing required keys).
   * Expected: `PERMISSION_DENIED` (strictly size-checked).

4. **Negative Donation Amount**:
   * Collection: `donations`
   * Payload: `{ "id": "DON-BAD", "donorName": "Attacker", "amount": -500000, "campaignTitle": "Campaign", "message": "Thanks", "createdAt": "2026-07-07T08:00:00Z" }`
   * Expected: `PERMISSION_DENIED`.

5. **Resource Poisoning ID (Long ID)**:
   * Collection: `campaigns`
   * Attack: Attempt setDoc on document with a 2KB string as ID.
   * Expected: `PERMISSION_DENIED` (size restriction).

6. **Shadow Update on Campaigns**:
   * Collection: `campaigns`
   * Payload: `{ "id": "CAMP-01", "targetAmount": 999999999, "isVerified": true }` (adding invalid `isVerified` key).
   * Expected: `PERMISSION_DENIED`.

7. **Direct Status Escalation of Help Request**:
   * Collection: `requests`
   * Payload: `{ "status": "COMPLETED" }` (by non-admin or bypassing validation keys).
   * Expected: `PERMISSION_DENIED`.

8. **Overwriting Existing Volunteer Status of Another User**:
   * Collection: `users/USER2`
   * Attack: Logged in as `USER1`, attempt writing/updating `users/USER2`.
   * Expected: `PERMISSION_DENIED`.

9. **Injecting Extra Fields to Job Listing**:
   * Collection: `jobs`
   * Payload: `{ "id": "JOB-01", "salary": "100M", "requirements": ["req"], "maliciousField": "evil" }` (violating strict keys sizing).
   * Expected: `PERMISSION_DENIED`.

10. **Zero-Amount Donation**:
    * Collection: `donations`
    * Payload: `{ "id": "DON-004", "amount": 0, "campaignTitle": "A", "donorName": "B", "message": "C", "createdAt": "D" }`
    * Expected: `PERMISSION_DENIED` (positive amount only).

11. **Malicious Regex Bypass**:
    * Collection: `requests`
    * Document ID: `REQ%2FBYPASS`
    * Expected: `PERMISSION_DENIED`.

12. **Tampering with CreatedAt Timestamp**:
    * Collection: `requests`
    * Payload: `{ "id": "REQ-1", "createdAt": "2030-01-01" }` (faking past/future creation time).
    * Expected: `PERMISSION_DENIED`.

---

## 3. The Test Runner Spec

We describe the test assertions for our test suite validating the rules:

* **Authenticated User Profile Security**: `get` on `/users/alice` passes for `alice`, fails for `bob` or guest.
* **Integrity Validation**: Setting a malformed campaign fails schema constraints.
* **Key-Size Check**: Submitting a donation with missing fields or extra shadow fields fails.
