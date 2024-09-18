'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, doc, onSnapshot, getDoc, getDocs, query, where } from 'firebase/firestore';
import './likes.css'
import { useContextt } from '../ContextProvider';
import Image from 'next/image';


const LikedUsersList = () => {

  const { allLikedUsers } = useContextt();

  return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="likes-text">Likes</div>
      <div className="likes-container">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', color: 'white' }} className="liked-users-list">
          {allLikedUsers.length > 0 ? (
            allLikedUsers.map((user) => (
              <div style={{ marginBottom: 10 }} key={user.uid} className="liked-user">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {user.profilePicture ? (
                    <img
                      src={`${user.profilePicture}?v=${Date.now()}`}
                      alt="Profile"
                      width={50}
                      height={50}
                      style={{ borderRadius: '100%', marginRight: 10 }}
                    />
                  ) : (
                    <div className="placeholder-profile" />
                  )}
                  <div>
                    <span style={{ fontWeight: 700 }}>{user.username}</span>
                    <span style={{ fontWeight: 350 }}> liked your post: {user.postContent}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', height: '87vh', alignItems: 'center' }}>No likes yet</div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default LikedUsersList;

