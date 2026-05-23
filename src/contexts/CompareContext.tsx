"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  canCompareSelection,
  isCompareDisabled,
  toggleCompareSelection,
} from "@/lib/compare";
import {
  catalogProductToComparable,
  CatalogCompareSource,
} from "@/lib/catalogCompare";
import { ComparableProduct } from "@/types/compare";

const MAX_COMPARE_COUNT = 3;
const MIN_COMPARE_COUNT = 2;

interface CompareState {
  selectedIds: number[];
  productCache: Map<number, ComparableProduct>;
}

interface CompareContextValue extends CompareState {
  toggleProduct: (product: CatalogCompareSource) => void;
  isDisabled: (id: number) => boolean;
  selectedCount: number;
  minCount: number;
  maxCount: number;
  canCompare: boolean;
  clear: () => void;
  selectedLabels: string[];
  compareProducts: ComparableProduct[];
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
}

type CompareAction =
  | { type: "toggle"; product: CatalogCompareSource }
  | { type: "clear" };

const initialCompareState: CompareState = {
  selectedIds: [],
  productCache: new Map(),
};

function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "clear":
      return { selectedIds: [], productCache: new Map() };
    case "toggle": {
      const id = Number(action.product.trx_product_id);
      const next = toggleCompareSelection(
        { selectedIds: state.selectedIds },
        id,
        MAX_COMPARE_COUNT
      );

      if (next.selectedIds.length === state.selectedIds.length) {
        return state;
      }

      const productCache = new Map(state.productCache);
      if (next.selectedIds.includes(id)) {
        productCache.set(id, catalogProductToComparable(action.product));
      } else {
        productCache.delete(id);
      }

      return { selectedIds: next.selectedIds, productCache };
    }
    default:
      return state;
  }
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [{ selectedIds, productCache }, dispatch] = useReducer(
    compareReducer,
    initialCompareState
  );
  const [showModal, setShowModal] = useState(false);

  const toggleProduct = useCallback((product: CatalogCompareSource) => {
    dispatch({ type: "toggle", product });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
    setShowModal(false);
  }, []);

  const isDisabled = useCallback(
    (id: number) =>
      isCompareDisabled({ selectedIds }, Number(id), MAX_COMPARE_COUNT),
    [selectedIds]
  );

  const compareProducts = useMemo(() => {
    return selectedIds
      .map((id) => productCache.get(id))
      .filter((product): product is ComparableProduct => Boolean(product));
  }, [selectedIds, productCache]);

  const selectedLabels = useMemo(
    () => compareProducts.map((product) => product.title),
    [compareProducts]
  );

  const canCompare = useMemo(
    () =>
      canCompareSelection(
        { selectedIds },
        MIN_COMPARE_COUNT,
        MAX_COMPARE_COUNT
      ),
    [selectedIds]
  );

  const value: CompareContextValue = {
    selectedIds,
    productCache,
    toggleProduct,
    isDisabled,
    selectedCount: selectedIds.length,
    minCount: MIN_COMPARE_COUNT,
    maxCount: MAX_COMPARE_COUNT,
    canCompare,
    clear,
    selectedLabels,
    compareProducts,
    showModal,
    openModal: () => setShowModal(true),
    closeModal: () => setShowModal(false),
  };

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}

export function useIsCompareSelected(productId: number): boolean {
  const compare = useCompare();
  if (!compare) return false;
  return compare.selectedIds.includes(Number(productId));
}
