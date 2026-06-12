import React, { useState, useMemo } from 'react';
import { View, Text, Image, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { contactsData } from '@/data/user';
import EmptyState from '@/components/EmptyState';
import type { Contact } from '@/types';

const ContactsPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [contacts, setContacts] = useState<Contact[]>(contactsData);

  const unreadTotal = useMemo(() => {
    return contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!keyword.trim()) return contacts;
    const kw = keyword.trim().toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      c.building.toLowerCase().includes(kw) ||
      c.roomNumber.toLowerCase().includes(kw)
    );
  }, [contacts, keyword]);

  const onlineIds = ['u1', 'u2'];

  const handleContactClick = (contact: Contact) => {
    console.log('[Contacts] Click contact:', contact.id, contact.name);
    setContacts(prev =>
      prev.map(c =>
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      )
    );
    Taro.navigateTo({
      url: `/pages/chat/index?contactId=${contact.id}&contactName=${encodeURIComponent(contact.name)}`
    });
  };

  const handleMore = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    console.log('[Contacts] More actions for:', contact.name);
    Taro.showActionSheet({
      itemList: ['拨打电话', '查看资料', '删除联系人'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            if (contact.phone) {
              Taro.makePhoneCall({
                phoneNumber: contact.phone.replace(/\*/g, '0'),
                fail: (err) => console.error('[Contacts] Call failed:', err)
              });
            } else {
              Taro.showToast({ title: '对方未留电话', icon: 'none' });
            }
            break;
          case 1:
            Taro.showModal({
              title: contact.name,
              content: `楼栋：${contact.building}\n门牌：${contact.roomNumber}\n${contact.phone ? `电话：${contact.phone}` : '电话：未公开'}`,
              showCancel: false,
              confirmColor: '#52C41A'
            });
            break;
          case 2:
            Taro.showModal({
              title: '删除联系人',
              content: `确定删除"${contact.name}"吗？`,
              confirmColor: '#FF4D4F',
              success: (r) => {
                if (r.confirm) {
                  console.log('[Contacts] Deleting contact:', contact.id);
                  setContacts(prev => prev.filter(c => c.id !== contact.id));
                  Taro.showToast({ title: '已删除', icon: 'success' });
                }
              }
            });
            break;
        }
      },
      fail: (err) => console.error('[Contacts] ActionSheet failed:', err)
    });
  };

  const handleAdd = () => {
    console.log('[Contacts] Add new contact');
    Taro.showModal({
      title: '添加联系人',
      content: '请输入邻居的房间号进行搜索添加，或通过借还记录自动添加常用联系人',
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#52C41A'
    });
  };

  const renderContactItem = (contact: Contact, isOnline: boolean) => (
    <View
      key={contact.id}
      className={styles.contactCard}
      onClick={() => handleContactClick(contact)}
    >
      <View className={styles.avatarWrap}>
        <Image
          className={styles.avatar}
          src={contact.avatar}
          mode="aspectFill"
          onError={(e) => console.error('[Contacts] Avatar error:', e)}
        />
        {isOnline && <View className={styles.onlineDot} />}
      </View>

      <View className={styles.contactInfo}>
        <View className={styles.infoTop}>
          <View className={styles.nameRow}>
            <Text className={styles.contactName}>{contact.name}</Text>
            <View className={classnames(styles.badge, styles.neighbor)}>
              <Text>{contact.building}</Text>
            </View>
          </View>
          <Text className={styles.timeText}>{contact.lastTime}</Text>
        </View>

        <View className={styles.infoMiddle}>
          <View className={styles.buildingInfo}>
            <Text>🏠</Text>
            <Text>{contact.roomNumber}</Text>
          </View>
          {isOnline && (
            <Text className={styles.roomInfo}>· 在线</Text>
          )}
        </View>

        <View className={styles.infoBottom}>
          <Text className={styles.lastMsg}>
            {contact.lastMessage || '暂无消息记录，打个招呼吧'}
          </Text>
          {contact.unreadCount! > 0 && (
            <View className={classnames(
              styles.unreadBadge,
              contact.unreadCount! > 99 && styles.dot
            )}>
              <Text>{contact.unreadCount! > 99 ? '' : contact.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.moreBtn} onClick={(e) => handleMore(e as any, contact)}>
        <Text>⋯</Text>
      </View>
    </View>
  );

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索姓名、楼栋、门牌号..."
            placeholderStyle="color: #86909C"
            value={keyword}
            onInput={e => setKeyword(e.detail.value)}
            confirmType="search"
          />
        </View>
        <Text className={styles.addBtn} onClick={handleAdd}>
          <Text>+</Text>
          <Text>添加</Text>
        </Text>
      </View>

      <ScrollView scrollY style={{ flex: 1 }}>
        <View className={styles.statsBar}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{contacts.length}</Text>
            <Text className={styles.statLabel}>位联系人</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{onlineIds.length}</Text>
            <Text className={styles.statLabel}>人在线</Text>
          </View>
          {unreadTotal > 0 && (
            <View className={styles.statItem}>
              <Text className={styles.statValue} style={{ color: '#FF4D4F' }}>
                {unreadTotal}
              </Text>
              <Text className={styles.statLabel}>条未读</Text>
            </View>
          )}
        </View>

        <View className={styles.sectionTitle}>
          <Text>常联系</Text>
          <Text className={styles.sectionCount}>{filteredContacts.length}</Text>
        </View>

        <View className={styles.listContainer}>
          {filteredContacts.length === 0 ? (
            <EmptyState
              icon="👥"
              title={keyword ? '没有找到相关联系人' : '还没有常用联系人'}
              description={keyword ? '试试换个关键词搜索' : '从借还记录中自动添加或手动添加邻居'}
              actionText={keyword ? '清除搜索' : '去添加'}
              onAction={() => {
                if (keyword) {
                  setKeyword('');
                } else {
                  handleAdd();
                }
              }}
            />
          ) : (
            filteredContacts.map(contact =>
              renderContactItem(contact, onlineIds.includes(contact.userId))
            )
          )}
        </View>

        {contacts.length > 0 && (
          <View className={styles.addTip} onClick={handleAdd}>
            <View className={styles.addTipIcon}>
              <Text>➕</Text>
            </View>
            <View className={styles.addTipText}>
              <Text className={styles.addTipTitle}>添加更多邻居</Text>
              <Text className={styles.addTipDesc}>搜索门牌号或通过借还记录自动添加</Text>
            </View>
            <Text style={{ color: '#52C41A', fontSize: 28 }}>›</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ContactsPage;
