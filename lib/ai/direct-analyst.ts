import { GoogleGenAI } from '@google/genai';
import { AuditInputData, AuditReport } from '../audit/types';

export interface AiAuditAnalysis {
  summary: string;
  nicheAssessment: string;
  wastedBudgetRub: number;
  topIssues: Array<{
    title: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    campaignName?: string;
    description: string;
    actionRequired: string;
  }>;
  growthPotential: {
    potentialLeadsIncreasePercent: number;
    recommendedMonthlyBudgetRub: number;
    forecastExplanation: string;
  };
  contractorChecklist: string[];
}

export async function generateAiDirectAudit(
  inputData: AuditInputData,
  mathReport?: AuditReport
): Promise<AiAuditAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Готовим сжатые обезличенные данные по кампаниям
    const campaignsSummary = inputData.campaigns.map((c) => {
      const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0';
      const cpc = c.clicks > 0 ? (c.spendRub / c.clicks).toFixed(1) : '0';
      const cpa = c.conversions > 0 ? (c.spendRub / c.conversions).toFixed(1) : 'нет конверсий';

      return {
        name: c.name,
        type: c.type,
        spendRub: Math.round(c.spendRub),
        clicks: c.clicks,
        impressions: c.impressions,
        ctr: `${ctr}%`,
        cpc: `${cpc} ₽`,
        conversions: c.conversions,
        cpa: `${cpa} ₽`,
        mobileSpend: c.mobileSpendRub,
        desktopSpend: c.desktopSpendRub,
      };
    });

    const prompt = `
Ты — главный эксперт по аудиту контекстной рекламы Яндекс.Директ и арбитражу трафика (Senior Traffic Director 2026).
Твоя задача — провести глубокий анализ рекламного кабинета клиента на основе реальных данных выгрузки и найти скрытые точки слива бюджета.

ДАННЫЕ КАБИНЕТА:
Общий расход: ${inputData.totalSpendRub} руб.
Всего конверсий: ${inputData.totalConversions}
Кампании:
${JSON.stringify(campaignsSummary.slice(0, 30), null, 2)}

Математический экспресс-отчет:
- Предварительно выявленный слив: ${mathReport ? mathReport.totalLossRub : 0} руб.
- Оценка кабинета: ${mathReport ? mathReport.overallScore : 50}/100

ТРЕБОВАНИЯ:
1. Проанализируй названия, типы (Поиск vs РСЯ/Сети), аномалии CTR, неэффективные клики без конверсий, мобильный/десктопный трафик.
2. Сформулируй вердикт для собственника бизнеса (без воды, конкретно, по делу, на русском языке).
3. Верни строгий JSON следующего формата:
{
  "summary": "Краткое и жесткое резюме на 2-3 предложения: сколько тратится впустую и почему.",
  "nicheAssessment": "Оценка структуры кампаний и ниши (1-2 предложения).",
  "wastedBudgetRub": 14880,
  "topIssues": [
    {
      "title": "Название проблемы",
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "campaignName": "Кампания или ВСЕ",
      "description": "Что именно происходит в цифрах и фактах",
      "actionRequired": "Конкретное распоряжение директологу"
    }
  ],
  "growthPotential": {
    "potentialLeadsIncreasePercent": 35,
    "recommendedMonthlyBudgetRub": 15000,
    "forecastExplanation": "Обоснование: перераспределение сливаемого бюджета из РСЯ/мусорных площадок в целевой поиск даст X дополнительных лидов."
  },
  "contractorChecklist": [
    "Пункт 1...",
    "Пункт 2...",
    "Пункт 3..."
  ]
}

Верни ТОЛЬКО валидный JSON без markdown-оберток (\`\`\`json).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    const cleanedJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/gi, '')
      .trim();

    const parsed = JSON.parse(cleanedJson) as AiAuditAnalysis;
    return parsed;
  } catch (err) {
    console.error('Ошибка вызова Gemini Direct Analyst:', err);
    return null;
  }
}
