import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import type { Item } from '@/types';
import { statusMap, formatDeposit } from '@/types';

interface ItemCardProps {
  item: Item;
  showFavorite?: boolean;
  showManage?: boolean;
  onFavorite?: (itemId: string) => void;
  onClick?: (itemId: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  showFavorite = true,
  showManage = false,
  onFavorite,
  onClick
}) => {
  const statusInfo = statusMap[item.status];

  const handleCardClick = () => {
    if (onClick) {
      onClick(item.id);
    } else {
      Taro.navigateTo({
        url: `/pages/detail/index?id=${item.id}`
      });
    }
  };

  const handleFavoriteClick = (e: any) => {
    e.stopPropagation?.();
    if (onFavorite) {
      onFavorite(item.id);
    }
  };

  const handleEditClick = (e: any) => {
    e.stopPropagation?.();
    Taro.navigateTo({
      url: `/pages/publish/index?itemId=${item.id}`
    });
  };

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.imageWrap}>
        <Image
          className={styles.image}
          src={item.images[0]}
          mode="aspectFill"
        />
        {item.isTop && (
          <View className={styles.topBadge}>
            <StatusBadge text="🔥 管理员推荐" type="top" />
          </View>
        )}
        <View className={styles.statusBadge}>
          <StatusBadge
            status={item.status}
            text={statusInfo.text}
            type="item"
          />
        </View>
        {showFavorite && (
          <View
            className={styles.favoriteBtn}
            onClick={handleFavoriteClick}
          >
            <Text className={classnames(item.isFavorite ? styles.favorited : styles.notFavorited)}>
              {item.isFavorite ? '♥' : '♡'}
            </Text>
          </View>
        )}
      </View>
      <View className={styles.content}>
        <Text className={styles.title}>{item.title}</Text>
        <Text className={styles.desc}>{item.description}</Text>
        <View className={styles.infoRow}>
          <Text className={styles.category}>{item.categoryName}</Text>
          <Text className={styles.location}>📍 {item.ownerBuilding}</Text>
        </View>
        <View className={styles.footer}>
          <View className={styles.owner}>
            <Image className={styles.avatar} src={item.ownerAvatar} />
            <Text className={styles.ownerName}>{item.ownerName}</Text>
          </View>
          <View className={styles.stats}>
            {showManage ? (
              <View className={styles.manageBtn} onClick={handleEditClick}>
                <Text className={styles.manageText}>管理</Text>
              </View>
            ) : (
              <>
                <Text className={styles.stat}>借{item.borrowCount}次</Text>
                <Text className={styles.deposit}>{formatDeposit(item.deposit)}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default ItemCard;
