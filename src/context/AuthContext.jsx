import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import api,{payload,setToken} from '../lib/api';
import {connectSocket} from '../lib/socket';

const AuthContext=createContext(null);

export function AuthProvider({children}){
  const [me,setMe]=useState(null),[loading,setLoading]=useState(true),[socket,setSocket]=useState(null);

  const refreshMe=useCallback(async()=>{
    try{const d=payload(await api.get('/auth/me'));setMe(d.user||null);return d.user||null}
    catch{setMe(null);return null}
    finally{setLoading(false)}
  },[]);

  useEffect(()=>{
    refreshMe();
    const f=()=>{setMe(null);setLoading(false)};
    window.addEventListener('campuscrew:unauthorized',f);
    return()=>window.removeEventListener('campuscrew:unauthorized',f);
  },[refreshMe]);

  // Real-time connection. Reconnects when the role changes (the server decides rooms by role).
  const sid=me?`${me._id}:${me.role}:${me.roleSelected}`:'';
  useEffect(()=>{
    if(!me||!me.roleSelected){setSocket(null);return}
    const s=connectSocket();
    setSocket(s);
    return()=>{s?.disconnect();setSocket(null)};
  },[sid]); // eslint-disable-line react-hooks/exhaustive-deps

  const login=async credentials=>{
    const d=payload(await api.post('/auth/login',credentials));
    setToken(d.token);setMe(d.user);return d.user;
  };
  const logout=async()=>{
    try{await api.post('/auth/logout')}catch{/* still sign out locally */}
    setToken(null);setMe(null);
  };
  const chooseRole=async(role,accessCode)=>{
    const d=payload(await api.post('/auth/select-role',{role,accessCode:accessCode||undefined}));
    setToken(d.token);setMe(d.user);return d.user;
  };
  // Re-open the student/teacher chooser without logging out.
  const switchRole=()=>setMe(m=>m?{...m,roleSelected:false}:m);

  return <AuthContext.Provider value={{me,setMe,loading,login,logout,refreshMe,chooseRole,switchRole,socket}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
