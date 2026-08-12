import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { submitPaymentFormPost } from "../src/utils/submit-payment-form";
import { Ionicons } from "@expo/vector-icons";
import { GText } from "../src/design-system/primitives/GText";
import {
  PaymentBottomSheet,
  mapOrderMethodToChannel,
  type PaymentChannelOption,
} from "../src/components/PaymentBottomSheet";
import { Button } from "../src/design-system/primitives/Button";
import { Card } from "../src/design-system/primitives/Card";
import { PhoneInput } from "../src/components/PhoneInput";
import { DEFAULT_COUNTRY_CODE } from "../src/constants/countries";

import { colors } from "../src/design-system/tokens/colors";
import { spacing, radius } from "../src/design-system/tokens/spacing";
import {
  useCart,
  useAddresses,
  useCheckout,
  usePaymentConfig,
  useCreateAddress,
} from "../src/services/hooks";
import { apiClient } from "../src/services/api-client";
import { ENDPOINTS } from "../src/services/endpoints";
import { env } from "../src/constants/env";
import { formatMoney } from "../src/utils/money";
import { getCartStoreName, isSingleStoreCart } from "../src/utils/cart";
import type { PaymentMethod, OrderFulfillmentType } from "../src/types";
import { useTranslation, type TranslationKey } from "../src/i18n";
import { useAuthStore } from "../src/store/auth.store";
import { useLocationStore } from "../src/store/location.store";
import { setTokens } from "../src/services/token-storage";
import { WebPageShell } from "../src/components/WebPageShell";
import { PaymentBrandIcon } from "../src/components/PaymentBrandIcon";
import { DeliveryFeeLine } from "../src/components/DeliveryFeeLine";
import { getCartTotalForDisplay } from "../src/utils/delivery-fee";

const ALL_METHODS: {
  key: PaymentMethod;
  labelKey: TranslationKey;
  subtitleKey: TranslationKey;
}[] = [
  { key: "COD", labelKey: "checkout.cod", subtitleKey: "checkout.codSub" },
  {
    key: "KHALTI",
    labelKey: "checkout.khalti",
    subtitleKey: "checkout.khaltiSub",
  },
  {
    key: "ESEWA",
    labelKey: "checkout.esewa",
    subtitleKey: "checkout.esewaSub",
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["2xl"],
    gap: spacing["2xl"],
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    paddingTop: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  paymentMethods: {
    gap: spacing.sm,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.card,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    marginBottom: spacing.sm,
  },
  addressSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.mint[50],
  },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.card,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    width: "100%",
  },
  paymentSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.mint[50],
  },
  summary: { gap: spacing.md },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  bottomBarContainer: {
    backgroundColor: colors.surface.background,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === "web" ? spacing.lg : spacing["3xl"],
    paddingTop: spacing.lg,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
    backgroundColor: colors.surface.background,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 52,
    backgroundColor: colors.surface.card,
  },
  couponRowFocused: {
    borderColor: colors.primary[400],
    backgroundColor: colors.mint[50],
  },
  couponInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.neutral[900],
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : null),
  },
  couponApplyBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
  },
  shopBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  blockedWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["2xl"],
    gap: spacing.md,
  },
  addressForm: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    padding: spacing.xl,
    gap: spacing.lg,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  formCol: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    fontSize: 16,
    color: colors.neutral[900],
    backgroundColor: colors.surface.background,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  fulfillmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  fulfillmentChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface.card,
  },
  fulfillmentChipOn: {
    borderColor: colors.primary[500],
    backgroundColor: colors.mint[50],
  },
  pickupNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    backgroundColor: colors.mint[50],
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface.background,
  },
  chipOn: {
    borderColor: colors.primary[400],
    backgroundColor: colors.mint[50],
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  savedAddressesList: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  savedAddressChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface.card,
  },
  savedAddressChipSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.mint[50],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  otpCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    color: colors.neutral[900],
    backgroundColor: colors.surface.background,
  },
});

export default function CheckoutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: cart } = useCart();
  const { data: addresses } = useAddresses();
  const { data: paymentConfig } = usePaymentConfig();
  const checkout = useCheckout();
  const createAddress = useCreateAddress();
  const user = useAuthStore((s) => s.user);
  const globalLocation = useLocationStore((s) => s.location);

  const [isProcessing, setIsProcessing] = useState(false);

  const cartStore = cart?.store as
    | { deliveryType?: string; latitude?: number | null; longitude?: number | null }
    | null
    | undefined;
  const storeDeliveryType = String(cartStore?.deliveryType ?? "").toUpperCase();
  const storeHasGeo =
    cartStore != null && cartStore.latitude != null && cartStore.longitude != null;

  // Shops that only do pickup: PICKUP_ONLY, or shops without coordinates set.
  const isPickupOnlyStore =
    cartStore == null
      ? false
      : storeDeliveryType === "PICKUP_ONLY" || !storeHasGeo;

  // Shops configured to deliver can additionally offer pickup at checkout.
  const canChoosePickup =
    storeDeliveryType === "MERCHANT_SELF" || storeDeliveryType === "HYBRID";

  // Only show Delivery / Pickup toggles when the shop can actually deliver.
  const showFulfillmentChoice = canChoosePickup && !isPickupOnlyStore;

  const [fulfillment, setFulfillment] = useState<OrderFulfillmentType>("MERCHANT_DELIVERY");

  React.useEffect(() => {
    if (isPickupOnlyStore) {
      setFulfillment("PICKUP");
    }
  }, [isPickupOnlyStore]);

  // The effective fulfillment for this checkout.
  const isPickup = isPickupOnlyStore || fulfillment === "PICKUP";

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("COD");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [paymentSheet, setPaymentSheet] = useState<{
    orderId: string;
    amount: number;
    channel: PaymentChannelOption;
  } | null>(null);

  const [isCouponFocused, setIsCouponFocused] = useState(false);

  // Address Form States
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Kathmandu");
  const [landmark, setLandmark] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const getInitialPhoneState = () => {
    const raw = user?.phone && !user.phone.startsWith("guest_") ? user.phone : "";
    if (raw.startsWith("+977")) return { code: "+977", phone: raw.replace("+977", "") };
    if (raw.startsWith("+91")) return { code: "+91", phone: raw.replace("+91", "") };
    return { code: DEFAULT_COUNTRY_CODE, phone: raw };
  };

  const [countryCode, setCountryCode] = useState(getInitialPhoneState().code);
  const [contactPhone, setContactPhone] = useState(getInitialPhoneState().phone);
  const [buildingName, setBuildingName] = useState("");
  const [floor, setFloor] = useState("");
  const [latitude, setLatitude] = useState(27.7172);
  const [longitude, setLongitude] = useState(85.324);
  const [addressError, setAddressError] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [hasInitializedAddress, setHasInitializedAddress] = useState(false);

  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleSelectAddress = (addr: any) => {
    setSelectedAddress(addr.id);
    setContactName(addr.contactName || "");
    const rawPhone = addr.contactPhone || "";
    if (rawPhone.startsWith("+977")) {
      setCountryCode("+977");
      setContactPhone(rawPhone.replace("+977", ""));
    } else if (rawPhone.startsWith("+91")) {
      setCountryCode("+91");
      setContactPhone(rawPhone.replace("+91", ""));
    } else {
      setContactPhone(rawPhone);
    }
    setAddressLine(addr.addressLine || "");
    setBuildingName(addr.buildingName || "");
    setFloor(addr.floor || "");
    setLandmark(addr.landmark || "");
    setCity(addr.city || "Kathmandu");
    setLatitude(addr.latitude ?? 27.7172);
    setLongitude(addr.longitude ?? 85.324);
    setLabel(addr.label || "Home");
  };

  React.useEffect(() => {
    if (addresses && addresses.length > 0 && !hasInitializedAddress) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      handleSelectAddress(def);
      setHasInitializedAddress(true);
    }
  }, [addresses]);

  React.useEffect(() => {
    if (globalLocation) {
      setLatitude(globalLocation.latitude);
      setLongitude(globalLocation.longitude);
      if (globalLocation.formattedAddress || globalLocation.address) {
        setAddressLine(globalLocation.formattedAddress || globalLocation.address || "");
      }
      if (globalLocation.city) {
        setCity(globalLocation.city);
      }
      setSelectedAddress(null); // Unselect saved address since it's a new location
    }
  }, [globalLocation]);

  const selectedAddressObj = useMemo(() => {
    if (!selectedAddress) return null;
    return addresses?.find((a) => a.id === selectedAddress) || null;
  }, [selectedAddress, addresses]);

  const isAddressModified = useMemo(() => {
    if (!selectedAddressObj) return true;
    const fullPhone = `${countryCode}${contactPhone.trim()}`;
    return (
      label !== selectedAddressObj.label ||
      addressLine !== selectedAddressObj.addressLine ||
      city !== selectedAddressObj.city ||
      landmark !== (selectedAddressObj.landmark || "") ||
      contactName !== (selectedAddressObj.contactName || "") ||
      fullPhone !== (selectedAddressObj.contactPhone || "") ||
      buildingName !== (selectedAddressObj.buildingName || "") ||
      floor !== (selectedAddressObj.floor || "")
    );
  }, [
    selectedAddressObj,
    label,
    addressLine,
    city,
    landmark,
    contactName,
    contactPhone,
    countryCode,
    buildingName,
    floor,
  ]);

  const fetchCurrentLocation = () => {
    router.push("/location");
  };

  const paymentMethods = useMemo(() => {
    return ALL_METHODS.filter((m) => {
      if (m.key === "COD") return paymentConfig?.cod !== false;
      if (m.key === "KHALTI") return paymentConfig?.khalti === true;
      if (m.key === "ESEWA") return paymentConfig?.esewa === true;
      return false;
    });
  }, [paymentConfig]);

  const paymentCapabilities = useMemo(
    () => ({
      cod: paymentConfig?.cod !== false,
      khalti: paymentConfig?.khalti === true,
      esewa: paymentConfig?.esewa === true,
      fonepay: paymentConfig?.fonepay === true,
      skypay: paymentConfig?.skypay === true,
      aggregator: paymentConfig?.aggregator,
    }),
    [paymentConfig],
  );

  const defaultAddress = addresses?.find((a) => a.isDefault) || addresses?.[0];
  const canCheckout = cart
    ? isSingleStoreCart(cart) && cart.items.length > 0
    : false;
  const storeId = cart?.storeId ?? cart?.items?.[0]?.product?.storeId;
  const storeName = getCartStoreName(cart);

  if (cart && !canCheckout && paymentSheet === null && !isProcessing) {
    const isCartEmpty = cart.items.length === 0;
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <WebPageShell>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons
                name="arrow-back"
                size={22}
                color={colors.neutral[800]}
              />
            </Pressable>
            <GText variant="h2" color={colors.neutral[900]}>
              {t("checkout.title")}
            </GText>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.blockedWrap}>
            <Ionicons
              name={isCartEmpty ? "cart-outline" : "storefront-outline"}
              size={48}
              color={colors.neutral[400]}
            />
            <GText variant="h3" color={colors.neutral[900]} align="center">
              {isCartEmpty ? "Your cart is empty" : t("cart.multiShopWarning")}
            </GText>
            <GText variant="body" color={colors.neutral[500]} align="center">
              {isCartEmpty ? "Add some items before checking out." : t("cart.singleShopOnly")}
            </GText>
            <Button
              label={t("cart.backToCart")}
              fullWidth
              onPress={() => router.replace("/(tabs)/cart" as any)}
            />
          </View>
        </WebPageShell>
      </SafeAreaView>
    );
  }

  // Show a loading screen if processing
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <WebPageShell>
          <View style={[styles.blockedWrap, { flex: 1, justifyContent: "center" }]}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <GText variant="h3" color={colors.neutral[900]} align="center" style={{ marginTop: spacing.md }}>
              Processing Checkout...
            </GText>
            <GText variant="body" color={colors.neutral[500]} align="center">
              Please wait while we redirect you.
            </GText>
          </View>
        </WebPageShell>
      </SafeAreaView>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !storeId) {
      setCouponError(t("checkout.couponError"));
      return;
    }
    setCouponError("");
    try {
      const { data } = await apiClient.post<{
        data: { discountAmount: number };
      }>(ENDPOINTS.growth.validateCoupon, {
        code: couponCode.trim().toUpperCase(),
        storeId,
        orderValue: cart?.subtotal ?? 0,
      });
      setCouponDiscount(data.data.discountAmount ?? 0);
    } catch (err) {
      setCouponDiscount(0);
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { error?: { message?: string } })?.error
            ?.message ?? t("checkout.invalidCode"))
        : t("checkout.invalidCode");
      setCouponError(message);
    }
  };

  const displayTotal = Math.max(
    0,
    getCartTotalForDisplay(cart) - couponDiscount,
  );

  const processOrder = async () => {
    setIsProcessing(true);
    try {
      let finalAddressId = selectedAddress;

      if (!isPickup && (!selectedAddress || isAddressModified)) {
        const newAddr = await createAddress.mutateAsync({
          label: label || "Home",
          addressLine: addressLine.trim(),
          city: city.trim(),
          landmark: landmark.trim() || undefined,
          contactName: contactName.trim(),
          contactPhone: `${countryCode}${contactPhone.trim()}`,
          buildingName: buildingName.trim(),
          floor: floor.trim() || undefined,
          latitude,
          longitude,
          isDefault: true,
        });
        finalAddressId = newAddr.id;
      }

      const result = await checkout.mutateAsync({
        fulfillmentType: isPickup ? "PICKUP" : "MERCHANT_DELIVERY",
        ...(isPickup ? {} : { deliveryAddressId: finalAddressId! }),
        paymentMethod: selectedPayment,
        ...(couponCode.trim()
          ? { couponCode: couponCode.trim().toUpperCase() }
          : {}),
      });

      if (selectedPayment === "COD" || selectedPayment === null) {
        router.push('/(tabs)/' as any);
        setTimeout(() => {
          router.push(`/order/${result.order.id}` as any);
        }, 100);
        return;
      }

      // Initialize online payment directly
      try {
        const { data } = await apiClient.post<{
          data: {
            paymentUrl?: string;
            deepLink?: string;
            mock?: boolean;
            paymentId?: string;
            provider: string;
            formPost?: { action: string; fields: Record<string, string> };
          };
        }>(ENDPOINTS.payment.checkoutInit, {
          orderId: result.order.id,
          channel: selectedPayment,
        });
        
        const pay = data.data;

        if (pay.formPost && Platform.OS === "web") {
          submitPaymentFormPost(pay.formPost.action, pay.formPost.fields);
          return;
        }

        const url = pay.deepLink || pay.paymentUrl;
        if (url) {
          if (Platform.OS === "web") {
            window.location.href = url;
            return;
          } else {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) await Linking.openURL(url);
            else if (pay.paymentUrl) await Linking.openURL(pay.paymentUrl);
          }
        }

        // On mobile, once the external payment app/browser is opened, 
        // we move the user to their order tracking page, but first reset to home
        // so back button doesn't show the empty cart.
        router.push('/(tabs)/' as any);
        setTimeout(() => {
          router.push(`/order/${result.order.id}` as any);
        }, 100);
      } catch (paymentErr) {
        setIsProcessing(false);
        // If payment fails to initiate, route them to the order page so they can retry there!
        Alert.alert(
          t("order.paymentError" as any, { defaultValue: "Payment failed to start" } as any) as any,
          t("order.paymentErrorRetry" as any, { defaultValue: "Your order was placed, but payment couldn't be started. You can retry paying from the order details." } as any) as any
        );
        router.push('/(tabs)/' as any);
        setTimeout(() => {
          router.push(`/order/${result.order.id}` as any);
        }, 100);
      }
    } catch (err) {
      setIsProcessing(false);
      let message = t("checkout.failedMsg");
      if (axios.isAxiosError(err)) {
        const body = err.response?.data as
          | { error?: { message?: string }; message?: string }
          | undefined;
        message =
          body?.error?.message ?? body?.message ?? err.message ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert(t("checkout.failed"), message);
    }
  };

  const handleCheckout = async () => {
    if (!canCheckout) {
      Alert.alert(t("checkout.failed"), t("cart.singleShopOnly"));
      return;
    }

    const fullContactPhone = `${countryCode}${contactPhone.trim()}`;

    // Validation
    if (!contactName.trim()) {
      setAddressError("Contact name is required");
      return;
    }
    if (!contactPhone.trim() || contactPhone.trim().length < 8) {
      setAddressError("Valid contact phone number is required");
      return;
    }
    if (!isPickup) {
      if (!addressLine.trim() || addressLine.trim().length < 5) {
        setAddressError(
          "Please enter a valid street / area address (min 5 chars)",
        );
        return;
      }
      if (!city.trim()) {
        setAddressError("City is required");
        return;
      }
    }

    setAddressError("");

    const minPaisa = paymentConfig?.minOnlineAmountPaisa ?? 1000;
    const totalPaisa = Math.round((cart?.total ?? 0) * 100);
    if (selectedPayment !== "COD" && totalPaisa < minPaisa) {
      Alert.alert(
        t("checkout.minAmount"),
        t("checkout.minAmountMsg", { amount: formatMoney(minPaisa / 100) }),
      );
      return;
    }

    const currentUser = useAuthStore.getState().user;
    
    // We allow guest checkout, so we don't force OTP authentication here.
    // The backend will process the order under the guest session.
    // If we wanted to force signup, we would prompt OTP here.

    await processOrder();
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const { data } = await apiClient.post("/auth/otp/verify", {
        phone: `${countryCode}${contactPhone.trim()}`,
        otp: otpCode,
      });
      if (data?.data?.tokens) {
        await setTokens(
          data.data.tokens.accessToken,
          data.data.tokens.refreshToken,
        );
        useAuthStore.getState().setUser(data.data.user);
        setShowOtpModal(false);
        // Resume checkout now that they are authenticated
        await processOrder();
      }
    } catch (err) {
      let message = "Invalid OTP. Please try again.";
      if (axios.isAxiosError(err)) {
        message = (err.response?.data as any)?.error?.message ?? err.message;
      }
      setOtpError(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
      await apiClient.post("/auth/otp/send", { phone: `${countryCode}${contactPhone.trim()}` });
      setOtpError("OTP Resent successfully!");
    } catch (err) {
      let message = "Failed to resend OTP.";
      if (axios.isAxiosError(err)) {
        message = (err.response?.data as any)?.error?.message ?? err.message;
      }
      setOtpError(message);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <WebPageShell>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
          </Pressable>
          <GText variant="h2" color={colors.neutral[900]}>
            {t("checkout.title")}
          </GText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {storeName ? (
            <View style={styles.shopBanner}>
              <Ionicons
                name="storefront-outline"
                size={18}
                color={colors.primary[600]}
              />
              <GText variant="bodySm" color={colors.neutral[700]}>
                {t("cart.orderingFrom", { store: storeName })}
              </GText>
            </View>
          ) : null}

          <Animated.View
            entering={FadeInDown.delay(50).duration(300)}
            style={styles.section}
          >
            {showFulfillmentChoice ? (
              <View style={styles.fulfillmentRow}>
                <Pressable
                  onPress={() => setFulfillment("MERCHANT_DELIVERY")}
                  style={[
                    styles.fulfillmentChip,
                    fulfillment !== "PICKUP" && styles.fulfillmentChipOn,
                  ]}
                >
                  <Ionicons
                    name="bicycle-outline"
                    size={18}
                    color={
                      fulfillment !== "PICKUP"
                        ? colors.primary[700]
                        : colors.neutral[500]
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <GText
                      variant="body"
                      weight={fulfillment !== "PICKUP" ? "semibold" : "regular"}
                      color={
                        fulfillment !== "PICKUP"
                          ? colors.primary[700]
                          : colors.neutral[700]
                      }
                    >
                      {t("checkout.fulfillmentDelivery", { defaultValue: "Delivery" })}
                    </GText>
                    <GText variant="caption" color={colors.neutral[500]}>
                      {t("checkout.fulfillmentDeliverySub", { defaultValue: "Shop delivers to your address" })}
                    </GText>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setFulfillment("PICKUP");
                    setSelectedAddress(null);
                  }}
                  style={[
                    styles.fulfillmentChip,
                    fulfillment === "PICKUP" && styles.fulfillmentChipOn,
                  ]}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={18}
                    color={
                      fulfillment === "PICKUP"
                        ? colors.primary[700]
                        : colors.neutral[500]
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <GText
                      variant="body"
                      weight={fulfillment === "PICKUP" ? "semibold" : "regular"}
                      color={
                        fulfillment === "PICKUP"
                          ? colors.primary[700]
                          : colors.neutral[700]
                      }
                    >
                      {t("checkout.fulfillmentPickup", { defaultValue: "Store pickup" })}
                    </GText>
                    <GText variant="caption" color={colors.neutral[500]}>
                      {t("checkout.fulfillmentPickupSub", { defaultValue: "Collect from the shop" })}
                    </GText>
                  </View>
                </Pressable>
              </View>
            ) : null}

            {isPickup ? (
              <View style={styles.pickupNotice}>
                <Ionicons name="storefront-outline" size={28} color={colors.primary[600]} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <GText variant="body" weight="semibold" color={colors.neutral[900]}>
                    {t("checkout.fulfillmentPickup", { defaultValue: "Store Pickup" })}
                  </GText>
                  <GText variant="bodySm" color={colors.neutral[600]}>
                    {isPickupOnlyStore
                      ? "This shop hasn't set up delivery yet. Your order will be prepared for pickup."
                      : "Your order will be prepared for pickup. We'll notify you when it's ready."}
                  </GText>
                </View>
              </View>
            ) : null}

            <GText
              variant="h4"
              color={colors.neutral[900]}
              style={styles.sectionTitle}
            >
              {isPickup ? "Contact Details" : t("checkout.deliveryAddress")}
            </GText>

            {!isPickup && addresses && addresses.length > 0 ? (
              <View>
                <GText
                  variant="caption"
                  color={colors.neutral[500]}
                  style={{ marginBottom: spacing.sm }}
                >
                  Select Saved Address
                </GText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.savedAddressesList}
                >
                  {addresses.map((addr) => {
                    const isSel =
                      (selectedAddress || defaultAddress?.id) === addr.id;
                    return (
                      <Pressable
                        key={addr.id}
                        onPress={() => handleSelectAddress(addr)}
                        style={[
                          styles.savedAddressChip,
                          isSel && styles.savedAddressChipSelected,
                        ]}
                      >
                        <GText
                          variant="bodySm"
                          weight={isSel ? "semibold" : "regular"}
                          color={
                            isSel ? colors.primary[700] : colors.neutral[700]
                          }
                        >
                          {addr.label} ({addr.city})
                        </GText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {!isPickup ? (
              <Pressable
                style={styles.locationBtn}
                onPress={fetchCurrentLocation}
                disabled={isFetchingLocation}
              >
                <Ionicons name="location" size={18} color={colors.primary[600]} />
                <GText
                  variant="bodySm"
                  weight="semibold"
                  color={colors.primary[600]}
                >
                  {isFetchingLocation ? "Locating..." : "Use Current Location"}
                </GText>
              </Pressable>
            ) : null}

            <View style={styles.addressForm}>
              {/* Contact Name & Phone */}
              <View style={{ gap: spacing.lg }}>
                <View>
                  <GText
                    variant="caption"
                    color={colors.neutral[500]}
                    style={styles.inputLabel}
                  >
                    Contact Name
                  </GText>
                  <TextInput
                    style={styles.input}
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder="e.g. John Doe"
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View>
                  <GText
                    variant="caption"
                    color={colors.neutral[500]}
                    style={styles.inputLabel}
                  >
                    Contact Phone
                  </GText>
                  <PhoneInput
                    countryCode={countryCode}
                    phone={contactPhone}
                    onCountryCodeChange={setCountryCode}
                    onPhoneChange={setContactPhone}
                    placeholder="e.g. 98XXXXXXXX"
                  />
                </View>
              </View>

              {!isPickup ? (
                <View style={{ gap: spacing.lg }}>
                  {/* Street Address */}
                  <View>
                    <GText
                      variant="caption"
                      color={colors.neutral[500]}
                      style={styles.inputLabel}
                    >
                      {t("addressNew.streetArea")}
                    </GText>
                    <TextInput
                      style={styles.input}
                      value={addressLine}
                      onChangeText={setAddressLine}
                      placeholder={t("addressNew.streetPlaceholder")}
                      placeholderTextColor={colors.neutral[400]}
                    />
                  </View>

                  {/* House/Flat & Floor */}
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <GText
                        variant="caption"
                        color={colors.neutral[500]}
                        style={styles.inputLabel}
                      >
                        Flat / Building
                      </GText>
                      <TextInput
                        style={styles.input}
                        value={buildingName}
                        onChangeText={setBuildingName}
                        placeholder="e.g. Flat 402"
                        placeholderTextColor={colors.neutral[400]}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <GText
                        variant="caption"
                        color={colors.neutral[500]}
                        style={styles.inputLabel}
                      >
                        Floor (optional)
                      </GText>
                      <TextInput
                        style={styles.input}
                        value={floor}
                        onChangeText={setFloor}
                        placeholder="e.g. 4th"
                        placeholderTextColor={colors.neutral[400]}
                      />
                    </View>
                  </View>

                  {/* Landmark & City */}
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <GText
                        variant="caption"
                        color={colors.neutral[500]}
                        style={styles.inputLabel}
                      >
                        {t("addressNew.landmark")}
                      </GText>
                      <TextInput
                        style={styles.input}
                        value={landmark}
                        onChangeText={setLandmark}
                        placeholder="e.g. Near Big Mart"
                        placeholderTextColor={colors.neutral[400]}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <GText
                        variant="caption"
                        color={colors.neutral[500]}
                        style={styles.inputLabel}
                      >
                        {t("addressNew.city")}
                      </GText>
                      <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Kathmandu"
                        placeholderTextColor={colors.neutral[400]}
                      />
                    </View>
                  </View>

                  {/* Save Address As Label Selection */}
                  <View>
                    <GText
                      variant="caption"
                      color={colors.neutral[500]}
                      style={styles.inputLabel}
                    >
                      Save address as:
                    </GText>
                    <View style={styles.chipRow}>
                      {(
                        [
                          { value: "Home", labelKey: "addressNew.home" },
                          { value: "Work", labelKey: "addressNew.work" },
                          { value: "Other", labelKey: "addressNew.other" },
                        ] as const
                      ).map((l) => (
                        <Pressable
                          key={l.value}
                          onPress={() => setLabel(l.value)}
                          style={[styles.chip, label === l.value && styles.chipOn]}
                        >
                          <GText
                            variant="bodySm"
                            weight={label === l.value ? "semibold" : "regular"}
                            color={
                              label === l.value
                                ? colors.primary[700]
                                : colors.neutral[700]
                            }
                          >
                            {t(l.labelKey as TranslationKey)}
                          </GText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              ) : null}

              {addressError ? (
                <GText variant="bodySm" color={colors.error.main}>
                  {addressError}
                </GText>
              ) : null}
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(300)}
            style={styles.section}
          >
            <GText
              variant="h4"
              color={colors.neutral[900]}
              style={styles.sectionTitle}
            >
              {t("checkout.promoCode")}
            </GText>
            <View
              style={[
                styles.couponRow,
                isCouponFocused && styles.couponRowFocused,
              ]}
            >
              <TextInput
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text.toUpperCase());
                  setCouponDiscount(0);
                  setCouponError("");
                }}
                placeholder={t("checkout.enterCode")}
                autoCapitalize="characters"
                onFocus={() => setIsCouponFocused(true)}
                onBlur={() => setIsCouponFocused(false)}
                style={styles.couponInput}
                placeholderTextColor={colors.neutral[400]}
              />
              <Pressable
                style={styles.couponApplyBtn}
                onPress={() => void handleApplyCoupon()}
              >
                <GText
                  variant="bodySm"
                  weight="semibold"
                  color={colors.primary[600]}
                >
                  {t("checkout.apply")}
                </GText>
              </Pressable>
            </View>
            {couponDiscount > 0 ? (
              <GText variant="caption" color={colors.success.main}>
                {t("checkout.discountLabel", {
                  amount: formatMoney(couponDiscount),
                })}
              </GText>
            ) : null}
            {couponError ? (
              <GText variant="caption" color={colors.error.main}>
                {couponError}
              </GText>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            style={styles.section}
          >
            <GText
              variant="h4"
              color={colors.neutral[900]}
              style={styles.sectionTitle}
            >
              {t("checkout.paymentMethod")}
            </GText>
            {paymentMethods.length === 0 ? (
              <GText variant="bodySm" color={colors.neutral[500]}>
                {t("checkout.loadingPayment")}
              </GText>
            ) : (
              <View style={styles.paymentMethods}>
                {paymentMethods.map((pm) => (
                  <Pressable
                    key={pm.key}
                    onPress={() => setSelectedPayment(pm.key)}
                    style={[
                      styles.paymentCard,
                      selectedPayment === pm.key && styles.paymentSelected,
                    ]}
                  >
                    <PaymentBrandIcon method={pm.key} size={40} />
                    <View style={{ flex: 1 }}>
                      <GText variant="body" weight="medium">
                        {t(pm.labelKey)}
                      </GText>
                      <GText variant="caption" color={colors.neutral[500]}>
                        {t(pm.subtitleKey)}
                      </GText>
                    </View>
                    <Ionicons
                      name={
                        selectedPayment === pm.key
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={
                        selectedPayment === pm.key
                          ? colors.primary[500]
                          : colors.neutral[300]
                      }
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>

          {cart && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(300)}
              style={styles.section}
            >
              <Card variant="tinted" style={styles.summary}>
                <GText variant="h4">{t("checkout.orderSummary")}</GText>
                <View style={styles.summaryRow}>
                  <GText variant="body" color={colors.neutral[600]}>
                    {t("checkout.itemsCount", { count: cart.items.length })}
                  </GText>
                  <GText variant="body" weight="medium">
                    {formatMoney(cart.subtotal)}
                  </GText>
                </View>
                <DeliveryFeeLine cart={cart} pickup={isPickup} />
                <View style={styles.summaryRow}>
                  <GText variant="body" color={colors.neutral[600]}>
                    Platform Fee
                  </GText>
                  <GText variant="body" weight="medium">
                    {formatMoney(cart.platformFee ?? 10)}
                  </GText>
                </View>
                {couponDiscount > 0 ? (
                  <View style={styles.summaryRow}>
                    <GText variant="body" color={colors.neutral[600]}>
                      {t("checkout.promoDiscount")}
                    </GText>
                    <GText
                      variant="body"
                      weight="medium"
                      color={colors.success.main}
                    >
                      −{formatMoney(couponDiscount)}
                    </GText>
                  </View>
                ) : null}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <View>
                    <GText variant="h3">{t("common.total")}</GText>
                    {cart.deliveryFeeStatus === "shop_set" ? (
                      <GText variant="caption" color={colors.neutral[500]}>
                        {t("common.exclDelivery")}
                      </GText>
                    ) : null}
                  </View>
                  <GText variant="h3" color={colors.primary[700]}>
                    {formatMoney(displayTotal)}
                  </GText>
                </View>
              </Card>
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            label={
              selectedPayment === "COD" || selectedPayment === null
                ? t("checkout.placeOrder", {
                    amount: formatMoney(displayTotal),
                  })
                : t("checkout.payNow", {
                    amount: formatMoney(displayTotal),
                    defaultValue: `Pay Now · ${formatMoney(displayTotal)}`,
                  })
            }
            fullWidth
            size="lg"
            loading={checkout.isPending || createAddress.isPending}
            disabled={paymentMethods.length === 0}
            onPress={handleCheckout}
          />
        </View>
      </WebPageShell>

      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.otpCard}>
            <GText variant="h3" style={{ marginBottom: spacing.sm }}>
              Verify your Phone
            </GText>
            <GText
              variant="body"
              color={colors.neutral[500]}
              style={{ marginBottom: spacing.lg }}
            >
              We've sent a 6-digit OTP to {contactPhone}
            </GText>

            <TextInput
              style={styles.otpInput}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {otpError ? (
              <GText
                variant="caption"
                color={
                  otpError.includes("Resent")
                    ? colors.success.main
                    : colors.error.main
                }
                style={{ marginTop: spacing.sm }}
              >
                {otpError}
              </GText>
            ) : null}

            <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
              <Button
                label="Verify & Place Order"
                fullWidth
                onPress={handleVerifyOtp}
                loading={otpLoading}
                disabled={otpCode.length !== 6}
              />
              <Pressable
                onPress={handleResendOtp}
                disabled={otpLoading}
                style={{ padding: spacing.sm, alignItems: "center" }}
              >
                <GText
                  variant="bodySm"
                  weight="semibold"
                  color={colors.primary[600]}
                >
                  Resend OTP
                </GText>
              </Pressable>
              <Pressable
                onPress={() => setShowOtpModal(false)}
                style={{ padding: spacing.sm, alignItems: "center" }}
              >
                <GText variant="bodySm" color={colors.neutral[500]}>
                  Cancel
                </GText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
