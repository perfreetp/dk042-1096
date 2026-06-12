import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import SectionHeader from '@/components/SectionHeader';
import ItemCard from '@/components/ItemCard';
import BuildingCard from '@/components/BuildingCard';
import { buildingsData, rulesData } from '@/data/buildings';
import type { ItemCategory } from '@/types';
import useAppStore from '@/store';

const categories = [
  { key: 'tools', name: '工具设备', icon: '🔧' },
  { key: 'outdoor', name: '户外露营', icon: '🏕️' },
  { key: 'cleaning', name: '清洁用品', icon: '🧹' },
  { key: 'kitchen', name: '厨房用具', icon: '🍳' },
  { key: 'entertainment', name: '娱乐影音', icon: '🎬' },
  { key: 'sports', name: '运动健身', icon: '⚽' },
  { key: 'other', name: '其他', icon: '📦' },
  { key: 'all', name: '全部分类', icon: '🔍' }
];

const HomePage: React.FC = () => {
  const items = useAppStore(state => state.items);
  const currentUser = useAppStore(state => state.currentUser);
  const toggleFavorite = useAppStore(state => state.toggleFavorite);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');

  const handleSearch = () => {
    Taro.navigateTo({
      url: `/pages/search/index?keyword=${encodeURIComponent(searchKeyword)}`
    });
  };

  const handleCategoryClick = (key: string) => {
    if (key === 'all') {
      setActiveCategory('all');
    } else {
      Taro.navigateTo({
        url: `/pages/search/index?category=${key}`
      });
    }
  };

  const handleFavorite = (itemId: string) => {
    console.log('[Home] Toggling favorite for item:', itemId);
    toggleFavorite(itemId);
    const isFav = items.find(i => i.id === itemId)?.isFavorite;
    Taro.showToast({
      title: isFav ? '已取消收藏' : '已收藏',
      icon: 'success'
    });
  };

  const handleRefresh = () => {
    console.log('[Home] Pull to refresh triggered');
    Taro.stopPullDownRefresh();
  };

  React.useEffect(() => {
    Taro.eventCenter.on('__taroPullDownRefresh', handleRefresh);
    return () => {
      Taro.eventCenter.off('__taroPullDownRefresh', handleRefresh);
    };
  }, []);

  const displayItems = useMemo(() =>
      activeCategory === 'all'
      ? items.filter(i => i.status === 'available')
      : items.filter(i => i.category === activeCategory && i.status === 'available'),
    [items, activeCategory]
  );

  const topItems = useMemo(() => items.filter(i => i.isTop), [items]);
  const availableCount = useMemo(() => items.filter(i => i.status === 'available').length, [items]);
  const recommendItems = useMemo(() =>
    items.filter(i => i.tags.some(t => t.includes('热门'))).slice(0, 6),
    [items]
  );

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.greeting}>
          <View className={styles.greetingText}>
            <Text className={styles.greetingTitle}>你好，{currentUser.name} 👋</Text>
            <Text className={styles.greetingSub}>邻里互助，共享美好生活</Text>
          </View>
          <View className={styles.locationBadge}>
            <Text>📍</Text>
            <Text>{currentUser.building}</Text>
          </View>
        </View>

        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索物品、工具、邻居..."
            placeholderClass={styles.searchInput}
            value={searchKeyword}
            onInput={e => setSearchKeyword(e.detail.value)}
            onConfirm={handleSearch}
            confirmType="search"
          />
          <Button className={styles.searchBtn} onClick={handleSearch}>
            搜索
          </Button>
        </View>

        <View className={styles.statsBar}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{availableCount}</Text>
            <Text className={styles.statLabel}>可借物品</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>156</Text>
            <Text className={styles.statLabel}>热心邻居</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>1280</Text>
            <Text className={styles.statLabel}>成功借还</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.categorySection}>
          <View className={styles.categoryGrid}>
            {categories.map(cat => (
              <View
                key={cat.key}
                className={styles.categoryItem}
                onClick={() => handleCategoryClick(cat.key)}
              >
                <View className={styles.categoryIcon}>
                  <Text>{cat.icon}</Text>
                </View>
                <Text className={styles.categoryName}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <SectionHeader
            title="附近楼栋"
            subtitle="近邻更方便"
            showMore
            moreText="查看全部"
          />
          <ScrollView
            className={styles.scrollContainer}
            scrollX
            enhanced
            showScrollbar={false}
          >
            {buildingsData.map(building => (
              <BuildingCard
                key={building.id}
                building={building}
                onClick={(b) => {
                  console.log('[Home] Building clicked:', b.name);
                  Taro.navigateTo({
                    url: `/pages/search/index?building=${b.id}`
                  });
                }}
              />
            ))}
          </ScrollView>
        </View>

        <View className={styles.rulesSection}>
          <SectionHeader
            title="借用规则"
            subtitle="共建友好社区"
          />
          <View className={styles.rulesGrid}>
            {rulesData.map(rule => (
              <View key={rule.id} className={styles.ruleItem}>
                <Text className={styles.ruleIcon}>{rule.icon}</Text>
                <View className={styles.ruleContent}>
                  <Text className={styles.ruleTitle}>{rule.title}</Text>
                  <Text className={styles.ruleDesc}>{rule.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {topItems.length > 0 && (
          <View className={styles.section}>
            <SectionHeader
              title="🔥 管理员推荐"
              subtitle="优质好物"
            />
            <View className={styles.itemsGrid}>
              {topItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onFavorite={handleFavorite}
                />
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <SectionHeader
            title="推荐清单"
            subtitle={`共 ${recommendItems.length} 件好物品`}
            showMore
            moreText="更多好物"
            onMoreClick={() => Taro.switchTab({ url: '/pages/publish/index' }).catch(() => {})}
          />
          <View className={styles.itemsGrid}>
            {recommendItems.slice(0, 4).map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onFavorite={handleFavorite}
              />
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <SectionHeader
            title="全部可借"
            subtitle={`${displayItems.length} 件物品等你借`}
          />
          <View className={styles.itemsGrid}>
            {displayItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onFavorite={handleFavorite}
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
