import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysis, CivicIssueCategory, Department, SeverityLevel } from '../types/index.js';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

/**
 * Sanitizes untrusted text strings to prevent HTML or script injection
 */
function sanitizeOutput(text: string): string {
  if (!text) return '';
  return text.replace(/[<>]/g, '').trim();
}

/**
 * Helper to parse image URL or base64 data into Gemini inlineData part
 */
function parseImagePart(imageUrl?: string): { inlineData: { mimeType: string; data: string } } | null {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  // Handle data URL format: data:[<mediatype>];base64,<data>
  const match = imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    const mimeType = match[1];
    const data = match[2];
    // Enforce max 4MB base64 payload to prevent memory issues
    if (data.length <= 4 * 1024 * 1024) {
      return { inlineData: { mimeType, data } };
    }
  }
  return null;
}

/**
 * Deterministic rule-based civic analysis fallback used when GEMINI_API_KEY is not configured
 * or if API quota/rate-limits occur. Explicitly labelled as 'rule-engine-fallback'.
 */
export function generateRuleBasedAnalysis(
  title: string,
  description: string,
  category: CivicIssueCategory,
  location: string
): AIAnalysis {
  const text = `${title} ${description}`.toLowerCase();

  let severity: SeverityLevel = 'Medium';
  let urgency: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  let safetyImpact = 18;
  let infrastructureDamage = 15;
  let affectedPopulationRisk = 16;
  const ageFactor = 8;
  const safetyRisks: string[] = [];
  const missingInfo: string[] = [];

  // Explicit cosmetic / minor / aesthetic signals
  const isCosmeticOrMinor =
    category === 'Other' ||
    /\b(cosmetic|paint scuff|graffiti|tag|litter|minor|small|no damage|no physical damage|no hazard|no safety hazard)\b/.test(text);

  // Safety keyword analysis (excluding negated cosmetic phrases)
  const hasLifeSafety =
    !isCosmeticOrMinor &&
    /\b(pedestrian|school|child|hospital|swerving|accident|electrocution|gas leak|fire|collapse|geyser|sinkhole|toxic|biohazard|raw sewage)\b/.test(text);
  const hasStructural =
    !isCosmeticOrMinor &&
    /\b(deep|burst|rupture|structural crack|flooding|blackout|debris|unusable road|blocked lane|overflow)\b/.test(text);
  const isSchoolZone =
    !isCosmeticOrMinor &&
    /\b(school|kindergarten|playground|crosswalk|daycare|nursery)\b/.test(text);

  if (hasLifeSafety && hasStructural) {
    severity = 'Critical';
    urgency = 'Critical';
    safetyImpact = 33;
    infrastructureDamage = 23;
    affectedPopulationRisk = 24;
    safetyRisks.push('Active danger to pedestrians and vehicular traffic in immediate vicinity');
    safetyRisks.push('High likelihood of acute property damage or physical injury if left unaddressed');
  } else if (hasLifeSafety || isSchoolZone) {
    severity = 'High';
    urgency = 'High';
    safetyImpact = 28;
    infrastructureDamage = 18;
    affectedPopulationRisk = 22;
    safetyRisks.push('Elevated risk to public safety due to high human foot-traffic / vulnerable population zone');
  } else if (isCosmeticOrMinor) {
    severity = 'Low';
    urgency = 'Low';
    safetyImpact = 6;
    infrastructureDamage = 10;
    affectedPopulationRisk = 12;
    safetyRisks.push('No acute physical safety hazards identified; aesthetic or minor service impact');
  } else {
    safetyImpact = 18;
    infrastructureDamage = 16;
    affectedPopulationRisk = 16;
    safetyRisks.push('Potential inconvenience or secondary deterioration if neglected');
  }

  const priorityScore = Math.min(100, Math.max(10, safetyImpact + infrastructureDamage + affectedPopulationRisk + ageFactor));

  // Determine Department
  let recommendedDepartment: Department = 'Roads & Infrastructure';
  let recommendedActions: [string, string, string] = [
    'Inspect site and deploy safety cones or barricades',
    'Assess sub-surface structural condition',
    'Schedule permanent remediation crew within standard SLA window',
  ];
  let estimatedTimeframe = 'Estimated 24 to 48 hours';

  if (category === 'Garbage / Waste' || text.includes('garbage') || text.includes('trash') || text.includes('waste')) {
    recommendedDepartment = 'Waste Management';
    recommendedActions = [
      'Dispatch municipal collection team with hydraulic compacting truck',
      'Sanitize and pressure-wash collection area to deter pests',
      'Evaluate placement of additional heavy-duty secure bins',
    ];
    estimatedTimeframe = severity === 'High' ? 'Estimated 6 to 12 hours' : 'Estimated 24 hours';
  } else if (category === 'Water Leakage' || text.includes('water') || text.includes('pipe') || text.includes('leak')) {
    recommendedDepartment = 'Water Supply & Sanitation';
    recommendedActions = [
      'Dispatch emergency utility crew to isolate shutoff gate valve',
      'Excavate roadbed safely with vacuum hydro-excavation',
      'Replace damaged pipe segment and backfill with compacted aggregate',
    ];
    estimatedTimeframe = severity === 'Critical' ? 'Immediate response within 1 to 2 hours' : 'Estimated 12 to 24 hours';
  } else if (category === 'Broken Streetlight' || text.includes('light') || text.includes('lamp') || text.includes('dark')) {
    recommendedDepartment = 'Electrical & Lighting';
    recommendedActions = [
      'Check photo-sensor and junction pole circuit breaker',
      'Replace failed fixture with high-efficiency luminaire',
      'Verify night-time foot-candle illumination on crosswalk',
    ];
    estimatedTimeframe = 'Estimated 12 to 24 hours';
  } else if (category === 'Drainage / Flooding' || text.includes('drain') || text.includes('flood') || text.includes('ponding') || text.includes('sewage')) {
    recommendedDepartment = 'Drainage & Flood Control';
    recommendedActions = [
      'Dispatch Vactor vacuum truck to clear sump obstruction',
      'Clear perimeter street gutters of silt and organic debris',
      'Inspect downstream storm culvert for blockages',
    ];
    estimatedTimeframe = severity === 'Critical' ? 'Estimated 2 to 4 hours' : 'Estimated 24 hours';
  } else if (category === 'Other') {
    recommendedDepartment = 'Public Safety & Enforcement';
    recommendedActions = [
      'Log complaint in municipal registry for field verification',
      'Contact site owner or relevant municipal authority',
      'Document resolution upon physical inspection',
    ];
    estimatedTimeframe = 'Estimated 3 to 5 business days';
  }

  if (!location || location.length < 5) {
    missingInfo.push('Precise building number or cross-street coordinate');
  }

  return {
    summary: `Rule-Engine evaluated issue regarding ${category.toLowerCase()} at ${location}. Assessed priority score of ${priorityScore}/100 based on safety impact and severity indicators.`,
    predictedCategory: category,
    severity,
    safetyRisks,
    urgency,
    urgencyReasons: `Identified risk factors: safety impact (${safetyImpact}/35) and infrastructure damage potential (${infrastructureDamage}/25).`,
    priorityScore,
    scoreFactors: {
      safetyImpact,
      infrastructureDamage,
      affectedPopulationRisk,
      ageFactor,
      rationale: `Computed transparently from safety parameters (safety: ${safetyImpact}/35, damage: ${infrastructureDamage}/25, population risk: ${affectedPopulationRisk}/25, recency: ${ageFactor}/15).`,
    },
    recommendedDepartment,
    recommendedActions,
    estimatedResponseTimeframe: estimatedTimeframe,
    confidenceScore: 0.82,
    missingInformation: missingInfo,
    source: 'rule-engine-fallback',
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Executes a Gemini 3.8 Flash model structured JSON analysis on a civic complaint.
 * Includes multimodal image support and retry resilience for temporary server spikes.
 */
export async function analyzeCivicIssue(
  title: string,
  description: string,
  category: CivicIssueCategory,
  location: string,
  imageUrl?: string
): Promise<{ analysis: AIAnalysis; isRealAI: boolean; errorNotice?: string }> {
  const ai = getGenAI();

  if (!ai) {
    return {
      analysis: generateRuleBasedAnalysis(title, description, category, location),
      isRealAI: false,
      errorNotice: 'GEMINI_API_KEY is not configured in environment. Seamlessly running deterministic civic rule engine.',
    };
  }

  const promptText = `You are the lead AI Triage Engineer for CivicLens AI, an enterprise civic complaint intelligence platform.
Analyze the following citizen report with strict realism and objectivity:

Title: "${title}"
Reported Category: "${category}"
Location: "${location}"
Description: "${description}"

CRITICAL RULES:
1. Do NOT invent inspections, verified injuries, official casualty counts, or unverified claims.
2. If details are missing (e.g. pipe diameter, specific cross street, exact hole depth), explicitly list them in missingInformation.
3. Priority Score must be a transparent integer between 0 and 100 calculated as the sum of:
   - safetyImpact (0 to 35): direct threat of injury, school zone, collision risk, live electrical, toxic fumes.
   - infrastructureDamage (0 to 25): structural erosion, roadbed collapse, continuous main bursting.
   - affectedPopulationRisk (0 to 25): arterial transit route vs quiet alley, pedestrian volume.
   - ageFactor (0 to 15): immediate dispatch urgency.
4. recommendedActions must contain exactly 3 concrete, realistic operational tasks for the municipal department.
5. estimatedResponseTimeframe must be phrased explicitly as an estimate (e.g., "Estimated 2 to 4 hours for emergency dispatch").
6. Categorize into one of: 'Pothole / Damaged Road', 'Garbage / Waste', 'Water Leakage', 'Broken Streetlight', 'Drainage / Flooding', 'Other'.
7. Department must be one of: 'Roads & Infrastructure', 'Waste Management', 'Water Supply & Sanitation', 'Electrical & Lighting', 'Drainage & Flood Control', 'Public Safety & Enforcement'.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: 'Concise executive summary of the civic complaint (1-2 sentences)',
      },
      predictedCategory: {
        type: Type.STRING,
        enum: [
          'Pothole / Damaged Road',
          'Garbage / Waste',
          'Water Leakage',
          'Broken Streetlight',
          'Drainage / Flooding',
          'Other',
        ],
      },
      severity: {
        type: Type.STRING,
        enum: ['Low', 'Medium', 'High', 'Critical'],
      },
      safetyRisks: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Potential concrete safety risks to residents, motorists, or pedestrians',
      },
      urgency: {
        type: Type.STRING,
        enum: ['Low', 'Medium', 'High', 'Critical'],
      },
      urgencyReasons: {
        type: Type.STRING,
        description: 'Clear objective reasoning explaining why this urgency level was assigned',
      },
      safetyImpact: {
        type: Type.INTEGER,
        description: 'Score from 0 to 35 measuring direct threat to human life or health',
      },
      infrastructureDamage: {
        type: Type.INTEGER,
        description: 'Score from 0 to 25 measuring structural damage or asset degradation',
      },
      affectedPopulationRisk: {
        type: Type.INTEGER,
        description: 'Score from 0 to 25 measuring community exposure or traffic density',
      },
      ageFactor: {
        type: Type.INTEGER,
        description: 'Score from 0 to 15 measuring time sensitivity',
      },
      scoreRationale: {
        type: Type.STRING,
        description: 'Transparent explanation of why the report received these score components',
      },
      recommendedDepartment: {
        type: Type.STRING,
        enum: [
          'Roads & Infrastructure',
          'Waste Management',
          'Water Supply & Sanitation',
          'Electrical & Lighting',
          'Drainage & Flood Control',
          'Public Safety & Enforcement',
        ],
      },
      recommendedActions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Exactly 3 concrete operational actions for the dispatched field crew',
      },
      estimatedResponseTimeframe: {
        type: Type.STRING,
        description: 'Estimated response timeframe explicitly designated as an estimate',
      },
      confidenceScore: {
        type: Type.NUMBER,
        description: 'Confidence between 0.0 and 1.0',
      },
      missingInformation: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Key missing field details or uncertain parameters',
      },
    },
    required: [
      'summary',
      'predictedCategory',
      'severity',
      'safetyRisks',
      'urgency',
      'urgencyReasons',
      'safetyImpact',
      'infrastructureDamage',
      'affectedPopulationRisk',
      'ageFactor',
      'scoreRationale',
      'recommendedDepartment',
      'recommendedActions',
      'estimatedResponseTimeframe',
      'confidenceScore',
      'missingInformation',
    ],
  };

  // Construct multimodal content if image is attached
  const imagePart = parseImagePart(imageUrl);
  const contents = imagePart
    ? [{ parts: [imagePart, { text: promptText }] }]
    : promptText;

  // Single retry wrapper with backoff for resilience against transient 503/429
  let lastError: any = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini model');
      }

      const parsed = JSON.parse(text);

      const safetyImpact = Math.min(35, Math.max(0, Number(parsed.safetyImpact) || 15));
      const infrastructureDamage = Math.min(25, Math.max(0, Number(parsed.infrastructureDamage) || 12));
      const affectedPopulationRisk = Math.min(25, Math.max(0, Number(parsed.affectedPopulationRisk) || 12));
      const ageFactor = Math.min(15, Math.max(0, Number(parsed.ageFactor) || 8));
      const calculatedPriority = Math.min(
        100,
        Math.max(1, safetyImpact + infrastructureDamage + affectedPopulationRisk + ageFactor)
      );

      const analysis: AIAnalysis = {
        summary: sanitizeOutput(parsed.summary) || `${category} issue at ${location}`,
        predictedCategory: (parsed.predictedCategory as CivicIssueCategory) || category,
        severity: (parsed.severity as SeverityLevel) || 'Medium',
        safetyRisks: Array.isArray(parsed.safetyRisks) && parsed.safetyRisks.length > 0
          ? parsed.safetyRisks.map((r: string) => sanitizeOutput(r))
          : ['General urban safety monitoring recommended'],
        urgency: (parsed.urgency as 'Low' | 'Medium' | 'High' | 'Critical') || 'Medium',
        urgencyReasons: sanitizeOutput(parsed.urgencyReasons) || 'Assessed according to municipal safety factors.',
        priorityScore: calculatedPriority,
        scoreFactors: {
          safetyImpact,
          infrastructureDamage,
          affectedPopulationRisk,
          ageFactor,
          rationale: sanitizeOutput(parsed.scoreRationale) || 'Calculated by Gemini AI multi-factor assessment.',
        },
        recommendedDepartment: (parsed.recommendedDepartment as Department) || 'Roads & Infrastructure',
        recommendedActions: Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length >= 3
          ? parsed.recommendedActions.slice(0, 3).map((a: string) => sanitizeOutput(a))
          : [
              'Conduct on-site perimeter safety evaluation',
              'Deploy municipal maintenance team with appropriate equipment',
              'Follow up to verify restoration standard',
            ],
        estimatedResponseTimeframe: sanitizeOutput(parsed.estimatedResponseTimeframe) || 'Estimated 24 to 48 hours',
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.94,
        missingInformation: Array.isArray(parsed.missingInformation)
          ? parsed.missingInformation.map((m: string) => sanitizeOutput(m))
          : [],
        source: 'gemini-3.8-flash',
        analyzedAt: new Date().toISOString(),
      };

      return {
        analysis,
        isRealAI: true,
      };
    } catch (err: any) {
      lastError = err;
      const isTransient = /503|UNAVAILABLE|high demand|429|quota/i.test(err?.message || '');
      if (attempt === 1 && isTransient) {
        continue; // Retry once
      }
      break;
    }
  }

  console.warn('Gemini API call failed after attempts, falling back to rule engine:', lastError?.message || lastError);
  const fallback = generateRuleBasedAnalysis(title, description, category, location);
  return {
    analysis: fallback,
    isRealAI: false,
    errorNotice: `Gemini API notice: ${lastError?.message || 'Rate limit or model connection issue'}. Deterministic rule engine utilized instead.`,
  };
}
