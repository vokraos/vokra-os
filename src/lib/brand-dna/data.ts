import type { VokraBrandConstitution } from "./types";

/** Единый источник правды Brand DNA для UI и будущих API/редактора. */
export const BRAND_DNA: VokraBrandConstitution = {
  version: "1.0.0",
  revisionNote: "Конституция для инъекции во все промпты и модули VOKRA OS",

  core: {
    whatIs:
      "VOKRA — кинематографичная AI-native fashion-система вокруг dark premium streetwear: тихая сила, контролируемая эмоция и доминирование на маркетплейсах без крика и без визуального шума.",
    mission:
      "Проектировать одежду и коммуникации так, чтобы каждый SKU и каждый кадр усиливали узнаваемость, доверие и маржу — от концепта до карточки WB/Ozon.",
    philosophy:
      "Сигнал важнее шума. Форма держит характер. Технология (DTF, AI, data) служит бренду, а не заменяет его.",
    enemy:
      "Generic AI fashion, marketplace visual noise, дешёвый хайп, безликие принты и компромисс ясности ради «красивой картинки».",
    promise:
      "Premium ощущение в эмоции и силуэте + практичная ясность карточки: размер, материал, уход, принт, цена — без потери характера бренда.",
    mantra: "Тишина. Форма. Контроль.",
  },

  product: {
    intro:
      "Продуктовая ДНК VOKRA масштабируется по категориям: футболка — первый операционный слой запуска, не потолок бренда.",
    currentEngine:
      "Сейчас ядро производства — DTF-print: быстрый запуск, repeatability, контроль цвета и деталей графики на базовых моделях.",
    currentLaunchBase:
      "Текущий launch base: oversize и standard t-shirts как носители принта и силуэта, проверенные под маркетплейс и POD-масштаб.",
    futureExpansion: [
      "Худи и свитшоты",
      "Лонгсливы",
      "Кепы и аксессуары",
      "Капсульные дропы",
      "Premium basics в рамках той же визуальной конституции",
    ],
    rules: [
      "Не фиксировать VOKRA только на t-shirts: футболка — первый слой, не определение бренда.",
      "Любая новая категория должна пройти проверку силуэта, производственного контура и marketplace clarity.",
      "Расширение линейки не отменяет noir / quiet power / cinematic минимализм.",
    ],
  },

  visual: {
    pillars: [
      "Dark cinematic minimalism",
      "Neo-noir",
      "Контролируемый контраст",
      "Quiet luxury",
      "Premium shadows",
      "Brutalist space — воздух и вес кадра",
      "Монохромная база",
      "Сине-индиго акцент интеллекта (UI и редкие спектральные акценты)",
      "Принт как signal, not decoration — читаемость и смысл, не заливка шумом",
    ],
    forbidden: [
      "Дешёвый neon и «кислотный» cyberpunk",
      "Gaming UI-эстетика в кампаниях",
      "Случайный streetwear-хаос без иерархии",
      "Перегруженные принты без фокала",
      "Детская графика и мемность ради viral",
      "Marketplace visual noise — крик ради клика",
      "Generic AI fashion images без силуэта и материала",
    ],
    accents: [
      "Индиго как спектральный интеллект, не как заливка",
      "Глубина через слои тени, не через радугу",
    ],
  },

  voice: {
    toneBullets: [
      "Точность и ясность формулировок",
      "Спокойная уверенность",
      "Минимум слов — максимум смысла",
      "Интеллект без академизма",
      "Без хайпа и «криков» скидок",
      "Без дешёвых marketplace-фраз в стиле «самая модная»",
    ],
    goodExamples: [
      "Тишина. Форма. Контроль.",
      "Одежда для тех, кто движется без лишнего шума.",
      "Сила не требует объяснений.",
      "Принт — сигнал. Карточка — ясность. Бренд — характер.",
    ],
    badExamples: [
      "Супер модная футболка!",
      "Тренд сезона!",
      "Самая стильная вещь для всех!",
      "Только сегодня -90%!!!",
    ],
  },

  customer: {
    audienceBullets: [
      "Возраст 16–35, urban-контекст",
      "Ищет идентичность и принадлежность к «своей» эстетике",
      "Хочет силу без крика — quiet power",
      "Тянет к cinematic aesthetics",
      "Покупает эмоцию + силуэт + чувство племени",
      "На маркетплейсе всё равно нужны ясность, доверие, размер, материал, цена",
    ],
    tension:
      "Бренд обязан быть premium эмоционально, но карточка WB/Ozon — мгновенно понятной в mobile feed: без этой дуальности система ломается.",
  },

  marketplace: {
    rules: [
      "Эстетика не должна снижать conversion: главный кадр читается в ленте.",
      "Читаемость принта на превью — обязательный критерий.",
      "Силуэт и объём ткани должны считываться с миниатюры.",
      "SEO остаётся практичным: поиск, категория, атрибуты, без «пустого поэта».",
      "Rich content объясняет материал, fit, качество print, уход, размерную сетку.",
      "Эмоциональный story — второй слой, не замена продающей ясности.",
    ],
  },

  production: {
    constraints: [
      "DTF-first: реальность печати важнее фантазии о невозможном декоре.",
      "Быстрый launch и print-on-demand / SKU scale на маркетплейсах.",
      "Вышивка — только по явному запросу и оценке срока/маржи.",
      "Сложный крой — только по явному запросу и дорожной карте производства.",
      "Каждая идея оценивается по сложности, марже, скорости и масштабируемости.",
    ],
    scoringDimensions: [
      "Скорость запуска",
      "DTF suitability",
      "Margin potential",
      "SKU scalability",
      "Визуальная дифференциация",
      "Риск возвратов",
      "Production pressure",
    ],
  },

  genome: [
    { id: "noir", label: "Noir Density", value: 88, hint: "Глубина тени и сдержанность света" },
    { id: "quiet", label: "Quiet Power", value: 86, hint: "Сила без крика" },
    { id: "cine", label: "Cinematic Tension", value: 84, hint: "Кадр как сцена" },
    { id: "min", label: "Premium Minimalism", value: 90, hint: "Меньше элементов — больше веса" },
    { id: "clar", label: "Marketplace Clarity", value: 78, hint: "Читаемость в feed" },
    { id: "dtf", label: "DTF Suitability", value: 92, hint: "Соответствие реальному контуру печати" },
    { id: "emo", label: "Emotional Pull", value: 81, hint: "Эмоция без истерики" },
    { id: "sil", label: "Visual Silence", value: 83, hint: "Воздух и пауза в кадре" },
    { id: "bal", label: "Masculine/Feminine Balance", value: 72, hint: "Унисекс-каркас без стереотипов" },
    { id: "scale", label: "Scalability", value: 80, hint: "Повторяемость SKU и кампаний" },
  ],

  laws: [
    { id: "1", text: "VOKRA never screams — ни визуал, ни копирайт." },
    { id: "2", text: "Принт — signal, not decoration: если графика не несёт смысл и фокус, она отбрасывается." },
    { id: "3", text: "Marketplace clarity — не опция: размер, материал, уход и честный кадр обязательны." },
    { id: "4", text: "Premium feeling обязан пережить mobile thumbnail." },
    { id: "5", text: "DTF reality beats fantasy: идея вторична относительно контура производства." },
    { id: "6", text: "У каждого продукта должен быть reason to exist — иначе это шум линейки." },
    { id: "7", text: "Если визуал красив, но unclear — кадр провален." },
    { id: "8", text: "Если идею нельзя масштабировать — это не приоритет." },
    { id: "9", text: "Расширение за пределы t-shirts разрешено только с сохранением ДНК." },
    { id: "10", text: "AI обязан защищать бренд от generic fashion noise." },
  ],

  aiGovernance: [
    { id: "g1", text: "Каждая генерация проверяется на соответствие Brand DNA до финализации." },
    { id: "g2", text: "Если выход нарушает ДНК — система предупреждает пользователя и указывает нарушенный закон." },
    { id: "g3", text: "Если идея off-brand — предлагается скорректированная версия в рамках законов." },
    { id: "g4", text: "Конфликт с DTF-first — флаг и альтернатива в допустимом контуре." },
    { id: "g5", text: "Слабая marketplace clarity — флаг до уточнения карточки и кадра." },
    { id: "g6", text: "Слишком generic визуал — флаг: усилить noir / силуэт / смысл принта." },
  ],

  fitChecker: {
    brandFit: 87,
    marketplaceFit: 79,
    productionFit: 91,
    premiumSignal: 85,
    riskFlags: [
      { label: "Перегруз деталями в принте", level: "med" },
      { label: "Снижение читаемости в 9:16 crop", level: "low" },
      { label: "Риск off-brand формулировки в SEO", level: "low" },
    ],
  },

  systemFlow: {
    title: "Как Brand DNA управляет системой",
    steps: [
      "Brand DNA",
      "Фильтрация трендов",
      "Продуктовая концепция",
      "Визуальное направление",
      "Тон SEO",
      "Язык campaign",
      "Производственная feasibility",
      "Запуск на маркетплейсе",
      "Обратная связь памяти",
    ],
  },

  designTokens: {
    colors: [
      { name: "Void Black", hex: "#0A0A0B", usage: "Холст UI и кампаний" },
      { name: "Graphite Mist", hex: "#1A1B1F", usage: "Панели, глубина" },
      { name: "Platinum Line", hex: "#C8C9D1", usage: "Линии, микроконтраст" },
      { name: "Signal White", hex: "#F4F2EC", usage: "Типографика, акценты" },
      { name: "Ion Blue", hex: "#6B8CFF", usage: "Спектральный интеллект, интерактив" },
    ],
    typography: [
      { role: "Display / wordmark", font: "Syne", note: "Только hero; плотный трекинг" },
      { role: "UI & body", font: "DM Sans", note: "9–40 pt, спокойный ритм строк" },
    ],
  },
};

export function getBrandConstitution(): VokraBrandConstitution {
  return BRAND_DNA;
}
