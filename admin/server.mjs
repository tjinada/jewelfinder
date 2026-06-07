// =============================================================================
// The Clasp — Admin Analytics (standalone, read-only)
// =============================================================================
// A tiny on-demand dashboard. Native Node http server (no web framework — the
// only dependency is the official `mongodb` driver) plus a single static HTML
// page served from ./public.
//
// READ-ONLY BY DESIGN: every database call below is a count or an aggregation.
// There are no writes anywhere in this file. It deliberately does NOT import the
// backend's Mongoose models — it talks to the collections directly so it stays
// fully decoupled from the running app.
// =============================================================================
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://jewel-mongo:27017/jewel-finder';

const client = new MongoClient(MONGO_URI);
let db;
// Mongoose pluralizes the Jewelry model to "jewelry" or "jewelries" depending
// on version. Discover it at runtime the same way scripts/clean-regression.sh
// does, rather than hardcoding. All other collection names are stable.
let jewelryCollection = 'jewelries';

async function init() {
  await client.connect();
  db = client.db(); // db name comes from the connection string (/jewel-finder)
  const names = (await db.listCollections().toArray()).map((c) => c.name);
  jewelryCollection = names.find((n) => /^jewel/i.test(n)) || 'jewelries';
  console.log(`Connected to "${db.databaseName}". Jewelry collection: ${jewelryCollection}`);
}

// ---- helpers ---------------------------------------------------------------

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Group a collection by a single field, returning [{ key, count }] desc.
async function groupCounts(coll, field) {
  const rows = await coll
    .aggregate([
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  return rows.map((r) => ({ key: r._id ?? null, count: r.count }));
}

// Daily document counts since `since`, keyed 'YYYY-MM-DD' (UTC).
async function dailyCounts(coll, since) {
  return coll
    .aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
}

// Turn a daily-count aggregation into a zero-filled series for the last N days,
// so the frontend can plot a continuous axis without gap-handling.
function fillSeries(rows, days) {
  const byDate = new Map(rows.map((r) => [r._id, r.count]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgo(i).toISOString().slice(0, 10);
    out.push({ date, count: byDate.get(date) || 0 });
  }
  return out;
}

// ---- the one and only data query -------------------------------------------

async function computeStats() {
  const d7 = daysAgo(7);
  const d30 = daysAgo(30);

  const users = db.collection('users');
  const jewelry = db.collection(jewelryCollection);
  const bookings = db.collection('bookings');
  const groups = db.collection('groups');
  const conversations = db.collection('conversations');
  const messages = db.collection('messages');

  const [
    usersTotal, usersNew7, usersNew30, usersActive7, usersActive30,
    usersGoogle, usersAdmin, usersPush,
    jewelryTotal, jewelryNew7, jewelryNew30,
    jewelryByCategory, jewelryByVisibility, jewelryByCondition,
    bookingsTotal, bookingsByStatus, avgLoanRows,
    closetsTotal, closetMemberRows, itemsSharedToClosets,
    threadsTotal, messagesTotal, messages7, messages30,
    signupSeries, bookingSeries, itemSeries, messageSeries,
  ] = await Promise.all([
    // users
    users.countDocuments({}),
    users.countDocuments({ createdAt: { $gte: d7 } }),
    users.countDocuments({ createdAt: { $gte: d30 } }),
    users.countDocuments({ lastSeen: { $gte: d7 } }),
    users.countDocuments({ lastSeen: { $gte: d30 } }),
    users.countDocuments({ googleId: { $exists: true, $ne: null } }),
    users.countDocuments({ isAdmin: true }),
    users.countDocuments({ 'pushSubscriptions.0': { $exists: true } }),
    // jewelry
    jewelry.countDocuments({}),
    jewelry.countDocuments({ createdAt: { $gte: d7 } }),
    jewelry.countDocuments({ createdAt: { $gte: d30 } }),
    groupCounts(jewelry, 'category'),
    groupCounts(jewelry, 'visibility'),
    groupCounts(jewelry, 'condition'),
    // bookings
    bookings.countDocuments({}),
    groupCounts(bookings, 'status'),
    bookings
      .aggregate([
        {
          $addFields: {
            _s: { $dateFromString: { dateString: '$startDate', onError: null } },
            _e: { $dateFromString: { dateString: '$endDate', onError: null } },
          },
        },
        {
          $addFields: {
            _len: {
              $cond: [
                { $and: ['$_s', '$_e'] },
                { $dateDiff: { startDate: '$_s', endDate: '$_e', unit: 'day' } },
                null,
              ],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: '$_len' } } },
      ])
      .toArray(),
    // closets (stored as `groups` — frozen identifier)
    groups.countDocuments({}),
    groups
      .aggregate([
        { $group: { _id: null, avg: { $avg: { $size: { $ifNull: ['$members', []] } } } } },
      ])
      .toArray(),
    jewelry.countDocuments({ visibility: 'groups' }),
    // messaging
    conversations.countDocuments({}),
    messages.countDocuments({}),
    messages.countDocuments({ createdAt: { $gte: d7 } }),
    messages.countDocuments({ createdAt: { $gte: d30 } }),
    // 30-day trends
    dailyCounts(users, d30),
    dailyCounts(bookings, d30),
    dailyCounts(jewelry, d30),
    dailyCounts(messages, d30),
  ]);

  const statusMap = Object.fromEntries(bookingsByStatus.map((r) => [r.key, r.count]));
  const accepted = statusMap.accepted || 0;
  const rejected = statusMap.rejected || 0;
  const acceptanceRate = accepted + rejected > 0 ? accepted / (accepted + rejected) : null;

  return {
    generatedAt: new Date().toISOString(),
    database: db.databaseName,
    users: {
      total: usersTotal,
      new7: usersNew7,
      new30: usersNew30,
      active7: usersActive7,
      active30: usersActive30,
      googleLinked: usersGoogle,
      admins: usersAdmin,
      withPush: usersPush,
    },
    jewelry: {
      total: jewelryTotal,
      new7: jewelryNew7,
      new30: jewelryNew30,
      byCategory: jewelryByCategory,
      byVisibility: jewelryByVisibility,
      byCondition: jewelryByCondition,
    },
    bookings: {
      total: bookingsTotal,
      byStatus: bookingsByStatus,
      acceptanceRate, // accepted / (accepted + rejected); null if no decisions yet
      avgLoanDays: avgLoanRows[0]?.avg ?? null,
    },
    closets: {
      total: closetsTotal,
      avgMembers: closetMemberRows[0]?.avg ?? 0,
      itemsShared: itemsSharedToClosets,
    },
    messaging: {
      threads: threadsTotal,
      total: messagesTotal,
      last7: messages7,
      last30: messages30,
    },
    trends: {
      signups: fillSeries(signupSeries, 30),
      items: fillSeries(itemSeries, 30),
      bookings: fillSeries(bookingSeries, 30),
      messages: fillSeries(messageSeries, 30),
    },
  };
}

// ---- server ----------------------------------------------------------------

const server = createServer(async (req, res) => {
  try {
    const path = (req.url || '/').split('?')[0];

    if (path === '/api/stats') {
      const stats = await computeStats();
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(stats));
      return;
    }

    if (path === '/healthz') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok');
      return;
    }

    if (path === '/' || path === '/index.html') {
      const html = await readFile(join(__dirname, 'public', 'index.html'), 'utf8');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'internal', message: String(err?.message || err) }));
  }
});

init()
  .then(() => server.listen(PORT, () => console.log(`The Clasp — admin analytics on :${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
