import React, { useState } from 'react';
import { db } from './firebaseConfig';
import { updateDoc, doc } from 'firebase/firestore';

const EditPost = ({ post }) => {
  const [text, setText] = useState(post.text);

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'posts', post.id), { text });
  };

  return (
    <form onSubmit={handleEdit}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} required />
      <button type="submit">Update</button>
    </form>
  );
};

export default EditPost;
