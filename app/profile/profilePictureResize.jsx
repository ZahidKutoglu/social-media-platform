import React, { useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';

const ProfilePictureCrop = ({ imageUrl }) => {
  const editorRef = useRef(null);

  const handleSave = () => {
    const canvas = editorRef.current.getImageScaledToCanvas();
    // Handle saved image
  };

  return (
    <div>
      <AvatarEditor
        ref={editorRef}
        image={imageUrl}
        width={300}
        height={300}
        border={50}
        borderRadius={150}
        scale={1.2}
        rotate={0}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default ProfilePictureCrop;
