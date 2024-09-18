import React, { useState } from 'react';
import { Modal, Backdrop, Fade, Box } from '@mui/material';
import './NewPost.css';
import CreatePost from './CreatePost';

export default function NewPost() {
    const [modalSwitch, setModalSwitch] = useState(false);

    const modalOn = () => setModalSwitch(true);
    const modalOff = () => setModalSwitch(false);

    const modalContainerStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '60%',
        minWidth: '500px',
        height: 'auto', 
        maxHeight: '90vh', 
        minHeight: '30vh',
        outline: 'none',
        zIndex: 1000,
    };

    const modalStyle = {
        position: 'relative',
        backgroundColor: '#181818',
        borderColor: 'black',
        borderRadius: '15px',
        boxShadow: 5,
        padding: '16px 32px 24px',
    };


    return (
        <span>
            <span style={{ position: 'fixed', top: 0, right: 0, zIndex: 3 }}>
                <span onClick={modalOn} className='plus-sign-container'>
                    <span style={{ color: 'white', fontSize: 30, marginTop: 12 }}>+</span>
                </span>
            </span>
            <Modal
                open={modalSwitch}
                onClose={modalOff}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 200,
                    style: { backgroundColor: 'rgba(0, 0, 0, 0.4)' }
                }}
            >
                <Fade in={modalSwitch} timeout={350}>
                    <Box className='modalContainerStyle'>
                        <span className='newPostText'>New Post</span>
                        <Box className='modalStyle'>
                            <span className='topContainer'>
                            <span className='newPostText2'>New Post</span>
                            <span onClick={modalOff} className='closeButton'>
                            <svg  xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                            </svg>
                            </span>
                            </span>
                            <CreatePost modalOff={modalOff} />
                        </Box>
                    </Box>
                </Fade>
            </Modal>
        </span>
    );
}
