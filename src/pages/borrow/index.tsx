import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import BorrowRecordCard from '@/components/BorrowRecordCard';
import EmptyState from '@/components/EmptyState';
import { borrowRecordsData } from '@/data/borrowRecords';
import type { BorrowStatus, BorrowRecord } from '@/types';

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
  const [activeTab, setActiveTab] = useState<TabType>('borrow');
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [records, setRecords] = useState<BorrowRecord[]>(borrowRecordsData);

  const handleConfirmPickup = (recordId: string) => {
    console.log('[Borrow] Confirm pickup for:', recordId);
    Taro.showModal({
      title: '确认取件',
      content: '请确认您已检查物品完好并取件',
      success: (res) => {
        if (res.confirm) {
          setRecords(prev => prev.map(r =>
            r.id === recordId
              ? { ...r, status: 'borrowing', statusText: '借用中', isPickupConfirmed: true }
              : r
          ));
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
      success: (res) => {
        if (res.confirm) {
          setRecords(prev => prev.map(r =>
            r.id === recordId
              ? {
                  ...r,
                  status: 'returned',
                  statusText: '已归还',
                  actualReturnTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
                }
              : r
          ));
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
        setRecords(prev => prev.map(r =>
          r.id === recordId
            ? { ...r, hasExtendRequest: true, extendCount: (r.extendCount || 0) + 1 }
            : r
        ));
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
    setRecords(prev => prev.map(r =>
      r.id === recordId
        ? { ...r, isReturnReminded: true }
        : r
    ));
    Taro.showToast({ title: '归还提醒已发送', icon: 'success' });
  };

  const handleDamageNote = (recordId: string) => {
    console.log('[Borrow] Damage note for:', recordId);
    Taro.navigateTo({
      url: `/pages/report/index?type=damage&recordId=${recordId}`
    });
  };

  const handleRate = (recordId: string) => {
    console.log('[Borrow] Rate for:', recordId);
    Taro.showModal({
      title: '完成评价',
      content: '感谢您的使用，期待您的评价！',
      confirmText: '去评价',
      success: () => {
        Taro.showToast({ title: '评价成功', icon: 'success' });
        setRecords(prev => prev.map(r =>
          r.id === recordId
            ? { ...r, rating: 5, comment: '非常满意！邻居很靠谱。' }
            : r
        ));
      }
    });
  };

  const handleChat = (record: BorrowRecord) => {
    console.log('[Borrow] Chat for record:', record.id);
    const targetId = activeTab === 'borrow' ? record.lenderId : record.borrowerId;
    const targetName = activeTab === 'borrow' ? record.lenderName : record.borrowerName;
    Taro.navigateTo({
      url: `/pages/chat/index?userId=${targetId}&userName=${encodeURIComponent(targetName)}`
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const roleMatch = activeTab === 'borrow'
        ? r.borrowerId === 'me'
        : r.lenderId === 'me';
      const statusMatch = activeStatus === 'all' || r.status === activeStatus;
      return roleMatch && statusMatch;
    });
  }, [records, activeTab, activeStatus]);

  const role: 'borrower' | 'lender' = activeTab === 'borrow' ? 'borrower' : 'lender';

  const borrowingRecords = records.filter(r => r.borrowerId === 'me');
  const lendingRecords = records.filter(r => r.lenderId === 'me');

  const pendingCount = filteredRecords.filter(r => r.status === 'pending_pickup').length;
  const activeCount = filteredRecords.filter(r => ['borrowing', 'overdue'].includes(r.status)).length;
  const totalDeposit = records
    .filter(r => r.borrowerId === 'me' && ['pending_pickup', 'borrowing', 'overdue'].includes(r.status))
    .reduce((sum, r) => sum + r.deposit, 0);

  return (
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
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default BorrowPage;
