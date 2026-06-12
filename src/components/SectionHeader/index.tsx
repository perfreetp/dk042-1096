import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showMore?: boolean;
  moreText?: string;
  onMoreClick?: () => void;
  morePath?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  showMore = false,
  moreText = '查看更多',
  onMoreClick,
  morePath
}) => {
  const handleMore = () => {
    if (onMoreClick) {
      onMoreClick();
    } else if (morePath) {
      Taro.navigateTo({ url: morePath });
    }
  };

  return (
    <View className={styles.header}>
      <View className={styles.titleWrap}>
        <View className={styles.accent}></View>
        <Text className={styles.title}>{title}</Text>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showMore && (
        <View className={styles.moreBtn} onClick={handleMore}>
          <Text>{moreText}</Text>
          <Text className={styles.moreIcon}>›</Text>
        </View>
      )}
    </View>
  );
};

export default SectionHeader;
