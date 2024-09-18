'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './search.css';


function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        return;
      }

      const usernamesRef = collection(db, 'usernames');
      const searchQuery = query(usernamesRef, where('username', '>=', searchTerm), where('username', '<=', searchTerm + '\uf8ff'));
      const querySnapshot = await getDocs(searchQuery);

      const results = [];
      querySnapshot.forEach((doc) => {
        results.push(doc.data());
      });

      setSearchResults(results);
    };

    handleSearch();
  }, [searchTerm]); // Run this effect whenever searchTerm changes

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div className="search-text">Search</div>
    <div className="search-container">
      <div className='search-bar-container'>
      <input
        className='search-bar'
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder='Search'
        autoFocus={true}
      />
      {searchTerm && (
        <button className="clear-button" onClick={() => setSearchTerm('')}>
          &times;
        </button>
      )}
      </div>
      
        {searchResults.map((result) => (
          <div key={result.uid} className="search-result-item">
            <div style={{ display: 'flex' }}>
            {result.profilePicture && (
              <img style={{ borderRadius: '50px', marginBottom: 15 }} src={result.profilePicture || 'blankProfilePic.webp'} alt={result.username} width="50" height="50" />
            )}
            <div style={{ marginTop: 15, marginLeft: 10 }}>{result.username}</div>
            </div>
          </div>
        ))}
      
      </div>
      </div>
  );
}

export default SearchUsers;
