import { errorResponse } from "./response";

export type JsonBodyResult = { ok: true; value: unknown } | { ok: false; response: Response };

const tooLarge = (maxBytes: number) =>
  errorResponse(413, "payloadTooLarge", `요청 본문은 ${maxBytes / 1024}KB 이하여야 합니다`);

const invalidJson = () => errorResponse(400, "invalidParams", "요청 본문이 JSON이 아닙니다");

/**
 * 본문을 스트림으로 읽으며 바이트를 센다. `Content-Length`만 믿지 않는다(chunked 요청 포함).
 * 넘으면 그 자리에서 읽기를 멈추고 413, JSON(UTF-8)이 아니면 400 invalidParams.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (declaredLength > maxBytes) return { ok: false, response: tooLarge(maxBytes) };
  if (request.body === null) return { ok: false, response: invalidJson() };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { ok: false, response: tooLarge(maxBytes) };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes);
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, response: invalidJson() };
  }
}
