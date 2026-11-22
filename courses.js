(function () {
  'use strict';
  const base = {
    0:[.5,.19], 11:[.39,.35], 12:[.61,.35], 13:[.35,.47], 14:[.65,.47],
    15:[.36,.59], 16:[.64,.59], 23:[.43,.61], 24:[.57,.61],
    25:[.42,.77], 26:[.58,.77], 27:[.4,.94], 28:[.6,.94]
  };
  const shape = changes => ({ ...base, ...changes });
  const mirror = points => Object.fromEntries(Object.entries(points).map(([key, point]) => {
    const pairs = {11:12,12:11,13:14,14:13,15:16,16:15,23:24,24:23,25:26,26:25,27:28,28:27};
    return [pairs[key] || key, [1 - point[0], point[1]]];
  }));
  const poses = {
    rest: shape({}),
    prayer: shape({13:[.32,.46],14:[.68,.46],15:[.48,.36],16:[.52,.36]}),
    spread: shape({13:[.23,.35],14:[.77,.35],15:[.06,.35],16:[.94,.35]}),
    sky: shape({13:[.41,.20],14:[.59,.20],15:[.43,.045],16:[.57,.045],27:[.4,.91],28:[.6,.91]}),
    starL: shape({0:[.47,.18],13:[.34,.19],15:[.43,.05],14:[.68,.50],16:[.55,.58]}),
    pullL: shape({0:[.43,.23],11:[.34,.38],12:[.54,.38],13:[.18,.4],15:[.27,.34],14:[.67,.48],16:[.8,.57],23:[.4,.63],24:[.54,.63],25:[.25,.72],26:[.7,.76],27:[.15,.94],28:[.82,.94]}),
    push: shape({13:[.35,.37],14:[.65,.37],15:[.31,.31],16:[.69,.31]}),
    knifeL: shape({0:[.48,.20],13:[.3,.17],15:[.56,.22],14:[.7,.52],16:[.47,.53]}),
    squat: shape({0:[.5,.32],11:[.39,.47],12:[.61,.47],13:[.32,.60],14:[.68,.60],15:[.32,.69],16:[.68,.69],23:[.42,.7],24:[.58,.7],25:[.25,.76],26:[.75,.76],27:[.23,.94],28:[.77,.94]}),
    clawL: shape({0:[.37,.37],11:[.30,.49],12:[.49,.45],13:[.16,.49],15:[.07,.59],14:[.58,.49],16:[.52,.56],23:[.46,.64],24:[.6,.64]}),
    tigerL: shape({0:[.26,.46],11:[.28,.56],12:[.42,.54],13:[.22,.7],14:[.34,.7],15:[.19,.87],16:[.31,.87],23:[.53,.61],24:[.64,.61],25:[.34,.72],26:[.76,.77],27:[.24,.94],28:[.91,.94]}),
    bowReady: shape({13:[.3,.19],14:[.7,.19],15:[.46,.21],16:[.54,.21]}),
    bow: shape({0:[.5,.52],11:[.39,.57],12:[.61,.57],13:[.30,.49],14:[.70,.49],15:[.45,.48],16:[.55,.48],23:[.43,.66],24:[.57,.66]}),
    tailL: shape({0:[.42,.58],11:[.35,.62],12:[.57,.62],13:[.40,.74],14:[.55,.74],15:[.47,.88],16:[.53,.88],23:[.48,.66],24:[.62,.66]}),
    close: shape({13:[.34,.51],14:[.66,.51],15:[.47,.59],16:[.53,.59]})
  };
  ['star','pull','knife','claw','tiger','tail'].forEach(name => { poses[name+'R'] = mirror(poses[name+'L']); });
  function step(pose, cue, breath = '自然呼吸', check = null) { return {pose, cue, breath, check}; }
  const rest = step('rest','松肩，回到舒适的起始位置','自然呼吸','rest');
  const lessons = [
    {id:'wei1',name:'韦驮献杵第一势',short:'合掌静立',story:'从安静的站立开始，留意肩膀是否放松，给自己一点准备时间。',tip:'合掌时腋下留出空间。',view:'正面',ai:true,
      steps:[rest,step('prayer','两手缓缓来到胸前，轻轻合掌','自然吸气','prayer'),step('prayer','保持肩膀放松，手掌轻合','自然呼气','prayer'),rest]},
    {id:'wei2',name:'韦驮献杵第二势',short:'展臂平撑',story:'展开双臂，感受身体两侧的空间。平稳地展开与收回，都是这次练习的一部分。',tip:'双臂与肩大致同高，避免耸肩。',view:'正面',ai:true,
      steps:[step('prayer','两手回到胸前','自然呼吸','prayer'),step('spread','双臂慢慢向两侧展开','自然吸气','spread'),step('spread','保持两侧舒展，手腕与肩同高','自然呼气','spread'),step('prayer','缓缓收回双手','自然呼吸','prayer')]},
    {id:'wei3',name:'韦驮献杵第三势',short:'双掌上托',story:'托举时把注意力放在向上的伸展，收回时体会放松。动作幅度可以慢慢增加。',tip:'站姿上托可轻提脚跟，先保持平衡。',view:'正面',ai:true,
      steps:[step('prayer','双手准备向上托举','自然呼吸','prayer'),step('sky','双掌慢慢举到头顶上方','自然吸气','sky'),step('sky','舒适伸展，站姿可轻提脚跟','自然呼吸','sky'),step('prayer','脚跟轻落，双手缓缓收回','自然呼气','prayer')]},
    {id:'star',name:'摘星换斗势',short:'左右摘星',story:'招式的名字借用了星空意象。左右交替时，观察两边动作的节奏是否一致。',tip:'轻缓转动，抬手时避免挺腹。',view:'正面示意',ai:false,
      steps:[step('starL','一手向上伸展，另一手轻放身后','自然吸气'),step('close','放松回正，准备换侧','自然呼气'),step('starR','换另一侧向上伸展','自然吸气'),step('close','缓缓回到正中','自然呼气')]},
    {id:'pull',name:'倒拽九牛尾势',short:'前后牵引',story:'名字有力量感，练习时仍需要松柔。试着感受前后手臂协调的变化。',tip:'弓步前后稳定，牵引时保留余力。',view:'侧向示意',ai:false,
      steps:[step('pullL','一脚前出成舒适弓步，双臂前后牵引','自然呼气'),rest,step('pullR','换侧弓步，缓缓转动双臂','自然呼气'),rest]},
    {id:'push',name:'出爪亮翅势',short:'舒展推掌',story:'向前推出，再缓缓收回。用从容的节奏体会伸展与放松的交替。',tip:'推掌时松肩，避免屏气用力。',view:'正面示意',ai:false,
      steps:[step('prayer','双手来到胸前，松肩','自然吸气'),step('push','双掌缓缓向前推开','自然呼气'),step('push','保持舒适的前伸','自然呼吸'),step('prayer','缓缓收回双掌','自然吸气')]},
    {id:'knife',name:'九鬼拔马刀势',short:'绕臂展肩',story:'这一势包含绕臂与转体。先记住路线，再逐渐体会手臂与躯干的配合。',tip:'手臂到舒适位置即可，转头幅度放小。',view:'前后手臂示意',ai:false,
      steps:[step('knifeL','一手绕到头后，另一手轻贴背部','自然吸气'),step('close','松肩回正，准备换侧','自然呼气'),step('knifeR','换侧缓缓绕臂','自然吸气'),step('close','轻轻放下双臂','自然呼气')]},
    {id:'squat',name:'三盘落地势',short:'起落有序',story:'升起与落下都有节奏。今天先找适合自己的蹲起幅度。',tip:'膝盖沿脚尖方向，保持可控的蹲起幅度。',view:'正面',ai:false,
      steps:[step('spread','双脚适当分开，双臂展开','自然吸气'),step('squat','缓缓屈膝，双掌下按，呼气可轻发嗨音','自然呼气'),step('squat','稳定重心，保持舒适幅度','自然呼吸'),step('close','缓缓起身，双手收回','自然吸气')]},
    {id:'claw',name:'青龙探爪势',short:'转身探掌',story:'用手臂的路径连接转身和回正。留意动作之间的衔接。',tip:'转体与前俯缓慢进行，重心保持稳定。',view:'转体示意',ai:false,
      steps:[step('clawL','向一侧转体探掌，再缓缓向下划弧','自然呼气'),step('close','缓缓回正','自然吸气'),step('clawR','换侧转体探掌','自然呼气'),step('close','松肩回正','自然吸气')]},
    {id:'tiger',name:'卧虎扑食势',short:'弓步俯身',story:'这一势的前后重心变化更明显。先看清路线，按自己的活动能力练习。',tip:'前方留出空间，俯身幅度以稳定舒适为准。',view:'侧面示意',ai:false,
      steps:[step('tigerL','一脚前出，缓缓俯身向前下方伸手','自然呼气'),rest,step('tigerR','换侧弓步，轻缓前伸','自然呼气'),rest]},
    {id:'bow',name:'打躬势',short:'缓缓前屈',story:'把一次前屈拆成缓慢的小过程。起身也留出足够的时间。',tip:'按舒适范围前屈，起身时保持缓慢。',view:'前屈示意',ai:false,
      steps:[step('bowReady','双手轻放头后，准备前屈','自然呼吸'),step('bow','上体缓慢前屈，双肘自然展开','自然呼气'),step('bow','停留在舒适位置，保持呼吸','自然呼吸'),step('prayer','慢慢起身回正','自然吸气')]},
    {id:'tail',name:'掉尾势',short:'轻缓摆转',story:'在整套练习接近结束时，继续把动作做得从容。把稳定感带回收势。',tip:'俯身和摆动幅度放小，双手位置尽量稳定。',view:'俯身示意',ai:false,
      steps:[step('tailL','缓缓前俯，双手下垂，轻向一侧摆转','自然呼吸'),step('close','慢慢回正','自然呼吸'),step('tailR','缓缓前俯，轻向另一侧摆转','自然呼吸'),step('close','慢慢起身，准备收势','自然呼吸')]}
  ];
  const seated = [
    ['seat1','坐姿调息','合掌松肩','prayer','肩膀自然放松，双脚平放地面。'],
    ['seat2','坐姿展臂','左右舒展','spread','身体坐稳，双臂在舒适范围内展开。'],
    ['seat3','坐姿托掌','向上舒展','sky','上托时保持坐骨稳定，手臂留在画面中。'],
    ['seat4','坐姿摘星','交替伸展','starL','左右交替抬手，上体保持舒适。'],
    ['seat5','坐姿推掌','缓缓推收','push','肩膀放松，双掌轻轻推出。'],
    ['seat6','坐姿收势','放松回落','close','双手轻落腹前，保持自然呼吸。']
  ].map(([id,name,short,target,tip]) => ({
    id,name,short,tip,view:'坐姿正面',ai:['prayer','spread','sky','close'].includes(target),
    story:'这是一段为坐姿使用场景编排的上半身练习。坐稳，按自己的舒适幅度完成。',
    steps: target === 'starL'
      ? [step('starL','一手向上伸展，另一手放松','自然吸气'),step('close','松肩，缓缓回正','自然呼气'),step('starR','换另一侧伸展','自然吸气'),step('close','缓缓回正','自然呼气')]
      : [step('close','坐稳，双脚平放地面','自然呼吸','close'),step(target,short+'，保持舒适','自然吸气',target),step(target,'放松肩膀，保持自然','自然呼气',target),step('close','双手轻落，回到起始位置','自然呼气','close')]
  }));
  const shop = [
    {id:'scarf',name:'松绿围巾',slot:'neck',price:24,description:'给伙伴添一抹松绿',color:'#4fd1ae'},
    {id:'ribbon',name:'晚霞围巾',slot:'neck',price:36,description:'暖暖的落日颜色',color:'#f9a88b'},
    {id:'leaf',name:'新芽头饰',slot:'head',price:30,description:'把今天的小进步戴起来',color:'#80d59a'},
    {id:'crown',name:'星月发冠',slot:'head',price:60,description:'给每一次认真练习留颗星',color:'#edc579'},
    {id:'robe',name:'青山练功服',slot:'body',price:50,description:'陪你舒展的轻盈衣裳',color:'#4b9ba9'},
    {id:'sunset',name:'晚霞练习场',slot:'scene',price:70,description:'在暖色山间继续练习',color:'#b87576'},
    {id:'moon',name:'月下练习场',slot:'scene',price:70,description:'安静的紫色夜空',color:'#8984c2'}
  ];
  const milestones = [
    {id:'start',name:'初见青山',goal:1,coins:12,story:'完成第一段练习，旅程从这一刻开始。'},
    {id:'three',name:'循径而行',goal:3,coins:18,story:'走过三个不同动作，给每一份尝试留下记号。'},
    {id:'six',name:'松风相伴',goal:6,coins:24,story:'完成六个不同动作，慢慢找到自己的节奏。'},
    {id:'twelve',name:'山水成卷',goal:12,coins:36,story:'十二张动作卡，把一次次练习连成自己的画卷。'}
  ];
  window.QimaiData = {poses,lessons,seated,shop,milestones,phaseMs:5000,rounds:2,
    sources:[
      ['十二势名称','https://www.sport.gov.cn/n20001280/n20001265/n20067611/c20106557/content.html'],
      ['动作教学','https://www.sport.gov.cn/n14471/n14478/n14515/c944065/content.html'],
      ['动作要点','https://www.sport.gov.cn/qgzx/n5407/c781310/content.html'],
      ['呼吸指导','https://www.sport.gov.cn/qgzx/n5407/c878550/content.html']
    ]};
})();
