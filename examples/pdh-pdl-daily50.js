//@version=1
init = () => {
    indicator({ onMainPanel: true, format: 'inherit' });
    
    // 50%
    input.bool("Show Daily 50%", true, "show_eq");
    
    // PDH / PDL
    input.bool("Show PDH/PDL", true, "show_pd");
    input.bool("Stop on Break", true, "stop_on_break");
    input.color("PDH Color", color.green, "pdh_col");
    input.color("PDL Color", color.red, "pdl_col");
    
    // Settings
    input.int("UTC Offset (Hours)", 0, "offset", -24, 24, 1);
    input.bool("Debug Lines", false, "debug"); 
};

// Global State
const myState = {
    idx: -1,
    d_h: -Infinity, 
    d_l: Infinity,
    p_h: -Infinity, 
    p_l: Infinity,
    pdh_broken: false,
    pdl_broken: false
};

onTick = (_o, _h, _l, _c, inputs) => {
    if (!time(0)) return;

    const MS_IN_DAY = 86400000;
    const tCurrent = time(0);
    const nyTimeCurrent = tCurrent + (inputs.offset * 3600000);
    const dayIdxCurrent = Math.floor(nyTimeCurrent / MS_IN_DAY);
    
    const curH = high(0);
    const curL = low(0);

    // --- STATE LOGIC ---
    if (dayIdxCurrent !== myState.idx) {
        if (myState.d_h !== -Infinity) {
            myState.p_h = myState.d_h;
            myState.p_l = myState.d_l;
        }
        
        myState.idx = dayIdxCurrent;
        myState.d_h = curH;
        myState.d_l = curL;
        
        myState.pdh_broken = false;
        myState.pdl_broken = false;
        
    } else {
        if (curH > myState.d_h) myState.d_h = curH;
        if (curL < myState.d_l) myState.d_l = curL;
        
        if (curH >= myState.p_h) myState.pdh_broken = true;
        if (curL <= myState.p_l) myState.pdl_broken = true;
    }

    // --- PREPARE PLOT VALUES ---
    let eqVal = NaN;
    let eqCol = color.white;
    let eqWidth = 0;

    let pdhVal = NaN;
    let pdhCol = color.white;
    let pdhWidth = 0;

    let pdlVal = NaN;
    let pdlCol = color.white;
    let pdlWidth = 0;

    let dbgHighVal = NaN;
    let dbgHighWidth = 0;
    let dbgLowVal = NaN;
    let dbgLowWidth = 0;

    if (inputs.show_eq && myState.d_l > 0 && myState.d_h > myState.d_l) {
        eqVal = (myState.d_h + myState.d_l) / 2;
        eqCol = color.yellow;
        eqWidth = 2;
    }

    if (inputs.show_pd && myState.p_h !== -Infinity && myState.p_l !== Infinity) {
        if (!inputs.stop_on_break || !myState.pdh_broken) {
            pdhVal = myState.p_h;
            pdhCol = inputs.pdh_col;
            pdhWidth = 2;
        }
        if (!inputs.stop_on_break || !myState.pdl_broken) {
            pdlVal = myState.p_l;
            pdlCol = inputs.pdl_col;
            pdlWidth = 2;
        }
    }

    if (inputs.debug) {
        dbgHighVal = myState.d_h;
        dbgHighWidth = 1;
        dbgLowVal = myState.d_l;
        dbgLowWidth = 1;
    }

    // --- PLOT (once per series) ---
    plot.line("Daily 50%", eqVal, eqCol, eqWidth);
    plot.line("PDH", pdhVal, pdhCol, pdhWidth);
    plot.line("PDL", pdlVal, pdlCol, pdlWidth);
    plot.line("Debug High", dbgHighVal, color.green, dbgHighWidth);
    plot.line("Debug Low", dbgLowVal, color.red, dbgLowWidth);
};
