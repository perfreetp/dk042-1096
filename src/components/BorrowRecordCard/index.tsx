import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import type { BorrowRecord } from '@/types';
import { borrowStatusMap, formatDeposit } from '@/types';

interface BorrowRecordCardProps {
  record: BorrowRecord;
  role: 'borrower' | 'lender';
  onConfirmPickup?: (recordId: string) => void;
  onConfirmReturn?: (recordId: string) => void;
  onExtend?: (recordId: string) => void;
  onRemind?: (recordId: string) => void;
  onDamageNote?: (recordId: string) => void;
  onRate?: (recordId: string) => void;
  onChat?: (record: BorrowRecord) => void;
}

const BorrowRecordCard: React.FC<BorrowRecordCardProps> = ({
  record,
  role,
  onConfirmPickup,
  onConfirmReturn,
  onExtend,
  onRemind,
  onDamageNote,
  onRate,
  onChat
}) => {
  const statusInfo = borrowStatusMap[record.status];
  const isBorrower = role === 'borrower';
  const userAvatar = isBorrower ? record.itemImage : record.borrowerAvatar;
  const userName = isBorrower ? record.lenderName : record.borrowerName;
  const userDesc = isBorrower ? `借走了${record.itemTitle}` : `向你借了${record.quantity}件`;

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${record.itemId}`
    });
  };

  const renderActions = () => {
    const actions: React.ReactNode[] = [];

    if (isBorrower) {
      if (record.status === 'pending_pickup' && !record.isPickupConfirmed) {
        actions.push(
          <Button
            key="chat"
            className={classnames(styles.btn, styles.btnSecondary)}
            onClick={() => onChat?.(record)}
          >
            联系对方
          </Button>
        );
        actions.push(
          <Button
            key="confirm"
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={() => onConfirmPickup?.(record.id)}
          >
            确认取件
          </Button>
        );
      } else if (record.status === 'borrowing' || record.status === 'overdue') {
        if (record.extendCount < 2) {
          actions.push(
            <Button
              key="extend"
              className={classnames(styles.btn, styles.btnSecondary)}
              onClick={() => onExtend?.(record.id)}
            >
              申请延期
            </Button>
          );
        }
        actions.push(
          <Button
            key="return"
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={() => onConfirmReturn?.(record.id)}
          >
            我要归还
          </Button>
        );
      } else if (record.status === 'returned' && !record.rating) {
        actions.push(
          <Button
            key="rate"
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={() => onRate?.(record.id)}
          >
            去评价
          </Button>
        );
      }
    } else {
      if (record.status === 'pending_pickup') {
        actions.push(
          <Button
            key="chat"
            className={classnames(styles.btn, styles.btnSecondary)}
            onClick={() => onChat?.(record)}
          >
            联系对方
          </Button>
        );
        actions.push(
          <Button
            key="confirm"
            className={classnames(styles.btn, styles.btnPrimary)}
            onClick={() => onConfirmPickup?.(record.id)}
          >
            确认交付
          </Button>
        );
      } else if (record.status === 'borrowing') {
        if (!record.isReturnReminded) {
          actions.push(
            <Button
              key="remind"
              className={classnames(styles.btn, styles.btnSecondary)}
              onClick={() => onRemind?.(record.id)}
            >
              提醒归还
            </Button>
          );
        }
        actions.push(
          <Button
            key="damage"
            className={classnames(styles.btn, styles.btnWarning)}
            onClick={() => onDamageNote?.(record.id)}
          >
            损坏备注
          </Button>
        );
      } else if (record.status === 'returned') {
        if (!record.rating) {
          actions.push(
            <Button
              key="rate"
              className={classnames(styles.btn, styles.btnPrimary)}
              onClick={() => onRate?.(record.id)}
            >
              去评价
            </Button>
          );
        }
      } else if (record.status === 'overdue') {
        actions.push(
          <Button
            key="damage"
            className={classnames(styles.btn, styles.btnWarning)}
            onClick={() => onDamageNote?.(record.id)}
          >
            损坏备注
          </Button>
        );
      }
    }

    if (actions.length === 0) return null;

    return (
      <View className={styles.actions}>
        {actions}
      </View>
    );
  };

  const renderRating = () => {
    if (!record.rating) return null;
    const stars = '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating);
    return (
      <View className={styles.rating}>
        <Text className={styles.stars}>{stars}</Text>
        {record.comment && (
          <Text className={styles.ratingText}>{record.comment}</Text>
        )}
      </View>
    );
  };

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.role}>
          {isBorrower ? '我借入的' : '我借出的'}
        </Text>
        <StatusBadge
          status={record.status}
          text={statusInfo.text}
          type="borrow"
        />
      </View>

      <View className={styles.itemInfo} onClick={handleClick}>
        <Image
          className={styles.itemImage}
          src={record.itemImage}
          mode="aspectFill"
        />
        <View className={styles.itemDetail}>
          <Text className={styles.itemTitle}>{record.itemTitle}</Text>
          <View className={styles.itemMeta}>
            <View className={styles.metaItem}>
              <Text>数量: </Text>
              <Text>{record.quantity}件</Text>
            </View>
            <View className={styles.metaItem}>
              <Text>押金: </Text>
              <Text className={styles.depositBadge}>
                {formatDeposit(record.deposit)}
              </Text>
            </View>
            {record.hasExtendRequest && (
              <View className={styles.metaItem}>
                <Text>延期申请中</Text>
              </View>
            )}
          </View>
          <View className={styles.timeRow}>
            <View className={styles.timeItem}>
              <Text className={styles.timeLabel}>取件时间:</Text>
              <Text className={styles.timeValue}>{record.pickupTime}</Text>
            </View>
            <View className={styles.timeItem}>
              <Text className={styles.timeLabel}>应还时间:</Text>
              <Text className={styles.timeValue}>{record.expectedReturnTime}</Text>
            </View>
            {record.actualReturnTime && (
              <View className={styles.timeItem}>
                <Text className={styles.timeLabel}>实际归还:</Text>
                <Text className={styles.timeValue}>{record.actualReturnTime}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className={styles.userRow}>
        <Image className={styles.userAvatar} src={userAvatar} />
        <View className={styles.userInfo}>
          <Text className={styles.userName}>{userName}</Text>
          <Text className={styles.userDesc}>{userDesc}</Text>
        </View>
      </View>

      {renderRating()}
      {renderActions()}
    </View>
  );
};

export default BorrowRecordCard;
