import axios from 'axios';

axios.interceptors.request.use(
    config => {
        let token = null;
        try { token = localStorage.getItem('vtt_token'); } catch (e) { console.error('localStorage read failed:', e); }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Auto-logout + redirect on 401 from any request.
// Guards against redirect loops while already on /login.
axios.interceptors.response.use(
    response => response,
    error => {
        const status = error?.response?.status;
        if (status === 401) {
            try { localStorage.removeItem('vtt_token'); } catch (e) { console.error('localStorage clear failed:', e); }
            window.dispatchEvent(new Event('auth-change'));
            const path = window.location?.pathname || '';
            if (!path.startsWith('/login') && !path.startsWith('/register')) {
                window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    }
);
