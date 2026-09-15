import { GoogleGenAI } from '@google/genai';

export interface SearchQueryItem {
  query: string;
  clicks: number;
  impressions: number;
  spendRub: number;
  conversions: number;
}

export interface WasteQueryCluster {
  category: 'INFORMATION_DIY' | 'WRONG_GEO' | 'FREE_CHEAP' | 'COMPETITOR_IRRELEVANT' | 'JOB_STUDY' | 'OTHER_JUNK';
  categoryTitleRu: string;
  queriesCount: number;
  wastedRub: number;
  examples: string[];
  suggestedMinusWords: string[];
}

export interface SearchQueryAiReport {
  totalAnalyzedQueries: number;
  junkQueriesCount: number;
  junkSpendRub: number;
  junkSharePercent: number;
  clusters: WasteQueryCluster[];
  allMinusWords: string[];
  commanderReadyString: string; // Строка через дефис или пробел для быстрой вставки в Яндекс.Директ
  summaryInsight: string;
}

/**
 * AI-анализатор поисковых запросов и автоматический генератор минус-слов на базе Gemini 3.8 Flash
 */
export async function analyzeSearchQueriesAi(
  queries: SearchQueryItem[],
  businessContext?: string
): Promise<SearchQueryAiReport | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !queries || queries.length === 0) {
    return generateFallbackSearchReport(queries);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Берем топ-50 запросов по расходу для компактного и быстрого анализа
    const sortedQueries = [...queries].sort((a, b) => b.spendRub - a.spendRub).slice(0, 50);

    const prompt = `
Ты — ведущий эксперт по семантике и минус-словам в Яндекс.Директ (Senior PPC Semantic Specialist 2026).
Твоя задача — проанализировать реальные поисковые запросы пользователей, найти нецелевой и мусорный трафик, рассчитать слитый бюджет и сгенерировать точный список минус-слов.

КОНТЕКСТ БИЗНЕСА: ${businessContext || 'Коммерческие услуги/товары для малого бизнеса, ориентированные на получение платных заявок'}

ПОИСКОВЫЕ ЗАПРОСЫ ИЗ ВЫГРУЗКИ:
${JSON.stringify(sortedQueries, null, 2)}

ТРЕБОВАНИЯ К АНАЛИЗУ:
1. Кластеризуй нецелевые запросы по категориям:
   - "INFORMATION_DIY" (Информационный мусор: своими руками, фото, чертеж, инструкция, отзывы, форум, вики)
   - "FREE_CHEAP" (Низкобюджетный / неплатежеспособный спрос: бесплатно, даром, скачать, дешево бу)
   - "WRONG_GEO" (Нецелевые города/страны, если не относятся к основной географии)
   - "COMPETITOR_IRRELEVANT" (Чужие бренды/артикулы, по которым нет конверсий)
   - "JOB_STUDY" (Вакансии, работа, обучение, курсы)
   - "OTHER_JUNK" (Прочий нерелевантный мусор)
2. Рассчитай слитый бюджет по каждому кластеру.
3. Сформируй чистый список минус-слов (без повторов, в начальной форме / лемматизированные).
4. Подготовь готовую строку для вставки в Яндекс.Директ (например: "бесплатно своими руками фото чертеж скачать вакансии").

ВЕРНИ СТРОГИЙ JSON следующего формата:
{
  "totalAnalyzedQueries": ${queries.length},
  "junkQueriesCount": 14,
  "junkSpendRub": 4200,
  "junkSharePercent": 28,
  "summaryInsight": "Краткое заключение на 1-2 предложения о качестве семантики.",
  "clusters": [
    {
      "category": "INFORMATION_DIY",
      "categoryTitleRu": "Информационные запросы и DIY",
      "queriesCount": 8,
      "wastedRub": 2400,
      "examples": ["кухня своими руками чертежи", "дизайн шкафа фото"],
      "suggestedMinusWords": ["своими руками", "фото", "чертежи", "инструкция"]
    }
  ],
  "allMinusWords": ["своими руками", "фото", "чертежи", "бесплатно", "скачать"],
  "commanderReadyString": "своими руками фото чертежи бесплатно скачать"
}

Верни ТОЛЬКО валидный JSON без markdown-оберток (\`\`\`json).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });


    const responseText = response.text || '';
    const cleanedJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/gi, '')
      .trim();

    const parsed = JSON.parse(cleanedJson) as SearchQueryAiReport;
    return parsed;
  } catch (err) {
    console.error('Ошибка в analyzeSearchQueriesAi:', err);
    return generateFallbackSearchReport(queries);
  }
}

/**
 * Локальный эвристический алгоритм на случай отсутствия API-ключа
 */
function generateFallbackSearchReport(queries: SearchQueryItem[]): SearchQueryAiReport {
  const junkPatterns = [
    { word: 'своими руками', cat: 'INFORMATION_DIY', title: 'Информационные запросы и DIY' },
    { word: 'фото', cat: 'INFORMATION_DIY', title: 'Информационные запросы и DIY' },
    { word: 'чертеж', cat: 'INFORMATION_DIY', title: 'Информационные запросы и DIY' },
    { word: 'видео', cat: 'INFORMATION_DIY', title: 'Информационные запросы и DIY' },
    { word: 'бесплатно', cat: 'FREE_CHEAP', title: 'Поиск халявы и бесплатно' },
    { word: 'даром', cat: 'FREE_CHEAP', title: 'Поиск халявы и бесплатно' },
    { word: 'скачать', cat: 'FREE_CHEAP', title: 'Скачивание и файлы' },
    { word: 'бу', cat: 'FREE_CHEAP', title: 'Поиск вторичного рынка' },
    { word: 'работа', cat: 'JOB_STUDY', title: 'Поиск работы и вакансии' },
    { word: 'вакансии', cat: 'JOB_STUDY', title: 'Поиск работы и вакансии' },
  ];

  let junkSpend = 0;
  let junkCount = 0;
  const foundMinusWords = new Set<string>();
  const clusterExamples: Record<string, string[]> = {};
  const clusterSpend: Record<string, number> = {};

  for (const q of queries) {
    const lower = q.query.toLowerCase();
    for (const pattern of junkPatterns) {
      if (lower.includes(pattern.word)) {
        junkSpend += q.spendRub;
        junkCount++;
        foundMinusWords.add(pattern.word);
        if (!clusterExamples[pattern.cat]) clusterExamples[pattern.cat] = [];
        clusterExamples[pattern.cat].push(q.query);
        clusterSpend[pattern.cat] = (clusterSpend[pattern.cat] || 0) + q.spendRub;
        break;
      }
    }
  }

  const minusList = Array.from(foundMinusWords);
  const totalSpend = queries.reduce((acc, q) => acc + q.spendRub, 0);

  const clusters: WasteQueryCluster[] = Object.keys(clusterExamples).map((catKey) => {
    const item = junkPatterns.find((p) => p.cat === catKey);
    return {
      category: catKey as WasteQueryCluster['category'],
      categoryTitleRu: item?.title || 'Нецелевые запросы',
      queriesCount: clusterExamples[catKey].length,
      wastedRub: Math.round(clusterSpend[catKey] || 0),
      examples: clusterExamples[catKey].slice(0, 4),
      suggestedMinusWords: minusList.slice(0, 5),
    };
  });

  return {
    totalAnalyzedQueries: queries.length,
    junkQueriesCount: junkCount,
    junkSpendRub: Math.round(junkSpend),
    junkSharePercent: totalSpend > 0 ? Math.round((junkSpend / totalSpend) * 100) : 0,
    clusters,
    allMinusWords: minusList,
    commanderReadyString: minusList.join(' '),
    summaryInsight:
      junkCount > 0
        ? `Выявлено ${junkCount} нецелевых запросов со сливом ${Math.round(junkSpend).toLocaleString('ru-RU')} ₽. Рекомендуется немедленная минусация.`
        : 'Критических нецелевых фраз в выборке не обнаружено.',
  };
}
