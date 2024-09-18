import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebaseConfig';

const CommentsList = ({ postId, postOwnerUid }) => {
  const [comments, setComments] = useState([]);
  const [user] = useAuthState(auth); // Get the authenticated user

  useEffect(() => {
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('postId', '==', postId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleDelete = async (commentId, commentUid) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div>
      {comments.map((comment) => (
        <div key={comment.id}>
          <div>
            <img src={comment.profilePicUrl} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
            <p><strong>{comment.username}</strong>: {comment.text}</p>
          </div>
          {(user?.uid === comment.uid || user?.uid === postOwnerUid) && (
            <button onClick={() => handleDelete(comment.id, comment.uid)}>Delete</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentsList;
