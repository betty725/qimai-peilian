// Game points for Kanshan's habit journal. The targets belong to each day's entry.
const DAY_MS = 86400000;
const organNames = ['heart', 'liver', 'spleen', 'lung', 'kidney'];

function clockMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function bedtimePoints(actual, target) {
  const start = clockMinutes(actual);
  const goal = clockMinutes(target);
  if (start === null || goal === null) return 0;
  const distance = Math.abs(start - goal);
  return Math.min(distance, 1440 - distance) <= 30 ? 1 : -1;
}

function numericValue(value) {
  if (typeof value === 'string' && value.trim() !== '') value = Number(value);
  return Number.isFinite(value) ? value : null;
}

function amountPoints(actual, target, maximum = Infinity) {
  const amount = numericValue(actual);
  const goal = numericValue(target);
  if (amount === null || amount < 0 || amount > maximum) return 0;
  if (goal === null || goal <= 0 || goal > maximum) return 0;
  return amount >= goal ? 1 : -1;
}

function activityPoints(value) {
  if (value === true) return 1;
  if (value === false) return -1;
  return 0;
}

export function dailyScore(entry = {}, practiced = false) {
  entry = entry ?? {};
  const parts = {
    bedtime: bedtimePoints(entry.bedtime, entry.targetBedtime),
    sleep: amountPoints(entry.sleepHours, entry.targetSleepHours, 24),
    water: amountPoints(entry.waterMl, entry.targetWaterMl),
    walk: activityPoints(entry.walk),
    exercise: practiced === true ? 1 : activityPoints(entry.exercise),
  };
  const values = Object.values(parts);
  return {
    parts,
    total: values.reduce((sum, value) => sum + value, 0),
    count: values.filter(value => value !== 0).length,
  };
}

function dayNumber(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return NaN;
  const stamp = Date.parse(iso + 'T00:00:00Z');
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== iso) return NaN;
  return stamp / DAY_MS;
}

function meterAfter(current, points) {
  return Math.min(100, Math.max(0, current + points));
}

export function summarize(recordsByDay = {}, practiceDays = new Set(), asOf) {
  const lastDay = dayNumber(asOf);
  const dates = new Set([...Object.keys(recordsByDay), ...practiceDays]);
  const organs = Object.fromEntries(organNames.map(name => [name, 50]));
  let value = 50;
  let recentSum = 0;
  let recentCount = 0;
  let today = dailyScore();
  const recentTotals = { ...today.parts };
  for (const date of [...dates].sort()) {
    const age = lastDay - dayNumber(date);
    if (!Number.isFinite(age) || age < 0) continue;
    const entry = recordsByDay[date];
    const score = dailyScore(entry, practiceDays.has(date));
    if (!score.count) continue;
    value = meterAfter(value, score.total);
    const organ = organNames.includes(entry?.organ) ? entry.organ : 'heart';
    organs[organ] = meterAfter(organs[organ], score.parts.walk + score.parts.exercise);
    if (age === 0) today = score;
    if (age < 28) {
      recentSum += score.total;
      for (const [habit, points] of Object.entries(score.parts)) recentTotals[habit] += points;
      recentCount++;
    }
  }
  const recentParts = Object.fromEntries(Object.entries(recentTotals).map(([habit, total]) => [
    habit, recentCount ? total / recentCount : null,
  ]));
  return { value, today, recentCount, recentAverage: recentCount ? recentSum / recentCount : null, recentParts, organs };
}

// Project cumulative net game points at a constant daily pace, separately from the 0–100 meters.
export function projectScenario(recentAverage, extraPerWeek = 0, habitMean) {
  if (!Number.isFinite(recentAverage)) return [];
  const bound = pace => Math.max(-5, Math.min(5, pace));
  const baselineRate = bound(recentAverage);
  const extra = numericValue(extraPerWeek) ?? 0;
  let changePerDay = extra / 7;
  if (Number.isFinite(habitMean)) {
    // On the selected days, replace this habit's historical contribution with the chosen outcome.
    const shareOfWeek = Math.min(7, Math.abs(extra)) / 7;
    changePerDay = shareOfWeek * (Math.sign(extra) - habitMean);
  }
  const scenarioRate = bound(baselineRate + changePerDay);
  return [0, 5, 10, 15, 20].map(year => {
    const days = year * 365.2425;
    return { year, baseline: Math.round(baselineRate * days) || 0, scenario: Math.round(scenarioRate * days) || 0 };
  });
}
