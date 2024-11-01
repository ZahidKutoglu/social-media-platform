'use client';

import { Drawer, List, ListItem, ListItemIcon, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { Modal, Backdrop, Fade } from '@mui/material';
import CreatePost from './CreatePost';
import withAuth from './withAuth';
import './sideBar.css'
import { useContextt } from './ContextProvider';
import { db, auth } from './firebaseConfig';
import { collection, onSnapshot, doc, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';


const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [hasLikes, setHasLikes] = useState(false);
  const [isLikesPage, setIsLikesPage] = useState(false);

  const useWindowWidth = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowWidth;
  };

  const menuItems = [
    { icon: <HomeIcon />, outlinedIcon: <HomeOutlinedIcon />, index: 0, link: '/home', label: 'Home' },
    { icon: <SearchIcon />, outlinedIcon: <SearchOutlinedIcon />, index: 1, link: '/search', label: 'Search' },
    ...(useWindowWidth() <= 750 ? [{ icon: <AddIcon />, outlinedIcon: <AddIcon />, index: 2 }] : []),
    {
      icon: (
        <div className="favoriteIconWrapper">
          <FavoriteIcon />
          {hasLikes && !isLikesPage && <span className="redDot"></span>}
        </div>
      ),
      outlinedIcon: (
        <div className="favoriteIconWrapper">
          <FavoriteBorderOutlinedIcon />
          {hasLikes && !isLikesPage && <span className="redDot"></span>}
        </div>
      ),
      index: 3,
      link: '/likes',
      label: 'Likes',
    },
    { icon: <PersonIcon />, outlinedIcon: <PersonOutlineOutlinedIcon />, index: 4, link: '/profile', label: 'Profile' },
  ];


  const getSelectedIndex = (path) => {
    const item = menuItems.find((menuItem) => path.startsWith(menuItem.link));
    return item ? item.index : 0;
  };

  const initialSelectedIndex = getSelectedIndex(pathname);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
  
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const hasLikesValue = docSnapshot.data().hasLikes || false;
            setHasLikes(hasLikesValue);
          }
        });
  
        return () => unsubscribe();
      }
    });
  
    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    const updateLikesStatus = async () => {
      const user = auth.currentUser;
      if (user && pathname === '/likes') {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userDocRef, { hasLikes: false });
          setHasLikes(false);
        } catch (error) {
        }
      }
      setIsLikesPage(pathname === '/likes');
    };
  
    updateLikesStatus();
    setSelectedIndex(getSelectedIndex(pathname));
  }, [pathname]);
  
  useEffect(() => {
  }, [hasLikes]);
  
  

  const handleAddIconClick = () => {
    modalOn();
    setActiveIndex(2);
  };

  const handleListItemClick = (index, link) => {
    if (index === 2) {
      handleAddIconClick();
    } else {
      setSelectedIndex(index);
      router.push(link);
      setActiveIndex(index);
    }
  };


  const [modalSwitch, setModalSwitch] = useState(false);
  const modalOn = () => setModalSwitch(true);
  const modalOff = () => setModalSwitch(false);



  return (
    <div>
    <div className='list-container'>
      <List className="Icons-list" >
        {menuItems.map((item) => (
          <Box
            key={item.index}
            onClick={() => handleListItemClick(item.index, item.link)}
            sx={{
              padding: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
              },
            }}
            aria-label={item.label}
          >
            <ListItemIcon
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '8px',
                color: selectedIndex === item.index ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                '& svg': {
                  fontSize: 36,
                },
              }}
            >
              {selectedIndex === item.index ? item.icon : item.outlinedIcon}
            </ListItemIcon>
          </Box>
        ))}
      </List>
    </div>
    <span>
      <Modal
        open={modalSwitch}
        onClose={modalOff}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 200,
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Fade in={modalSwitch} timeout={350}>
          <Box className='modalContainerStyle'>
            <span className='newPostText'>New Post</span>
            <Box className='modalStyle'>
              <span className='topContainer'>
                <span className='newPostText2'>New Post</span>
                <span onClick={modalOff} className='closeButton'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                  </svg>
                </span>
              </span>
              <CreatePost modalOff={modalOff} />
            </Box>
          </Box>
        </Fade>
      </Modal>
    </span>
  </div>
  );
};

export default Sidebar;
