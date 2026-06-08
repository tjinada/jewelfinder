#!/usr/bin/env node
/**
 * scripts/api-regression.mjs
 *
 * End-to-end API regression for The Clasp. Hits the running backend over HTTP,
 * exercises the core flows (auth, closets + invite/join links + membership,
 * jewelry + visibility gating + sharing, bookings, conversations, sets,
 * notifications, permissions) and
 * prints a pass/fail line per check. Exits non-zero if anything fails, so it's
 * CI-friendly.
 *
 * It needs no test framework and no real image uploads (the API accepts image
 * filenames as plain strings). Each run uses fresh, unique emails, so it's
 * safe to run repeatedly; it cleans up the closet/items it creates at the end.
 *
 * Requirements: Node 18+ (uses global fetch).
 *
 * Usage:
 *   BASE_URL=https://your-clasp-host node scripts/api-regression.mjs
 *   node scripts/api-regression.mjs https://your-clasp-host
 *   node scripts/api-regression.mjs            # defaults to http://localhost:3000
 *
 * BASE_URL is the site origin (NOT including /api).
 */

const BASE_URL = (process.env.BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const API = `${BASE_URL}/api`;

const GREEN = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', BOLD = '\x1b[1m', RESET = '\x1b[0m';
let passed = 0, failed = 0;
const failures = [];

function section(title) { console.log(`\n${BOLD}${title}${RESET}`); }
function check(name, cond, info = '') {
  if (cond) { passed++; console.log(`  ${GREEN}✓${RESET} ${name}`); }
  else { failed++; failures.push(name); console.log(`  ${RED}✗${RESET} ${name}${info ? ` ${DIM}— ${info}${RESET}` : ''}`); }
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    return { status: 0, data: null, networkError: String(e) };
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

const ok = (r) => r.status >= 200 && r.status < 300 && r.data && r.data.status === 'success';
const payload = (r) => (r.data && typeof r.data === 'object' ? r.data.data : undefined);
const errMsg = (r) => (r.data && r.data.message) || r.networkError || `HTTP ${r.status}`;

function isoPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const stamp = Date.now();
const pw = 'password123';
const mkEmail = (who) => `regress+${who}.${stamp}@example.com`;

async function main() {
  console.log(`${BOLD}The Clasp — API regression${RESET}`);
  console.log(`${DIM}Target: ${API}${RESET}`);

  // ---- Health -------------------------------------------------------------
  section('Health');
  const health = await req('GET', '/health');
  check('GET /health returns ok', ok(health) && payload(health)?.status === 'ok', errMsg(health));
  if (health.status === 0) {
    console.log(`\n${RED}Cannot reach ${API} — is the server up and BASE_URL correct?${RESET}`);
    process.exit(1);
  }

  // ---- Auth ---------------------------------------------------------------
  section('Auth');
  const regA = await req('POST', '/auth/register', {
    body: { email: mkEmail('owner'), password: pw, displayName: 'Owner A', location: 'Whitby, ON' },
  });
  const tokenA = payload(regA)?.token;
  check('Register user A', ok(regA) && !!tokenA, errMsg(regA));

  const regB = await req('POST', '/auth/register', {
    body: { email: mkEmail('joiner'), password: pw, displayName: 'Joiner B', location: 'Toronto, ON' },
  });
  const tokenB = payload(regB)?.token;
  const emailB = payload(regB)?.user?.email;
  check('Register user B', ok(regB) && !!tokenB, errMsg(regB));

  const regC = await req('POST', '/auth/register', {
    body: { email: mkEmail('outsider'), password: pw, displayName: 'Outsider C', location: 'Ottawa, ON' },
  });
  const tokenC = payload(regC)?.token;
  check('Register user C', ok(regC) && !!tokenC, errMsg(regC));

  const regD = await req('POST', '/auth/register', {
    body: { email: mkEmail('member'), password: pw, displayName: 'Member D', location: 'Barrie, ON' },
  });
  const tokenD = payload(regD)?.token;
  check('Register user D', ok(regD) && !!tokenD, errMsg(regD));

  const dupe = await req('POST', '/auth/register', {
    body: { email: emailB, password: pw, displayName: 'Dupe', location: 'X' },
  });
  check('Duplicate email rejected (400)', dupe.status === 400, `got ${dupe.status}`);

  const badReg = await req('POST', '/auth/register', {
    body: { email: 'not-an-email', password: 'short', displayName: '', location: '' },
  });
  check('Invalid register payload rejected (400)', badReg.status === 400, `got ${badReg.status}`);

  const me = await req('GET', '/auth/me', { token: tokenA });
  check('GET /auth/me returns the signed-in user', ok(me) && !!payload(me)?.user?.email, errMsg(me));

  const meNoToken = await req('GET', '/auth/me');
  check('GET /auth/me without token is 401', meNoToken.status === 401, `got ${meNoToken.status}`);

  const meBadToken = await req('GET', '/auth/me', { token: 'garbage.token.value' });
  check('GET /auth/me with bad token is 401', meBadToken.status === 401, `got ${meBadToken.status}`);

  const badLogin = await req('POST', '/auth/login', { body: { email: emailB, password: 'wrongpass' } });
  check('Login with wrong password is 401', badLogin.status === 401, `got ${badLogin.status}`);

  const goodLogin = await req('POST', '/auth/login', { body: { email: emailB, password: pw } });
  check('Login with correct password succeeds', ok(goodLogin) && !!payload(goodLogin)?.token, errMsg(goodLogin));

  if (!tokenA || !tokenB || !tokenC || !tokenD) {
    console.log(`\n${RED}Auth failed — cannot continue.${RESET}`);
    finish();
  }

  // ---- Closets + invite/join links ---------------------------------------
  section('Closets & invite links');
  const mkCloset = await req('POST', '/groups', { token: tokenA, body: { name: `Test Closet ${stamp}` } });
  const closetId = payload(mkCloset)?._id;
  check('Owner creates a closet', ok(mkCloset) && !!closetId, errMsg(mkCloset));

  const listA = await req('GET', '/groups', { token: tokenA });
  check('Owner sees the closet in their list', ok(listA) && payload(listA)?.some((c) => c._id === closetId), errMsg(listA));

  const linkEmpty = await req('GET', `/groups/${closetId}/join-link`, { token: tokenA });
  check('No active join link initially (token null)', ok(linkEmpty) && payload(linkEmpty)?.token === null, JSON.stringify(payload(linkEmpty)));

  const mkLink = await req('POST', `/groups/${closetId}/join-link`, { token: tokenA });
  const joinToken = payload(mkLink)?.token;
  check('Owner mints a join link', ok(mkLink) && !!joinToken && !!payload(mkLink)?.expiresAt, errMsg(mkLink));

  const bGuard = await req('POST', `/groups/${closetId}/join-link`, { token: tokenB });
  check('Non-owner cannot mint a link (403)', bGuard.status === 403, `got ${bGuard.status}`);

  const resolve = await req('GET', `/groups/join/${joinToken}`); // public, no token
  check('Public resolve shows closet context', ok(resolve) && payload(resolve)?.closetName && payload(resolve)?.expired === false, errMsg(resolve));

  const join = await req('POST', `/groups/join/${joinToken}`, { token: tokenB });
  check('User B joins via the link', ok(join) && payload(join)?.closetId === closetId, errMsg(join));

  const listBAfter = await req('GET', '/groups', { token: tokenB });
  check('User B now sees the closet', ok(listBAfter) && payload(listBAfter)?.some((c) => c._id === closetId), errMsg(listBAfter));

  const joinAgain = await req('POST', `/groups/join/${joinToken}`, { token: tokenB });
  check('Re-joining is idempotent (no error)', ok(joinAgain) && payload(joinAgain)?.closetId === closetId, errMsg(joinAgain));

  const renameClo = await req('PATCH', `/groups/${closetId}`, { token: tokenA, body: { name: `Renamed Closet ${stamp}` } });
  check('Owner renames the closet', ok(renameClo) && payload(renameClo)?.name === `Renamed Closet ${stamp}`, errMsg(renameClo));

  const renameGuard = await req('PATCH', `/groups/${closetId}`, { token: tokenB, body: { name: 'Nope' } });
  check('Non-owner cannot rename the closet (403)', renameGuard.status === 403, `got ${renameGuard.status}`);

  const detailMember = await req('GET', `/groups/${closetId}`, { token: tokenB });
  check('Member can open closet detail', ok(detailMember) && Array.isArray(payload(detailMember)?.members), errMsg(detailMember));

  const detailOutsider = await req('GET', `/groups/${closetId}`, { token: tokenC });
  check('Non-member cannot open closet detail (403)', detailOutsider.status === 403, `got ${detailOutsider.status}`);

  const joinD = await req('POST', `/groups/join/${joinToken}`, { token: tokenD });
  check('User D joins via the link', ok(joinD) && payload(joinD)?.closetId === closetId, errMsg(joinD));

  const disableLink = await req('DELETE', `/groups/${closetId}/join-link`, { token: tokenA });
  check('Owner turns the link off (204)', disableLink.status === 204, `got ${disableLink.status}`);

  const resolveAfter = await req('GET', `/groups/join/${joinToken}`);
  check('Disabled link no longer resolves (404)', resolveAfter.status === 404, `got ${resolveAfter.status}`);

  const joinAfter = await req('POST', `/groups/join/${joinToken}`, { token: tokenC });
  check('Disabled link cannot be used to join (404)', joinAfter.status === 404, `got ${joinAfter.status}`);

  // ---- Jewelry + visibility gating ---------------------------------------
  section('Jewelry & visibility');
  const baseItem = { category: 'earring', images: ['regress.webp'], condition: 5 };
  const mkPriv = await req('POST', '/jewelry', { token: tokenA, body: { ...baseItem, name: 'Private Earrings', visibility: 'private' } });
  const privId = payload(mkPriv)?._id;
  check('Create PRIVATE item', ok(mkPriv) && !!privId, errMsg(mkPriv));

  const mkGrp = await req('POST', '/jewelry', { token: tokenA, body: { ...baseItem, name: 'Closet Earrings', visibility: 'groups', sharedGroups: [closetId] } });
  const grpId = payload(mkGrp)?._id;
  check('Create GROUPS item shared to the closet', ok(mkGrp) && !!grpId, errMsg(mkGrp));

  const noImg = await req('POST', '/jewelry', { token: tokenA, body: { name: 'No Photo', category: 'earring', images: [], condition: 5 } });
  check('Item with no photos rejected (400)', noImg.status === 400, `got ${noImg.status}`);

  const badCond = await req('POST', '/jewelry', { token: tokenA, body: { ...baseItem, name: 'Bad Condition', condition: 6 } });
  check('Condition out of range rejected (400)', badCond.status === 400, `got ${badCond.status}`);

  const badAttr = await req('POST', '/jewelry', { token: tokenA, body: { ...baseItem, name: 'Wrong Attr', size: '2.4' } });
  check('Attribute not applicable to category rejected (400)', badAttr.status === 400, `got ${badAttr.status}`);

  const listAItems = await req('GET', '/jewelry', { token: tokenA });
  const aIds = (payload(listAItems) || []).map((i) => i._id);
  check('Owner sees their private and groups items', [privId, grpId].every((id) => aIds.includes(id)), JSON.stringify(aIds));

  const listBItems = await req('GET', '/jewelry', { token: tokenB });
  const bIds = (payload(listBItems) || []).map((i) => i._id);
  check('B (member) sees the GROUPS item', bIds.includes(grpId));
  check('B does NOT see the PRIVATE item', !bIds.includes(privId));

  const cItems = await req('GET', '/jewelry', { token: tokenC });
  const cIds = (payload(cItems) || []).map((i) => i._id);
  check('C (non-member) sees neither the GROUPS nor PRIVATE item', !cIds.includes(grpId) && !cIds.includes(privId), JSON.stringify(cIds));

  const getPrivAsB = await req('GET', `/jewelry/${privId}`, { token: tokenB });
  check('B fetching the private item directly is hidden (404)', getPrivAsB.status === 404, `got ${getPrivAsB.status}`);

  const getGrpAsB = await req('GET', `/jewelry/${grpId}`, { token: tokenB });
  check('B can fetch the closet item directly', ok(getGrpAsB) && payload(getGrpAsB)?._id === grpId, errMsg(getGrpAsB));

  const getGrpAsC = await req('GET', `/jewelry/${grpId}`, { token: tokenC });
  check('C (non-member) fetching the closet item is hidden (404)', getGrpAsC.status === 404, `got ${getGrpAsC.status}`);

  // Editing visibility revokes access: flip a closet-shared item to private.
  const mkFlip = await req('POST', '/jewelry', { token: tokenA, body: { ...baseItem, name: 'Flip Earrings', visibility: 'groups', sharedGroups: [closetId] } });
  const flipId = payload(mkFlip)?._id;
  check('Create a shared item to edit', ok(mkFlip) && !!flipId, errMsg(mkFlip));

  const bSeesFlip = await req('GET', `/jewelry/${flipId}`, { token: tokenB });
  check('B can see it while shared to the closet', ok(bSeesFlip), errMsg(bSeesFlip));

  const flip = await req('PATCH', `/jewelry/${flipId}`, { token: tokenA, body: { ...baseItem, name: 'Flip Earrings', visibility: 'private' } });
  check('Owner edits it to private', ok(flip) && payload(flip)?.visibility === 'private', errMsg(flip));

  const bAfterFlip = await req('GET', `/jewelry/${flipId}`, { token: tokenB });
  check('B can no longer see it after the edit (404)', bAfterFlip.status === 404, `got ${bAfterFlip.status}`);

  // ---- Bookings -----------------------------------------------------------
  section('Bookings');
  const start = isoPlus(7), end = isoPlus(8);
  const ownBooking = await req('POST', '/bookings', { token: tokenA, body: { item: grpId, startDate: start, endDate: end } });
  check('Owner cannot request their own item (400)', ownBooking.status === 400, `got ${ownBooking.status}`);

  const pastBooking = await req('POST', '/bookings', { token: tokenB, body: { item: grpId, startDate: isoPlus(-3), endDate: isoPlus(-1) } });
  check('Booking with a past start date rejected (400)', pastBooking.status === 400, `got ${pastBooking.status}`);

  const hiddenBooking = await req('POST', '/bookings', { token: tokenC, body: { item: privId, startDate: start, endDate: end } });
  check('Cannot request an item you cannot see (404)', hiddenBooking.status === 404, `got ${hiddenBooking.status}`);

  const booking = await req('POST', '/bookings', { token: tokenB, body: { item: grpId, startDate: start, endDate: end, note: 'Regression test note' } });
  const bookingId = payload(booking)?._id;
  check('B requests to borrow the closet item', ok(booking) && !!bookingId && payload(booking)?.status === 'pending', errMsg(booking));

  const incoming = await req('GET', '/bookings/incoming', { token: tokenA });
  check('Owner sees the request under Incoming', ok(incoming) && payload(incoming)?.some((b) => b._id === bookingId), errMsg(incoming));

  const outgoing = await req('GET', '/bookings/outgoing', { token: tokenB });
  check('B sees the request under My requests', ok(outgoing) && payload(outgoing)?.some((b) => b._id === bookingId), errMsg(outgoing));

  const accept = await req('PATCH', `/bookings/${bookingId}/decision`, { token: tokenA, body: { action: 'accept' } });
  const convoId = payload(accept)?.conversation;
  check('Owner accepts the request', ok(accept) && payload(accept)?.status === 'accepted', errMsg(accept));
  check('Accepting creates a conversation', !!convoId, 'no conversation id on accepted booking');

  const ranges = await req('GET', `/bookings/item/${grpId}/ranges`, { token: tokenB });
  check('Accepted dates appear in the item ranges', ok(ranges) && payload(ranges)?.some((r) => r.startDate === start), errMsg(ranges));

  const decideAgain = await req('PATCH', `/bookings/${bookingId}/decision`, { token: tokenA, body: { action: 'reject' } });
  check('Already-handled request cannot be decided again (400)', decideAgain.status === 400, `got ${decideAgain.status}`);

  const overlap = await req('POST', '/bookings', { token: tokenD, body: { item: grpId, startDate: start, endDate: end } });
  check('Overlapping an accepted booking is rejected (409)', overlap.status === 409, `got ${overlap.status}`);

  const toReject = await req('POST', '/bookings', { token: tokenD, body: { item: grpId, startDate: isoPlus(20), endDate: isoPlus(21) } });
  const rejectId = payload(toReject)?._id;
  check('D requests a different range', ok(toReject) && !!rejectId, errMsg(toReject));
  const reject = await req('PATCH', `/bookings/${rejectId}/decision`, { token: tokenA, body: { action: 'reject' } });
  check('Owner rejects a pending request', ok(reject) && payload(reject)?.status === 'rejected', errMsg(reject));

  const toCancel = await req('POST', '/bookings', { token: tokenD, body: { item: grpId, startDate: isoPlus(30), endDate: isoPlus(31) } });
  const cancelId = payload(toCancel)?._id;
  check('D makes a request to cancel', ok(toCancel) && !!cancelId, errMsg(toCancel));
  const cancelGuard = await req('PATCH', `/bookings/${cancelId}/cancel`, { token: tokenC });
  check('Only the requester can cancel (403)', cancelGuard.status === 403, `got ${cancelGuard.status}`);
  const cancel = await req('PATCH', `/bookings/${cancelId}/cancel`, { token: tokenD });
  check('Requester cancels their pending request', ok(cancel) && payload(cancel)?.status === 'cancelled', errMsg(cancel));
  const cancelDone = await req('PATCH', `/bookings/${cancelId}/cancel`, { token: tokenD });
  check('A non-pending request cannot be cancelled (400)', cancelDone.status === 400, `got ${cancelDone.status}`);

  // ---- Conversations ------------------------------------------------------
  section('Conversations');
  if (convoId) {
    const convos = await req('GET', '/conversations', { token: tokenA });
    check('Owner sees the new conversation', ok(convos) && payload(convos)?.some((c) => c._id === convoId), errMsg(convos));

    const msgs1 = await req('GET', `/conversations/${convoId}/messages`, { token: tokenA });
    const list1 = msgList(payload(msgs1));
    check('Conversation has the auto-acceptance message', Array.isArray(list1) && list1.length >= 1, errMsg(msgs1));

    const send = await req('POST', `/conversations/${convoId}/messages`, { token: tokenB, body: { body: 'Thanks! Regression hello.' } });
    check('B can send a message', ok(send), errMsg(send));

    const msgs2 = await req('GET', `/conversations/${convoId}/messages`, { token: tokenA });
    const list2 = msgList(payload(msgs2));
    check('New message shows up in the thread', Array.isArray(list2) && list2.length > list1.length, errMsg(msgs2));

    const intruder = await req('GET', `/conversations/${convoId}/messages`, { token: tokenC });
    check('Non-participant cannot read the thread (403)', intruder.status === 403, `got ${intruder.status}`);

    const empty = await req('POST', `/conversations/${convoId}/messages`, { token: tokenB, body: { body: '   ' } });
    check('Empty message rejected (400)', empty.status === 400, `got ${empty.status}`);
  } else {
    check('Conversation tests skipped (no conversation id)', false);
  }

  // ---- Notifications ------------------------------------------------------
  section('Notifications');
  const status = await req('GET', '/notifications/status', { token: tokenA });
  check('Notification status returns config + device count', ok(status) && typeof payload(status)?.configured === 'boolean' && typeof payload(status)?.deviceCount === 'number', errMsg(status));

  const vapid = await req('GET', '/notifications/vapid-public-key', { token: tokenA });
  check('VAPID public key endpoint responds', ok(vapid) && 'publicKey' in (payload(vapid) || {}), errMsg(vapid));

  const test = await req('POST', '/notifications/test', { token: tokenA });
  check('Test notification endpoint responds', ok(test) && 'configured' in (payload(test) || {}), errMsg(test));

  const adminAsUser = await req('GET', '/notifications/admin/overview', { token: tokenA });
  check('Non-admin blocked from admin overview (403)', adminAsUser.status === 403, `got ${adminAsUser.status}`);

  // ---- Closet membership & sharing ---------------------------------------
  section('Closet membership & sharing');

  const scopeList = await req('GET', `/jewelry?scope=${closetId}`, { token: tokenB });
  check('Scope filter returns the closet-shared item', ok(scopeList) && (payload(scopeList) || []).some((i) => i._id === grpId), errMsg(scopeList));

  const mkShare = await req('POST', '/jewelry', { token: tokenA, body: { ...baseItem, name: 'Shared Later', visibility: 'private' } });
  const shareId = payload(mkShare)?._id;
  check('Create a private item to share', ok(mkShare) && !!shareId, errMsg(mkShare));
  const share = await req('POST', '/jewelry/share', { token: tokenA, body: { closetId, itemIds: [shareId] } });
  check('Owner shares it into the closet', ok(share) && payload(share)?.added === 1, errMsg(share));
  const bSeesShared = await req('GET', `/jewelry/${shareId}`, { token: tokenB });
  check('Member can now see the shared item', ok(bSeesShared), errMsg(bSeesShared));

  // Resolve member ids from the closet detail (robust to the user-id field name).
  const detail = await req('GET', `/groups/${closetId}`, { token: tokenA });
  const members = payload(detail)?.members || [];
  const idByEmail = (email) => (members.find((m) => m.email === email) || {})._id;
  const ownerMemberId = idByEmail(mkEmail('owner'));
  const memberDId = idByEmail(mkEmail('member'));

  const dSeesGrp = await req('GET', `/jewelry/${grpId}`, { token: tokenD });
  check('D (member) can see the closet item before removal', ok(dSeesGrp), errMsg(dSeesGrp));
  const removeGuard = await req('DELETE', `/groups/${closetId}/members/${memberDId}`, { token: tokenB });
  check('Non-owner cannot remove a member (403)', removeGuard.status === 403, `got ${removeGuard.status}`);
  const removeOwner = await req('DELETE', `/groups/${closetId}/members/${ownerMemberId}`, { token: tokenA });
  check('The owner cannot be removed (400)', removeOwner.status === 400, `got ${removeOwner.status}`);
  const removeD = await req('DELETE', `/groups/${closetId}/members/${memberDId}`, { token: tokenA });
  check('Owner removes member D', ok(removeD), errMsg(removeD));
  const dAfterRemove = await req('GET', `/jewelry/${grpId}`, { token: tokenD });
  check('D loses access to the closet item after removal (404)', dAfterRemove.status === 404, `got ${dAfterRemove.status}`);

  const ownerLeave = await req('POST', `/groups/${closetId}/leave`, { token: tokenA });
  check('Owner cannot leave their own closet (400)', ownerLeave.status === 400, `got ${ownerLeave.status}`);
  const outsiderLeave = await req('POST', `/groups/${closetId}/leave`, { token: tokenC });
  check('A non-member cannot leave (400)', outsiderLeave.status === 400, `got ${outsiderLeave.status}`);
  const bLeave = await req('POST', `/groups/${closetId}/leave`, { token: tokenB });
  check('Member B leaves the closet (204)', bLeave.status === 204, `got ${bLeave.status}`);
  const bAfterLeave = await req('GET', `/jewelry/${grpId}`, { token: tokenB });
  check('B loses access to the closet item after leaving (404)', bAfterLeave.status === 404, `got ${bAfterLeave.status}`);

  // ---- Sets ---------------------------------------------------------------
  section('Sets');
  const mkSet = await req('POST', '/sets', { token: tokenA, body: { name: `Test Set ${stamp}` } });
  const setId = payload(mkSet)?._id;
  check('Create a set', ok(mkSet) && !!setId, errMsg(mkSet));
  const setList = await req('GET', '/sets', { token: tokenA });
  check('Set appears in the owner list', ok(setList) && (payload(setList) || []).some((s) => s._id === setId), errMsg(setList));
  const setGet = await req('GET', `/sets/${setId}`, { token: tokenA });
  check('Set detail returns its items array', ok(setGet) && Array.isArray(payload(setGet)?.items), errMsg(setGet));
  const setRename = await req('PATCH', `/sets/${setId}`, { token: tokenA, body: { name: `Renamed Set ${stamp}` } });
  check('Owner renames the set', ok(setRename) && payload(setRename)?.name === `Renamed Set ${stamp}`, errMsg(setRename));
  const setRenameGuard = await req('PATCH', `/sets/${setId}`, { token: tokenB, body: { name: 'Nope' } });
  check('Non-owner cannot edit the set (403)', setRenameGuard.status === 403, `got ${setRenameGuard.status}`);
  const setDelGuard = await req('DELETE', `/sets/${setId}`, { token: tokenB });
  check('Non-owner cannot delete the set (403)', setDelGuard.status === 403, `got ${setDelGuard.status}`);
  const setDel = await req('DELETE', `/sets/${setId}`, { token: tokenA });
  check('Owner deletes the set (204)', setDel.status === 204, `got ${setDel.status}`);
  const setGone = await req('GET', `/sets/${setId}`, { token: tokenA });
  check('Deleted set is gone (404)', setGone.status === 404, `got ${setGone.status}`);

  // ---- Profile ------------------------------------------------------------
  section('Profile');
  const updateMe = await req('PATCH', '/auth/me', { token: tokenA, body: { location: 'Uxbridge, ON' } });
  check('Owner can update their location', ok(updateMe) && payload(updateMe)?.user?.location === 'Uxbridge, ON', errMsg(updateMe));

  // ---- Cleanup (best effort) ---------------------------------------------
  section('Cleanup (best effort)');
  for (const [name, id] of [['private', privId], ['groups', grpId], ['edited', flipId], ['shared', shareId]]) {
    if (!id) continue;
    const del = await req('DELETE', `/jewelry/${id}`, { token: tokenA });
    check(`Delete ${name} item`, del.status === 204 || ok(del), `got ${del.status}`);
  }
  if (closetId) {
    const delCloset = await req('DELETE', `/groups/${closetId}`, { token: tokenA });
    check('Disband test closet', delCloset.status === 204 || ok(delCloset), `got ${delCloset.status}`);
  }
  console.log(`  ${DIM}(test user accounts remain — remove with scripts/remove-user.sh if desired)${RESET}`);

  finish();
}

function msgList(p) {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  if (Array.isArray(p.messages)) return p.messages;
  return [];
}

function finish() {
  console.log(`\n${BOLD}Result:${RESET} ${GREEN}${passed} passed${RESET}, ${failed ? RED : DIM}${failed} failed${RESET}`);
  if (failed) {
    console.log(`${RED}Failed checks:${RESET}\n  - ${failures.join('\n  - ')}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`\n${RED}Unexpected error:${RESET}`, e);
  process.exit(1);
});
