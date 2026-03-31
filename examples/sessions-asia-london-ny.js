//@version=1

const fxrAsiaState = {
  activeBoxId: null,
  sessionKey: null,
  startTime: null,
  sessionHigh: -Infinity,
  sessionLow: Infinity
};

const fxrLondonState = {
  activeBoxId: null,
  sessionKey: null,
  startTime: null,
  sessionHigh: -Infinity,
  sessionLow: Infinity
};

const fxrNewYorkState = {
  activeBoxId: null,
  sessionKey: null,
  startTime: null,
  sessionHigh: -Infinity,
  sessionLow: Infinity
};

let fxrLastBarTime = null;

const fxrParseSession = (fxrSessionText) => {
  if (typeof fxrSessionText !== 'string') return null;

  const fxrMatch = fxrSessionText.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})/);
  if (!fxrMatch) return null;

  const fxrStartMinute = Number(fxrMatch[1]) * 60 + Number(fxrMatch[2]);
  const fxrEndMinute = Number(fxrMatch[3]) * 60 + Number(fxrMatch[4]);

  if (!Number.isFinite(fxrStartMinute) || !Number.isFinite(fxrEndMinute)) {
    return null;
  }

  return {
    startMinute: fxrStartMinute,
    endMinute: fxrEndMinute
  };
};

const fxrIsMinuteInSession = (fxrMinuteOfDay, fxrStartMinute, fxrEndMinute) => {
  if (fxrStartMinute === fxrEndMinute) return true;
  if (fxrStartMinute < fxrEndMinute) {
    return (
      fxrMinuteOfDay >= fxrStartMinute && fxrMinuteOfDay < fxrEndMinute
    );
  }
  return (
    fxrMinuteOfDay >= fxrStartMinute || fxrMinuteOfDay < fxrEndMinute
  );
};

const fxrGetSessionStartMoment = (
  fxrMomentBar,
  fxrMinuteOfDay,
  fxrStartMinute,
  fxrEndMinute
) => {
  const fxrSessionStart = fxrMomentBar
    .clone()
    .startOf('day')
    .add(fxrStartMinute, 'minutes');

  if (fxrStartMinute > fxrEndMinute && fxrMinuteOfDay < fxrEndMinute) {
    fxrSessionStart.subtract(1, 'day');
  }

  return fxrSessionStart;
};

const fxrResetSessionState = (fxrState) => {
  fxrState.activeBoxId = null;
  fxrState.sessionKey = null;
  fxrState.startTime = null;
  fxrState.sessionHigh = -Infinity;
  fxrState.sessionLow = Infinity;
};

const fxrBuildRectanglePoints = (
  fxrStartTime,
  fxrEndTime,
  fxrSessionHigh,
  fxrSessionLow
) => {
  return [
    { time: fxrStartTime, price: fxrSessionHigh },
    { time: fxrEndTime, price: fxrSessionLow }
  ];
};

const fxrBuildRectangleStyle = (fxrColor) => {
  return {
    color: fxrColor,
    backgroundColor: fxrColor,
    fillBackground: true,
    transparency: 85,
    linewidth: 1
  };
};

const fxrBuildSessionPlan = (
  fxrState,
  fxrSessionText,
  fxrEnabled,
  fxrCurrentTime,
  fxrCurrentHigh,
  fxrCurrentLow,
  fxrMoment,
  fxrTimezone
) => {
  const fxrPlan = {
    action: 'none',
    drawingId: null,
    startTime: null,
    endTime: fxrCurrentTime,
    sessionHigh: null,
    sessionLow: null
  };

  if (!fxrEnabled) {
    fxrPlan.action = 'delete';
    fxrPlan.drawingId = fxrState.activeBoxId;
    fxrResetSessionState(fxrState);
    return fxrPlan;
  }

  const fxrParsedSession = fxrParseSession(fxrSessionText);
  if (!fxrParsedSession) {
    fxrPlan.action = 'delete';
    fxrPlan.drawingId = fxrState.activeBoxId;
    fxrResetSessionState(fxrState);
    return fxrPlan;
  }

  const fxrBarMoment = fxrMoment.tz(fxrCurrentTime, fxrTimezone);
  const fxrMinuteOfDay = fxrBarMoment.hours() * 60 + fxrBarMoment.minutes();
  const fxrIsActive = fxrIsMinuteInSession(
    fxrMinuteOfDay,
    fxrParsedSession.startMinute,
    fxrParsedSession.endMinute
  );

  if (!fxrIsActive) {
    fxrResetSessionState(fxrState);
    return fxrPlan;
  }

  const fxrSessionStartMoment = fxrGetSessionStartMoment(
    fxrBarMoment,
    fxrMinuteOfDay,
    fxrParsedSession.startMinute,
    fxrParsedSession.endMinute
  );
  const fxrSessionKey = fxrSessionStartMoment.valueOf();

  if (fxrState.sessionKey !== fxrSessionKey) {
    fxrState.sessionKey = fxrSessionKey;
    fxrState.startTime = fxrSessionKey;
    fxrState.sessionHigh = fxrCurrentHigh;
    fxrState.sessionLow = fxrCurrentLow;
    fxrState.activeBoxId = null;
    fxrPlan.action = 'create';
  } else {
    fxrState.sessionHigh = Math.max(fxrState.sessionHigh, fxrCurrentHigh);
    fxrState.sessionLow = Math.min(fxrState.sessionLow, fxrCurrentLow);
    fxrPlan.action = fxrState.activeBoxId === null ? 'create' : 'update';
    fxrPlan.drawingId = fxrState.activeBoxId;
  }

  fxrPlan.startTime = fxrState.startTime;
  fxrPlan.sessionHigh = fxrState.sessionHigh;
  fxrPlan.sessionLow = fxrState.sessionLow;

  return fxrPlan;
};

init = () => {
  indicator({ onMainPanel: true, format: 'price' });

  input.str(
    'Session Timezone',
    'UTC',
    'sessionTimezone',
    ['UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo'],
    'Timezone used to evaluate all session windows',
    'Sessions'
  );

  input.bool('Show Asia', true, 'showAsia', 'Sessions');
  input.session(
    'Asia Session',
    '0000-0900',
    'asiaSession',
    'Session window for Asia',
    'Sessions'
  );

  input.bool('Show London', true, 'showLondon', 'Sessions');
  input.session(
    'London Session',
    '0700-1600',
    'londonSession',
    'Session window for London',
    'Sessions'
  );

  input.bool('Show New York', true, 'showNewYork', 'Sessions');
  input.session(
    'New York Session',
    '1300-2200',
    'newYorkSession',
    'Session window for New York',
    'Sessions'
  );

  input.color('Asia Color', color.rgba(255, 165, 0, 0.35), 'asiaColor', 'Style');
  input.color('London Color', color.rgba(0, 140, 255, 0.3), 'londonColor', 'Style');
  input.color('New York Color', color.rgba(0, 200, 120, 0.3), 'newYorkColor', 'Style');
};

onTick = (length, _moment, _, ta, inputs) => {
  const fxrCurrentTime = time(0);
  const fxrCurrentHigh = high(0);
  const fxrCurrentLow = low(0);

  if (!Number.isFinite(fxrCurrentTime)) return;
  if (!Number.isFinite(fxrCurrentHigh) || !Number.isFinite(fxrCurrentLow)) {
    return;
  }
  if (fxrLastBarTime === fxrCurrentTime) return;
  fxrLastBarTime = fxrCurrentTime;

  const fxrAsiaPlan = fxrBuildSessionPlan(
    fxrAsiaState,
    inputs.asiaSession,
    inputs.showAsia,
    fxrCurrentTime,
    fxrCurrentHigh,
    fxrCurrentLow,
    _moment,
    inputs.sessionTimezone
  );
  const fxrAsiaStyle = fxrBuildRectangleStyle(inputs.asiaColor);
  if (fxrAsiaPlan.action === 'delete' && fxrAsiaPlan.drawingId !== null) {
    deleteDrawingById(fxrAsiaPlan.drawingId);
  } else if (fxrAsiaPlan.action === 'create') {
    fxrAsiaState.activeBoxId =
      rectangle(
        fxrAsiaPlan.startTime,
        fxrAsiaPlan.sessionHigh,
        fxrAsiaPlan.endTime,
        fxrAsiaPlan.sessionLow,
        fxrAsiaStyle
      ) || null;
  } else if (fxrAsiaPlan.action === 'update' && fxrAsiaPlan.drawingId !== null) {
    updateDrawingById(fxrAsiaPlan.drawingId, {
      moveTo: fxrBuildRectanglePoints(
        fxrAsiaPlan.startTime,
        fxrAsiaPlan.endTime,
        fxrAsiaPlan.sessionHigh,
        fxrAsiaPlan.sessionLow
      ),
      styles: fxrAsiaStyle
    });
  }

  const fxrLondonPlan = fxrBuildSessionPlan(
    fxrLondonState,
    inputs.londonSession,
    inputs.showLondon,
    fxrCurrentTime,
    fxrCurrentHigh,
    fxrCurrentLow,
    _moment,
    inputs.sessionTimezone
  );
  const fxrLondonStyle = fxrBuildRectangleStyle(inputs.londonColor);
  if (fxrLondonPlan.action === 'delete' && fxrLondonPlan.drawingId !== null) {
    deleteDrawingById(fxrLondonPlan.drawingId);
  } else if (fxrLondonPlan.action === 'create') {
    fxrLondonState.activeBoxId =
      rectangle(
        fxrLondonPlan.startTime,
        fxrLondonPlan.sessionHigh,
        fxrLondonPlan.endTime,
        fxrLondonPlan.sessionLow,
        fxrLondonStyle
      ) || null;
  } else if (
    fxrLondonPlan.action === 'update' &&
    fxrLondonPlan.drawingId !== null
  ) {
    updateDrawingById(fxrLondonPlan.drawingId, {
      moveTo: fxrBuildRectanglePoints(
        fxrLondonPlan.startTime,
        fxrLondonPlan.endTime,
        fxrLondonPlan.sessionHigh,
        fxrLondonPlan.sessionLow
      ),
      styles: fxrLondonStyle
    });
  }

  const fxrNewYorkPlan = fxrBuildSessionPlan(
    fxrNewYorkState,
    inputs.newYorkSession,
    inputs.showNewYork,
    fxrCurrentTime,
    fxrCurrentHigh,
    fxrCurrentLow,
    _moment,
    inputs.sessionTimezone
  );
  const fxrNewYorkStyle = fxrBuildRectangleStyle(inputs.newYorkColor);
  if (fxrNewYorkPlan.action === 'delete' && fxrNewYorkPlan.drawingId !== null) {
    deleteDrawingById(fxrNewYorkPlan.drawingId);
  } else if (fxrNewYorkPlan.action === 'create') {
    fxrNewYorkState.activeBoxId =
      rectangle(
        fxrNewYorkPlan.startTime,
        fxrNewYorkPlan.sessionHigh,
        fxrNewYorkPlan.endTime,
        fxrNewYorkPlan.sessionLow,
        fxrNewYorkStyle
      ) || null;
  } else if (
    fxrNewYorkPlan.action === 'update' &&
    fxrNewYorkPlan.drawingId !== null
  ) {
    updateDrawingById(fxrNewYorkPlan.drawingId, {
      moveTo: fxrBuildRectanglePoints(
        fxrNewYorkPlan.startTime,
        fxrNewYorkPlan.endTime,
        fxrNewYorkPlan.sessionHigh,
        fxrNewYorkPlan.sessionLow
      ),
      styles: fxrNewYorkStyle
    });
  }
};
