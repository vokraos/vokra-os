export type WbConnectionStatus = "disconnected" | "configured" | "connected" | "error";

export type WbConnectionState = {
  status: WbConnectionStatus;
  /** i18n key for UI — never contains token or raw API body */
  messageKey: string;
  checkedAt?: number;
  lastError?: string;
};

export type WbApiErrorCode =
  | "not_connected"
  | "unauthorized"
  | "forbidden"
  | "network"
  | "cors"
  | "http"
  | "parse";

export class WbApiError extends Error {
  readonly code: WbApiErrorCode;
  readonly httpStatus?: number;

  constructor(code: WbApiErrorCode, message: string, httpStatus?: number) {
    super(message);
    this.name = "WbApiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/** Statistics API — supplier orders (read-only). */
export type WbSupplierOrder = {
  nmId?: number;
  supplierArticle?: string;
  warehouseName?: string;
  warehouseType?: string;
  brand?: string;
  subject?: string;
  category?: string;
  totalPrice?: number;
  discountPercent?: number;
  isCancel?: boolean;
  lastChangeDate?: string;
};

/** Statistics API — supplier sales (read-only). */
export type WbSupplierSale = {
  nmId?: number;
  supplierArticle?: string;
  warehouseName?: string;
  brand?: string;
  subject?: string;
  category?: string;
  totalPrice?: number;
  discountPercent?: number;
  isStorno?: boolean;
  lastChangeDate?: string;
};

/** Statistics API — supplier stocks (read-only). */
export type WbSupplierStock = {
  nmId?: number;
  supplierArticle?: string;
  warehouseName?: string;
  brand?: string;
  subject?: string;
  quantity?: number;
  quantityFull?: number;
  lastChangeDate?: string;
};

export type WbOperationalFetchResult = {
  orders: WbSupplierOrder[];
  sales: WbSupplierSale[];
  stocks: WbSupplierStock[];
  fetchedAt: number;
  dateFrom: string;
};

export type WbConnectionTestResult = {
  ok: boolean;
  status: WbConnectionStatus;
  messageKey: string;
  error?: string;
};
