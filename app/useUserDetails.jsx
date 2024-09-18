import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebaseConfig'; // Adjust the import as per your firebase configuration
import { collection, query, where, getDocs } from "firebase/firestore"; 
import { useEffect, useState } from 'react';

const useUserDetails = () => {
  const [user] = useAuthState(auth);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const usernamesRef = collection(db, 'usernames');
        const usernameQuery = query(usernamesRef, where('uid', '==', user.uid));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
          setUsername(usernameSnapshot.docs[0].data().username);
        } else {
          setUsername(user.displayName || user.email);
        }
      }
    };
    fetchUsername();
  }, [user]);

  return { user, username };
};

export default useUserDetails;
