import { useCallback, useMemo, useState } from "react";
import {
  canCompareSelection,
  clearCompareSelection,
  CompareSelectionState,
  isCompareDisabled,
  isCompareSelected,
  toggleCompareSelection,
} from "@/lib/compare";

export function useCompareSelection(maxCount = 2) {
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
    () => canCompareSelection(state, maxCount),
    [state, maxCount]
  );

  return {
    selectedIds: state.selectedIds,
    selectedCount: state.selectedIds.length,
    maxCount,
    toggle,
    clear,
    isSelected,
    isDisabled,
    canCompare,
  };
}
