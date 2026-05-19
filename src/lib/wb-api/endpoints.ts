import { wbGet } from "./client";
import { wbDateFromLookback } from "./config";
import type {
  WbOperationalFetchResult,
  WbSupplierOrder,
  WbSupplierSale,
  WbSupplierStock,
} from "./types";

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function fetchWbOrders(dateFrom?: string): Promise<WbSupplierOrder[]> {
  const df = dateFrom ?? wbDateFromLookback();
  return asArray(await wbGet<WbSupplierOrder[]>("/api/v1/supplier/orders", { dateFrom: df }));
}

export async function fetchWbSales(dateFrom?: string): Promise<WbSupplierSale[]> {
  const df = dateFrom ?? wbDateFromLookback();
  return asArray(await wbGet<WbSupplierSale[]>("/api/v1/supplier/sales", { dateFrom: df }));
}

export async function fetchWbStocks(dateFrom?: string): Promise<WbSupplierStock[]> {
  const df = dateFrom ?? wbDateFromLookback();
  return asArray(await wbGet<WbSupplierStock[]>("/api/v1/supplier/stocks", { dateFrom: df }));
}

export async function fetchWbOperationalData(dateFrom?: string): Promise<WbOperationalFetchResult> {
  const df = dateFrom ?? wbDateFromLookback();
  const [orders, sales, stocks] = await Promise.all([
    fetchWbOrders(df),
    fetchWbSales(df),
    fetchWbStocks(df),
  ]);
  return {
    orders,
    sales,
    stocks,
    fetchedAt: Date.now(),
    dateFrom: df,
  };
}
