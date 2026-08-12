export function orderFulfillmentLabel(type: string | null | undefined): string {
  switch (type) {
    case "PICKUP":
      return "Pickup";
    case "PLATFORM_LOGISTICS":
      return "Platform delivery";
    case "MERCHANT_DELIVERY":
      return "Merchant delivery";
    default:
      return type ?? "—";
  }
}

export function orderFulfillmentTone(
  type: string | null | undefined
): { className: string } {
  switch (type) {
    case "PICKUP":
      return { className: "bg-sky-500/20 text-sky-200" };
    case "PLATFORM_LOGISTICS":
      return { className: "bg-teal-500/20 text-teal-200" };
    case "MERCHANT_DELIVERY":
      return { className: "bg-violet-500/20 text-violet-200" };
    default:
      return { className: "bg-white/[0.08] text-white/50" };
  }
}
