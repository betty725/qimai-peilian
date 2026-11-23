// Editorial prompts match the three movements for each of the ten stems.
const practiceThemes = [
  ['向两侧慢慢舒展', 'Reach gently to each side'],
  ['松肩展臂', 'Relax the shoulders and open the arms'],
  ['转腕展掌', 'Turn the wrists and open the palms'],
  ['展臂，缓缓收势', 'Open the arms and settle slowly'],
  ['交替单举，上下舒展', 'Alternate the single-palm lift'],
  ['轻缓单举，舒展腰身', 'Lift gently, stretch and release the waist'],
  ['松肩开合', 'Release the shoulders and open the arms'],
  ['转腕松肩', 'Loosen the wrists and shoulders'],
  ['展臂暖掌', 'Open the arms and warm the palms'],
  ['侧身舒展，暖掌收势', 'Reach to each side and finish with warm palms']
];

const branchPhases = {
  子:'水', 丑:'土', 寅:'木', 卯:'木', 辰:'土', 巳:'火',
  午:'火', 未:'土', 申:'金', 酉:'金', 戌:'土', 亥:'水'
};
const traditions = {
  木:['肝', 'Wood', 'Liver'], 火:['心', 'Fire', 'Heart'], 土:['脾', 'Earth', 'Spleen'],
  金:['肺', 'Metal', 'Lung'], 水:['肾', 'Water', 'Kidney']
};

export function almanacReading(day, english) {
  const branchPhase = branchPhases[day.branch];
  const [organ, phaseEn, organEn] = traditions[branchPhase];
  const polarity = day.stemIndex % 2 === 0 ? ['阳','yang'] : ['阴','yin'];
  return {
    theme:practiceThemes[day.stemIndex][english ? 1 : 0],
    stems: english
      ? `Stem ${day.stem}: ${polarity[1]} ${day.en} · ${day.organEn}. Branch ${day.branch}: ${phaseEn} · ${organEn}.`
      : `日干「${day.stem}」属${polarity[0]}${day.element}，五行配${day.organ}；日支「${day.branch}」属${branchPhase}，五行配${organ}。`
  };
}

export function lunarDate(iso, english) {
  // Keep civil-day labels stable across device time zones, including leap months.
  try {
    const format = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {calendar:'chinese',month:'long',day:'numeric',timeZone:'Asia/Shanghai'});
    if (format.resolvedOptions().calendar !== 'chinese') return '';
    const parts = format.formatToParts(new Date(iso+'T04:00:00Z'));
    const month = parts.find(p=>p.type==='month')?.value;
    const day = Number(parts.find(p=>p.type==='day')?.value);
    if (!month || day<1 || day>30 || !Number.isInteger(day)) return '';
    const digits = '一二三四五六七八九十';
    const name = day===20 ? '二十' : day===30 ? '三十' : ['初','十','廿'][Math.floor((day-1)/10)] + digits[(day-1)%10];
    return (english ? 'Lunar · ' : '农历') + month + name;
  } catch { return ''; }
}
