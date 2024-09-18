import React from 'react';

const withPostId = (WrappedComponent, postId) => {
  return (props) => <WrappedComponent {...props} postId={postId} />;
};

export default withPostId;