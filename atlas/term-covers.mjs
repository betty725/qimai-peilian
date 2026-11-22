import {solarTerms} from './season-calendar.mjs';

// Each entry describes the painting, so the English and Chinese views share one illustration.
const paintings = {
  立春:['lichun','柳芽初醒，溪冰渐融。','Willow buds open beside a thawing stream.'],
  雨水:['yushui','春雨落江，水纹轻起。','Spring rain ripples across the river.'],
  惊蛰:['jingzhe','春山聚云，岸边桃花初开。','Clouds gather over the hills as peach blossoms open.'],
  春分:['chunfen','燕过青田，春色平分。','Swallows cross the green fields.'],
  清明:['qingming','烟雨笼桥，新柳拂水。','Rain softens the bridge and willows brush the water.'],
  谷雨:['guyu','新茶吐绿，茶垄绕山。','Fresh tea grows in rows along the hillsides.'],
  立夏:['lixia','池水渐暖，新荷初展。','Young lotus leaves unfold on the pond.'],
  小满:['xiaoman','麦浪尚青，穗粒渐满。','Young grain fills out in fields of green wheat.'],
  芒种:['mangzhong','麦芒与新秧，相接成田。','Ripening wheat meets rows of rice seedlings.'],
  夏至:['xiazhi','天光正长，一江明镜。','Long daylight shines on a still river.'],
  小暑:['xiaoshu','柳阴临水，荷花初红。','Willows shade the water beside pink lotus blossoms.'],
  大暑:['dashu','云峰高起，满陂荷盛。','Clouds tower over a pond of summer lotus.'],
  立秋:['liqiu','梧叶初黄，远山犹青。','The first yellow leaves stand out against green hills.'],
  处暑:['chushu','暑云初散，层山清远。','Summer clouds part to reveal distant ridges.'],
  白露:['bailu','白露凝珠，晨雾过苇。','Dew gathers on reeds in the morning mist.'],
  秋分:['qiufen','金田连陌，秋色正中。','Golden fields stretch across the autumn plain.'],
  寒露:['hanlu','秋江清冷，红叶临流。','Red leaves overlook a cool autumn river.'],
  霜降:['shuangjiang','霜白枫红，两岸秋深。','White frost and red maples mark the end of autumn.'],
  立冬:['lidong','草色渐枯，远水初寒。','Ochre grasses line the cold water.'],
  小雪:['xiaoxue','薄雪初覆，芦花临水。','A dusting of snow settles along the reed banks.'],
  大雪:['daxue','积雪压枝，远岫披白。','Deep snow weighs on the branches and whitens the hills.'],
  冬至:['dongzhi','斜阳将落，冬影渐长。','The low sun casts long winter shadows.'],
  小寒:['xiaohan','寒枝疏影，一树梅开。','Plum blossoms open on sparse winter branches.'],
  大寒:['dahan','冰河卧雪，万山静白。','A frozen river winds between snow-covered hills.']
};

export function scrollForTerm(term) {
  const [key,zh,en] = paintings[term.name];
  return {key, zh, en, url:new URL('./covers/'+key+'.webp',import.meta.url).href};
}

export function mountScrolls() {
  const hero = document.getElementById('season-painting');
  const dialog = document.getElementById('scroll-gallery');
  const select = document.getElementById('scroll-choice');
  const image = document.getElementById('scroll-painting');
  const name = document.getElementById('scroll-name');
  const caption = document.getElementById('scroll-caption');
  const close = document.getElementById('close-scrolls');
  let current, language, previewIndex;

  function show(index) {
    previewIndex = (index + solarTerms.length) % solarTerms.length;
    const term = solarTerms[previewIndex];
    const art = scrollForTerm(term);
    const english = language === 'en';
    select.value = String(previewIndex);
    if (image.src !== art.url) image.src = art.url;
    name.textContent = english ? term.en : term.name;
    caption.textContent = english ? art.en : art.zh;
  }

  // The reading and stamp book always follow today's date; the open book has its own page.
  document.getElementById('browse-scrolls').addEventListener('click',()=>{
    show(current);
    dialog.showModal();
  });
  document.getElementById('scroll-prev').addEventListener('click',()=>show(previewIndex-1));
  document.getElementById('scroll-next').addEventListener('click',()=>show(previewIndex+1));
  select.addEventListener('change',()=>show(Number(select.value)));

  function update(term,lang) {
    const art = scrollForTerm(term);
    const english = lang === 'en';
    if (hero.src !== art.url) hero.src = art.url;
    hero.alt = english ? term.en+' — '+art.en : term.name+' · '+art.zh;
    current = term.index;
    if (language === lang) return;
    language = lang;
    close.setAttribute('aria-label',english?'Close scrolls':'关闭画卷');
    select.setAttribute('aria-label',english?'Choose a solar term':'选择节气画卷');
    const yearFromSpring = [...solarTerms.slice(2),...solarTerms.slice(0,2)];
    select.replaceChildren(...yearFromSpring.map(item=>new Option(english?item.en:item.name,String(item.index))));
    if (dialog.open) show(previewIndex);
  }
  return {update};
}
