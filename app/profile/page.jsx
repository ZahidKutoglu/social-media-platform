"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { auth, db, storage } from '../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile, onAuthStateChanged } from 'firebase/auth';
import './profile.css'
import { Modal, Backdrop, Fade, Box } from '@mui/material';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import debounce from 'lodash.debounce';


// Function to update user's comments with new profile information
const updateCommentsWithNewProfileInfo = async (uid, newUsername, newProfilePicture) => {
  const commentsRef = collection(db, 'posts');
  const postsSnapshot = await getDocs(commentsRef);

  for (const postDoc of postsSnapshot.docs) {
    const commentsCollectionRef = collection(db, 'posts', postDoc.id, 'comments');
    const commentsQuery = query(commentsCollectionRef, where('uid', '==', uid));
    const commentsSnapshot = await getDocs(commentsQuery);

    for (const commentDoc of commentsSnapshot.docs) {
      const commentRef = doc(commentsCollectionRef, commentDoc.id);
      await updateDoc(commentRef, {
        username: newUsername,
        profilePicture: newProfilePicture,
      });
    }
  }
};

function Profile() {

  const editorRef = useRef(null); // Ensure useRef is correctly initialized within the functional component

  const defaultPic = './blankProfilePic.png';
  const [currentProfilePicture, setCurrentProfilePicture] = useState(defaultPic);
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [saving, setSaving] = useState(false);

  

  useEffect(() => {
    const fetchUserData = async (user) => {
      const usernamesRef = collection(db, 'usernames');
      const usernameQuery = query(usernamesRef, where('uid', '==', user.uid));
      const usernameSnapshot = await getDocs(usernameQuery);
  
      if (!usernameSnapshot.empty) {
        const userDoc = usernameSnapshot.docs[0].data();
        const fetchedUsername = userDoc.username || user.displayName;
        const fetchedProfilePicture = userDoc.profilePicture || user.photoURL || defaultPic;
  
        setCurrentUsername(fetchedUsername);
        setCurrentProfilePicture(fetchedProfilePicture);
  
        // Store in local storage
        localStorage.setItem('currentUsername', fetchedUsername);
        localStorage.setItem('currentProfilePicture', fetchedProfilePicture);
      } else {
        // If user document does not exist, create a new document
        const newUserDocRef = doc(db, 'usernames', user.uid);
        const newUsername = user.displayName;
        const newProfilePicture = user.photoURL || defaultPic;
      
        // Update state
        setCurrentUsername(newUsername);
        setCurrentProfilePicture(newProfilePicture);
      
        // Store in local storage
        localStorage.setItem('currentUsername', newUsername);
        localStorage.setItem('currentProfilePicture', newProfilePicture);
      
        // Set the document in Firestore
        await setDoc(newUserDocRef, {
          username: newUsername,
          profilePicture: newProfilePicture,
          uid: user.uid,
        });
      }
    };
  
    // Load data from localStorage after the component mounts
    const storedProfilePicture = localStorage.getItem('currentProfilePicture');
    const storedUsername = localStorage.getItem('currentUsername');
    if (storedProfilePicture) setCurrentProfilePicture(storedProfilePicture);
    if (storedUsername) setCurrentUsername(storedUsername);
  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  const [usernameTaken, setUsernameTaken] = useState(false);

  const handleUsernameChange = async () => {
    const user = auth.currentUser;
    if (user && newUsername) {
      try {
        // Check if the new username already exists
        const usernamesRef = collection(db, 'usernames');
        const newUsernameQuery = query(usernamesRef, where('username', '==', newUsername));
        const newUsernameSnapshot = await getDocs(newUsernameQuery);

        if (!newUsernameSnapshot.empty) {
          console.log('Username already exists. Please choose a different username.');
          setUsernameTaken(true);
          return;
        }

        const usernameQuery = query(usernamesRef, where('uid', '==', user.uid));
        const usernameSnapshot = await getDocs(usernameQuery);

        if (!usernameSnapshot.empty) {
          const userDoc = usernameSnapshot.docs[0];
          const usernameRef = doc(db, 'usernames', userDoc.id);
          await updateDoc(usernameRef, { username: newUsername });

          await updateProfile(user, { displayName: newUsername });

          // Update state and local storage
          setCurrentUsername(newUsername);
          localStorage.setItem('currentUsername', newUsername);
          setIsEditingUsername(false);

          // Update comments with new profile information
          await updateCommentsWithNewProfileInfo(user.uid, newUsername, currentProfilePicture);

          console.log('Username updated successfully!');
          setNewUsername('');
        } else {
          console.log('User document does not exist.');
        }
      } catch (error) {
        console.error('Error updating username:', error);
        console.log('Failed to update username. Please try again.');
      }
    }
  };  
  
  const [isChecking, setIsChecking] = useState(false);



  // Debounced function to check if username exists
  const checkUsernameExists = useCallback(
    debounce(async (username) => {
      if (!username) {
        setUsernameTaken(false);
        setIsChecking(false);
        return;
      }

      try {
        setIsChecking(true);
        const usernamesRef = collection(db, 'usernames');
        const newUsernameQuery = query(usernamesRef, where('username', '==', username));
        const newUsernameSnapshot = await getDocs(newUsernameQuery);

        if (!newUsernameSnapshot.empty) {
          setUsernameTaken(true);
        } else {
          setUsernameTaken(false);
        }
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsChecking(false);
      }
    }, 100), // Adjust the delay to your preference
    [db]
  );

  useEffect(() => {
    checkUsernameExists(newUsername);

    // Cleanup function to cancel debounce if the component unmounts
    return () => checkUsernameExists.cancel();
  }, [newUsername, checkUsernameExists]);
  

  const handleProfilePictureChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file)); // Use URL.createObjectURL for the uploaded image
      setOriginalImage(file); // Store the original file
      setModalSwitch(true);

      event.target.value = null;
    }
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser; 
    if (editorRef.current && uploadedImage) {
      try {
        const canvas = editorRef.current.getImageScaledToCanvas();
        if (canvas) {
          canvas.toBlob(async (blob) => {
            if (!blob) {
              console.error('Failed to convert canvas content to blob.');
              return;
            }
  
            const storageRef = ref(storage, `profile_pictures/${user.uid}/cropped_${Date.now()}.png`);
            await uploadBytes(storageRef, blob);
  
            const downloadURL = await getDownloadURL(storageRef);
  
            // Update profile picture in Firestore
            const usernamesRef = collection(db, 'usernames');
            const usernameQuery = query(usernamesRef, where('uid', '==', user.uid));
            const usernameSnapshot = await getDocs(usernameQuery);
  
            if (!usernameSnapshot.empty) {
              const userDoc = usernameSnapshot.docs[0];
              const usernameRef = doc(db, 'usernames', userDoc.id);
              await updateDoc(usernameRef, { profilePicture: downloadURL });
  
              // Also update the profile picture in Firebase Auth
              await updateProfile(user, { photoURL: downloadURL });
  
              // Update state and local storage
              setCurrentProfilePicture(downloadURL);
  
              // Optionally, update comments and other references
              await updateCommentsWithNewProfileInfo(user.uid, currentUsername, downloadURL);
  
              console.log('Profile picture updated successfully!');

              setTimeout(() => {
                modalOff();
                setSaving(false);
              }, 50);
              setShowDropdown(false);
              setScale(1.0)
            }
          }, 'image/png');
        }
      } catch (error) {
        console.error('Error saving profile picture:', error);
      }
    }
  };
  

  const handleProfilePictureRemove = useCallback(async () => {
    const user = auth.currentUser;
  
    if (user && currentProfilePicture) {
      try {
        const filename = currentProfilePicture.split('?')[0]; // Remove query parameters
        const storageRef = ref(storage, filename);
  
        await deleteObject(storageRef);
  
        const usernamesRef = collection(db, 'usernames');
        const usernameQuery = query(usernamesRef, where('uid', '==', user.uid));
        const usernameSnapshot = await getDocs(usernameQuery);
  
        if (!usernameSnapshot.empty) {
          const userDoc = usernameSnapshot.docs[0];
          const usernameRef = doc(db, 'usernames', userDoc.id);
  
          await updateDoc(usernameRef, { profilePicture: defaultPic });
          await updateProfile(user, { photoURL: defaultPic });
  
          setCurrentProfilePicture(defaultPic);
          localStorage.setItem('currentProfilePicture', defaultPic);
  
          await updateCommentsWithNewProfileInfo(user.uid, currentUsername, defaultPic);
  
          console.log('Profile picture removed successfully!');
        }
      } catch (error) {
        console.error('Error removing profile picture:', error);
      }
    }
  }, [currentProfilePicture, currentUsername]);
  
  
  
  const [modalSwitch, setModalSwitch] = useState(false);
  const [modalSwitch2, setModalSwitch2] = useState(false);
  const [modalSwitch3, setModalSwitch3] = useState(false);
  

    const modalOn = () => setModalSwitch(true);
    const modalOff = () => setModalSwitch(false);

    const modalContainerStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%', // Use percentage for more flexibility
      maxWidth: '600px', // Cap max width for larger screens
      minWidth: '300px', // Allow a smaller minimum width for small screens
      height: 'auto',
      maxHeight: '90vh',
      minHeight: '30vh',
      outline: 'none',
      zIndex: 1000,
    };

    const modalContainerStyle2 = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '430px', // Adjusted for a more flexible width
      height: '295px',
      outline: 'none',
      zIndex: 1000,
      backgroundColor: '#151515',
      borderRadius: 5,
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Adjusted for better cross-browser support
   };
   
   const modalContainerStyle3 = {
    position: 'absolute',
    top: '450px',
    left: '523px',
    transform: 'translate(-50%, -50%)',
    width: '160px', 
    height: 'auto',
    maxHeight: '90vh',
    minHeight: '6vh',
    outline: 'none',
    backgroundColor: '#171717',
    borderRadius: 3,
   };

    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [focusInput, setFocusInput] = useState(false);

    const handleInputFocus = () => {
      setFocusInput(true); 
    };
  
    const handleInputBlur = () => {
      setFocusInput(false); 
    };

    const inputRef = useRef(null);

    useEffect(() => {
      if (focusInput && inputRef.current) {
        inputRef.current.focus();
      }
    }, [focusInput === true]);


    const [passwordFalse, setPasswordFalse] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLengthOk, setPasswordLengthOk] = useState(false)

    const handleChangePassword = async (currentPassword, newPassword) => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Re-authenticate the user
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);

          setPasswordFalse(false);
    
          // If re-authentication is successful, update the password
          if (newPassword) {
            await updatePassword(user, newPassword);
            console.log('Password updated successfully!');
          }
        } catch (error) {
          if (error.code === 'auth/wrong-password') {
            setPasswordFalse(true); // Set to false as the password is incorrect
            console.log('The current password is incorrect.');
          } else if (error.code === 'auth/too-many-requests') {
            console.log('Too many requests. Please try again later.');
          } else if (error.code === 'auth/invalid-credential') {
            setPasswordFalse(true); // Handle invalid credential
          } else {
            setPasswordFalse(true); // Generic failure handling
            console.log('Failed to update password. Please try again.');
          }
        }
      }
    };    
    
    


    const [showDropdown, setShowDropdown] = useState(false);

    const handleToggleDropdown = (event) => {
      event.stopPropagation(); // Prevents the click from closing the dropdown immediately
      setShowDropdown((prev) => !prev);
    };

    const handleCloseDropdown = () => {
        if (showDropdown) {
            setShowDropdown(false);
        }
    };

    const [scale, setScale] = useState(1.0);

    const handleZoomChange = (event) => {
      setScale(parseFloat(event.target.value));
    };



  if (loading) {
    return <p>Loading...</p>;
  }
  

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div className='profile-text'>Profile</div>
    <div className="profile-container">
      
      <div  style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 500, fontFamily: '' }}>{currentUsername}</div>
        </div>
        <div className='profile-picture'>
            <img src={currentProfilePicture} alt="Profile Picture" />
        </div>

      </div>

      <div onClick={() => setModalSwitch2(true)} className='edit-profile-container'>
      <div className='edit-profile'>Edit Profile</div>
      </div>

              

            <Modal
                open={modalSwitch2}
                onClose={() => { setModalSwitch2(false); setShowDropdown(false); setCurrentPassword(''); setNewPassword('');
                                setIsEditingUsername(false);  handleInputBlur(); setUsernameTaken(false); }}
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
                    <Box sx={modalContainerStyle2}>
                      <div onClick={handleCloseDropdown}>

                        <div>
                        <div>
                        <div onClick={() => currentProfilePicture !== 'blankProfilePic.png' ? setShowDropdown(true) : null} style={{ position: 'absolute', left: 315, }} className='profile-picture'>

                        {(currentProfilePicture === './blankProfilePic.png' || currentProfilePicture === 'blankProfilePic.png') &&
                          <input id='profilePictureInput' style={{ display: 'none' }} type="file" accept="image/*" onChange={handleProfilePictureChange}/>
                        }
                          <label  style={{ cursor: 'pointer' }} htmlFor="profilePictureInput">
                          <img src={currentProfilePicture} alt="Profile Picture" />
                          </label>
                        </div>
                        {showDropdown &&
                        <div onClick={(event) => event.stopPropagation()} style={{ backgroundColor: '#1d1d1d', width: '212px', borderRadius: '14px', position: 'absolute', left: 20, minHeight: '10vh', height: 'auto', left: 207, top: 115 }}>
                        
                       
                        <input id='profilePictureInput2' style={{ display: 'none' }} type="file" accept="image/*" onChange={handleProfilePictureChange}/>
                        
                        <label htmlFor="profilePictureInput2">
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 7 }}>
                        <div className={currentProfilePicture !== './blankProfilePic.png' ? 'upload-picture': 'upload-picture-default'}>Upload Picture</div>
                        </div>
                        </label>
                        {currentProfilePicture != './blankProfilePic.png' && 
                        <div onClick={() => setShowDropdown(false)} style={{ display: 'flex', justifyContent: 'center' }}>
                          <div onClick={handleProfilePictureRemove} className='remove-current-pic' style={{ color: 'red', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>Remove current picture</div>
                        </div>
                        }
                        </div>
                        }
                        </div>
                            
                            <Modal
                              open={modalSwitch3}
                              onClose={() => setModalSwitch3(false)}
                              BackdropProps={{
                                sx: { backgroundColor: 'rgba(0, 0, 0, 0)' } // Fully transparent background
                              }}
                            >
                            <Box sx={{
                              ...modalContainerStyle3,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <div>
                                <div className='upload-picture' style={{ color: 'white', fontWeight: 450, display: 'flex', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>Upload Picture</div>
                                {currentProfilePicture != './blankProfilePic.png' && 
                                <div style={{ color: 'red', fontWeight: 450}}>Remove current picture</div>
                                }
                              </div>
                            </Box>
                            </Modal>
          
                          <div style={{ color: 'white', marginTop: 15, marginLeft: 12 }} className='username-text'>Username</div>
                          <input
                            style={{ 
                              marginTop: 10, 
                              marginLeft: 12,
                              marginBottom: 9,
                              fontSize: 14,
                              outline: 'none', 
                              background: 'none', 
                              border: 'none', 
                              color: 'white', 
                              fontWeight: 400,
                              fontFamily: 'system-ui',
                              width: '67%',
                            }}
                            ref={inputRef}
                            type="text"
                            value={isEditingUsername ? newUsername : currentUsername}
                            onChange={(e) => {
                              setNewUsername(e.target.value);
                              setIsEditingUsername(true);
                             
                            }}
                          />
                          {usernameTaken && <div style={{ marginTop: -5, marginBottom: 10, marginLeft: 14, fontSize: 11, fontWeight: 250, color: 'white', display: true ? '' : 'none' }}>Username is Already Taken!</div>}
                          <div style={{ marginLeft: 12}} className="profile-line"></div>
                        </div>

                        <div>
                          <div style={{ color: 'white',marginTop: 15, marginLeft: 12 }} className='password-text'>Password</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <input 
                            style={{ 
                              marginTop: 10, 
                              marginLeft: 12,
                              marginBottom: 9,
                              fontSize: 14,
                              outline: 'none', 
                              background: 'none', 
                              border: 'none', 
                              color: 'white', 
                              fontWeight: 500,
                              fontFamily: 'system-ui',
                            }}
                            type="password" 
                            placeholder="Current Password" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                          {passwordFalse && <div style={{ marginTop: -5, marginBottom: 10, marginLeft: 14, fontSize: 14, fontWeight: 450, color: 'red', display: passwordFalse ? '' : 'none' }}>Does not match your current password</div>}
                          </div>
                          

                          <input 
                            style={{ 
                              marginLeft: 12,
                              fontSize: 14,
                              outline: 'none', 
                              background: 'none', 
                              border: 'none', 
                              color: 'white', 
                              fontWeight: 500,
                              fontFamily: 'system-ui',
                              marginBottom: 10
                            }}
                            type="password" 
                            placeholder="New Password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          {newPassword && newPassword.length < 6 && <div style={{ marginTop: -5, marginBottom: 10, marginLeft: 14, fontSize: 13, fontWeight: 350, color: 'white', display: newPassword.length < 6 ? '' : 'none' }}>Password must be at least 6 characters</div>}
                        </div>
                        <div style={{ marginLeft: 12}} className="profile-line"></div>
                        <div style={{  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',  marginTop: '11.3vh' }}>
                        <div onClick={() => {isEditingUsername || !usernameTaken ?  handleUsernameChange() : null;
                                             currentPassword ?  handleChangePassword(currentPassword, newPassword) : null; 
                                             setModalSwitch2(false);
                                             setCurrentPassword(''); setNewPassword(''); setIsEditingUsername(false);
                                             setUsernameTaken(false);  
                                             }} className='done-btn'
                                             >Done</div> 
                        </div>
                      </div>
                    </Box>
            </Modal>
      <div>
      </div>

            <Modal
                open={modalSwitch}
                onClose={() => {modalOff(); setScale(1.0); setSaving(false);}}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 200,
                    style: { backgroundColor: 'rgba(0, 0, 0, 0.95)' }
                }}
            >
                
                    <Box sx={{ ...modalContainerStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div>

                      <AvatarEditor
                      ref={editorRef}
                      image={uploadedImage}
                      width={250} // Adjust as needed
                      height={250} // Adjust as needed
                      border={0}
                      borderRadius={125} // Ensures it's circular; half of the width or height
                      scale={scale} // Adjust as needed
                      rotate={0} // Adjust as needed
                      />
              
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="0.1"
                      value={scale}
                      onChange={handleZoomChange}
                    />
                    </div>
                    <div className='savePictureBtnContainer' style={{ display: 'flex', justifyContent: 'center', marginTop: 27 }}>
                      <button className='savePictureBtn' onClick={() => {handleSave(); setSaving(true);}}>{saving ? 'Saving...' : 'Save'}</button>
                    </div>
                    </div>
                    </Box>
               
            </Modal>
    </div>
    </div>
  );
}

export default Profile;
