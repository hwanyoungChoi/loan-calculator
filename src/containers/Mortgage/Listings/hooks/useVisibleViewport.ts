import { useEffect, useState } from "react";

/** 화면에 실제로 보이는 영역(키보드를 뺀 자리). bottom은 레이아웃 뷰포트 아래에서 가려진 높이(px). */
export type VisibleViewport = { bottom: number; height: number };

/** 타입은 늘 있다고 하지만 jsdom에는 없다(undefined). */
function visualViewportOf(): VisualViewport | null {
  return window.visualViewport ?? null;
}

function measure(viewport: VisualViewport): VisibleViewport {
  return {
    bottom: Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop),
    height: viewport.height,
  };
}

/**
 * iOS Safari는 키보드가 떠도 레이아웃 뷰포트가 줄지 않아 `position: fixed; bottom: 0`이 키보드 뒤로 숨는다.
 * visualViewport로 보이는 영역을 재서 그 위에 붙일 수 있게 한다. visualViewport가 없는 환경은 null.
 */
export function useVisibleViewport(): VisibleViewport | null {
  const [visible, setVisible] = useState<VisibleViewport | null>(() => {
    const viewport = visualViewportOf();
    return viewport === null ? null : measure(viewport);
  });

  useEffect(() => {
    const viewport = visualViewportOf();
    if (viewport === null) return;
    const update = () => setVisible(measure(viewport));
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return visible;
}
