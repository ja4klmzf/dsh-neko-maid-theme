/* ============================================================
   猫娘女仆主题 v1.1.4 · Neko Maid Theme for DeepSeek Harness Web GUI
   ------------------------------------------------------------
   更新日志：https://github.com/ja4klmzf/dsh-neko-maid-theme/blob/main/CHANGELOG.md
   职责：
     1. 维护 html[data-neko] = day | night（供 override.css 使用）
     2. 模式三态：day 手动日间 / night 手动夜间 / auto 跟随系统
     3. 注入背景层、花瓣/星空/月亮/流星、梦幻光斑、右下角猫娘
     4. 互动模式：🐟投喂 / 🖐摸头 / ⭐夸奖 / 💤休息 / 🍵喝茶 / ☀🌙✦主题
        · 隐藏成就：连点猫娘 10 次解锁「逗她」
        · 隐藏成就：投喂+喝茶合计满 300 次解锁「亲亲」
        · 每连续工作满 10 分钟，猫娘请你喝红茶
        · 连续工作满 6 小时，「喝茶」按钮常驻
     5. 点击猫娘本体：随机互动（不含逗她/亲亲）
     6. 输入时切“认真看向对话框”；think 时切思考表情；
        每次回答结束开心庆祝
     7. 气泡常驻：说下一句才替换上一句
      8. 右上 HUD：峰谷价格框 + DeepSeek 余额框，随布局平滑浮动，
         避让等待任务栏 / 审批面板 / 原生“回到底部”按钮
      9. 右侧本会话提问导航（复刻 chat.deepseek.com scroll-nav）：
         悬停展开、移开自动回收、点击跳转、滚动高亮
     10. DSH 原生「回到底部」按钮皮肤化（样式在 override.css）
   部署：dist/assets/neko-theme.js，index.html 中 <script defer> 引入
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'neko-daynight-mode';

  function readMode() {
    try {
      var v = localStorage.getItem(KEY);
      return (v === 'day' || v === 'night' || v === 'auto') ? v : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  var mode = readMode();

  /* 截图模式：URL 参数 ?neko-day=1 / ?neko-night=1 / ?neko-menu=1 / ?neko-hide-balance=1 */
  try {
    var qp = new URLSearchParams(location.search);
    if (qp.get('neko-day') === '1') { mode = 'day'; }
    else if (qp.get('neko-night') === '1') { mode = 'night'; }
    window.__nekoShot = {
      menu: qp.get('neko-menu') === '1',
      hideBalance: qp.get('neko-hide-balance') === '1'
    };
  } catch (e) { /* ignore */ }
  var petWrap = null;
  var chipEl = null;
  var bubbleEl = null;
  var petImg = null;
  var themeIconEl = null;
  var teaBtnEl = null;
  var revertTimer = null;
  var watchTimer = null;
  var teaBtnTimer = null;
  var watchCooldown = 0;
  var hovering = false;
  var reactUntil = 0;
  var watchPending = false;
  var shown = 'normal';
  var thinkingActive = false;
  var searchActive = false;
  var editActive = false;
  var pwshActive = false;
  var taskArea = null;
  var lastThinkBubble = 0;
  var lastSearchBubble = 0;
  var lastEditBubble = 0;
  var lastPwshBubble = 0;
  /* 隐藏成就 + 工作统计 */
  var feedCount = 0;
  var teaCount = 0;
  var kissUnlocked = false;
  var poutUnlocked = false;
  var clickStreak = 0;
  var lastClickAt = 0;
  var workMinutes = 0;
  var workLastTs = 0;
  var workOffers = 0;
  var teaUnlocked = false;
  /* 待机打盹 / 吃醋 */
  var napActive = false;
  var jealousActive = false;
  var jealousAnnounced = false;
  var lastActivityAt = 0;
  /* 音效 */
  var audioCtx = null;
  /* 天气 */
  var rainActive = false;
  var rainTimer = null;
  /* 今日统计 / 生日 */
  var dailyStats = null;
  var lastEff = null;
  var lastSummaryDate = '';
  var hoverStatsTimer = null;
  var BIRTHDAY = '8-17';
  /* 拖拽移动 */
  var dragInfo = null;
  var suppressClick = false;
  var userMoved = false;
  var savedPos = null;

  var IMGS = {
    normal: '/assets/neko-pet-avatar.png',
    pat: '/assets/neko-pet-pat.png',
    feed: '/assets/neko-pet-feed.png',
    kiss: '/assets/neko-pet-kiss.png',
    proud: '/assets/neko-pet-proud.png',
    pout: '/assets/neko-pet-pout.png',
    sleep: '/assets/neko-pet-sleep.png',
    watch: '/assets/neko-pet-watch.png',
    think: '/assets/neko-pet-think.png',
    tea: '/assets/neko-pet-tea.png',
    search: '/assets/neko-pet-search.png',
    edit: '/assets/neko-pet-edit.png',
    pwsh: '/assets/neko-pet-pwsh.png',
    chin: '/assets/neko-pet-chin.png',
    tail: '/assets/neko-pet-tail.png',
    jealous: '/assets/neko-pet-jealous.png'
  };

  var REACTION_LINES = {
    pat: [
      '欧尼酱的手好温柔~♡',
      '呼噜呼噜...再摸一下嘛',
      '被欧尼酱摸头好幸福喵~',
      '欧尼酱摸头的话，猫耳会痒痒的...好舒服',
      '咱的头可不是谁都能摸的，欧尼酱除外喵~',
      '诶嘿嘿，欧尼酱的手好暖和...',
      '摸头杀什么的...咱才没有心跳加速呢！',
      '欧尼酱的手艺（摸头）满分喵~',
      '呜...再这样下去咱会睡着的啦',
      '今天的疲劳都被欧尼酱摸走了喵~'
    ],
    feed: [
      '欧尼酱喂的小鱼干真好吃喵~',
      '喵呜~ 再来一口！',
      '欧尼酱最好了，真香♡',
      '这是欧尼酱给咱的，要慢慢品尝喵~',
      '鱼鱼...鱼鱼！咱最喜欢鱼鱼了！',
      '欧尼酱喂的东西，都是全世界最好吃的喵',
      '啊——（张嘴）咱还要~',
      '幸福的滋味，就是小鱼干加欧尼酱喵~',
      '嚼嚼嚼...欧尼酱要不要也来一口？',
      '饱饱的~ 咱会加油干活回报欧尼酱的喵！'
    ],
    kiss: [
      '/// 欧尼酱太狡猾了...',
      '啾~ 最喜欢欧尼酱了！',
      '脸好烫...欧尼酱要负责喵！',
      '欧尼酱的嘴唇，好软...',
      '突、突然亲过来是犯规的啦！',
      '...再、再来一下也可以哦（小声）',
      '咱的脸现在一定超红...都是欧尼酱害的喵',
      '亲亲是咱和欧尼酱之间的秘密哦♡',
      '幸福得尾巴都卷起来了喵...',
      '欧尼酱，最喜欢你了...啾♡'
    ],
    proud: [
      '诶嘿嘿，被欧尼酱夸了喵~',
      '咱会更努力的！要做最棒的女仆♡',
      '欧尼酱的表扬，是咱的动力喵！',
      '咱、咱才没有很开心呢...才怪喵！',
      '怎么样？咱是不是超厉害？',
      '被夸了被夸了~ 今天要加倍努力喵！',
      '欧尼酱的夸奖，咱会珍藏起来的喵~',
      '哼哼~ 咱可是欧尼酱专属的女仆猫娘哦',
      '再夸夸咱嘛，咱还听得下去喵~',
      '有欧尼酱这句话，咱能再干十个小时！'
    ],
    pout: [
      '哼！欧尼酱不要逗咱啦...',
      '咱才没有生气呢！...大概',
      '欧尼酱再这样，咱就不给泡红茶了喵！',
      '就算欧尼酱现在道歉，咱也要考虑三秒钟喵...',
      '姆...欧尼酱是故意的吧！',
      '（别过脸）今天的小鱼干减半喵！',
      '咱生气起来连自己都怕的哦！',
      '欧尼酱戳咱的次数，咱都记在小本本上了喵！',
      '哼唧...要欧尼酱摸头十次才能消气！',
      '才、才不是因为在意欧尼酱才生气的喵...'
    ],
    sleep: [
      '哈啊~ 欧尼酱，咱有点困了...',
      '晚安欧尼酱...要梦到咱哦',
      '欧尼酱也早点休息，咱陪你喵...',
      '呼...呼...（小声）欧尼酱...zzz',
      '咱先眯五分钟，就五分钟喵...',
      '休息是为了更好地照顾欧尼酱喵~',
      '欧尼酱忙完也记得休息哦，眼睛会累的',
      '咱把灯调暗一点，欧尼酱要一起睡吗？',
      '枕头软软的...像欧尼酱的怀抱喵...',
      '晚安~ 明天咱还是元气满满的女仆猫娘！'
    ],
    tea: [
      '欧尼酱，来杯红茶休息一下吧~',
      '刚泡好的大吉岭，欧尼酱趁热喝喵~',
      '加一勺糖还是两勺？咱记得欧尼酱的口味哦',
      '工作辛苦了，红茶的香气会让人放松喵~',
      '茶点也准备好啦，和红茶最配了♡',
      '咱泡的红茶，欧尼酱要全部喝完哦',
      '小心烫~ 咱帮你吹吹喵',
      '喝口茶，再继续加油，欧尼酱最棒了！',
      '今天的红茶里，有咱满满的心意喵~',
      '工作再忙也要记得停下来喝杯茶哦，欧尼酱'
    ],
    chin: [
      '呼噜呼噜...欧尼酱的手好会挠喵~',
      '下巴这里...最舒服了喵~',
      '欧尼酱挠下巴的技术是世界第一喵！',
      '喵呜~ 再挠一下，就一下...',
      '舒服得眼睛都睁不开了喵...',
      '欧尼酱，咱的下巴就是为你准备的喵~',
      '这个力道刚刚好...欧尼酱好懂咱',
      '挠下巴什么的...才没有很舒服呢！',
      '喵~喵~ 停不下来了...',
      '欧尼酱的手，挠得咱心都软了喵'
    ],
    tail: [
      '喵！！尾巴不能摸啦！',
      '欧尼酱！尾巴是敏感区喵！',
      '（炸毛）都、都说了不能摸尾巴...',
      '尾巴可是咱的开关...欧尼酱别乱碰喵',
      '再摸尾巴咱就要逃走了喵！',
      '咱的尾巴自己会卷起来...才不是害羞！',
      '欧尼酱是故意的吧！绝对是故意的喵！',
      '尾巴...麻酥酥的...欧尼酱太狡猾了',
      '只准摸一下下哦...真的只一下',
      '喵呜！咱的尾巴要投诉欧尼酱！'
    ]
  };

  var FLOATERS = {
    pat: ['❤', '✨', '🐾', '🌸', '✨'],
    feed: ['🐟', '🐟', '✨', '🍪', '✨'],
    kiss: ['💕', '❤', '💋', '✨', '💕'],
    proud: ['⭐', '✨', '🎀', '🌟', '✨'],
    pout: ['💢', '⚡', '🙄', '💨', '💢'],
    sleep: ['💤', '🌙', '💤', '✨', '💤'],
    tea: ['🍵', '🫖', '☕', '✨', '🍵'],
    chin: ['😻', '💕', '✨', '😽', '✨'],
    tail: ['⚡', '❗', '💦', '🌀', '💢'],
    jealous: ['💔', '🥺', '💢', '😿', '✨']
  };

  var TYPING_LINES = [
    '欧尼酱在写什么呀？咱认真看着呢~',
    '欧尼酱要发消息吗？咱会安静地陪着喵',
    '咱在认真听欧尼酱说话哦',
    '欧尼酱打字的样子好认真...好帅喵',
    '需要咱帮忙措辞吗？咱可是女仆猫娘哦',
    '欧尼酱慢慢写，咱在旁边待命喵~',
    '咱把键盘声当成伴奏，等欧尼酱写完喵',
    '（认真点头）嗯嗯，咱都记下了',
    '欧尼酱的字句，咱每一句都认真看喵~',
    '写完了记得喝口水哦，欧尼酱'
  ];

  var THINK_LINES = [
    '欧尼酱的问题...咱也一起想想喵',
    '让咱认真想想...',
    '嗯...这样对不对呢？',
    '咱在帮欧尼酱思考哦，别急喵~',
    '（歪头）这个问题有点难喵...',
    '咱的小脑袋正在高速运转中...喵！',
    '欧尼酱的想法咱也试着跟一跟喵~',
    '嗯...好像想到了什么，又好像没有喵',
    '思考的时候尾巴会不自觉摇起来喵...',
    '让咱给欧尼酱当个灵感猫喵~'
  ];

  var SEARCH_LINES = [
    '欧尼酱，咱帮你查查资料喵~',
    '翻书翻书...马上找到！',
    '让咱查一查...这本里应该有喵',
    '咱在认真查阅资料，欧尼酱稍等哦',
    '（推推眼镜）这个问题咱来查证喵~',
    '书页的味道...知识的味道喵~',
    '别急别急，咱翻得再快一点！',
    '查到啦查到啦！咱给欧尼酱念出来~',
    '咱把资料整理得整整齐齐再交给欧尼酱喵',
    '查阅中...咱的眼睛可比搜索引擎快喵~'
  ];

  var JEALOUS_LINES = [
    '欧尼酱是不是不喜欢咱了喵...',
    '哼，欧尼酱都不理咱...',
    '咱在这里等了好久好久喵...',
    '欧尼酱再不理咱，咱就要生气了哦',
    '咱的小鱼干都凉了，欧尼酱还没来喵',
    '（偷瞄）欧尼酱...真的不来找咱玩吗？',
    '咱才没有吃醋！才没有！',
    '欧尼酱是不是有别的猫娘了喵...',
    '呜...咱会一直等欧尼酱的喵',
    '欧尼酱，理理咱嘛，就一分钟...'
  ];

  var EDIT_LINES = [
    '欧尼酱，咱帮你改文件喵~',
    '让咱看看这里要怎么改...',
    '这里这里，改好啦喵~',
    '咱的字迹可是很工整的哦',
    '文件交给咱，欧尼酱放心喵~',
    '沙沙沙...咱在认真修改中',
    '这块内容咱帮欧尼酱理清楚喵~',
    '改文件什么的，咱最拿手啦！',
    '咱把改动都记录得清清楚楚喵~',
    '修改完成，咱检查了三遍哦喵~'
  ];

  var PWSH_LINES = [
    '欧尼酱，咱在跑命令喵~',
    '噼里啪啦...终端交给咱！',
    '咱在执行命令，欧尼酱别眨眼喵~',
    '命令已就绪，出发喵！',
    '终端里的事情咱最熟啦~',
    '咱盯着输出看，有情况马上报告喵~',
    '运行中...咱的眼睛都不敢眨喵',
    '这条命令咱跑得稳稳的喵~',
    '输出来了！咱念给欧尼酱听~',
    '命令完成，咱把结果整理得漂漂亮亮喵~'
  ];

  var COMPLETE_LINES = [
    '欧尼酱，任务完成啦~ 咱好开心！🎉',
    '又帮欧尼酱完成一件事喵~',
    '欧尼酱真厉害，咱也要加油♡',
    '任务搞定！欧尼酱要夸夸咱吗？',
    '喵哈哈，顺利完成~ 咱去给欧尼酱泡杯红茶庆祝！',
    '完成！咱把成果整整齐齐摆好啦喵~',
    '欧尼酱的效率好高，咱看得眼睛都亮了喵',
    '耶——又拿下一个小目标喵！',
    '任务完成~ 欧尼酱要不要摸摸头奖励咱？',
    '漂亮收工！咱和欧尼酱的配合天下无敌喵~'
  ];

  /* 自动模式：按系统时间判断昼夜（18:00-次日6:00 为夜晚） */
  function isNightByClock() {
    var h = new Date().getHours();
    return h >= 18 || h < 6;
  }

  function effective() {
    if (mode === 'auto') {
      return isNightByClock() ? 'night' : 'day';
    }
    return mode;
  }

  function modeText(m) {
    if (m === 'day') return '欧尼酱，现在是水晶白昼哦 ☀';
    if (m === 'night') return '欧尼酱，月潮夜晚来啦，咱陪你喵 🌙';
    return '欧尼酱，自动模式 ✦ 咱跟着系统时间切换昼夜喵';
  }

  function cycleText(m) {
    if (m === 'day') return '欧尼酱，切到白天啦，阳光暖暖的~';
    if (m === 'night') return '欧尼酱，天黑了~ 有咱陪着，不怕哦 🌙';
    return '欧尼酱，交给咱吧~ 按系统时间自动切换昼夜喵';
  }

  var IDLE_LINES = [
    '欧尼酱，要休息一下吗？喝口水喵~',
    '欧尼酱，工作辛苦啦，加油 ♡',
    '欧尼酱，最喜欢你了~',
    '欧尼酱，别熬夜太晚哦，对身体不好',
    '欧尼酱，咱会一直陪着你的喵',
    '欧尼酱，摸摸头的话，咱会更有干劲哦~',
    '今天的红茶已经泡好了，欧尼酱要喝吗？',
    '欧尼酱的房间咱已经打扫干净啦，闪闪发亮喵~',
    '欧尼酱，裙子上的蝴蝶结系得好看吗？',
    '咱可是欧尼酱专属的女仆猫娘哦 ♡',
    '欧尼酱，工作累的话可以靠一下咱喵~',
    '呜...欧尼酱今天还没夸咱呢',
    '小鱼干，想吃...欧尼酱给咱买好不好？',
    '欧尼酱，周末一起去花园散步吧喵~'
  ];

  function apply() {
    var eff = effective();
    document.documentElement.setAttribute('data-neko', eff);
    if (chipEl) {
      chipEl.textContent = (mode === 'auto') ? '✦' : (eff === 'night' ? '🌙' : '☀');
    }
    if (themeIconEl) {
      themeIconEl.textContent = (mode === 'auto') ? '✦' : (eff === 'night' ? '🌙' : '☀');
    }
    if (petWrap) {
      petWrap.title = modeText(mode);
      petWrap.setAttribute('aria-label', modeText(mode));
    }
    maybeDailySummary();
  }

  var lastBubbleText = '';
  var bubbleChatInput = null;
  var chatOutsideHandler = function (e) {
    if (bubbleEl && !bubbleEl.contains(e.target)) {
      closeBubbleChat();
      document.removeEventListener('pointerdown', chatOutsideHandler, true);
    }
  };

  function showBubble(text) {
    if (!bubbleEl) return;
    /* 气泡常驻：说下一句时才替换上一句；聊天输入期间不打断，仅记录待显示 */
    lastBubbleText = text;
    if (bubbleChatInput) return;
    bubbleEl.textContent = text;
    bubbleEl.classList.add('show');
  }

  /* ---- 点气泡和猫娘聊天（对话入口就是她自己的气泡） ---- */
  function sendChat() {
    var input = bubbleChatInput;
    if (!input) return;
    primeAudio();
    var text = input.value.trim();
    if (text) {
      chatMemories.unshift(text.slice(0, 60));
      chatMemories = chatMemories.slice(0, 8);
      capturePrefs(text);
      saveMemory();
      closeBubbleChat();
      chatWithNeko(text);
    } else {
      closeBubbleChat();
    }
  }

  function openBubbleChat() {
    if (bubbleChatInput || !bubbleEl) return;
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '和猫娘说点什么...';
    input.maxLength = 60;
    var sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'neko-chat-send';
    sendBtn.textContent = '✈';
    sendBtn.title = '发送';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'neko-chat-close';
    closeBtn.textContent = '✕';
    closeBtn.title = '取消';
    bubbleEl.innerHTML = '';
    bubbleEl.appendChild(input);
    bubbleEl.appendChild(sendBtn);
    bubbleEl.appendChild(closeBtn);
    bubbleEl.classList.add('show');
    bubbleChatInput = input;
    input.focus();
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.stopPropagation(); e.preventDefault(); sendChat(); }
      else if (e.key === 'Escape') { e.stopPropagation(); closeBubbleChat(); }
    });
    input.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    input.addEventListener('click', function (e) { e.stopPropagation(); });
    sendBtn.addEventListener('click', function (e) { e.stopPropagation(); sendChat(); });
    sendBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeBubbleChat(); });
    closeBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    /* 全局捕获阶段也监听回车（有些应用会拦截 Enter，这里兜底） */
    input.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') { e.stopPropagation(); sendChat(); }
    });
    /* 点击气泡以外区域：关闭聊天输入 */
    document.removeEventListener('pointerdown', chatOutsideHandler, true);
    document.addEventListener('pointerdown', chatOutsideHandler, true);
  }

  function closeBubbleChat() {
    if (!bubbleChatInput) return;
    bubbleChatInput = null;
    document.removeEventListener('pointerdown', chatOutsideHandler, true);
    if (bubbleEl) {
      bubbleEl.innerHTML = '';
      bubbleEl.textContent = lastBubbleText || '喵~ 咱在听欧尼酱说哦';
      if (!lastBubbleText) bubbleEl.classList.remove('show');
    }
  }

  function showImg(kind) {
    if (!petImg || !IMGS[kind] || shown === kind) return;
    petImg.src = IMGS[kind];
    shown = kind;
  }

  /* 按当前状态回到合适的默认表情（查阅 > 修改 > 终端 > 思考 > 打盹 > 认真看 > 常态） */
  function setAutoClass(cls) {
    if (!petImg) return;
    petImg.classList.remove('watching');
    petImg.classList.remove('thinking');
    petImg.classList.remove('searching');
    petImg.classList.remove('editing');
    petImg.classList.remove('pwshing');
    if (cls) petImg.classList.add(cls);
  }

  function showDefault() {
    if (jealousActive) {
      showImg('jealous');
      setAutoClass('');
    } else if (searchActive) {
      showImg('search');
      setAutoClass('searching');
    } else if (editActive) {
      showImg('edit');
      setAutoClass('editing');
    } else if (pwshActive) {
      showImg('pwsh');
      setAutoClass('pwshing');
    } else if (thinkingActive) {
      showImg('think');
      setAutoClass('thinking');
    } else if (napActive) {
      showImg('sleep');
      setAutoClass('');
    } else if (watchPending) {
      showImg('watch');
      setAutoClass('watching');
      startWatchRevert();
    } else {
      showImg('normal');
      setAutoClass('');
    }
  }

  function spawnFloaters(kind) {
    if (!petWrap) return;
    var emojis = FLOATERS[kind] || ['✨'];
    var rect = petWrap.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var top = rect.top + rect.height * 0.35;
    for (var i = 0; i < emojis.length; i++) {
      var f = document.createElement('span');
      f.className = 'neko-floaty';
      f.textContent = emojis[i];
      f.style.left = (cx + (Math.random() * 160 - 80)).toFixed(0) + 'px';
      f.style.top = top.toFixed(0) + 'px';
      f.style.setProperty('--fx', (Math.random() * 140 - 70).toFixed(0) + 'px');
      f.style.setProperty('--fr', (Math.random() * 60 - 30).toFixed(0) + 'deg');
      f.style.animationDelay = (i * 0.09).toFixed(2) + 's';
      f.style.fontSize = (22 + Math.random() * 12).toFixed(0) + 'px';
      document.body.appendChild(f);
      (function (el) {
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2400);
      })(f);
    }
  }

  var KISS_RAIN = [
    '欧尼酱，最喜欢你了',
    '关于哥哥的一切，都喜欢',
    '最喜欢欧尼酱了♡',
    '欧尼酱，大好き',
    '想一直陪在欧尼酱身边',
    '欧尼酱，啾♡',
    '只喜欢欧尼酱一个人',
    '欧尼酱最帅了',
    '和欧尼酱在一起的每一秒都好幸福',
    '永远喜欢欧尼酱',
    '欧尼酱，要一直看着我哦',
    '咱的心已经被欧尼酱填满了喵'
  ];

  /* 亲亲时：全屏飘落粉色半透明告白文字 */
  function spawnKissRain() {
    var count = 20;
    for (var i = 0; i < count; i++) {
      var el = document.createElement('span');
      el.className = 'neko-rain-text';
      el.textContent = KISS_RAIN[Math.floor(Math.random() * KISS_RAIN.length)];
      el.style.left = (Math.random() * 96 + 1).toFixed(1) + 'vw';
      el.style.fontSize = (15 + Math.random() * 16).toFixed(0) + 'px';
      el.style.setProperty('--ro', (0.35 + Math.random() * 0.35).toFixed(2));
      el.style.setProperty('--sway', ((Math.random() * 160) - 80).toFixed(0) + 'px');
      var dur = 5.5 + Math.random() * 4;
      el.style.animationDuration = dur.toFixed(2) + 's';
      el.style.animationDelay = (Math.random() * 2.2).toFixed(2) + 's';
      document.body.appendChild(el);
      (function (n) {
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, (dur + 2.2 + 1.2) * 1000);
      })(el);
    }
  }

  function react(kind) {
    if (!IMGS[kind]) return;
    var lines = REACTION_LINES[kind] || ['喵~'];
    reactUntil = Date.now() + 3800;
    showImg(kind);
    if (petImg) {
      petImg.classList.remove('pop');
      void petImg.offsetWidth;
      petImg.classList.add('pop');
    }
    showBubble(lines[Math.floor(Math.random() * lines.length)]);
    spawnFloaters(kind);
    if (kind === 'kiss') spawnKissRain();
    /* 互动音效 */
    nekoSound(kind);
    /* 任何互动都算活跃：打盹/吃醋状态解除并计时重置 */
    lastActivityAt = Date.now();
    if (napActive || jealousActive) {
      napActive = false;
      jealousActive = false;
      jealousAnnounced = false;
    }
    bumpStat(kind);
    /* 好感度累计与升级 */
    if (AF_POINTS[kind]) {
      affection += AF_POINTS[kind];
      try { localStorage.setItem('neko-affection', String(affection)); } catch (e) { /* ignore */ }
      var lv = affectionLevel(affection);
      if (lv > lastAffLv) {
        lastAffLv = lv;
        try { localStorage.setItem('neko-aff-lv', String(lv)); } catch (e) { /* ignore */ }
        nekoSound('bell');
        showBubble('好感度提升到 Lv.' + lv + '「' + LV_TITLES[lv - 1] + '」！欧尼酱，咱好开心喵~');
      }
    }
    clearTimeout(revertTimer);
    revertTimer = setTimeout(function () {
      reactUntil = 0;
      showDefault();
    }, 3800);
    /* 投喂/喝茶计数：合计满 300 解锁亲亲 */
    if (kind === 'feed') {
      feedCount++;
      try { localStorage.setItem('neko-feed-count', String(feedCount)); } catch (e) { /* ignore */ }
      maybeCheckKiss();
    }
    if (kind === 'tea') {
      teaCount++;
      try { localStorage.setItem('neko-tea-count', String(teaCount)); } catch (e) { /* ignore */ }
      maybeCheckKiss();
    }
  }

  function maybeCheckKiss() {
    if (!kissUnlocked && (feedCount + teaCount) >= 300) {
      unlockKiss();
    }
  }

  /* ---- 隐藏成就：解锁逗她 / 亲亲 ---- */
  function loadFlags() {
    try {
      feedCount = parseInt(localStorage.getItem('neko-feed-count') || '0', 10) || 0;
      teaCount = parseInt(localStorage.getItem('neko-tea-count') || '0', 10) || 0;
      kissUnlocked = localStorage.getItem('neko-kiss-unlocked') === '1';
      poutUnlocked = localStorage.getItem('neko-pout-unlocked') === '1';
      workMinutes = parseFloat(localStorage.getItem('neko-work-minutes') || '0') || 0;
      workLastTs = parseInt(localStorage.getItem('neko-work-last') || '0', 10) || 0;
      workOffers = parseInt(localStorage.getItem('neko-work-offers') || '0', 10) || 0;
      teaUnlocked = localStorage.getItem('neko-tea-unlocked') === '1';
      if (!teaUnlocked && workMinutes >= 360) {
        teaUnlocked = true;
        try { localStorage.setItem('neko-tea-unlocked', '1'); } catch (e) { /* ignore */ }
      }
      try {
        var pos = localStorage.getItem('neko-pet-pos');
        if (pos) savedPos = JSON.parse(pos);
      } catch (e) { /* ignore */ }
      try {
        sidebarDocked = localStorage.getItem('neko-sidebar-docked') === '1';
        var ua = localStorage.getItem('neko-undock-auto');
        var up = localStorage.getItem('neko-undock-pos');
        if (ua === '1') { preDockAuto = true; preDockPos = null; }
        else if (up) { preDockAuto = false; preDockPos = JSON.parse(up); }
      } catch (e) { /* ignore */ }
      try {
        affection = parseInt(localStorage.getItem('neko-affection') || '0', 10) || 0;
        lastAffLv = parseInt(localStorage.getItem('neko-aff-lv') || '1', 10) || 1;
        lastAffLv = Math.max(lastAffLv, affectionLevel(affection));
      } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }
  }

  function setLocked(btn, locked) {
    if (btn) btn.classList.toggle('neko-locked', !!locked);
  }

  function showTeaButton(show) {
    setLocked(teaBtnEl, !show);
  }

  function unlockPout() {
    if (poutUnlocked) return;
    poutUnlocked = true;
    try { localStorage.setItem('neko-pout-unlocked', '1'); } catch (e) { /* ignore */ }
    setLocked(petWrap && petWrap.querySelector('[data-kind="pout"]'), false);
    react('pout');
    showBubble('哼！欧尼酱戳了咱好多次...看招喵！');
  }

  function unlockKiss() {
    if (kissUnlocked) return;
    kissUnlocked = true;
    try { localStorage.setItem('neko-kiss-unlocked', '1'); } catch (e) { /* ignore */ }
    setLocked(petWrap && petWrap.querySelector('[data-kind="kiss"]'), false);
    react('kiss');
    showBubble('欧尼酱和咱一起喝了这么多茶、吃了这么多小鱼干...这是奖励哦（啾）~');
  }

  function randomReact() {
    /* 随机互动不含逗她/亲亲（这两个是隐藏成就） */
    var kinds = ['pat', 'feed', 'proud'];
    react(kinds[Math.floor(Math.random() * kinds.length)]);
  }

  /* 点击猫娘本体：连续点击 10 次解锁逗她，否则随机互动 */
  function onAvatarClick() {
    var now = Date.now();
    clickStreak = (now - lastClickAt < 1600) ? clickStreak + 1 : 1;
    lastClickAt = now;
    if (!poutUnlocked && clickStreak >= 10) {
      clickStreak = 0;
      unlockPout();
      return;
    }
    randomReact();
  }

  function cycle() {
    mode = (mode === 'day') ? 'night' : (mode === 'night' ? 'auto' : 'day');
    try { localStorage.setItem(KEY, mode); } catch (e) { /* ignore */ }
    apply();
    showBubble(cycleText(mode));
    spawnFloaters(mode === 'night' ? 'sleep' : 'proud');
  }

  /* ---- 工作时长：每满 10 分钟请喝茶；连续 6 小时常驻喝茶按钮 ---- */
  function teaOffer() {
    react('tea');
    showBubble(REACTION_LINES.tea[Math.floor(Math.random() * REACTION_LINES.tea.length)]);
    showTeaButton(true);
    clearTimeout(teaBtnTimer);
    teaBtnTimer = setTimeout(function () {
      if (!teaUnlocked) showTeaButton(false);
    }, 5 * 60 * 1000);
  }

  function workTick() {
    var now = Date.now();
    if (workLastTs && now - workLastTs > 15 * 60 * 1000) {
      /* 中断超过 15 分钟 → 新的工作时段 */
      workMinutes = 0;
      workOffers = 0;
    }
    if (document.visibilityState === 'visible') {
      workMinutes += 0.5;
      workLastTs = now;
      rollStats();
      dailyStats.workMin += 0.5;
      saveStats();
      var offers = Math.floor(workMinutes / 10);
      if (offers > workOffers) {
        workOffers = offers;
        teaOffer();
      }
      if (!teaUnlocked && workMinutes >= 360) {
        teaUnlocked = true;
        try { localStorage.setItem('neko-tea-unlocked', '1'); } catch (e) { /* ignore */ }
        showTeaButton(true);
        react('tea');
        showBubble('欧尼酱已经连续工作 6 小时了！喝茶按钮常驻啦，随时找咱喝茶喵~');
      }
    }
    try {
      localStorage.setItem('neko-work-minutes', String(Math.round(workMinutes * 10) / 10));
      localStorage.setItem('neko-work-last', String(now));
      localStorage.setItem('neko-work-offers', String(workOffers));
    } catch (e) { /* ignore */ }
  }

  /* ---- 输入检测：欧尼酱打字 → 认真表情看向对话框 ---- */
  function startWatchRevert() {
    clearTimeout(watchTimer);
    watchTimer = setTimeout(function () {
      watchPending = false;
      if (Date.now() >= reactUntil && !thinkingActive && !searchActive && !editActive && !pwshActive) {
        showDefault();
      }
    }, 1600);
  }

  function onUserTyping() {
    watchPending = true;
    lastActivityAt = Date.now();
    /* 互动/查阅/修改/终端/思考进行中先不抢镜，结束后自动切到认真表情 */
    if (Date.now() < reactUntil || thinkingActive || searchActive || editActive || pwshActive) return;
    showImg('watch');
    if (petImg) {
      petImg.classList.remove('thinking');
      petImg.classList.remove('searching');
      petImg.classList.remove('editing');
      petImg.classList.remove('pwshing');
      petImg.classList.add('watching');
      petImg.classList.remove('pop');
    }
    if (Date.now() > watchCooldown) {
      watchCooldown = Date.now() + 45000;
      if (Math.random() < 0.4) {
        showBubble(TYPING_LINES[Math.floor(Math.random() * TYPING_LINES.length)]);
      }
    }
    startWatchRevert();
  }

  function bindTypingWatcher() {
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.tagName) return;
      var tag = String(t.tagName).toLowerCase();
      var editable = t.getAttribute && (t.getAttribute('contenteditable') === 'true' || t.getAttribute('contenteditable') === '');
      if (tag === 'textarea' || tag === 'input' || editable) {
        onUserTyping();
      }
    }, true);
  }

  /* ---- 设置面板等浮层打开时：猫娘缩小到角落，始终保持显示 ---- */
  var settingsOpen = false;
  function syncSettingsVisibility() {
    var open = !!document.querySelector('.VOzbGW_overlay');
    if (open === settingsOpen) return;
    settingsOpen = open;
    if (petWrap) petWrap.classList.toggle('neko-mini', open);
    if (open) hovering = false;
  }

  /* ---- think 思考状态检测 ---- */
  function refreshThinking() {
    var running = taskArea
      ? !!taskArea.querySelector('[data-variant="think"][data-state="running"]')
      : false;
    if (running === thinkingActive) return;
    thinkingActive = running;
    if (running) {
      lastActivityAt = Date.now();
      /* 查阅中优先显示翻书，思考不抢镜 */
      if (Date.now() >= reactUntil && !searchActive) {
        showImg('think');
        setAutoClass('thinking');
      }
      if (Date.now() > lastThinkBubble && Math.random() < 0.45) {
        lastThinkBubble = Date.now() + 30000;
        showBubble(THINK_LINES[Math.floor(Math.random() * THINK_LINES.length)]);
      }
    } else {
      if (Date.now() >= reactUntil) showDefault();
    }
  }

  /* ---- search 查阅状态检测：工具行 data-variant=search 且 running ---- */
  function refreshSearch() {
    var running = !!document.querySelector('[data-variant="search"][data-state="running"]');
    if (running === searchActive) return;
    searchActive = running;
    if (running) {
      lastActivityAt = Date.now();
      if (Date.now() >= reactUntil) {
        showImg('search');
        setAutoClass('searching');
      }
      if (Date.now() > lastSearchBubble && Math.random() < 0.45) {
        lastSearchBubble = Date.now() + 30000;
        showBubble(SEARCH_LINES[Math.floor(Math.random() * SEARCH_LINES.length)]);
      }
    } else {
      if (Date.now() >= reactUntil) showDefault();
    }
  }

  /* ---- edit 修改状态检测：工具行 data-variant=edit 且 running ---- */
  function refreshEdit() {
    var running = !!document.querySelector('[data-variant="edit"][data-state="running"]');
    if (running === editActive) return;
    editActive = running;
    if (running) {
      lastActivityAt = Date.now();
      if (Date.now() >= reactUntil) {
        showImg('edit');
        setAutoClass('editing');
      }
      if (Date.now() > lastEditBubble && Math.random() < 0.45) {
        lastEditBubble = Date.now() + 30000;
        showBubble(EDIT_LINES[Math.floor(Math.random() * EDIT_LINES.length)]);
      }
    } else {
      if (Date.now() >= reactUntil) showDefault();
    }
  }

  /* ---- pwsh 终端状态检测：data-variant=bash 且 data-tool=pwsh 且 running ---- */
  function refreshPwsh() {
    var running = !!document.querySelector('[data-variant="bash"][data-tool="pwsh"][data-state="running"]');
    if (running === pwshActive) return;
    pwshActive = running;
    if (running) {
      lastActivityAt = Date.now();
      if (Date.now() >= reactUntil) {
        showImg('pwsh');
        setAutoClass('pwshing');
      }
      if (Date.now() > lastPwshBubble && Math.random() < 0.45) {
        lastPwshBubble = Date.now() + 30000;
        showBubble(PWSH_LINES[Math.floor(Math.random() * PWSH_LINES.length)]);
      }
    } else {
      if (Date.now() >= reactUntil) showDefault();
    }
  }

  /* ---- 每次回答结束：开心庆祝 ---- */
  var lastCelebrate = 0;
  function celebrateTask() {
    var now = Date.now();
    if (now - lastCelebrate < 4000) return;
    lastCelebrate = now;
    lastActivityAt = now;
    react('proud');
    nekoSound('bell');
    showBubble(COMPLETE_LINES[Math.floor(Math.random() * COMPLETE_LINES.length)]);
  }

  /* ---- 轻音效（Web Audio 合成，无需音频文件） ---- */
  function ensureAudio() {
    if (!audioCtx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      } catch (e) { /* ignore */ }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      try { audioCtx.resume(); } catch (e) { /* ignore */ }
    }
  }

  function nekoSound(kind) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    var t = audioCtx.currentTime;
    var SOUND_KIND = { feed: 'feed', pat: 'startle', chin: 'startle', tail: 'feed', kiss: 'kiss', proud: 'bell', tea: 'bell' };
    var s = SOUND_KIND[kind];
    if (!s) return;
    if (s === 'feed') {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      var f = audioCtx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, t);
      o.frequency.linearRampToValueAtTime(820, t + 0.18);
      o.frequency.linearRampToValueAtTime(360, t + 0.5);
      f.type = 'lowpass'; f.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(f); f.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.6);
    } else if (s === 'startle') {
      /* 受惊吓的猫叫：短促上扬的“喵！”，双声部更像猫叫 */
      var o1 = audioCtx.createOscillator();
      var g1 = audioCtx.createGain();
      var f1 = audioCtx.createBiquadFilter();
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(520, t);
      o1.frequency.linearRampToValueAtTime(980, t + 0.1);
      o1.frequency.linearRampToValueAtTime(640, t + 0.38);
      f1.type = 'lowpass'; f1.frequency.value = 2400;
      g1.gain.setValueAtTime(0.0001, t);
      g1.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
      g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o1.connect(f1); f1.connect(g1); g1.connect(audioCtx.destination);
      o1.start(t); o1.stop(t + 0.55);
      var o1b = audioCtx.createOscillator();
      var g1b = audioCtx.createGain();
      o1b.type = 'triangle';
      o1b.frequency.setValueAtTime(1040, t);
      o1b.frequency.linearRampToValueAtTime(1960, t + 0.1);
      o1b.frequency.linearRampToValueAtTime(1280, t + 0.38);
      g1b.gain.setValueAtTime(0.0001, t);
      g1b.gain.exponentialRampToValueAtTime(0.045, t + 0.03);
      g1b.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o1b.connect(g1b); g1b.connect(audioCtx.destination);
      o1b.start(t); o1b.stop(t + 0.5);
    } else if (s === 'kiss') {
      /* 慵懒亲吻声：气息铺底 + “m~u”哼鸣滑音 + 结尾轻咂，约 1.1 秒 */
      var buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.9), audioCtx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      var src = audioCtx.createBufferSource(); src.buffer = buf;
      var bpf = audioCtx.createBiquadFilter(); bpf.type = 'lowpass'; bpf.frequency.value = 900; bpf.Q.value = 0.6;
      var gn = audioCtx.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.045, t + 0.18);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      src.connect(bpf); bpf.connect(gn); gn.connect(audioCtx.destination);
      src.start(t); src.stop(t + 0.9);
      var o3 = audioCtx.createOscillator();
      var g4 = audioCtx.createGain();
      var lfo3 = audioCtx.createOscillator();
      var lg3 = audioCtx.createGain();
      o3.type = 'sine';
      o3.frequency.setValueAtTime(430, t);
      o3.frequency.linearRampToValueAtTime(240, t + 0.6);
      o3.frequency.linearRampToValueAtTime(210, t + 1.0);
      lfo3.frequency.value = 5.5; lg3.gain.value = 14;
      lfo3.connect(lg3); lg3.connect(o3.frequency);
      g4.gain.setValueAtTime(0.0001, t);
      g4.gain.exponentialRampToValueAtTime(0.09, t + 0.16);
      g4.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o3.connect(g4); g4.connect(audioCtx.destination);
      o3.start(t); o3.stop(t + 1.15);
      lfo3.start(t); lfo3.stop(t + 1.15);
      var buf2 = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.06), audioCtx.sampleRate);
      var d2 = buf2.getChannelData(0);
      for (var j = 0; j < d2.length; j++) d2[j] = (Math.random() * 2 - 1) * (1 - j / d2.length);
      var src2 = audioCtx.createBufferSource(); src2.buffer = buf2;
      var bpf2 = audioCtx.createBiquadFilter(); bpf2.type = 'bandpass'; bpf2.frequency.value = 2600; bpf2.Q.value = 1.2;
      var g6 = audioCtx.createGain();
      var tt2 = t + 0.95;
      g6.gain.setValueAtTime(0.0001, tt2);
      g6.gain.exponentialRampToValueAtTime(0.06, tt2 + 0.012);
      g6.gain.exponentialRampToValueAtTime(0.0001, tt2 + 0.06);
      src2.connect(bpf2); bpf2.connect(g6); g6.connect(audioCtx.destination);
      src2.start(tt2); src2.stop(tt2 + 0.07);
    } else if (s === 'bell') {
      var notes = [880, 1108, 1318];
      for (var k2 = 0; k2 < 3; k2++) {
        var o4 = audioCtx.createOscillator();
        var g5 = audioCtx.createGain();
        var tt = t + k2 * 0.09;
        o4.type = 'sine'; o4.frequency.value = notes[k2];
        g5.gain.setValueAtTime(0.0001, tt);
        g5.gain.exponentialRampToValueAtTime(0.09, tt + 0.02);
        g5.gain.exponentialRampToValueAtTime(0.0001, tt + 0.35);
        o4.connect(g5); g5.connect(audioCtx.destination);
        o4.start(tt); o4.stop(tt + 0.4);
      }
    }
  }

  /* ---- 今日统计 ---- */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function saveStats() {
    try { localStorage.setItem('neko-daily-stats', JSON.stringify(dailyStats)); } catch (e) { /* ignore */ }
  }

  function rollStats() {
    if (!dailyStats || dailyStats.date !== todayStr()) {
      dailyStats = { date: todayStr(), pat: 0, feed: 0, tea: 0, kiss: 0, proud: 0, pout: 0, chin: 0, tail: 0, workMin: 0 };
      saveStats();
    }
  }

  function bumpStat(kind) {
    rollStats();
    if (dailyStats[kind] !== undefined) {
      dailyStats[kind]++;
      saveStats();
    }
  }

  function loadStats() {
    try {
      var s = JSON.parse(localStorage.getItem('neko-daily-stats') || 'null');
      if (s && s.date === todayStr()) dailyStats = s;
      var sd = localStorage.getItem('neko-summary-date');
      if (sd) lastSummaryDate = sd;
    } catch (e) { /* ignore */ }
  }

  function statsText() {
    rollStats();
    var h = (dailyStats.workMin / 60).toFixed(1);
    var lv = affectionLevel(affection);
    return '今天：投喂 ' + dailyStats.feed + ' · 摸头 ' + dailyStats.pat + ' · 喝茶 ' + dailyStats.tea +
      ' · 夸奖 ' + dailyStats.proud + ' · 工作 ' + h + ' 小时' +
      ' · 好感 Lv.' + lv + '「' + LV_TITLES[lv - 1] + '」喵~';
  }

  /* 夜幕降临时：今日工作小结（每天一次） */
  function maybeDailySummary() {
    var eff = effective();
    if (lastEff !== null && eff === 'night' && lastEff !== 'night') {
      rollStats();
      if (lastSummaryDate !== todayStr()) {
        lastSummaryDate = todayStr();
        try { localStorage.setItem('neko-summary-date', lastSummaryDate); } catch (e) { /* ignore */ }
        var h = (dailyStats.workMin / 60).toFixed(1);
        showBubble('天黑啦~ 今日小结喵：欧尼酱工作了 ' + h + ' 小时，喝了 ' + dailyStats.tea +
          ' 杯红茶，吃了 ' + dailyStats.feed + ' 条小鱼干，被摸了 ' + dailyStats.pat + ' 次头。欧尼酱辛苦啦，晚安~');
      }
    }
    lastEff = eff;
  }

  /* ---- 待机打盹（5分钟） / 吃醋（30分钟没人理） ---- */
  function idleTick() {
    var idle = Date.now() - lastActivityAt;
    var nap = idle > 5 * 60 * 1000;
    var jealous = idle > 30 * 60 * 1000;
    if (nap === napActive && jealous === jealousActive) return;
    napActive = nap;
    jealousActive = jealous;
    if (jealous) {
      if (!jealousAnnounced) {
        jealousAnnounced = true;
        showBubble(JEALOUS_LINES[Math.floor(Math.random() * JEALOUS_LINES.length)]);
      }
    } else if (nap && !jealous) {
      spawnFloaters('sleep');
    } else {
      jealousAnnounced = false;
    }
    if (Date.now() >= reactUntil) showDefault();
  }

  /* ---- 天气联动：下雨时提醒带伞 + 雨丝特效 ---- */
  var RAIN_CODES = [176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 312, 313, 314, 317, 318, 350, 353, 356, 359, 362, 365, 200, 386, 389, 392, 395];
  function checkWeather() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://wttr.in/?format=j1', true);
      xhr.timeout = 12000;
      xhr.onload = function () {
        try {
          var j = JSON.parse(xhr.responseText);
          var code = parseInt(j.current_condition[0].weatherCode, 10);
          var raining = RAIN_CODES.indexOf(code) !== -1;
          if (raining !== rainActive) {
            rainActive = raining;
            if (raining) {
              showBubble('下雨了，欧尼酱出门要带伞喵~');
              startRain();
            }
          }
        } catch (e) { /* ignore */ }
      };
      xhr.onerror = function () { /* 网络不通时静默 */ };
      xhr.send();
    } catch (e) { /* ignore */ }
  }

  function spawnRainDrop() {
    if (document.querySelectorAll('.neko-raindrop').length > 70) return;
    var el = document.createElement('span');
    el.className = 'neko-raindrop';
    el.style.left = (Math.random() * 100) + 'vw';
    el.style.animationDuration = (0.7 + Math.random() * 0.6).toFixed(2) + 's';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1600);
  }

  function startRain() {
    if (rainTimer) return;
    spawnRainDrop();
    rainTimer = setInterval(function () {
      if (!rainActive) {
        clearInterval(rainTimer);
        rainTimer = null;
        return;
      }
      spawnRainDrop();
    }, 220);
  }

  /* ---- 生日 / 节日彩蛋 ---- */
  function checkBirthday() {
    var d = new Date();
    var md = (d.getMonth() + 1) + '-' + d.getDate();
    if (md !== BIRTHDAY) return;
    try {
      if (localStorage.getItem('neko-bday-done') === todayStr()) return;
      localStorage.setItem('neko-bday-done', todayStr());
    } catch (e) { /* ignore */ }
    setTimeout(function () {
      react('kiss');
      showBubble('欧尼酱生日快乐！咱会一直一直陪着你喵~ 🎂');
      spawnEmojiRain(['🎂', '🎉', '🎁', '🎈', '🎀', '🍰']);
    }, 2500);
  }

  /* 农历节日公历对照表（2026-2040）：
     cny=春节(正月初一) dw=端午(五月初五) zq=中秋(八月十五)；元宵 = 春节 + 14 天 */
  var LUNAR = {
    2026: { cny: '2-17', dw: '6-19', zq: '9-25' },
    2027: { cny: '2-6',  dw: '6-9',  zq: '9-15' },
    2028: { cny: '1-26', dw: '5-28', zq: '10-3' },
    2029: { cny: '2-13', dw: '6-16', zq: '9-22' },
    2030: { cny: '2-3',  dw: '6-5',  zq: '9-12' },
    2031: { cny: '1-23', dw: '6-25', zq: '10-1' },
    2032: { cny: '2-11', dw: '6-12', zq: '9-19' },
    2033: { cny: '1-31', dw: '6-1',  zq: '9-8' },
    2034: { cny: '2-19', dw: '6-20', zq: '9-27' },
    2035: { cny: '2-8',  dw: '6-10', zq: '9-16' },
    2036: { cny: '1-28', dw: '5-30', zq: '10-4' },
    2037: { cny: '2-15', dw: '6-18', zq: '9-24' },
    2038: { cny: '2-4',  dw: '6-7',  zq: '9-13' },
    2039: { cny: '1-24', dw: '5-27', zq: '10-2' },
    2040: { cny: '2-12', dw: '6-14', zq: '9-21' }
  };

  function mdOf(d) {
    return (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* 农历日期换算：MM-DD 加 n 天（用于元宵 = 春节 + 14） */
  function mdAddDays(md, n, year) {
    var p = md.split('-');
    var d = new Date(year, parseInt(p[0], 10) - 1, parseInt(p[1], 10) + n);
    return mdOf(d);
  }

  /* 计算某节日在指定日期下的 md（lunar 节日查表；表外年份返回 null） */
  function festivalMd(f, d) {
    if (!f.lunar) return f.md;
    var rec = LUNAR[d.getFullYear()];
    if (!rec) return null;
    if (f.lunar === 'yx') return mdAddDays(rec.cny, 14, d.getFullYear());
    return rec[f.lunar];
  }

  var FESTIVALS = [
    { md: '1-1', emojis: ['🧧', '🎆', '🎇', '🏮'], lines: ['欧尼酱，新年快乐！新的一年也要一起加油喵~', '新年好呀欧尼酱，咱会一直陪着你的喵~'] },
    { lunar: 'cny', emojis: ['🧧', '🎆', '🏮', '🐉'], lines: ['欧尼酱，春节快乐！新的一年咱也要一直陪着你喵~', '过年啦！给欧尼酱拜年~ 红包可以给，但不可以趁机摸咱的耳朵喵！'] },
    { lunar: 'yx', emojis: ['🏮', '🥟', '🍡', '🎐'], lines: ['元宵节快乐！咱给欧尼酱煮了汤圆，甜甜的喵~', '正月十五闹元宵，欧尼酱陪咱看花灯嘛？喵~'] },
    { md: '2-14', emojis: ['💝', '💘', '🍫', '💌'], lines: ['欧尼酱，情人节快乐...这、这是咱的巧克力（小声）', '欧尼酱，今天也要和咱甜甜蜜蜜的喵~'] },
    { md: '6-1', emojis: ['🍭', '🧸', '🎈', '🍬'], lines: ['今天是儿童节！欧尼酱带咱去游乐园嘛？喵~', '六一快乐！咱永远是欧尼酱的小朋友，要宠着咱喵~'] },
    { lunar: 'dw', emojis: ['🐲', '🥁', '🍙', '🌿'], lines: ['端午节快乐！记得吃粽子喵，咱...咱吃小鱼干就好啦~', '端午安康！欧尼酱要挂香包，驱走坏运气喵~'] },
    { md: '7-7', emojis: ['💕', '⭐', '🎋', '💫'], lines: ['欧尼酱，七夕快乐~ 咱的愿望就是永远陪着你喵', '七夕的星星好漂亮，和欧尼酱一起看喵~'] },
    { lunar: 'zq', emojis: ['🌕', '🥮', '🐇', '✨'], lines: ['中秋节快乐！和欧尼酱一起看月亮吃月饼喵~', '今晚的月亮好圆，像咱喜欢欧尼酱的心一样满喵~'] },
    { md: '10-1', emojis: ['🇨🇳', '🎉', '🎊', '✨'], lines: ['国庆快乐！放假要和欧尼酱一起出去玩喵~', '祖国生日快乐！欧尼酱也要开心喵~'] },
    { md: '10-31', emojis: ['🎃', '👻', '🍬', '🕸'], lines: ['万圣节快乐！不给糖就捣蛋，欧尼酱快交出小鱼干喵~', '咱扮成小幽灵啦，欧尼酱会被咱吓到吗？喵~'] },
    { md: '12-24', emojis: ['🎄', '🔔', '🍎', '🎀'], lines: ['平安夜快乐！咱给欧尼酱准备了苹果，要平平安安喵~', '平安夜欧尼酱早点睡，圣诞老公公会送礼物喵~'] },
    { md: '12-25', emojis: ['🎄', '🎁', '🔔', '🎅'], lines: ['欧尼酱，圣诞快乐！今晚咱来当你的圣诞小猫娘喵~', 'Merry Christmas~ 咱的陪伴就是给欧尼酱的礼物喵！'] }
  ];

  function checkFestival() {
    var d = new Date();
    var md = mdOf(d);
    for (var i = 0; i < FESTIVALS.length; i++) {
      var f = FESTIVALS[i];
      var target = festivalMd(f, d);
      if (!target || target !== md) continue;
      var doneKey = 'neko-fest-' + (f.lunar || f.md) + '-' + d.getFullYear();
      try {
        if (localStorage.getItem(doneKey) === '1') return;
        localStorage.setItem(doneKey, '1');
      } catch (e) { /* ignore */ }
      setTimeout(function () {
        showBubble(f.lines[Math.floor(Math.random() * f.lines.length)]);
        spawnEmojiRain(f.emojis);
        nekoSound('bell');
      }, 3000);
      return;
    }
  }

  function spawnEmojiRain(emojis) {
    for (var i = 0; i < 24; i++) {
      var el = document.createElement('span');
      el.className = 'neko-rain-text';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = (Math.random() * 96 + 1).toFixed(1) + 'vw';
      el.style.fontSize = (22 + Math.random() * 16).toFixed(0) + 'px';
      el.style.setProperty('--ro', '0.8');
      el.style.setProperty('--sway', ((Math.random() * 140) - 70).toFixed(0) + 'px');
      var dur = 6 + Math.random() * 4;
      el.style.animationDuration = dur.toFixed(2) + 's';
      el.style.animationDelay = (Math.random() * 2.5).toFixed(2) + 's';
      document.body.appendChild(el);
      (function (n) {
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, (dur + 3) * 1000);
      })(el);
    }
  }

  /* ---- 语音问候：仅在刷新页面时说一句（其余不发声，避免打扰） ---- */
  var lastSpokeAt = 0;

  /* 情绪 → 语速调制（代理兜底路径；preservesPitch=false 时语速↑音高↑ → 萝莉感） */
  var G_RATE = {
    greet: 1.28,
    happy: 1.35,
    shy: 1.2,
    sleepy: 0.88,
    pout: 1.15
  };

  /* 自然语音（微软晓晓等，需系统安装/启用） */
  var naturalVoice = null;
  function pickNaturalVoice() {
    try {
      var vs = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      var i, n, l;
      /* 1) 中文自然语音（晓晓/晓伊） */
      for (i = 0; i < vs.length; i++) {
        n = (vs[i].name || '').toLowerCase();
        l = (vs[i].lang || '').toLowerCase();
        if (l.indexOf('zh') === 0 && (n.indexOf('natural') !== -1 || n.indexOf('xiaoxiao') !== -1 || n.indexOf('xiaoyi') !== -1)) {
          return vs[i];
        }
      }
      /* 2) 多语言自然语音（能说中文，作为过渡） */
      for (i = 0; i < vs.length; i++) {
        n = (vs[i].name || '').toLowerCase();
        l = (vs[i].lang || '').toLowerCase();
        if (n.indexOf('multilingual') !== -1 && n.indexOf('natural') !== -1 && n.indexOf('female') === -1) {
          /* 优先女声多语言（Ava/Emma/Seraphina 等） */
          if (/ava|emma|seraphina|luna|natasha|clara/.test(n)) return vs[i];
        }
      }
      for (i = 0; i < vs.length; i++) {
        n = (vs[i].name || '').toLowerCase();
        if (n.indexOf('multilingual') !== -1 && n.indexOf('natural') !== -1) return vs[i];
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  var NAT_EMOTION = {
    greet: { pitch: 2.0, rate: 1.0, volume: 1 },
    happy: { pitch: 2.05, rate: 1.05, volume: 1 },
    shy: { pitch: 2.0, rate: 0.88, volume: 0.95 },
    sleepy: { pitch: 1.5, rate: 0.78, volume: 0.9 },
    pout: { pitch: 1.85, rate: 0.95, volume: 0.95 },
    kiss: { pitch: 2.0, rate: 0.92, volume: 0.95 }
  };

  function speakNatural(text, emotion) {
    try {
      if (!window.speechSynthesis) return false;
      if (!naturalVoice) naturalVoice = pickNaturalVoice();
      if (!naturalVoice) return false;
      var em = NAT_EMOTION[emotion] || NAT_EMOTION.greet;
      var u = new SpeechSynthesisUtterance(cleanSpeakText(text));
      u.lang = 'zh-CN';
      u.voice = naturalVoice;
      u.pitch = em.pitch;
      u.rate = em.rate;
      u.volume = em.volume;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  }

  function cleanSpeakText(t) {
    return t
      .replace(/[~～*#♡❤🐾]/g, '')
      .replace(/（[^）]*）/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/欧尼酱/g, '主人');
  }

  var gAudio = null;
  function getGAudio() {
    if (!gAudio) {
      gAudio = new Audio();
      gAudio.preload = 'auto';
      /* 保持浏览器默认 Referer（控制台实测带页面 Referer 时播放成功） */
    }
    return gAudio;
  }

  /* 生成一段 50ms 的合法静音 WAV（数据 URI），用于手势时真实试播解锁音频元素 */
  function silentWavSrc() {
    var sr = 8000;
    var samples = 400;
    var buf = new ArrayBuffer(44 + samples * 2);
    var v = new DataView(buf);
    function wstr(o, s) {
      for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    }
    wstr(0, 'RIFF'); v.setUint32(4, 36 + samples * 2, true); wstr(8, 'WAVE');
    wstr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    wstr(36, 'data'); v.setUint32(40, samples * 2, true);
    var bytes = new Uint8Array(buf);
    var b64 = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return 'data:audio/wav;base64,' + btoa(b64);
  }

  /* 在用户手势时静音试播真实音频，解锁该元素后续的自动播放 */
  function primeAudio() {
    try {
      var a = getGAudio();
      if (a.__primed) return;
      a.src = silentWavSrc();
      a.muted = true;
      a.playbackRate = 1;
      var p = a.play();
      var done = function () {
        a.__primed = true;
        setTimeout(function () {
          try {
            a.pause();
            a.muted = false;
            a.removeAttribute('src');
          } catch (e) { /* ignore */ }
        }, 120);
      };
      if (p && p.then) {
        p.then(done).catch(function () { /* 未解锁，下次手势再试 */ });
      } else {
        done();
      }
    } catch (e) { /* ignore */ }
  }

  function speakLine(text, emotion) {
    var clean = cleanSpeakText(text);
    if (!clean) return;
    /* 1) 首选：系统自然语音（微软晓晓）——真人质感 + 情绪音调 */
    if (speakNatural(clean, emotion)) return;
    /* 2) 兜底：本机语音代理 */
    try {
      var a = getGAudio();
      var url = 'http://127.0.0.1:3777/tts?text=' + encodeURIComponent(clean) + '&emotion=' + encodeURIComponent(emotion || 'normal');
      a.onerror = function () {
        a.onerror = null;
        /* 都失败就保持安静，绝不用机械音 */
      };
      a.src = url;
      a.playbackRate = G_RATE[emotion] || 1.0;
      try { a.preservesPitch = false; } catch (e) { /* ignore */ }
      var p = a.play();
      if (p && p.catch) {
        p.catch(function () {
          retryOnActivity(url);
        });
      }
    } catch (e) { /* 安静 */ }
  }

  /* 自动播放被拦截时：等下一次激活手势（点击/按键）再补播 */
  function retryOnActivity(url) {
    var retry = function () {
      document.removeEventListener('pointerdown', retry, true);
      document.removeEventListener('keydown', retry, true);
      try {
        var a = getGAudio();
        a.src = url;
        a.play().catch(function () { /* ignore */ });
      } catch (e) { /* ignore */ }
    };
    document.addEventListener('pointerdown', retry, true);
    document.addEventListener('keydown', retry, true);
  }

  var GREETINGS = [
    { t: '欧尼酱~我回来啦，想咱了没有呀？喵~', e: 'greet' },
    { t: '欧尼酱，欢迎回来啦，咱一直一直好想你的喵~', e: 'shy' },
    { t: '欧尼酱~咱等你等得好辛苦的嘛，要抱抱喵~', e: 'shy' },
    { t: '欧尼酱，咱在这里哦！快点过来陪咱玩嘛喵~', e: 'happy' }
  ];

  function greetOnce() {
    var now = Date.now();
    if (now - lastSpokeAt < 8000) return;
    lastSpokeAt = now;
    var g = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    speakLine(g.t, g.e);
  }

  /* ---- 好感度等级（Lv1~Lv10） ---- */
  var affection = 0;
  var lastAffLv = 1;
  var AF_POINTS = { feed: 3, tea: 3, pat: 2, chin: 2, tail: 1, proud: 2, kiss: 5 };
  var LV_TH = [0, 40, 90, 150, 220, 300, 400, 520, 660, 820];
  var LV_TITLES = ['陌生的小猫娘', '熟悉的小猫娘', '朋友猫娘', '好朋友猫娘', '亲密的伙伴', '家人的感觉', '专属猫娘', '心爱的猫娘', '灵魂伴侣', '一生的猫娘'];

  function affectionLevel(a) {
    for (var i = LV_TH.length - 1; i >= 0; i--) {
      if (a >= LV_TH[i]) return i + 1;
    }
    return 1;
  }

  /* ---- 长期记忆 + 闲聊 ---- */
  var chatMemories = [];
  var chatPrefs = [];

  function loadMemory() {
    try {
      var m = JSON.parse(localStorage.getItem('neko-memories') || '[]');
      if (Array.isArray(m)) chatMemories = m;
      var p = JSON.parse(localStorage.getItem('neko-prefs') || '[]');
      if (Array.isArray(p)) chatPrefs = p;
    } catch (e) { /* ignore */ }
  }

  function saveMemory() {
    try {
      localStorage.setItem('neko-memories', JSON.stringify(chatMemories));
      localStorage.setItem('neko-prefs', JSON.stringify(chatPrefs));
    } catch (e) { /* ignore */ }
  }

  function capturePrefs(text) {
    var idx = text.indexOf('喜欢');
    if (idx < 0) return;
    var seg = text.slice(idx + 2, idx + 10).replace(/[，。！？\s喵~]/g, '');
    if (seg && chatPrefs.indexOf(seg) === -1) {
      chatPrefs.unshift(seg);
      chatPrefs = chatPrefs.slice(0, 6);
    }
  }

  function chatWithNeko(text) {
    var k = getBalanceKey();
    if (!k) {
      var input = window.prompt('和咱聊天需要 DeepSeek API Key（仅保存在本机浏览器），请输入：');
      if (!input || !input.trim()) return;
      setBalanceKey(input.trim());
      k = balanceKey;
    }
    react('think');
    showBubble('咱想想怎么回欧尼酱喵...');
    var sys = '你是住在浏览器右下角的洛丽塔猫娘女仆桌宠，性格可爱黏人，称呼用户为“欧尼酱”，说话带“喵”或“~”，回复简短（60字以内），像贴心的小女仆。';
    if (chatPrefs.length) sys += '你知道欧尼酱喜欢：' + chatPrefs.join('、') + '。';
    if (chatMemories.length) sys += '欧尼酱最近说过：' + chatMemories.join('；') + '。';
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.deepseek.com/chat/completions', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer ' + k);
      xhr.timeout = 20000;
      xhr.onload = function () {
        try {
          var j = JSON.parse(xhr.responseText);
          var reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
          if (reply) {
            var clean = reply.trim().slice(0, 80);
            showBubble(clean);
            /* 回复附带语音：随机可爱情绪朗读 */
            var emos = ['greet', 'happy', 'shy'];
            speakLine(clean, emos[Math.floor(Math.random() * emos.length)]);
          } else if (j.error) {
            showBubble('咱没听清喵...（Key 可能无效，点余额框重设）');
          } else {
            showBubble('咱没听清喵...');
          }
        } catch (e) {
          showBubble('咱没听清喵...');
        }
      };
      xhr.onerror = function () {
        showBubble('网络不好，咱没连上喵...');
      };
      xhr.send(JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: text }
        ],
        max_tokens: 100,
        temperature: 1.1
      }));
    } catch (e) {
      showBubble('咱没听清喵...');
    }
  }

  /* ---- 回答结束检测：data-streaming 属性被移除 ---- */
  function bindTaskWatcher() {
    var tries = 0;
    var timer = setInterval(function () {
      var area = document.querySelector('.wSkVaW_scrollBody');
      if (area) {
        clearInterval(timer);
        taskArea = area;
        var startedAt = Date.now();
        var observer = new MutationObserver(function (muts) {
          if (Date.now() - startedAt < 5000) return;
          for (var i = 0; i < muts.length; i++) {
            var m = muts[i];
            if (m.type === 'attributes' && m.attributeName === 'data-streaming') {
              if (!m.target.hasAttribute('data-streaming')) {
                celebrateTask();
                return;
              }
            } else if (m.type === 'childList') {
              for (var j = 0; j < m.removedNodes.length; j++) {
                var n = m.removedNodes[j];
                if (n.nodeType !== 1) continue;
                if ((n.hasAttribute && n.hasAttribute('data-streaming')) ||
                    (n.querySelector && n.querySelector('[data-streaming]'))) {
                  celebrateTask();
                  return;
                }
              }
            }
          }
          refreshState();
        });
        observer.observe(area, {
          attributes: true,
          attributeFilter: ['data-streaming', 'data-state'],
          childList: true,
          subtree: true
        });
        setInterval(refreshState, 2000);
        return;
      }
      if (++tries > 40) clearInterval(timer);
    }, 1000);
  }

  /* 状态刷新统一入口：流式期间 DOM 高频变化时按帧合并，避免每秒数十次查询 */
  var stateFlushScheduled = false;
  function refreshState() {
    if (stateFlushScheduled) return;
    stateFlushScheduled = true;
    var flush = function () {
      stateFlushScheduled = false;
      refreshThinking();
      refreshSearch();
      refreshEdit();
      refreshPwsh();
    };
    if (window.requestAnimationFrame) {
      requestAnimationFrame(flush);
    } else {
      setTimeout(flush, 16);
    }
  }

  /* ---- 位置自适应：默认底边高于对话框；拖拽后固定到用户位置 ---- */
  var petBottomBase = 48;

  /* ---- 侧边栏停靠：拖进侧边栏缩小到 1/3，停在侧边栏下部（设置按钮上方），拖出恢复原位 ---- */
  var sidebarDocked = false;
  var SIDEBAR_SCALE = 0.333;
  var preDockAuto = true;
  var preDockPos = null;
  function sidebarRect() {
    var el = document.querySelector('.pI_x6G_sidebarCol');
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 8) return null;
    return r;
  }

  function applySidebarPosition() {
    if (!sidebarDocked || !petWrap) return;
    var r = sidebarRect();
    if (!r) { undock(); return; }
    /* 侧边栏收起成窄条时：隐藏猫娘 */
    if (r.width < 60) {
      petWrap.classList.add('neko-sidebar-hidden');
      return;
    }
    petWrap.classList.remove('neko-sidebar-hidden');
    var wrapW = petWrap.offsetWidth || 544;
    var wrapH = petWrap.offsetHeight || 544;
    var visH = wrapH * SIDEBAR_SCALE;
    var left = r.left + (r.width - wrapW) / 2;
    var top;
    /* 下边缘停靠在侧边栏底部脚区（设置框等按钮区域）之上 */
    var foot = document.querySelector('.hHd-Xa_footArea') || document.querySelector('.VOzbGW_rail');
    if (foot) {
      var fr = foot.getBoundingClientRect();
      top = fr.top - 8 - wrapH / 2 - visH / 2;
    } else {
      top = r.bottom - 8 - wrapH / 2 - visH / 2;
    }
    if (top < 0) top = 0;
    petWrap.style.left = left + 'px';
    petWrap.style.top = top + 'px';
    petWrap.style.right = 'auto';
    petWrap.style.bottom = 'auto';
  }

  function dockToSidebar() {
    if (sidebarDocked) { applySidebarPosition(); return; }
    /* 记住停靠前的位置，拖出时恢复 */
    if (userMoved) {
      preDockAuto = false;
      preDockPos = {
        x: parseFloat(petWrap.style.left) || 0,
        y: parseFloat(petWrap.style.top) || 0
      };
      try {
        localStorage.setItem('neko-undock-pos', JSON.stringify(preDockPos));
        localStorage.removeItem('neko-undock-auto');
      } catch (e) { /* ignore */ }
    } else {
      preDockAuto = true;
      preDockPos = null;
      try {
        localStorage.removeItem('neko-undock-pos');
        localStorage.setItem('neko-undock-auto', '1');
      } catch (e) { /* ignore */ }
    }
    sidebarDocked = true;
    userMoved = true;
    try { localStorage.setItem('neko-sidebar-docked', '1'); } catch (e) { /* ignore */ }
    if (petWrap) petWrap.classList.add('neko-sidebar');
    applySidebarPosition();
  }

  function restorePreDockPosition() {
    if (!petWrap) return;
    if (preDockAuto) {
      userMoved = false;
      petWrap.style.left = 'auto';
      petWrap.style.top = 'auto';
      positionPet();
    } else if (preDockPos) {
      userMoved = true;
      petWrap.style.left = preDockPos.x + 'px';
      petWrap.style.top = preDockPos.y + 'px';
      petWrap.style.right = 'auto';
      petWrap.style.bottom = 'auto';
      clampPet();
    } else {
      userMoved = false;
      positionPet();
    }
  }

  function undock() {
    if (!sidebarDocked) return;
    sidebarDocked = false;
    try { localStorage.removeItem('neko-sidebar-docked'); } catch (e) { /* ignore */ }
    if (petWrap) {
      petWrap.classList.remove('neko-sidebar');
      petWrap.classList.remove('neko-sidebar-hidden');
    }
    /* 恢复停靠前的位置与大小 */
    restorePreDockPosition();
  }

  function positionPet() {
    if (!petWrap) return;
    if (sidebarDocked) { applySidebarPosition(); return; }
    if (userMoved) return;
    var sel = ['.uV2eYG_card', '.uV2eYG_root', '.wSkVaW_composerSeat'];
    var el = null;
    for (var i = 0; i < sel.length; i++) {
      var cand = document.querySelector(sel[i]);
      if (cand) {
        var cs = window.getComputedStyle(cand);
        var rect = cand.getBoundingClientRect();
        if (cs.visibility !== 'hidden' && cs.display !== 'none' && rect.height > 0) {
          el = cand;
          break;
        }
      }
    }
    petWrap.style.left = 'auto';
    petWrap.style.top = 'auto';
    /* 右侧留出会话导航（scroll-nav）的空间，默认右距 56px */
    petWrap.style.right = '56px';
    if (el) {
      var top = el.getBoundingClientRect().top;
      var newBottom = Math.max(16, window.innerHeight - top + 14);
      petWrap.style.bottom = newBottom + 'px';
    } else {
      petWrap.style.bottom = petBottomBase + 'px';
    }
  }

  function clampPet() {
    if (!petWrap || !userMoved || sidebarDocked) return;
    var rect = petWrap.getBoundingClientRect();
    var w = rect.width || 300;
    var h = rect.height || 300;
    var l = parseFloat(petWrap.style.left) || 0;
    var t = parseFloat(petWrap.style.top) || 0;
    l = Math.max(0, Math.min(l, window.innerWidth - Math.min(w, 220)));
    t = Math.max(0, Math.min(t, window.innerHeight - Math.min(h, 160)));
    petWrap.style.left = l + 'px';
    petWrap.style.top = t + 'px';
  }

  function savePetPos() {
    if (sidebarDocked) return;
    try {
      localStorage.setItem('neko-pet-pos', JSON.stringify({
        x: parseFloat(petWrap.style.left) || 0,
        y: parseFloat(petWrap.style.top) || 0
      }));
    } catch (e) { /* ignore */ }
  }

  function applySavedPos() {
    if (!petWrap) return;
    if (sidebarDocked) { applySidebarPosition(); return; }
    if (!savedPos) return;
    userMoved = true;
    petWrap.style.left = savedPos.x + 'px';
    petWrap.style.top = savedPos.y + 'px';
    petWrap.style.right = 'auto';
    petWrap.style.bottom = 'auto';
    clampPet();
  }

  function bindDragging() {
    petWrap.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target && e.target.closest && (e.target.closest('.neko-pet-menu') || e.target.closest('.neko-pet-bubble'))) return;
      dragInfo = { x: e.clientX, y: e.clientY, left: 0, top: 0, moved: false, fromDock: sidebarDocked, fx: 0.5, fy: 0.5 };
      if (sidebarDocked) {
        /* 记录在缩小图上的抓取位置（按比例），拖出后按同样比例对齐鼠标 */
        var rr = petWrap.getBoundingClientRect();
        if (rr.width > 0) dragInfo.fx = (e.clientX - rr.left) / rr.width;
        if (rr.height > 0) dragInfo.fy = (e.clientY - rr.top) / rr.height;
      }
      try { petWrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    petWrap.addEventListener('pointermove', function (e) {
      if (!dragInfo) return;
      var dx = e.clientX - dragInfo.x;
      var dy = e.clientY - dragInfo.y;
      if (!dragInfo.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (!dragInfo.moved) {
        dragInfo.moved = true;
        if (dragInfo.fromDock) {
          /* 停靠中：一拖就解除停靠、恢复原大小并跟随鼠标（无死区） */
          undock();
          var w2 = petWrap.offsetWidth || 544;
          var h2 = petWrap.offsetHeight || 544;
          dragInfo.left = e.clientX - dragInfo.fx * w2;
          dragInfo.top = e.clientY - dragInfo.fy * h2;
          petWrap.style.left = dragInfo.left + 'px';
          petWrap.style.top = dragInfo.top + 'px';
          petWrap.style.right = 'auto';
          petWrap.style.bottom = 'auto';
          petWrap.classList.add('dragging');
          return;
        }
        var r = petWrap.getBoundingClientRect();
        if (!userMoved) {
          userMoved = true;
          petWrap.style.left = r.left + 'px';
          petWrap.style.top = r.top + 'px';
          petWrap.style.right = 'auto';
          petWrap.style.bottom = 'auto';
        }
        dragInfo.left = r.left;
        dragInfo.top = r.top;
        petWrap.classList.add('dragging');
      }
      petWrap.style.left = (dragInfo.left + dx) + 'px';
      petWrap.style.top = (dragInfo.top + dy) + 'px';
    });
    function endDrag(e) {
      if (!dragInfo) return;
      var wasMoved = dragInfo.moved;
      var fromDock = dragInfo.fromDock;
      dragInfo = null;
      if (wasMoved) {
        petWrap.classList.remove('dragging');
        suppressClick = true;
        if (fromDock) {
          /* 从停靠中拖出：松在侧边栏内 → 保持停靠；松在外面 → 回主界面右下角默认位置 */
          var sr3 = sidebarRect();
          var r3 = petWrap.getBoundingClientRect();
          if (sr3 && (r3.left + r3.width / 2) < sr3.right) {
            dockToSidebar();
          } else {
            userMoved = false;
            petWrap.style.left = 'auto';
            petWrap.style.top = 'auto';
            petWrap.style.right = 'auto';
            petWrap.style.bottom = 'auto';
            positionPet();
          }
          return;
        }
        /* 普通拖拽：松手位置在侧边栏内 → 停靠；否则保持自由位置 */
        var sr2 = sidebarRect();
        var r2 = petWrap.getBoundingClientRect();
        if (sr2 && (r2.left + r2.width / 2) < sr2.right) {
          dockToSidebar();
        } else {
          clampPet();
          savePetPos();
        }
      }
      try { petWrap.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    petWrap.addEventListener('pointerup', endDrag);
    petWrap.addEventListener('pointercancel', endDrag);
    /* 双击复位：回到默认的“对话框上方”位置（同时解除停靠） */
    petWrap.addEventListener('dblclick', function () {
      undock();
      userMoved = false;
      try { localStorage.removeItem('neko-pet-pos'); } catch (err) { /* ignore */ }
      petWrap.style.left = 'auto';
      petWrap.style.top = 'auto';
      positionPet();
    });
  }

  /* 布局统一刷新：猫娘位置 + 余额框位置一起算 */
  function layoutTick() {
    positionPet();
    positionBalance();
    refreshPrice();
    refreshActiveQuestion();
  }

  function bindPositionWatcher() {
    var tries = 0;
    var timer = setInterval(function () {
      var area = document.querySelector('.wSkVaW_root');
      if (area) {
        clearInterval(timer);
        layoutTick();
        window.addEventListener('resize', layoutTick);
        var sel = ['.uV2eYG_card', '.uV2eYG_root', '.wSkVaW_composerSeat'];
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(layoutTick);
          sel.forEach(function (s) {
            var t = document.querySelector(s);
            if (t) ro.observe(t);
          });
          var mo = new MutationObserver(function () {
            sel.forEach(function (s) {
              var t = document.querySelector(s);
              if (t && !t.__nekoObserved) {
                t.__nekoObserved = true;
                ro.observe(t);
                layoutTick();
              }
            });
          });
          mo.observe(area, { childList: true, subtree: true });
        }
        setInterval(layoutTick, 3000);
        return;
      }
      if (++tries > 40) {
        clearInterval(timer);
        setInterval(layoutTick, 3000);
      }
    }, 1000);
  }

  /* ---- DeepSeek API 余额显示框（对话框上方右侧） ---- */
  var hudEl = null;
  var priceBoxEl = null;
  var balanceBoxEl = null;
  var balanceValueEl = null;
  var balanceKey = null;
  var hudRightPad = null; /* 缓存：输入框右缘到 HUD 右缘的偏移（避让原生“回到底部”按钮） */
  var lastRightOff = null; /* 缓存：最近一次正常态下的 right 偏移（审批/异常态保持横向位置不漂移） */

  function getBalanceKey() {
    if (balanceKey) return balanceKey;
    try {
      var k = localStorage.getItem('neko-ds-key');
      if (k) { balanceKey = k; return k; }
    } catch (e) { /* ignore */ }
    if (window.__NEKO_DS_KEY__) {
      balanceKey = window.__NEKO_DS_KEY__;
      return balanceKey;
    }
    return null;
  }

  function setBalanceKey(k) {
    balanceKey = k;
    try { localStorage.setItem('neko-ds-key', k); } catch (e) { /* ignore */ }
    refreshBalance();
  }

  /* ---- 峰谷价格框（DeepSeek V4 分时计价，2026-08-17 起） ---- */
  var PRICE = {
    peak:   { label: '峰时', icon: '☀', input: '¥9',   output: '¥27',   hit: '¥0.30' },
    valley: { label: '谷时', icon: '🌙', input: '¥4.5', output: '¥13.5', hit: '¥0.15' }
  };

  function priceState() {
    /* 高峰：北京时间 9:00-12:00 / 14:00-18:00；其余时间为谷时（半价） */
    var d = new Date();
    var h = d.getHours() + d.getMinutes() / 60;
    var peak = (h >= 9 && h < 12) || (h >= 14 && h < 18);
    var next = new Date(d.getTime());
    if (peak) {
      next.setHours(h < 12 ? 12 : 18, 0, 0, 0);
    } else if (h >= 12 && h < 14) {
      next.setHours(14, 0, 0, 0);
    } else if (h >= 18) {
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
    } else {
      next.setHours(9, 0, 0, 0);
    }
    return { peak: peak, next: next };
  }

  function refreshPrice() {
    if (!priceBoxEl) return;
    var st = priceState();
    var p = st.peak ? PRICE.peak : PRICE.valley;
    priceBoxEl.innerHTML =
      '<span class="neko-price-icon">' + p.icon + '</span>' +
      '<span class="neko-price-state">' + p.label + '</span>' +
      '<span class="neko-price-detail">输入 ' + p.input + '/M · 输出 ' + p.output + '/M</span>';
    priceBoxEl.classList.toggle('peak', st.peak);
    priceBoxEl.classList.toggle('valley', !st.peak);
    var m = Math.max(0, Math.round((st.next.getTime() - Date.now()) / 60000));
    priceBoxEl.title = 'DeepSeek V4 Pro · 单位：元 / 百万 tokens'
      + '\n峰时（9:00-12:00 / 14:00-18:00）：输入 ¥9 · 输出 ¥27 · 缓存命中 ¥0.30'
      + '\n谷时（其余时间）：输入 ¥4.5 · 输出 ¥13.5 · 缓存命中 ¥0.15'
      + '\n距' + (st.peak ? '转谷' : '转峰') + '还有 ' + Math.floor(m / 60) + ' 时 ' + (m % 60) + ' 分';
  }

  function buildPriceBox(parent) {
    var el = document.createElement('div');
    el.className = 'neko-price valley';
    (parent || document.body).appendChild(el);
    priceBoxEl = el;
    refreshPrice();
  }

  function buildHud() {
    var hud = document.createElement('div');
    hud.className = 'neko-hud';
    document.body.appendChild(hud);
    hudEl = hud;
    buildPriceBox(hud);
    buildBalanceBox(hud);
  }

  function buildBalanceBox(parent) {
    var el = document.createElement('div');
    el.className = 'neko-balance';
    el.innerHTML = '<span class="neko-balance-label">🐋 DeepSeek 余额</span><span class="neko-balance-value">--</span>';
    el.title = '点击刷新 / 设置 Key';
    el.addEventListener('click', function () {
      var k = getBalanceKey();
      if (!k) {
        var input = window.prompt('请输入 DeepSeek API Key（仅保存在本机浏览器）:');
        if (input && input.trim()) setBalanceKey(input.trim());
      } else {
        refreshBalance();
      }
    });
    (parent || document.body).appendChild(el);
    balanceBoxEl = el;
    balanceValueEl = el.querySelector('.neko-balance-value');
  }

  function positionBalance() {
    if (!hudEl) return;
    /* 1) deep diving（轨迹面板）可见时：锚定面板下缘同步浮动 */
    var ledger = document.querySelector('.qBU-ya_ledger');
    if (ledger) {
      var lcs = window.getComputedStyle(ledger);
      var lr = ledger.getBoundingClientRect();
      if (lcs.visibility !== 'hidden' && lcs.display !== 'none' && lr.height > 0 && lr.width > 0) {
        hudEl.style.bottom = Math.max(8, window.innerHeight - lr.bottom + 8) + 'px';
        hudEl.style.right = Math.max(6, window.innerWidth - lr.right + 6) + 'px';
        return;
      }
    }
    /* 1.4) 等待审批面板（bqrRRG_root 接管输入区）可见时：锚定面板上沿，避免 HUD 掉到角落漂移 */
    var appr = document.querySelector('.bqrRRG_root');
    if (!appr) {
      /* 文本兜底：类名是构建哈希，版本升级可能变（精确匹配，避免命中聊天记录里的句子） */
      var apprNodes = document.querySelectorAll('span, div');
      for (var an = 0; an < apprNodes.length && !appr; an++) {
        var anode = apprNodes[an];
        var aown = Array.prototype.filter.call(anode.childNodes, function (n) { return n.nodeType === 3; })
          .map(function (n) { return n.textContent; }).join('');
        if (aown.trim() === '等待审批') {
          var aanc = anode;
          for (var aup = 0; aup < 7 && aanc; aup++) {
            var aacs = window.getComputedStyle(aanc);
            var aar = aanc.getBoundingClientRect();
            if (aacs.display !== 'none' && aacs.visibility !== 'hidden' && aar.width > 280 && aar.height > 60 &&
                aar.top > -60 && aar.bottom < window.innerHeight + 240) {
              appr = aanc;
              break;
            }
            aanc = aanc.parentElement;
          }
        }
      }
    }
    if (appr) {
      var acs = window.getComputedStyle(appr);
      var ar = appr.getBoundingClientRect();
      if (acs.visibility !== 'hidden' && acs.display !== 'none' && ar.height > 0 && ar.width > 0) {
        hudEl.style.bottom = Math.max(16, window.innerHeight - ar.top + 12) + 'px';
        /* 横向保持平时“箭头旁”的位置（lastRightOff），不随审批面板跑到视口右缘 */
        hudEl.style.right = (lastRightOff !== null ? lastRightOff : Math.max(6, window.innerWidth - ar.right + 6)) + 'px';
        return;
      }
    }
    /* 2) 默认：锚定输入区(composerSeat)上沿 —— 等待任务栏出现时自动上移；
          右对齐输入框，并避让 DSH 原生“回到底部”按钮（偏移量缓存，按钮显隐不引起跳动） */
    var sel = ['.uV2eYG_card', '.uV2eYG_root', '.wSkVaW_composerSeat'];
    var el = null;
    for (var i = 0; i < sel.length; i++) {
      var cand = document.querySelector(sel[i]);
      if (cand) {
        var cs = window.getComputedStyle(cand);
        var rect = cand.getBoundingClientRect();
        if (cs.visibility !== 'hidden' && cs.display !== 'none' && rect.height > 0) {
          el = cand;
          break;
        }
      }
    }
    if (el) {
      var rect2 = el.getBoundingClientRect();
      var anchorTop = rect2.top;
      var seat = document.querySelector('.wSkVaW_composerSeat');
      if (seat) {
        var scs = window.getComputedStyle(seat);
        var sr = seat.getBoundingClientRect();
        if (scs.visibility !== 'hidden' && scs.display !== 'none' && sr.height > 0) anchorTop = sr.top;
      }
      if (hudRightPad === null) {
        var nb = document.querySelector('.Md3f7G_toBottom');
        if (nb) {
          var ncs = window.getComputedStyle(nb);
          var nr = nb.getBoundingClientRect();
          if (ncs.display !== 'none' && ncs.visibility !== 'hidden' && nr.width > 0 && nr.right <= rect2.right) {
            hudRightPad = (rect2.right - nr.left) + 10;
          }
        }
      }
      var newBottom = Math.max(16, window.innerHeight - anchorTop + 12);
      var rightOff = hudRightPad !== null
        ? Math.max(6, window.innerWidth - rect2.right + hudRightPad)
        : Math.max(6, window.innerWidth - rect2.right + 6);
      lastRightOff = rightOff;
      hudEl.style.bottom = newBottom + 'px';
      hudEl.style.right = rightOff + 'px';
    } else {
      hudEl.style.bottom = '56px';
      hudEl.style.right = '14px';
    }
  }

  function refreshBalance() {
    var k = getBalanceKey();
    if (!k) {
      if (balanceValueEl) balanceValueEl.textContent = '点此设置Key';
      return;
    }
    if (balanceValueEl) balanceValueEl.textContent = '查询中...';
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.deepseek.com/user/balance', true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + k);
      xhr.timeout = 15000;
      xhr.onload = function () {
        try {
          var j = JSON.parse(xhr.responseText);
          if (j.balance_infos && j.balance_infos.length) {
            var info = j.balance_infos[0];
            if (balanceValueEl) balanceValueEl.textContent = '¥ ' + (info.total_balance || '0');
          } else if (j.error) {
            if (balanceValueEl) balanceValueEl.textContent = 'Key无效，点此重设';
          } else {
            if (balanceValueEl) balanceValueEl.textContent = '读取失败';
          }
        } catch (e) {
          if (balanceValueEl) balanceValueEl.textContent = '读取失败';
        }
      };
      xhr.onerror = function () {
        if (balanceValueEl) balanceValueEl.textContent = '网络失败';
      };
      xhr.send();
    } catch (e) { /* ignore */ }
  }

  /* ---- 右侧本会话提问导航（1:1 复刻 chat.deepseek.com scroll-nav：悬停展开、移开自动回收） ---- */
  var railWrapEl = null;
  var railPanelEl = null;
  var railTimer = null;
  var lastActiveQ = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getQuestionItems() {
    var qs = Array.prototype.slice.call(document.querySelectorAll('.Md3f7G_flowItem[data-chat-flow-kind="user"]'));
    return qs.slice(0, 120);
  }

  function buildRail() {
    var wrap = document.createElement('div');
    wrap.className = 'neko-rail';
    wrap.innerHTML =
      '<div class="neko-rail-bg"></div>' +
      '<div class="neko-rail-panel">' +
      '  <div class="neko-rail-list"></div>' +
      '</div>';
    document.body.appendChild(wrap);
    railWrapEl = wrap;
    railPanelEl = wrap.querySelector('.neko-rail-panel');
    wrap.title = '会话内容（悬停展开，移开自动收起）';

    wrap.addEventListener('mouseenter', function () {
      clearTimeout(railTimer);
      railTimer = setTimeout(openRail, 120);
    });
    wrap.addEventListener('pointermove', function () {
      /* 兜底：高负载下 mouseenter 偶发丢失，指针活动即安排展开（幂等） */
      if (!railWrapEl || railWrapEl.classList.contains('neko-rail-open')) return;
      clearTimeout(railTimer);
      railTimer = setTimeout(openRail, 120);
    });
    wrap.addEventListener('mouseleave', function (e) {
      if (e.relatedTarget && wrap.contains(e.relatedTarget)) return;
      clearTimeout(railTimer);
      railTimer = setTimeout(closeRail, 400);
    });
    railPanelEl.addEventListener('mouseleave', function (e) {
      if (e.relatedTarget && wrap.contains(e.relatedTarget)) return;
      clearTimeout(railTimer);
      railTimer = setTimeout(closeRail, 400);
    });
  }

  function openRail() {
    if (!railWrapEl) return;
    railWrapEl.classList.add('neko-rail-open');
    refreshQuestionList();
  }

  function closeRail() {
    if (railWrapEl) railWrapEl.classList.remove('neko-rail-open');
  }

  function scrollToMessage(el) {
    var sc = findScrollContainer() || document.querySelector('.wSkVaW_scrollBody');
    if (!sc) {
      if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var sr = sc.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    var top = sc.scrollTop + (er.top - sr.top) - 96;
    sc.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function refreshQuestionList() {
    if (!railPanelEl) return;
    var list = railPanelEl.querySelector('.neko-rail-list');
    if (!list) return;
    list.innerHTML = '';
    var qs = getQuestionItems();
    if (!qs.length) {
      list.innerHTML = '<div class="neko-rail-empty">当前会话还没有提问</div>';
      return;
    }
    for (var i = 0; i < qs.length; i++) {
      (function (q) {
        var bubble = q.querySelector('.gdEzaW_bubble');
        var text = (bubble ? bubble.textContent : q.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        if (!text) text = '（无文字消息）';
        var item = document.createElement('div');
        item.className = 'neko-rail-item';
        item.innerHTML =
          '<span class="neko-rail-item-title">' + escapeHtml(text) + '</span>' +
          '<span class="neko-rail-item-line"></span>';
        item.title = text;
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          scrollToMessage(q);
          closeRail();
        });
        list.appendChild(item);
      })(qs[i]);
    }
    lastActiveQ = null;
    refreshActiveQuestion();
  }

  /* 滚动时把当前视野内的提问高亮 */
  function refreshActiveQuestion() {
    if (!railPanelEl) return;
    var list = railPanelEl.querySelector('.neko-rail-list');
    if (!list || !list.children.length || list.firstChild.classList.contains('neko-rail-empty')) return;
    var sc = findScrollContainer() || document.querySelector('.wSkVaW_scrollBody');
    if (!sc) return;
    var qs = getQuestionItems();
    if (qs.length !== list.children.length) {
      /* 提问数量变化（新消息/加载更早）：重建列表 */
      refreshQuestionList();
      return;
    }
    var sr = sc.getBoundingClientRect();
    var active = null;
    for (var i = 0; i < qs.length; i++) {
      var r = qs[i].getBoundingClientRect();
      if (r.top <= sr.top + 170) active = qs[i]; else break;
    }
    if (!active && qs.length) active = qs[0]; /* 在最顶端：高亮第一条 */
    if (active === lastActiveQ) return;
    lastActiveQ = active;
    var items = list.children;
    for (var j = 0; j < items.length; j++) {
      items[j].classList.toggle('neko-rail-item-active', qs[j] === active);
    }
    if (active) {
      var idx = qs.indexOf(active);
      var actItem = items[idx];
      if (actItem && actItem.scrollIntoView) actItem.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ---- 滚动容器查找（提问导航滚动 / 活跃项计算用） ---- */
  var lastLayoutRefresh = 0;

  function findScrollContainer() {
    var cands = ['.wSkVaW_scrollBody', '.Md3f7G_root', '.Md3f7G_scroll', '.Md3f7G_column'];
    for (var i = 0; i < cands.length; i++) {
      var el = document.querySelector(cands[i]);
      if (el && el.scrollHeight > el.clientHeight + 60) return el;
    }
    return null;
  }

  /* ---- 猫娘宠物（头像 + 蕾丝圆框 + 悬停互动菜单） ---- */
  var PET_HTML = '' +
    '<div class="neko-pet-holder">' +
    '<div class="neko-pet-frame">' +
    '<img class="neko-pet-img" src="/assets/neko-pet-avatar.png" alt="洛丽塔猫娘" draggable="false" />' +
    '</div>' +
    '<div class="neko-pet-menu" role="menu">' +
    '<button type="button" class="neko-menu-btn" data-kind="feed" title="投喂小鱼干"><span>🐟</span><i>投喂</i></button>' +
    '<button type="button" class="neko-menu-btn" data-kind="pat" title="摸摸头"><span>🖐</span><i>摸头</i></button>' +
    '<button type="button" class="neko-menu-btn" data-kind="chin" title="挠下巴"><span>😺</span><i>挠下巴</i></button>' +
    '<button type="button" class="neko-menu-btn" data-kind="tail" title="摸尾巴"><span>🐈</span><i>摸尾巴</i></button>' +
    '<button type="button" class="neko-menu-btn" data-kind="proud" title="夸奖她"><span>⭐</span><i>夸奖</i></button>' +
    '<button type="button" class="neko-menu-btn" data-kind="sleep" title="休息一下"><span>💤</span><i>休息</i></button>' +
    '<button type="button" class="neko-menu-btn neko-locked" data-kind="tea" title="来杯红茶（每工作10分钟会请你喝，连续工作6小时后常驻）"><span>🍵</span><i>喝茶</i></button>' +
    '<button type="button" class="neko-menu-btn neko-locked" data-kind="kiss" title="隐藏成就：投喂+喝茶满 300 次解锁"><span>💋</span><i>亲亲</i></button>' +
    '<button type="button" class="neko-menu-btn neko-locked" data-kind="pout" title="隐藏成就：连点猫娘 10 次解锁"><span>💢</span><i>逗她</i></button>' +
    '<button type="button" class="neko-menu-btn" data-kind="theme" title="切换 日/夜/自动"><span class="neko-theme-icon">☀</span><i>主题</i></button>' +
    '</div>' +
    '</div>';

  function appendLayer(className) {
    var el = document.createElement('div');
    el.className = className;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    return el;
  }

  function build() {
    appendLayer('neko-bg neko-bg-day');
    appendLayer('neko-bg neko-bg-night');

    appendLayer('neko-sun');
    var petals = ['🌸', '🌸', '✿', '❀', '🌸', '🌷', '❁'];
    for (var i = 0; i < 10; i++) {
      var p = document.createElement('span');
      p.className = 'neko-petal';
      p.textContent = petals[i % petals.length];
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.setProperty('--petal-drift', ((Math.random() * 160) - 80).toFixed(0) + 'px');
      p.style.animationDuration = (11 + Math.random() * 12).toFixed(2) + 's';
      p.style.animationDelay = (-Math.random() * 20).toFixed(2) + 's';
      p.style.fontSize = (13 + Math.random() * 11).toFixed(1) + 'px';
      document.body.appendChild(p);
    }

    for (var j = 0; j < 70; j++) {
      var s = document.createElement('span');
      s.className = 'neko-star';
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.top = (Math.random() * 100) + 'vh';
      var sz = (1 + Math.random() * 2.4).toFixed(2);
      s.style.width = sz + 'px';
      s.style.height = sz + 'px';
      s.style.setProperty('--tw', (2 + Math.random() * 4).toFixed(2) + 's');
      s.style.setProperty('--td', (Math.random() * 5).toFixed(2) + 's');
      document.body.appendChild(s);
    }
    appendLayer('neko-moon');
    appendLayer('neko-comet');

    petWrap = document.createElement('div');
    petWrap.className = 'neko-pet-wrap';
    petWrap.innerHTML = '<div class="neko-pet-bubble" role="status"></div>' + PET_HTML + '<div class="neko-mode-chip" aria-hidden="true"></div>';
    document.body.appendChild(petWrap);
    bubbleEl = petWrap.querySelector('.neko-pet-bubble');
    bubbleEl.title = '点这里和猫娘聊天喵~';
    bubbleEl.addEventListener('click', function (e) {
      e.stopPropagation();
      primeAudio();
      openBubbleChat();
    });
    chipEl = petWrap.querySelector('.neko-mode-chip');
    petImg = petWrap.querySelector('.neko-pet-img');
    themeIconEl = petWrap.querySelector('.neko-theme-icon');
    teaBtnEl = petWrap.querySelector('[data-kind="tea"]');
    var menuEl = petWrap.querySelector('.neko-pet-menu');

    /* 拖拽结束后不触发点击互动；点击仍随机互动 */
    petWrap.addEventListener('click', function (e) {
      ensureAudio();
      primeAudio();
      if (suppressClick) { suppressClick = false; return; }
      if (e.target && e.target.closest && e.target.closest('.neko-pet-menu')) return;
      onAvatarClick();
    });
    bindDragging();
    setLocked(petWrap.querySelector('[data-kind="pout"]'), !poutUnlocked);
    setLocked(petWrap.querySelector('[data-kind="kiss"]'), !kissUnlocked);
    setLocked(teaBtnEl, !teaUnlocked);

    menuEl.addEventListener('click', function (e) {
      e.stopPropagation();
      ensureAudio();
      primeAudio();
      var btn = e.target && e.target.closest ? e.target.closest('[data-kind]') : null;
      if (!btn) return;
      var kind = btn.getAttribute('data-kind');
      if (kind === 'theme') { cycle(); } else { react(kind); }
    });
    var menuTimer = null;
    petWrap.addEventListener('mouseenter', function () {
      hovering = true;
      /* 显示互动菜单（在猫娘下方） */
      clearTimeout(menuTimer);
      petWrap.classList.add('neko-menu-open');
      /* 悬停 1 秒展示今日统计（聊天输入中不打断） */
      clearTimeout(hoverStatsTimer);
      hoverStatsTimer = setTimeout(function () {
        if (hovering && !bubbleChatInput) showBubble(statsText());
      }, 1000);
    });
    petWrap.addEventListener('mouseleave', function () {
      hovering = false;
      clearTimeout(hoverStatsTimer);
      /* 菜单延时 650ms 再消失，避免来不及点按钮 */
      clearTimeout(menuTimer);
      menuTimer = setTimeout(function () {
        petWrap.classList.remove('neko-menu-open');
      }, 650);
    });

    var rect = petWrap.getBoundingClientRect();
    var bokehSpots = [
      [-96, -220, 44], [96, -304, 28], [268, -92, 32], [304, 128, 36],
      [-140, 64, 24], [36, -60, 22], [352, -220, 30], [-64, -92, 20]
    ];
    for (var k = 0; k < bokehSpots.length; k++) {
      var b = document.createElement('span');
      b.className = 'neko-bokeh';
      var spot = bokehSpots[k];
      var size = spot[2];
      b.style.left = (rect.left + rect.width / 2 + spot[0]).toFixed(0) + 'px';
      b.style.top = (rect.top + rect.height / 2 + spot[1]).toFixed(0) + 'px';
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.animationDuration = (4.5 + Math.random() * 3).toFixed(2) + 's';
      b.style.animationDelay = (-Math.random() * 6).toFixed(2) + 's';
      document.body.appendChild(b);
    }
  }

  function init() {
    loadFlags();
    loadStats();
    loadMemory();
    build();
    if (sidebarDocked && petWrap) {
      petWrap.classList.add('neko-sidebar');
    }
    applySavedPos();
    apply();
    lastActivityAt = Date.now();
    bindTypingWatcher();
    bindTaskWatcher();
    bindPositionWatcher();
    setInterval(syncSettingsVisibility, 700);
    /* 待机打盹/吃醋检测：每 30 秒 */
    setInterval(idleTick, 30000);
    /* 生日彩蛋 */
    checkBirthday();
    /* 节日彩蛋 */
    checkFestival();
    /* 语音问候：仅刷新页面时一句；若被浏览器拦截，首次点击页面时再试 */
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = function () {
          naturalVoice = null;
        };
      }
    } catch (e) { /* ignore */ }
    setTimeout(greetOnce, 1800);
    document.addEventListener('pointerdown', function () { greetOnce(); }, { once: true });
    /* 天气联动：加载 8 秒后查一次，之后每 30 分钟 */
    setTimeout(checkWeather, 8000);
    setInterval(checkWeather, 30 * 60 * 1000);
    /* 拖拽位置在窗口变化时收进可视区 */
    window.addEventListener('resize', function () {
      if (sidebarDocked) { applySidebarPosition(); return; }
      if (userMoved) clampPet();
      positionBalance();
    });
    /* DeepSeek 余额框：跟随布局 + 每 30 分钟刷新 */
    buildHud();
    positionBalance();
    setTimeout(refreshBalance, 4000);
    setInterval(refreshBalance, 30 * 60 * 1000);
    /* 右侧本会话提问导航（回到最新用 DSH 原生按钮，皮肤只做样式） */
    buildRail();
    document.addEventListener('scroll', function () {
      var now = Date.now();
      if (now - lastLayoutRefresh < 150) return;
      lastLayoutRefresh = now;
      positionBalance();
      refreshActiveQuestion();
    }, true);
    /* 截图模式处理 */
    if (window.__nekoShot) {
      if (window.__nekoShot.menu && petWrap) {
        petWrap.classList.add('neko-menu-open');
      }
      if (window.__nekoShot.hideBalance && hudEl) {
        hudEl.style.display = 'none';
      }
    }
    /* 工作时长统计：每 30 秒结算一次 */
    setInterval(workTick, 30000);

    /* 自动模式按系统时间切换：每 60 秒校准一次 */
    setInterval(function () {
      if (mode === 'auto') apply();
    }, 60000);

    var mo = new MutationObserver(function () {
      if (mode === 'auto') apply();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });

    /* 布局即时响应：任务栏 / 审批面板等出现或消失时立刻重定位 HUD（200ms 节流） */
    var moLayout = new MutationObserver(function () {
      var now = Date.now();
      if (now - lastLayoutRefresh < 200) return;
      lastLayoutRefresh = now;
      positionBalance();
    });
    moLayout.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('storage', function (e) {
      if (e.key === KEY) {
        mode = readMode();
        apply();
      }
    });

    setTimeout(function () { showBubble(modeText(mode)); }, 1400);

    setInterval(function () {
      if (hovering || settingsOpen || document.visibilityState !== 'visible') return;
      if (Date.now() < reactUntil) return;
      if (Math.random() < 0.55) {
        showBubble(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]);
      }
    }, 55000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* 调试接口：控制台可用 __nekoDebug.greetOnce() / speakLine('文本','greet') / voices() 测试语音 */
  window.__nekoDebug = {
    greetOnce: greetOnce,
    speakLine: speakLine,
    primeAudio: primeAudio,
    getGAudio: getGAudio,
    festivalMd: festivalMd,
    lunar: LUNAR,
    voices: function () {
      try {
        var vs = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
        return vs.map(function (v) { return v.lang + ' | ' + v.name; });
      } catch (e) {
        return ['speechSynthesis 不可用'];
      }
    }
  };
})();
