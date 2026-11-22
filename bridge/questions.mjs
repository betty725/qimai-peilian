// Titles and question IDs were checked against Zhihu question and answer pages.
export const questions = [
  {
    id: '5717235973',
    title: '办公室久坐族需要注意些什么？有什么方法可以缓解久坐带来的不适？',
    scene: 'general',
    answerLead: '说一个能在工位旁试的小办法：把休息缩成一段有开头、有收尾的小练习。下面是我实际练的一次。',
    prompt: '如果明天还想练，你会把这段休息放在工作的哪个空档？',
  },
  {
    id: '1893721507756242729',
    title: '颈椎、腰椎疼痛这些「慢性职业病」逐渐年轻化，职场人该如何防治？',
    scene: 'neck',
    answerLead: '关于伏案时怎么给肩颈留个休息的空档，我能分享的是自己的一次工间练习。',
    prompt: '哪一个动作最容易在工位边做？做的时候，你留意到了肩颈的什么细节？',
  },
  {
    id: '32268112',
    title: '办公室久坐如何保护腰部？',
    scene: 'back',
    answerLead: '我从一个比较容易做到的环节说起：工作间隙怎么抽空换换姿势。这里记下我实际做的一次练习。',
    prompt: '这次你怎样给自己腾出活动空间？如果腰背的感受没变，也可以照实记。',
  },
  {
    id: '27708607',
    title: '为什么上班都是坐着，还会感觉疲惫不堪？',
    scene: 'afternoon',
    answerLead: '坐着工作也会觉得累，这个问题里我想聊聊休息怎么安排。我的练习记录里有这样一次短休息。',
    prompt: '这次休息前后，你的精神状态有什么变化，或者和平时一样？',
  },
  {
    id: '605576552',
    title: '工作长时间坐着，时常腰酸背痛甚至引发腰突，该如何降低久坐带来的危害?',
    scene: 'back',
    answerLead: '这个问题提到长时间坐着工作。我能分享一个很小的切入点：怎样把一段活动真正放进一天里。',
    prompt: '忙起来时，什么提醒能让你真的停一停？这一次你做到了哪一步？',
  },
].map(question => ({...question, url: 'https://www.zhihu.com/question/' + question.id}));
