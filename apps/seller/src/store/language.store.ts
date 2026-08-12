import { create } from 'zustand';

export type Language = 'en' | 'ne';

interface Translations {
  [key: string]: { en: string; ne: string };
}

const translations: Translations = {
  // ─── Auth: Register ───────────────────────────────────
  'auth.headerLogoA11y': { en: 'Return to seller sign in', ne: 'विक्रेता लग इनमा फर्कनुहोस्' },
  'auth.signUp.title': { en: 'Sign Up to GoPasal Seller', ne: 'GoPasal विक्रेतामा दर्ता गर्नुहोस्' },
  'auth.signUp.subtitle': { en: 'Create your seller account', ne: 'आफ्नो विक्रेता खाता बनाउनुहोस्' },
  'auth.signUpGoogle': { en: 'Sign Up with Google', ne: 'Google बाट दर्ता गर्नुहोस्' },
  'auth.signUpPhone': { en: 'Sign Up with Phone', ne: 'फोन नम्बरबाट दर्ता गर्नुहोस्' },
  'auth.signUp': { en: 'Sign Up', ne: 'दर्ता गर्नुहोस्' },
  'auth.alreadyHave': { en: 'Already have an account?', ne: 'पहिले नै खाता छ?' },
  'auth.logIn': { en: 'Log In', ne: 'लग इन गर्नुहोस्' },
  'auth.tos': { en: 'By signing up, I agree to the', ne: 'दर्ता गरेर, म सहमत छु' },
  'auth.tosLink': { en: 'Terms of Service', ne: 'सेवा सर्तहरू' },
  'auth.privacyLink': { en: 'Privacy Policy', ne: 'गोपनीयता नीति' },
  'auth.and': { en: 'and', ne: 'र' },

  // ─── Auth: Login ──────────────────────────────────────
  'auth.signIn.title': { en: 'Sign In to GoPasal Seller', ne: 'GoPasal विक्रेतामा लग इन गर्नुहोस्' },
  'auth.signIn.subtitle': { en: 'Enter your email and password', ne: 'इमेल र पासवर्ड प्रविष्ट गर्नुहोस्' },
  'auth.signIn.otpSubtitle': { en: 'Enter your phone number to receive OTP', ne: 'OTP प्राप्त गर्न फोन नम्बर प्रविष्ट गर्नुहोस्' },
  'auth.signIn': { en: 'Sign In', ne: 'लग इन गर्नुहोस्' },
  'auth.signInOtp': { en: 'Sign In with OTP', ne: 'OTP बाट लग इन गर्नुहोस्' },
  'auth.signInEmail': { en: 'Sign In with Email', ne: 'इमेलबाट लग इन गर्नुहोस्' },
  'auth.sendOtp': { en: 'Send OTP', ne: 'OTP पठाउनुहोस्' },
  'auth.verifyOtp': { en: 'Verify OTP', ne: 'OTP प्रमाणित गर्नुहोस्' },
  'auth.otpSent': { en: 'OTP sent to your phone', ne: 'तपाईंको फोनमा OTP पठाइयो' },
  'auth.enterOtp': { en: 'Enter OTP Code', ne: 'OTP कोड प्रविष्ट गर्नुहोस्' },
  'auth.dontHave': { en: "Don't have an account?", ne: 'खाता छैन?' },
  'auth.signUpLink': { en: 'Sign Up', ne: 'दर्ता गर्नुहोस्' },
  'auth.changeNumber': { en: 'Change number', ne: 'नम्बर परिवर्तन गर्नुहोस्' },
  'auth.useEmailInstead': { en: 'Use Email Instead', ne: 'यसको सट्टा इमेल प्रयोग गर्नुहोस्' },
  'auth.verifyAndContinue': { en: 'Verify & Continue', ne: 'प्रमाणित गर्नुहोस् र अगाडि बढ्नुहोस्' },
  'auth.phonePlaceholder': { en: 'Phone Number (98XXXXXXXX)', ne: 'फोन नम्बर (९८XXXXXXXX)' },
  'auth.otpPlaceholder': { en: 'Enter 6-digit OTP', ne: '६-अंकको OTP प्रविष्ट गर्नुहोस्' },
  'auth.sentTo': { en: 'Sent to +977 ', ne: 'यसमा पठाइयो +977 ' },
  'auth.illustration.title': { en: 'GoPasal Seller', ne: 'GoPasal विक्रेता' },
  'auth.illustration.subtitle': {
    en: 'Grow your business online',
    ne: 'अनलाइनमार्फत व्यवसाय बढाउनुहोस्',
  },

  // ─── Common Form Fields ───────────────────────────────
  'auth.or': { en: 'or', ne: 'वा' },
  'auth.fullName': { en: 'Full Name', ne: 'पूरा नाम' },
  'auth.email': { en: 'Email Address', ne: 'इमेल ठेगाना' },
  'auth.phone': { en: 'Phone Number', ne: 'फोन नम्बर' },
  'auth.password': { en: 'Password', ne: 'पासवर्ड' },
  'auth.forgotPassword': { en: 'Forgot Password?', ne: 'पासवर्ड बिर्सनुभयो?' },

  // ─── Category Selection ───────────────────────────────
  'category.title': { en: 'What do you sell?', ne: 'तपाईं के बेच्नुहुन्छ?' },
  'category.illustrationTitle': { en: 'What do you sell?', ne: 'तपाईं के बेच्नुहुन्छ?' },
  'category.subtitle': { en: 'Select your primary business category. This will customize your dashboard experience.', ne: 'आफ्नो प्रमुख व्यवसाय श्रेणी छान्नुहोस्। यसले तपाईंको ड्यासबोर्ड अनुभव अनुकूलित गर्नेछ।' },
  'category.continue': { en: 'Continue', ne: 'अगाडि बढ्नुहोस्' },
  'category.selectOne': { en: 'Please select a category', ne: 'कृपया एउटा श्रेणी छान्नुहोस्' },
  'category.grocery': { en: 'Grocery & Essentials', ne: 'किराना तथा आवश्यक सामान' },
  'category.groceryDesc': { en: 'Fresh produce, daily essentials, pantry items', ne: 'ताजा उत्पादन, दैनिक आवश्यकता, भान्साका सामान' },
  'category.photoPrint': { en: 'Photo & Print', ne: 'फोटो तथा प्रिन्ट स्टुडियो' },
  'category.photoPrintDesc': {
    en: 'Photo printing, ID & passport photos, lamination, banners, mugs, and custom print jobs',
    ne: 'फोटो प्रिन्ट, पासपोर्ट/परिचयपत्र फोटो, ल्यामिनेसन, ब्यानर, मग प्रिन्ट तथा अनुकूलित प्रिन्ट सेवा',
  },
  'category.restaurant': { en: 'Restaurant & Cloud Kitchen', ne: 'रेस्टुरेन्ट तथा क्लाउड किचन' },
  'category.restaurantDesc': { en: 'Prepared food, beverages, dine-in or delivery', ne: 'तयार खाना, पेय पदार्थ, खाना वा डेलिभरी' },
  'category.fashion': { en: 'Fashion', ne: 'फेसन तथा लुगाफाटा' },
  'category.fashionDesc': { en: 'Clothing, shoes, accessories, jewelry', ne: 'कपडा, जुत्ता, सामान, गहना' },
  'category.electronics': { en: 'Electronics & Gadgets', ne: 'इलेक्ट्रोनिक्स तथा ग्याजेटहरू' },
  'category.electronicsDesc': { en: 'Phones, laptops, accessories, appliances', ne: 'फोन, ल्यापटप, सामान, उपकरण' },
  'category.health': { en: 'Health & Beauty', ne: 'स्वास्थ्य तथा सौन्दर्य' },
  'category.healthDesc': { en: 'Pharmacy, skincare, wellness products', ne: 'फार्मेसी, छालाको हेरचाह, स्वास्थ्य उत्पादन' },
  'category.services': { en: 'Services & More', ne: 'सेवा तथा अन्य' },
  'category.servicesDesc': { en: 'Home services, repairs, consulting, tutoring', ne: 'घरेलु सेवा, मर्मत, परामर्श, ट्युसन' },

  // ─── Store Verification ───────────────────────────────
  'verify.title': { en: 'Store Verification', ne: 'पसल प्रमाणीकरण' },
  'verify.subtitle': { en: 'Complete the verification to activate your store', ne: 'आफ्नो पसल सक्रिय गर्न प्रमाणीकरण पूरा गर्नुहोस्' },
  'verify.step1Title': { en: 'Business Information', ne: 'व्यवसाय जानकारी' },
  'verify.step1Desc': { en: 'Tell us about your business', ne: 'आफ्नो व्यवसायको बारेमा बताउनुहोस्' },
  'verify.step2Title': { en: 'Documents', ne: 'कागजातहरू' },
  'verify.step2Desc': { en: 'Upload required documents', ne: 'आवश्यक कागजातहरू अपलोड गर्नुहोस्' },
  'verify.step3Title': { en: 'Review & Submit', ne: 'समीक्षा र पेश गर्नुहोस्' },
  'verify.step3Desc': { en: 'Review and submit your application', ne: 'आफ्नो आवेदन समीक्षा गरी पेश गर्नुहोस्' },
  'verify.businessName': { en: 'Business / Store Name', ne: 'व्यवसाय / पसलको नाम' },
  'verify.address': { en: 'Store Address', ne: 'पसलको ठेगाना' },
  'verify.panVat': { en: 'PAN / VAT Number', ne: 'पान / भ्याट नम्बर' },
  'verify.ownerName': { en: 'Owner Full Name', ne: 'मालिकको पूरा नाम' },
  'verify.description': { en: 'Business Description', ne: 'व्यवसाय विवरण' },
  'verify.uploadDoc': { en: 'Upload Business Registration Document', ne: 'व्यवसाय दर्ता कागजात अपलोड गर्नुहोस्' },
  'verify.uploadPan': { en: 'Upload PAN/VAT Certificate', ne: 'पान/भ्याट प्रमाणपत्र अपलोड गर्नुहोस्' },
  'verify.uploadPhoto': { en: 'Upload Store Photo', ne: 'पसलको फोटो अपलोड गर्नुहोस्' },
  'verify.uploadOwnerPhoto': { en: 'Upload Owner Photo', ne: 'मालिकको फोटो अपलोड गर्नुहोस्' },
  'verify.dragDrop': { en: 'Drag & drop or click to upload', ne: 'तान्नुहोस् वा क्लिक गरि अपलोड गर्नुहोस्' },
  'verify.maxSize': { en: 'Max file size: 5MB', ne: 'अधिकतम फाइल साइज: ५ एमबी' },
  'verify.submit': { en: 'Submit for Review', ne: 'समीक्षाको लागि पेश गर्नुहोस्' },
  'verify.allCorrect': { en: 'I confirm all information is correct', ne: 'म पुष्टि गर्छु कि सबै जानकारी सही छ' },
  'verify.illustration.title': { en: 'Documents & trust', ne: 'कागजात र विश्वास' },
  'verify.illustration.subtitle': {
    en: 'Complete KYC so buyers know your GoPasal store is legitimate.',
    ne: 'KYC पूरा गर्नुहोस् ताकि ग्राहकले तपाईंको GoPasal पसल वैध थाहा पाउन्।',
  },
  'verify.step2Incomplete': {
    en: 'Upload your business registration, PAN/VAT certificate, and at least one store photo before continuing.',
    ne: 'अगाडि बढ्नु अघि व्यवसाय दर्ता, पान/भ्याट प्रमाणपत्र र कम्तिमा एउटा पसल फोटो अपलोड गर्नुहोस्।',
  },
  'verify.addPhotoHint': {
    en: 'Add photos of your storefront or shop interior',
    ne: 'पसल वा भित्री दृश्यका फोटो थप्नुहोस्',
  },

  // ─── Under Review ─────────────────────────────────────
  'review.badge': { en: 'Application Under Review', ne: 'आवेदन समीक्षा अन्तर्गत' },
  'review.title': { en: 'Your Application is Under Review', ne: 'तपाईंको आवेदन समीक्षा अन्तर्गत छ' },
  'review.subtitle': { en: 'Our team is reviewing your store information and documents. This usually takes 24-48 hours.', ne: 'हाम्रो टोलीले तपाईंको पसलको जानकारी र कागजातहरू समीक्षा गर्दैछ। यो सामान्यतया २४-४८ घण्टा लाग्छ।' },
  'review.step1': { en: 'Account Created', ne: 'खाता सिर्जना भयो' },
  'review.step2': { en: 'Category Selected', ne: 'श्रेणी छानिएको' },
  'review.step3': { en: 'Documents Submitted', ne: 'कागजातहरू पेश गरिएको' },
  'review.step4': { en: 'Under Review', ne: 'समीक्षा अन्तर्गत' },
  'review.step5': { en: 'Approval', ne: 'स्वीकृति' },
  'review.etaTitle': { en: 'Estimated Review Time', ne: 'अनुमानित समीक्षा समय' },
  'review.eta': { en: 'Within 24-48 hours', ne: '२४-४८ घण्टा भित्र' },
  'review.support': { en: 'Need help? Contact support', ne: 'सहयोग चाहिन्छ? सम्पर्क गर्नुहोस्' },
  'review.supportEmail': { en: 'support@gopasal.com', ne: 'support@gopasal.com' },
  'review.refreshChecked': { en: 'Status updated — still under review.', ne: 'स्थिति अद्यावधिक भयो — अझै समीक्षामा छ।' },

  // ─── Approved ─────────────────────────────────────────
  'approved.badge': { en: 'Approved!', ne: 'स्वीकृत!' },
  'approved.title': { en: 'Your GoPasal Store is Approved!', ne: 'तपाईंको GoPasal पसल स्वीकृत भयो!' },
  'approved.subtitle': { en: 'Congratulations! Your store has been verified and is ready to go live.', ne: 'बधाई छ! तपाईंको पसल प्रमाणित भइसक्यो र सुरु गर्न तयार छ।' },
  'approved.storeStatus': { en: 'Store Status', ne: 'पसल स्थिति' },
  'approved.active': { en: 'Active', ne: 'सक्रिय' },
  'approved.visibility': { en: 'Visibility', ne: 'दृश्यता' },
  'approved.live': { en: 'Live', ne: 'लाइभ' },
  'approved.products': { en: 'Products', ne: 'उत्पादनहरू' },
  'approved.launch': { en: 'Launch Your Store', ne: 'पसल सुरु गर्नुहोस्' },

  // ─── Common ───────────────────────────────────────────
  'common.back': { en: 'Back', ne: 'पछाडि' },
  'common.next': { en: 'Next', ne: 'अर्को' },
  'common.continue': { en: 'Continue', ne: 'अगाडि बढ्नुहोस्' },
  'common.save': { en: 'Save', ne: 'सेभ गर्नुहोस्' },
  'common.cancel': { en: 'Cancel', ne: 'रद्द गर्नुहोस्' },
  'common.refresh': { en: 'Refresh Status', ne: 'स्थिति रिफ्रेस गर्नुहोस्' },
  'common.loading': { en: 'Loading...', ne: 'लोड हुँदैछ...' },
  'common.error': { en: 'Something went wrong', ne: 'केही गलत भयो' },
  'common.retry': { en: 'Try Again', ne: 'पुनः प्रयास गर्नुहोस्' },
  'common.selectCountry': { en: 'Select Country', ne: 'देश छान्नुहोस्' },

  // ─── Footer ───────────────────────────────────────────
  'footer.powered': { en: 'Powered by GoPasal Marketplace', ne: 'GoPasal मार्केटप्लेस द्वारा संचालित' },

  // ─── Command Center Navigation ────────────────────────
  'nav.dashboard': { en: 'Dashboard', ne: 'ड्यासबोर्ड' },
  'nav.orders': { en: 'Orders', ne: 'अर्डरहरू' },
  'nav.products': { en: 'Products', ne: 'उत्पादनहरू' },
  'nav.inventory': { en: 'Inventory', ne: 'इन्भेन्टरी' },
  'nav.customers': { en: 'Customers', ne: 'ग्राहकहरू' },
  'nav.analytics': { en: 'Analytics', ne: 'एनालिटिक्स' },
  'nav.earnings': { en: 'Earnings', ne: 'कमाई' },
  'nav.promotions': { en: 'Promotions', ne: 'प्रचार' },
  'nav.reviews': { en: 'Reviews', ne: 'समीक्षाहरू' },
  'nav.settings': { en: 'Settings', ne: 'सेटिङहरू' },
  'nav.more': { en: 'More', ne: 'थप' },
  'nav.logout': { en: 'Sign Out', ne: 'साइन आउट' },

  'seller.needHelp': { en: 'Need help?', ne: 'सहयोग चाहिन्छ?' },
  'seller.contactSupport': { en: 'Contact support', ne: 'समर्थनमा सम्पर्क गर्नुहोस्' },
  'seller.setAddressHint': { en: 'Add your store address', ne: 'पसलको ठेगाना थप्नुहोस्' },

  // ─── Dashboard ────────────────────────────────────────
  'dash.greeting': { en: 'Good day', ne: 'शुभ दिन' },
  'dash.performance': { en: "Today's Performance", ne: 'आजको प्रदर्शन' },
  'dash.quickActions': { en: 'Quick Actions', ne: 'द्रुत कार्यहरू' },
  'dash.storeStatus': { en: 'Store Status', ne: 'पसलको स्थिति' },
  'dash.openStatus': { en: 'Open for business', ne: 'व्यवसायको लागि खुला' },
  'dash.closedStatus': { en: 'Closed', ne: 'बन्द छ' },
  'dash.revenue': { en: 'Revenue', ne: 'राजस्व' },
  'dash.orders': { en: 'Orders', ne: 'अर्डरहरू' },
  'dash.pending': { en: 'Pending', ne: 'बाँकी' },
  'dash.rating': { en: 'Rating', ne: 'मूल्याङ्कन' },
  'dash.addProduct': { en: 'Add Product', ne: 'उत्पादन थप्नुहोस्' },
  'dash.viewOrders': { en: 'View Orders', ne: 'अर्डर हेर्नुहोस्' },
  'dash.storeProfile': { en: 'Store Profile', ne: 'पसल प्रोफाइल' },
  'dash.noAddress': { en: 'No address set', ne: 'ठेगाना सेट गरिएको छैन' },

  'orders.title': { en: 'Orders', ne: 'अर्डरहरू' },
  'orders.search': { en: 'Search orders...', ne: 'अर्डर खोज्नुहोस्...' },
  'orders.noOrders': { en: 'No orders found', ne: 'कुनै अर्डर फेला परेन' },
  'orders.noOrdersDesc': { en: 'Orders will appear here once customers place them.', ne: 'ग्राहकहरूले अर्डर राखेपछि यहाँ देखिनेछन्।' },
  'orders.accept': { en: 'Accept', ne: 'स्वीकार गर्नुहोस्' },
  'orders.reject': { en: 'Reject', ne: 'अस्वीकार गर्नुहोस्' },
  'orders.markReady': { en: 'Mark Ready', ne: 'तयार चिन्ह लगाउनुहोस्' },
  'orders.cancel': { en: 'Cancel Order', ne: 'अर्डर रद्द गर्नुहोस्' },
  'orders.details': { en: 'Order Details', ne: 'अर्डर विवरण' },
  'orders.items': { en: 'Items', ne: 'सामानहरू' },
  'orders.total': { en: 'Total', ne: 'जम्मा' },
  'orders.customer': { en: 'Customer', ne: 'ग्राहक' },
  'orders.status': { en: 'Status', ne: 'स्थिति' },
  'orders.date': { en: 'Date', ne: 'मिति' },

  'products.title': { en: 'Products', ne: 'उत्पादनहरू' },
  'products.add': { en: 'Add Product', ne: 'उत्पादन थप्नुहोस्' },
  'products.edit': { en: 'Edit Product', ne: 'उत्पादन सम्पादन गर्नुहोस्' },
  'products.name': { en: 'Product Name', ne: 'उत्पादनको नाम' },
  'products.price': { en: 'Price', ne: 'मूल्य' },
  'products.stock': { en: 'Stock', ne: 'भण्डार' },
  'products.noProducts': { en: 'No products yet', ne: 'अहिलेसम्म कुनै उत्पादन छैन' },
  'products.noProductsDesc': { en: 'Add your first product to start selling.', ne: 'बेच्न सुरु गर्न पहिलो उत्पादन थप्नुहोस्।' },
  'products.inStock': { en: 'In Stock', ne: 'स्टकमा' },
  'products.outOfStock': { en: 'Out of Stock', ne: 'स्टक समाप्त' },
  'products.lowStock': { en: 'Low Stock', ne: 'कम स्टक' },

  'inventory.title': { en: 'Inventory', ne: 'इन्भेन्टरी' },
  'inventory.manage': { en: 'Manage Stock', ne: 'भण्डार व्यवस्थापन' },
  'inventory.update': { en: 'Update Stock', ne: 'भण्डार अद्यावधिक' },

  'customers.title': { en: 'Customers', ne: 'ग्राहकहरू' },
  'customers.noCustomers': { en: 'No customers yet', ne: 'अहिलेसम्म कुनै ग्राहक छैन' },
  'customers.total': { en: 'Total Customers', ne: 'कुल ग्राहक' },

  'analytics.title': { en: 'Analytics', ne: 'एनालिटिक्स' },
  'analytics.revenue': { en: 'Total Revenue', ne: 'कुल राजस्व' },
  'analytics.orders': { en: 'Total Orders', ne: 'कुल अर्डर' },
  'analytics.average': { en: 'Avg. Order Value', ne: 'औसत अर्डर मूल्य' },
  'analytics.period': { en: 'This Month', ne: 'यो महिना' },

  'earnings.title': { en: 'Earnings', ne: 'कमाई' },
  'earnings.balance': { en: 'Available Balance', ne: 'उपलब्ध रकम' },
  'earnings.pending': { en: 'Pending Settlement', ne: 'बाँकी भुक्तानी' },
  'earnings.withdraw': { en: 'Withdraw', ne: 'झिक्नुहोस्' },

  'promotions.title': { en: 'Promotions', ne: 'प्रचार' },
  'promotions.coupons': { en: 'Coupons', ne: 'कुपनहरू' },
  'promotions.createCoupon': { en: 'Create Coupon', ne: 'कुपन बनाउनुहोस्' },
  'promotions.noCoupons': { en: 'No coupons created', ne: 'कुनै कुपन बनाइएको छैन' },

  'reviews.title': { en: 'Reviews', ne: 'समीक्षाहरू' },
  'reviews.noReviews': { en: 'No reviews yet', ne: 'अहिलेसम्म कुनै समीक्षा छैन' },
  'reviews.reply': { en: 'Reply', ne: 'जवाफ' },

  'settings.title': { en: 'Settings', ne: 'सेटिङहरू' },
  'settings.store': { en: 'Store Settings', ne: 'पसल सेटिङ' },
  'settings.profile': { en: 'Profile', ne: 'प्रोफाइल' },
  'settings.payments': { en: 'Payment Methods', ne: 'भुक्तानी विधिहरू' },
  'settings.delivery': { en: 'Delivery Settings', ne: 'डेलिभरी सेटिङ' },
  'settings.notifications': { en: 'Notifications', ne: 'सूचनाहरू' },
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',
  setLanguage: (lang: Language) => set({ language: lang }),
  t: (key: string) => {
    const lang = get().language;
    return translations[key]?.[lang] || key;
  },
}));
