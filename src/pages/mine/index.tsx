import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import useAppStore from '@/store';

const MinePage: React.FC = () => {
  const currentUser = useAppStore(state => state.currentUser);
  const frozenDeposits = useAppStore(state => state.frozenDeposits);
  const getMyItems = useAppStore(state => state.getMyItems);
  const getMyBorrowingRecords = useAppStore(state => state.getMyBorrowingRecords);

  const myItems = useMemo(() => getMyItems(), [getMyItems]);
  const myBorrowingRecords = useMemo(() => getMyBorrowingRecords(), [getMyBorrowingRecords]);

  const totalDeposits = frozenDeposits;
  const returnedCount = myBorrowingRecords.filter(r => r.status === 'returned').length;
  const borrowTotal = myBorrowingRecords.length;

  const handleItemClick = (type: string) => {
    console.log('[Mine] Clicked menu item:', type);
    switch (type) {
      case 'myItems':
        Taro.navigateTo({ url: `/pages/search/index?type=myItems` });
        break;
      case 'borrowedItems':
        Taro.switchTab({ url: '/pages/borrow/index' }).catch(() => {});
        break;
      case 'lentItems':
        Taro.switchTab({ url: '/pages/borrow/index' }).catch(() => {});
        break;
      case 'favorites':
        Taro.navigateTo({ url: `/pages/search/index?type=favorites` });
        break;
      case 'contacts':
        Taro.navigateTo({ url: '/pages/contacts/index' });
        break;
      case 'report':
        Taro.navigateTo({ url: '/pages/report/index' });
        break;
      case 'admin':
        Taro.showToast({ title: '管理员功能', icon: 'none' });
        break;
      case 'chat':
        Taro.navigateTo({ url: '/pages/contacts/index' });
        break;
      case 'depositWithdraw':
        Taro.showToast({ title: '押金退还中', icon: 'loading' });
        break;
      case 'depositDetail':
        Taro.showToast({ title: '押金明细', icon: 'none' });
        break;
      default:
        break;
    }
  };

  const menuItems = [
    {
      key: 'myItems',
      icon: '📦',
      iconClass: '',
      title: '我的物品',
      desc: `已发布 ${myItems.length} 件闲置物品`,
      value: `${myItems.length}件`,
      onClick: () => handleItemClick('myItems')
    },
    {
      key: 'borrowedItems',
      icon: '📚',
      iconClass: styles.menuIconBlue,
      title: '借入记录',
      desc: `共借用 ${borrowTotal} 次，${returnedCount} 次已归还`,
      value: '',
      onClick: () => handleItemClick('borrowedItems')
    },
    {
      key: 'lentItems',
      icon: '🤝',
      iconClass: styles.menuIconOrange,
      title: '借出记录',
      desc: '查看您的物品借出情况',
      value: '',
      onClick: () => handleItemClick('lentItems')
    },
    {
      key: 'report',
      icon: '⚠️',
      iconClass: styles.menuIconRed,
      title: '违规举报',
      desc: '遇到问题？点击提交举报',
      badge: '',
      onClick: () => handleItemClick('report')
    },
    {
      key: 'admin',
      icon: '📢',
      iconClass: '',
      title: '管理员置顶',
      desc: '申请将您的物品推荐给更多邻居',
      value: '',
      onClick: () => handleItemClick('admin')
    }
  ];

  const gridItems = [
    { key: 'favorites', icon: '❤️', text: '我的收藏' },
    { key: 'contacts', icon: '👥', text: '常用联系人' },
    { key: 'chat', icon: '💬', text: '消息中心' },
    { key: 'settings', icon: '⚙️', text: '设置' }
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.userCard}>
          <Image
            className={styles.avatar}
            src={currentUser.avatar}
            mode="aspectFill"
          />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{currentUser.name}</Text>
            <Text className={styles.userLocation}>
              📍 {currentUser.building} {currentUser.unit} {currentUser.roomNumber}
            </Text>
            <View className={styles.creditBadge}>
              <Text>⭐</Text>
              <Text>信用分 {currentUser.creditScore}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.statsCard}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myItems.length}</Text>
            <Text className={styles.statLabel}>发布物品</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{borrowTotal}</Text>
            <Text className={styles.statLabel}>借入次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{returnedCount}</Text>
            <Text className={styles.statLabel}>归还次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>100%</Text>
            <Text className={styles.statLabel}>按时归还</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.depositCard}>
          <View className={styles.depositHeader}>
            <Text className={styles.depositTitle}>🔒 押金账户</Text>
            <Text
              className={styles.depositTitle}
              onClick={() => handleItemClick('depositDetail')}
            >
              明细 ›
            </Text>
          </View>
          <Text className={styles.depositAmount}>¥{totalDeposits}.00</Text>
          <View className={styles.depositActions}>
            <Button
              className={styles.depositBtn}
              onClick={() => handleItemClick('depositWithdraw')}
            >
              申请退还
            </Button>
            <Button
              className={styles.depositBtn}
              onClick={() => handleItemClick('depositDetail')}
            >
              查看记录
            </Button>
          </View>
        </View>

        <View className={styles.sectionTitle}>信用评价</View>
        <View className={styles.menuCard}>
          <View className={styles.menuItem}>
            <View className={classnames(styles.menuIcon)}>
              <Text>⭐</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>信用等级：优秀</Text>
              <Text className={styles.menuDesc}>
                保持良好的借还习惯，享受免押金等特权
              </Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.creditDetailRow} style={{ flex: 1, padding: 0, borderTop: 'none', marginTop: 0 }}>
              <Text className={styles.creditLabel}>按时归还率</Text>
              <Text className={styles.creditValue}>100%</Text>
            </View>
          </View>
          <View className={styles.menuItem}>
            <View className={styles.creditDetailRow} style={{ flex: 1, padding: 0, marginTop: 0 }}>
              <Text className={styles.creditLabel}>邻居好评数</Text>
              <Text className={styles.creditValue}>18 次</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>我的功能</View>
        <View className={styles.gridMenu}>
          {gridItems.map(item => (
            <View
              key={item.key}
              className={styles.gridItem}
              onClick={() => handleItemClick(item.key)}
            >
              <View className={styles.gridIcon}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.gridText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>常用功能</View>
        <View className={styles.menuCard}>
          {menuItems.map(item => (
            <View key={item.key} className={styles.menuItem} onClick={item.onClick}>
              <View className={classnames(styles.menuIcon, item.iconClass)}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{item.title}</Text>
                <Text className={styles.menuDesc}>{item.desc}</Text>
              </View>
              {item.badge && (
                <View className={styles.menuBadge}>{item.badge}</View>
              )}
              {item.value && (
                <Text className={styles.menuValue}>{item.value}</Text>
              )}
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
