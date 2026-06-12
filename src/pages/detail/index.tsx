import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, Swiper, SwiperItem, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { itemsData } from '@/data/items';
import { borrowRecordsData } from '@/data/borrowRecords';
import { statusMap, formatDeposit } from '@/types';
import type { Item } from '@/types';

const mockBorrowHistory = [
  { id: 'h1', avatar: 'https://picsum.photos/id/1002/100/100', name: '王先生', date: '2026-06-01 至 2026-06-03' },
  { id: 'h2', avatar: 'https://picsum.photos/id/1003/100/100', name: '李女士', date: '2026-05-20 至 2026-05-22' },
  { id: 'h3', avatar: 'https://picsum.photos/id/1004/100/100', name: '张同学', date: '2026-05-05 至 2026-05-07' }
];

const DetailPage: React.FC = () => {
  const routerParams = Taro.useRouter().params;
  const itemId = routerParams.id || '1';

  const [item, setItem] = useState<Item | undefined>(
    itemsData.find(i => i.id === itemId) || itemsData[0]
  );
  const [currentImage, setCurrentImage] = useState(0);

  const history = useMemo(() => {
    if (!item) return mockBorrowHistory;
    const relatedRecords = borrowRecordsData.filter(
      r => r.itemId === item.id && r.status === 'returned'
    );
    if (relatedRecords.length > 0) {
      return relatedRecords.map(r => ({
        id: r.id,
        avatar: r.borrowerAvatar,
        name: r.borrowerName,
        date: `${r.pickupTime} 至 ${r.actualReturnTime || r.expectedReturnTime}`
      }));
    }
    return mockBorrowHistory;
  }, [item]);

  if (!item) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text>物品不存在</Text>
        </View>
      </View>
    );
  }

  const statusInfo = statusMap[item.status];
  const isAvailable = item.status === 'available';

  const handleFavorite = () => {
    console.log('[Detail] Toggle favorite:', item.id);
    setItem(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : prev);
    Taro.showToast({
      title: item.isFavorite ? '已取消收藏' : '收藏成功',
      icon: 'success'
    });
  };

  const handleChat = () => {
    console.log('[Detail] Chat with owner:', item.ownerId);
    Taro.navigateTo({
      url: `/pages/chat/index?userId=${item.ownerId}&userName=${encodeURIComponent(item.ownerName)}`
    });
  };

  const handleReserve = () => {
    console.log('[Detail] Reserve item:', item.id);
    if (!isAvailable) {
      Taro.showToast({ title: '该物品暂不可借', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认预约',
      content: `您将预约「${item.title}」\n押金：${formatDeposit(item.deposit)}\n取件地点：${item.pickupLocation}`,
      confirmText: '确认预约',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '预约中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showModal({
              title: '预约成功',
              content: '请按时取件，如有疑问请私信邻居~',
              showCancel: false,
              confirmText: '去查看',
              success: () => {
                Taro.switchTab({ url: '/pages/borrow/index' }).catch(() => {});
              }
            });
          }, 800);
        }
      }
    });
  };

  const handleReport = () => {
    console.log('[Detail] Report item:', item.id);
    Taro.navigateTo({
      url: `/pages/report/index?type=item&itemId=${item.id}`
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View style={{ position: 'relative' }}>
        <Swiper
          className={styles.imageSwiper}
          current={currentImage}
          onChange={e => setCurrentImage(e.detail.current)}
          circular
          autoplay
        >
          {item.images.map((img, idx) => (
            <SwiperItem key={idx}>
              <Image
                className={styles.swiperImage}
                src={img}
                mode="aspectFill"
              />
            </SwiperItem>
          ))}
        </Swiper>
        <View className={styles.imageIndicator}>
          <Text>{currentImage + 1}/{item.images.length}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>{item.title}</Text>
            <StatusBadge
              status={item.status}
              text={statusInfo.text}
              type="item"
            />
          </View>

          <View className={styles.tagsRow}>
            <StatusBadge text={item.categoryName} type="tag" />
            {item.tags.map((tag, idx) => (
              <StatusBadge key={idx} text={tag} type="tag" />
            ))}
            {item.isTop && <StatusBadge text="🔥 推荐" type="top" />}
          </View>

          <View className={styles.priceRow}>
            <View className={styles.priceItem}>
              <Text className={styles.priceLabel}>押金</Text>
              <Text className={classnames(styles.priceValue, styles.priceBlue)}>
                {formatDeposit(item.deposit)}
              </Text>
            </View>
            <View className={styles.priceItem}>
              <Text className={styles.priceLabel}>库存</Text>
              <Text className={styles.priceValue}>
                {item.availableQuantity}/{item.quantity}
              </Text>
            </View>
            <View className={styles.priceItem}>
              <Text className={styles.priceLabel}>已借</Text>
              <Text className={styles.priceValue}>{item.borrowCount}次</Text>
            </View>
          </View>
        </View>

        <View className={styles.detailSection}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionAccent}></View>
            <Text>物品描述</Text>
          </View>
          <Text className={styles.description}>{item.description}</Text>
        </View>

        <View className={styles.detailSection}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionAccent}></View>
            <Text>借还信息</Text>
          </View>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoIcon}>🕐</Text>
              <View className={styles.infoContent}>
                <Text className={styles.infoLabel}>可借时段</Text>
                <Text className={styles.infoValue}>{item.availableTime}</Text>
              </View>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoIcon}>📍</Text>
              <View className={styles.infoContent}>
                <Text className={styles.infoLabel}>取还地点</Text>
                <Text className={styles.infoValue}>{item.pickupLocation}</Text>
              </View>
            </View>
            {item.wearDesc && (
              <View className={styles.infoItem}>
                <Text className={styles.infoIcon}>📋</Text>
                <View className={styles.infoContent}>
                  <Text className={styles.infoLabel}>损耗说明</Text>
                  <Text className={styles.infoValue}>{item.wearDesc}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View className={styles.detailSection}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionAccent}></View>
            <Text>物品主人</Text>
          </View>
          <View className={styles.ownerCard}>
            <Image
              className={styles.ownerAvatar}
              src={item.ownerAvatar}
              mode="aspectFill"
            />
            <View className={styles.ownerInfo}>
              <Text className={styles.ownerName}>{item.ownerName}</Text>
              <Text className={styles.ownerDesc}>
                📍 {item.ownerBuilding} · 发布 {item.borrowCount} 次借还 · 信用优秀
              </Text>
            </View>
            <View className={styles.ownerActions}>
              <Button className={styles.iconBtn} onClick={handleChat}>
                <Text>💬</Text>
              </Button>
              <Button className={styles.iconBtn} onClick={handleReport}>
                <Text>⚠️</Text>
              </Button>
            </View>
          </View>
        </View>

        <View className={styles.detailSection}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionAccent}></View>
            <Text>借出记录</Text>
          </View>
          <View className={styles.recordsList}>
            {history.map(h => (
              <View key={h.id} className={styles.recordItem}>
                <Image
                  className={styles.recordAvatar}
                  src={h.avatar}
                  mode="aspectFill"
                />
                <View className={styles.recordContent}>
                  <Text className={styles.recordTitle}>{h.name}</Text>
                  <Text className={styles.recordDate}>借用时间：{h.date}</Text>
                </View>
                <StatusBadge text="已归还" type="borrow" status="returned" />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomBtnGroup}>
          <Button className={styles.bottomIconBtn} onClick={handleFavorite}>
            <Text className={classnames(styles.bottomIcon, item.isFavorite && styles.favorited)}>
              {item.isFavorite ? '♥' : '♡'}
            </Text>
            <Text className={classnames(styles.bottomIconText, item.isFavorite && styles.favoritedText)}>
              收藏
            </Text>
          </Button>
          <Button className={styles.bottomIconBtn} onClick={handleChat}>
            <Text className={styles.bottomIcon}>💬</Text>
            <Text className={styles.bottomIconText}>私信</Text>
          </Button>
        </View>
        <View className={styles.actionBtns}>
          <Button
            className={classnames(styles.btn, styles.btnSecondary)}
            onClick={handleChat}
          >
            联系邻居
          </Button>
          <Button
            className={classnames(
              styles.btn,
              styles.btnPrimary,
              !isAvailable && styles.btnDisabled
            )}
            onClick={handleReserve}
          >
            {isAvailable ? '立即预约' : statusInfo.text}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default DetailPage;
