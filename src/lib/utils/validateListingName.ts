// 시그니처 스텁(태스크 1-1). 구현은 태스크 2-1.

/** trim 후 1~40자(코드포인트 기준) */
export const validateListingName: (
  raw: string,
) => { ok: true; name: string } | { ok: false; message: string } = () => {
  throw new Error("미구현: 태스크 2-1");
};
