# The Clasp — Manual Regression Test Plan

A full pass to validate the app after meaningful changes. The **automated API
script** (`node scripts/api-regression.mjs`) covers the backend data flows and
permission rules quickly — run that first. This manual plan covers everything
the script can't: real UI, layout/safe-areas, the image lightbox, PWA install/
update/offline, push delivery, and the iOS invite-link behaviour.

## How to use this
- Run on a **real phone** (iOS + the installed PWA if possible) and a desktop browser.
- You need **two accounts** (e.g. you + a family member, or two browsers/incognito). Referred to below as **Owner** and **Friend**.
- Reset test data between full runs if needed:
  - `MONGO_CONTAINER=jewel-mongo sh scripts/purge-test-data.sh --yes` (clears content, keeps users)
  - `MONGO_CONTAINER=jewel-mongo sh scripts/remove-user.sh <email> --yes` (frees an email to re-register)
- ✅ = expected result. Tick each box.

---

## 0. Smoke (do this after every deploy)
- [ ] `node scripts/api-regression.mjs` against the deployed URL → all checks pass.
- [ ] App loads at the site URL; no console errors on first paint.
- [ ] Log in as Owner → Home (Discover) renders with items.
- [ ] Bottom nav shows Home, Closets, +, Messages, Requests.

---

## 1. Auth
- [ ] **Register**: create a new account (display name, email, location autocomplete, password ≥ 8). ✅ lands signed-in on Home.
- [ ] Register with an **existing email** → ✅ "Email already registered".
- [ ] Register with a **bad email / short password / blank location** → ✅ inline validation error, no account created.
- [ ] **Location autocomplete**: type a city → ✅ suggestions appear; ↑/↓ + Enter selects; free text is allowed.
- [ ] **Login** with correct credentials → ✅ Home. With wrong password → ✅ "Invalid email or password".
- [ ] **Session persists**: refresh the page → ✅ still signed in.
- [ ] **Logout** (if exposed) / clearing session → ✅ redirected to Login; protected pages bounce to Login.
- [ ] Open a protected URL (e.g. `/closets`) while logged out → ✅ redirected to Login.

## 2. Profile & settings
- [ ] Settings → **Profile**: change Location, Save → ✅ "Location updated."
- [ ] Add a new item afterwards → ✅ Location field pre-fills with the saved profile location.

## 3. Add / edit an item
- [ ] **Add** (+ in nav): page header reads **"Add"**.
- [ ] **Photos**: the "Add" tile dashed border is clearly visible; upload 1–3 photos → ✅ thumbnails appear, each removable.
- [ ] Submit with **no photo** → ✅ "Please add at least one photo."
- [ ] Submit with **no name / no category / no condition** → ✅ matching validation message.
- [ ] **Category-driven attributes**: pick *Bangle* → ✅ Size/Metal/Colour appear. Switch to *Earring* → ✅ Size disappears and clears.
- [ ] **Condition**: pick < 5 stars → ✅ the optional condition-note field appears.
- [ ] **Set**: choose "Create new set", name it → ✅ saved item is linked to the set.
- [ ] **Visibility = Private** → save → ✅ only you can see it.
- [ ] **Visibility = My closets** with no closet selected → ✅ blocked ("Pick at least one closet…").
- [ ] **Visibility = Public** → save → ✅ visible to everyone.
- [ ] **Edit** an item → change name/visibility/photos → Save changes → ✅ detail reflects the edit.
- [ ] **Inline closet create** from the visibility picker → ✅ new closet created and auto-selected without losing the form.

## 4. Browse / search / filter (Home)
- [ ] Header reads **"Discover"**; grid shows visible items.
- [ ] **Search** by name → ✅ list narrows (debounced); `?q=` appears in the URL.
- [ ] **Scope** dropdown: All visible / Public / Just mine / a specific closet → ✅ list changes; `?scope=` in URL.
- [ ] **Filters** sheet: pick Category, then Metal/Type/Size/Colour (only applicable ones show) → "Show results" → ✅ grid filters; active filters show as removable chips; "Clear all" resets.
- [ ] Empty search → ✅ graceful empty-state copy (no crash).
- [ ] Item card shows location and, for closet-shared items, a closet label / shared icon.

## 5. Item detail + image lightbox  *(recently added)*
- [ ] Open an item → hero photo, title, owner ("Shared by …"), location, condition stars, attribute chips.
- [ ] **Tap the hero photo** → ✅ full-screen lightbox opens, image fit-to-screen.
- [ ] Multi-photo item: ✅ counter "n / m", swipe left/right changes photo, on-screen arrows work, thumbnail strip highlights current.
- [ ] **Close** via ✕, tap on the backdrop, and (desktop) Esc → ✅ closes; hero shows the last-viewed photo.
- [ ] On iPhone: ✅ the close button clears the notch and the thumbnail strip clears the home indicator.
- [ ] Owner view shows **Edit / Delete** and the "Visible to:" line; non-owner shows **Ask to borrow**.
- [ ] Item that's part of a **set** → "Part of a set — view all" link opens the set; set page lists its pieces.

## 6. Closets
- [ ] **Closets** tab: "My closet" tile pinned first ("Yours"); each closet tile shows a colour + item count; dashed "New closet" tile present.
- [ ] **Create** a closet inline → ✅ opens the new closet.
- [ ] **My closet** → ✅ shows items you own; search/filter within it works.
- [ ] **Closet view**: rename (owner only), member summary card, "Items in this closet" with **Add items**.
- [ ] **Add items** sheet → select your non-public items → Add → ✅ they appear in the closet.
- [ ] A **Public** item you own → ✅ automatically appears in every closet you're in (no need to add).
- [ ] Friend who is a member → ✅ sees the closet and its items; non-members → ✅ cannot.

## 7. Invite links & joining  *(core recent feature)*
**Owner side (Members sheet):**
- [ ] Open Members → no email field; **Invite link** section present.
- [ ] "Create invite link" → ✅ link appears with **Copy** and **Share**, note "Anyone with this link can join", and an "expires in …" label (~72h).
- [ ] **Reset** → ✅ a new link is minted (old one stops working — verify by trying the old link).
- [ ] **Turn off** → ✅ link removed; opening it shows "Link unavailable".
- [ ] Copy the link; confirm it's `https://<host>/join/<token>`.

**Joiner side — three paths:**
- [ ] **Already logged in** (Friend, in the app): open the link → ✅ joins instantly and lands in the closet.
- [ ] **Logged out, has an account**: open the link → ✅ "Join {closet}" screen → "Log in to join" → after login, ✅ joined + in the closet.
- [ ] **No account**: open the link → "Create account to join" → register → ✅ joined + in the closet.
- [ ] After a join, **Owner gets a push**: "{name} has joined your {closet}".
- [ ] Open an **expired/disabled** link → ✅ "Link unavailable", no crash.
- [ ] Re-using a valid link from a second person → ✅ they also join (multi-use).

**iOS specifics:**
- [ ] Tapping the link on iPhone opens it (in Safari, expected) → completing login/register there → ✅ "You're in!" success screen with "View the closet" + the "open from Home Screen" nudge.
- [ ] Reopen the installed PWA from the Home Screen → ✅ the closet is there (membership persisted server-side).

## 8. Bookings (loan requests)
- [ ] As Friend, open an item you don't own → **Ask to borrow**.
- [ ] Calendar: ✅ past days and already-booked days are greyed out; pick a start then end → range shows; add an optional note → **Send request**.
- [ ] Picking an end **before** the start, or no dates → ✅ blocked with a clear message.
- [ ] Owner gets a **push**: "New loan request".
- [ ] Owner → **Requests → Incoming** → sees it as "Pending".
- [ ] Friend → **Requests → My requests** → sees it as "Pending"; can **Cancel request** while pending.
- [ ] Owner **Accepts** → ✅ status "Accepted", a chat opens with the auto message "✅ I've accepted your loan request for …"; Friend gets a push.
- [ ] Owner **Declines** another request → ✅ status "Declined"; requester gets a push.
- [ ] Try to book a range overlapping an **already-accepted** booking → ✅ blocked ("no longer available").
- [ ] Empty states on both tabs read correctly when there are no requests.

## 9. Messaging
- [ ] **Messages** tab lists conversations (item thumbnail, other person, last message, time, unread badge).
- [ ] Open a thread → send a message → ✅ appears immediately; other user receives a **push** ("{sender}") and sees it.
- [ ] Unread badge on the **Messages** nav icon increments for the recipient and clears when they open the thread.
- [ ] **Composer sits above the home indicator** on iPhone (not flush to the bottom edge).
- [ ] Tapping the item name/thumbnail in the header → opens that item.

## 10. Notifications & PWA
- [ ] **Enable notifications** (Settings or the in-thread prompt) → grant permission → ✅ "enabled on this device"; "Send test notification" delivers a test push.
- [ ] Settings diagnostics show correct states (This browser / Server push / Permission / This device / device count).
- [ ] **Admin** account → Settings shows the "Who has notifications on" card; non-admin → card hidden; `/notifications/admin/overview` 403 for non-admin (covered by the script too).
- [ ] **Install prompt**: on Android/Chromium → "Install" works; on iOS → shows the Share → Add to Home Screen hint; dismiss hides it.
- [ ] **Update prompt**: deploy a new build, reopen the app → ✅ "Update available" → "Update now" reloads into the new version.
- [ ] **Offline indicator**: turn off network → ✅ "You're offline…" banner; restore → ✅ "Back online!".
- [ ] Installed PWA launches standalone (no browser chrome); icons/splash look right.

## 11. Visibility / permissions matrix (spot-check)
| Item visibility | Owner | Member of its closet | Everyone else |
|---|---|---|---|
| Private | sees | hidden | hidden |
| My closets | sees | sees | hidden |
| Public | sees | sees | sees |
- [ ] Verify each cell with a real item (the script also asserts this at the API level).
- [ ] A hidden item opened by direct URL → ✅ "This item couldn't be found." (no leak).

## 12. Cross-cutting UI checks
- [ ] Safe areas: bottom nav, message composer, all bottom sheets (Members, Add items, Filters, Loan request) and the lightbox clear the iPhone home indicator and notch.
- [ ] Bottom sheets close on backdrop tap and the ✕; content scrolls if long.
- [ ] Long names/locations truncate rather than overflow.
- [ ] Light/dark device theme (if applicable) renders legibly.
- [ ] Back navigation behaves (item → back returns to the previous list/scroll).
- [ ] No raw error screens; the global error boundary shows "Something went wrong / Reload" only on real crashes.

## 13. Data integrity / edge cases
- [ ] Disband a closet (owner) → ✅ items shared only to it stop showing for former members; owner's own items remain.
- [ ] Remove a member (owner) → ✅ they lose access to closet-only items.
- [ ] Leave a closet (member) → ✅ removed; can be re-invited via a link.
- [ ] Delete an item that's in a set / a closet → ✅ no dangling references; set/closet still load.
- [ ] Legacy `/circles` and `/circles/:id` URLs → ✅ redirect to `/closets`.

---

### Suggested cadence
- **Every deploy:** Section 0 + `api-regression.mjs`.
- **Touching closets/invites/bookings/messaging:** the script + Sections 7–9.
- **Touching UI/PWA/lightbox/layout:** Sections 5, 10, 12.
- **Before a release:** the whole document.
