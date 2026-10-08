const EXPO_PUSH_ORIGIN = "https://exp.host/--/api/v2/push";
export const EXPO_PUSH_SEND_URL = `${EXPO_PUSH_ORIGIN}/send`;
export const EXPO_PUSH_RECEIPTS_URL = `${EXPO_PUSH_ORIGIN}/getReceipts`;
export const EXPO_PUSH_MESSAGE_BATCH_SIZE = 100;
export const EXPO_PUSH_RECEIPT_BATCH_SIZE = 1000;

const RETRY_DELAYS_MS = [250, 1_000, 3_000];

export type ExpoPushResult = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

export type ExpoPushTicketPayload = {
  data?: ExpoPushResult[] | ExpoPushResult;
  errors?: { code?: string; message?: string }[];
};

export type ExpoPushReceiptPayload = {
  data?: Record<string, ExpoPushResult>;
  errors?: { code?: string; message?: string }[];
};

export class ExpoPushRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ExpoPushRequestError";
  }
}

export function chunkExpoItems<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error("O tamanho do lote deve ser positivo.");
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function expoPushHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }
  return headers;
}

function isRetryableStatus(statusCode: number) {
  return statusCode === 429 || statusCode >= 500;
}

export async function postExpoPushJson<T>(
  url: string,
  body: unknown,
  options: {
    fetcher?: typeof fetch;
    sleep?: (delayMs: number) => Promise<void>;
  } = {},
): Promise<T> {
  const fetcher = options.fetcher ?? fetch;
  const sleep =
    options.sleep ?? ((delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: expoPushHeaders(),
        body: JSON.stringify(body),
      });
      if (response.ok) return (await response.json()) as T;

      const error = new ExpoPushRequestError(
        `Expo Push respondeu com HTTP ${response.status}.`,
        response.status,
      );
      if (!isRetryableStatus(response.status)) throw error;
      lastError = error;
    } catch (error) {
      if (error instanceof ExpoPushRequestError && !isRetryableStatus(error.statusCode ?? 0)) {
        throw error;
      }
      lastError = error;
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ExpoPushRequestError("Falha ao acessar o Expo Push Service.");
}
