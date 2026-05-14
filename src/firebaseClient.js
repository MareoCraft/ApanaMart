import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { authConfig, hasFirebaseConfig, hasOrdersFirebaseConfig } from './authConfig'

let firebaseApp = null
let ordersFirebaseApp = null
let firestoreDb = null
let realtimeDb = null
let ordersRealtimeDb = null

if (hasFirebaseConfig) {
  firebaseApp = getApps().length ? getApp() : initializeApp(authConfig.firebase)
  firestoreDb = getFirestore(firebaseApp)
  realtimeDb = getDatabase(firebaseApp)
}

if (hasOrdersFirebaseConfig) {
  const ordersAppName = 'gaon-orders-app'
  const existingOrdersApp = getApps().find((app) => app.name === ordersAppName)
  ordersFirebaseApp = existingOrdersApp || initializeApp(authConfig.firebaseOrders, ordersAppName)
  ordersRealtimeDb = getDatabase(ordersFirebaseApp)
}

export { firestoreDb, realtimeDb, ordersRealtimeDb }
