import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ItemCard from '@/components/ItemCard';
import EmptyState from '@/components/EmptyState';
import type { ItemCategory, ItemStatus } from '@/types';
import useAppStore from '@/store';

const categoryOptions = [
  { key: 'all', name: '全部分类' },
  { key: 'tools', name: '工具设备' },
  { key: 'outdoor', name: '户外露营' },
  { key: 'cleaning', name: '清洁用品' },
  { key: 'kitchen', name: '厨房用具' },
  { key: 'entertainment', name: '娱乐影音' },
  { key: 'sports', name: '运动健身' },
  { key: 'other', name: '其他物品' }
];

const statusOptions = [
  { key: 'all', name: '全部状态' },
  { key: 'available', name: '可借' },
  { key: 'reserved', name: '已预约' },
  { key: 'lent', name: '已借出' },
  { key: 'maintenance', name: '维护中' },
  { key: 'offline', name: '已下架' }
];

const depositRanges = [
  { key: 'all', name: '全部押金' },
  { key: 'free', name: '免押' },
  { key: 'low', name: '¥0-50' },
  { key: 'mid', name: '¥50-100' },
  { key: 'high', name: '¥100以上' }
];

type SortType = 'default' | 'count' | 'deposit_asc' | 'deposit_desc';

const SearchPage: React.FC = () => {
  const routerParams = Taro.useRouter().params;
  const initialKeyword = routerParams.keyword ? decodeURIComponent(routerParams.keyword) : '';
  const initialCategory = routerParams.category || 'all';
  const type = routerParams.type || '';

  const items = useAppStore(state => state.items);
  const toggleFavorite = useAppStore(state => state.toggleFavorite);
  const getMyItems = useAppStore(state => state.getMyItems);
  const getFavoriteItems = useAppStore(state => state.getFavoriteItems);

  const [keyword, setKeyword] = useState(initialKeyword);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [activeDeposit, setActiveDeposit] = useState<string>('all');
  const [sortType, setSortType] = useState<SortType>('default');

  useEffect(() => {
    console.log('[Search] Page loaded with params:', routerParams);
    if (type === 'myItems') {
      Taro.showToast({ title: '查看我的物品', icon: 'none' });
    } else if (type === 'favorites') {
      Taro.showToast({ title: '查看我的收藏', icon: 'none' });
    }
  }, [routerParams, type]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (type === 'myItems') {
      result = getMyItems();
    } else if (type === 'favorites') {
      result = getFavoriteItems();
    }

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(kw) ||
        i.description.toLowerCase().includes(kw) ||
        i.categoryName.toLowerCase().includes(kw) ||
        i.tags.some(t => t.toLowerCase().includes(kw))
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter(i => i.category === activeCategory);
    }

    if (activeStatus !== 'all') {
      result = result.filter(i => i.status === activeStatus);
    }

    if (activeDeposit === 'free') {
      result = result.filter(i => i.deposit === 0);
    } else if (activeDeposit === 'low') {
      result = result.filter(i => i.deposit > 0 && i.deposit <= 50);
    } else if (activeDeposit === 'mid') {
      result = result.filter(i => i.deposit > 50 && i.deposit <= 100);
    } else if (activeDeposit === 'high') {
      result = result.filter(i => i.deposit > 100);
    }

    if (sortType === 'count') {
      result.sort((a, b) => b.borrowCount - a.borrowCount);
    } else if (sortType === 'deposit_asc') {
      result.sort((a, b) => a.deposit - b.deposit);
    } else if (sortType === 'deposit_desc') {
      result.sort((a, b) => b.deposit - a.deposit);
    }

    return result;
  }, [items, keyword, activeCategory, activeStatus, activeDeposit, sortType, type, getMyItems, getFavoriteItems]);

  const handleFavorite = (itemId: string) => {
    console.log('[Search] Toggle favorite:', itemId);
    const beforeState = useAppStore.getState();
    const item = beforeState.items.find(i => i.id === itemId);
    const wasFav = item?.isFavorite;
    toggleFavorite(itemId);
    Taro.showToast({
      title: wasFav ? '已取消收藏' : '已收藏',
      icon: 'success'
    });
  };

  const handleCancel = () => {
    setKeyword('');
    Taro.navigateBack().catch(() => {
      Taro.switchTab({ url: '/pages/home/index' });
    });
  };

  const handleClear = () => {
    setKeyword('');
    setActiveCategory('all');
    setActiveStatus('all');
    setActiveDeposit('all');
    setSortType('default');
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索物品名称、描述、标签..."
            placeholderClass={styles.searchInput}
            value={keyword}
            onInput={e => setKeyword(e.detail.value)}
            onConfirm={() => console.log('[Search] Search confirmed:', keyword)}
            confirmType="search"
            focus
          />
        </View>
        <Text className={styles.cancelBtn} onClick={handleCancel}>取消</Text>
      </View>

      <ScrollView scrollY style={{ flex: 1 }}>
        <View className={styles.filterSection}>
          <View className={styles.filterTitle}>分类筛选</View>
          <View className={styles.filterTags}>
            {categoryOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.filterTag, activeCategory === opt.key && styles.active)}
                onClick={() => setActiveCategory(opt.key)}
              >
                <Text>{opt.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.filterSection}>
          <View className={styles.filterTitle}>状态筛选</View>
          <View className={styles.filterTags}>
            {statusOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.filterTag, activeStatus === opt.key && styles.active)}
                onClick={() => setActiveStatus(opt.key)}
              >
                <Text>{opt.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.filterSection}>
          <View className={styles.filterTitle}>押金范围</View>
          <View className={styles.filterTags}>
            {depositRanges.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.filterTag, activeDeposit === opt.key && styles.active)}
                onClick={() => setActiveDeposit(opt.key)}
              >
                <Text>{opt.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sortBar}>
          <View className={styles.sortTabs}>
            <View
              className={classnames(styles.sortTab, sortType === 'default' && styles.active)}
              onClick={() => setSortType('default')}
            >
              <Text>综合</Text>
            </View>
            <View
              className={classnames(styles.sortTab, sortType === 'count' && styles.active)}
              onClick={() => setSortType('count')}
            >
              <Text>人气</Text>
              <Text className={styles.sortIcon}>↓</Text>
            </View>
            <View
              className={classnames(styles.sortTab, sortType === 'deposit_asc' && styles.active)}
              onClick={() => setSortType('deposit_asc')}
            >
              <Text>押金</Text>
              <Text className={styles.sortIcon}>↑</Text>
            </View>
          </View>
          <Text className={styles.resultCount}>
            找到 {filteredItems.length} 件物品
          </Text>
        </View>

        <View className={styles.results}>
          {filteredItems.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="没有找到相关物品"
              description="试试换个关键词或清除筛选条件看看"
              actionText="清除筛选"
              onAction={handleClear}
            />
          ) : (
            <View className={styles.itemsGrid}>
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onFavorite={handleFavorite}
                  showManage={type === 'myItems'}
                  showFavorite={type !== 'myItems'}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default SearchPage;
