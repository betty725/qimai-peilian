/* Ordered movement evidence for the daily desk routine. Raw MediaPipe image landmarks. */
(function (global) {
  'use strict';
  const cues = {
    frame: ['请正对镜头，让头、双肩、双肘和双手完整入镜。', 'Face the camera with your head, shoulders, elbows and hands in view.'],
    hands: ['双手的位置暂时看不清。请让两只手腕都露出来，必要时稍微后退。', 'Bring both wrists into view. Move back a little if needed.'],
    fingers: ['请让两只手的食指侧朝向镜头，露出指尖和手腕。', 'Let the camera see both wrists and the index-finger side of each hand.'],
    level: ['身体有些侧倾。请先回到正中，让双肩大致齐平。', 'Return to the centre with both shoulders roughly level.'],
    shouldersDown: ['两臂自然放低，双肩松下来，稍停一下。', 'Rest both arms low, relax your shoulders and pause briefly.'],
    shouldersUp: ['双臂保持放低，缓缓把两肩一起提起一点。', 'Keep your arms low and gently lift both shoulders together.'],
    shouldersReturn: ['下巴保持平稳，让双肩向后、向下回到放松的位置。', 'Keep your chin steady and roll both shoulders back and down to their starting height.'],
    head: ['下巴保持平稳，让肩膀带动回环。', 'Keep the chin steady and let the shoulders lead the roll.'],
    closed: ['双手回到胸前靠拢，双肘自然弯曲。', 'Bring both hands close together in front of the chest, with soft elbows.'],
    opened: ['双手从胸前向各自一侧分开，左右手一起展开。', 'Open both hands from your chest, each towards its own side.'],
    front: ['先把两只手放在身前、胸口附近，稍停一下。', 'Start with both hands in front of your chest and pause briefly.'],
    lowerSeated: ['让两只手从胸前慢慢落到大腿上。', 'Slowly lower both hands from your chest to your thighs.'],
    lowerStanding: ['让两只手从胸前慢慢落到身体两侧。', 'Slowly lower both hands from your chest to your sides.'],
    still: ['双手已落下。在这里停稳，保持自然呼吸。', 'Your hands are down. Let them rest here and breathe naturally.'],
    neutral: ['双手先收回身前或放低，肩膀保持平稳。', 'Return both hands in front of you or let them rest low. Keep your shoulders level.'],
    lift: ['一手向上托到额头附近，另一只手向下舒展。', 'Lift one hand towards forehead height while extending the other down.'],
    liftOther: ['换另一只手上托，刚才举起的手向下放松。', 'Lift the other hand now, letting the first one reach down.'],
    reach: ['一手伸向同侧，另一只手留在身前或身侧。', 'Reach one hand out to its own side and keep the other close to you.'],
    reachOther: ['换另一只手向同侧舒展，身体保持平稳。', 'Reach out to the other side now, keeping the body steady.'],
    circle: ['双肘靠近身体，让两只手在镜头前慢慢画小圈。', 'Keep both elbows close and trace small circles with both hands facing the camera.'],
    reverse: ['换个方向，两只手都慢慢画小圈。', 'Reverse direction and draw small circles with both hands.'],
    rub: ['两手靠在一起，在胸腹前轻轻来回搓动几下。', 'Hold your palms close in front of you and gently rub them back and forth.'],
    waist: ['轻轻将双手分开放到腰部两侧，并停稳一下。', 'Separate your hands, rest them at the sides of your waist and pause there.'],
    back: ['把两只手从腰侧收回身前靠拢。', 'Bring both hands together again in front of your body.'],
    done: ['已识别本式动作。', 'Movement recognised.']
  };
  const sequences = {
    shoulder: ['shouldersDown', 'shouldersUp', 'shouldersReturn', 'shouldersUp', 'shouldersReturn'],
    open: ['closed', 'opened', 'closed', 'opened', 'closed'],
    settle: ['front', 'lower', 'still'],
    lift: ['neutral', 'lift', 'neutral', 'liftOther', 'neutral'],
    reach: ['neutral', 'reach', 'neutral', 'reachOther', 'neutral'],
    wrists: ['circle', 'reverse'],
    warm: ['rub', 'waist', 'back']
  };
  const config = global.QimaiTrackingConfig || {};
  const visible = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 &&
    (p.visibility === undefined || p.visibility >= (config.visibility ?? .4)) &&
    (p.presence === undefined || p.presence >= (config.landmarkPresence ?? .5));
  const both = (points, fn) => points.every(fn);
  const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mean = (a, b) => (a + b) / 2;

  function geometry(points, aspect, move) {
    if (![0, 11, 12, 13, 14].every(i => visible(points?.[i]))) return 'frame';
    if (![15, 16].every(i => visible(points[i]))) return 'hands';
    if (move === 'wrists' && ![19, 20].every(i => visible(points[i]))) return 'fingers';
    const shoulders = [points[11], points[12]];
    const width = Math.abs(shoulders[0].x - shoulders[1].x);
    if (width < .05 || width * aspect < .07) return 'frame';
    const centre = {x: mean(shoulders[0].x, shoulders[1].x), y: mean(shoulders[0].y, shoulders[1].y)};
    const scaleY = width * aspect;
    const sign = Math.sign(shoulders[0].x - shoulders[1].x);
    const normal = p => ({x: (p.x - centre.x) * sign / width, y: (p.y - centre.y) / scaleY});
    const w = [points[15], points[16]].map(normal);
    const e = [points[13], points[14]].map(normal);
    const finger = move === 'wrists' ? [points[19], points[20]].map(normal) : null;
    const nose = normal(points[0]);
    if (Math.abs(shoulders[0].y - shoulders[1].y) > .33 * scaleY) return 'level';
    if (Math.abs(nose.x) > .54) return 'level';
    const hips = [23, 24].every(i => visible(points[i])) ? [points[23], points[24]].map(normal) : null;
    if (hips && Math.abs(mean(hips[0].x, hips[1].x)) > .50) return 'level';
    return {w, e, finger, shoulders, nose, centre, hips, scaleY, headY: points[0].y};
  }

  // Detect one closed loop at a time. Translation with the elbow is removed upstream.
  // Extent along both axes, signed area, and limited backtracking reject lines and tremor.
  function circleDirection(samples, now, p) {
    const last = samples[samples.length - 1];
    if (last && gap(last, p) < .009) return 0;
    samples.push({...p, t: now});
    while (samples.length > 2 && (now - samples[0].t > 8000 || samples.length > 240)) samples.shift();
    const end = samples.length - 1;
    for (let start = end - 7; start >= 0; start--) {
      if (now - samples[start].t < 350 || gap(p, samples[start]) > .12) continue;
      let left = p.x, right = p.x, top = p.y, bottom = p.y, area2 = 0, length = 0;
      for (let j = start; j <= end; j++) {
        const a = samples[j], b = j === end ? samples[start] : samples[j + 1];
        left = Math.min(left, a.x); right = Math.max(right, a.x);
        top = Math.min(top, a.y); bottom = Math.max(bottom, a.y);
        area2 += (a.x - p.x) * (b.y - p.y) - (a.y - p.y) * (b.x - p.x);
        length += gap(a, b);
      }
      const dx = right - left, dy = bottom - top;
      if (Math.min(dx, dy) < .065 || Math.max(dx, dy) > .85 || gap(p, samples[start]) > .34 * Math.max(dx, dy)) continue;
      if (Math.abs(area2) < .85 * dx * dy || 2 * Math.PI * Math.abs(area2) < .40 * length * length) continue;
      samples.splice(0, end);
      return Math.sign(area2);
    }
    return 0;
  }

  function create(moveId, mode) {
    const sequence = sequences[moveId];
    if (!sequence) throw new RangeError('Unknown daily movement');
    const seated = mode === 'seated' || mode === 'sitting';
    let step, lastTime, lastValid, hold, ref, firstSide, loops, strokes, fraction, result;
    const stage = () => sequence[step];
    const defaultCue = () => stage() === 'lower' ? (seated ? 'lowerSeated' : 'lowerStanding') : stage() || 'done';
    function report(key, tracking) {
      result = {complete: step === sequence.length, tracking, progress: Math.min(1, (step + fraction) / sequence.length),
        tip: cues[key][0], tipEn: cues[key][1]};
      return result;
    }
    function clearMotion() {
      hold = null;
      strokes = null;
      fraction = 0;
      if (loops) for (const hand of loops) hand.samples = [];
    }
    function reset() {
      step = 0; lastTime = -Infinity; lastValid = -Infinity; ref = null; firstSide = null;
      loops = [0, 1].map(() => ({samples: [], direction: 0, count: 0}));
      clearMotion();
      return report(defaultCue(), false);
    }
    function advance() {
      step++;
      clearMotion();
    }
    function held(key, now, duration) {
      if (hold?.key !== key) hold = {key, since: now, count: 0};
      hold.count++;
      fraction = Math.min(.95, (now - hold.since) / duration);
      return hold.count >= 2 && now - hold.since >= duration;
    }
    function rub(f, now) {
      const [a,b] = f.w;
      if (gap(a,b) > .54 || !both(f.w, p => Math.abs(p.x) < .59 && p.y > -.28 && p.y < 1.07)) {
        strokes = null; fraction = 0; return false;
      }
      const displacement = [a.x - b.x, a.y - b.y];
      if (!strokes) strokes = displacement.map(value => ({extreme:value, sign:0, count:0, last:now}));
      // Let either axis establish the rubbing direction. Bringing hands together
      // horizontally first must not lock out subsequent vertical rubbing.
      for (let i = 0; i < strokes.length; i++) {
        const s = strokes[i], value = displacement[i], change = value - s.extreme;
        if (s.sign && change * s.sign > 0) s.extreme = value;
        else if (Math.abs(change) >= .055 && now - s.last >= 90) {
          s.sign = Math.sign(change); s.extreme = value; s.count++; s.last = now;
        }
      }
      const count = Math.max(...strokes.map(s => s.count));
      fraction = count / 5;
      return count >= 5;
    }

    function update(points, now, aspect = 4/3) {
      if (step === sequence.length) return result;
      if (!Number.isFinite(now) || now <= lastTime) return result;
      if ((Number.isFinite(lastValid) && now - lastValid > 850) || (now - lastTime > 850 && Number.isFinite(lastTime))) reset();
      lastTime = now;
      const f = Number.isFinite(aspect) && aspect > 0 ? geometry(points, aspect, moveId) : 'frame';
      if (typeof f === 'string') { clearMotion(); return report(f, false); }
      lastValid = now;
      const {w, e} = f;
      const sh = stage();
      let cue = defaultCue(), ok = false, duration = 140, observedSide = -1;
      const inFront = both(w, p => Math.abs(p.x) <= .78 && p.y > -.42 && p.y <= .62);
      const close = inFront && gap(w[0], w[1]) <= .72 && both(w, p => Math.abs(p.x) < .51);
      const down = both(w, p => p.y >= .62 && Math.abs(p.x) < .98) && both(e, p => p.y > .14 && Math.abs(p.x) < .92);
      if (moveId === 'shoulder') {
        const relative = f.shoulders.map(p => (p.y - f.headY) / f.scaleY);
        if (!down) cue = 'shouldersDown';
        else if (sh === 'shouldersDown') { ok = true; duration = 260; }
        else {
          const stableHead = Math.abs(f.headY - ref.headY) / ref.scaleY < .105;
          const delta = ref.shoulders.map((p,i) => (p.y - f.shoulders[i].y) / ref.scaleY);
          const raised = relative.map((v,i) => ref.relative[i] - v);
          if (!stableHead) cue = 'head';
          else if (sh === 'shouldersUp') {
            ok = raised.every(v => v >= .048) && delta.every(v => v >= .030);
            duration = 95;
            // A person who joins partway through a roll may first relax farther down.
            if (raised.every(v => v < -.025)) ref = {...f, relative};
          } else {
            ok = raised.every(v => v < .026) && delta.every(v => v < .032);
            duration = 155;
          }
        }
        if (ok && held(sh,now,duration)) {
          if (sh !== 'shouldersUp') ref = {...f, relative};
          advance();
        }
      } else if (moveId === 'wrists') {
        const near = both(e, p => Math.abs(p.x) < .88 && p.y >= -.10) && both(w,p => Math.abs(p.x) < 1.12 && p.y < 1.08);
        if (near) {
          for (let i = 0; i < 2; i++) {
            const hand = loops[i];
            if (hand.count >= 2) continue;
            const point = {x: f.finger[i].x - e[i].x, y: f.finger[i].y - e[i].y};
            const direction = circleDirection(hand.samples, now, point);
            if (!direction) continue;
            if (!hand.direction) hand.direction = direction;
            if (direction === (step === 0 ? hand.direction : -hand.direction)) hand.count++;
          }
          fraction = (loops[0].count + loops[1].count) / 4;
          if (loops.every(h => h.count >= 2)) {
            for (const hand of loops) hand.count = 0;
            advance();
          }
        } else { for (const hand of loops) hand.samples = []; }
      } else if (sh === 'rub') {
        if (rub(f, now)) advance();
      } else {
        switch (sh) {
          case 'closed': ok = close; break;
          case 'opened':
            ok = both(w, (p,i) => p.x * (i ? -1 : 1) > .77 && p.y > -.62 && p.y < .75);
            break;
          case 'front': ok = inFront; duration = 240; break;
          case 'lower':
          case 'still': {
            const lowered = both(w, (p,i) => p.y - ref.start[i].y >= .39 && p.y >= (seated ? .76 : .94) && Math.abs(p.x) < 1.0);
            ok = lowered;
            if (sh === 'still') {
              if (!lowered) { step--; fraction = 0; hold = null; return report(defaultCue(), true); }
              if (!hold || !both(w,(p,i) => gap(p,ref.rest[i]) <= .13)) {
                hold = null; ref.rest = w;
              }
              duration = 1200;
            }
            break;
          }
          case 'neutral':
            ok = both(w, p => Math.abs(p.x) < .76 && p.y > -.15);
            break;
          case 'lift': case 'liftOther': case 'reach': case 'reachOther': {
            const lifting = moveId === 'lift';
            const sides = [0,1].filter(i => {
              const hand = w[i], other = w[1-i];
              return lifting ? hand.y < Math.min(-.31, f.nose.y + .06) && other.y > .59 && Math.abs(other.x) < .93 :
                (i ? -1 : 1) * hand.x > .97 && hand.y > -.62 && hand.y < .87 && Math.abs(other.x) < .76 && other.y > -.17;
            });
            if (sides.length === 1) {
              observedSide = sides[0];
              ok = !sh.endsWith('Other') || observedSide !== firstSide;
            }
            break;
          }
          case 'waist':
            ok = both(w,(p,i) => p.x * (i ? -1 : 1) >= .23 && Math.abs(p.x) < .91 &&
              p.y >= .65 && p.y <= 1.62 && (!f.hips || Math.abs(p.y - f.hips[i].y) < .62));
            duration = 450;
            break;
          case 'back': ok = both(w,p => p.y >= -.28 && p.y < .96 && Math.abs(p.x) < .48) && gap(w[0],w[1]) < .52; break;
        }
        if (ok && held(sh + observedSide,now,duration)) {
          if (sh === 'lift' || sh === 'reach') firstSide = observedSide;
          if (sh === 'front') ref = {start:w,rest:null};
          if (sh === 'lower') ref.rest = w;
          advance();
        }
      }
      if (!ok && moveId !== 'wrists' && sh !== 'rub') { hold = null; fraction = 0; }
      return report(sh === stage() ? cue : defaultCue(), true);
    }
    reset();
    return {update,reset};
  }
  global.QimaiDailyEvaluator = {create};
})(typeof window === 'undefined' ? globalThis : window);
