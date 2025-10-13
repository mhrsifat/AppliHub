// src/hooks/useAuthCheck.js
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api, { setAccessToken } from '../services/api';
import { setUser, setEmployee, setAdmin, clearUser } from '../features/auth/slices/authSlice';

export default function useAuthCheck() {
    const dispatch = useDispatch();
    const { user, employee, admin } = useSelector((state) => state.auth); // <--- get from Redux
    const effectRan = useRef(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (effectRan.current) return;

        const init = async () => {
            try {
                // only refresh if no current session
                if (!user && !employee && !admin) {
                    const refreshRes = await api.post('/auth/refresh', {}, { withCredentials: true });
                    const newToken = refreshRes?.data?.access_token;

                    if (newToken) setAccessToken(newToken);
                    if (refreshRes?.data?.admin) dispatch(setAdmin(refreshRes.data.admin));
                    if (refreshRes?.data?.user) dispatch(setUser(refreshRes.data.user));
                    if (refreshRes?.data?.employee) dispatch(setEmployee(refreshRes.data.employee));
                }
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
    }, [dispatch, user, employee, admin]);

    return loading;
}
