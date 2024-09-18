"use client";

import React, { useState, useEffect } from 'react';
import { auth, db, storage } from './firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ThreeDPreview from './ThreeDPreview'; // Import the new component
import './CreatePost.css';

function CreatePost() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    profilePicture: './blankProfilePic.png',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const usernamesRef = collection(db, 'usernames');
        const usernameQuery = query(usernamesRef, where('uid', '==', user.uid));
        const usernameSnapshot = await getDocs(usernameQuery);

        if (!usernameSnapshot.empty) {
          const userDoc = usernameSnapshot.docs[0].data();
          const fetchedUserData = {
            username: userDoc.username,
            profilePicture: userDoc.profilePicture || './blankProfilePic.png',
          };

          setUserData(fetchedUserData);

        }
      }
    };
    fetchUserData();
  }, []);

  const handleMediaChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // Concatenate new files with existing media
    setMedia((prevMedia) => [...prevMedia, ...newFiles]);

    // Generate previews for new files and concatenate with existing previews
    const newPreviews = newFiles.map((file) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        return URL.createObjectURL(file);
      } else if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        return URL.createObjectURL(file);
      }
      return null;
    }).filter(Boolean);

    setMediaPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  const removePreview = (index) => {
    const newMedia = [...media];
    const newPreviews = [...mediaPreviews];

    newMedia.splice(index, 1);
    newPreviews.splice(index, 1);

    setMedia(newMedia);
    setMediaPreviews(newPreviews);
  };

  const handlePost = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('You need to be logged in to create a post.');
      return;
    }
  
    if (!content && media.length === 0) {
      alert('Please add text or upload media.');
      return;
    }
  
    setLoading(true);
  
    // Fetch the latest user data before creating the post
    const usernamesRef = collection(db, 'usernames');
    const usernameQuery = query(usernamesRef, where('uid', '==', user.uid));
    const usernameSnapshot = await getDocs(usernameQuery);
  
    let latestUserData = {
      username: userData.username,
      profilePicture: userData.profilePicture,
    };
  
    if (!usernameSnapshot.empty) {
      const userDoc = usernameSnapshot.docs[0].data();
      latestUserData = {
        username: userDoc.username,
        profilePicture: userDoc.profilePicture || './blankProfilePic.png',
      };
    }
  
    const mediaURLs = [];
    for (const file of media) {
      const mediaRef = ref(storage, `posts/${user.uid}/${file.name}`);
      await uploadBytes(mediaRef, file);
      const mediaURL = await getDownloadURL(mediaRef);
      const mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : '3d';
      mediaURLs.push({ url: mediaURL, type: mediaType });
    }
  
    try {
      const post = {
        uid: user.uid,
        username: latestUserData.username,
        profilePicture: latestUserData.profilePicture,
        content,
        likes: [],
        mediaURLs,
        timestamp: serverTimestamp(),
      };
  
      await addDoc(collection(db, 'posts'), post);
  
      setContent('');
      setMedia([]);
      setMediaPreviews([]);
      setLoading(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div style={{ color: 'white', fontSize: 19, marginBottom: 25 }}>Create a Post</div>
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: 14, fontWeight: 500, marginBottom: 14, width: 430 }}
        autoFocus={true}
      />
      <div className="file-input-container">
        <input
          type="file"
          id="file"
          accept="image/*,video/*,.glb,.gltf"
          multiple
          onChange={handleMediaChange}
          className="file-input"
        />
        <label htmlFor="file" className="file-input-label">
          <img className='imageIcon' width={30} src="imageIcon.png" alt="Upload media" />
        </label>
      </div>
      <div className="media-previews">
        {mediaPreviews.map((preview, index) => (
          <div key={index} className="media-preview">
            {media[index].type.startsWith('image/') ? (
              <img src={preview} alt={`preview-${index}`} />
            ) : media[index].type.startsWith('video/') ? (
              <video src={preview} controls />
            ) : (
              <ThreeDPreview url={preview} />
            )}
            <div className={`remove-button ${media[index].type.startsWith('video/') ? 'video' : ''}`} onClick={() => removePreview(index)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
      <span className='postButtonContainer' style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -3 }}>
        <span
          className='postButton'
          style={{
            color: content ? 'white' : '#545455',
            pointerEvents: content && !loading ? 'auto' : 'none',
            cursor: 'pointer',
            border: content ? '2px solid #343434' : '2px solid #212121',
            borderRadius: 7,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 12,
            paddingRight: 12,
            fontSize: 15,
            marginRight: -12,
          }}
          onClick={handlePost}
        >
          <span>{loading ? 'Posting...' : 'Post'}</span>
        </span>
      </span>
    </div>
  );
}

export default CreatePost;
