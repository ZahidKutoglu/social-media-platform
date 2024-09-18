'use client'

import React, { useContext, useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useContextt } from './ContextProvider';

const LikedUsersList = () => {

  const { postId } = useContextt();

  const [likedUsers, setLikedUsers] = useState([]);

  useEffect(() => {
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('postId', '==', postId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const users = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const userId = doc.data().userId;
          const userRef = collection(db, 'usernames');
          const userQuery = query(userRef, where('uid', '==', userId));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            return userSnapshot.docs[0].data();
          } else {
            return null;
          }
        })
      );

      setLikedUsers(users.filter(user => user !== null));
    });

    return () => unsubscribe();
  }, [postId]);

  return (
    <div className="liked-users-list">
      {likedUsers.map((user) => (
        <div key={user.uid} className="liked-user">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" width="50" height="50" />
          ) : (
            <div className="placeholder-profile" />
          )}
          <span>{user.username}</span>
        </div>
      ))}
    </div>
  );
};

export default LikedUsersList;