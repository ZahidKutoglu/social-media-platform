'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import Modal from 'react-modal';
import './loginPage.css'



function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modalSwitch, setModalSwitch] = useState(false);
  const [modalSwitch2, setModalSwitch2] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [usernameFocused2, setUsernameFocused2] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordValid2, setIsPasswordValid2] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPasswordFocused2, setIsPasswordFocused2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [wrongCredentials, setWrongCredentials] = useState(false); 
  const router = useRouter();
  const passwordInputRef = useRef();
  const passwordInputRef2 = useRef();

  useEffect(() => {
    const checkUsername = debounce(async () => {
      if (username) {
        const usernamesRef = collection(db, 'usernames');
        const usernameQuery = query(usernamesRef, where('username', '==', username));
        const usernameSnapshot = await getDocs(usernameQuery);

        setUsernameTaken(!usernameSnapshot.empty);
      }
    }, 40);

    checkUsername();
  }, [username]);


  const handleKeyDown = (e, nextInputRef) => {
    if (e.key === 'Enter' && username && !usernameTaken) {
      nextInputRef.current.focus();
    }
  };

  const handleEnterKey = (e) => {
    if (e.key === 'Enter' && password && e.target.value.length > 5) {
      document.querySelector('.done-button-background').click();
    }
  }

  const handleKeyDown2 = (e, nextInputRef) => {
      if (e.key === 'Enter' && username) {
        nextInputRef.current.focus();
      }
    };

  const handleEnterKey2 = (e) => {
    if (e.key === 'Enter' && password && e.target.value.length > 5) {
      document.querySelector('.logIn-button-background').click();
    }
  }


  const modalOn = () => setModalSwitch(true);
  const modalOff = () => setModalSwitch(false);

  const modalOn2 = () => setModalSwitch2(true);
  const modalOff2 = () => setModalSwitch2(false);

  useEffect(() => {
    if (modalOff || modalOff2) {
      setUsername('');
      setPassword('');
      setUsernameTaken(false);
    }
  }, [modalSwitch, modalSwitch2])

  const modalStyle = {
    overlay: {
      backgroundColor: 'rgba(36,45,52,0.5)',
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'black',
      width: '450px',
      height: '390px',
      borderColor: 'black',
      borderRadius: 12,
      overflow: 'hidden',
    },
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(result.user);
      router.push('/home');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert("Google Sign-In failed. Please try again.");
    }
  };

  const handleCreateAccount = async () => {
    try {
      console.log('Creating account...');
      const usernamesRef = collection(db, 'usernames');
      const usernameQuery = query(usernamesRef, where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        setUsernameTaken(true);
        return;
      }

      const placeholderEmail = `${username}@placeholder.com`;

      const result = await createUserWithEmailAndPassword(auth, placeholderEmail, password);
      await addDoc(usernamesRef, {
        uid: result.user.uid,
        username: username,
        email: placeholderEmail,
        profilePicture: 'blankProfilePic.png',
      });

      console.log('User created:', result.user);
      router.push('/home');
    } catch (error) {
      console.error('Account Creation Error:', error);
      alert('Account creation failed. Please try again.');
    }
  };

  const handleSignIn = async () => {
  setIsLoading2(true);
  try {
    console.log('Signing in...');
    const usernamesRef = collection(db, 'usernames');
    const usernameQuery = query(usernamesRef, where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);

    if (usernameSnapshot.empty) {
      console.log('Username not found.');
      setIsLoading2(false);
      setWrongCredentials(true);
      return;
    }

    const userDoc = usernameSnapshot.docs[0];
    const userEmail = userDoc.data().email;

    const result = await signInWithEmailAndPassword(auth, userEmail, password);
    console.log('User signed in:', result.user);
    router.push('/home');
  } catch (error) {
    console.error('Sign-In Error:', error);
    setWrongCredentials(true);
    setIsLoading2(false);
  }
};




  return (
    <div>
      <div className="loginContainer-parent">
        <div className="login-container">
          <div className="PostIt-text">PostIt</div>
          <div className="JoinToday-text">Join Today.</div>
          <div style={{ display: 'inline-block' }}>
            <div className="SignUp-button" onClick={handleGoogleSignIn}>
              <img width={22} src="/googleIcon.png" alt="Google Icon" />
              <span style={{ marginBottom: 2 }}>Sign up with Google</span>
            </div>
          </div>
          <div className="or-container">
            <div className="line"></div>
            <span className="or-text">or</span>
            <div className="line"></div>
          </div>
          <div className="createAccount-button" onClick={modalOn}>
            <span style={{ marginBottom: 2 }}>Create account</span>
          </div>
          <div style={{ marginBottom: 6 }}>Already have an account?</div>
          <div className="signIn-button" onClick={modalOn2}>Sign in</div>
        </div>
      </div>
      <Modal isOpen={modalSwitch} onRequestClose={modalOff} style={modalStyle}>
        <div>
          <div className='createAccountModal'>
          <div className="modal-close-button" onClick={modalOff}/>
            <div className='create-your-account-text'>Create your account</div>
            <input
              className={`usernameInput ${usernameTaken ? 'usernameInput-error' : ''}`}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              onKeyDown={(e) => handleKeyDown(e, passwordInputRef)}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              autoFocus={true}
            />
            {usernameFocused && (
              usernameTaken ? 
                (<div style={{ color: 'red', fontSize: 12, fontWeight: 300, marginBottom: 12, marginTop: -3 }}>Username is unavailable. Try adding numbers, letters, underscores, or periods</div>) :
                <div style={{ color: 'white', fontSize: 12, fontWeight: 300, marginBottom: 12, marginTop: -3 }}>Please only use numbers, letters, underscores, or periods</div>
            )}
            <input
              className='passwordInput'
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsPasswordValid(e.target.value.length > 5);
              }
              }
              placeholder="Password"
              ref={passwordInputRef}
              onKeyDown={(e) => handleEnterKey(e)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            {isPasswordFocused && !isPasswordValid && (
                <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 12, marginTop: -3, color: 'white'}}>
                Password must be at least 6 characters
                </div>
            )}
            <div 
             style={{ pointerEvents: username && !usernameTaken && password ? 'auto' : 'none', backgroundColor: isLoading ? '#787a7a' : ''}}
             onClick={() => {handleCreateAccount(); setIsLoading(true);}} 
             className={username && password && !usernameTaken && isPasswordValid ? 'done-button-background' : 'done-button '} 
             >
            {isLoading ? (
              <div className='loader'></div>
             ) : (
              <span style={{ marginBottom: 1 }}>done</span>
             )
            }
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalSwitch2} onRequestClose={modalOff2} style={modalStyle}>
        <div>
          <div className='createAccountModal'>
          <div className="modal-close-button" onClick={modalOff2}/>
            <div className='create-your-account-text'>Sign In to PostIt</div>
            <div>
            <div style={{ display: 'flex', justifyContent: 'center'}}>
            <div  style={{ width: 300, paddingLeft: '21%' }} className="SignUp-button" onClick={() => {handleGoogleSignIn(); setIsLoading(true);}}>
              <img width={22} src="/googleIcon.png" alt="Google Icon" />
              <span style={{ marginBottom: 2 }}>Sign in with Google</span>
            </div>
            </div>
            </div>
            <div className="or-container">
            <div className="line"></div>
            <span className="or-text">or</span>
            <div className="line"></div>
            </div>
            <input
              className="usernameInput"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              onKeyDown={(e) => handleKeyDown2(e, passwordInputRef2)}
              onFocus={() => setUsernameFocused2(true)}
              onBlur={() => setUsernameFocused2(false)}
            />
            <input
              className='passwordInput'
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsPasswordValid2(e.target.value.length > 5);
              }
              }
              placeholder="Password"
              ref={passwordInputRef2}
              onKeyDown={(e) => handleEnterKey2(e)}
              onFocus={() => setIsPasswordFocused2(true)}
              onBlur={() => setIsPasswordFocused2(false)}
            />
            {isPasswordFocused2 && !isPasswordValid2 && (
                <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 12, marginTop: -3, color: 'white'}}>
                Password must be at least 6 characters
                </div>
            )}
            {wrongCredentials && 
            <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 12, marginTop: 255, color: 'white', position: 'fixed'}}>
            Please check your credentials and try again.
            </div>
            }
            <div 
             style={{ pointerEvents: username && password && isPasswordValid2 ? 'auto' : 'none', backgroundColor: isLoading2 ? '#787a7a' : ''}}
             onClick={() => {handleSignIn(); setIsLoading2(true);}} 
             className={username && password && isPasswordValid2 ? 'logIn-button-background' : 'logIn-button'} 
             >
            {isLoading2 ? (
              <div className='loader'></div>
             ) : (
              <span style={{ marginBottom: 1 }}>Log in</span>
             )
            }
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
