import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import BorrowRecordCard from '@/components/BorrowRecordCard';
import EmptyState from '@/components/EmptyState';
import type { BorrowStatus, BorrowRecord } from '@/types';
import useAppStore from '@/store';

type TabType = 'borrow' | 'lend';
type FilterStatus = 'all' | BorrowStatus;

const statusFilters: { key: FilterStatus; text: string }[] = [
  { key: 'all', text: '全部' },
  { key: 'pending_pickup', text: '待取件' },
  { key: 'borrowing', text: '借用中' },
  { key: 'overdue', text: '已逾期' },
  { key: 'returned', text: '已归还' }
];

const BorrowPage: React.FC = () => {
  const borrowRecords = useAppStore(state => state.borrowRecords);
  const currentUser = useAppStore(state => state.currentUser);
  const frozenDeposits = useAppStore(state => state.frozenDeposits);
  const confirmPickup = useAppStore(state => state.confirmPickup);
  const confirmReturn = useAppStore(state => state.confirmReturn);
  const cancelBorrowRecord = useAppStore(state => state.cancelBorrowRecord);
  const requestExtend = useAppStore(state => state.requestExtend);
  const addRating = useAppStore(state => state.addRating);
  const addDamageNote = useAppStore(state => state.addDamageNote);

  const [activeTab, setActiveTab] = useState<TabType>('borrow');
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [ratingVisible, setRatingVisible] = useState(false);
  const [ratingRecordId, setRatingRecordId] = useState('');
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const handleCancel = (recordId: string) => {
    console.log('[Borrow] Cancel reservation for:', recordId);
    Taro.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？取消后押金将自动解冻。',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          cancelBorrowRecord(recordId);
          Taro.showToast({ title: '已取消预约', icon: 'success' });
        }
      }
    });
  };

  const handleConfirmPickup = (recordId: string) => {
    console.log('[Borrow] Confirm pickup for:', recordId);
    Taro.showModal({
      title: '确认取件',
      content: '请确认您已检查物品完好并取件',
      confirmColor: '#52C41A',
      success: (res) => {
        if (res.confirm) {
          confirmPickup(recordId);
          Taro.showToast({ title: '取件确认成功', icon: 'success' });
        }
      }
    });
  };

  const handleConfirmReturn = (recordId: string) => {
    console.log('[Borrow] Confirm return for:', recordId);
    Taro.showModal({
      title: '归还确认',
      content: '请确认物品状态完好，归还后押金将在24小时内原路退回',
      confirmColor: '#52C41A',
      success: (res) => {
        if (res.confirm) {
          confirmReturn(recordId);
          Taro.showToast({ title: '归还成功', icon: 'success' });
        }
      }
    });
  };

  const handleExtend = (recordId: string) => {
    console.log('[Borrow] Extend request for:', recordId);
    Taro.showActionSheet({
      itemList: ['延期1天', '延期2天', '延期3天'],
      success: (res) => {
        const days = res.tapIndex + 1;
        requestExtend(recordId, days);
        Taro.showToast({
          title: `已申请延期${days}天，等待对方确认`,
          icon: 'none',
          duration: 2000
        });
      }
    });
  };

  const handleRemind = (recordId: string) => {
    console.log('[Borrow] Remind return for:', recordId);
    Taro.showToast({ title: '归还提醒已发送', icon: 'success' });
  };

  const handleDamageNote = (recordId: string) => {
    console.log('[Borrow] Damage note for:', recordId);
    Taro.showModal({
      title: '损坏备注',
      content: '请描述物品损坏情况，将从押金中扣除相应费用',
      editable: true,
      placeholderText: '请输入损坏描述...',
      confirmColor: '#FAAD14',
      success: (res) => {
        if (res.confirm && res.content?.trim()) {
          addDamageNote(recordId, res.content.trim());
          Taro.showToast({ title: '备注已添加', icon: 'success' });
        }
      }
    });
  };

  const handleRate = (recordId: string) => {
    console.log('[Borrow] Open rating for:', recordId);
    setRatingRecordId(recordId);
    setRatingValue(5);
    setRatingComment('');
    setRatingVisible(true);
  };

  const handleRatingConfirm = () => {
    if (ratingValue <= 0) {
      Taro.showToast({ title: '请选择星级', icon: 'none' });
      return;
    }
    console.log('[Borrow] Submit rating:', ratingRecordId, ratingValue, ratingComment);
    addRating(ratingRecordId, ratingValue, ratingComment.trim());
    setRatingVisible(false);
    Taro.showToast({ title: '评价成功', icon: 'success' });
  };

  const handleRatingCancel = () => {
    console.log('[Borrow] Cancel rating');
    setRatingVisible(false);
  };

  const handleChat = (record: BorrowRecord) => {
    console.log('[Borrow] Chat for record:', record.id);
    const targetId = activeTab === 'borrow' ? record.lenderId : record.borrowerId;
    const targetName = activeTab === 'borrow' ? record.lenderName : record.borrowerName;
    const targetAvatar = activeTab === 'borrow' ? '' : record.borrowerAvatar;
    const targetBuilding = '';
    Taro.navigateTo({
      url: `/pages/chat/index?userId=${targetId}&userName=${encodeURIComponent(targetName)}&userAvatar=${encodeURIComponent(targetAvatar)}&userBuilding=${encodeURIComponent(targetBuilding)}&itemId=${record.itemId}`
    });
  };

  const filteredRecords = useMemo(() => {
    return borrowRecords.filter(r => {
      const roleMatch = activeTab === 'borrow'
        ? r.borrowerId === currentUser.id
        : r.lenderId === currentUser.id;
      const statusMatch = activeStatus === 'all' || r.status === activeStatus;
      return roleMatch && statusMatch;
    });
  }, [borrowRecords, activeTab, activeStatus, currentUser.id]);

  const role: 'borrower' | 'lender' = activeTab === 'borrow' ? 'borrower' : 'lender';

  const borrowingRecords = borrowRecords.filter(r => r.borrowerId === currentUser.id);
  const lendingRecords = borrowRecords.filter(r => r.lenderId === currentUser.id);

  const pendingCount = filteredRecords.filter(r => r.status === 'pending_pickup').length;
  const activeCount = filteredRecords.filter(r => ['borrowing', 'overdue'].includes(r.status)).length;
  const totalDeposit = frozenDeposits;

  const ratingDescs = ['', '很差', '一般', '还行', '满意', '非常满意'];

  return (
    <View style={{ minHeight: '100vh' }}>
      <ScrollView className={styles.page} scrollY>
        <View className={styles.tabs}>
          <View
            className={classnames(styles.tab, activeTab === 'borrow' && styles.active)}
            onClick={() => { setActiveTab('borrow'); setActiveStatus('all'); }}
          >
            <Text className={styles.tabText}>我借入的</Text>
            <Text className={styles.tabCount}>{borrowingRecords.length} 笔</Text>
          </View>
          <View
            className={classnames(styles.tab, activeTab === 'lend' && styles.active)}
            onClick={() => { setActiveTab('lend'); setActiveStatus('all'); }}
          >
            <Text className={styles.tabText}>我借出的</Text>
            <Text className={styles.tabCount}>{lendingRecords.length} 笔</Text>
          </View>
        </View>

        <View className={styles.statusTabs}>
          {statusFilters.map(filter => (
            <View
              key={filter.key}
              className={classnames(styles.statusTab, activeStatus === filter.key && styles.active)}
              onClick={() => setActiveStatus(filter.key)}
            >
              <Text>{filter.text}</Text>
            </View>
          ))}
        </View>

        <View className={styles.content}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryTitle}>
              {activeTab === 'borrow' ? '我的借入概览' : '我的借出概览'}
            </Text>
            <View className={styles.summaryStats}>
              <View className={styles.summaryItem}>
                <Text className={styles.summaryValue}>{filteredRecords.length}</Text>
                <Text className={styles.summaryLabel}>总记录</Text>
              </View>
              <View className={styles.summaryItem}>
                <Text className={styles.summaryValue}>{pendingCount}</Text>
                <Text className={styles.summaryLabel}>待处理</Text>
              </View>
              <View className={styles.summaryItem}>
                <Text className={styles.summaryValue}>{activeCount}</Text>
                <Text className={styles.summaryLabel}>进行中</Text>
              </View>
            </View>
            {activeTab === 'borrow' && (
              <View className={styles.depositRow}>
                <Text className={styles.depositLabel}>🔒 冻结押金</Text>
                <Text className={styles.depositValue}>¥{totalDeposit}.00</Text>
              </View>
            )}
          </View>

          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={activeTab === 'borrow' ? '📚' : '📦'}
              title={activeTab === 'borrow' ? '暂无借入记录' : '暂无借出记录'}
              description={activeTab === 'borrow' ? '去首页看看有什么好物吧~' : '去发布页分享你的闲置物品吧'}
              actionText={activeTab === 'borrow' ? '去首页' : '去发布'}
              actionPath={activeTab === 'borrow' ? '/pages/home/index' : '/pages/publish/index'}
            />
          ) : (
            filteredRecords.map(record => (
              <BorrowRecordCard
              key={record.id}
              record={record}
              role={role}
              onConfirmPickup={handleConfirmPickup}
              onConfirmReturn={handleConfirmReturn}
              onExtend={handleExtend}
              onRemind={handleRemind}
              onDamageNote={handleDamageNote}
              onRate={handleRate}
              onChat={handleChat}
              onCancel={handleCancel}
            />
            ))
          )}
        </View>
      </ScrollView>

      <View className={classnames(styles.ratingModal, !ratingVisible && styles.hidden)} onClick={handleRatingCancel}>
        <View className={styles.ratingBox} onClick={e => e.stopPropagation()}>
          <Text className={styles.ratingTitle}>完成评价</Text>

          <View className={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Text
                key={star}
                className={classnames(styles.star, star <= ratingValue && styles.active)}
                onClick={() => setRatingValue(star)}
              >
                ★
              </Text>
            ))}
          </View>

          <Text className={styles.ratingDesc}>{ratingDescs[ratingValue] || '点击星星评分'}</Text>

          <View className={styles.ratingInputWrap}>
            <Textarea
              className={styles.ratingInput}
              placeholder="说点什么吧，您的评价对邻居很重要~"
              placeholderStyle="color: #86909C"
              value={ratingComment}
              onInput={e => setRatingComment(e.detail.value.slice(0, 200))}
              maxlength={200}
              autoHeight
            />
            <Text className={styles.ratingCount}>{ratingComment.length}/200</Text>
          </View>

          <View className={styles.ratingActions}>
            <Button className={classnames(styles.ratingBtn, styles.cancel)} onClick={handleRatingCancel}>
              取消
            </Button>
            <Button className={classnames(styles.ratingBtn, styles.confirm)} onClick={handleRatingConfirm}>
              提交评价
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BorrowPage;
