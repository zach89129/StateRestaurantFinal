import { useCallback, useMemo, useReducer } from "react";
import {
  canCompareSelection,
  clearCompareSelection,
  CompareSelectionState,
  isCompareDisabled,
  toggleCompareSelection,
} from "@/lib/compare";

type SelectionAction =
  | { type: "toggle"; id: number; maxCount: number }
  | { type: "clear" };

function selectionReducer(
  state: CompareSelectionState,
  action: SelectionAction
): CompareSelectionState {
  switch (action.type) {
    case "clear":
      return clearCompareSelection();
    case "toggle":
      return toggleCompareSelection(state, action.id, action.maxCount);
    default:
      return state;
  }
}

export function useCompareSelection(maxCount = 3, minCount = 2) {
  const [state, dispatch] = useReducer(selectionReducer, { selectedIds: [] });

  const toggle = useCallback(
    (id: number) => {
      dispatch({ type: "toggle", id: Number(id), maxCount });
    },
    [maxCount]
  );

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const isDisabled = useCallback(
    (id: number) => isCompareDisabled(state, Number(id), maxCount),
    [state, maxCount]
  );

  const canCompare = useMemo(
    () => canCompareSelection(state, minCount, maxCount),
    [state, minCount, maxCount]
  );

  return {
    selectedIds: state.selectedIds,
    selectedCount: state.selectedIds.length,
    minCount,
    maxCount,
    toggle,
    clear,
    isDisabled,
    canCompare,
  };
}
