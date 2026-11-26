# The Pearls · demo hotel

A small hotel site that shows both directions of EUDI wallets with EUDIPLO
(tenant `the-pearls`):

| Step | Page | EUDIPLO |
| --- | --- | --- |
| 1. Pick room and dates | `/` | — |
| 2. Register with the wallet, check the details, confirm | `/book` | **Presentation** `guest-pid`: name, birth date, nationality and address from a Demo Government PID |
| 3. Booking confirmed, add it to the wallet | `/booking` | **Issuance** of the `booking` credential (`urn:demo:the-pearls:booking:1`) |
| 4. Arrival at reception | `/reception` | **Presentation** `booking-check`: only bookings signed by The Pearls (own trust list) |

```bash
cp .env.example .env.local   # fill in EUDIPLO_CLIENT_SECRET
npm install
npm run dev                  # http://localhost:3002
```

## Hotel rules (the business logic)

- The guest who books must be **18 or older on the day of arrival** (from the PID's birth date).
- The guest registration is filled from the verified PID, no typing. The guest checks it and confirms the booking.
- The total includes the city tax (€3.50 per guest and night).
- The booking credential carries `check_in` and `check_out`. EUDIPLO sets the
  credential's own expiry per credential type (30 days), so **reception enforces
  the stay dates**: check-in is accepted from the arrival day until the day
  before departure, in the hotel's time zone (`HOTEL_TIMEZONE`).
- Reception also compares the presented booking with the hotel's records when it still has them.

## Notes

- Secrets and EUDIPLO session IDs stay on the server; the browser only has an
  HttpOnly booking cookie.
- Offers are single-use: never open or preview an offer URL yourself.
- Bookings and checks live in memory (one process; lost on restart). Run one replica.
- The reception page is meant for a lobby tablet. It only shows what the guest
  presents, but on a public deployment consider serving it separately
  (Coolify's Basic Auth protects a whole app, not one path).
