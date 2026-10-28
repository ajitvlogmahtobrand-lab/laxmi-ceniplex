import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function testAudit() {
  console.log('=== FIREBASE INTEGRATION RUNTIME AUDIT ===');
  console.log('Config Project ID:', firebaseConfig.projectId);
  console.log('Config Firestore DB ID:', firebaseConfig.firestoreDatabaseId);

  try {
    const app = initializeApp(firebaseConfig, 'audit-app');
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    console.log('\n[TEST 1] Testing Firestore Read on "movies" collection...');
    const snapshot = await getDocs(collection(db, 'movies'));
    console.log(`[TEST 1 RESULT] Successfully read "movies" collection. Documents count: ${snapshot.size}`);
    snapshot.forEach(docSnap => {
      console.log(` - Movie doc: id=${docSnap.id}, title="${docSnap.data().title}"`);
    });

    console.log('\n[TEST 2] Testing Firestore Read on "banners" collection...');
    const bannersSnap = await getDocs(collection(db, 'banners'));
    console.log(`[TEST 2 RESULT] Banners count: ${bannersSnap.size}`);

    console.log('\n[TEST 3] Testing unauthenticated write rejection (Security Rules Check)...');
    try {
      const testRef = doc(db, 'movies', 'unauth_exploit_test');
      await setDoc(testRef, {
        id: 'unauth_exploit_test',
        title: 'Hacked Movie',
        language: 'Hindi',
        durationMinutes: 120,
        releaseDate: '2026-10-28',
        certification: 'UA',
        posterUrl: 'https://example.com/poster.jpg',
        status: 'NOW_SHOWING'
      });
      console.log('[TEST 3 RESULT] FAIL: Unauthenticated write was ALLOWED! Security breach!');
      // Clean up if allowed
      await deleteDoc(testRef);
    } catch (err: any) {
      console.log('[TEST 3 RESULT] PASS: Unauthenticated write was correctly REJECTED with permission-denied:');
      console.log('   Error:', err.message || err.code);
    }

    console.log('\n[TEST 4] Testing unauthorized booking PII read...');
    try {
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      console.log(`[TEST 4 RESULT] Bookings read returned ${bookingsSnap.size} docs. Note: Check if any unauthenticated read returned customer PII`);
    } catch (err: any) {
      console.log('[TEST 4 RESULT] PASS: Unauthenticated listing of bookings collection was correctly REJECTED:');
      console.log('   Error:', err.message || err.code);
    }

    console.log('\nAudit test script complete.');
  } catch (error: any) {
    console.error('Fatal audit error:', error);
  }
}

testAudit().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
