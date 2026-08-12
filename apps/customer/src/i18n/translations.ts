// Flat, dotted-key translations for the customer app.
// `en` is the source of truth; `ne` must contain the exact same keys.
// Brand names (GoPasal, Khalti, eSewa) intentionally stay in their normal scripts.

const en = {
  // Common / shared
  'common.seeAll': 'See all →',
  'common.login': 'Login',
  'common.profile': 'Profile',
  'common.search': 'Search',
  'common.add': 'Add',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.continue': 'Continue',
  'common.backToHome': 'Back to home',
  'common.goHome': 'Go Home',
  'common.tryAgain': 'Try Again',
  'common.free': 'FREE',
  'common.total': 'Total',
  'common.subtotal': 'Subtotal',
  'common.platformFee': 'Platform Fee',
  'common.delivery': 'Delivery',
  'common.deliveryFee': 'Delivery Fee',
  'common.deliverySetByShop': 'Set by shop',
  'common.deliveryShopHint': 'Each shop sets its own delivery charge. The final fee is confirmed at checkout.',
  'common.exclDelivery': 'excl. delivery',
  'common.discount': 'Discount',
  'common.oops': 'Oops!',
  'common.somethingWentWrong': 'Something went wrong',
  'common.browseShops': 'Browse Shops',
  'common.browseProducts': 'Browse Products',

  // Tab bar / navigation
  'nav.home': 'Home',
  'nav.categories': 'Categories',
  'nav.cart': 'Cart',
  'nav.orders': 'Orders',
  'nav.profile': 'Profile',

  // Web header
  'header.deliverTo': 'Deliver to',
  'header.setLocation': 'Set your location',
  'header.searchPlaceholder': 'Search "groceries and more"',
  'header.myCart': 'My Cart',
  'header.itemsCount': '{count} items',

  // Hero banner
  'hero.eyebrow': 'SHOP LOCAL · SUPPORT YOUR NEIGHBOURHOOD',
  'hero.title': 'Your neighbourhood\nshops, in one app.',
  'hero.subtitle':
    'Discover groceries, fresh produce and everyday essentials from trusted local sellers — ordered in a tap and delivered by the shop you buy from.',
  'hero.startShopping': 'Start shopping',
  'hero.exploreShops': 'Explore shops',
  'hero.trustFresh': 'Fresh & local',
  'hero.trustGenuine': 'Genuine products',
  'hero.trustPay': 'Pay online or cash',

  // Home
  'home.shopByCategory': 'Shop by Category',
  'home.popularNearYou': 'Popular Near You',
  'home.recommendedForYou': 'Recommended for You',
  'home.comingSoonTitle': 'Coming soon to your area',
  'home.comingSoonText':
    "We're not delivering here just yet — local shops are joining GoPasal every week. Stay tuned, we'll be at your doorstep soon!",
  'home.changeLocation': 'Change delivery location',
  'home.selectLocation': 'Select Location',

  // Web footer
  'footer.brandDesc':
    'Your neighborhood marketplace. Quick delivery of groceries, electronics, beauty products and more.',
  'footer.quickLinks': 'Quick Links',
  'footer.customerService': 'Customer Service',
  'footer.explore': 'Explore',
  'footer.home': 'Home',
  'footer.categories': 'Categories',
  'footer.myOrders': 'My Orders',
  'footer.myProfile': 'My Profile',
  'footer.helpSupport': 'Help & Support',
  'footer.offers': 'Offers',
  'footer.notifications': 'Notifications',
  'footer.settings': 'Settings',
  'footer.browseCategories': 'Browse Categories',
  'footer.search': 'Search',
  'footer.wishlist': 'Wishlist',
  'footer.gold': 'GoPasal Gold',
  'footer.addresses': 'Addresses',
  'footer.copyright': '© 2026 GoPasal. All rights reserved.',

  // Categories
  'categories.title': 'Categories',
  'categories.all': 'All',
  'categories.noProducts': 'No products yet',
  'categories.noProductsMsg': 'Products in this category will appear here',

  // Cart
  'cart.title': 'Cart',
  'cart.clearAll': 'Clear All',
  'cart.empty': 'Your cart is empty',
  'cart.emptyMsg': 'Add items from your favorite shops to get started',
  'cart.failedLoad': 'Failed to load cart',
  'cart.orderSummary': 'Order Summary',
  'cart.proceedToCheckout': 'Proceed to Checkout · {amount}',
  'cart.orderingFrom': 'Ordering from {store}',
  'cart.singleShopOnly': 'Checkout is only available when all items are from one shop.',
  'cart.multiShopWarning': 'Your cart has items from more than one shop.',
  'cart.backToCart': 'Back to cart',
  'cart.differentShopTitle': 'Different shop',
  'cart.differentShopMsg': 'Your cart has items from another shop. Clear the cart and add this item instead?',
  'cart.clearAndAdd': 'Clear & add',

  // Orders
  'orders.title': 'Your Orders',
  'orders.active': 'Active ({count})',
  'orders.past': 'Past ({count})',
  'orders.noActive': 'No active orders',
  'orders.noPast': 'No past orders',
  'orders.noActiveMsg': 'Your active orders will appear here',
  'orders.noPastMsg': 'Your completed orders will appear here',
  'orders.orderNum': 'Order #{id}',
  'orders.viewDetails': 'View Details',

  // Profile
  'profile.guestUser': 'Guest User',
  'profile.signInToContinue': 'Sign in to continue',
  'profile.tapToAddName': 'Tap edit to add your name',
  'profile.signIn': 'Sign In',
  'profile.signOut': 'Sign Out',
  'profile.editProfile': 'Edit profile',
  'profile.yourName': 'Your name',
  'profile.appInfo': 'GoPasal v{version} · Kathmandu, Nepal',
  'profile.myOrders': 'My Orders',
  'profile.savedAddresses': 'Saved Addresses',
  'profile.wishlist': 'Wishlist',
  'profile.gold': 'GoPasal Gold',
  'profile.notifications': 'Notifications',
  'profile.offers': 'Offers & Deals',
  'profile.settings': 'Settings',
  'profile.helpSupport': 'Help & Support',

  // Search
  'search.placeholderWeb': 'Search products and shops',
  'search.products': 'Products',
  'search.shops': 'Shops',
  'search.relevance': 'Relevance',
  'search.priceLowHigh': 'Price: Low → High',
  'search.priceHighLow': 'Price: High → Low',
  'search.topRated': 'Top Rated',
  'search.starsPlus': '{count}+ Stars',
  'search.browseCategories': 'Browse Categories',
  'search.noResults': 'No results found',
  'search.noResultsMsg': 'No products found for "{query}"',
  'search.noShops': 'No shops available',
  'search.tryDifferent': 'Try a different search term',
  'search.noShopsDeliver': 'No shops deliver to your location yet',

  // Location
  'location.title': 'Set Your Location',
  'location.subtitle': 'We use your location to show shops that deliver to you.',
  'location.searchPlaceholder': 'Search area, street, landmark…',
  'location.useCurrentLocation': 'Use Current Location',
  'location.gettingLocation': 'Getting location…',
  'location.errBlocked':
    'Location is blocked. Allow location for this site in your browser, or search your exact area below.',
  'location.errUnsupported': 'This browser does not support location. Please search your area below.',
  'location.errTimeout': 'Getting your location took too long. Try again, or search your area below.',
  'location.errUnavailable': 'Could not detect your location. Please search your exact area below.',
  'location.errNoMatch': 'No matching places found. Try a nearby landmark or area name.',
  'location.errSearchFailed': 'Address search failed. Check your connection.',

  // Addresses
  'addresses.title': 'Addresses',
  'addresses.none': 'No addresses',
  'addresses.noneMsg': 'Add your delivery address to get started',
  'addresses.addAddress': 'Add address',
  'addresses.default': 'Default',

  // Add address
  'addressNew.title': 'Add address',
  'addressNew.home': 'Home',
  'addressNew.work': 'Work',
  'addressNew.other': 'Other',
  'addressNew.streetArea': 'Street / area',
  'addressNew.streetPlaceholder': 'Ward, street, building',
  'addressNew.city': 'City',
  'addressNew.landmark': 'Landmark (optional)',
  'addressNew.errFull': 'Enter a full street address.',
  'addressNew.errSave': 'Could not save address. Sign in and try again.',
  'addressNew.save': 'Save address',

  // Support chat
  'support.chatGreeting': "Hi! I'm the GoPasal assistant. Ask about your order status, missing items, or refunds.",
  'support.chatError': "I couldn't reach support right now. Try again or call us directly.",
  'support.chatTitle': 'GoPasal Assistant',
  'support.chatOnline': 'Instant answers',
  'support.chatPlaceholder': 'Type your question…',

  // Checkout
  'checkout.title': 'Checkout',
  'checkout.deliveryAddress': 'Delivery Address',
  'checkout.addNewAddress': 'Add New Address',
  'checkout.promoCode': 'Promo code',
  'checkout.enterCode': 'Enter code',
  'checkout.apply': 'Apply',
  'checkout.discountLabel': 'Discount: −{amount}',
  'checkout.paymentMethod': 'Payment Method',
  'checkout.loadingPayment': 'Loading payment options…',
  'checkout.orderSummary': 'Order Summary',
  'checkout.itemsCount': 'Items ({count})',
  'checkout.promoDiscount': 'Promo discount',
  'checkout.placeOrder': 'Place Order · {amount}',
  'checkout.payNow': 'Pay Now · {amount}',
  'checkout.cod': 'Cash on Delivery',
  'checkout.codSub': 'Pay when your order arrives',
  'checkout.khalti': 'Khalti',
  'checkout.khaltiSub': 'Pay now',
  'checkout.esewa': 'eSewa',
  'checkout.esewaSub': 'Pay now',
  'checkout.addressRequired': 'Address required',
  'checkout.addressRequiredMsg': 'Add a delivery address before checkout.',
  'checkout.minAmount': 'Minimum amount',
  'checkout.minAmountMsg': 'Online payments need at least {amount}. Add more items or use cash on delivery.',
  'checkout.failed': 'Checkout failed',
  'checkout.failedMsg': 'Could not place order. Try again.',
  'checkout.couponError': 'Enter a code and ensure your cart has items.',
  'checkout.invalidCode': 'Invalid code',
  'checkout.fulfillmentDelivery': 'Delivery',
  'checkout.fulfillmentDeliverySub': 'Shop delivers to your address',
  'checkout.fulfillmentPickup': 'Store pickup',
  'checkout.fulfillmentPickupSub': 'Collect from the shop',
  'checkout.pickupLabel': 'Store pickup',
  'checkout.pickupFeeHint': 'No delivery charge — you collect the order.',

  // Wishlist
  'wishlist.title': 'Wishlist',
  'wishlist.empty': 'Your wishlist is empty',
  'wishlist.emptyMsg': 'Save your favorite items here for easy access',
  'wishlist.loginRequiredTitle': 'Login Required',
  'wishlist.loginRequiredMsg': 'You need to log in to save items to your wishlist.',

  // Offers
  'offers.title': 'Offers & Deals',
  'offers.none': 'No offers',
  'offers.noneMsg': 'Check back soon for exciting deals!',
  'offers.percentOff': '{discount}% OFF',
  'offers.rsOff': 'Rs {discount} OFF',
  'offers.validUntil': 'Valid until {date}',

  // Notifications
  'notifications.title': 'Notifications',
  'notifications.allQuiet': 'All quiet',
  'notifications.allQuietMsg': "You'll see notifications here when something happens",

  // Membership
  'membership.title': 'GoPasal Gold',
  'membership.badge': 'MEMBERSHIP',
  'membership.saveMore': 'Save more, every order',
  'membership.benefitFreeDelivery': 'Free delivery on eligible orders',
  'membership.benefitMemberPrices': 'Exclusive member-only prices',
  'membership.benefitPriority': 'Priority support & early deals',
  'membership.activePrefix': 'Active: {name}',
  'membership.validUntil': 'Valid until {date}',
  'membership.cancelAutoRenew': 'Cancel auto-renew',
  'membership.signInPrompt': 'Sign in to subscribe to member plans.',
  'membership.signIn': 'Sign in',
  'membership.loadingPlans': 'Loading plans…',
  'membership.noPlans': 'Membership plans are not available yet. Check back soon.',
  'membership.freeDeliveryDays': 'Free delivery on eligible orders · {days} days',
  'membership.perDays': '/ {days} days',
  'membership.subscribePay': 'Subscribe & pay',

  // Support
  'support.title': 'Help & Support',
  'support.howCanWeHelp': 'How can we help?',
  'support.intro': 'Reach our team directly, browse common questions, or report an issue with an order.',
  'support.callUs': 'Call us',
  'support.callDetail': 'Mon–Sun, 7am–10pm',
  'support.whatsapp': 'WhatsApp',
  'support.whatsappDetail': 'Chat with an agent',
  'support.email': 'Email',
  'support.faqTitle': 'Frequently asked',
  'support.faq1q': 'How do I track my order?',
  'support.faq1a':
    'Open the Orders tab and select your order to see live status — from confirmation to packing, dispatch, and delivery.',
  'support.faq2q': 'When will I get a refund?',
  'support.faq2a':
    'Approved refunds are returned to your original payment method within 3–5 business days. Wallet refunds are instant.',
  'support.faq3q': 'An item is missing or damaged. What do I do?',
  'support.faq3a':
    'Report it below with your order ID within 24 hours of delivery. Our team reviews disputes and resolves them quickly.',
  'support.faq4q': 'Who delivers my order?',
  'support.faq4a':
    'Orders are fulfilled and delivered by the local shop you bought from, so delivery times depend on your seller and area.',
  'support.faq5q': 'How do I change my delivery address?',
  'support.faq5a':
    'Set your location from the home screen or manage saved addresses in Profile → Addresses before placing an order.',
  'support.reportTitle': 'Report an issue',
  'support.requestSubmitted': 'Request submitted',
  'support.requestSubmittedMsg':
    'Thanks for letting us know. Our support team will review your case and follow up in the app.',
  'support.submitAnother': 'Submit another request',
  'support.disputeIntro': 'Open a dispute for refunds, missing items, or delivery problems. Select the order you need help with.',
  'support.orderId': 'Order',
  'support.selectOrderPlaceholder': 'Select an order',
  'support.pickOrderTitle': 'Choose an order',
  'support.noOrders': 'You have no orders yet',
  'support.noOrdersMsg': 'Place an order first, then come back here if something goes wrong.',
  'support.viewOrders': 'View orders',
  'support.signInPrompt': 'Sign in to select an order and report an issue.',
  'support.whatWrong': 'What went wrong?',
  'support.describePlaceholder': 'Describe the issue…',
  'support.submitRequest': 'Submit request',
  'support.submitting': 'Submitting…',
  'support.errOrderId': 'Please select an order to report.',
  'support.errReason': 'Please describe the issue in at least 5 characters.',
  'support.errSubmit': 'Could not submit your request. Please try again.',
  'support.errContact': 'Could not open that app. Please try another contact method.',

  // Settings
  'settings.title': 'Settings',
  'settings.pushNotifications': 'Push Notifications',
  'settings.language': 'Language',
  'settings.privacyPolicy': 'Privacy Policy',
  'settings.terms': 'Terms of Service',
  'settings.about': 'About GoPasal',

  // Language picker
  'language.title': 'Language',
  'language.english': 'English',
  'language.nepali': 'नेपाली (Nepali)',
  'language.englishShort': 'English',
  'language.nepaliShort': 'नेपाली',

  // Login
  'login.tagline': 'Your Neighborhood Marketplace',
  'login.enterPhone': 'Enter your phone number',
  'login.sendCode': "We'll send you a verification code",
  'login.sendOtp': 'Send OTP',
  'login.verifyOtp': 'Verify OTP',
  'login.otpSentTo': 'Enter the 6-digit code sent to {phone}',
  'login.otpPlaceholder': 'Enter 6-digit OTP',
  'login.verifyContinue': 'Verify & Continue',
  'login.changePhone': 'Change phone number',
  'login.orContinueWith': 'or continue with',
  'login.selectCountry': 'Select country',
  'login.phonePlaceholder': 'Phone number',
  'login.phonePlaceholderNepal': '98XXXXXXXX',
  'login.errValidPhone': 'Enter a valid phone number',
  'login.errNepalPhone': 'Enter a valid 10-digit Nepal mobile number',
  'login.errSendOtp': 'Failed to send OTP',
  'login.err6digit': 'Enter 6-digit OTP',
  'login.errInvalidOtp': 'Invalid OTP',
  'login.errSocialFailed': 'Social sign-in failed',
  'login.socialGoogleTitle': 'Google sign-in',
  'login.socialAppleTitle': 'Apple sign-in',
  'login.socialPasteToken': 'Paste your provider ID token.',
  'login.socialAlertMsg': 'Paste your OAuth ID token in the next step, or continue with phone OTP below.',
  'login.enterToken': 'Enter token',
  'login.usePhoneOtp': 'Use phone OTP',
  'login.socialTokenIosWeb': 'Social token entry is available on iOS and web.',
  'login.pasteIdToken': 'Paste ID token',

  // Product
  'product.fromStore': 'from {store} →',
  'product.reviews': '{count} reviews',
  'product.inStock': 'In Stock',
  'product.outOfStock': 'Out of Stock',
  'product.soldBy': 'Sold by',
  'product.localDelivery': 'Local seller delivers',
  'product.securePayment': 'Secure checkout',
  'product.noDescription': 'No description provided for this item yet.',
  'product.perUnit': 'per {unit}',
  'product.quantity': 'Quantity',
  'product.description': 'Description',
  'product.reviewsTitle': 'Reviews ({count})',
  'product.addToCart': 'Add {count} to Cart',
  'product.adding': 'Adding...',
  'product.failedLoad': 'Failed to load product',

  // Shop
  'shop.shop': 'Shop',
  'shop.minOrder': 'Min. Rs {amount}',
  'shop.allProducts': 'All Products',
  'shop.noProducts': 'No products',
  'shop.noProductsMsg': "This shop hasn't added products yet",
  'shop.notDeliverable':
    'This shop does not deliver to your current location. Change address in profile or pick another shop.',

  // Order tracking
  'order.orderNum': 'Order #{id}',
  'order.estimated': 'Estimated: {time}',
  'order.paymentRequired': 'Payment required',
  'order.paymentRequiredMsg':
    'Complete {method} payment so the shop can prepare your order. Funds stay protected until delivery.',
  'order.payNow': 'Pay now',
  'order.payOnlineMsg': 'Select a payment method to proceed.',
  'order.proceed': 'Proceed',
  'order.opening': 'Opening…',
  'order.items': 'Items',
  'order.rateYourOrder': 'Rate your order',
  'order.optionalComment': 'Optional comment',
  'order.submitReview': 'Submit review',
  'order.submitting': 'Submitting…',
  'order.cancelOrder': 'Cancel Order',
  'order.needHelp': 'Need help with this order?',
  'order.notFound': 'Order not found',
  'order.reviewThanks': 'Thanks!',
  'order.reviewThanksMsg': 'Your review was submitted.',
  'order.reviewError': 'Could not submit review. Try again.',
  'order.paymentTitle': 'Payment',
  'order.paymentError': 'Could not start payment',
  'order.fulfillmentDelivery': 'Delivery',
  'order.fulfillmentPlatform': 'GoPasal fleet delivery',
  'order.fulfillmentPickup': 'Store pickup',
  'order.pickupHint': 'Collect your order from the shop. We will notify you when it is ready.',
  'order.pickupAddress': 'Pickup location',

  'order.riderOnWay': 'Your rider is on the way',
  'order.riderUpdatedAt': 'Location updated',

  // Order status labels
  'status.PENDING_PAYMENT': 'Awaiting payment',
  'status.PLACED': 'Order placed',
  'status.ACCEPTED': 'Accepted by store',
  'status.CONFIRMED': 'Being prepared',
  'status.PACKED': 'Packed',
  'status.SHIPPED': 'Shipped',
  'status.OUT_FOR_DELIVERY': 'On the way',
  'status.DELIVERED': 'Delivered',
  'status.CANCELLED': 'Cancelled',
  'status.PENDING': 'Order placed',
  'status.PREPARING': 'Being prepared',
  'status.READY': 'Ready for pickup',

  // Payment return
  'payment.confirming': 'Confirming your payment…',
  'payment.membershipConfirmed': 'Membership payment confirmed. Welcome to GoPasal Gold!',
  'payment.successOrder': 'Payment successful. The shop will prepare your order.',
  'payment.esewaConfirmed': 'eSewa payment confirmed. Your order is paid.',
  'payment.esewaTestConfirmed': 'eSewa test payment confirmed. Your order is paid.',
  'payment.confirmed': 'Payment confirmed',
  'payment.notCompleted': 'Payment not completed',
  'payment.cancelled': 'Payment was cancelled. Your order is saved — you can pay from the order screen.',
  'payment.missingRef': 'Missing payment reference. Open your orders or membership screen.',
  'payment.noRef': 'No payment reference received. If you paid, wait a moment and tap retry.',
  'payment.couldNotVerify': 'Payment could not be verified',
  'payment.viewMembership': 'View membership',
  'payment.viewOrder': 'View order',
  'payment.tryAgain': 'Try payment again',
  'payment.backToMembership': 'Back to membership',
  'payment.goToOrder': 'Go to order',

  // Not found
  'notFound.title': 'Page Not Found',
  'notFound.message': "The page you're looking for doesn't exist",
  'notFound.goHome': 'Go Home',

  // Trust strip
  'trust.secureCheckout': 'Secure checkout on GoPasal',
  'trust.protected': 'Protected by GoPasal',
  'trust.secureCopy':
    'Online payments are held safely until your order is delivered. Sellers are verified before they sell on the platform.',
  'trust.orderCopy':
    'Your payment status and delivery updates stay in sync. Contact support from your order if anything looks wrong.',
  'trust.encrypted': 'Encrypted',
  'trust.escrow': 'Escrow on delivery',
  'trust.localShops': 'Local shops',

  // Generic legal
  'legal.lastUpdated': 'Last updated: {date}',
  'legal.contactTitle': 'Contact Us',

  // About
  'about.title': 'About GoPasal',
  'about.tagline': 'Your Neighborhood Marketplace',
  'about.version': 'Version {version}',
  'about.missionTitle': 'Our mission',
  'about.missionBody':
    'GoPasal brings your neighborhood to your screen. We connect you with trusted local shops for groceries, fresh produce, electronics, beauty and everyday essentials — ordered in a tap and delivered straight from the shop you buy from.',
  'about.differentTitle': 'What makes us different',
  'about.differentBody':
    'Unlike warehouse-style delivery apps, GoPasal puts local sellers first. The shops you know list their own products, set their own prices and handle delivery themselves. When you order on GoPasal, you support a real business in your community.',
  'about.howTitle': 'How it works',
  'about.how1': 'Set your delivery location so we can show shops that deliver to you.',
  'about.how2': 'Browse nearby shops and products, and add what you need to your cart.',
  'about.how3': 'Pay securely with Khalti, eSewa or cash on delivery.',
  'about.how4': 'The shop packs your order and delivers it — track every step in the app.',
  'about.contactTitle': 'Get in touch',
  'about.contactBody': 'Questions, feedback or need a hand with an order? Our team is here to help.',
  'about.emailUs': 'Email us',
  'about.visitHelp': 'Visit Help & Support',

  // Privacy Policy
  'privacy.title': 'Privacy Policy',
  'privacy.intro':
    'This Privacy Policy explains how GoPasal collects, uses and protects your information when you use our app and services. GoPasal is a neighborhood marketplace that connects customers in Nepal with local shops that list, fulfill and deliver their own orders. By using GoPasal, you agree to the practices described here.',
  'privacy.s1.title': 'Information We Collect',
  'privacy.s1.body':
    'We collect the information you give us and the information needed to deliver your orders, including: account details (name and phone number); your delivery location and saved addresses; your order and payment history; and basic device and usage information that helps the app run reliably.',
  'privacy.s2.title': 'How We Use Your Information',
  'privacy.s2.body':
    'We use your information to confirm and fulfill your orders, arrange delivery by the shop, provide customer support, prevent fraud, and improve our products and services. We may send you order updates and important service notices.',
  'privacy.s3.title': 'How We Share Information',
  'privacy.s3.body':
    'To complete your order we share the necessary details with the seller/shop fulfilling it (so they can pack and deliver) and with payment processors such as Khalti and eSewa to process payments. We may also share information when required by law or to protect the rights and safety of our users. We do not sell your personal data.',
  'privacy.s4.title': 'Location Data',
  'privacy.s4.body':
    'We use your location to show shops that deliver to your area and to estimate delivery. You can search for an address instead of sharing precise GPS, and you can change or remove your saved location at any time.',
  'privacy.s5.title': 'Cookies & Local Storage',
  'privacy.s5.body':
    'On the web and in the app we use local storage to remember your session, preferred language and basic settings so the app works smoothly. This data stays on your device unless it is needed to operate the service.',
  'privacy.s6.title': 'Data Security',
  'privacy.s6.body':
    'We use reasonable technical and organizational measures to protect your information. Payment transactions are handled by trusted processors over encrypted connections. No method of transmission or storage is completely secure, but we work to keep your data safe.',
  'privacy.s7.title': 'Your Rights',
  'privacy.s7.body':
    'You can access and update your account information in the app, and you can request correction or deletion of your personal data by contacting us. We will respond to reasonable requests in line with applicable law.',
  'privacy.s8.title': "Children's Privacy",
  'privacy.s8.body':
    'GoPasal is not intended for children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us information, please contact us so we can remove it.',
  'privacy.s9.title': 'Changes to This Policy',
  'privacy.s9.body':
    'We may update this Privacy Policy from time to time. When we make material changes we will update the date below and, where appropriate, notify you in the app.',
  'privacy.contactBody':
    'If you have questions about this Privacy Policy or your data, contact us at support@gopasal.com.',

  // Terms of Service
  'terms.title': 'Terms of Service',
  'terms.intro':
    'These Terms of Service govern your use of the GoPasal app and services. Please read them carefully. By accessing or using GoPasal you agree to these Terms.',
  'terms.s1.title': 'Acceptance of Terms',
  'terms.s1.body':
    'By creating an account or placing an order on GoPasal, you confirm that you accept these Terms and our Privacy Policy. If you do not agree, please do not use the service.',
  'terms.s2.title': 'About GoPasal',
  'terms.s2.body':
    'GoPasal is a marketplace that connects customers with local shops in Nepal. The shops (sellers) list their own products, set prices, and fulfill and deliver orders. GoPasal provides the platform that brings buyers and sellers together.',
  'terms.s3.title': 'Accounts & Eligibility',
  'terms.s3.body':
    'You must provide accurate information and keep your account secure. You are responsible for activity under your account. You must be able to form a binding contract to use GoPasal.',
  'terms.s4.title': 'Orders & Pricing',
  'terms.s4.body':
    'Product availability, prices and descriptions are set by the seller and may change. An order is confirmed once the seller accepts it. If an item becomes unavailable, the seller may adjust or cancel the affected items.',
  'terms.s5.title': 'Delivery',
  'terms.s5.body':
    'Orders are fulfilled and delivered by the seller you buy from. Delivery areas and radius are set by each seller, so you will only see shops that deliver to your location. Estimated delivery times are provided as a guide and are not guaranteed.',
  'terms.s6.title': 'Payments & Refunds',
  'terms.s6.body':
    'You can pay with Khalti, eSewa or cash on delivery. Online payments are held securely until your order is delivered. Approved refunds are returned to your original payment method. For refund requests, missing items or delivery problems, open a request through Help & Support.',
  'terms.s7.title': 'Cancellations',
  'terms.s7.body':
    'You may cancel an order while it is still pending or before the seller begins preparing it. Once an order is being packed or is out for delivery, cancellation may not be possible. Sellers may cancel orders they cannot fulfill.',
  'terms.s8.title': 'User Conduct',
  'terms.s8.body':
    'You agree to use GoPasal lawfully and respectfully. Do not misuse the service, attempt to defraud sellers or other users, or interfere with the operation of the platform.',
  'terms.s9.title': 'Intellectual Property',
  'terms.s9.body':
    'The GoPasal name, logo, app and content are owned by GoPasal or its licensors. You may not copy, modify or distribute them without permission. Product information belongs to the respective sellers.',
  'terms.s10.title': 'Limitation of Liability',
  'terms.s10.body':
    'GoPasal provides the platform on an "as is" basis. To the extent permitted by law, GoPasal is not liable for the quality of products, the conduct of sellers, or indirect or consequential losses arising from your use of the service.',
  'terms.s11.title': 'Governing Law',
  'terms.s11.body':
    'These Terms are governed by the laws of Nepal. Any disputes will be subject to the jurisdiction of the courts of Nepal.',
  'terms.s12.title': 'Changes to These Terms',
  'terms.s12.body':
    'We may update these Terms from time to time. Continued use of GoPasal after changes take effect means you accept the updated Terms.',
  'terms.contactBody':
    'Questions about these Terms? Contact us at support@gopasal.com.',
} as const;

export type TranslationKey = keyof typeof en;

const ne: Record<TranslationKey, string> = {
  // Common / shared
  'common.seeAll': 'सबै हेर्नुहोस् →',
  'common.login': 'लग इन',
  'common.profile': 'प्रोफाइल',
  'common.search': 'खोज्नुहोस्',
  'common.add': 'थप्नुहोस्',
  'common.cancel': 'रद्द गर्नुहोस्',
  'common.save': 'सेभ गर्नुहोस्',
  'common.continue': 'जारी राख्नुहोस्',
  'common.backToHome': 'गृहपृष्ठमा फर्कनुहोस्',
  'common.goHome': 'गृहपृष्ठमा जानुहोस्',
  'common.tryAgain': 'फेरि प्रयास गर्नुहोस्',
  'common.free': 'नि:शुल्क',
  'common.total': 'जम्मा',
  'common.subtotal': 'उप-जम्मा',
  'common.platformFee': 'प्लेटफर्म शुल्क',
  'common.delivery': 'डेलिभरी',
  'common.deliveryFee': 'डेलिभरी शुल्क',
  'common.deliverySetByShop': 'पसलले तोक्छ',
  'common.deliveryShopHint': 'प्रत्येक पसलले आफ्नै डेलिभरी शुल्क तोक्छ। अन्तिम शुल्क चेकआउटमा पुष्टि हुन्छ।',
  'common.exclDelivery': 'डेलिभरी बाहेक',
  'common.discount': 'छुट',
  'common.oops': 'ओहो!',
  'common.somethingWentWrong': 'केही गडबड भयो',
  'common.browseShops': 'पसलहरू हेर्नुहोस्',
  'common.browseProducts': 'उत्पादनहरू हेर्नुहोस्',

  // Tab bar / navigation
  'nav.home': 'गृह',
  'nav.categories': 'श्रेणीहरू',
  'nav.cart': 'कार्ट',
  'nav.orders': 'अर्डरहरू',
  'nav.profile': 'प्रोफाइल',

  // Web header
  'header.deliverTo': 'यहाँ पुर्‍याउने',
  'header.setLocation': 'आफ्नो स्थान सेट गर्नुहोस्',
  'header.searchPlaceholder': 'खोज्नुहोस् "किराना र अन्य धेरै"',
  'header.myCart': 'मेरो कार्ट',
  'header.itemsCount': '{count} वस्तुहरू',

  // Hero banner
  'hero.eyebrow': 'स्थानीय किनमेल · आफ्नो छिमेकलाई सहयोग गर्नुहोस्',
  'hero.title': 'तपाईंका छिमेकका\nपसलहरू, एउटै एपमा।',
  'hero.subtitle':
    'भरपर्दा स्थानीय विक्रेताहरूबाट किराना, ताजा तरकारी र दैनिक आवश्यकताहरू पत्ता लगाउनुहोस् — एक ट्यापमा अर्डर गर्नुहोस् र तपाईंले किनेको पसलले नै डेलिभरी गर्छ।',
  'hero.startShopping': 'किनमेल सुरु गर्नुहोस्',
  'hero.exploreShops': 'पसलहरू हेर्नुहोस्',
  'hero.trustFresh': 'ताजा र स्थानीय',
  'hero.trustGenuine': 'सक्कली उत्पादन',
  'hero.trustPay': 'अनलाइन वा नगद भुक्तानी',

  // Home
  'home.shopByCategory': 'श्रेणी अनुसार किनमेल',
  'home.popularNearYou': 'नजिकैका लोकप्रिय',
  'home.recommendedForYou': 'तपाईंका लागि सिफारिस',
  'home.comingSoonTitle': 'तपाईंको क्षेत्रमा चाँडै आउँदै',
  'home.comingSoonText':
    'हामी अहिले यहाँ डेलिभरी गर्दैनौं — हरेक हप्ता स्थानीय पसलहरू GoPasal मा जोडिँदै छन्। पर्खनुहोस्, हामी चाँडै नै तपाईंको ढोकामा आइपुग्नेछौं!',
  'home.changeLocation': 'डेलिभरी स्थान परिवर्तन गर्नुहोस्',
  'home.selectLocation': 'स्थान छान्नुहोस्',

  // Web footer
  'footer.brandDesc':
    'तपाईंको छिमेकी बजार। किराना, इलेक्ट्रोनिक्स, सौन्दर्य उत्पादन र अन्य धेरैको छिटो डेलिभरी।',
  'footer.quickLinks': 'द्रुत लिङ्कहरू',
  'footer.customerService': 'ग्राहक सेवा',
  'footer.explore': 'अन्वेषण',
  'footer.home': 'गृह',
  'footer.categories': 'श्रेणीहरू',
  'footer.myOrders': 'मेरा अर्डरहरू',
  'footer.myProfile': 'मेरो प्रोफाइल',
  'footer.helpSupport': 'सहयोग',
  'footer.offers': 'अफरहरू',
  'footer.notifications': 'सूचनाहरू',
  'footer.settings': 'सेटिङ',
  'footer.browseCategories': 'श्रेणीहरू हेर्नुहोस्',
  'footer.search': 'खोज्नुहोस्',
  'footer.wishlist': 'इच्छासूची',
  'footer.gold': 'GoPasal Gold',
  'footer.addresses': 'ठेगानाहरू',
  'footer.copyright': '© २०२६ GoPasal। सर्वाधिकार सुरक्षित।',

  // Categories
  'categories.title': 'श्रेणीहरू',
  'categories.all': 'सबै',
  'categories.noProducts': 'अहिलेसम्म कुनै उत्पादन छैन',
  'categories.noProductsMsg': 'यस श्रेणीका उत्पादनहरू यहाँ देखिनेछन्',

  // Cart
  'cart.title': 'कार्ट',
  'cart.clearAll': 'सबै हटाउनुहोस्',
  'cart.empty': 'तपाईंको कार्ट खाली छ',
  'cart.emptyMsg': 'सुरु गर्न आफ्ना मनपर्ने पसलहरूबाट सामान थप्नुहोस्',
  'cart.failedLoad': 'कार्ट लोड गर्न सकिएन',
  'cart.orderSummary': 'अर्डर सारांश',
  'cart.proceedToCheckout': 'चेकआउटमा जानुहोस् · {amount}',
  'cart.orderingFrom': '{store} बाट अर्डर',
  'cart.singleShopOnly': 'एउटै पसलका सबै सामान भए मात्र चेकआउट गर्न सकिन्छ।',
  'cart.multiShopWarning': 'तपाईंको कार्टमा एकभन्दा बढी पसलका सामानहरू छन्।',
  'cart.backToCart': 'कार्टमा फर्कनुहोस्',
  'cart.differentShopTitle': 'फरक पसल',
  'cart.differentShopMsg': 'तपाईंको कार्टमा अर्को पसलका सामान छन्। कार्ट खाली गरी यो सामान थप्ने?',
  'cart.clearAndAdd': 'खाली गरी थप्नुहोस्',

  // Orders
  'orders.title': 'तपाईंका अर्डरहरू',
  'orders.active': 'सक्रिय ({count})',
  'orders.past': 'विगत ({count})',
  'orders.noActive': 'कुनै सक्रिय अर्डर छैन',
  'orders.noPast': 'कुनै विगत अर्डर छैन',
  'orders.noActiveMsg': 'तपाईंका सक्रिय अर्डरहरू यहाँ देखिनेछन्',
  'orders.noPastMsg': 'तपाईंका पूरा भएका अर्डरहरू यहाँ देखिनेछन्',
  'orders.orderNum': 'अर्डर #{id}',
  'orders.viewDetails': 'विवरण हेर्नुहोस्',

  // Profile
  'profile.guestUser': 'अतिथि प्रयोगकर्ता',
  'profile.signInToContinue': 'जारी राख्न साइन इन गर्नुहोस्',
  'profile.tapToAddName': 'नाम थप्न सम्पादन ट्याप गर्नुहोस्',
  'profile.signIn': 'साइन इन गर्नुहोस्',
  'profile.signOut': 'साइन आउट गर्नुहोस्',
  'profile.editProfile': 'प्रोफाइल सम्पादन गर्नुहोस्',
  'profile.yourName': 'तपाईंको नाम',
  'profile.appInfo': 'GoPasal v{version} · काठमाडौँ, नेपाल',
  'profile.myOrders': 'मेरा अर्डरहरू',
  'profile.savedAddresses': 'सुरक्षित ठेगानाहरू',
  'profile.wishlist': 'इच्छासूची',
  'profile.gold': 'GoPasal Gold',
  'profile.notifications': 'सूचनाहरू',
  'profile.offers': 'अफर र डिलहरू',
  'profile.settings': 'सेटिङ',
  'profile.helpSupport': 'सहयोग',

  // Search
  'search.placeholderWeb': 'उत्पादन र पसलहरू खोज्नुहोस्',
  'search.products': 'उत्पादनहरू',
  'search.shops': 'पसलहरू',
  'search.relevance': 'सान्दर्भिकता',
  'search.priceLowHigh': 'मूल्य: कम → बढी',
  'search.priceHighLow': 'मूल्य: बढी → कम',
  'search.topRated': 'उत्कृष्ट मूल्याङ्कन',
  'search.starsPlus': '{count}+ तारे',
  'search.browseCategories': 'श्रेणीहरू हेर्नुहोस्',
  'search.noResults': 'कुनै नतिजा भेटिएन',
  'search.noResultsMsg': '"{query}" का लागि कुनै उत्पादन भेटिएन',
  'search.noShops': 'कुनै पसल उपलब्ध छैन',
  'search.tryDifferent': 'अर्को खोज शब्द प्रयास गर्नुहोस्',
  'search.noShopsDeliver': 'अहिलेसम्म कुनै पसलले तपाईंको स्थानमा डेलिभरी गर्दैन',

  // Location
  'location.title': 'आफ्नो स्थान सेट गर्नुहोस्',
  'location.subtitle': 'तपाईंलाई डेलिभरी गर्ने पसलहरू देखाउन हामी तपाईंको स्थान प्रयोग गर्छौं।',
  'location.searchPlaceholder': 'क्षेत्र, सडक, ल्यान्डमार्क खोज्नुहोस्…',
  'location.useCurrentLocation': 'हालको स्थान प्रयोग गर्नुहोस्',
  'location.gettingLocation': 'स्थान प्राप्त गर्दै…',
  'location.errBlocked':
    'स्थान रोकिएको छ। ब्राउजरमा यो साइटका लागि स्थानलाई अनुमति दिनुहोस्, वा तल आफ्नो ठ्याक्कै क्षेत्र खोज्नुहोस्।',
  'location.errUnsupported': 'यो ब्राउजरले स्थानलाई समर्थन गर्दैन। कृपया तल आफ्नो क्षेत्र खोज्नुहोस्।',
  'location.errTimeout': 'तपाईंको स्थान प्राप्त गर्न धेरै समय लाग्यो। फेरि प्रयास गर्नुहोस्, वा तल आफ्नो क्षेत्र खोज्नुहोस्।',
  'location.errUnavailable': 'तपाईंको स्थान पत्ता लगाउन सकिएन। कृपया तल आफ्नो ठ्याक्कै क्षेत्र खोज्नुहोस्।',
  'location.errNoMatch': 'मिल्ने कुनै स्थान भेटिएन। नजिकैको ल्यान्डमार्क वा क्षेत्रको नाम प्रयास गर्नुहोस्।',
  'location.errSearchFailed': 'ठेगाना खोज असफल भयो। आफ्नो इन्टरनेट जाँच गर्नुहोस्।',

  // Addresses
  'addresses.title': 'ठेगानाहरू',
  'addresses.none': 'कुनै ठेगाना छैन',
  'addresses.noneMsg': 'सुरु गर्न आफ्नो डेलिभरी ठेगाना थप्नुहोस्',
  'addresses.addAddress': 'ठेगाना थप्नुहोस्',
  'addresses.default': 'पूर्वनिर्धारित',

  // Add address
  'addressNew.title': 'ठेगाना थप्नुहोस्',
  'addressNew.home': 'घर',
  'addressNew.work': 'कार्यालय',
  'addressNew.other': 'अन्य',
  'addressNew.streetArea': 'सडक / क्षेत्र',
  'addressNew.streetPlaceholder': 'वडा, सडक, भवन',
  'addressNew.city': 'सहर',
  'addressNew.landmark': 'ल्यान्डमार्क (वैकल्पिक)',
  'addressNew.errFull': 'पूरा सडक ठेगाना प्रविष्ट गर्नुहोस्।',
  'addressNew.errSave': 'ठेगाना सेभ गर्न सकिएन। साइन इन गरी फेरि प्रयास गर्नुहोस्।',
  'addressNew.save': 'ठेगाना सेभ गर्नुहोस्',

  // Support chat
  'support.chatGreeting': 'नमस्ते! म गोपासल सहायक हुँ। अर्डर स्थिति, हराएको सामान वा रिफन्डको बारेमा सोध्नुहोस्।',
  'support.chatError': 'अहिले सहयोगमा पुग्न सकिन। फेरि प्रयास गर्नुहोस् वा सिधै फोन गर्नुहोस्।',
  'support.chatTitle': 'गोपासल सहायक',
  'support.chatOnline': 'तुरुन्त जवाफ',
  'support.chatPlaceholder': 'तपाईंको प्रश्न लेख्नुहोस्…',

  // Checkout
  'checkout.title': 'चेकआउट',
  'checkout.deliveryAddress': 'डेलिभरी ठेगाना',
  'checkout.addNewAddress': 'नयाँ ठेगाना थप्नुहोस्',
  'checkout.promoCode': 'प्रोमो कोड',
  'checkout.enterCode': 'कोड प्रविष्ट गर्नुहोस्',
  'checkout.apply': 'लागू गर्नुहोस्',
  'checkout.discountLabel': 'छुट: −{amount}',
  'checkout.paymentMethod': 'भुक्तानी विधि',
  'checkout.loadingPayment': 'भुक्तानी विकल्पहरू लोड हुँदै…',
  'checkout.orderSummary': 'अर्डर सारांश',
  'checkout.itemsCount': 'वस्तुहरू ({count})',
  'checkout.promoDiscount': 'प्रोमो छुट',
  'checkout.placeOrder': 'अर्डर गर्नुहोस् · {amount}',
  'checkout.payNow': 'अहिले तिर्नुहोस् · {amount}',
  'checkout.cod': 'डेलिभरीमा नगद',
  'checkout.codSub': 'अर्डर आइपुगेपछि भुक्तानी गर्नुहोस्',
  'checkout.khalti': 'Khalti',
  'checkout.khaltiSub': 'अहिले तिर्नुहोस्',
  'checkout.esewa': 'eSewa',
  'checkout.esewaSub': 'अहिले तिर्नुहोस्',
  'checkout.addressRequired': 'ठेगाना आवश्यक',
  'checkout.addressRequiredMsg': 'चेकआउट गर्नुअघि डेलिभरी ठेगाना थप्नुहोस्।',
  'checkout.minAmount': 'न्यूनतम रकम',
  'checkout.minAmountMsg': 'अनलाइन भुक्तानीका लागि कम्तीमा {amount} चाहिन्छ। थप सामान थप्नुहोस् वा डेलिभरीमा नगद प्रयोग गर्नुहोस्।',
  'checkout.failed': 'चेकआउट असफल',
  'checkout.failedMsg': 'अर्डर गर्न सकिएन। फेरि प्रयास गर्नुहोस्।',
  'checkout.couponError': 'कोड प्रविष्ट गर्नुहोस् र कार्टमा सामान भएको सुनिश्चित गर्नुहोस्।',
  'checkout.invalidCode': 'अमान्य कोड',
  'checkout.fulfillmentDelivery': 'डेलिभरी',
  'checkout.fulfillmentDeliverySub': 'पसलले तपाईंको ठेगानामा डेलिभरी गर्छ',
  'checkout.fulfillmentPickup': 'स्टोर पिकअप',
  'checkout.fulfillmentPickupSub': 'पसलबाट आफैं लिनुहोस्',
  'checkout.pickupLabel': 'स्टोर पिकअप',
  'checkout.pickupFeeHint': 'डेलिभरी शुल्क छैन — तपाईं आफैं अर्डर लिनुहुन्छ।',

  // Wishlist
  'wishlist.title': 'इच्छासूची',
  'wishlist.empty': 'तपाईंको इच्छासूची खाली छ',
  'wishlist.emptyMsg': 'सजिलो पहुँचका लागि आफ्ना मनपर्ने सामानहरू यहाँ सुरक्षित गर्नुहोस्',
  'wishlist.loginRequiredTitle': 'लगइन आवश्यक छ',
  'wishlist.loginRequiredMsg': 'इच्छासूचीमा सामान सुरक्षित गर्न तपाईंले लगइन गर्नुपर्छ।',

  // Offers
  'offers.title': 'अफर र डिलहरू',
  'offers.none': 'कुनै अफर छैन',
  'offers.noneMsg': 'रोमाञ्चक डिलहरूका लागि चाँडै फेरि हेर्नुहोस्!',
  'offers.percentOff': '{discount}% छुट',
  'offers.rsOff': 'रु. {discount} छुट',
  'offers.validUntil': '{date} सम्म मान्य',

  // Notifications
  'notifications.title': 'सूचनाहरू',
  'notifications.allQuiet': 'सबै शान्त',
  'notifications.allQuietMsg': 'केही भएमा तपाईंले यहाँ सूचनाहरू देख्नुहुनेछ',

  // Membership
  'membership.title': 'GoPasal Gold',
  'membership.badge': 'सदस्यता',
  'membership.saveMore': 'हरेक अर्डरमा अझ बढी बचत गर्नुहोस्',
  'membership.benefitFreeDelivery': 'योग्य अर्डरमा नि:शुल्क डेलिभरी',
  'membership.benefitMemberPrices': 'सदस्यका लागि मात्र विशेष मूल्य',
  'membership.benefitPriority': 'प्राथमिकता सहयोग र छिटो डिलहरू',
  'membership.activePrefix': 'सक्रिय: {name}',
  'membership.validUntil': '{date} सम्म मान्य',
  'membership.cancelAutoRenew': 'स्वतः नवीकरण रद्द गर्नुहोस्',
  'membership.signInPrompt': 'सदस्य योजनाहरूमा सदस्यता लिन साइन इन गर्नुहोस्।',
  'membership.signIn': 'साइन इन गर्नुहोस्',
  'membership.loadingPlans': 'योजनाहरू लोड हुँदै…',
  'membership.noPlans': 'सदस्यता योजनाहरू अहिले उपलब्ध छैनन्। चाँडै फेरि हेर्नुहोस्।',
  'membership.freeDeliveryDays': 'योग्य अर्डरमा नि:शुल्क डेलिभरी · {days} दिन',
  'membership.perDays': '/ {days} दिन',
  'membership.subscribePay': 'सदस्यता लिनुहोस् र तिर्नुहोस्',

  // Support
  'support.title': 'सहयोग',
  'support.howCanWeHelp': 'हामी कसरी मद्दत गर्न सक्छौं?',
  'support.intro': 'हाम्रो टोलीसँग सीधै सम्पर्क गर्नुहोस्, सामान्य प्रश्नहरू हेर्नुहोस्, वा अर्डरसम्बन्धी समस्या रिपोर्ट गर्नुहोस्।',
  'support.callUs': 'हामीलाई फोन गर्नुहोस्',
  'support.callDetail': 'सोम–आइत, बिहान ७ – बेलुका १०',
  'support.whatsapp': 'WhatsApp',
  'support.whatsappDetail': 'एजेन्टसँग कुराकानी गर्नुहोस्',
  'support.email': 'इमेल',
  'support.faqTitle': 'बारम्बार सोधिने प्रश्न',
  'support.faq1q': 'मैले मेरो अर्डर कसरी ट्र्याक गर्ने?',
  'support.faq1a':
    'अर्डर ट्याब खोल्नुहोस् र आफ्नो अर्डर छान्नुहोस् — पुष्टिदेखि प्याकिङ, पठाउने र डेलिभरीसम्मको प्रत्यक्ष स्थिति हेर्नुहोस्।',
  'support.faq2q': 'मैले रिफन्ड कहिले पाउँछु?',
  'support.faq2a':
    'स्वीकृत रिफन्डहरू ३–५ कार्य दिनभित्र तपाईंको मूल भुक्तानी विधिमा फर्काइन्छ। वालेट रिफन्ड तुरुन्तै हुन्छ।',
  'support.faq3q': 'कुनै सामान हराएको वा बिग्रेको छ। मैले के गर्ने?',
  'support.faq3a':
    'डेलिभरी भएको २४ घण्टाभित्र आफ्नो अर्डर ID सहित तल रिपोर्ट गर्नुहोस्। हाम्रो टोलीले विवादहरू छिटो समीक्षा गरी समाधान गर्छ।',
  'support.faq4q': 'मेरो अर्डर कसले डेलिभरी गर्छ?',
  'support.faq4a':
    'अर्डरहरू तपाईंले किनेको स्थानीय पसलले नै तयार गरी डेलिभरी गर्छ, त्यसैले डेलिभरी समय तपाईंको विक्रेता र क्षेत्रमा भर पर्छ।',
  'support.faq5q': 'मैले मेरो डेलिभरी ठेगाना कसरी परिवर्तन गर्ने?',
  'support.faq5a':
    'अर्डर गर्नुअघि गृहपृष्ठबाट आफ्नो स्थान सेट गर्नुहोस् वा प्रोफाइल → ठेगानाहरूमा सुरक्षित ठेगानाहरू व्यवस्थापन गर्नुहोस्।',
  'support.reportTitle': 'समस्या रिपोर्ट गर्नुहोस्',
  'support.requestSubmitted': 'अनुरोध पेश भयो',
  'support.requestSubmittedMsg':
    'जानकारी दिनुभएकोमा धन्यवाद। हाम्रो सहयोग टोलीले तपाईंको केस समीक्षा गरी एपमा फलोअप गर्नेछ।',
  'support.submitAnother': 'अर्को अनुरोध पेश गर्नुहोस्',
  'support.disputeIntro': 'रिफन्ड, हराएका सामान वा डेलिभरी समस्याका लागि विवाद खोल्नुहोस्। तपाईंलाई मद्दत चाहिएको अर्डर छान्नुहोस्।',
  'support.orderId': 'अर्डर',
  'support.selectOrderPlaceholder': 'अर्डर छान्नुहोस्',
  'support.pickOrderTitle': 'अर्डर छान्नुहोस्',
  'support.noOrders': 'तपाईंका कुनै अर्डर छैनन्',
  'support.noOrdersMsg': 'पहिले अर्डर गर्नुहोस्, केही गडबड भएमा यहाँ फर्कनुहोस्।',
  'support.viewOrders': 'अर्डरहरू हेर्नुहोस्',
  'support.signInPrompt': 'अर्डर छानेर समस्या रिपोर्ट गर्न साइन इन गर्नुहोस्।',
  'support.whatWrong': 'के गडबड भयो?',
  'support.describePlaceholder': 'समस्या वर्णन गर्नुहोस्…',
  'support.submitRequest': 'अनुरोध पेश गर्नुहोस्',
  'support.submitting': 'पेश गर्दै…',
  'support.errOrderId': 'कृपया रिपोर्ट गर्न अर्डर छान्नुहोस्।',
  'support.errReason': 'कृपया समस्यालाई कम्तीमा ५ अक्षरमा वर्णन गर्नुहोस्।',
  'support.errSubmit': 'तपाईंको अनुरोध पेश गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।',
  'support.errContact': 'त्यो एप खोल्न सकिएन। कृपया अर्को सम्पर्क विधि प्रयास गर्नुहोस्।',

  // Settings
  'settings.title': 'सेटिङ',
  'settings.pushNotifications': 'पुश सूचनाहरू',
  'settings.language': 'भाषा',
  'settings.privacyPolicy': 'गोपनीयता नीति',
  'settings.terms': 'सेवाका सर्तहरू',
  'settings.about': 'GoPasal बारे',

  // Language picker
  'language.title': 'भाषा',
  'language.english': 'English',
  'language.nepali': 'नेपाली (Nepali)',
  'language.englishShort': 'English',
  'language.nepaliShort': 'नेपाली',

  // Login
  'login.tagline': 'तपाईंको छिमेकी बजार',
  'login.enterPhone': 'आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्',
  'login.sendCode': 'हामी तपाईंलाई प्रमाणीकरण कोड पठाउनेछौं',
  'login.sendOtp': 'OTP पठाउनुहोस्',
  'login.verifyOtp': 'OTP प्रमाणित गर्नुहोस्',
  'login.otpSentTo': '{phone} मा पठाइएको ६-अङ्कको कोड प्रविष्ट गर्नुहोस्',
  'login.otpPlaceholder': '६-अङ्कको OTP प्रविष्ट गर्नुहोस्',
  'login.verifyContinue': 'प्रमाणित गरी जारी राख्नुहोस्',
  'login.changePhone': 'फोन नम्बर परिवर्तन गर्नुहोस्',
  'login.orContinueWith': 'वा यसमार्फत जारी राख्नुहोस्',
  'login.selectCountry': 'देश छान्नुहोस्',
  'login.phonePlaceholder': 'फोन नम्बर',
  'login.phonePlaceholderNepal': '98XXXXXXXX',
  'login.errValidPhone': 'मान्य फोन नम्बर प्रविष्ट गर्नुहोस्',
  'login.errNepalPhone': 'मान्य १०-अङ्कको नेपाली मोबाइल नम्बर प्रविष्ट गर्नुहोस्',
  'login.errSendOtp': 'OTP पठाउन सकिएन',
  'login.err6digit': '६-अङ्कको OTP प्रविष्ट गर्नुहोस्',
  'login.errInvalidOtp': 'अमान्य OTP',
  'login.errSocialFailed': 'सोसल साइन-इन असफल भयो',
  'login.socialGoogleTitle': 'Google साइन-इन',
  'login.socialAppleTitle': 'Apple साइन-इन',
  'login.socialPasteToken': 'आफ्नो प्रदायक ID टोकन पेस्ट गर्नुहोस्।',
  'login.socialAlertMsg': 'अर्को चरणमा OAuth ID टोकन पेस्ट गर्नुहोस्, वा तल फोन OTP बाट जारी राख्नुहोस्।',
  'login.enterToken': 'टोकन प्रविष्ट गर्नुहोस्',
  'login.usePhoneOtp': 'फोन OTP प्रयोग गर्नुहोस्',
  'login.socialTokenIosWeb': 'सोसल टोकन प्रविष्ट iOS र वेबमा उपलब्ध छ।',
  'login.pasteIdToken': 'ID टोकन पेस्ट गर्नुहोस्',

  // Product
  'product.fromStore': '{store} बाट →',
  'product.reviews': '{count} समीक्षाहरू',
  'product.inStock': 'स्टकमा छ',
  'product.outOfStock': 'स्टकमा छैन',
  'product.soldBy': 'बिक्रीकर्ता',
  'product.localDelivery': 'स्थानीय पसलले डेलिभरी',
  'product.securePayment': 'सुरक्षित चेकआउट',
  'product.noDescription': 'यस वस्तुको विवरण अहिले उपलब्ध छैन।',
  'product.perUnit': 'प्रति {unit}',
  'product.quantity': 'परिमाण',
  'product.description': 'विवरण',
  'product.reviewsTitle': 'समीक्षाहरू ({count})',
  'product.addToCart': 'कार्टमा {count} थप्नुहोस्',
  'product.adding': 'थप्दै...',
  'product.failedLoad': 'उत्पादन लोड गर्न सकिएन',

  // Shop
  'shop.shop': 'पसल',
  'shop.minOrder': 'न्यूनतम रु.{amount}',
  'shop.allProducts': 'सबै उत्पादनहरू',
  'shop.noProducts': 'कुनै उत्पादन छैन',
  'shop.noProductsMsg': 'यो पसलले अहिलेसम्म उत्पादन थपेको छैन',
  'shop.notDeliverable':
    'यो पसलले तपाईंको हालको स्थानमा डेलिभरी गर्दैन। प्रोफाइलमा ठेगाना परिवर्तन गर्नुहोस् वा अर्को पसल छान्नुहोस्।',

  // Order tracking
  'order.orderNum': 'अर्डर #{id}',
  'order.estimated': 'अनुमानित: {time}',
  'order.paymentRequired': 'भुक्तानी आवश्यक',
  'order.paymentRequiredMsg':
    'पसलले तपाईंको अर्डर तयार गर्न सकोस् भनेर {method} भुक्तानी पूरा गर्नुहोस्। रकम डेलिभरीसम्म सुरक्षित रहन्छ।',
  'order.payNow': 'अहिले तिर्नुहोस्',
  'order.payOnlineMsg': 'अगाडि बढ्न भुक्तानी विधि छान्नुहोस्।',
  'order.proceed': 'अगाडि बढ्नुहोस्',
  'order.opening': 'खोल्दै…',
  'order.items': 'वस्तुहरू',
  'order.rateYourOrder': 'आफ्नो अर्डर मूल्याङ्कन गर्नुहोस्',
  'order.optionalComment': 'वैकल्पिक टिप्पणी',
  'order.submitReview': 'समीक्षा पेश गर्नुहोस्',
  'order.submitting': 'पेश गर्दै…',
  'order.cancelOrder': 'अर्डर रद्द गर्नुहोस्',
  'order.needHelp': 'यो अर्डरमा मद्दत चाहियो?',
  'order.notFound': 'अर्डर भेटिएन',
  'order.reviewThanks': 'धन्यवाद!',
  'order.reviewThanksMsg': 'तपाईंको समीक्षा पेश भयो।',
  'order.reviewError': 'समीक्षा पेश गर्न सकिएन। फेरि प्रयास गर्नुहोस्।',
  'order.paymentTitle': 'भुक्तानी',
  'order.paymentError': 'भुक्तानी सुरु गर्न सकिएन',
  'order.fulfillmentDelivery': 'डेलिभरी',
  'order.fulfillmentPlatform': 'गोपासल फ्लीट डेलिभरी',
  'order.fulfillmentPickup': 'स्टोर पिकअप',
  'order.pickupHint': 'पसलबाट आफ्नो अर्डर लिनुहोस्। तयार भएपछि हामी तपाईंलाई सूचित गर्नेछौं।',
  'order.pickupAddress': 'पिकअप स्थान',

  'order.riderOnWay': 'तपाईंको राइडर बाटोमा हुनुहुन्छ',
  'order.riderUpdatedAt': 'स्थान अपडेट भयो',

  // Order status labels
  'status.PENDING_PAYMENT': 'भुक्तानी पर्खँदै',
  'status.PLACED': 'अर्डर गरियो',
  'status.ACCEPTED': 'पसलले स्वीकार गर्‍यो',
  'status.CONFIRMED': 'तयार गरिँदै',
  'status.PACKED': 'प्याक गरियो',
  'status.SHIPPED': 'पठाइयो',
  'status.OUT_FOR_DELIVERY': 'बाटोमा',
  'status.DELIVERED': 'डेलिभर भयो',
  'status.CANCELLED': 'रद्द गरियो',
  'status.PENDING': 'अर्डर गरियो',
  'status.PREPARING': 'तयार गरिँदै',
  'status.READY': 'लिन तयार',

  // Payment return
  'payment.confirming': 'तपाईंको भुक्तानी पुष्टि गर्दै…',
  'payment.membershipConfirmed': 'सदस्यता भुक्तानी पुष्टि भयो। GoPasal Gold मा स्वागत छ!',
  'payment.successOrder': 'भुक्तानी सफल भयो। पसलले तपाईंको अर्डर तयार गर्नेछ।',
  'payment.esewaConfirmed': 'eSewa भुक्तानी पुष्टि भयो। तपाईंको अर्डर भुक्तानी भयो।',
  'payment.esewaTestConfirmed': 'eSewa परीक्षण भुक्तानी पुष्टि भयो। तपाईंको अर्डर भुक्तानी भयो।',
  'payment.confirmed': 'भुक्तानी पुष्टि भयो',
  'payment.notCompleted': 'भुक्तानी पूरा भएन',
  'payment.cancelled': 'भुक्तानी रद्द भयो। तपाईंको अर्डर सुरक्षित छ — तपाईं अर्डर स्क्रिनबाट भुक्तानी गर्न सक्नुहुन्छ।',
  'payment.missingRef': 'भुक्तानी सन्दर्भ छैन। आफ्नो अर्डर वा सदस्यता स्क्रिन खोल्नुहोस्।',
  'payment.noRef': 'कुनै भुक्तानी सन्दर्भ प्राप्त भएन। यदि तपाईंले तिर्नुभयो भने, केही बेर पर्खेर पुनः प्रयास थिच्नुहोस्।',
  'payment.couldNotVerify': 'भुक्तानी प्रमाणित गर्न सकिएन',
  'payment.viewMembership': 'सदस्यता हेर्नुहोस्',
  'payment.viewOrder': 'अर्डर हेर्नुहोस्',
  'payment.tryAgain': 'फेरि भुक्तानी प्रयास गर्नुहोस्',
  'payment.backToMembership': 'सदस्यतामा फर्कनुहोस्',
  'payment.goToOrder': 'अर्डरमा जानुहोस्',

  // Not found
  'notFound.title': 'पृष्ठ भेटिएन',
  'notFound.message': 'तपाईंले खोज्नुभएको पृष्ठ अवस्थित छैन',
  'notFound.goHome': 'गृहपृष्ठमा जानुहोस्',

  // Trust strip
  'trust.secureCheckout': 'GoPasal मा सुरक्षित चेकआउट',
  'trust.protected': 'GoPasal द्वारा सुरक्षित',
  'trust.secureCopy':
    'अनलाइन भुक्तानी तपाईंको अर्डर डेलिभरी नभएसम्म सुरक्षित राखिन्छ। प्लेटफर्ममा बिक्री गर्नुअघि विक्रेताहरू प्रमाणित गरिन्छन्।',
  'trust.orderCopy':
    'तपाईंको भुक्तानी स्थिति र डेलिभरी अपडेटहरू मिलेर रहन्छन्। केही गलत देखिए आफ्नो अर्डरबाट सहयोगमा सम्पर्क गर्नुहोस्।',
  'trust.encrypted': 'इन्क्रिप्टेड',
  'trust.escrow': 'डेलिभरीमा एस्क्रो',
  'trust.localShops': 'स्थानीय पसलहरू',

  // Generic legal
  'legal.lastUpdated': 'पछिल्लो अद्यावधिक: {date}',
  'legal.contactTitle': 'हामीलाई सम्पर्क गर्नुहोस्',

  // About
  'about.title': 'GoPasal बारे',
  'about.tagline': 'तपाईंको छिमेकी बजार',
  'about.version': 'संस्करण {version}',
  'about.missionTitle': 'हाम्रो ध्येय',
  'about.missionBody':
    'GoPasal ले तपाईंको छिमेकलाई तपाईंको स्क्रिनमा ल्याउँछ। हामी तपाईंलाई किराना, ताजा तरकारी, इलेक्ट्रोनिक्स, सौन्दर्य र दैनिक आवश्यकताहरूका लागि भरपर्दा स्थानीय पसलहरूसँग जोड्छौं — एक ट्यापमा अर्डर गर्नुहोस् र तपाईंले किनेको पसलबाटै सीधै डेलिभरी पाउनुहोस्।',
  'about.differentTitle': 'हामी किन फरक छौं',
  'about.differentBody':
    'गोदाम-शैलीका डेलिभरी एपहरूभन्दा फरक, GoPasal ले स्थानीय विक्रेताहरूलाई पहिलो स्थानमा राख्छ। तपाईंले चिनेका पसलहरूले आफ्नै उत्पादन सूचीबद्ध गर्छन्, आफ्नै मूल्य तोक्छन् र आफैं डेलिभरी गर्छन्। तपाईं GoPasal मा अर्डर गर्दा, तपाईं आफ्नो समुदायको वास्तविक व्यवसायलाई सहयोग गर्नुहुन्छ।',
  'about.howTitle': 'यो कसरी काम गर्छ',
  'about.how1': 'तपाईंलाई डेलिभरी गर्ने पसलहरू देखाउन सकौं भनेर आफ्नो डेलिभरी स्थान सेट गर्नुहोस्।',
  'about.how2': 'नजिकैका पसल र उत्पादनहरू हेर्नुहोस्, र आवश्यक सामान कार्टमा थप्नुहोस्।',
  'about.how3': 'Khalti, eSewa वा डेलिभरीमा नगदबाट सुरक्षित भुक्तानी गर्नुहोस्।',
  'about.how4': 'पसलले तपाईंको अर्डर प्याक गरी डेलिभरी गर्छ — एपमा हरेक चरण ट्र्याक गर्नुहोस्।',
  'about.contactTitle': 'सम्पर्क गर्नुहोस्',
  'about.contactBody': 'प्रश्न, सुझाव वा अर्डरमा मद्दत चाहियो? हाम्रो टोली मद्दतका लागि यहीँ छ।',
  'about.emailUs': 'हामीलाई इमेल गर्नुहोस्',
  'about.visitHelp': 'सहयोगमा जानुहोस्',

  // Privacy Policy
  'privacy.title': 'गोपनीयता नीति',
  'privacy.intro':
    'यो गोपनीयता नीतिले तपाईंले हाम्रो एप र सेवा प्रयोग गर्दा GoPasal ले तपाईंको जानकारी कसरी सङ्कलन, प्रयोग र सुरक्षा गर्छ भनी व्याख्या गर्छ। GoPasal एक छिमेकी बजार हो जसले नेपालका ग्राहकहरूलाई आफ्नै अर्डर सूचीबद्ध, तयार र डेलिभरी गर्ने स्थानीय पसलहरूसँग जोड्छ। GoPasal प्रयोग गरेर, तपाईं यहाँ वर्णन गरिएका अभ्यासहरूमा सहमत हुनुहुन्छ।',
  'privacy.s1.title': 'हामीले सङ्कलन गर्ने जानकारी',
  'privacy.s1.body':
    'हामी तपाईंले दिनुभएको जानकारी र तपाईंको अर्डर डेलिभरी गर्न आवश्यक जानकारी सङ्कलन गर्छौं, जसमा समावेश छ: खाता विवरण (नाम र फोन नम्बर); तपाईंको डेलिभरी स्थान र सुरक्षित ठेगानाहरू; तपाईंको अर्डर र भुक्तानी इतिहास; र एप भरपर्दो रूपमा चल्न मद्दत गर्ने आधारभूत उपकरण र प्रयोग जानकारी।',
  'privacy.s2.title': 'हामी तपाईंको जानकारी कसरी प्रयोग गर्छौं',
  'privacy.s2.body':
    'हामी तपाईंको जानकारी अर्डर पुष्टि र पूरा गर्न, पसलद्वारा डेलिभरी मिलाउन, ग्राहक सहयोग दिन, ठगी रोक्न, र हाम्रा उत्पादन र सेवाहरू सुधार्न प्रयोग गर्छौं। हामी तपाईंलाई अर्डर अपडेट र महत्त्वपूर्ण सेवा सूचनाहरू पठाउन सक्छौं।',
  'privacy.s3.title': 'हामी जानकारी कसरी साझा गर्छौं',
  'privacy.s3.body':
    'तपाईंको अर्डर पूरा गर्न हामी आवश्यक विवरणहरू अर्डर पूरा गर्ने विक्रेता/पसलसँग (ताकि उनीहरूले प्याक र डेलिभरी गर्न सकून्) र भुक्तानी प्रशोधन गर्न Khalti र eSewa जस्ता भुक्तानी प्रोसेसरहरूसँग साझा गर्छौं। कानूनले माग गरेमा वा हाम्रा प्रयोगकर्ताहरूको अधिकार र सुरक्षाका लागि पनि हामी जानकारी साझा गर्न सक्छौं। हामी तपाईंको व्यक्तिगत डेटा बेच्दैनौं।',
  'privacy.s4.title': 'स्थान डेटा',
  'privacy.s4.body':
    'हामी तपाईंको क्षेत्रमा डेलिभरी गर्ने पसलहरू देखाउन र डेलिभरी अनुमान गर्न तपाईंको स्थान प्रयोग गर्छौं। तपाईं ठ्याक्कै GPS साझा गर्नुको साटो ठेगाना खोज्न सक्नुहुन्छ, र जुनसुकै बेला आफ्नो सुरक्षित स्थान परिवर्तन वा हटाउन सक्नुहुन्छ।',
  'privacy.s5.title': 'कुकिज र लोकल स्टोरेज',
  'privacy.s5.body':
    'वेब र एपमा हामी तपाईंको सेसन, मनपर्ने भाषा र आधारभूत सेटिङहरू सम्झन लोकल स्टोरेज प्रयोग गर्छौं ताकि एप सहज रूपमा चलोस्। सेवा सञ्चालनका लागि आवश्यक नभएसम्म यो डेटा तपाईंकै उपकरणमा रहन्छ।',
  'privacy.s6.title': 'डेटा सुरक्षा',
  'privacy.s6.body':
    'हामी तपाईंको जानकारी जोगाउन उचित प्राविधिक र सङ्गठनात्मक उपायहरू अपनाउँछौं। भुक्तानी कारोबारहरू इन्क्रिप्टेड जडानमार्फत भरपर्दा प्रोसेसरहरूले सम्हाल्छन्। कुनै पनि प्रसारण वा भण्डारण विधि पूर्ण रूपमा सुरक्षित हुँदैन, तर हामी तपाईंको डेटा सुरक्षित राख्न प्रयास गर्छौं।',
  'privacy.s7.title': 'तपाईंका अधिकारहरू',
  'privacy.s7.body':
    'तपाईं एपमा आफ्नो खाता जानकारी हेर्न र अद्यावधिक गर्न सक्नुहुन्छ, र हामीलाई सम्पर्क गरेर आफ्नो व्यक्तिगत डेटा सच्याउन वा मेटाउन अनुरोध गर्न सक्नुहुन्छ। हामी लागू कानूनअनुसार उचित अनुरोधहरूको जवाफ दिनेछौं।',
  'privacy.s8.title': 'बालबालिकाको गोपनीयता',
  'privacy.s8.body':
    'GoPasal १६ वर्षमुनिका बालबालिकाका लागि होइन। हामी जानीजानी बालबालिकाबाट व्यक्तिगत जानकारी सङ्कलन गर्दैनौं। कुनै बालबालिकाले हामीलाई जानकारी दिएको विश्वास गर्नुहुन्छ भने, हटाउन सकौं भनेर हामीलाई सम्पर्क गर्नुहोस्।',
  'privacy.s9.title': 'यस नीतिमा परिवर्तन',
  'privacy.s9.body':
    'हामी यो गोपनीयता नीति समय-समयमा अद्यावधिक गर्न सक्छौं। महत्त्वपूर्ण परिवर्तन गर्दा हामी तलको मिति अद्यावधिक गर्नेछौं र उपयुक्त भएमा एपमा सूचित गर्नेछौं।',
  'privacy.contactBody':
    'यस गोपनीयता नीति वा तपाईंको डेटाबारे प्रश्न भएमा, support@gopasal.com मा सम्पर्क गर्नुहोस्।',

  // Terms of Service
  'terms.title': 'सेवाका सर्तहरू',
  'terms.intro':
    'यी सेवाका सर्तहरूले तपाईंको GoPasal एप र सेवाको प्रयोगलाई नियन्त्रण गर्छन्। कृपया ध्यानपूर्वक पढ्नुहोस्। GoPasal पहुँच वा प्रयोग गरेर तपाईं यी सर्तहरूमा सहमत हुनुहुन्छ।',
  'terms.s1.title': 'सर्तहरूको स्वीकृति',
  'terms.s1.body':
    'GoPasal मा खाता बनाएर वा अर्डर गरेर, तपाईं यी सर्तहरू र हाम्रो गोपनीयता नीति स्वीकार गर्नुहुन्छ भनी पुष्टि गर्नुहुन्छ। यदि तपाईं सहमत हुनुहुन्न भने, कृपया सेवा प्रयोग नगर्नुहोस्।',
  'terms.s2.title': 'GoPasal बारे',
  'terms.s2.body':
    'GoPasal एक बजार हो जसले ग्राहकहरूलाई नेपालका स्थानीय पसलहरूसँग जोड्छ। पसलहरू (विक्रेता) ले आफ्नै उत्पादन सूचीबद्ध गर्छन्, मूल्य तोक्छन्, र अर्डरहरू तयार गरी डेलिभरी गर्छन्। GoPasal ले क्रेता र विक्रेतालाई एकसाथ ल्याउने प्लेटफर्म उपलब्ध गराउँछ।',
  'terms.s3.title': 'खाता र योग्यता',
  'terms.s3.body':
    'तपाईंले सही जानकारी दिनुपर्छ र आफ्नो खाता सुरक्षित राख्नुपर्छ। तपाईंको खातामुनि भएका गतिविधिहरूका लागि तपाईं जिम्मेवार हुनुहुन्छ। GoPasal प्रयोग गर्न तपाईं बाध्यकारी सम्झौता गर्न सक्षम हुनुपर्छ।',
  'terms.s4.title': 'अर्डर र मूल्य',
  'terms.s4.body':
    'उत्पादनको उपलब्धता, मूल्य र विवरण विक्रेताले तोक्छन् र परिवर्तन हुन सक्छन्। विक्रेताले स्वीकार गरेपछि अर्डर पुष्टि हुन्छ। कुनै सामान अनुपलब्ध भएमा, विक्रेताले प्रभावित सामानहरू समायोजन वा रद्द गर्न सक्छन्।',
  'terms.s5.title': 'डेलिभरी',
  'terms.s5.body':
    'अर्डरहरू तपाईंले किनेको विक्रेताले नै तयार गरी डेलिभरी गर्छ। डेलिभरी क्षेत्र र दायरा प्रत्येक विक्रेताले तोक्छन्, त्यसैले तपाईंले आफ्नो स्थानमा डेलिभरी गर्ने पसलहरू मात्र देख्नुहुनेछ। अनुमानित डेलिभरी समय मार्गदर्शनका रूपमा दिइन्छ र ग्यारेन्टी गरिँदैन।',
  'terms.s6.title': 'भुक्तानी र रिफन्ड',
  'terms.s6.body':
    'तपाईं Khalti, eSewa वा डेलिभरीमा नगदबाट भुक्तानी गर्न सक्नुहुन्छ। अनलाइन भुक्तानी तपाईंको अर्डर डेलिभरी नभएसम्म सुरक्षित राखिन्छ। स्वीकृत रिफन्डहरू तपाईंको मूल भुक्तानी विधिमा फर्काइन्छ। रिफन्ड अनुरोध, हराएका सामान वा डेलिभरी समस्याका लागि, सहयोगमार्फत अनुरोध खोल्नुहोस्।',
  'terms.s7.title': 'रद्दीकरण',
  'terms.s7.body':
    'अर्डर पेन्डिङ रहँदासम्म वा विक्रेताले तयारी सुरु गर्नुअघि तपाईं अर्डर रद्द गर्न सक्नुहुन्छ। अर्डर प्याक हुँदै गर्दा वा डेलिभरीमा निस्किसकेपछि रद्दीकरण सम्भव नहुन सक्छ। विक्रेताहरूले पूरा गर्न नसक्ने अर्डरहरू रद्द गर्न सक्छन्।',
  'terms.s8.title': 'प्रयोगकर्ता आचरण',
  'terms.s8.body':
    'तपाईं GoPasal लाई कानूनसम्मत र आदरपूर्वक प्रयोग गर्न सहमत हुनुहुन्छ। सेवाको दुरुपयोग, विक्रेता वा अन्य प्रयोगकर्तालाई ठग्ने प्रयास, वा प्लेटफर्मको सञ्चालनमा बाधा नपुर्‍याउनुहोस्।',
  'terms.s9.title': 'बौद्धिक सम्पत्ति',
  'terms.s9.body':
    'GoPasal नाम, लोगो, एप र सामग्री GoPasal वा यसका लाइसेन्सदाताहरूको स्वामित्वमा छन्। अनुमतिबिना तपाईंले तिनलाई प्रतिलिपि, परिमार्जन वा वितरण गर्न पाउनुहुन्न। उत्पादन जानकारी सम्बन्धित विक्रेताहरूको हो।',
  'terms.s10.title': 'दायित्वको सीमा',
  'terms.s10.body':
    'GoPasal ले प्लेटफर्म "जस्ताको तस्तै" आधारमा उपलब्ध गराउँछ। कानूनले अनुमति दिएसम्म, GoPasal उत्पादनको गुणस्तर, विक्रेताको आचरण, वा सेवाको प्रयोगबाट उत्पन्न अप्रत्यक्ष वा परिणामी क्षतिका लागि जिम्मेवार हुँदैन।',
  'terms.s11.title': 'शासकीय कानून',
  'terms.s11.body':
    'यी सर्तहरू नेपालको कानूनद्वारा निर्देशित छन्। कुनै पनि विवादहरू नेपालका अदालतहरूको क्षेत्राधिकारअन्तर्गत हुनेछन्।',
  'terms.s12.title': 'यी सर्तहरूमा परिवर्तन',
  'terms.s12.body':
    'हामी यी सर्तहरू समय-समयमा अद्यावधिक गर्न सक्छौं। परिवर्तन लागू भएपछि पनि GoPasal को निरन्तर प्रयोगले तपाईं अद्यावधिक सर्तहरू स्वीकार गर्नुहुन्छ भन्ने बुझिन्छ।',
  'terms.contactBody':
    'यी सर्तहरूबारे प्रश्न छ? support@gopasal.com मा सम्पर्क गर्नुहोस्।',
};

export const translations = { en, ne } as const;
