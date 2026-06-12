import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import type { Building } from '@/types';

interface BuildingCardProps {
  building: Building;
  onClick?: (building: Building) => void;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building, onClick }) => {
  return (
    <View className={styles.card} onClick={() => onClick?.(building)}>
      <View className={styles.imageWrap}>
        <Image
          className={styles.image}
          src={building.image}
          mode="aspectFill"
        />
        <View className={styles.distance}>{building.distance}</View>
      </View>
      <View className={styles.content}>
        <Text className={styles.name}>{building.name}</Text>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{building.itemCount}</Text>
            <Text>件物品</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{building.activeUsers}</Text>
            <Text>位邻居</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BuildingCard;
