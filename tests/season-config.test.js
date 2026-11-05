// Date-switching checks for season-config.js. No dependencies:
//   node tests/season-config.test.js
// Dates are passed in directly, so this needs no change to the clock or the site.
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'season-config.js'), 'utf8');

function load() {
  const window = { CFMSeason: { vals: () => ({ seasonState: 'unknown' }) } };
  vm.runInNewContext(source, { window, console, Intl, Date });
  return window.CFMSeason;
}

const S = load();
const vals = (date, settings = S.settings) => S.build(settings, date);
const clone = () => JSON.parse(JSON.stringify(S.settings));
const text = (v) => JSON.stringify(v);

function check(name, fn) {
  fn();
  console.log('ok  ' + name);
}

check('before opening day, the approved winter season is announced', () => {
  const v = vals('2026-11-05');
  assert.equal(v.seasonState, 'upcoming');
  assert.equal(v.statusLabel, 'Winter Market opens Saturday, November 7');
  assert.equal(v.showWeather, true);
});

check('Nov 7 2026: opening day', () => {
  const v = vals('2026-11-07');
  assert.equal(v.seasonState, 'active');
  assert.equal(v.statusLabel, 'Market day · 9 AM – Noon');
  assert.equal(v.hoursLine, 'Saturdays, 9 AM – Noon');
  assert.equal(v.hoursSub, 'November 7 – December 19, 2026');
  assert.equal(v.locationName, 'Old Market Square');
  assert.equal(v.locationSub, 'Behind Victoria Hall, downtown Cobourg');
  assert.equal(v.noticeTitle, 'We\'ve moved for winter!');
  const place = 'Old Market Square — parking lot behind Victoria Hall, near the Firehall Theatre';
  assert.equal(v.locationFull, place);
  assert.equal(v.gettingHere, place + '.');
  assert.equal(v.noticeText, 'Find us at ' + place + '.');
  assert.equal(v.mapCta, 'Get directions to the Winter Market');
  assert.equal(v.mapUrl, 'https://maps.app.goo.gl/22rARXfa6w8nYbeH8');
});

check('ordinary winter weekday', () => {
  const v = vals('2026-11-25');
  assert.equal(v.seasonState, 'active');
  assert.equal(v.statusLabel, 'Open this Saturday · 9 AM – Noon');
  assert.match(v.weekSummary, /^Saturday, November 28 /);
});

check('final week and final market day', () => {
  assert.equal(vals('2026-12-16').statusLabel, 'Final Winter Market this Saturday · 9 AM – Noon');
  const v = vals('2026-12-19');
  assert.equal(v.seasonState, 'active');
  assert.equal(v.statusLabel, 'Final Winter Market today · 9 AM – Noon');
});

for (const date of ['2026-12-20', '2026-12-26', '2027-01-16', '2027-05-01', '2027-07-03']) {
  check(date + ': off-season, nothing activated', () => {
    const v = vals(date);
    assert.equal(v.seasonState, 'off');
    assert.equal(v.hasMarket, false);
    assert.equal(v.showAnnouncement, false);
    assert.doesNotMatch(text(v), /Open this|this Saturday|Oval|Harbourfront|Old Market Square|8 AM|9 AM|directions|goo\.gl|mapUrl/);
  });
}

check('Cobourg date is used across UTC boundaries, including DST', () => {
  // 03:30 UTC Dec 20 is still 10:30 PM Dec 19 in Cobourg.
  assert.equal(S.today(new Date('2026-12-20T03:30:00Z')), '2026-12-19');
  assert.equal(S.today(new Date('2026-12-20T04:59:59Z')), '2026-12-19');
  assert.equal(S.today(new Date('2026-12-20T05:00:00Z')), '2026-12-20');
  // Daylight time ended Nov 1, so opening day starts at 05:00 UTC.
  assert.equal(S.today(new Date('2026-11-07T04:59:59Z')), '2026-11-06');
  assert.equal(S.today(new Date('2026-11-07T05:00:00Z')), '2026-11-07');
  // During daylight time the day starts at 04:00 UTC.
  assert.equal(S.today(new Date('2026-07-04T03:59:59Z')), '2026-07-03');
  assert.equal(S.today(new Date('2026-07-04T04:00:00Z')), '2026-07-04');
});

check('an unapproved season never activates, even with complete details', () => {
  const settings = clone();
  Object.assign(settings.seasons[1], settings.seasons[0], {
    id: 'outdoor-2027', approved: false, startDate: '2027-05-01', endDate: '2027-10-30',
  });
  assert.equal(vals('2027-06-05', settings).seasonState, 'off');
});

check('an approved but incomplete season is not published', () => {
  const settings = clone();
  Object.assign(settings.seasons[1], { approved: true, startDate: '2027-05-01', endDate: '2027-10-30' });
  assert.equal(vals('2027-06-05', settings).seasonState, 'off');
});

check('a complete, approved future season is announced, then runs', () => {
  const settings = clone();
  Object.assign(settings.seasons[1], settings.seasons[0], {
    id: 'outdoor-2027', name: 'Outdoor Market', startDate: '2027-05-01', endDate: '2027-10-30',
  });
  assert.equal(vals('2027-01-16', settings).statusLabel, 'Outdoor Market opens Saturday, May 1');
  assert.equal(vals('2027-01-16', settings).showWeather, false);
  assert.equal(vals('2027-06-05', settings).seasonState, 'active');
});

check('override: closed replaces the open status, then expires', () => {
  const settings = clone();
  settings.override = {
    enabled: true, mode: 'closed', startDate: '2026-11-29', endDate: '2026-12-05',
    message: 'No market on December 5.',
  };
  const during = vals('2026-12-02', settings);
  assert.equal(during.seasonState, 'closed');
  assert.equal(during.statusLabel, 'No market on December 5.');
  assert.equal(during.showWeather, false);
  assert.equal(vals('2026-12-06', settings).statusLabel, 'Open this Saturday · 9 AM – Noon');
});

check('override: notice keeps the schedule; bad overrides are ignored', () => {
  const settings = clone();
  settings.override = {
    enabled: true, mode: 'notice', startDate: '2026-11-09', endDate: '2026-11-14', message: 'Enter from Second Street.',
  };
  const v = vals('2026-11-10', settings);
  assert.equal(v.seasonState, 'active');
  assert.equal(v.announcementText, 'Enter from Second Street.');
  settings.override.endDate = '';
  assert.equal(vals('2026-11-10', settings).announcementKicker, 'We\'ve moved for winter!');
});

check('override cannot extend a season', () => {
  const settings = clone();
  settings.override = {
    enabled: true, mode: 'notice', startDate: '2026-12-20', endDate: '2026-12-31', message: 'One more market!',
  };
  const v = vals('2026-12-26', settings);
  assert.equal(v.seasonState, 'off');
  assert.equal(v.hasMarket, false);
});

check('weekly newsletter link needs a verified URL and expires after its market', () => {
  assert.equal(vals('2026-11-13').hasLineupLink, false);
  const settings = clone();
  settings.weeklyNewsletter = { url: 'https://example.com/issue', marketDate: '2026-11-14' };
  assert.equal(vals('2026-11-12', settings).hasLineupLink, true);
  assert.equal(vals('2026-11-14', settings).hasLineupLink, true);
  assert.equal(vals('2026-11-15', settings).hasLineupLink, false);
  assert.equal(vals('2026-11-15', settings).noLineupLink, true);
  settings.weeklyNewsletter.url = 'http://example.com/issue';
  assert.equal(vals('2026-11-12', settings).hasLineupLink, false);
});

check('evaluation errors fall back to the neutral values', () => {
  const broken = load();
  broken.settings.seasons = null;
  assert.equal(broken.vals().seasonState, 'unknown');
});

console.log('\nAll season checks passed.');
