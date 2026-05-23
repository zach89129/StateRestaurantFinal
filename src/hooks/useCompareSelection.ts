import { useCallback, useMemo, useState } from "react";
import {
  canCompareSelection,
  clearCompareSelection,
  CompareSelectionState,
  isCompareDisabled,
  isCompareSelected,
  toggleCompareSelection,
} from "@/lib/compare";

export function useCompareSelection(maxCount = 3, minCount = 2) {
  const [state, setState] = useState<CompareSelectionState>({ selectedIds: [] });

  const toggle = useCallback(
    (id: number) => {
      setState((current) => toggleCompareSelection(current, id, maxCount));
    },
    [maxCount]
  );

  const clear = useCallback(() => {
    setState(clearCompareSelection());
  }, []);

  const isSelected = useCallback(
    (id: number) => isCompareSelected(state, id),
    [state]
  );

  const isDisabled = useCallback(
    (id: number) => isCompareDisabled(state, id, maxCount),
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
    isSelected,
    isDisabled,
    canCompare,
  };
}
