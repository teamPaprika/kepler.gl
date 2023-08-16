// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getFunctions} from 'firebase/functions';
import {getStorage} from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyAiiz2n0i2DK3Fcgc6XgFYTyYv1S8yjzEw',
  authDomain: 'eco-web-gis.firebaseapp.com',
  projectId: 'eco-web-gis',
  storageBucket: 'eco-web-gis.appspot.com',
  messagingSenderId: '407825391909',
  appId: '1:407825391909:web:fd910a31e1256a8ad27acc',
  measurementId: 'G-ZDSD8SQPZ0'
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

export {db, functions, auth, storage};
export default firebaseApp;
