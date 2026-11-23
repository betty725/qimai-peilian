import {mountDiary} from './diary-ui.mjs';

let arrivalDiary;
window.addEventListener('qimai-daily-arrival', ({detail}) => {
  const result = document.getElementById('zhihuAtlasResult');
  if (!result || !detail?.daily || detail.demo || detail.completed?.length !== 3) return;
  arrivalDiary?.destroy();
  arrivalDiary = undefined;
  result.replaceChildren();
  result.hidden = !detail.noteId;
  if (!result.hidden) arrivalDiary = mountDiary(result, {surface:'atlas', entryId:detail.noteId});
});
