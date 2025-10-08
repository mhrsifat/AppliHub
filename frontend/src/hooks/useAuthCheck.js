// src/hooks/useAuthCheck.js
import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import api, { setAccessToken } from '../services/api';
import { setUser, setEmployee, setAdmin, clearUser } from '../features/auth/slices/authSlice';

export default function useAuthCheck() {
    const dispatch = useDispatch();
    const effectRan = useRef(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (effectRan.current === true) {
            return;
        }

        const init = async () => {
            try {
                const refreshRes = await api.post('/auth/refresh', {}, { withCredentials: true });
                const newToken = refreshRes?.data?.access_token;

                if (newToken) setAccessToken(newToken);
                if (refreshRes?.data?.admin) dispatch(setAdmin(refreshRes.data.admin));
                if (refreshRes?.data?.user) dispatch(setUser(refreshRes.data.user));
                if (refreshRes?.data?.employee) dispatch(setEmployee(refreshRes.data.employee));

            } catch (error) {
                console.error("Auth refresh failed:", error);
                dispatch(clearUser());
            } finally {
                setLoading(false);
            }
        };

        init();

        return () => {
            effectRan.current = true;
        };
    }, [dispatch]);

    return loading;
}