//@version=1

let asiaStarted = false;
let ldnStarted = false;
let nyStarted = false;

let asiaSession = {
  start: 0,
  _high: -Infinity,
  _low: Infinity,
  highLine: null,
  lowLine: null,
  midLine: null,
};
let ldnSession = {
  start: 0,
  _high: -Infinity,
  _low: Infinity,
  highLine: null,
  lowLine: null,
};
let nySession = {
  start: 0,
  _high: -Infinity,
  _low: Infinity,
  highLine: null,
  lowLine: null,
};

let asiaSessions = [];
let ldnSessions = [];
let nySessions = [];

let dailyRanges = [];
let midnightLines = [];

let dailyStartTime = null;
let dailyHigh = -Infinity;
let dailyLow = Infinity;
let lastMidnightTime = null;
let fxrLastBarTime = null;

const fxrToUnixSeconds = (fxrBarTime) => {
  if (!Number.isFinite(fxrBarTime)) return NaN;
  return fxrBarTime > 1e11 ? Math.floor(fxrBarTime / 1000) : fxrBarTime;
};

const fxrBuildTrendPoints = (fxrP1, fxrP2, fxrText) => {
  return [
    {
      time: fxrToUnixSeconds(fxrP1.time),
      price: fxrP1.price,
      text: fxrText,
    },
    {
      time: fxrToUnixSeconds(fxrP2.time),
      price: fxrP2.price,
    },
  ];
};

init = () => {
  indicator({ onMainPanel: true, format: 'inherit' });

  input.int('Days to Display', 5, 'daysVisible', 1, 30, 1);

  input.bool('Draw Midnight Lines in NY Time', true, 'showMidnightLines');
  input.session('Midnight Line Time (NY)', '0000-0001', 'midnightLineTime');
  input.color('Midnight Line Color', color.gray, 'midnightLineColor');

  input.bool('Display Daily High/Low', true, 'showDailyHighLow');
  input.bool('Show Daily High/Low Labels', false, 'showDailyLabels');
  input.str('Daily High Label', 'DH', 'dailyHighLabel');
  input.str('Daily Low Label', 'DL', 'dailyLowLabel');
  input.color('Daily Line Color', color.rgba(200, 200, 200, 1), 'dailyColor');

  input.bool('Display Asia Range', true, 'asiaShow');
  input.bool('Show Asia Labels', false, 'asiaShowLabels');
  input.str('Asia High Label', 'AsiaH', 'asiaHighLabel');
  input.str('Asia Low Label', 'AsiaL', 'asiaLowLabel');
  input.color('Asia Range Color', color.rgba(255, 225, 0, 1), 'asiaColor');
  input.session('Asia Session', '1900-0001', 'asiaSessionTime');

  input.bool('Draw Asia Midline', true, 'asiaMidShow');
  input.color('Asia Midline Color', color.gray, 'asiaMidColor');
  input.bool('Extend Asia Midline', false, 'asiaMidExtend');

  input.bool('Display London Range', true, 'ldnShow');
  input.bool('Show London Labels', false, 'ldnShowLabels');
  input.str('London High Label', 'LDNH', 'ldnHighLabel');
  input.str('London Low Label', 'LDNL', 'ldnLowLabel');
  input.color('London Range Color', color.rgba(67, 97, 238, 1), 'ldnColor');
  input.session('London Session', '0200-0500', 'ldnSessionTime');

  input.bool('Display New York Range', true, 'nyShow');
  input.bool('Show New York Labels', false, 'nyShowLabels');
  input.str('New York High Label', 'NYH', 'nyHighLabel');
  input.str('New York Low Label', 'NYL', 'nyLowLabel');
  input.color('New York Range Color', color.rgba(128, 128, 128, 1), 'nyColor');
  input.session('New York Session', '0700-1100', 'nySessionTime');
};

onTick = (length, _moment, _, ta, inputs) => {
  const t0 = time(0);
  const h0 = high(0);
  const l0 = low(0);

  if (!Number.isFinite(t0)) return;
  if (!Number.isFinite(h0) || !Number.isFinite(l0)) return;
  if (fxrLastBarTime === t0) return;
  fxrLastBarTime = t0;

  const fxrUpsertTrendLine = (fxrLineId, fxrP1, fxrP2, fxrStyle, fxrText) => {
    if (!fxrLineId) {
      return trendLine(fxrP1, fxrP2, fxrStyle, fxrText);
    }

    updateDrawingById(fxrLineId, {
      moveTo: fxrBuildTrendPoints(fxrP1, fxrP2, fxrText),
      styles: fxrStyle,
    });

    return fxrLineId;
  };

  const nyTime = _moment(t0).tz('America/New_York');
  const nyHour = nyTime.hour();
  const nyMinute = nyTime.minute();

  const cutoffTime = _moment(t0).subtract(inputs.daysVisible, 'days').unix();

  const isInSession = (() => {
    const cache = {};
    return (key) => {
      if (cache[key] !== undefined) return cache[key];
      const [start, end] = inputs[key].split('-');
      const sm = parseInt(start.slice(0, 2)) * 60 + parseInt(start.slice(2));
      const em = parseInt(end.slice(0, 2)) * 60 + parseInt(end.slice(2));
      const cm = nyHour * 60 + nyMinute;
      return (cache[key] = sm < em ? cm >= sm && cm < em : cm >= sm || cm < em);
    };
  })();

  const drawHistoricSessions = (sessionsArray, cfg) => {
    for (let s of sessionsArray) {
      if (!s) return;
      if (s.start < cutoffTime) {
        if (s.highLineId) deleteDrawingById(s.highLineId);
        if (s.lowLineId) deleteDrawingById(s.lowLineId);
        if (cfg.drawMid && s.midLineId) deleteDrawingById(s.midLineId);
        continue;
      }

      const style = {
        linecolor: inputs[cfg.color],
        linewidth: 1,
        extendRight: false,
        showLabel: inputs[cfg.showLabelFlag],
      };

      if (!s.highLineId && inputs[cfg.show]) {
        s.highLineId = trendLine(
          newPoint(s.start, s._high),
          newPoint(s.end, s._high),
          style,
          inputs[cfg.highLabel],
        );
      }

      if (!s.lowLineId && inputs[cfg.show]) {
        s.lowLineId = trendLine(
          newPoint(s.start, s._low),
          newPoint(s.end, s._low),
          style,
          inputs[cfg.lowLabel],
        );
      }

      if (cfg.drawMid && inputs.asiaMidShow) {
        const mid = (s._high + s._low) / 2;
        const midStyle = {
          linecolor: inputs.asiaMidColor,
          linewidth: 1,
          extendRight: inputs.asiaMidExtend,
          showLabel: false,
          linestyle: 1,
        };

        if (!s.midLineId && inputs[cfg.show]) {
          s.midLineId = trendLine(
            newPoint(s.start, mid),
            newPoint(s.end, mid),
            midStyle,
            '',
          );
        }
      }
    }
  };

  const handleSession = (cfg, sessionState, sessionsArray, started, setStarted) => {
    const inside = isInSession(cfg.sessionKey);

    if (inside) {
      if (!started) {
        setStarted(true);
        sessionState.start = t0;
        sessionState._high = h0;
        sessionState._low = l0;
      } else {
        sessionState._high = Math.max(sessionState._high, h0);
        sessionState._low = Math.min(sessionState._low, l0);
      }

      if (inputs[cfg.show]) {
        const fxrHasLineLength = t0 > sessionState.start;
        const style = {
          linecolor: inputs[cfg.color],
          linewidth: 1,
          extendRight: false,
          showLabel: inputs[cfg.showLabelFlag] && fxrHasLineLength,
        };

        sessionState.highLine = fxrUpsertTrendLine(
          sessionState.highLine,
          newPoint(sessionState.start, sessionState._high),
          newPoint(t0, sessionState._high),
          style,
          fxrHasLineLength ? inputs[cfg.highLabel] : '',
        );

        sessionState.lowLine = fxrUpsertTrendLine(
          sessionState.lowLine,
          newPoint(sessionState.start, sessionState._low),
          newPoint(t0, sessionState._low),
          style,
          fxrHasLineLength ? inputs[cfg.lowLabel] : '',
        );

        if (cfg.drawMid && inputs.asiaMidShow) {
          const mid = (sessionState._high + sessionState._low) / 2;
          const midStyle = {
            linecolor: inputs.asiaMidColor,
            linewidth: 1,
            extendRight: inputs.asiaMidExtend,
            showLabel: false,
            linestyle: 1,
          };

          sessionState.midLine = fxrUpsertTrendLine(
            sessionState.midLine,
            newPoint(sessionState.start, mid),
            newPoint(t0, mid),
            midStyle,
            '',
          );
        }
      }
    } else if (started) {
      setStarted(false);

      sessionsArray.push({
        start: sessionState.start,
        end: t0,
        _high: sessionState._high,
        _low: sessionState._low,
        highLineId: sessionState.highLine,
        lowLineId: sessionState.lowLine,
        midLineId: sessionState.midLine,
      });

      sessionState.highLine = null;
      sessionState.lowLine = null;
      sessionState.midLine = null;
    }

    if (!inside && inputs[cfg.show]) {
      drawHistoricSessions(sessionsArray, cfg);
    }
  };

  handleSession(
    {
      sessionKey: 'asiaSessionTime',
      show: 'asiaShow',
      color: 'asiaColor',
      highLabel: 'asiaHighLabel',
      lowLabel: 'asiaLowLabel',
      showLabelFlag: 'asiaShowLabels',
      drawMid: true,
    },
    asiaSession,
    asiaSessions,
    asiaStarted,
    (v) => (asiaStarted = v),
  );

  handleSession(
    {
      sessionKey: 'ldnSessionTime',
      show: 'ldnShow',
      color: 'ldnColor',
      highLabel: 'ldnHighLabel',
      lowLabel: 'ldnLowLabel',
      showLabelFlag: 'ldnShowLabels',
      drawMid: false,
    },
    ldnSession,
    ldnSessions,
    ldnStarted,
    (v) => (ldnStarted = v),
  );

  handleSession(
    {
      sessionKey: 'nySessionTime',
      show: 'nyShow',
      color: 'nyColor',
      highLabel: 'nyHighLabel',
      lowLabel: 'nyLowLabel',
      showLabelFlag: 'nyShowLabels',
      drawMid: false,
    },
    nySession,
    nySessions,
    nyStarted,
    (v) => (nyStarted = v),
  );

  if (inputs.showMidnightLines) {
    const [midStart] = inputs.midnightLineTime.split('-');
    const mh = parseInt(midStart.slice(0, 2));
    const mm = parseInt(midStart.slice(2));

    if ((!lastMidnightTime || time(0) > lastMidnightTime) && nyHour === mh && nyMinute === mm) {
      const id = verticalLine(t0, {
        linestyle: 1,
        linecolor: inputs.midnightLineColor,
        linewidth: 1,
      });

      midnightLines.push({ ts: t0, id });
      lastMidnightTime = t0;
    }
  }

  midnightLines = midnightLines.filter((item) => {
    if (item.ts < cutoffTime) {
      deleteDrawingById(item.id);
      return false;
    }
    return true;
  });

  if (inputs.showDailyHighLow) {
    const isStart = nyHour === 0 && nyMinute === 0;
    const isEnd = nyHour === 17 && nyMinute === 0;

    if (isStart) {
      dailyStartTime = t0;
      dailyHigh = h0;
      dailyLow = l0;
    } else if (isEnd && dailyStartTime !== null) {
      const style = {
        linecolor: inputs.dailyColor,
        linewidth: 2,
        extendRight: false,
        showLabel: inputs.showDailyLabels,
      };

      const highId = trendLine(
        newPoint(dailyStartTime, dailyHigh),
        newPoint(t0, dailyHigh),
        style,
        inputs.dailyHighLabel,
      );

      const lowId = trendLine(
        newPoint(dailyStartTime, dailyLow),
        newPoint(t0, dailyLow),
        style,
        inputs.dailyLowLabel,
      );

      dailyRanges.push({
        start: dailyStartTime,
        highId,
        lowId,
      });

      dailyStartTime = null;
      dailyHigh = -Infinity;
      dailyLow = Infinity;
    } else if (dailyStartTime !== null) {
      dailyHigh = Math.max(dailyHigh, h0);
      dailyLow = Math.min(dailyLow, l0);
    }
  }

  dailyRanges = dailyRanges.filter((d) => {
    if (d.start < cutoffTime) {
      if (d.highId) deleteDrawingById(d.highId);
      if (d.lowId) deleteDrawingById(d.lowId);
      return false;
    }
    return true;
  });
};
