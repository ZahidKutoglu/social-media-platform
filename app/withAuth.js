import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from './firebaseConfig'; 

const withAuth = (WrappedComponent) => {
  return (props) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setUser(user);
        } else {
          router.push('/'); 
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, [router]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null; 
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;