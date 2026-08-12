export class NormalizationService {
    // Basic heuristics for language detection
    // Devanagari Unicode Range: \u0900-\u097F
    static isNepali(text: string): boolean {
        return /[\u0900-\u097F]/.test(text);
    }

    static normalize(text: string): { normalized: string; language: "EN" | "NE" | "MIXED" } {
        if (!text) return { normalized: "", language: "EN" };

        let clean = text.trim();
        const hasNepali = this.isNepali(clean);

        // Lowercase English parts (Devanagari is case-less)
        // We can just lowercase everything, it won't affect Devanagari
        clean = clean.toLowerCase();

        // Normalize Whitespace
        clean = clean.replace(/\s+/g, " ");

        // Remove Emojis (Simple range check or regex)
        clean = clean.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        let language: "EN" | "NE" | "MIXED" = "EN";
        if (hasNepali) {
            // Heuristic: If > 50% chars are Devanagari -> NE, else MIXED
            const devanagariCount = (clean.match(/[\u0900-\u097F]/g) || []).length;
            if (devanagariCount > clean.length * 0.5) {
                language = "NE";
            } else {
                language = "MIXED";
            }
        }

        return { normalized: clean, language };
    }

    static expandSynonyms(text: string): string {
        // Mock Synonym Map for MVP
        // In real app, load from DB or Cache
        const synonyms: Record<string, string[]> = {
            "momo": ["dumpling", "dimsum"],
            "chowmein": ["noodles", "spaghetti"],
            "thukpa": ["noodle soup"],
            "khaja": ["snack"],
            "bhat": ["rice"],
            "dal": ["lentil"],
            "masu": ["meat"],
            "buff": ["buffalo", "meat"],
            "chiya": ["tea"]
        };

        const words = text.split(" ");
        const expanded: string[] = [];

        for (const word of words) {
            expanded.push(word);
            if (synonyms[word]) {
                expanded.push(...synonyms[word]);
            }
        }

        return [...new Set(expanded)].join(" ");
    }
}
