import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useContextt } from './ContextProvider';
import './LikeButton.css';

const LikeButton = ({ postId }) => {
  const { setPostId } = useContextt();
  const [user] = useAuthState(auth);

  const [likeCount, setLikeCount] = useState(0);
  const [likedPosts, setLikedPosts] = useState({});
  const [userProfile, setUserProfile] = useState({ username: '', profilePicture: '' });
  const [loadingProfile, setLoadingProfile] = useState(true); // Loading state for user profile

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        }
      } catch {
      } finally {
        setLoadingProfile(false); // Set loading to false once profile is fetched
      }
    };

    fetchUserProfile();

    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('postId', '==', postId), where('userId', '==', user.uid));

    const unsubscribeLike = onSnapshot(q, (snapshot) => {
      setLikedPosts((prevState) => ({
        ...prevState,
        [postId]: !snapshot.empty,
      }));
    });

    const likesCountRef = collection(db, 'likes');
    const qCount = query(likesCountRef, where('postId', '==', postId));

    const unsubscribeLikeCount = onSnapshot(qCount, (snapshot) => {
      setLikeCount(snapshot.size);
    });

    return () => {
      unsubscribeLike();
      unsubscribeLikeCount();
    };
  }, [postId, user]);

  const handleLike = async () => {
    if (!user || loadingProfile) return;
  
    try {
      const likesRef = collection(db, 'likes');
      const q = query(likesRef, where('postId', '==', postId), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
  
      const postDocRef = doc(db, 'posts', postId);
      const postDocSnapshot = await getDoc(postDocRef);
  
      if (!postDocSnapshot.exists()) {
        return;
      }
  
      const postOwnerId = postDocSnapshot.data()?.uid; 
      const postOwnerDocRef = doc(db, 'users', postOwnerId);
      const postOwnerDocSnapshot = await getDoc(postOwnerDocRef);
  
      // If the document doesn't exist, create it
      if (!postOwnerDocSnapshot.exists()) {
        await setDoc(postOwnerDocRef, { hasLikes: false }); // Initialize the document
      }
  
      if (likedPosts[postId]) {
        // User is unliking the post
        if (!snapshot.empty) {
          const docToDelete = snapshot.docs[0].ref;
          await deleteDoc(docToDelete);
  
          // Update hasLikes manually
          await updateDoc(postOwnerDocRef, { hasLikes: false });
        }
      } else {
        // User is liking the post
        await addDoc(likesRef, {
          postId,
          userId: user.uid,
          username: userProfile.username || 'a', 
          profilePicture: userProfile.profilePicture || 'a',
          timestamp: new Date(),
        });
  
        // Update hasLikes manually
        await updateDoc(postOwnerDocRef, { hasLikes: true });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };
  


  return (
    <div>
      <div className='likeButton'>
        {likedPosts[postId] ? (
          <img 
            onClick={handleLike} 
            className='heartIconRed' 
            src="heartIconRed.png" 
            alt="Liked" 
          />
        ) : (
          <img 
            onClick={handleLike} 
            className='heartIcon' 
            src="heartIcon.png" 
            alt="Like" 
          />
        )}
      </div>
      {likeCount > 0 && (
        <div style={{ position: 'absolute', fontWeight: 400, fontSize: 13, marginTop: 3 }}>
          Likes: {likeCount}
        </div>
      )}
    </div>
  );
};

export default LikeButton;
