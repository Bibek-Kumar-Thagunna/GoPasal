/** Build callback payload from return URL query params for server verify. */
export function buildPaymentCallback(params: Record<string, string | undefined>): Record<string, unknown> {
  const callback: Record<string, unknown> = {};
  if (params.pidx) callback.pidx = params.pidx;
  if (params.data) callback.data = params.data;
  if (params.paymentId) callback.paymentId = params.paymentId;
  if (params.tx) callback.tx = params.tx;
  if (params.transaction_id) callback.tx = params.transaction_id;
  if (params.status) callback.status = params.status;
  if (params.amount) callback.amountNpr = Number(params.amount);
  return callback;
}

export function channelFromPaymentMethod(
  method: 'COD' | 'KHALTI' | 'ESEWA'
): 'COD' | 'KHALTI' | 'ESEWA' | 'FONEPAY_QR' {
  return method;
}
