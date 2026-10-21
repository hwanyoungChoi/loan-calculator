import type { PriceSource } from "@/lib/types/loan";
import type { Borrower, Region } from "@/lib/types/regulation";

/** 화면에 보이는 순서 */
export const REGIONS: Region[] = ["regulated", "capitalNonRegulated", "nonCapital"];

export const BORROWERS: Borrower[] = ["noHome", "firstHome", "oneHomeDisposal", "oneHomeKeep"];

export const REGION_LABELS: Record<Region, string> = {
  regulated: "규제지역",
  capitalNonRegulated: "수도권 비규제",
  nonCapital: "비수도권",
};

export const BORROWER_LABELS: Record<Borrower, string> = {
  noHome: "무주택",
  firstHome: "무주택·생애최초",
  oneHomeDisposal: "1주택 처분조건부",
  oneHomeKeep: "1주택 미처분(추가구입)",
};

export const PRICE_SOURCE_LABELS: Record<PriceSource, string> = {
  salePrice: "매매가",
  kbPrice: "KB시세",
  equal: "매매가 = KB시세",
};
