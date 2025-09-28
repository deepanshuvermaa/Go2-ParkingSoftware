import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export const useConnectivity = () => {
  const [isOnline, setOnline] = useState(true);

  useEffect(() => {
    const subscription = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable));
    });
    return () => subscription();
  }, []);

  return isOnline;
};
