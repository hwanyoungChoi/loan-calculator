/** 저장 시트 이름 칸의 처음 값. 불러온 매물을 편집 중이면 그 이름, 아니면 붙여넣기에서 만든 제안(없으면 ""). */
export function pickSuggestedName(
  existingName: string,
  listingId: string | null,
  suggested: string,
): string {
  return listingId === null ? suggested : existingName;
}
