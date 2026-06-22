/**
 * Fuzzy exercise matching utilities.
 * Finds the closest exercise when an exact substring search returns nothing.
 */

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function tokenize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/**
 * Checks if a single query token matches an exercise name.
 * Uses exact substring match first, then falls back to word-level fuzzy
 * matching (Levenshtein) so typos like "dumbell" still match "dumbbell".
 */
export function tokenMatchesName(token, name) {
  const nameLower = name.toLowerCase();
  const qt = token.toLowerCase();
  if (!qt) return false;

  // 1. Exact substring match on full name (handles "curl" → "Bicep Curl (Dumbbell)")
  if (nameLower.includes(qt)) return true;

  // 2. Word-level fuzzy match (handles "dumbell" → "dumbbell")
  const eTokens = tokenize(name);
  return eTokens.some(et => {
    const ml = Math.max(qt.length, et.length);
    if (ml === 0) return false;
    const dist = levenshtein(qt, et);
    // Allow ~1 edit per 4 characters (25% tolerance), minimum 1
    return dist <= Math.max(1, Math.floor(ml / 4));
  });
}

/**
 * Returns { exercise, score } for the best fuzzy match, or null if nothing is close enough.
 * Combines three signals: full-string Levenshtein, token overlap (substring), and
 * minimum token-level Levenshtein (catches misspellings without inflating on partial matches).
 */
export function findSimilarExercise(query, exercises) {
  if (!query.trim() || !exercises || exercises.length === 0) return null;

  const qNorm = normalize(query);
  const qTokens = tokenize(query);

  let bestMatch = null;
  let bestScore = 0;

  for (const ex of exercises) {
    const eNorm = normalize(ex.name);
    const eTokens = tokenize(ex.name);

    // 1. Full-string Levenshtein (catches "pushup" → "pushup", "benchpress" → "benchpressbarbell")
    const maxLen = Math.max(qNorm.length, eNorm.length);
    const fullLev = maxLen > 0 ? 1 - (levenshtein(qNorm, eNorm) / maxLen) : 0;

    // 2. Token overlap: how many query tokens are substrings of exercise tokens (or vice versa)
    let matched = 0;
    for (const qt of qTokens) {
      if (eTokens.some(et => et.includes(qt) || qt.includes(et))) matched++;
    }
    const tokenOverlap = qTokens.length > 0 ? matched / qTokens.length : 0;

    // 3. Min token Levenshtein: worst-matching query token's best Levenshtein score.
    //    Using min (not avg) prevents "svend press" from scoring high just because "press" matches.
    let minTokenLev = 1;
    for (const qt of qTokens) {
      let bestForToken = 0;
      for (const et of eTokens) {
        const ml = Math.max(qt.length, et.length);
        if (ml > 0) {
          const l = 1 - (levenshtein(qt, et) / ml);
          if (l > bestForToken) bestForToken = l;
        }
      }
      if (bestForToken < minTokenLev) minTokenLev = bestForToken;
    }

    const score = Math.max(fullLev, tokenOverlap, minTokenLev);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = ex;
    }
  }

  // Threshold: 0.55 balances catching real near-misses without suggesting unrelated exercises.
  if (bestScore > 0.55) {
    return { exercise: bestMatch, score: bestScore };
  }
  return null;
}