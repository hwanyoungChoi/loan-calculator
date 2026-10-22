import { useId, useRef, useState, type FormEvent } from "react";

import { LAWD_CODES } from "@/lib/constants/lawdCodes";

import Sheet from "./Sheet";
import TradeResults from "./TradeResults";
import styles from "./TradesSheet.module.css";
import { useAptTrades, type AptTradeListParams } from "../hooks/useAptTrades";

import type { TradeLookupStore } from "@/lib/types/tradeLookup";

type TradesSheetProps = {
  lookupStore: TradeLookupStore;
  /** 마지막으로 제출한 단지명 필터. 계산 화면 상태라 시트를 닫았다 열어도 남고, 새 계산·매물 열기에서 비워진다. */
  aptName: string;
  onAptNameSubmit: (aptName: string) => void;
  onClose: () => void;
};

const TRADE_MONTHS = 3;
/** 서버가 받는 단지명 최대 길이(코드포인트). maxLength는 UTF-16 단위라 이보다 엄격하다. */
const APT_NAME_MAX_LENGTH = 40;
const SIDO_NAMES = [...new Set(LAWD_CODES.map((entry) => entry.sido))];

function sidoOf(lawdCd: string | null): string {
  return LAWD_CODES.find((entry) => entry.code === lawdCd)?.sido ?? "";
}

function toParams(lawdCd: string | null, aptName: string): AptTradeListParams | null {
  if (lawdCd === null) return null;
  return aptName === ""
    ? { lawdCd, months: TRADE_MONTHS }
    : { lawdCd, months: TRADE_MONTHS, aptName };
}

/**
 * 이 지역 최근 실거래가(참고용). 요청은 시군구를 고르거나 "조회"를 눌렀을 때만 나간다(단지명 타이핑 중에는 안 나감).
 * 고른 시군구는 즉시 기억하고, 기억이 있으면 열자마자 조회한다.
 */
function TradesSheet({ lookupStore, aptName, onAptNameSubmit, onClose }: TradesSheetProps) {
  const fieldId = useId();
  const aptNameInputRef = useRef<HTMLInputElement>(null);
  const [lawdCd, setLawdCd] = useState<string | null>(() => lookupStore.load());
  const [sido, setSido] = useState(() => sidoOf(lawdCd));
  const [aptNameInput, setAptNameInput] = useState(aptName);

  const params = toParams(lawdCd, aptName);
  const trades = useAptTrades(params);
  const sigunguOptions = LAWD_CODES.filter((entry) => entry.sido === sido);

  const handleSidoChange = (nextSido: string) => {
    setSido(nextSido);
    setLawdCd(null);
  };

  const handleSigunguChange = (nextLawdCd: string) => {
    setLawdCd(nextLawdCd);
    lookupStore.save(nextLawdCd);
    onAptNameSubmit(aptNameInput.trim());
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAptNameSubmit(aptNameInput.trim());
    // 모바일 키보드가 결과를 가리지 않게 내린다.
    aptNameInputRef.current?.blur();
  };

  return (
    <Sheet title="이 지역 실거래가" onClose={onClose}>
      <form className={styles.filters} onSubmit={handleSubmit}>
        <div className={styles.regionRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${fieldId}-sido`}>
              시도
            </label>
            <select
              id={`${fieldId}-sido`}
              className={styles.control}
              value={sido}
              onChange={(event) => handleSidoChange(event.target.value)}
            >
              <option value="" disabled>
                선택
              </option>
              {SIDO_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${fieldId}-sigungu`}>
              시군구
            </label>
            <select
              id={`${fieldId}-sigungu`}
              className={styles.control}
              value={lawdCd ?? ""}
              disabled={sido === ""}
              onChange={(event) => handleSigunguChange(event.target.value)}
            >
              <option value="" disabled>
                선택
              </option>
              {sigunguOptions.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.sigungu}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.nameRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${fieldId}-apt-name`}>
              단지명(선택)
            </label>
            <input
              ref={aptNameInputRef}
              id={`${fieldId}-apt-name`}
              className={styles.control}
              type="search"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={APT_NAME_MAX_LENGTH}
              value={aptNameInput}
              onChange={(event) => setAptNameInput(event.target.value)}
            />
          </div>
          <button type="submit" className={styles.submitButton} disabled={lawdCd === null}>
            조회
          </button>
        </div>
      </form>
      <div className={styles.results}>
        {params === null ? (
          <p className={styles.prompt}>시군구를 고르면 최근 3개월 거래가 나옵니다</p>
        ) : (
          <TradeResults
            key={JSON.stringify(params)}
            status={trades.status}
            data={trades.data}
            error={trades.error}
            onRetry={() => void trades.refetch()}
          />
        )}
      </div>
    </Sheet>
  );
}

export default TradesSheet;
