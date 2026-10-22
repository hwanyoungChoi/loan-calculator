import { useState } from "react";

import TabNav from "@/components/TabNav";
import MortgageCalculator from "@/containers/Mortgage/Calculator/MortgageCalculator";
import MortgageListings from "@/containers/Mortgage/Listings/MortgageListings";
import { resetListingsScroll } from "@/containers/Mortgage/Listings/hooks/useListingsScrollRestoration";
import { useHashRoute } from "@/hooks/useHashRoute";
import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";
import { getBrowserStorage } from "@/lib/utils/browserStorage";
import { createRandomId } from "@/lib/utils/createRandomId";
import { createDraftStore } from "@/lib/utils/draftStorage";
import { createListingStore } from "@/lib/utils/listingStore";
import { createTradeLookupStore } from "@/lib/utils/tradeLookupStorage";

import type { Regulations } from "@/lib/types/regulation";

type AppRoutesProps = {
  /** 기본은 브라우저 localStorage. 테스트에서 손상·접근 불가 Storage를 넣는다. 마운트 때 한 번만 읽는다. */
  storage?: Storage;
  /** 기본은 LOAN_REGULATIONS. 테스트에서 규제 fixture를 넣는다. */
  regulations?: Regulations;
};

function createStores(storage: Storage) {
  return {
    listingStore: createListingStore({
      storage,
      createId: createRandomId,
      now: () => new Date().toISOString(),
    }),
    draftStore: createDraftStore({ storage }),
    tradeLookupStore: createTradeLookupStore({ storage }),
  };
}

/** 라우트별 화면 선택은 이 파일 한 곳에서 한다. 두 화면은 같은 스토어를 공유한다. */
function AppRoutes({ storage, regulations = LOAN_REGULATIONS }: AppRoutesProps) {
  const [{ listingStore, draftStore, tradeLookupStore }] = useState(() =>
    createStores(storage ?? getBrowserStorage()),
  );
  const route = useHashRoute();

  // 탭으로 들어온 목록은 맨 위에서 시작한다. 스크롤 복원은 카드 → 계산 → 뒤로 가기에서만 일어난다.
  return (
    <>
      <TabNav current={route.name} onNavigate={resetListingsScroll} />
      {route.name === "calculator" ? (
        <MortgageCalculator
          listingStore={listingStore}
          draftStore={draftStore}
          tradeLookupStore={tradeLookupStore}
          regulations={regulations}
        />
      ) : (
        <MortgageListings
          listingStore={listingStore}
          draftStore={draftStore}
          regulations={regulations}
          sort={route.sort}
        />
      )}
    </>
  );
}

export default AppRoutes;
