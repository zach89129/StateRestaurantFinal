import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function useSearchParamsState(
  paramName: string,
  defaultValue: string
): [string, (value: string) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(
    searchParams?.get(paramName) || defaultValue
  );

  const setParam = useCallback(
    (newValue: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(paramName, newValue);
      router.push(`?${params.toString()}`);
      setValue(newValue);
    },
    [paramName, router, searchParams]
  );

  return [value, setParam];
}
