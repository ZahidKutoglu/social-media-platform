"use client"

import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, doc, onSnapshot, getDoc, getDocs, query, where } from 'firebase/firestore';


const Context = createContext();

export const useContextt = () => {
  return useContext(Context);
};

export const ContextProvider = ({ children }) => {

  const [postId, setPostId] = useState([]);
  const [likedUsers, setLikedUsers] = useState([]);
  const [liked, setLiked] = useState(false);
  const [hasLikes, setHasLikes] = useState(false);

  const [preloadedModel, setPreloadedModel] = useState(null);
  const [modelLoad, setModelLoad] = useState(true);

  const [posts, setPosts] = useState([]);

  const [allLikedUsers, setAllLikedUsers] = useState([]);
  const [currentUserUid, setCurrentUserUid] = useState(null);

  useEffect(() => {
    // Get the current authenticated user's UID
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserUid(user.uid);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUserUid) return; // Wait until we have the current user's UID

    const likesRef = collection(db, 'likes');

    const unsubscribe = onSnapshot(likesRef, async (snapshot) => {
      try {
        const users = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            const postId = docSnapshot.data().postId;

            // Reference the post document directly by its ID
            const postDocRef = doc(db, 'posts', postId);
            const postSnapshot = await getDoc(postDocRef);

            if (postSnapshot.exists()) {
              const postOwnerUid = postSnapshot.data().uid;
              const postContent = postSnapshot.data().content;

              // Check if the current user is the owner of the post
              if (postOwnerUid === currentUserUid) {
                const userId = docSnapshot.data().userId;
                const userQuery = query(collection(db, 'usernames'), where('uid', '==', userId));
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                  return {
                    ...userSnapshot.docs[0].data(),
                    postContent, // Attach post content for display
                  };
                }
            }
          }
            return null;
          })
        );

        const validUsers = users.filter((user) => user !== null);
        setAllLikedUsers(validUsers);
      } catch {
      }
    });

    return () => unsubscribe();
  }, [currentUserUid]);

  const [redDot, setRedDot] = useState(false);
  
  const [isListening2, setIsListening2] = useState(true);


  const [likedPosts, setLikedPosts] = useState({}); 

  


  return (
    <Context.Provider value={{ postId, setPostId, likedUsers, setLikedUsers, liked, setLiked, hasLikes, 
                               setHasLikes, preloadedModel, setPreloadedModel, modelLoad, setModelLoad,
                               posts, setPosts, allLikedUsers, setAllLikedUsers, redDot, setRedDot,
                               likedPosts, setLikedPosts, allLikedUsers }}>
      {children}
    </Context.Provider>
  );
};
