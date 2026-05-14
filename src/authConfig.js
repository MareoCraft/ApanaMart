const otpScriptUrls = [
  'https://verify.msg91.com/otp-provider.js',
  'https://verify.phone91.com/otp-provider.js',
]

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return fallback
  return value.toLowerCase() === 'true'
}

export const authConfig = {
  firebase: {
    apiKey: "AIzaSyBNtG7szCRA9Zpq_t9IYLTQahi9XIth24I",
    authDomain: "test-a3543.firebaseapp.com",
    databaseURL: "https://test-a3543-default-rtdb.firebaseio.com",
    projectId: "test-a3543",
    storageBucket: "test-a3543.firebasestorage.app",
    messagingSenderId: "139198625108",
    appId: "1:139198625108:web:12c428d935eee270bf84c1",
    measurementId: "G-XV1SM5CNYX"
  },
  firebaseOrders: {
    apiKey: import.meta.env.VITE_ORDERS_FIREBASE_API_KEY || "AIzaSyC4-Khc0rquvjfID1L0lBfZJPSLMDeKD1c",
    authDomain: import.meta.env.VITE_ORDERS_FIREBASE_AUTH_DOMAIN || "test-a3543.firebaseapp.com",
    databaseURL:
      import.meta.env.VITE_ORDERS_FIREBASE_DATABASE_URL ||
      "https://test-a3543-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_ORDERS_FIREBASE_PROJECT_ID || "test-a3543",
    storageBucket:
      import.meta.env.VITE_ORDERS_FIREBASE_STORAGE_BUCKET ||
      "test-a3543.firebasestorage.app",
    messagingSenderId:
      import.meta.env.VITE_ORDERS_FIREBASE_MESSAGING_SENDER_ID || "139198625108",
    appId:
      import.meta.env.VITE_ORDERS_FIREBASE_APP_ID ||
      "1:139198625108:web:159238424dffa93abf84c1",
    measurementId: import.meta.env.VITE_ORDERS_FIREBASE_MEASUREMENT_ID || "G-LB7CL2KE1N",
  },
  msg91: {
    widgetId: "36626f726351353133303030",
    tokenAuth: "494451TqB1hHx069920bfdP1",
    authKey: "494451AMDa2Ww8b699209a5P1",
    verifyApiUrl:
      import.meta.env.VITE_MSG91_VERIFY_API_URL ||
      'https://control.msg91.com/api/v5/widget/verifyAccessToken',
    enableClientSideAccessTokenVerification: parseBoolean(
      import.meta.env.VITE_MSG91_VERIFY_ACCESS_TOKEN,
      false,
    ),
    allowWidgetSuccessFallback: parseBoolean(
      import.meta.env.VITE_MSG91_ALLOW_WIDGET_SUCCESS_FALLBACK,
      true,
    ),
  },
  usersCollection: import.meta.env.VITE_USERS_COLLECTION || 'Mumunity',
  otpScriptUrls,
}

export const hasFirebaseConfig = [
  authConfig.firebase.apiKey,
  authConfig.firebase.authDomain,
  authConfig.firebase.projectId,
  authConfig.firebase.appId,
].every(Boolean)

export const hasOrdersFirebaseConfig = [
  authConfig.firebaseOrders.apiKey,
  authConfig.firebaseOrders.authDomain,
  authConfig.firebaseOrders.projectId,
  authConfig.firebaseOrders.appId,
].every(Boolean)

export const hasMsg91Config = [
  authConfig.msg91.widgetId,
  authConfig.msg91.tokenAuth,
].every(Boolean)
