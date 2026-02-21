// ============================================================================
// AMPÈRE SEMANTIC SEARCH — On-device ML / TF-IDF + Clustering (Phase 4)
// File: lib/semanticSearch.ts
// ============================================================================

import { addLog } from "./telemetry";

// ============================================================================
// TYPES
// ============================================================================

export interface SemanticDocument {
  id: string;
  title: string;
  genre: string;
  platformId: string;
  tags: string[];
  description?: string;
}

export interface SemanticResult {
  document: SemanticDocument;
  score: number;
  matchedTerms: string[];
}

export interface Cluster {
  id: string;
  label: string;
  centroidTerms: string[];
  documentIds: string[];
  size: number;
}

// ============================================================================
// TF-IDF ENGINE (deterministic fallback — no external dependencies)
// ============================================================================

export class TFIDFEngine {
  private documents: SemanticDocument[] = [];
  private termDocFreq: Map<string, number> = new Map();
  private docTermFreq: Map<string, Map<string, number>> = new Map();
  private totalDocs = 0;

  /**
   * Index a batch of documents for search.
   */
  indexDocuments(docs: SemanticDocument[]): void {
    this.documents = docs;
    this.totalDocs = docs.length;
    this.termDocFreq.clear();
    this.docTermFreq.clear();

    for (const doc of docs) {
      const terms = this.tokenize(doc);
      const termFreq = new Map<string, number>();

      for (const term of terms) {
        termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
      }
      this.docTermFreq.set(doc.id, termFreq);

      // Count document frequency for each unique term
      const uniqueTerms = new Set(terms);
      for (const term of uniqueTerms) {
        this.termDocFreq.set(term, (this.termDocFreq.get(term) ?? 0) + 1);
      }
    }

    addLog("semantic_index", { docCount: docs.length, termCount: this.termDocFreq.size });
  }

  /**
   * Search using TF-IDF scoring.
   */
  search(query: string, limit = 20): SemanticResult[] {
    const queryTerms = this.normalizeTerms(query);
    if (queryTerms.length === 0) return [];

    const scores: Array<{ doc: SemanticDocument; score: number; matched: string[] }> = [];

    for (const doc of this.documents) {
      const docTerms = this.docTermFreq.get(doc.id);
      if (!docTerms) continue;

      let score = 0;
      const matched: string[] = [];

      for (const qt of queryTerms) {
        // Check exact and partial matches
        for (const [docTerm, tf] of docTerms) {
          if (docTerm === qt || docTerm.includes(qt) || qt.includes(docTerm)) {
            const idf = Math.log((this.totalDocs + 1) / (1 + (this.termDocFreq.get(docTerm) ?? 0)));
            const tfidf = tf * idf;
            score += tfidf;
            if (!matched.includes(qt)) matched.push(qt);
          }
        }
      }

      if (score > 0) {
        scores.push({ doc, score, matched });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit).map((s) => ({
      document: s.doc,
      score: s.score,
      matchedTerms: s.matched,
    }));
  }

  /**
   * Cluster documents by genre + tag similarity.
   */
  cluster(k = 6): Cluster[] {
    // Simple deterministic clustering by genre
    const genreClusters = new Map<string, SemanticDocument[]>();

    for (const doc of this.documents) {
      const genre = doc.genre || "Other";
      if (!genreClusters.has(genre)) genreClusters.set(genre, []);
      genreClusters.get(genre)!.push(doc);
    }

    const clusters: Cluster[] = [];
    let i = 0;
    for (const [genre, docs] of genreClusters) {
      if (i >= k) break;
      // Find most common terms in this cluster
      const termCounts = new Map<string, number>();
      for (const doc of docs) {
        for (const tag of doc.tags) {
          termCounts.set(tag, (termCounts.get(tag) ?? 0) + 1);
        }
      }
      const centroidTerms = [...termCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term);

      clusters.push({
        id: `cluster_${i}`,
        label: genre,
        centroidTerms,
        documentIds: docs.map((d) => d.id),
        size: docs.length,
      });
      i++;
    }

    addLog("semantic_cluster", { clusterCount: clusters.length });
    return clusters;
  }

  // -- Internal helpers --

  private tokenize(doc: SemanticDocument): string[] {
    const text = [doc.title, doc.genre, doc.platformId, ...(doc.tags || []), doc.description || ""].join(" ");
    return this.normalizeTerms(text);
  }

  private normalizeTerms(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  }
}

// ============================================================================
// STOP WORDS
// ============================================================================

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "it", "in", "on", "at", "to", "for",
  "of", "and", "or", "but", "not", "with", "from", "by", "as",
  "this", "that", "be", "are", "was", "were", "been", "has", "have",
  "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "can", "its", "my", "your", "his", "her", "our",
  "their", "all", "each", "every", "both", "few", "more", "most",
  "other", "some", "such", "no", "nor", "only", "own", "same",
  "so", "than", "too", "very",
]);

// ============================================================================
// SINGLETON
// ============================================================================

export const semanticEngine = new TFIDFEngine();
