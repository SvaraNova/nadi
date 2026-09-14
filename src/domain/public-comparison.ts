export type PublicComparisonStatus = "aligned_direction" | "divergent_direction" | "not_comparable" | "unavailable";
export type IndicatorMapping = Readonly<{ cohortKey: string; relation: PublicComparisonStatus; rationale: string; reviewer: string | null; reviewedAt: string | null; version: string }>;
export function comparisonStatus(mapping: IndicatorMapping | null): PublicComparisonStatus { return mapping?.reviewer && mapping.reviewedAt ? mapping.relation : "not_comparable"; }
