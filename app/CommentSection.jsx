import React, { useEffect, useState } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, doc, getDoc, deleteDoc, where } from 'firebase/firestore';
import { Modal, Backdrop, Fade, Box, Button, TextField } from '@mui/material';
import LikeButton from './LikeButton';
import './CommentSection.css';
import ThreeDPreview from './ThreeDPreview';

const CommentSection = ({ postId, post }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userData, setUserData] = useState({
    username: localStorage.getItem('currentUsername') || '',
    profilePicture: localStorage.getItem('currentProfilePicture') || '',
  });
  const [postOwner, setPostOwner] = useState(null);
  const [modalSwitch, setModalSwitch] = useState(false);
  const [modalSwitch2, setModalSwitch2] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);

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
            profilePicture: userDoc.profilePicture,
          };

          setUserData(fetchedUserData);

          // Store in local storage
          localStorage.setItem('currentUsername', userDoc.username);
          localStorage.setItem('currentProfilePicture', userDoc.profilePicture);
        }
      }
    };

    const fetchComments = () => {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const q = query(commentsRef, orderBy('timestamp', 'desc'));

      const unsubscribeComments = onSnapshot(q, async (snapshot) => {
        const commentsData = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
          const commentData = docSnapshot.data();
          const userDocRef = doc(collection(db, 'usernames'), commentData.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const user = userDoc.data();
            return {
              id: docSnapshot.id,
              ...commentData,
              username: user.username,
              profilePicture: user.profilePicture,
            };
          }
          return { id: docSnapshot.id, ...commentData };
        }));
        setComments(commentsData);
      });

      return unsubscribeComments;
    };

    const fetchPostOwner = async () => {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const postData = postDoc.data();
        setPostOwner(postData.uid);
      }
    };

    const unsubscribeUser = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData();
        fetchPostOwner();
      }
    });

    const unsubscribeComments = fetchComments();

    return () => {
      if (unsubscribeComments) unsubscribeComments();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [postId]);

  useEffect(() => {
    const unsubscribeUserProfile = onSnapshot(collection(db, 'usernames'), (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const modifiedUser = change.doc.data();
          setComments(prevComments =>
            prevComments.map(comment =>
              comment.uid === modifiedUser.uid
                ? { ...comment, username: modifiedUser.username, profilePicture: modifiedUser.profilePicture }
                : comment
            )
          );
        }
      });
    });

    return () => unsubscribeUserProfile();
  }, []);

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (newComment.trim() === '') return;

    const user = auth.currentUser;

    await addDoc(collection(db, 'posts', postId, 'comments'), {
      content: newComment,
      timestamp: new Date(),
      uid: user.uid,
      username: userData.username,
      profilePicture: userData.profilePicture,
    });

    setNewComment('');
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeleteAllComments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'posts', postId, 'comments'));
      const batch = db.batch();
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting all comments:', error);
    }
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '60%',
    minWidth: '400px',
    maxHeight: '70vh',
    minHeight: 'auto',
    outline: 'none',
    zIndex: 1000,
    backgroundColor: '#1a1a1a',
    borderRadius: 5,
    boxShadow: 3,
  };

  const modalStyle2 = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '60%',
    minWidth: '350px',
    maxHeight: '70vh',
    minHeight: '10vh',
    outline: 'none',
    zIndex: 1000,
    backgroundColor: '#262626',
    borderRadius: 5,
    boxShadow: 3,
  };

  return (
    <div>
      <img onClick={() => setModalSwitch(true)} className='commentIcon' src="commentIcon.webp" alt="" />
      <Modal
        open={modalSwitch}
        onClose={() => {setModalSwitch(false); setNewComment('')}}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 200,
          style: { backgroundColor: 'rgba(0, 0, 0, 0.4)' }
        }}
      >
        <Fade in={modalSwitch} timeout={350}>
          <Box sx={{...modalStyle, maxWidth: '100%', maxHeight: '100vh' }}>
            <div className="post">
              <div className="post-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {post.profilePicture ? (
                    <img
                      src={post.profilePicture}
                      alt="Profile"
                      width="50"
                      height="50"
                    />
                  ) : (
                    <div className="placeholder-profile" />
                  )}
                  <h3>{post.username}</h3>
                </div>
              </div>
              {post.mediaURLs.map((media, index) => (
                <React.Fragment key={index}>
                  {media.type === 'image' && (
                    <img src={media.url} alt="Post media" className="post-media" />
                  )}
                  {media.type === 'video' && (
                    <video className="post-media" controls>
                      <source src={media.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
  
                </React.Fragment>
              ))}
              <div style={{ marginTop: -12, display: 'flex', justifyContent: 'space-between' }} className="post-footer">
                <p>{post.content}</p>
                <p>
                  {post.timestamp && post.timestamp.seconds
                    ? new Date(post.timestamp.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Date not available'}
                </p>
              </div>
            </div>
            <div style={{ marginBottom: 20, color: 'white', marginLeft: 12, marginTop: -30, marginBottom: 43}}>
              <LikeButton postId={post.id} />
            </div>
              <div style={{ marginLeft: 5 }}>
              <input
                className='comment-input'
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                autoFocus='true'
              />
              <span style={{ color: '#008ef6', fontWeight: 450, fontSize: 15, cursor: 'pointer' }} onClick={handleAddComment}>Post</span>
              </div>
            <div className="comments-container">
              {comments.map(comment => (
                 <div style={{ color: 'white', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                   {comment.profilePicture ? (
                     <img src={comment.profilePicture} alt="Profile" width="30" height="30" style={{ borderRadius: '50%', marginLeft: 12 }} />
                   ) : (
                     <div className="placeholder-profile" />
                   )}
                   <div style={{ marginLeft: '10px', flexGrow: 1 }}>
                     <div style={{ display: 'flex', alignItems: 'center' }}>
                       <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{comment.username}</span>
                       <span style={{ fontWeight: 300,}}>{comment.content}</span>
                     </div>
                     <div style={{ fontSize: '12px', color: 'gray' }}>
                       {new Date(comment.timestamp.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                     </div>
                   </div>
                 </div>
                 {auth.currentUser && (comment.uid === auth.currentUser.uid || postOwner === auth.currentUser.uid) && (
                   <div style={{ position: 'relative' }}>
                     <span onClick={() => { setSelectedCommentId(comment.id); setModalSwitch2(true); }} className="threeDots2" style={{ cursor: 'pointer', marginLeft: '-30px', marginTop: -17,  position: 'absolute' }}>...</span>
                     <Modal
                      open={modalSwitch2 && selectedCommentId === comment.id}
                       onClose={() => setModalSwitch2(false)}
                       closeAfterTransition
                       BackdropComponent={Backdrop}
                       BackdropProps={{
                         timeout: 200,
                         style: { backgroundColor: 'rgba(0, 0, 0, 0.53)' }
                       }}
                     >
                       <Fade in={modalSwitch2}>
                         <Box sx={{ ...modalStyle2 }}>
                           <div className="delete-cancel-post">
                             <div className="button delete2" onClick={() => { handleDeleteComment(comment.id); setModalSwitch2(false); }}>Delete</div>
                             <div className="divider2"></div>
                             <div className="button cancel" onClick={() => setModalSwitch2(false)}>Cancel</div>
                           </div>
                         </Box>
                       </Fade>
                     </Modal>
                   </div>
                 )}
               </div>
              ))}
            </div>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};

export default CommentSection;
