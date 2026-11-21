/* =========================================================
   CODOLIO — turns one public Codolio profile into the small
   summary the practice board draws. Shared by the browser
   (live refresh) and scripts/sync-codolio.mjs (the snapshot
   bundled at build time). Only public coding stats are kept;
   nothing personal from the profile is stored.
   ========================================================= */

export const CODOLIO_USER = 'Uttkarshchambiyal';
export const CODOLIO_PROFILE = `https://codolio.com/profile/${encodeURIComponent(CODOLIO_USER)}`;
export const CODOLIO_API = `https://api.codolio.com/profile?userKey=${encodeURIComponent(CODOLIO_USER)}`;

// Known platforms: display name, public profile link, and whether it is a contest judge
const PLATFORMS = {
  leetcode: { name: 'LeetCode', url: (h) => `https://leetcode.com/u/${h}/` },
  geeksforgeeks: { name: 'GeeksforGeeks', url: (h) => `https://www.geeksforgeeks.org/user/${h}/` },
  codeforces: { name: 'Codeforces', url: (h) => `https://codeforces.com/profile/${h}`, cp: true },
  codechef: { name: 'CodeChef', url: (h) => `https://www.codechef.com/users/${h}`, cp: true },
  atcoder: { name: 'AtCoder', url: (h) => `https://atcoder.jp/users/${h}`, cp: true },
  hackerrank: { name: 'HackerRank', url: (h) => `https://www.hackerrank.com/profile/${h}` },
};

// Each platform tags topics its own way; fold them into one vocabulary
const TOPICS = {
  array: 'Arrays', arrays: 'Arrays',
  math: 'Math', maths: 'Math', mathematical: 'Math',
  string: 'Strings', strings: 'Strings',
  hashmapandset: 'Hashing', hashtable: 'Hashing', hashing: 'Hashing', hash: 'Hashing',
  bitmanipulation: 'Bit manipulation', bitmagic: 'Bit manipulation', bitmasks: 'Bit manipulation', binaryrepresentation: 'Bit manipulation',
  twopointers: 'Two pointers', twopointeralgorithm: 'Two pointers',
  sorting: 'Sorting', sortings: 'Sorting',
  greedy: 'Greedy', greedyalgorithms: 'Greedy',
  dp: 'Dynamic programming', dynamicprogramming: 'Dynamic programming',
  linkedlist: 'Linked lists', linkedlists: 'Linked lists',
  binarysearch: 'Binary search',
  queueandstacks: 'Stacks & queues', stack: 'Stacks & queues', queue: 'Stacks & queues', monotonicstack: 'Stacks & queues',
  numbertheory: 'Number theory', primenumber: 'Number theory',
  slidingwindow: 'Sliding window', prefixsum: 'Prefix sum',
  divideandconquer: 'Divide & conquer', bruteforce: 'Brute force',
  tree: 'Trees', trees: 'Trees', binarytree: 'Trees', graph: 'Graphs', graphs: 'Graphs',
};
// Tags that name a language or a catch-all bucket rather than a topic
const SKIP = new Set(['algorithms', 'misc', 'special', 'cpp', 'stl', 'operators', 'c', 'java', 'python', 'numbers']);

const num = (v) => (Number.isFinite(+v) && +v > 0 ? Math.round(+v) : 0);
const humanize = (s) => { const t = String(s).replace(/[-_]+/g, ' ').trim(); return t.charAt(0).toUpperCase() + t.slice(1); };

export function summarize(json) {
  const list = json?.data?.platformProfiles?.platformProfiles;
  if (!Array.isArray(list)) return null;

  const platforms = [];
  const diff = { easy: 0, medium: 0, hard: 0, fundamentals: 0, competitive: 0 };
  const from = { fundamentals: new Set(), competitive: new Set() };
  const topics = new Map();
  const calendar = {};
  const badges = [];
  const certificates = [];
  const languages = new Set();
  const contestsOn = new Set();
  let contests = 0;

  list.forEach((p) => {
    const key = String(p?.platform || '').toLowerCase();
    if (!key) return;
    const meta = PLATFORMS[key] || { name: humanize(key) };
    const handle = String(p.userStats?.handle || '');
    const q = p.totalQuestionStats || {};
    const solved = num(q.totalQuestionCounts);
    const easy = num(q.easyQuestionCounts);
    const medium = num(q.mediumQuestionCounts);
    const hard = num(q.hardQuestionCounts);
    const basics = num(q.basicQuestionCounts) + num(q.schoolQuestionCounts);

    // Same split Codolio uses: fundamentals, DSA by difficulty, competitive programming
    const known = easy + medium + hard + basics;
    if (known) {
      diff.easy += easy; diff.medium += medium; diff.hard += hard;
      const rest = basics + Math.max(0, solved - known);
      if (rest) { diff.fundamentals += rest; from.fundamentals.add(meta.name); }
    } else if (solved) {
      const types = p.platformDetails?.types || [];
      const cp = meta.cp ?? (types.includes('CP') && !types.includes('DSA'));
      diff[cp ? 'competitive' : 'fundamentals'] += solved;
      from[cp ? 'competitive' : 'fundamentals'].add(meta.name);
    }

    const ran = (p.contestActivityStats?.contestActivityList || []).length;
    if (ran) { contests += ran; contestsOn.add(meta.name); }

    platforms.push({
      key, name: meta.name, handle, solved, contests: ran,
      url: handle && meta.url ? meta.url(encodeURIComponent(handle)) : CODOLIO_PROFILE,
    });

    const daily = p.dailyActivityStatsResponse || {};
    const tags = p.topicAnalysisStats?.topicWiseDistribution || daily.topicWiseDistribution || {};
    Object.entries(tags).forEach(([tag, n]) => {
      const k = String(tag).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!k || SKIP.has(k) || !num(n)) return;
      const name = TOPICS[k] || humanize(tag);
      topics.set(name, (topics.get(name) || 0) + num(n));
    });

    Object.entries(daily.submissionCalendar || {}).forEach(([ts, n]) => {
      const t = +ts * 1000;
      if (!Number.isFinite(t) || !num(n)) return;
      const day = new Date(t).toISOString().slice(0, 10);
      calendar[day] = (calendar[day] || 0) + num(n);
    });

    (p.badgeStats?.badgeList || []).forEach((b) => {
      const name = b?.displayName || b?.name;
      if (name) badges.push({ name: String(name), platform: meta.name });
    });
    (p.certificateStats?.certificates || []).forEach((c) => {
      if (c?.name) certificates.push({ name: String(c.name), platform: meta.name });
    });
    (p.userStats?.languageList || []).forEach((l) => l && languages.add(String(l)));
  });

  const total = platforms.reduce((s, p) => s + p.solved, 0);
  if (!total) return null;
  platforms.sort((a, b) => b.solved - a.solved);

  const days = Object.keys(calendar).sort();
  let maxStreak = 0; let run = 0; let prev = null;
  days.forEach((d) => {
    const t = Date.parse(d);
    run = prev !== null && t - prev === 864e5 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
    prev = t;
  });
  const sortedCalendar = Object.fromEntries(days.map((d) => [d, calendar[d]]));

  return {
    user: CODOLIO_USER,
    total,
    platforms,
    difficulty: { ...diff, fundamentalsFrom: [...from.fundamentals], competitiveFrom: [...from.competitive] },
    topics: [...topics].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    calendar: sortedCalendar,
    activeDays: days.length,
    submissions: days.reduce((s, d) => s + calendar[d], 0),
    maxStreak,
    firstDay: days[0] || null,
    contests,
    contestsOn: [...contestsOn],
    badges,
    certificates,
    languages: [...languages],
  };
}
