/* ============================================================
   猫娘昼夜主题 v2 · 模式引擎（neko-theme.js）
   ------------------------------------------------------------
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
  var taskArea = null;
  var lastThinkBubble = 0;
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
    tea: '/assets/neko-pet-tea.png'
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
    ]
  };

  var FLOATERS = {
    pat: ['❤', '✨', '🐾', '🌸', '✨'],
    feed: ['🐟', '🐟', '✨', '🍪', '✨'],
    kiss: ['💕', '❤', '💋', '✨', '💕'],
    proud: ['⭐', '✨', '🎀', '🌟', '✨'],
    pout: ['💢', '⚡', '🙄', '💨', '💢'],
    sleep: ['💤', '🌙', '💤', '✨', '💤'],
    tea: ['🍵', '🫖', '☕', '✨', '🍵']
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

  function effective() {
    if (mode === 'auto') {
      return document.body.hasAttribute('data-ds-dark-theme') ? 'night' : 'day';
    }
    return mode;
  }

  function modeText(m) {
    if (m === 'day') return '欧尼酱，现在是水晶白昼哦 ☀';
    if (m === 'night') return '欧尼酱，月潮夜晚来啦，咱陪你喵 🌙';
    return '欧尼酱，自动模式 ✦ 咱会跟着昼夜切换喵';
  }

  function cycleText(m) {
    if (m === 'day') return '欧尼酱，切到白天啦，阳光暖暖的~';
    if (m === 'night') return '欧尼酱，天黑了~ 有咱陪着，不怕哦 🌙';
    return '欧尼酱，交给咱吧~ 自动跟随昼夜喵';
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
  }

  function showBubble(text) {
    if (!bubbleEl) return;
    /* 气泡常驻：说下一句时才替换上一句 */
    bubbleEl.textContent = text;
    bubbleEl.classList.add('show');
  }

  function showImg(kind) {
    if (!petImg || !IMGS[kind] || shown === kind) return;
    petImg.src = IMGS[kind];
    shown = kind;
  }

  /* 按当前状态回到合适的默认表情（思考 > 认真看 > 常态） */
  function showDefault() {
    if (thinkingActive) {
      showImg('think');
      if (petImg) {
        petImg.classList.remove('watching');
        petImg.classList.add('thinking');
      }
    } else if (watchPending) {
      showImg('watch');
      if (petImg) {
        petImg.classList.remove('thinking');
        petImg.classList.add('watching');
      }
      startWatchRevert();
    } else {
      showImg('normal');
      if (petImg) {
        petImg.classList.remove('watching');
        petImg.classList.remove('thinking');
      }
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
      if (Date.now() >= reactUntil && !thinkingActive) {
        showDefault();
      }
    }, 1600);
  }

  function onUserTyping() {
    watchPending = true;
    /* 互动/思考进行中先不抢镜，结束后自动切到认真表情 */
    if (Date.now() < reactUntil || thinkingActive) return;
    showImg('watch');
    if (petImg) {
      petImg.classList.remove('thinking');
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
      if (Date.now() >= reactUntil) {
        showImg('think');
        if (petImg) {
          petImg.classList.remove('watching');
          petImg.classList.add('thinking');
        }
      }
      if (Date.now() > lastThinkBubble && Math.random() < 0.45) {
        lastThinkBubble = Date.now() + 30000;
        showBubble(THINK_LINES[Math.floor(Math.random() * THINK_LINES.length)]);
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
    react('proud');
    showBubble(COMPLETE_LINES[Math.floor(Math.random() * COMPLETE_LINES.length)]);
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
          refreshThinking();
        });
        observer.observe(area, {
          attributes: true,
          attributeFilter: ['data-streaming', 'data-state'],
          childList: true,
          subtree: true
        });
        setInterval(refreshThinking, 2000);
        return;
      }
      if (++tries > 40) clearInterval(timer);
    }, 1000);
  }

  /* ---- 位置自适应：猫娘底边始终高于对话框上沿 ---- */
  var petBottomBase = 48;
  function positionPet() {
    if (!petWrap) return;
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
      var top = el.getBoundingClientRect().top;
      var newBottom = Math.max(16, window.innerHeight - top + 14);
      petWrap.style.bottom = newBottom + 'px';
    } else {
      petWrap.style.bottom = petBottomBase + 'px';
    }
  }

  function bindPositionWatcher() {
    var tries = 0;
    var timer = setInterval(function () {
      var area = document.querySelector('.wSkVaW_root');
      if (area) {
        clearInterval(timer);
        positionPet();
        window.addEventListener('resize', positionPet);
        var sel = ['.uV2eYG_card', '.uV2eYG_root', '.wSkVaW_composerSeat'];
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(positionPet);
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
                positionPet();
              }
            });
          });
          mo.observe(area, { childList: true, subtree: true });
        }
        setInterval(positionPet, 3000);
        return;
      }
      if (++tries > 40) {
        clearInterval(timer);
        setInterval(positionPet, 3000);
      }
    }, 1000);
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
    chipEl = petWrap.querySelector('.neko-mode-chip');
    petImg = petWrap.querySelector('.neko-pet-img');
    themeIconEl = petWrap.querySelector('.neko-theme-icon');
    teaBtnEl = petWrap.querySelector('[data-kind="tea"]');
    var menuEl = petWrap.querySelector('.neko-pet-menu');

    petWrap.addEventListener('click', onAvatarClick);
    setLocked(petWrap.querySelector('[data-kind="pout"]'), !poutUnlocked);
    setLocked(petWrap.querySelector('[data-kind="kiss"]'), !kissUnlocked);
    setLocked(teaBtnEl, !teaUnlocked);

    menuEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var btn = e.target && e.target.closest ? e.target.closest('[data-kind]') : null;
      if (!btn) return;
      var kind = btn.getAttribute('data-kind');
      if (kind === 'theme') { cycle(); } else { react(kind); }
    });
    petWrap.addEventListener('mouseenter', function () {
      hovering = true;
    });
    petWrap.addEventListener('mouseleave', function () {
      hovering = false;
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
    build();
    apply();
    bindTypingWatcher();
    bindTaskWatcher();
    bindPositionWatcher();
    setInterval(syncSettingsVisibility, 700);
    /* 工作时长统计：每 30 秒结算一次 */
    setInterval(workTick, 30000);

    var mo = new MutationObserver(function () {
      if (mode === 'auto') apply();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });

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
})();
