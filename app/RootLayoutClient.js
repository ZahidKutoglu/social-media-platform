// app/RootLayoutClient.js

"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "./sideBar";
import NewPost from './NewPost';


export default function RootLayoutClient({ children }) {
  const pathname = usePathname();
  const showSidebar = pathname === '/home' || pathname === '/search' || pathname === '/profile' || pathname === '/likes';


  return (
    <>
      {children}
      {showSidebar && (<><Sidebar /> && <NewPost /></>)}
    </>
  );
}
