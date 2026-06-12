import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
// 全局样式
import './app.scss';
import useAppStore from '@/store';

function App(props) {
  // 可以使用所有的 React Hooks
  useEffect(() => {
    console.log('[App] Initializing store hydrate');
    useAppStore.getState()._hydrate();
  }, []);

  // 对应 onShow
  useDidShow(() => {
    console.log('[App] App did show, hydrating store');
    useAppStore.getState()._hydrate();
  });

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
