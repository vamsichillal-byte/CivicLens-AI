import { CivicReport, DuplicateMatch } from '../types/index.js';

/**
 * Calculates distance in meters between two coordinate points using the Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
  'with', 'by', 'from', 'near', 'about', 'there', 'it', 'its', 'this', 'that', 'our', 'my', 'your',
  'very', 'large', 'small', 'big', 'please', 'help', 'street', 'road', 'avenue', 'ave', 'blvd', 'st',
]);

export function normalizeAndTokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

export function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * Checks a report candidate against existing reports to find potential duplicates.
 */
export function detectDuplicates(
  candidate: {
    id?: string;
    title: string;
    description: string;
    category: string;
    location: string;
    coordinates?: { latitude: number; longitude: number };
  },
  existingReports: CivicReport[]
): DuplicateMatch[] {
  const candidateTokens = normalizeAndTokenize(`${candidate.title} ${candidate.description}`);
  const candidateLocationTokens = normalizeAndTokenize(candidate.location);
  const matches: DuplicateMatch[] = [];

  for (const report of existingReports) {
    if (candidate.id && report.id === candidate.id) continue;
    // Don't compare with rejected issues
    if (report.status === 'Rejected') continue;

    const reasons: string[] = [];
    let similarityScore = 0;

    // 1. Category Matching
    const sameCategory = report.category === candidate.category;
    if (sameCategory) {
      similarityScore += 25;
      reasons.push(`Identical civic category (${report.category})`);
    }

    // 2. Textual Description & Title Similarity (Jaccard)
    const reportTokens = normalizeAndTokenize(`${report.title} ${report.description}`);
    const textSimilarity = computeJaccardSimilarity(candidateTokens, reportTokens);
    if (textSimilarity >= 0.1) {
      const textPoints = Math.min(45, Math.round(textSimilarity * 75));
      similarityScore += textPoints;
      reasons.push(`${Math.round(textSimilarity * 100)}% keyword and phrasing overlap in description`);
    }

    // 3. Location Proximity (Address text matching)
    const reportLocationTokens = normalizeAndTokenize(report.location);
    const locOverlap = computeJaccardSimilarity(candidateLocationTokens, reportLocationTokens);
    if (locOverlap > 0.3) {
      similarityScore += 20;
      reasons.push(`Similar reported address keywords (${report.location})`);
    }

    // 4. Coordinate Distance (Haversine)
    let distanceMeters: number | null = null;
    if (candidate.coordinates && report.coordinates) {
      distanceMeters = calculateHaversineDistanceMeters(
        candidate.coordinates.latitude,
        candidate.coordinates.longitude,
        report.coordinates.latitude,
        report.coordinates.longitude
      );

      if (distanceMeters <= 50) {
        similarityScore += 40;
        reasons.push(`Direct street proximity: only ${distanceMeters} meters away (same address block)`);
      } else if (distanceMeters <= 120) {
        similarityScore += 35;
        reasons.push(`Direct geographic proximity: only ${distanceMeters} meters away`);
      } else if (distanceMeters <= 350) {
        similarityScore += 20;
        reasons.push(`Within immediate vicinity: ${distanceMeters} meters away`);
      } else if (distanceMeters <= 1000) {
        similarityScore += 10;
        reasons.push(`In same neighborhood: ${distanceMeters} meters away`);
      }
    }

    // Cap similarity score at 99%
    const finalScore = Math.min(99, Math.round(similarityScore));

    // Duplicate criteria: Requires identical/compatible category OR high semantic phrasing overlap (>= 45%)
    const isCandidateDuplicate =
      (sameCategory && (finalScore >= 50 || (distanceMeters !== null && distanceMeters <= 250 && textSimilarity >= 0.08))) ||
      (!sameCategory && textSimilarity >= 0.45 && finalScore >= 65);

    if (isCandidateDuplicate) {
      matches.push({
        reportId: report.id,
        reportTitle: report.title,
        reportCategory: report.category,
        similarityScore: finalScore,
        reasons,
        distanceMeters,
        status: 'suggested',
      });
    }
  }

  // Sort highest similarity first
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}
