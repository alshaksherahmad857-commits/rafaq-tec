/* ==========================================================
   Rafaq Tec — floating robot assistant (scripted, no API)
   Answers common questions in English and Arabic and points
   serious visitors to the contact form.
   ========================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const isAr = () => root.lang === "ar";

  /* ---------------- Knowledge ----------------
     Each topic: keywords (EN + AR), answer per language,
     optional follow-up chips and a service to pre-select in the form. */
  const TOPICS = [
    {
      id: "services",
      keys: ["service", "services", "offer", "do you do", "what do you", "help with", "خدمات", "خدمة", "تقدمون", "تعملون", "مجالات"],
      en: "Here's what we build:<br>• <b>Websites and web apps</b>, full stack<br>• <b>Mobile apps</b> for iOS and Android<br>• <b>AI</b>: chatbots, AI agents, machine learning, or an AI engineer for your team<br>• <b>Data science</b>: analysis, dashboards, forecasting<br>• <b>UI/UX design</b>, or a design review and consultation<br>Which one are you thinking about?",
      ar: "هذا ما نبنيه:<br>• <b>مواقع وتطبيقات ويب</b> متكاملة<br>• <b>تطبيقات موبايل</b> لـ iOS و Android<br>• <b>ذكاء اصطناعي</b>: شات بوت، وكلاء ذكاء اصطناعي، تعلم آلي، أو مهندس AI ينضم لفريقك<br>• <b>علم البيانات</b>: تحليل، لوحات بيانات، توقعات<br>• <b>تصميم UI/UX</b> أو مراجعة واستشارة للتصميم<br>أيّها يهمك؟",
      chips: ["web", "mobile", "ai", "data", "design"]
    },
    {
      id: "web",
      svc: "web",
      keys: ["website", "web site", "web app", "webapp", "landing", "ecommerce", "e-commerce", "online store", "shop", "wordpress", "next", "react", "dashboard", "موقع", "مواقع", "متجر", "ويب", "لوحة تحكم"],
      en: "We build business websites, online stores, dashboards and full web apps, front end and back end. Everything is fast on phones and set up for Google from day one, and you can edit the content yourself. Do you have a site already, or are we starting fresh?",
      ar: "نبني مواقع الشركات والمتاجر الإلكترونية ولوحات التحكم وتطبيقات الويب الكاملة، الواجهة والخلفية. كل موقع سريع على الجوال ومهيأ لجوجل من اليوم الأول، وتقدر تعدّل المحتوى بنفسك. عندك موقع حالياً ولا نبدأ من الصفر؟",
      chips: ["price", "time", "start"]
    },
    {
      id: "mobile",
      svc: "mobile",
      keys: ["mobile", "app", "apps", "ios", "android", "iphone", "flutter", "react native", "play store", "app store", "تطبيق", "تطبيقات", "جوال", "موبايل", "اندرويد", "ايفون"],
      en: "We build iOS and Android apps, usually from one codebase with Flutter or React Native so you pay once for both. We also take care of publishing to the App Store and Google Play. Is this a new idea or an app that already exists?",
      ar: "نبني تطبيقات iOS و Android، وغالباً بكود واحد باستخدام Flutter أو React Native فتدفع مرة واحدة للمنصتين. ونتولى نشر التطبيق على App Store و Google Play. هل هي فكرة جديدة أو تطبيق موجود؟",
      chips: ["price", "time", "start"]
    },
    {
      id: "ai",
      svc: "ai",
      keys: ["ai", "a.i", "artificial", "chatbot", "chat bot", "bot", "agent", "agents", "gpt", "llm", "machine learning", "ml", "model", "automation", "automate", "ذكاء", "اصطناعي", "شات", "بوت", "وكيل", "وكلاء", "تعلم الآلة", "تعلم آلي", "أتمتة"],
      en: "AI is a big part of what we do:<br>• <b>Chatbots</b> trained on your own content, for your site or WhatsApp<br>• <b>AI agents</b> that handle repetitive work, like replying to leads or updating your CRM<br>• <b>Machine learning models</b> for prediction and classification<br>• Or hire Ahmad as an <b>AI engineer</b> on your team<br>What task would you like to take off your plate?",
      ar: "الذكاء الاصطناعي جزء كبير من شغلنا:<br>• <b>شات بوت</b> يتعلم من محتواك، لموقعك أو واتساب<br>• <b>وكلاء AI</b> يقومون بالمهام المتكررة مثل الرد على العملاء أو تحديث الـ CRM<br>• <b>نماذج تعلم آلي</b> للتوقع والتصنيف<br>• أو توظيف أحمد <b>كمهندس AI</b> ضمن فريقك<br>ما المهمة التي تريد التخلص منها؟",
      chips: ["price", "start"]
    },
    {
      id: "data",
      svc: "ai",
      keys: ["data", "analysis", "analytics", "analyze", "dashboard", "power bi", "excel", "report", "forecast", "بيانات", "تحليل", "تقارير", "تقرير", "توقع"],
      en: "We turn messy data into answers: cleaning it, analyzing it, and building dashboards your team will actually open. We can also build forecasting models, for sales or demand for example. What question do you want your data to answer?",
      ar: "نحوّل البيانات المبعثرة إلى إجابات: تنظيفها وتحليلها وبناء لوحات بيانات يستخدمها فريقك فعلاً. ونبني أيضاً نماذج توقع، للمبيعات أو الطلب مثلاً. ما السؤال الذي تريد أن تجيب عنه بياناتك؟",
      chips: ["price", "start"]
    },
    {
      id: "design",
      svc: "uiux",
      keys: ["design", "designer", "ui", "ux", "figma", "prototype", "wireframe", "redesign", "consult", "consultation", "audit", "تصميم", "مصمم", "واجهة", "تجربة المستخدم", "استشارة", "مراجعة"],
      en: "We design interfaces people understand at a glance: research, wireframes, polished UI in Figma and clickable prototypes. If you already have a product, a UX review and consultation is a quick way to find what's costing you users. You can also bring us in as your UI/UX designer.",
      ar: "نصمم واجهات يفهمها المستخدم من أول نظرة: بحث، مخططات، تصميم نهائي على Figma ونماذج تفاعلية. وإذا عندك منتج قائم، فمراجعة واستشارة UX طريقة سريعة لمعرفة ما الذي يضيّع عليك المستخدمين. وتقدر كمان تضمّنا كمصمم UI/UX لفريقك.",
      chips: ["price", "start"]
    },
    {
      id: "price",
      keys: ["price", "pricing", "cost", "costs", "how much", "budget", "quote", "rate", "rates", "expensive", "cheap", "fee", "سعر", "اسعار", "أسعار", "تكلفة", "كم يكلف", "ميزانية", "عرض سعر", "بكم"],
      en: "It depends on what you need, so we don't quote blind. Tell us about the project and we'll send a free estimate with clear options, usually a smaller and a fuller version, so you can pick what fits your budget. There are no hidden costs: anything like hosting or paid tools is listed separately.",
      ar: "يعتمد على احتياجك، لذلك لا نعطي سعراً بدون فهم المشروع. أخبرنا عن فكرتك وسنرسل لك تقديراً مجانياً بخيارات واضحة، عادةً نسخة أبسط ونسخة أشمل، لتختار ما يناسب ميزانيتك. لا توجد تكاليف مخفية: أي استضافة أو أدوات مدفوعة نذكرها بشكل منفصل.",
      chips: ["start", "payment"]
    },
    {
      id: "time",
      keys: ["how long", "time", "timeline", "deadline", "weeks", "fast", "quick", "urgent", "when", "delivery", "مدة", "وقت", "كم يستغرق", "متى", "مستعجل", "تسليم", "أسبوع", "اسابيع"],
      en: "As a rough guide, a business website takes a few weeks, while apps, AI and larger web platforms take longer. You get an exact timeline with milestones in the proposal, and you see progress every week. If you have a hard deadline, tell us early and we'll plan around it.",
      ar: "بشكل تقريبي، موقع الشركة يأخذ بضعة أسابيع، والتطبيقات ومشاريع الذكاء الاصطناعي والمنصات الأكبر تأخذ وقتاً أطول. تحصل على جدول زمني دقيق بمراحل واضحة في العرض، وتشوف التقدم كل أسبوع. وإذا عندك موعد نهائي، أخبرنا مبكراً ونخطط على أساسه.",
      chips: ["process", "start"]
    },
    {
      id: "process",
      keys: ["process", "how do you work", "how it works", "steps", "workflow", "method", "طريقة", "خطوات", "كيف تعملون", "كيف تشتغلون", "مراحل"],
      en: "Here's how it goes:<br>1. <b>A short call</b> to understand your business and goals<br>2. <b>A proposal</b> with scope, timeline and price<br>3. <b>A clear agreement</b> with milestones<br>4. <b>Design</b>, which you approve before we build<br>5. <b>Build</b>, with weekly updates<br>6. <b>Launch and handover</b>, and we stay around after",
      ar: "هكذا نشتغل:<br>1. <b>مكالمة قصيرة</b> لنفهم عملك وأهدافك<br>2. <b>عرض</b> فيه النطاق والمدة والسعر<br>3. <b>اتفاق واضح</b> بمراحل محددة<br>4. <b>التصميم</b> وتوافق عليه قبل البرمجة<br>5. <b>التنفيذ</b> مع تحديث أسبوعي<br>6. <b>الإطلاق والتسليم</b> ونبقى معك بعدها",
      chips: ["price", "start"]
    },
    {
      id: "payment",
      keys: ["payment", "pay", "deposit", "installment", "invoice", "paypal", "bank", "transfer", "دفع", "الدفع", "دفعة", "مقدم", "أقساط", "فاتورة", "تحويل"],
      en: "Payments are split across milestones: a deposit to start, then the rest as parts of the project are delivered and approved. You never pay for everything up front. The exact split and payment methods are written in the agreement.",
      ar: "الدفع مقسّم على مراحل: دفعة مقدمة للبدء، والباقي مع تسليم كل مرحلة وموافقتك عليها. لن تدفع كل المبلغ مقدماً. التقسيم وطرق الدفع مكتوبة بوضوح في الاتفاق.",
      chips: ["start"]
    },
    {
      id: "support",
      keys: ["support", "maintenance", "after launch", "bug", "bugs", "update", "updates", "hosting", "host", "domain", "server", "صيانة", "دعم", "بعد الإطلاق", "استضافة", "دومين", "نطاق", "سيرفر", "تحديثات"],
      en: "After launch there's a support period for fixing any bugs, and after that you can choose a monthly maintenance plan for updates, backups and small changes. We help you set up hosting and your domain, always in your name, so you own everything.",
      ar: "بعد الإطلاق هناك فترة دعم لإصلاح أي أخطاء، وبعدها تقدر تختار خطة صيانة شهرية للتحديثات والنسخ الاحتياطي والتعديلات الصغيرة. ونساعدك في إعداد الاستضافة والدومين، دائماً باسمك، لتكون مالكاً لكل شيء.",
      chips: ["start"]
    },
    {
      id: "own",
      keys: ["own", "ownership", "source code", "code", "copyright", "rights", "nda", "confidential", "privacy", "ملكية", "الكود", "المصدر", "حقوق", "سرية", "اتفاقية عدم إفصاح"],
      en: "Once the project is fully paid, the code and designs are yours. Your idea stays private, and if you'd like an NDA before sharing details, just ask.",
      ar: "بعد اكتمال الدفع، يصبح الكود والتصاميم ملكك. فكرتك تبقى سرية، وإذا تحب نوقّع اتفاقية عدم إفصاح (NDA) قبل مشاركة التفاصيل، فقط اطلب.",
      chips: ["start"]
    },
    {
      id: "seo",
      keys: ["seo", "google", "ranking", "rank", "search engine", "traffic", "visitors", "marketing", "سيو", "جوجل", "محركات البحث", "ترتيب", "زوار", "تسويق"],
      en: "Every site we build is SEO-ready: fast loading, clean structure, proper titles and descriptions, and Google Search Console set up. We won't promise the #1 spot, because nobody honestly can, but you'll start with a strong base.",
      ar: "كل موقع نبنيه مهيأ للسيو: تحميل سريع، هيكلة نظيفة، عناوين وأوصاف صحيحة، وربط Google Search Console. لن نعدك بالمركز الأول لأن لا أحد يستطيع ذلك بصدق، لكنك ستبدأ من أساس قوي.",
      chips: ["web", "start"]
    },
    {
      id: "hire",
      keys: ["hire", "hourly", "freelancer", "dedicated", "join", "team", "part time", "full time", "contract", "توظيف", "بالساعة", "فريلانسر", "مستقل", "ينضم", "فريق", "دوام"],
      en: "Yes, besides full projects you can bring us into your team as a developer, AI engineer or UI/UX designer, hourly or monthly. Tell us what you need and for how long.",
      ar: "نعم، إلى جانب المشاريع الكاملة تقدر تضمّنا لفريقك كمطور أو مهندس AI أو مصمم UI/UX، بالساعة أو بالشهر. أخبرنا ما تحتاجه ولأي مدة.",
      chips: ["start"]
    },
    {
      id: "where",
      keys: ["where", "location", "country", "remote", "arabic", "english", "language", "timezone", "أين", "مكان", "دولة", "عن بعد", "عربي", "انجليزي", "لغة"],
      en: "We work remotely with clients in different countries, in English and Arabic. Calls happen on whatever works for you: Zoom, Google Meet or WhatsApp.",
      ar: "نعمل عن بُعد مع عملاء في دول مختلفة، بالعربية والإنجليزية. والاجتماعات على ما يناسبك: Zoom أو Google Meet أو واتساب.",
      chips: ["start"]
    },
    {
      id: "work",
      keys: ["portfolio", "work", "examples", "previous", "projects", "case study", "أعمال", "اعمال", "نماذج", "مشاريع سابقة", "أمثلة"],
      en: "You can see some of our work in the Work section of this page. Tell us what you're planning, and we'll share examples that are closest to it.",
      ar: "تقدر تشوف بعض أعمالنا في قسم \"أعمالنا\" في هذه الصفحة. أخبرنا عن مشروعك ونرسل لك أمثلة قريبة منه.",
      chips: ["start"],
      go: "#work"
    },
    {
      id: "start",
      keys: ["start", "begin", "contact", "talk", "call", "meeting", "email", "whatsapp", "reach", "human", "person", "ابدأ", "ابدا", "تواصل", "اتصال", "مكالمة", "اجتماع", "ايميل", "واتساب", "شخص", "إنسان"],
      en: "Great, let's talk. Fill in the short form (name, email and a few lines about your idea) and you'll get a reply with next steps. The first call is free and there's no commitment.",
      ar: "ممتاز، خلّينا نتكلم. عبّئ النموذج القصير (الاسم، الإيميل، وسطرين عن فكرتك) وسيصلك رد بالخطوات التالية. المكالمة الأولى مجانية وبدون أي التزام.",
      cta: true
    },
    {
      id: "hello",
      keys: ["hi", "hello", "hey", "salam", "good morning", "good evening", "مرحبا", "اهلا", "أهلا", "السلام", "هلا", "صباح", "مساء"],
      en: "Hi! 👋 What can I help you with?",
      ar: "أهلاً! 👋 كيف أقدر أساعدك؟",
      chips: ["services", "price", "time", "start"]
    },
    {
      id: "thanks",
      keys: ["thanks", "thank you", "thx", "great", "perfect", "ok", "okay", "شكرا", "شكراً", "مشكور", "تمام", "ممتاز"],
      en: "Anytime! If something else comes up, I'm right here.",
      ar: "العفو! إذا احتجت أي شيء ثاني، أنا هنا.",
      chips: ["start"]
    }
  ];

  const CHIP_LABEL = {
    services: { en: "What do you do?", ar: "ماذا تقدمون؟" },
    web: { en: "Website", ar: "موقع إلكتروني" },
    mobile: { en: "Mobile app", ar: "تطبيق موبايل" },
    ai: { en: "AI & chatbots", ar: "ذكاء اصطناعي" },
    data: { en: "Data science", ar: "علم البيانات" },
    design: { en: "UI/UX design", ar: "تصميم UI/UX" },
    price: { en: "How much?", ar: "كم التكلفة؟" },
    time: { en: "How long?", ar: "كم المدة؟" },
    process: { en: "How you work", ar: "طريقة العمل" },
    payment: { en: "Payments", ar: "الدفع" },
    start: { en: "Start a project", ar: "ابدأ مشروعك" }
  };

  const UI = {
    en: {
      name: "Rafaq Assistant",
      status: "Instant answers · a real person follows up",
      teaser: "Hi! Got a question? I can help.",
      welcome: "Hi, I'm the Rafaq assistant. 👋 I can tell you about our services, pricing, timelines and how we work. What's on your mind?",
      placeholder: "Type your question…",
      send: "Send",
      open: "Open chat assistant",
      close: "Close chat",
      cta: "Go to the form",
      fallback: "I'm not sure I got that one. Here are things I can answer, or you can send your question to the team through the form and a person will reply.",
      prefill: "Hi, I have a question: "
    },
    ar: {
      name: "مساعد رفاق",
      status: "إجابات فورية · ويتابع معك شخص حقيقي",
      teaser: "أهلاً! عندك سؤال؟ أقدر أساعدك.",
      welcome: "أهلاً، أنا مساعد رفاق. 👋 أقدر أخبرك عن خدماتنا والأسعار والمدة وطريقة عملنا. بماذا تفكر؟",
      placeholder: "اكتب سؤالك…",
      send: "إرسال",
      open: "افتح المساعد",
      close: "إغلاق المحادثة",
      cta: "انتقل إلى النموذج",
      fallback: "لم أفهم سؤالك تماماً. هذه أشياء أقدر أجاوب عنها، أو أرسل سؤالك للفريق عبر النموذج وسيرد عليك شخص.",
      prefill: "مرحباً، عندي سؤال: "
    }
  };
  const ui = (k) => UI[isAr() ? "ar" : "en"][k];

  /* ---------------- Matching ---------------- */
  const norm = (s) => (" " + s + " ")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")          // Arabic diacritics + tatweel
    .replace(/[إأآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}#.+ ]+/gu, " ")
    .replace(/\s+/g, " ");

  const INDEX = TOPICS.map((t) => ({ t, keys: t.keys.map((k) => norm(k).trim()) }));

  // Question topics (price, timing, payments...) beat service topics, so
  // "how long does an app take?" gets the timeline answer.
  const INTENTS = ["price", "time", "payment", "process", "own", "support", "seo", "hire", "where", "work", "start"];

  function match(text) {
    const q = norm(text);
    const scored = INDEX.map(({ t, keys }) => {
      let score = 0;
      keys.forEach((k) => {
        // Short Latin keys must match whole words; others can match inside words (Arabic prefixes like ال).
        const latinShort = /^[a-z.+ ]{1,3}$/.test(k);
        const hit = latinShort ? q.includes(" " + k + " ") : q.includes(k);
        if (hit) score += k.length > 4 ? 2 : 1;
      });
      // Greetings and thanks only win when nothing more specific matched.
      if ((t.id === "hello" || t.id === "thanks") && score) score = 0.5;
      return { t, score, intent: INTENTS.includes(t.id) };
    }).filter((x) => x.score > 0);
    if (!scored.length) return { topic: null, svc: null };
    const pick = (list) => list.sort((a, b) => b.score - a.score)[0];
    const intent = pick(scored.filter((x) => x.intent));
    const service = pick(scored.filter((x) => !x.intent));
    const topic = intent ? intent.t : service.t;
    return { topic, svc: service && service.t.svc };
  }

  /* ---------------- DOM ---------------- */
  const ROBOT = `
    <svg class="rb-svg" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="rbHead" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#54efe4"/><stop offset=".5" stop-color="#09ddec"/><stop offset="1" stop-color="#016cf0"/>
        </linearGradient>
      </defs>
      <line x1="32" y1="6" x2="32" y2="15" stroke="#54efe4" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="rb-light" cx="32" cy="6" r="3.6" fill="#54efe4"/>
      <rect x="4" y="27" width="6" height="14" rx="3" fill="#015fb3"/>
      <rect x="54" y="27" width="6" height="14" rx="3" fill="#015fb3"/>
      <rect x="9" y="15" width="46" height="38" rx="14" fill="url(#rbHead)"/>
      <rect x="15" y="23" width="34" height="20" rx="10" fill="#010c21"/>
      <g class="rb-eyes"><rect x="22" y="29" width="6" height="8" rx="3" fill="#54efe4"/><rect x="36" y="29" width="6" height="8" rx="3" fill="#54efe4"/></g>
      <path d="M27 47.5q5 3 10 0" stroke="#010c21" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </svg>`;

  const wrap = document.createElement("div");
  wrap.className = "rb";
  wrap.innerHTML = `
    <div class="rb-teaser" hidden><span class="rb-teaser-text"></span><button type="button" class="rb-teaser-x" aria-label="Dismiss">×</button></div>
    <section class="rb-panel" id="rb-panel" role="dialog" aria-modal="false" aria-labelledby="rb-name" hidden>
      <header class="rb-head">
        <span class="rb-avatar">${ROBOT}</span>
        <div class="rb-meta"><b id="rb-name"></b><span class="rb-status"><i></i><span class="rb-status-text"></span></span></div>
        <button type="button" class="rb-close" aria-label="Close">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>
      <div class="rb-log" role="log" aria-live="polite" data-lenis-prevent></div>
      <div class="rb-chips"></div>
      <form class="rb-form" autocomplete="off">
        <input class="rb-input" id="rb-input" type="text" maxlength="300" />
        <button class="rb-send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>
      </form>
    </section>
    <button type="button" class="rb-fab" aria-controls="rb-panel" aria-expanded="false">
      <span class="rb-bot">${ROBOT}</span>
      <span class="rb-ping" aria-hidden="true"></span>
    </button>`;
  document.body.appendChild(wrap);

  const $ = (s) => wrap.querySelector(s);
  const fab = $(".rb-fab"), panel = $(".rb-panel"), log = $(".rb-log"), chipsBox = $(".rb-chips");
  const form = $(".rb-form"), input = $(".rb-input"), teaser = $(".rb-teaser");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let started = false, lastQuestion = "", lastSvc = null;

  function paintChrome() {
    $("#rb-name").textContent = ui("name");
    $(".rb-status-text").textContent = ui("status");
    $(".rb-teaser-text").textContent = ui("teaser");
    input.placeholder = ui("placeholder");
    input.setAttribute("aria-label", ui("placeholder"));
    $(".rb-send").setAttribute("aria-label", ui("send"));
    $(".rb-close").setAttribute("aria-label", ui("close"));
    fab.setAttribute("aria-label", ui("open"));
    wrap.dir = isAr() ? "rtl" : "ltr";
  }

  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addMsg(who, html) {
    const el = document.createElement("div");
    el.className = "rb-msg rb-m-" + who;
    if (who === "user") el.textContent = html; else el.innerHTML = html;
    log.appendChild(el);
    scrollDown();
    return el;
  }

  function setChips(ids) {
    chipsBox.innerHTML = "";
    (ids || []).forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "rb-chip";
      b.textContent = CHIP_LABEL[id][isAr() ? "ar" : "en"];
      b.addEventListener("click", () => ask(b.textContent, TOPICS.find((t) => t.id === id)));
      chipsBox.appendChild(b);
    });
  }

  function ctaButton(L) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "rb-cta";
    b.innerHTML = `${UI[L].cta} <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    b.addEventListener("click", goToForm);
    return b;
  }

  function goToForm() {
    const msg = document.getElementById("f-msg");
    if (msg && !msg.value.trim() && lastQuestion) msg.value = ui("prefill") + lastQuestion;
    if (lastSvc) {
      const box = document.querySelector(`#contact-form input[name="svc"][value="${lastSvc}"]`);
      if (box) box.checked = true;
    }
    toggle(false);
    const target = document.getElementById("contact");
    if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => { const n = document.getElementById("f-name"); if (n) n.focus({ preventScroll: true }); }, reduce ? 0 : 900);
  }

  function reply(topic, ar) {
    const L = ar ? "ar" : "en";
    const typing = addMsg("bot", '<span class="rb-dots"><i></i><i></i><i></i></span>');
    setChips([]);
    const delay = reduce ? 150 : 550 + Math.random() * 450;
    setTimeout(() => {
      if (!topic) {
        typing.innerHTML = UI[L].fallback;
        typing.appendChild(ctaButton(L));
        setChips(["services", "price", "time", "process"]);
      } else {
        typing.innerHTML = topic[L];
        if (topic.svc) lastSvc = topic.svc;
        if (topic.cta) typing.appendChild(ctaButton(L));
        if (topic.go) {
          const t = document.querySelector(topic.go);
          if (t) setTimeout(() => t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }), 400);
        }
        setChips(topic.chips || ["start"]);
      }
      scrollDown();
    }, delay);
  }

  function ask(text, topic) {
    addMsg("user", text);
    let ar = isAr();
    if (!topic) {
      ar = /[\u0600-\u06FF]/.test(text);   // answer in the language the visitor typed
      const m = match(text);
      topic = m.topic;
      // Remember real questions so the contact form can start with them.
      if (!topic || !["start", "hello", "thanks"].includes(topic.id)) lastQuestion = text;
      if (m.svc) lastSvc = m.svc;
    }
    reply(topic, ar);
  }

  function start() {
    if (started) return;
    started = true;
    addMsg("bot", ui("welcome"));
    setChips(["services", "price", "time", "start"]);
  }

  function toggle(open) {
    const willOpen = open ?? panel.hidden;
    panel.hidden = !willOpen;
    wrap.classList.toggle("is-open", willOpen);
    fab.setAttribute("aria-expanded", String(willOpen));
    hideTeaser();
    if (willOpen) {
      start();
      if (matchMedia("(pointer: fine)").matches) setTimeout(() => input.focus(), 50);
    } else {
      fab.focus({ preventScroll: true });
    }
  }

  function hideTeaser() {
    teaser.hidden = true;
    try { sessionStorage.setItem("rb-teased", "1"); } catch (e) {}
  }

  fab.addEventListener("click", () => toggle());
  $(".rb-close").addEventListener("click", () => toggle(false));
  $(".rb-teaser-x").addEventListener("click", hideTeaser);
  teaser.addEventListener("click", (e) => { if (!e.target.closest(".rb-teaser-x")) toggle(true); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) toggle(false); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    ask(text);
  });

  // Follow the site's language switch.
  new MutationObserver(() => {
    paintChrome();
    if (started) {
      log.innerHTML = "";
      started = false;
      if (!panel.hidden) start(); else setChips([]);
    }
  }).observe(root, { attributes: true, attributeFilter: ["lang"] });

  paintChrome();

  // A friendly nudge once per visit, after the visitor has had time to look around.
  let teased = false;
  try { teased = sessionStorage.getItem("rb-teased") === "1"; } catch (e) {}
  if (!teased) {
    setTimeout(() => { if (panel.hidden) teaser.hidden = false; }, 9000);
  }
})();
