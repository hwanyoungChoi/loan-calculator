import { useState } from "react";

import TabNav from "@/components/TabNav";
import MortgageCalculator from "@/containers/Mortgage/Calculator/MortgageCalculator";
import MortgageListings from "@/containers/Mortgage/Listings/MortgageListings";
import { resetListingsScroll } from "@/containers/Mortgage/Listings/hooks/useListingsScrollRestoration";
import MortgageShare from "@/containers/Mortgage/Share/MortgageShare";
import { useHashRoute } from "@/hooks/useHashRoute";
import { LOAN_REGULATIONS } from "@/lib/constants/loanRegulations";
import { PATHS } from "@/lib/constants/paths";
import { getBrowserStorage } from "@/lib/utils/browserStorage";
import { createBudgetStore } from "@/lib/utils/budgetStorage";
import { createRandomId } from "@/lib/utils/createRandomId";
import { createDraftStore } from "@/lib/utils/draftStorage";
import { createListingStore } from "@/lib/utils/listingStore";
import { createSentShareStore } from "@/lib/utils/sentShareStorage";
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
    budgetStore: createBudgetStore({ storage }),
    sentShareStore: createSentShareStore({ storage, now: Date.now }),
  };
}

/** 라우트별 화면 선택은 이 파일 한 곳에서 한다. 화면들은 같은 스토어를 공유한다. */
function AppRoutes({ storage, regulations = LOAN_REGULATIONS }: AppRoutesProps) {
  const [{ listingStore, draftStore, tradeLookupStore, budgetStore, sentShareStore }] = useState(
    () => createStores(storage ?? getBrowserStorage()),
  );
  const route = useHashRoute();
  // 저장 시트 이름 제안. 목록의 "복사"가 채우고 계산 화면이 쓰므로 두 화면 위에 둔다.
  const [suggestedName, setSuggestedName] = useState("");
  // 저장 목록에 한 번 보일 알림. 주소에 두면 새로고침·공유 때 다시 뜨므로 메모리에 둔다.
  const [listingsNotice, setListingsNotice] = useState<string | null>(null);

  /** 공유받은 매물을 추가하면 목록 맨 위로 간다. replace라 뒤로 가기로 공유 화면에 돌아와 또 추가하지 않는다. */
  const handleSharedListingsAdded = (notice: string) => {
    setListingsNotice(notice);
    resetListingsScroll();
    window.location.replace(PATHS.listings());
  };

  const renderScreen = () => {
    if (route.name === "share") {
      return (
        <MortgageShare
          token={route.token}
          listingStore={listingStore}
          regulations={regulations}
          onAdded={handleSharedListingsAdded}
        />
      );
    }
    if (route.name === "listings") {
      return (
        <MortgageListings
          listingStore={listingStore}
          draftStore={draftStore}
          budgetStore={budgetStore}
          sentShareStore={sentShareStore}
          regulations={regulations}
          sort={route.sort}
          view={route.view}
          onSuggestedNameChange={setSuggestedName}
          notice={listingsNotice}
          onNoticeChange={setListingsNotice}
        />
      );
    }
    return (
      <MortgageCalculator
        listingStore={listingStore}
        draftStore={draftStore}
        tradeLookupStore={tradeLookupStore}
        regulations={regulations}
        suggestedName={suggestedName}
        onSuggestedNameChange={setSuggestedName}
      />
    );
  };

  // 탭으로 들어온 목록은 맨 위에서 시작한다. 스크롤 복원은 카드 → 계산 → 뒤로 가기에서만 일어난다.
  return (
    <>
      <TabNav
        current={route.name === "share" ? null : route.name}
        onNavigate={resetListingsScroll}
      />
      {renderScreen()}
    </>
  );
}

export default AppRoutes;
