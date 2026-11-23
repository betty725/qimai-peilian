import {mountDaily} from './daily.mjs';
import {mountConstitution} from './constitution.mjs';

const sections = ['daily','constitution'];
export function mountJournal({language,date,birthday,onElement}) {
  const container = document.getElementById('field-journal');
  const panels = new Map(sections.map(key => [key,document.getElementById(key)]));
  const tabs = new Map(sections.map(key => [key,document.getElementById('tab-'+key)]));
  function navigate(key, {focus=false, scroll=false, record=false}={}) {
    if (!panels.has(key)) return;
    for (const [name,panel] of panels) {
      const selected=name===key;
      panel.hidden=!selected;
      tabs.get(name).setAttribute('aria-selected',String(selected));
      tabs.get(name).tabIndex=selected?0:-1;
    }
    if (record && location.hash!=='#'+key) history.pushState(null,'','#'+key);
    if (scroll) container.scrollIntoView({block:'start'});
    if (focus) tabs.get(key).focus({preventScroll:true});
  }
  function showElement(element) {
    if(location.hash!=='#map')history.pushState(null,'','#map');
    onElement(element);
  }
  const daily=mountDaily(document.getElementById('rhythm-result'),{
    language,date,birthday,onElement:showElement
  });
  const constitution=mountConstitution(panels.get('constitution'),{
    language,onDaily:()=>navigate('daily',{record:true,focus:true,scroll:true})
  });
  for (const [key,tab] of tabs) {
    tab.addEventListener('click',()=>navigate(key,{record:true}));
    tab.addEventListener('keydown',e=>{
      const index=sections.indexOf(key);
      let target;
      if(e.key==='ArrowRight')target=sections[(index+1)%sections.length];
      if(e.key==='ArrowLeft')target=sections[(index+sections.length-1)%sections.length];
      if(e.key==='Home')target=sections[0];
      if(e.key==='End')target=sections.at(-1);
      if(target){e.preventDefault();navigate(target,{record:true,focus:true});}
    });
  }
  document.querySelector('.journal-shortcut').addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;
    e.preventDefault();navigate('daily',{record:true,focus:true,scroll:true});
  });
  function followHash(){
    if(['#tones','#rhythm-result'].includes(location.hash)) history.replaceState(history.state,'','#daily');
    const key=location.hash.slice(1);
    if(panels.has(key))navigate(key,{scroll:true});
  }
  window.addEventListener('qimai-daily-return',()=>{
    if(location.hash!=='#daily')history.replaceState(history.state,'','#daily');
    navigate('daily');
  });
  window.addEventListener('hashchange',followHash);
  followHash();
  function render(){
    daily.render();constitution.render();
  }
  return {render,openDaily:()=>navigate('daily',{focus:true,scroll:true,record:true})};
}
