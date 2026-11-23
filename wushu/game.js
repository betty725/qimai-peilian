const pointsPerStep = 5;
const leaf = '<svg class="icon" aria-hidden="true"><use href="#i-leaf"></use></svg>';

// Follow the course's own step and save events. Replaying a step after
// switching tracking modes still refers to the same step in this session.
export function createPineTrail(lessons) {
  const creditedSteps = new Set();
  const leaves = document.getElementById('pineLeaves');
  const score = document.getElementById('pineScore');
  const message = document.getElementById('pineMessage');
  leaves.innerHTML = lessons.map(() => leaf).join('');
  leaves.setAttribute('aria-label', '已点亮 0 / ' + lessons.length + ' 片松叶');
  score.textContent = '0';
  message.textContent = '每跟完一步得 5 分，每练完一段点亮一片松叶。';

  return {
    step(index, round, phase) {
      const key = [index, round, phase].join('/');
      if (creditedSteps.has(key)) return;
      creditedSteps.add(key);
      score.textContent = String(creditedSteps.size * pointsPerStep);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        score.animate?.([{transform: 'translateY(-3px)'}, {transform: 'translateY(0)'}], {duration: 260});
      }
    },
    finishLesson(completed) {
      const count = completed.length;
      leaves.children[count - 1].classList.add('lit');
      leaves.setAttribute('aria-label', '已点亮 ' + count + ' / ' + lessons.length + ' 片松叶');
      message.textContent = count === lessons.length
        ? '六片松叶都亮了，和看山一起收势吧。'
        : completed[count - 1].name + '练完了，第 ' + count + ' 片松叶亮了。';
    },
    summary(count) {
      return '本次跟练 ' + creditedSteps.size * pointsPerStep + ' 分，点亮 ' + count + ' / ' + lessons.length + ' 片松叶。';
    }
  };
}
