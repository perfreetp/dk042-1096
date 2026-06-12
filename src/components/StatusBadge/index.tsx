import React from 'react';
import { View } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ItemStatus, BorrowStatus } from '@/types';

interface StatusBadgeProps {
  status?: ItemStatus | BorrowStatus;
  text: string;
  type?: 'item' | 'borrow' | 'tag' | 'top' | 'deposit';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text, type = 'item', className }) => {
  const getStatusClass = () => {
    if (type === 'tag') return styles.tag;
    if (type === 'top') return styles.topTag;
    if (type === 'deposit') return styles.depositTag;
    if (type === 'item') {
      switch (status) {
        case 'available': return styles.available;
        case 'reserved': return styles.reserved;
        case 'lent': return styles.lent;
        case 'maintenance': return styles.maintenance;
        default: return styles.available;
      }
    }
    if (type === 'borrow') {
      switch (status) {
        case 'pending_pickup': return styles.pendingPickup;
        case 'borrowing': return styles.borrowing;
        case 'returned': return styles.returned;
        case 'overdue': return styles.overdue;
        case 'cancelled': return styles.cancelled;
        default: return styles.borrowing;
      }
    }
    return styles.available;
  };

  return (
    <View className={classnames(styles.badge, getStatusClass(), className)}>
      {text}
    </View>
  );
};

export default StatusBadge;
