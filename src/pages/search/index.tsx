import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ItemCard from '@/components/ItemCard';
import EmptyState from '@/components/EmptyState';
import { itemsData } from '@/data/items';
import type { ItemCategory, ItemStatus } from '@/types';

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
  { key: 'maintenance', name: '维护中' }
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

  const [keyword, setKeyword] = useState(initialKeyword);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [activeDeposit, setActiveDeposit] = useState<string>('all');
  const [sortType, setSortType] = useState<SortType>('default');
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('[Search] Page loaded with params:', routerParams);
    if (type === 'myItems') {
      Taro.showToast({ title: '查看我的物品', icon: 'none' });
    } else if (type === 'favorites') {
      Taro.showToast({ title: '查看我的收藏', icon: 'none' });
    }
  }, [routerParams, type]);

  const filteredItems = useMemo(() => {
    let result = [...itemsData];

    if (type === 'myItems') {
      result = result.filter(i => ['2', '6'].includes(i.id));
    } else if (type === 'favorites') {
      result = result.filter(i => i.isFavorite || favoriteMap[i.id]);
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
  }, [keyword, activeCategory, activeStatus, activeDeposit, sortType, type, favoriteMap]);

  const handleFavorite = (itemId: string) => {
    console.log('[Search] Toggle favorite:', itemId);
    setFavoriteMap(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    Taro.showToast({ title: '收藏状态已更新', icon: 'success' });
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
                  item={{ ...item, isFavorite: favoriteMap[item.id] ?? item.isFavorite }}
                  onFavorite={handleFavorite}
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
