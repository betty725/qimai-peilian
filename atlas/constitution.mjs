/* Classification reference: GB/T 46939—2025. The reflection prompts and matching
   rule below are original educational content, separate from the standard scale. */
const standardURL = 'https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=827D6D266BA52A2983F93638DA871028';
const labels = {
  balanced: ['平和质', 'Balanced'],
  qi: ['气虚质', 'Qi deficiency'],
  yang: ['阳虚质', 'Yang deficiency'],
  yin: ['阴虚质', 'Yin deficiency'],
  phlegm: ['痰湿质', 'Phlegm-dampness'],
  heat: ['湿热质', 'Damp-heat'],
  stasis: ['血瘀质', 'Blood stasis'],
  mood: ['气郁质', 'Qi stagnation'],
  sensitivity: ['特禀质', 'Special diathesis (sensitivity)']
};
const advice = {
  balanced: ['挑一个工作间隙，起身走几步，把这次休息留在每天相近的时段。', 'Choose a regular gap in your workday for a short walk or a comfortable change of position.'],
  qi: ['把活动拆成短段，今天先选一个轻松动作，按自己的余力决定是否继续。', 'Split activity into short bouts. Try one easy movement, then decide whether you feel like another.'],
  yang: ['活动前先把座位和衣着调到舒适的温度，慢慢开始。', 'Adjust clothing or room temperature until you are comfortable, then ease into movement.'],
  yin: ['在工位留一杯水，口渴时小口饮用，也留意室内暖气和空调带来的干燥。', 'Keep water within reach for when you feel thirsty, and notice whether heated or air-conditioned rooms feel dry.'],
  phlegm: ['给坐了较久的一段工作留个间隙。按体力散几步，记录哪些时段感觉沉重。', 'Leave a gap after a long seated task. Walk a little if comfortable and note when heaviness tends to appear.'],
  heat: ['挑通风、温度舒适的地方练习，出汗后换下潮湿的衣物。', 'Choose a well-ventilated space at a comfortable temperature. Change out of damp clothes after activity.'],
  stasis: ['把反复出现的皮肤变化和发生日期记下来。经常无故出现瘀青时，请让医生评估原因。', 'Note recurring skin changes and when they appear. If bruises keep appearing without a clear cause, discuss them with a clinician.'],
  mood: ['忙碌间隙离开屏幕片刻，选一个你喜欢的轻松活动，也可以找信任的人聊一聊。', 'Step away from the screen for a moment. Choose an activity you enjoy or check in with someone you trust.'],
  sensitivity: ['记下出现不适时接触过的环境，优先选择以往感觉舒适的练习场所。', 'Note which environments coincide with discomfort and choose a practice space that has felt comfortable before.']
};
const groups = [
  {title:['日间精力','Energy during the day'], items:[
    ['steady','balanced','完成平常的学习或工作后，我通常还有精神做喜欢的事。','After an ordinary workday or study session, I have energy left for things I enjoy.'],
    ['fatigue','qi','做平时熟悉的轻量活动，我也会比自己预期更快觉得累。','Familiar, light activities tire me sooner than I would expect.'],
    ['voice','qi','日常说一会儿话，我就觉得声音没有力气。','During an ordinary conversation my voice starts to feel weak.']
  ]},
  {title:['冷暖感受','Warmth and cold'], items:[
    ['cool','yang','室温让身边的人觉得舒适时，我还想多加一层衣服。','In a room others find comfortable, I want an extra layer.'],
    ['hands','yang','平常在室内活动时，我的手脚还是容易发凉。','My hands or feet feel cold during ordinary activities indoors.'],
    ['warm','yin','安静休息时，我会觉得手心或脚心发热。','Even while resting quietly, my palms or soles feel warm.']
  ]},
  {title:['口中与身体感受','Mouth and body sensations'], items:[
    ['dry','yin','在日常环境中，我的嘴唇或口腔常有干燥感。','My mouth or lips feel dry in everyday settings.'],
    ['sticky','phlegm','离开饭桌一段时间后，嘴里仍容易觉得黏腻。','Even between meals my mouth tends to feel sticky.'],
    ['heavy','phlegm','没做重活的时候，我也会觉得身体沉沉的。','My body feels weighed down even without heavy exertion.']
  ]},
  {title:['皮肤与味觉','Skin and taste'], items:[
    ['oil','heat','平常的一天里，我会注意到脸上明显出油。','I notice a pronounced oily sheen on my face during a typical day.'],
    ['bitter','heat','没有刚吃苦味食物时，嘴里也容易觉得发苦。','I notice a bitter taste even when I have not just eaten anything bitter.'],
    ['bruise','stasis','我发现有些瘀青来得很容易，或想不起是何时碰到的。','I notice bruises after minor bumps or without remembering a bump.']
  ]},
  {title:['皮肤印记与心情','Skin changes and mood'], items:[
    ['marks','stasis','和自己平常的肤色相比，我容易注意到留下较久的褐色印记。','Compared with my usual skin tone, I notice darker patches that linger.'],
    ['worry','mood','一件事结束后，我的思绪还会围着烦心事打转。','After a stressful event passes, I find myself dwelling on it.'],
    ['low','mood','日常生活里，我会有闷闷不乐、难以舒展心情的时候。','In everyday life I feel low and find it hard to shake that feeling.']
  ]},
  {title:['环境与休息','Environment and rest'], items:[
    ['sneeze','sensitivity','没有感冒时，我在某些季节或环境里也容易连续打喷嚏。','In certain seasons or places, I have sneezing spells even without a cold.'],
    ['itch','sensitivity','接触某些环境后，我会反复出现发痒、隆起的皮肤风团。','In particular environments I get recurring itchy, raised welts on my skin.'],
    ['rest','balanced','按自己平时的作息睡醒后，我通常觉得休息得不错。','After my usual sleep schedule, I wake up feeling rested.']
  ]}
];
const prompts = groups.flatMap(group=>group.items);
const idsFor = type => prompts.filter(item => item[1]===type).map(item=>item[0]);
const frequency = [['很少或没有','Rarely or never'],['有时','Sometimes'],['经常','Often'],['不确定 / 跳过','Unsure / skip']];

// Suggest reading topics only when both distinct prompts in a pair were marked often.
// Require broad coverage before any interpretation, and all answers for a balanced result.
export function reflectConstitution(answers) {
  const answered = prompts.filter(([id]) => ['0','1','2'].includes(answers[id])).length;
  const pairOften = type => idsFor(type).every(id => answers[id]==='2');
  const types = Object.keys(labels).filter(type => type!=='balanced');
  const matches = types.filter(pairOften);
  if(answered < 12) return {kind:'incomplete', types:[],answered};
  if(matches.length > 3) return {kind:'broad',types:[],answered};
  if(matches.length) return {kind:matches.length===1?'single':'overlap',types:matches,answered};
  const noFrequentDifficulties=types.every(type=>idsFor(type).every(id=>answers[id]!=='2'));
  if(answered===prompts.length && pairOften('balanced') && noFrequentDifficulties) {
    return {kind:'single', types:['balanced'],answered};
  }
  return {kind:'unclear',types:[],answered};
}

export function mountConstitution(root,{language,onDaily}) {
  const pick=(zh,en)=>language()==='en'?en:zh;
  const tr=pair=>pick(...pair);
  let view='intro',page=0,answers=Object.create(null);
  const text=(tag,content,cls)=>{
    const node=document.createElement(tag);
    if(content!=null) node.textContent=content;
    if(cls) node.className=cls;
    return node;
  };
  function action(label,run,cls='const-quiet') {
    const button=text('button',label,cls);
    button.type='button';
    button.addEventListener('click',run);
    return button;
  }
  function change(next,step=page) {
    view=next;page=step;render();
    root.querySelector('[data-const-focus]')?.focus();
  }
  const stageHeading=title=>{
    const h=text('h3',title); h.tabIndex=-1;h.dataset.constFocus='';return h;
  };
  function clear() {
    answers=Object.create(null);change('intro',0);
  }
  function method() {
    const info=text('details',null,'const-method');
    info.append(text('summary',pick('自评依据与读法','About this check-in')));
    info.append(text('p',pick('九种类型名称参照现行国家标准。这里使用原创体感问题和观察规则，只供成人了解传统体质描述；正式体质判定须使用标准完整量表及其计分方法。','The nine names follow the Chinese national standard. These original prompts and reading rules help adults explore traditional descriptions. Formal classification uses the full standard questionnaire and its scoring method.')));
    info.append(text('p',pick('每种类型有两条线索。至少作答 12 项，且同类两条都选“经常”，才列为阅读线索。平和质还需完整作答，且其他描述均未选“经常”。四类及以上同时符合时，呈现描述较为分散。','Each type has two prompts. A reading topic appears after at least 12 responses and two “Often” choices for that topic. Balanced requires a complete check-in and no “Often” responses for other topics. Four or more matching topics produce a broad-pattern result.')));
    const link=text('a',pick('查看 GB/T 46939—2025《中医体质分类与判定》','View the national standard GB/T 46939–2025 (Chinese)'));
    link.href=standardURL;link.target='_blank';link.rel='noopener noreferrer';
    info.append(link);
    return info;
  }
  function intro(card) {
    card.append(text('p',pick('回想过去一年平常的日子，记录冷暖、精力和休息等感受，看看哪些传统体质描述与你的自述相近。','Think about ordinary days over the past year. Reflect on energy, temperature and rest to explore traditional constitution descriptions that resemble your experiences.')));
    const bar=text('div',null,'const-bar');
    bar.append(action(pick('开始体感自评','Start my check-in'),()=>change('questions',0),'const-main'));
    bar.append(text('span',pick('成人自评 · 18 项 · 可跳过','For adults · 18 prompts · Skipping allowed'),'const-sub'));
    card.append(bar);
  }
  function questions(card) {
    const group=groups[page];
    const heading=stageHeading(tr(group.title));
    const progress=text('div',null,'const-progress');
    progress.append(text('span',pick('第 '+(page+1)+' / '+groups.length+' 组','Part '+(page+1)+' of '+groups.length)));
    const meter=document.createElement('progress');meter.max=groups.length;meter.value=page+1;meter.setAttribute('aria-label',pick('问答进度','Question progress'));progress.append(meter);
    card.append(progress,heading,text('p',pick('按过去一年平常的情况作答。生病或熬夜后偶尔出现的感受，可以选“很少或没有”。','Think about a typical day in the past year. If something occurred only during a brief illness or an occasional late night, you can choose “Rarely or never”.'),'const-sub'));
    const status=text('p','','const-status');status.setAttribute('role','status');
    for(const [id,type,zh,en] of group.items) {
      const field=text('fieldset',null,'const-prompt');
      field.append(text('legend',pick(zh,en)));
      const row=text('div',null,'const-options');
      frequency.forEach((name,i)=>{
        const option=text('label',null,'const-option');
        const radio=document.createElement('input');radio.type='radio';radio.name='const-'+id;radio.value=String(i);radio.checked=answers[id]===radio.value;
        radio.addEventListener('change',()=>{answers[id]=radio.value;status.textContent='';});
        option.append(radio,text('span',tr(name)));row.append(option);
      });
      field.append(row);card.append(field);
    }
    const forward=()=>change(page===groups.length-1?'result':'questions',Math.min(groups.length-1,page+1));
    const nav=text('div',null,'const-bar');
    nav.append(action(pick('上一步','Back'),()=>change(page===0?'intro':'questions',Math.max(0,page-1))));
    nav.append(action(page===groups.length-1?pick('查看自评小记','See my reflection'):pick('下一组','Next group'),()=>{
      const missing=group.items.find(([id])=>answers[id]==null);
      if(missing) {
        status.textContent=pick('请为每项选一个频率，也可以跳过未答项。','Choose a response for each item, or skip the unanswered items.');
        card.querySelector('input[name="const-'+missing[0]+'"]').focus();return;
      }
      forward();
    },'const-main'));
    nav.append(action(pick('跳过未答项','Skip unanswered'),()=>{
      group.items.forEach(([id])=>{if(answers[id]==null)answers[id]='3';});
      forward();
    }));
    card.append(status,nav);
  }
  function result(card) {
    const r=reflectConstitution(answers);
    const titles={
      single:['与你的自述相近的描述','A description that resembles your experience'],
      overlap:['几种描述都与你的自述相近','Your responses fit more than one description'],
      unclear:['暂时没有集中的线索','No clear cluster this time'],
      broad:['你的自述涉及较多方面','Your responses span many topics'],
      incomplete:['目前的自述还不够完整','There are too few responses to interpret']
    };
    card.append(stageHeading(tr(titles[r.kind])),text('p',pick('已回答 '+r.answered+' / '+prompts.length+' 项。以下是体感学习笔记，不构成诊断。',r.answered+' of '+prompts.length+' answered. This is an educational reflection, not a diagnosis.'),'const-sub'));
    for (const type of r.types) {
      const block=text('section',null,'const-match');block.append(text('h4',tr(labels[type])));
      block.append(text('p',pick('你将这两项标为“经常”','You marked both experiences “Often”'),'const-sub'));
      const list=text('ul',null,'const-evidence');
      prompts.filter(item=>item[1]===type).forEach(item=>list.append(text('li',pick(item[2],item[3]))));
      block.append(list,text('p',tr(advice[type])));card.append(block);
    }
    if(!r.types.length) {
      const note={
        incomplete:['可以返回补充感受，也可以直接跟看山休息一下。跳过的项目不会算作“没有”。','You can add more responses or take a movement break. Skipped items do not count as “never”.'],
        broad:['多组描述都被选为“经常”，这次先不归为某种倾向。可记录它们在什么情况下出现，再回看自己的答案。','You marked several different patterns “Often”. Rather than assigning a type, note when these experiences arise and revisit your answers.'],
        unclear:['目前没有足够集中的描述可供对读。可以在平常日子多留意精力、冷暖和休息，也可以照常做一次轻松短练。','No single description stands out. Notice energy, comfort and rest on ordinary days, or enjoy a gentle movement break.']
      };
      card.append(text('p',tr(note[r.kind]),'const-result-note'));
    }
    card.append(text('p',pick('新出现、反复或持续影响生活的不适，建议带着记录咨询医生。','Consider discussing new, recurring or disruptive symptoms with a clinician.'),'const-sub'));
    const bar=text('div',null,'const-bar');
    if(onDaily)bar.append(action(pick('去做今日小练','Open today’s movement break'),onDaily,'const-main'));
    bar.append(action(pick('回看答案','Review answers'),()=>change('questions',0)),action(pick('清除并重填','Clear and restart'),clear));
    card.append(bar);
  }
  function render() {
    root.classList.add('const-root');
    const heading=text('h2',pick('体质自评','Constitution check-in'),'const-heading');heading.tabIndex=-1;
    if(view==='intro')heading.dataset.constFocus='';
    const card=text('div',null,'const-card');
    if(view==='intro') intro(card);
    else if(view==='questions') questions(card);
    else result(card);
    const footer=text('div',null,'const-footer');
    footer.append(text('span',pick('回答只在当前页面使用，不保存、不上传。','Answers stay on this page, with no storage or upload.')));
    if(view==='questions')footer.append(action(pick('清除并退出','Clear and exit'),clear));
    root.replaceChildren(heading,card,footer,method());
  }
  render();
  return {render};
}
