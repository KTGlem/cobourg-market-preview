/* Cobourg Farmers' Market: seasonal settings.
 *
 * This file is the one place for market dates, hours and location.
 * Every page reads it. See SEASONAL-MAINTENANCE.md before changing anything.
 * Edit SETTINGS only; the code below it should not need changes.
 */
(function () {
  'use strict';

  var SETTINGS = {
    timeZone: 'America/Toronto',

    seasons: [
      {
        id: 'winter-2026',
        approved: true,
        name: 'Winter Market',
        startDate: '2026-11-07',
        endDate: '2026-12-19',
        weekday: 6, // 0 = Sunday ... 6 = Saturday
        dayName: 'Saturday',
        hours: { opens: '9:00 AM', closes: '12:00 PM', range: '9 AM – Noon' },
        location: {
          name: 'Old Market Square',
          detail: 'Behind Victoria Hall, downtown Cobourg',
          description: 'Old Market Square — parking lot behind Victoria Hall, near the Firehall Theatre',
          // The market's own Google listing. Checked 2026-11-05: its pin is in this winter lot.
          // The pin belongs to the listing, so re-check it before reusing this link for another season.
          mapUrl: 'https://maps.app.goo.gl/22rARXfa6w8nYbeH8',
          mapLabel: 'Get directions to the Winter Market',
          mapDescription: 'Open Google Maps directions to the Winter Market at Old Market Square'
        },
        offerings: ['Baked Goods', 'Preserves', 'Prepared Foods', 'Maple Products', 'Local Gifts', 'Seasonal Produce'],
        presentation: {
          notice: {
            icon: '❄',
            title: 'We\'ve moved for winter!'
          },
          offeringsLabel: 'At the Winter Market',
          offeringsHeading: 'What You\'ll Find at the Winter Market',
          offeringsCopy: 'Discover baked goods, preserves, prepared foods, maple products, local gifts and whatever seasonal produce our vendors have available.',
          offeringsNote: 'Vendors and products vary from week to week.',
          lineupNote: 'The weekly vendor lineup is published Thursday evenings online and through our newsletter.',
          newsletterPitch: 'The weekly vendor lineup is published Thursday evenings online and through our newsletter. Sign up to get it in your inbox.',
          eventsMessage: 'Our winter market is all about connecting with local makers, growers and neighbours. Special events will be announced here as they\'re confirmed.',
          showProgramming: false // summer programming such as live music and yoga
        }
      },
      {
        // Nothing here is confirmed. Complete every field before setting approved: true.
        id: 'outdoor-2027',
        approved: false,
        name: 'Outdoor Market',
        startDate: null,
        endDate: null,
        weekday: 6,
        dayName: 'Saturday',
        hours: null,
        location: null,
        offerings: [],
        presentation: null
      }
    ],

    // Shown whenever no approved season is running or scheduled.
    offSeason: {
      statusLabel: 'Between seasons',
      title: 'Dates to be announced',
      message: 'The market is between seasons. The next season\'s schedule will be announced when it\'s confirmed.',
      newsletterPitch: 'Sign up for market news and we\'ll let you know when the next season\'s schedule is announced.',
      eventsMessage: 'No events are scheduled right now. New dates will be posted here when they\'re confirmed.',
      footerHours: 'Next season\'s schedule to be announced.'
    },

    // For exceptional circumstances, such as a cancelled market day.
    // mode 'notice' shows the message; 'closed' also replaces the open status.
    // Dates are required and the override ends by itself after endDate.
    // It can never open or extend a season: to do that, change the season's dates.
    override: { enabled: false, mode: 'notice', startDate: '', endDate: '', message: '' },

    // Link to one verified weekly newsletter. Leave url empty until there is one.
    // marketDate must be the Saturday it covers; it stops showing after that day.
    weeklyNewsletter: { url: '', marketDate: '' }
  };

  /* ---- Code below this line should not need editing ---- */

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  var DAY_MS = 86400000;

  function toUtc(ymd) {
    var p = ymd.split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function fromUtc(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function isDate(ymd) {
    return typeof ymd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ymd) && fromUtc(toUtc(ymd)) === ymd;
  }
  function weekdayOf(ymd) { return new Date(toUtc(ymd)).getUTCDay(); }
  function daysBetween(from, to) { return Math.round((toUtc(to) - toUtc(from)) / DAY_MS); }
  function monthDay(ymd, short) {
    var p = ymd.split('-');
    var month = MONTHS[+p[1] - 1];
    return (short ? month.slice(0, 3) : month) + ' ' + (+p[2]);
  }
  function dateRange(season, short) {
    var startYear = season.startDate.slice(0, 4);
    var endYear = season.endDate.slice(0, 4);
    return monthDay(season.startDate, short) + (startYear === endYear ? '' : ', ' + startYear) +
      ' – ' + monthDay(season.endDate, short) + ', ' + endYear;
  }

  // Today's calendar date in Cobourg, whatever the visitor's own time zone is.
  function today(now, timeZone) {
    var date = now || new Date();
    var parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || SETTINGS.timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date).forEach(function (part) { parts[part.type] = part.value; });
    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  // An unapproved or incomplete season can never be published.
  function isPublishable(season) {
    return season.approved === true &&
      isDate(season.startDate) && isDate(season.endDate) && season.startDate <= season.endDate &&
      season.weekday >= 0 && season.weekday <= 6 && !!season.dayName &&
      !!season.hours && !!season.hours.range &&
      !!season.location && !!season.location.name && !!season.location.detail && !!season.location.description &&
      !!season.presentation;
  }

  function firstMarketFrom(season, ymd) {
    var day = ymd < season.startDate ? season.startDate : ymd;
    var date = fromUtc(toUtc(day) + ((season.weekday - weekdayOf(day) + 7) % 7) * DAY_MS);
    return date <= season.endDate ? date : null;
  }
  function lastMarket(season) {
    return fromUtc(toUtc(season.endDate) - ((weekdayOf(season.endDate) - season.weekday + 7) % 7) * DAY_MS);
  }

  function activeOverride(settings, ymd) {
    var o = settings.override;
    var usable = o && o.enabled === true && (o.mode === 'closed' || o.mode === 'notice') && !!o.message &&
      isDate(o.startDate) && isDate(o.endDate) && o.startDate <= ymd && ymd <= o.endDate;
    return usable ? o : null;
  }

  function evaluate(settings, ymd) {
    var seasons = settings.seasons.filter(isPublishable).sort(function (a, b) {
      return a.startDate < b.startDate ? -1 : 1;
    });
    for (var i = 0; i < seasons.length; i++) {
      var season = seasons[i];
      var next = ymd <= season.endDate ? firstMarketFrom(season, ymd) : null;
      if (next) {
        return {
          state: ymd < season.startDate ? 'upcoming' : 'active',
          season: season,
          nextMarket: next,
          isFinal: next === lastMarket(season),
          daysAway: daysBetween(ymd, next),
          override: activeOverride(settings, ymd)
        };
      }
    }
    return { state: 'off', season: null, nextMarket: null, override: activeOverride(settings, ymd) };
  }

  function statusFor(ev) {
    var s = ev.season;
    var hours = ' · ' + s.hours.range;
    var day = s.dayName;
    if (ev.state === 'upcoming') return s.name + ' opens ' + day + ', ' + monthDay(s.startDate);
    if (ev.daysAway === 0) return (ev.isFinal ? 'Final ' + s.name + ' today' : 'Market day') + hours;
    return (ev.isFinal ? 'Final ' + s.name + ' this ' + day : 'Open this ' + day) + hours;
  }

  function offSeasonVals(settings, ymd, override) {
    var off = settings.offSeason;
    return {
      today: ymd,
      seasonState: 'off',
      hasMarket: false,
      noMarket: true,
      hideProgramming: true,
      showProgramming: false,
      showAnnouncement: !!override,
      announcementKicker: 'Market notice',
      announcementText: override ? override.message : '',
      statusDot: '#DDA73A',
      statusLabel: off.statusLabel,
      weekKicker: 'Between Seasons',
      weekSummary: off.message,
      noMarketTitle: off.title,
      seasonMessage: override ? override.message : off.message,
      pageIntro: override ? override.message : off.message,
      newsletterPitch: off.newsletterPitch,
      eventsMessage: off.eventsMessage,
      footerAddress: 'Downtown Cobourg, ON',
      footerHours: off.footerHours
    };
  }

  function build(settings, ymd) {
    var ev = evaluate(settings, ymd);
    if (!ev.season) return offSeasonVals(settings, ymd, ev.override);

    var s = ev.season;
    var loc = s.location;
    var show = s.presentation;
    var notice = show.notice || { icon: '', title: '', text: '' };
    var override = ev.override;
    var closed = !!override && override.mode === 'closed';
    var daysLine = s.dayName + 's, ' + s.hours.range;
    var range = dateRange(s);
    var locationFull = loc.description;
    var nextDate = s.dayName + ', ' + monthDay(ev.nextMarket);
    var letter = settings.weeklyNewsletter || {};
    var hasLineupLink = /^https:\/\/\S+$/.test(letter.url || '') && letter.marketDate === ev.nextMarket;

    return {
      today: ymd,
      seasonState: closed ? 'closed' : ev.state,
      hasMarket: true,
      noMarket: false,
      hideProgramming: !show.showProgramming,
      showProgramming: !!show.showProgramming,
      showAnnouncement: true,
      announcementKicker: override ? 'Market notice' : (notice.title || s.name),
      announcementText: override ? override.message : s.name + ': ' + daysLine + ' at ' + locationFull + '.',
      statusDot: closed ? '#DDA73A' : '#7Fbf8f',
      statusLabel: closed ? override.message : statusFor(ev),
      weekKicker: closed ? 'Market Notice' : ev.state === 'upcoming' ? 'Coming Up' : ev.daysAway === 0 ? 'Today' : 'This ' + s.dayName,
      weekSummary: closed ? override.message : nextDate + ' · Here\'s everything you need to plan your morning.',
      pageIntro: closed ? override.message : 'Everything you need to plan your ' + s.dayName + ' morning: hours, location, who\'s here and what you\'ll find.',
      hoursLabel: s.name,
      hoursLine: daysLine,
      hoursSub: range,
      locationName: loc.name,
      locationSub: loc.detail,
      locationFull: locationFull,
      gettingHere: locationFull + '.',
      mapUrl: loc.mapUrl,
      mapCta: loc.mapLabel,
      mapAria: loc.mapDescription,
      noticeIcon: override ? '!' : notice.icon,
      noticeTitle: override ? 'Market notice' : notice.title,
      noticeText: override ? override.message : notice.text || 'Find us at ' + locationFull + '.',
      offerings: s.offerings,
      offeringsLabel: show.offeringsLabel,
      offeringsHeading: show.offeringsHeading,
      offeringsCopy: show.offeringsCopy,
      offeringsNote: show.offeringsNote,
      lineupCopy: show.lineupNote,
      hasLineupLink: hasLineupLink,
      noLineupLink: !hasLineupLink,
      lineupUrl: hasLineupLink ? letter.url : '',
      lineupLabel: 'See the vendor lineup for ' + nextDate + ' →',
      schedule: [
        { time: s.hours.opens, title: 'Market opens', note: locationFull + '.' },
        { time: s.hours.closes, title: 'Market closes', note: s.dayName + 's through ' + monthDay(s.endDate) + '.' }
      ],
      showWeather: !closed && ev.daysAway <= 6,
      newsletterPitch: show.newsletterPitch,
      eventsMessage: show.eventsMessage,
      eventsFootnote: s.name + ': ' + daysLine + ', ' + range + ', at ' + locationFull + '.',
      contactHours: range + '\n' + daysLine + '\n' + locationFull,
      footerAddress: loc.name + '\n' + loc.detail,
      footerHours: s.name + ': ' + s.dayName.slice(0, 3) + ', ' + s.hours.range + '\n' + dateRange(s, true)
    };
  }

  // Each page's inline shell defines a neutral fallback before loading this file.
  var fallback = window.CFMSeason;

  window.CFMSeason = {
    settings: SETTINGS,
    today: today,
    evaluate: evaluate,
    build: build,
    vals: function () {
      try {
        return build(SETTINGS, today());
      } catch (err) {
        console.warn('[season-config] using neutral fallback:', err);
        return fallback.vals();
      }
    }
  };
})();
