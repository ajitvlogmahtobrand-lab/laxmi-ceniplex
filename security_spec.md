# Security Specification - Laxmi Cineplex Hazaribagh

## 1. Data Invariants

1. **Master Gate / Authentication Invariant**: Unauthenticated users cannot write to any collection. Admin writes to `/movies`, `/banners`, `/shows`, `/screens`, `/settings`, `/announcements`, and `/coupons` require authenticated administrator credentials (`ajitvlogmahtobrand@gmail.com` with `email_verified == true` or entry in `/admins/{uid}`).
2. **Catalog Immutability & Public Readability**: Movies, Banners, Shows, Screens, Public Announcements, and Cinema Settings are publicly readable by all site visitors, but strictly immutable to non-admin customers.
3. **Booking Identity & Isolation Invariant**: Customer ticket bookings in `/bookings/{bookingId}` are private. A customer can only read their own booking (`resource.data.userId == request.auth.uid` or customer phone/email verification token).
4. **No Customer Self-Approval Invariant**: Ordinary customers can never self-verify payment status (`paymentStatus: 'VERIFIED'` or `bookingStatus: 'CONFIRMED'`). Payment verification is restricted strictly to Admins and the server payment verification route.
5. **No Customer Direct State Escalation**: Once a booking is cancelled or rejected, it cannot be reverted to confirmed by a client.
6. **Strict Document ID Regex**: All document keys must satisfy `isValidId(id)` (`id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
7. **Volumetric Boundaries**: No unbounded payload strings or rogue keys. Every string must have a `.size()` limit to prevent Denial-of-Wallet attacks.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Vectors)

1. **Payload 1 (Ghost Field Injection on Movie)**: An unauthenticated or customer user injects `{ title: "Hacked Movie", ghostField: true }` into `/movies/movie-123`.
   - *Expected*: PERMISSION_DENIED.
2. **Payload 2 (Unverified Admin Email Spoofing)**: Attacker sends auth token with `email: "ajitvlogmahtobrand@gmail.com"` but `email_verified: false` to mutate `/settings/global`.
   - *Expected*: PERMISSION_DENIED.
3. **Payload 3 (Customer Self-Confirms Booking Payment)**: Customer updates their own booking `/bookings/LXM-101` setting `paymentStatus: "VERIFIED"`, `bookingStatus: "CONFIRMED"`.
   - *Expected*: PERMISSION_DENIED.
4. **Payload 4 (Customer Reads Another Customer's Booking)**: User B attempts `get` or `list` on `/bookings/LXM-101` belonging to User A (`userId: "user-A"`).
   - *Expected*: PERMISSION_DENIED.
5. **Payload 5 (Public Document Overwrite on Banner)**: Customer attempts to replace hero banner `/banners/banner-1` with arbitrary advertisement.
   - *Expected*: PERMISSION_DENIED.
6. **Payload 6 (Oversized ID Resource Exhaustion)**: Attacker sends document ID with 50,000 characters to `/movies/{longId}`.
   - *Expected*: PERMISSION_DENIED (`isValidId` check fails).
7. **Payload 7 (Denial of Wallet Huge String Payload)**: Attacker creates a movie with a 2MB string for synopsis.
   - *Expected*: PERMISSION_DENIED (`synopsis.size() <= 2000` limit violated).
8. **Payload 8 (Admitted Gate Bypass)**: Customer attempts to mark `isAdmitted: true` on `/bookings/LXM-101` without gatekeeper usher authentication.
   - *Expected*: PERMISSION_DENIED.
9. **Payload 9 (Delete Global Settings)**: User attempts to `delete` `/settings/global` to break the cinema site.
   - *Expected*: PERMISSION_DENIED.
10. **Payload 10 (Coupon Discount Manipulation)**: Non-admin modifies `/coupons/LAXMI50` to increase discount from 50 to 5000.
    - *Expected*: PERMISSION_DENIED.
11. **Payload 11 (Blanket Query Scraping on Bookings)**: Unauthenticated user runs `collection("bookings")` without filter to scrape phone numbers and names.
    - *Expected*: PERMISSION_DENIED.
12. **Payload 12 (Direct Price Tampering on Shows)**: Customer updates ticket pricing on `/shows/show-1` to 0.
    - *Expected*: PERMISSION_DENIED.

---

## 3. Security Test Runner (firestore.rules.test.ts)

Defined below for validation against the Firebase rules emulator or production AST analyzer.
