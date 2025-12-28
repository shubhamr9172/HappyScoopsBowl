import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onFinish }) => {
    const [fade, setFade] = useState(false);

    useEffect(() => {
        // Start fade out after 2 seconds
        const timer = setTimeout(() => {
            setFade(true);
            // Complete finish after fade animation (e.g. 500ms)
            setTimeout(onFinish, 500);
        }, 2000);

        return () => clearTimeout(timer);
    }, [onFinish]);

    const styles = {
        container: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            zIndex: 9999,
            transition: 'opacity 0.5s ease-out',
            opacity: fade ? 0 : 1,
            pointerEvents: fade ? 'none' : 'all',
        },
        logo: {
            width: '200px',
            height: '200px',
            objectFit: 'contain',
            animation: 'bounce 2s infinite ease-in-out',
        },
        text: {
            marginTop: '20px',
            fontSize: '1.5rem',
            color: '#FF6B6B',
            fontWeight: 'bold',
            fontFamily: "'Fredoka', sans-serif",
            animation: 'pulse 1.5s infinite',
        }
    };

    return (
        <div style={styles.container}>
            <img src="/logos/logo_3d_glossy.png" alt="Happy Scoops" style={styles.logo} />
        </div>
    );
};

export default SplashScreen;
