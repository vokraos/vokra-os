import type {
  PromptLabInput,
  PromptPack,
  PromptStyle,
  ReelsInput,
  ReelsOutput,
  ReelShot,
  RichBlock,
  RichContentInput,
  SeoInput,
  SeoOutput,
} from "../types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const styleHints: Record<PromptStyle, string> = {
  luxury: "haute minimalism, quiet wealth, matte black and pearl highlights",
  minimal: "negative space, single focal plane, restrained palette",
  cyberpunk: "neon rim light, rain haze, volumetric fog, chrome accents",
  streetwear: "gritty concrete, wide lens, flash-fill, raw energy",
  monochrome: "silver-gelatin tonality, deep blacks, lifted shadows",
  futuristic: "anamorphic flares, clinical set design, liquid metal accents",
};

export async function generateSeo(input: SeoInput): Promise<SeoOutput> {
  await delay(900 + Math.random() * 400);
  const base = input.productName.trim() || "VOKRA Oversized Tee";
  const kw = input.keywords.trim() || "оверсайз, футболка, streetwear";
  const cat = input.category.trim() || "Одежда";
  const st = input.style.trim() || "luxury streetwear";

  return {
    seoTitle: `${base} — ${cat} | VOKRA · ${st}`,
    seoDescription: `${base}: премиальный оверсайз, плотный хлопок, DTF-принт. ${kw}. Доставка по РФ. Коллекция VOKRA — архитектурный крой и кинематографичный визуал.`,
    marketplaceText: `【${base}】 ${cat}. Силуэт oversized, мягкая посадка плеч, усиленная горловина. Принт: ${st}. Идеально для слоёв и монохромных образов. Бренд VOKRA — Moscow · crafted for motion.`,
    keywords: [
      ...kw.split(/[,;]+/).map((k) => k.trim()).filter(Boolean),
      "VOKRA",
      "оверсайз футболка",
      "премиум стритвир",
      "DTF принт",
      "унисекс",
    ].slice(0, 12),
    hashtags: ["#VOKRA", "#oversized", "#streetluxury", "#dtfprint", "#fashiontech", "#wb", "#ozon"],
    shortDescription: `${base} — оверсайз, плотный cotton, стойкий DTF. Тема: ${st}.`,
    longDescription: `Модель ${base} в категории «${cat}». Ключевые слова: ${kw}. Крой oversized с акцентом на плечевую линию и драпировку ткани. Принт выполнен в технологии DTF для насыщенности и долговечности. Подходит для city-look, travel и editorial съёмок. Упаковка и тактильный брендинг VOKRA.`,
  };
}

const richBlockTemplates: Omit<RichBlock, "id" | "headline" | "body" | "imagePrompt" | "microCopy">[] = [
  { title: "Главный premium banner", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "Преимущества ткани", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "DTF print technology", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "Oversized fit", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "Premium cotton quality", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "Size guide", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "Care instructions", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "Why VOKRA", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "Lifestyle block", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
  { title: "CTA block", visualIdea: "", composition: "", lighting: "", modelStyling: "", colorGrading: "" },
];

export async function generateRichContent(input: RichContentInput): Promise<RichBlock[]> {
  await delay(1200 + Math.random() * 600);
  const print = input.printName.trim() || "NOCTURNAL SIGNAL";
  const theme = input.theme.trim() || "ночной город";
  const style = input.style.trim() || "luxury streetwear";
  const idea = input.idea.trim() || "контраст света и тени на асфальте";

  const variants: Omit<RichBlock, "id" | "title">[] = [
    {
      headline: `${print} · главный кадр`,
      body: `Тизер капсулы: ${theme}. Визуальный манифест ${style} — принт читается с дистанции, силуэт оверсайз держит архитектуру кадра. Идея сцены: ${idea}.`,
      visualIdea: `Герой 3:4: модель в движении, мимо неоновой линии; графика «${print}» в зоне ключевого света.`,
      imagePrompt: `Cinematic hero banner, VOKRA black oversized tee "${print}", ${theme}, ${style}, motion blur city, anamorphic highlight, ${idea}, 8k fabric detail`,
      microCopy: "New drop · engineered oversized",
      composition: "Low angle, negative space сверху для типографики; принт на пересечении линий третей.",
      lighting: "Strong rim + soft key; контровой для объёма хлопка.",
      modelStyling: "Total black base, длинное пальто на плече, без логотипов сторонних брендов.",
      colorGrading: "Crushed blacks, холодные тени, тёплая кожа, лёгкий halation.",
    },
    {
      headline: "Ткань · тактильный код",
      body: `Плотный carded cotton, матовая поверхность, устойчивость формы после стирок. Подача: крупный план волокна и микроскладки на локте.`,
      visualIdea: "Макро-текстура ткани + капля воды/блик, подчёркивающий качество волокна.",
      imagePrompt: `Macro fabric study, premium heavyweight cotton knit, VOKRA tee texture, ${style}, soft side light, tactile detail, ${theme} mood`,
      microCopy: "Heavyweight cotton · soft hand",
      composition: "Центрированный макро; диагональ складки ведёт взгляд к кадру.",
      lighting: "Низкий raking light для микрорельефа.",
      modelStyling: "N/A — только ткань и рука модели краем кадра.",
      colorGrading: "Нейтральные серые, акцент на чистоте белого в блике.",
    },
    {
      headline: "DTF · чёткость принта",
      body: "Печать DTF: насыщенность, мягкая эластичность, стойкость при изгибе ткани. Блок объясняет технологию без перегруза терминами.",
      visualIdea: "Сплит-кадр: сгиб рукава + 200% crop на линиях принта без трещин.",
      imagePrompt: `DTF print detail on oversized tee, "${print}" graphic crisp edges, bend test on sleeve, ${style}, studio technical still`,
      microCopy: "DTF · vivid · flexible",
      composition: "Диптих в одном кадре: слева макро, справа контекст ношения.",
      lighting: "Ровный диффуз + тонкий контур для читаемости линий.",
      modelStyling: "Рукав согнут, кольца минимум.",
      colorGrading: "Клиническая нейтральность, чуть холодный key.",
    },
    {
      headline: "Oversized · архитектура силуэта",
      body: "Удлинённая линия плеча, запас по ширине, стабильная горловина. Объясняем посадку для WB/Ozon: рост модели и размер на модели.",
      visualIdea: "Силуэт спереди/сбоку в одной сессии — визуальное сравнение линии плеча.",
      imagePrompt: `Full body silhouette, VOKRA oversized tee fit "${print}", side and front implied, ${theme}, ${style}, lookbook lighting`,
      microCopy: "Dropped shoulder · relaxed drape",
      composition: "Полный рост в кадре 4:5; модель по центру, пол чистый.",
      lighting: "Софтбокс 45°, лёгкий контровой для отделения от фона.",
      modelStyling: "Wide leg trousers, массивная обувь для баланса пропорций.",
      colorGrading: "Мягкая контрастность, пленочный roll-off.",
    },
    {
      headline: "Cotton quality · происхождение ощущений",
      body: "Акцент на долговечности и комфорте в движении — город, студия, перелёты. Короткий абзац для премиального PDP.",
      visualIdea: "Модель в тисе на фоне бетона; жест естественный, рука у груди — акцент на ворсе и чистоте полотна.",
      imagePrompt: `Lifestyle premium cotton tee, "${print}", urban concrete, calm pose, ${style}, natural light bounce`,
      microCopy: "Built for motion",
      composition: "Средний план, голова обрезана слегка — фокус на материале.",
      lighting: "Естественный отскок от бетона + серебристый fill.",
      modelStyling: "Минимал, один акцент — часы или кольцо.",
      colorGrading: "Desaturated environment, тёплая кожа.",
    },
    {
      headline: "Size guide · ориентиры",
      body: "Таблица: S–XL с ростом модели и параметрами. Текст подсказывает, как читать оверсайз — «берите свой размер для relaxed fit».",
      visualIdea: "Инфографика линий на полупрозрачной подложке + фото модели в размере M.",
      imagePrompt: `Size guide infographic overlay, ghost mannequin hint, VOKRA oversized tee "${print}", clean UI accents, ${style}`,
      microCopy: "Fit reference on model 182 cm / M",
      composition: "Сетка: 60% фото, 40% линейная схема.",
      lighting: "Ровный high-key для читаемости линий.",
      modelStyling: "Нейтральный образ, не отвлекать от линейки.",
      colorGrading: "Высокий ключ, лёгкая виньетка по краям.",
    },
    {
      headline: "Care · уход",
      body: "Стирка 30°C, без агрессивного отбеливания, сушка в горизонтали для сохранения формы принта. Коротко и по делу.",
      visualIdea: "Натюрморт: вешалка, пар, складка ткани — визуально «бережный уход».",
      imagePrompt: `Still life care instructions mood, steam, wooden hanger, folded black tee "${print}", minimal studio, ${style}`,
      microCopy: "Wash cold · dry flat",
      composition: "Плоская композиция с модульной сеткой предметов.",
      lighting: "Мягкий топ-свет, низкий контраст.",
      modelStyling: "N/A",
      colorGrading: "Тёплые midtones, чистые белые в паре.",
    },
    {
      headline: "Why VOKRA",
      body: `Манифест бренда: системный подход к стритвир-люксу, контроль поставки, единый визуальный язык. Связка с темой «${theme}».`,
      visualIdea: "Коллаж: логотип VOKRA + фрагменты предыдущих дропов в монохроме.",
      imagePrompt: `Brand manifesto collage, VOKRA wordmark, monochrome fragments, "${print}" teaser, ${style}, editorial layout`,
      microCopy: "Designed as a system",
      composition: "Модульный коллаж; якорь — крупный wordmark.",
      lighting: "Разнородные источники, собранные в единую цветовую матрицу в посте.",
      modelStyling: "Элементы образа как вырезки.",
      colorGrading: "Монохром + один акцентный оттенок иона.",
    },
    {
      headline: "Lifestyle · контекст ношения",
      body: `Сцены из «жизни продукта»: вечерний выезд, студия звука, крыша. Идея: ${idea}.`,
      visualIdea: "Широкий кадр города; модель в кадре маленькая — масштаб города против графики на груди.",
      imagePrompt: `Wide environmental lifestyle, VOKRA tee "${print}", ${theme}, ${style}, ${idea}, 35mm documentary aesthetic`,
      microCopy: "City-native uniform",
      composition: "Экстремальный wide + центрирование графики в среднем плане второго кадра (карусель).",
      lighting: "Смешанный искусственный свет улицы + лунный ключ.",
      modelStyling: "Слои: тис + tech outer.",
      colorGrading: "Ночная палитра, неоновые вторичные отражения.",
    },
    {
      headline: "CTA · точка конверсии",
      body: "Финальный блок: ограниченный тираж, официальные каналы, гарантия подлинности. Призыв без крика — уверенный luxury tone.",
      visualIdea: "Крупный план принта + SKU и бейдж «official drop» в стеклянной плашке.",
      imagePrompt: `Premium CTA product shot, "${print}" on chest, glass badge UI, VOKRA official, ${style}, crisp commercial lighting`,
      microCopy: "Secure your size · official channels",
      composition: "Центральный графический блок; чистое поле для кнопки на маркетплейсе.",
      lighting: "Рекламный ключ, ровный, без теней-пятен на принте.",
      modelStyling: "Минимум отвлечений; руки вне кадра.",
      colorGrading: "Коммерческий баланс, лёгкий clarity boost.",
    },
  ];

  const blocks: RichBlock[] = richBlockTemplates.map((t, i) => ({
    id: `block-${i + 1}`,
    title: t.title,
    ...variants[i]!,
  }));

  return blocks;
}

export async function generatePromptLab(input: PromptLabInput): Promise<PromptPack> {
  await delay(800 + Math.random() * 400);
  const print = input.printName.trim() || "VOID RUNNER";
  const theme = input.theme.trim() || "неон и туман";
  const idea = input.idea.trim() || "динамика и блик на логотипе";
  const s = styleHints[input.style];

  const base = `VOKRA oversized black tee, graphic "${print}", ${theme}, ${idea}, ${s}`;

  return {
    fashionPhoto: `${base}, 135mm, f/2, studio cyclorama with wet floor reflection, high-end fashion photographer`,
    midjourney: `/imagine prompt: ${base}, hyperreal, --ar 4:5 --style raw --v 6`,
    flux: `Flux.1 pro: ${base}, photoreal fabric micro-detail, controlled speculars, 8k, editorial`,
    kling: `Kling video seed: slow dolly-in on chest graphic, wind on fabric, ${theme}, anamorphic bokeh`,
    grok: `Grok image: ${base}, crisp vector-like print edges, luxury campaign lighting`,
    lifestyle: `Candid rooftop, golden hour, ${base}, motion blur city, 35mm storytelling`,
    campaign: `Season manifesto visual: ${base}, monochrome tower backdrop, fog machines, heroic low angle`,
  };
}

function reelShots(theme: string): ReelShot[] {
  return [
    { id: "1", beat: "0–2s", shot: `Extreme close-up: texture + ${theme}`, camera: "Macro, handheld micro shake", transition: "Whip to wide" },
    { id: "2", beat: "2–5s", shot: "Model walks into light beam, tee catches rim", camera: "Gimbal low follow", transition: "Speed ramp out" },
    { id: "3", beat: "5–8s", shot: "Graphic reveal — slow 180° orbit", camera: "Orbital dolly", transition: "Match cut on logo" },
    { id: "4", beat: "8–12s", shot: "City cutaways intercut with studio flash pops", camera: "Mixed 24/48fps", transition: "Glitch dissolve" },
    { id: "5", beat: "12–15s", shot: "CTA: VOKRA wordmark + SKU", camera: "Static tripod", transition: "Fade to black" },
  ];
}

export async function generateReels(input: ReelsInput): Promise<ReelsOutput> {
  await delay(900 + Math.random() * 500);
  const print = input.printName.trim() || "ECLIPSE MARK";
  const theme = input.theme.trim() || "ночной мегаполис";
  const st = input.style.trim() || "cinematic luxury";
  return {
    title: `${print} — 15s Launch Reel`,
    hook: `Первый кадр: полная темнота → вспышка открывает принт «${print}».`,
    idea: `Ритм: pulse techno + breath pause на логотипе. Тема: ${theme}. Стиль: ${st}.`,
    script: `VO (whisper): «Не шум. Сигнал.» Cut to silhouette. VO: «VOKRA. Oversized. Engineered.» End on wordmark.`,
    shots: reelShots(theme),
    musicMood: "Dark techno pulse, sub-bass 90 BPM, airy vocal chop at hook",
    campaignConcept: `«Signal in the noise» — ночной город как студия, принт как маяк бренда ${print}.`,
  };
}

export async function generateCampaignBrief(input: RichContentInput): Promise<string> {
  await delay(700);
  const print = input.printName.trim() || "ARC LINE";
  return [
    `Campaign: «${print} / Phase One»`,
    `Objective: WB + Ozon conversion + IG discovery.`,
    `Hero promise: engineered oversized + DTF fidelity.`,
    `Primary assets: 9:16 reels, 1:1 carousel, 3:4 marketplace master.`,
    `Distribution: 14-day burst — tease (3d) → reveal (24h) → proof (social UGC hooks).`,
  ].join("\n");
}
