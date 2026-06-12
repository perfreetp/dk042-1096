import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  actionPath?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📦',
  title,
  description,
  actionText,
  actionPath,
  onAction
}) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      Taro.switchTab({ url: actionPath }).catch(() => {
        Taro.navigateTo({ url: actionPath });
      });
    }
  };

  return (
    <View className={styles.emptyWrap}>
      <Text className={styles.emptyIcon}>{icon}</Text>
      <Text className={styles.emptyTitle}>{title}</Text>
      {description && <Text className={styles.emptyDesc}>{description}</Text>}
      {(actionText && (actionPath || onAction)) && (
        <Button className={styles.actionBtn} onClick={handleAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
