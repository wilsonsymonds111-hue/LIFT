import { Search, Plus, Loader2 } from 'lucide-react';

export default function NoResultsSuggestion({ query, suggestion, onSelectSuggestion, onCreateCustom, creating }) {
  return (
    <div className="px-4 pt-8 pb-4 flex flex-col items-center gap-5">
      {suggestion ? (
        <div className="w-full text-center">
          <p className="text-sm text-muted-foreground mb-3">No exact matches. Did you mean:</p>
          <button
            onClick={() => onSelectSuggestion(suggestion.exercise)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl font-semibold text-sm hover:bg-blue-100 dark:hover:bg-blue-950/50 transition active:scale-95"
          >
            <Search className="w-4 h-4" />
            {suggestion.exercise.name}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          No exercises found for &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="w-full max-w-sm">
        <div className="border-t border-border mb-4" />
        <p className="text-xs text-muted-foreground text-center mb-2.5">
          {suggestion ? 'Not what you were looking for?' : "Can't find your exercise?"}
        </p>
        <button
          onClick={onCreateCustom}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-xl font-semibold text-sm hover:bg-green-100 dark:hover:bg-green-950/50 transition active:scale-95 disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Create &ldquo;{query}&rdquo;
            </>
          )}
        </button>
      </div>
    </div>
  );
}