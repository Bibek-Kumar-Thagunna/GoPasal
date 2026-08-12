export interface FeatureFlagContext {
    userId?: string;
    email?: string;
    role?: string;
    country?: string;
    [key: string]: any;
}

export interface FeatureFlagCondition {
    attribute: string;
    operator: "equals" | "contains" | "in" | "startsWith" | "endsWith";
    value: string | number | boolean | string[];
}

export interface FeatureFlagRule {
    name?: string;
    conditions: FeatureFlagCondition[];
    percentage: number; // 0-100
}
