import type { InputField } from "./analysisTypes";

export const FIELD_ALIASES: Record<InputField, readonly string[]> = {
  customer: ["customer_uid", "customer_id", "customerid", "account_id", "accountid", "client_id", "buyer_id"],
  date: ["purchase_date", "order_date", "transaction_date", "date", "purchase_dt"],
  amount: ["total", "amount", "order_value", "transaction_value", "revenue", "net_sales", "sales"],
};
