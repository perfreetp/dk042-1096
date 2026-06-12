import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Button, Swiper, SwiperItem, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { statusMap, formatDeposit } from '@/types';
import useAppStore from '@/store';
import { validateDateTime } from '@/utils';

const mockBorrowHistory = [
  { id: 'h1', avatar: 'https://picsum.photos/id/1002/100/100', name: '王先生', date: '2026-06-01 至 2026-06-03' },
  { id: 'h2', avatar: 'https://picsum.photos/id/1003/100/100', name: '李女士', date: '2026-05-20 至 2026-05-22' },
  { id: 'h3', avatar: 'https://picsum.photos/id/1004/100/100', name: '张同学', date: '2026-05-05 至 2026-05-07' }
];

function defaultDateTime(addHours: number): string {
  const d = new Date(Date.now() + addHours * 60 * 60 * 1000);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day} ${h}:${min}`;
}

const DetailPage: React.FC = () => {
  const routerParams = Taro.useRouter().params;
  const itemId = routerParams.id || '1';

  const items = useAppStore(state => state.items);
  const borrowRecords = useAppStore(state => state.borrowRecords);
  const currentUser = useAppStore(state => state.currentUser);
  const toggleFavorite = useAppStore(state => state.toggleFavorite);
  const createBorrowRecord = useAppStore(state => state.createBorrowRecord);
  const offlineItem = useAppStore(state => state.offlineItem);
  const onlineItem = useAppStore(state => state.onlineItem);

  const [currentImage, setCurrentImage] = useState(0);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveQuantity, setReserveQuantity] = useState('1');
  const [reservePickupTime, setReservePickupTime] = useState('');
  const [reserveReturnTime, setReserveReturnTime] = useState('');

  const item = useMemo(() =>
    items.find(i => i.id === itemId),
    [items, itemId]
  );

  const history = useMemo(() => {
    if (!item) return mockBorrowHistory;
    const relatedRecords = borrowRecords.filter(
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
  }, [item, borrowRecords]);

  const isOwner = item ? item.ownerId === currentUser.id : false;

  useEffect(() => {
    console.log('[Detail] Page loaded, itemId:', itemId, 'found:', !!item, 'isOwner:', isOwner);
  }, [itemId, item, isOwner]);

  useEffect(() => {
    if (showReserveModal && item) {
      setReservePickupTime(defaultDateTime(24));
      setReserveReturnTime(defaultDateTime(3 * 24));
      setReserveQuantity('1');
    }
  }, [showReserveModal, item]);

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
  const isAvailable = item.status === 'available' && item.availableQuantity > 0;

  const qtyNum = Math.max(1, parseInt(reserveQuantity || '1', 10) || 1);
  const totalDeposit = Math.round(item.deposit * qtyNum * 100) / 100;
  const remainingQty = Math.max(0, item.availableQuantity - qtyNum);

  const validateReserve = (): { ok: boolean; msg?: string } => {
    const q = parseInt(reserveQuantity, 10);
    if (!reserveQuantity || !reserveQuantity.trim()) return { ok: false, msg: '请填写借用数量' };
    if (!q || q <= 0 || isNaN(q)) return { ok: false, msg: '请填写正确的借用数量' };
    if (q > item.availableQuantity) return { ok: false, msg: `库存不足，仅剩${item.availableQuantity}件` };

    const pickupCheck = validateDateTime(reservePickupTime, '取件时间');
    if (!pickupCheck.valid) return { ok: false, msg: pickupCheck.message };

    const returnCheck = validateDateTime(reserveReturnTime, '归还时间');
    if (!returnCheck.valid) return { ok: false, msg: returnCheck.message };

    if (returnCheck.date!.getTime() <= pickupCheck.date!.getTime()) {
      return { ok: false, msg: '归还时间必须晚于取件时间' };
    }

    if (item.status === 'maintenance') return { ok: false, msg: '物品正在维护中' };
    if (item.status === 'offline') return { ok: false, msg: '物品已下架' };
    if (isOwner) return { ok: false, msg: '不能预约自己发布的物品' };
    return { ok: true };
  };

  const handleFavorite = () => {
    console.log('[Detail] Toggle favorite:', item.id);
    const beforeState = useAppStore.getState();
    const beforeItem = beforeState.items.find(i => i.id === itemId);
    const wasFavorited = beforeItem?.isFavorite;
    toggleFavorite(itemId);
    Taro.showToast({
      title: wasFavorited ? '已取消收藏' : '收藏成功',
      icon: 'success'
    });
  };

  const handleChat = () => {
    console.log('[Detail] Chat with owner:', item.ownerId);
    Taro.navigateTo({
      url: `/pages/chat/index?userId=${item.ownerId}&userName=${encodeURIComponent(item.ownerName)}&userAvatar=${encodeURIComponent(item.ownerAvatar)}&userBuilding=${encodeURIComponent(item.ownerBuilding)}&itemId=${item.id}`
    });
  };

  const handleReserve = () => {
    console.log('[Detail] Open reserve modal:', item.id);
    if (isOwner) {
      Taro.showToast({ title: '不能预约自己发布的物品', icon: 'none' });
      return;
    }
    if (!isAvailable) {
      Taro.showToast({ title: '该物品暂不可借', icon: 'none' });
      return;
    }
    setShowReserveModal(true);
  };

  const handleConfirmReserve = () => {
    const v = validateReserve();
    if (!v.ok) {
      Taro.showToast({ title: v.msg || '预约信息不完整', icon: 'none' });
      return;
    }
    const rawQty = parseInt(reserveQuantity, 10);
    Taro.showLoading({ title: '预约中...' });
    const result = createBorrowRecord({
      itemId: item.id,
      quantity: rawQty,
      pickupTime: reservePickupTime.trim(),
      expectedReturnTime: reserveReturnTime.trim()
    });
    Taro.hideLoading();

    if (result.success) {
      setShowReserveModal(false);
      Taro.showModal({
        title: '预约成功',
        content: '请按时取件，押金已冻结，如有疑问请私信邻居~',
        showCancel: false,
        confirmText: '去查看',
        confirmColor: '#52C41A',
        success: () => {
          Taro.switchTab({ url: '/pages/borrow/index' }).catch(() => {});
        }
      });
    } else {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  };

  const handleQtyChange = (e: any) => {
    const v = (e.detail.value || '').replace(/[^\d]/g, '');
    if (!v) { setReserveQuantity(''); return; }
    const num = parseInt(v, 10);
    if (num > 99) {
      setReserveQuantity('99');
      return;
    }
    setReserveQuantity(v);
  };

  const handleReport = () => {
    console.log('[Detail] Report item:', item.id);
    Taro.navigateTo({
      url: `/pages/report/index?type=item&itemId=${item.id}`
    });
  };

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/publish/index?itemId=${item.id}` });
  };

  const handleOffline = () => {
    Taro.showModal({
      title: '确认下架',
      content: '下架后邻居将无法搜索和预约此物品，确认下架吗？',
      confirmColor: '#BF5EE0',
      success: (res) => {
        if (res.confirm) {
          const result = offlineItem(item.id);
          Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
        }
      }
    });
  };

  const handleOnline = () => {
    const result = onlineItem(item.id);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
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
              {!isOwner && (
                <Button className={styles.iconBtn} onClick={handleChat}>
                  <Text>💬</Text>
                </Button>
              )}
              {!isOwner && (
                <Button className={styles.iconBtn} onClick={handleReport}>
                  <Text>⚠️</Text>
                </Button>
              )}
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

      {showReserveModal && (
        <View className={styles.modalOverlay} onClick={() => setShowReserveModal(false)}>
          <View className={styles.modalBox} onClick={e => e.stopPropagation?.()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>预约物品</Text>
              <Text className={styles.modalClose} onClick={() => setShowReserveModal(false)}>✕</Text>
            </View>
            <View className={styles.modalBody}>
              <View className={styles.reserveItemRow}>
                <Image className={styles.reserveItemImg} src={item.images[0]} mode="aspectFill" />
                <View className={styles.reserveItemInfo}>
                  <Text className={styles.reserveItemTitle}>{item.title}</Text>
                  <Text className={styles.reserveItemDeposit}>单价：{formatDeposit(item.deposit)} · 可借 {item.availableQuantity} 件</Text>
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>
                  <Text>借用数量</Text>
                </View>
                <View className={styles.formInputWrap}>
                  <Input
                    className={styles.formInput}
                    type="number"
                    value={reserveQuantity}
                    onInput={handleQtyChange}
                    placeholder={`1-${item.availableQuantity}`}
                    placeholderClass={styles.formInput}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>
                  <Text>取件时间</Text>
                </View>
                <View className={styles.formInputWrap}>
                  <Input
                    className={styles.formInput}
                    value={reservePickupTime}
                    onInput={e => setReservePickupTime(e.detail.value)}
                    placeholder="如：2026-06-15 10:00"
                    placeholderClass={styles.formInput}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <View className={styles.formLabel}>
                  <Text className={styles.required}>*</Text>
                  <Text>预计归还时间</Text>
                </View>
                <View className={styles.formInputWrap}>
                  <Input
                    className={styles.formInput}
                    value={reserveReturnTime}
                    onInput={e => setReserveReturnTime(e.detail.value)}
                    placeholder="如：2026-06-18 18:00"
                    placeholderClass={styles.formInput}
                  />
                </View>
              </View>

              <View className={styles.reserveSummary}>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>押金合计</Text>
                  <Text className={styles.summaryValueBlue}>{formatDeposit(totalDeposit)}</Text>
                </View>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>预约后剩余库存</Text>
                  <Text className={styles.summaryValue}>{remainingQty} 件</Text>
                </View>
                <View className={styles.summaryRow}>
                  <Text className={styles.summaryLabel}>取件地点</Text>
                  <Text className={styles.summaryValue}>{item.pickupLocation}</Text>
                </View>
              </View>
            </View>
            <View className={styles.modalFooter}>
              <Button className={classnames(styles.modalBtn, styles.modalBtnSecondary)} onClick={() => setShowReserveModal(false)}>
                取消
              </Button>
              <Button className={classnames(styles.modalBtn, styles.modalBtnPrimary)} onClick={handleConfirmReserve}>
                确认预约
              </Button>
            </View>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        {isOwner ? (
          <>
            <View className={styles.bottomBtnGroup}>
              <Button className={styles.bottomIconBtn} onClick={handleFavorite}>
                <Text className={classnames(styles.bottomIcon, item.isFavorite && styles.favorited)}>
                  {item.isFavorite ? '♥' : '♡'}
                </Text>
                <Text className={classnames(styles.bottomIconText, item.isFavorite && styles.favoritedText)}>
                  收藏
                </Text>
              </Button>
            </View>
            <View className={styles.actionBtns}>
              <Button
                className={classnames(styles.btn, styles.btnSecondary)}
                onClick={handleEdit}
              >
                编辑
              </Button>
              {item.status === 'offline' ? (
                <Button
                  className={classnames(styles.btn, styles.btnSuccess)}
                  onClick={handleOnline}
                >
                  重新上架
                </Button>
              ) : (
                <Button
                  className={classnames(styles.btn, styles.btnDanger)}
                  onClick={handleOffline}
                >
                  下架
                </Button>
              )}
            </View>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default DetailPage;
