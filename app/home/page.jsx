'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { db, auth, storage } from '../firebaseConfig'; // Ensure auth is imported from firebaseConfig
import { collection, query, orderBy, onSnapshot, deleteDoc, updateDoc, doc, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import CommentSection from '../CommentSection';
import { Modal, Backdrop, Fade, Box, Button, TextField } from '@mui/material';
import './Feed.css';
import LikeButton from '../LikeButton';
import { useContextt } from '../ContextProvider';
import dynamic from 'next/dynamic';
import Slider from 'react-slick';


const ThreeDPreview = dynamic(() => import('../ThreeDPreview'), { ssr: false });

function Feed() {
  const { modelLoad, posts, setPosts } = useContextt();
  
  const [usernames, setUsernames] = useState([]);
  const [modalSwitch, setModalSwitch] = useState(false);
  const [modalSwitch2, setModalSwitch2] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [postToDelete, setPostToDelete] = useState(null);
  const [userLikedPosts, setUserLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState(null); // State for new post

  useEffect(() => {
    const fetchPostsAndUsernames = async () => {
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, orderBy('timestamp', 'desc'));
      const usernamesRef = collection(db, 'usernames');

      const unsubscribePosts = onSnapshot(postsQuery, async (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          likes: doc.data().likes || [],
        }));

        const updatedPosts = await Promise.all(
          postsData.map(async (post) => {
            const userQuery = query(usernamesRef, where('uid', '==', post.uid));
            const userSnapshot = await getDocs(userQuery);
            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              return {
                ...post,
                username: userData.username,
                profilePicture: userData.profilePicture || './blankProfilePic.png',
              };
            }
            return post;
          })
        );

        setPosts(updatedPosts);
        setLoading(false);
        console.log('Updated posts with user data:', updatedPosts);
      });

      return () => {
        unsubscribePosts();
      };
    };

    fetchPostsAndUsernames();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDeletePost = async () => {
    try {
      if (postToDelete && postToDelete.mediaURLs) {
        const deletePromises = postToDelete.mediaURLs.map((media) => {
          const mediaRef = ref(storage, media.url);
          return deleteObject(mediaRef).catch((error) => {
            if (error.code === 'storage/object-not-found') {
              console.warn(`Media file not found: ${media.url}`);
              // File does not exist, but we can continue deleting the post
              return null;
            } else {
              throw error; // Rethrow other errors
            }
          });
        });
        await Promise.all(deletePromises);
      }
  
      await deleteDoc(doc(db, 'posts', postToDelete.id));
  
      const updatedPosts = posts.filter((post) => post.id !== postToDelete.id);
      setPosts(updatedPosts);
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
      console.log('Post deleted successfully!');
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };
  

  const handleAddPost = async (newPostData) => {
    try {
      const postRef = await addDoc(collection(db, 'posts'), newPostData);
      const userQuery = query(collection(db, 'usernames'), where('uid', '==', newPostData.uid));
      const userSnapshot = await getDocs(userQuery);
      let userData = {};
      if (!userSnapshot.empty) {
        userData = userSnapshot.docs[0].data();
      }

      const newPost = {
        id: postRef.id,
        ...newPostData,
        username: userData.username,
        profilePicture: userData.profilePicture || './blankProfilePic.png',
      };

      setPosts((prevPosts) => [newPost, ...prevPosts]);
      console.log('Post added successfully:', newPost);
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Failed to add post. Please try again.');
    }
  };

  const modalOn = () => {
    setModalSwitch(true);
  };

  const modalOff = () => {
    setModalSwitch(false);
  };

  const modalOn2 = () => {
    setModalSwitch2(true);
  };

  const modalOff2 = () => {
    setModalSwitch2(false);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '60%',
    minWidth: '350px',
    maxHeight: '90vh',
    minHeight: '10vh',
    outline: 'none',
    zIndex: 1000,
    backgroundColor: '#262626',
    borderRadius: '15px',
    boxShadow: 3,
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setModalSwitch(true);
  };

  const handleSaveEdit = async () => {
    try {
      const postRef = doc(db, 'posts', editingPost.id);
      await updateDoc(postRef, { content: editContent });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === editingPost.id ? { ...post, content: editContent } : post
        )
      );

      localStorage.setItem('posts', JSON.stringify(posts.map((post) =>
        post.id === editingPost.id ? { ...post, content: editContent } : post
      )));

      setEditingPost(null);
      setModalSwitch2(false);
      console.log('Post edited successfully!');
    } catch (error) {
      console.error('Error editing post:', error);
      alert('Failed to edit post. Please try again.');
    }
  };

  const handleModalClose = () => {
    setEditingPost(null);
    setModalSwitch(false);
    setModalSwitch2(false);
  };

  const videoRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      videoRefs.current.forEach((video) => {
        if (!video) return;

        const { top, bottom } = video.getBoundingClientRect();
        const isVisible = top < window.innerHeight && bottom >= 200;

        if (!isVisible) {
          fadeOutAndPause(video);
        } else if (document.visibilityState === 'visible') {
          fadeInAndPlay(video);
        }
      });
    };

    const handleVisibilityChange = () => {
      videoRefs.current.forEach((video) => {
        if (!video) return;

        if (document.visibilityState === 'hidden') {
          video.pause();
        } else {
          const { top, bottom } = video.getBoundingClientRect();
          const isVisible = top < window.innerHeight && bottom >= 200;

          if (isVisible) {
            fadeInAndPlay(video);
          }
        }
      });
    };

    const fadeOutAndPause = (video) => {
      video.style.transition = 'opacity 0.5s';
      video.style.opacity = '0';
      video.pause();
    };

    const fadeInAndPlay = (video) => {
      video.style.transition = 'opacity 0.8s';
      video.style.opacity = '1';
      video.play();
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };


  return (
    <div className="feed-container">
      {posts.length === 0 && (
        <div style={{ color: 'white', display: 'flex', justifyContent: 'center', height: '98vh', alignItems: 'center' }}>
          Nothing To Show
        </div>
      )}
      {posts.map((post, postIndex)  => (
        <div key={post.id}>
          <div className="post">
            <div className="post-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {post.profilePicture ? (
                  <img
                    src={`${post.profilePicture}?v=${Date.now()}`}
                    alt="Profile"
                    width="50"
                    height="50"
                  />
                ) : (
                  <div className="placeholder-profile" />
                )}
                <h3>{post.username}</h3>
              </div>
              {auth.currentUser && post.uid === auth.currentUser.uid && (
                <div>
                  <span onClick={() => { setPostToDelete(post); handleEditPost(post); setModalSwitch(true); }} className="threeDots">...</span>

                  <Modal
                    open={modalSwitch}
                    onClose={() => setModalSwitch(false)}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                      timeout: 200,
                      style: { backgroundColor: 'rgba(0, 0, 0, 0.4)' }
                    }}
                  >
                    <Fade in={modalSwitch} timeout={350}>
                      <Box sx={modalStyle}>
                        <div className="delete-edit-post">
                          <div className="button delete" onClick={() => { handleDeletePost(); setModalSwitch(false); }}>Delete</div>
                          <div className="divider"></div>
                          <div className="button edit" onClick={() => { setModalSwitch(false); setModalSwitch2(true); }}>Edit</div>
                        </div>
                      </Box>
                    </Fade>
                  </Modal>

                  <Modal
                    open={modalSwitch2}
                    onClose={handleModalClose}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                      timeout: 200,
                      style: { backgroundColor: 'rgba(0, 0, 0, 0.4)' }
                    }}
                  >
                    <Fade in={modalSwitch2} timeout={350}>
                      <Box sx={modalStyle}>
                        <TextField
                          label="Edit Post"
                          multiline
                          rows={4}
                          variant="outlined"
                          fullWidth
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          InputProps={{
                            style: {
                              color: 'white',
                              borderRadius: '8px',
                              padding: '10px',
                            },
                          }}
                          InputLabelProps={{
                            style: {
                              color: '#757575',
                            },
                          }}
                          style={{
                            marginBottom: '20px',
                          
                          }}
                        />
                        <Button onClick={handleSaveEdit}>Save</Button>
                      </Box>
                    </Fade>
                  </Modal>
                </div>
              )}
            </div>
            {post.mediaURLs.length > 1 ? (
            <Slider {...sliderSettings}>
              {post.mediaURLs.map((media, index) => (
                <div key={index}>
                  {media.type === 'image' && (
                    <img src={media.url} alt="Post media" className="post-media" />
                  )}
                  {media.type === 'video' && (
                      <video ref={el => videoRefs.current[postIndex * post.mediaURLs.length + index] = el} className="post-media video-hover" controls autoPlay loop muted playsInline>
                      <source src={media.url} type="video/mp4" />
                      Your browser does not support the video tag.
                      </video>
                  )}
                  {media.type === '3d' && (
                    <div>
                      {modelLoad && (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <div className="spinner">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                          <div style={{ marginTop: 40 }}>3D Model Loading...</div>
                        </div>
                      )}
                      <ThreeDPreview url={media.url} />
                    </div>
                  )}
                </div>
              ))}
            </Slider>
          ) : (
            post.mediaURLs.map((media, index) => (
              <React.Fragment key={index}>
                {media.type === 'image' && (
                  <img src={media.url} alt="Post media" className="post-media" />
                )}
                {media.type === 'video' && (
                  <video ref={el => videoRefs.current[postIndex * post.mediaURLs.length + index] = el} className="post-media video-hover" controls autoPlay loop muted playsInline>
                    <source src={media.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                {media.type === '3d' && (
                  <div>
                    {modelLoad && (
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="spinner">
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                        <div style={{ marginTop: 40 }}>3D Model Loading...</div>
                      </div>
                    )}
                    <ThreeDPreview url={media.url} />
                  </div>
                )}
              </React.Fragment>
            ))
          )}

            <div className="post-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p>{post.content}</p>
                <p>{formatTimestamp(post.timestamp)}</p>
              </div>
              <div style={{ display: 'flex' }}>
                <div>
                <LikeButton postId={post.id} />
                </div>
                <CommentSection post={post} postId={post.id} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Feed;
