import { isSkyPayEnabled } from "@/config/payments";
import type { PaymentChannel } from "./types";
import type { PaymentProvider } from "./payment-provider.interface";
import { skyPayAdapter } from "./skypay/skypay.adapter";
import { khaltiPaymentAdapter } from "./khalti/khalti.adapter";
import { esewaPaymentAdapter } from "./esewa/esewa.adapter";
import { codPaymentAdapter } from "./cod/cod.adapter";
import { fonepayPaymentAdapter } from "./fonepay/fonepay.adapter";

/**
 * Resolves which adapter handles a checkout channel.
 * When SkyPay assisted mode is on, all online channels route through SkyPay.
 */
export function resolvePaymentProvider(channel: PaymentChannel): PaymentProvider {
    if (channel === "COD") {
        return codPaymentAdapter;
    }

    if (isSkyPayEnabled()) {
        return skyPayAdapter;
    }

    switch (channel) {
        case "KHALTI":
            return khaltiPaymentAdapter;
        case "ESEWA":
            return esewaPaymentAdapter;
        case "FONEPAY_QR":
            return fonepayPaymentAdapter;
        case "CARD":
        case "WALLET":
            throw new Error(`${channel} requires SkyPay or a future card adapter`);
        default:
            throw new Error(`Unsupported payment channel: ${channel}`);
    }
}

export function listRegisteredProviders(): PaymentProvider[] {
    return [
        skyPayAdapter,
        khaltiPaymentAdapter,
        esewaPaymentAdapter,
        codPaymentAdapter,
        fonepayPaymentAdapter,
    ];
}
