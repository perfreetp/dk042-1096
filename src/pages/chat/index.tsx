import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, Image, Input, Button, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { chatMessagesData, currentUser } from '@/data/user';
import { formatDate, generateId, formatDeposit } from '@/utils';
import type { ChatMessage } from '@/types';
import useAppStore from '@/store';

interface DisplayMessage extends ChatMessage {
  displayTime?: string;
  isMe?: boolean;
}

const quickReplies = [
  '物品还在吗？',
  '什么时候可以取？',
  '押金怎么付？',
  '可以再借几天吗？',
  '我快到了',
  '已归还，请查收',
  '谢谢！'
];

const ChatPage: React.FC = () => {
  const routerParams = Taro.useRouter().params;

  const contactId = routerParams.contactId || '';
  const userId = routerParams.userId || '';
  const userName = routerParams.userName ? decodeURIComponent(routerParams.userName) : '';
  const userAvatar = routerParams.userAvatar ? decodeURIComponent(routerParams.userAvatar) : '';
  const userBuilding = routerParams.userBuilding ? decodeURIComponent(routerParams.userBuilding) : '';
  const contactNameParam = routerParams.contactName ? decodeURIComponent(routerParams.contactName) : '';
  const itemId = routerParams.itemId || '';

  const items = useAppStore(state => state.items);
  const getOrCreateContact = useAppStore(state => state.getOrCreateContact);
  const scrollRef = useRef<any>(null);

  const contact = useMemo(() => {
    if (contactId) {
      const contacts = useAppStore.getState().contacts;
      const found = contacts.find(c => c.id === contactId);
      if (found) return found;
    }

    let finalName = userName || contactNameParam || '邻居';
    let finalAvatar = userAvatar || '';
    let finalBuilding = userBuilding || '';
    let finalRoom = '';

    if (itemId) {
      const allItems = useAppStore.getState().items;
      const relatedItem = allItems.find(i => i.id === itemId);
      if (relatedItem) {
        if (!finalName || finalName === '邻居') {
          finalName = relatedItem.ownerName || finalName;
        }
        if (!finalAvatar) {
          finalAvatar = relatedItem.ownerAvatar || '';
        }
        if (!finalBuilding) {
          finalBuilding = relatedItem.ownerBuilding || '';
        }
      }
    }

    if (!finalAvatar) {
      finalAvatar = 'https://picsum.photos/id/1005/200/200';
    }
    if (!finalBuilding) {
      finalBuilding = '邻居';
    }

    const targetUserId = userId || 'u' + Math.random().toString(36).slice(2, 8);
    return getOrCreateContact(targetUserId, {
      name: finalName,
      avatar: finalAvatar,
      building: finalBuilding,
      roomNumber: finalRoom
    });
  }, [contactId, userId, userName, userAvatar, userBuilding, contactNameParam, itemId, getOrCreateContact]);

  const relatedItem = useMemo(() => {
    if (!itemId) return null;
    return items.find(i => i.id === itemId) || null;
  }, [items, itemId]);

  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    chatMessagesData.map((m, idx) => ({
      ...m,
      displayTime: idx === 0 ? formatDate(m.timestamp).slice(5, 16) : undefined,
      isMe: m.senderId === 'me'
    }))
  );
  const [inputText, setInputText] = useState('');
  const [isOnline] = useState(true);

  useEffect(() => {
    console.log('[Chat] Page loaded with contact:', contact.name, 'itemId:', itemId);
    setTimeout(() => {
      scrollRef.current?.scrollToOffset?.({ offset: 99999, animated: false });
    }, 200);
  }, [contact.name, itemId]);

  const displayMessages = useMemo(() => {
    const result: (DisplayMessage | { type: 'time'; text: string })[] = [];
    messages.forEach((msg, idx) => {
      if (idx === 0) {
        const dateStr = formatDate(msg.timestamp).slice(5, 16);
        result.push({ type: 'time', text: dateStr });
      } else {
        const prevTime = new Date(messages[idx - 1].timestamp);
        const currTime = new Date(msg.timestamp);
        const diffMin = (currTime.getTime() - prevTime.getTime()) / 60000;
        if (diffMin > 10) {
          result.push({ type: 'time', text: formatDate(msg.timestamp).slice(5, 16) });
        }
      }
      result.push(msg);
    });
    return result;
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToOffset?.({ offset: 99999, animated: true });
    }, 50);
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    console.log('[Chat] Sending message:', text);

    const newMsg: DisplayMessage = {
      id: generateId(),
      senderId: 'me',
      content: text,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
      isMe: true
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    scrollToBottom();

    setTimeout(() => {
      const replies = [
        '好的，收到~',
        '没问题，随时可以来取',
        '押金归还后会马上退回的，请放心😊',
        '好的好的',
        '我在家的，直接过来就行',
        '嗯嗯，多谢啦！',
        '客气啦，邻里之间互相帮忙嘛~'
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      console.log('[Chat] Auto reply:', replyText);
      const replyMsg: DisplayMessage = {
        id: generateId(),
        senderId: contact.userId,
        content: replyText,
        type: 'text',
        timestamp: new Date().toISOString(),
        isRead: true,
        isMe: false
      };
      setMessages(prev => [...prev, replyMsg]);
      scrollToBottom();
    }, 1200 + Math.random() * 800);
  };

  const handleQuickReply = (text: string) => {
    console.log('[Chat] Quick reply:', text);
    setInputText(text);
  };

  const handleBack = () => {
    Taro.navigateBack().catch(() => {
      Taro.switchTab({ url: '/pages/mine/index' });
    });
  };

  const handleMore = () => {
    console.log('[Chat] More actions');
    Taro.showActionSheet({
      itemList: ['查看物品详情', '举报违规', '清空聊天记录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            if (itemId) {
              Taro.navigateTo({ url: `/pages/detail/index?id=${itemId}` });
            } else {
              Taro.showToast({ title: '暂无相关物品', icon: 'none' });
            }
            break;
          case 1:
            Taro.navigateTo({
              url: `/pages/report/index?itemId=${itemId || '1'}&type=user`
            });
            break;
          case 2:
            Taro.showModal({
              title: '清空记录',
              content: '确定要清空与该联系人的所有聊天记录吗？',
              confirmColor: '#FF4D4F',
              success: (r) => {
                if (r.confirm) {
                  console.log('[Chat] Clearing messages');
                  setMessages([]);
                  Taro.showToast({ title: '已清空', icon: 'success' });
                }
              }
            });
            break;
        }
      }
    });
  };

  const handleToolBtn = (type: string) => {
    console.log('[Chat] Tool button:', type);
    if (type === 'image') {
      Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        success: () => {
          const mockImgMsg: DisplayMessage = {
            id: generateId(),
            senderId: 'me',
            content: 'https://picsum.photos/id/200/200/200',
            type: 'image',
            timestamp: new Date().toISOString(),
            isRead: false,
            isMe: true
          };
          setMessages(prev => [...prev, mockImgMsg]);
          scrollToBottom();
          Taro.showToast({ title: '图片已发送', icon: 'success' });
        },
        fail: (err) => console.error('[Chat] ChooseImage failed:', err)
      });
    } else if (type === 'report') {
      Taro.showToast({ title: '位置功能开发中', icon: 'none' });
    }
  };

  const handleItemClick = () => {
    if (!relatedItem) return;
    Taro.navigateTo({ url: `/pages/detail/index?id=${relatedItem.id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.headerBar}>
        <View className={styles.backBtn} onClick={handleBack}>
          <Text>‹</Text>
        </View>
        <Image
          className={styles.headerAvatar}
          src={contact.avatar}
          mode="aspectFill"
          onError={(e) => console.error('[Chat] Header avatar error:', e)}
        />
        <View className={styles.headerInfo}>
          <View className={styles.headerName}>
            <Text>{contact.name}</Text>
            {isOnline && <View className={styles.onlineStatus} />}
          </View>
          <View className={styles.headerSub}>
            <Text>{contact.building} {contact.roomNumber}</Text>
            <Text>·</Text>
            <Text>{isOnline ? '在线' : '离线'}</Text>
          </View>
        </View>
        <View className={styles.headerMore} onClick={handleMore}>
          <Text>⋯</Text>
        </View>
      </View>

      {relatedItem && (
        <View className={styles.goodsCard} onClick={handleItemClick}>
          <Image
            className={styles.goodsImg}
            src={relatedItem.images[0]}
            mode="aspectFill"
            onError={(e) => console.error('[Chat] Goods image error:', e)}
          />
          <View className={styles.goodsInfo}>
            <Text className={styles.goodsLabel}>本次借还物品</Text>
            <Text className={styles.goodsTitle}>{relatedItem.title}</Text>
            <View className={styles.goodsMeta}>
              <Text>{relatedItem.categoryName}</Text>
              <Text className={styles.goodsDeposit}>押金 {formatDeposit(relatedItem.deposit)}</Text>
            </View>
          </View>
          <Text style={{ color: '#52C41A' }}>›</Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        scrollY
        className={styles.chatArea}
        scrollWithAnimation
      >
        {displayMessages.map((item, idx) => {
          if ((item as any).type === 'time') {
            const timeItem = item as any;
            return (
              <View key={`time-${idx}`} className={styles.timeDivider}>
                <View className={styles.dividerLine} />
                <Text className={styles.dividerText}>{timeItem.text}</Text>
                <View className={styles.dividerLine} />
              </View>
            );
          }

          const msg = item as DisplayMessage;
          const isMe = msg.isMe;
          const avatar = isMe ? currentUser.avatar : contact.avatar;

          if (msg.type === 'system') {
            return (
              <View key={msg.id} className={styles.systemMsg}>
                <View className={styles.systemBubble}>
                  <Text>{msg.content}</Text>
                </View>
              </View>
            );
          }

          return (
            <View
              key={msg.id}
              className={classnames(styles.msgRow, isMe && styles.me)}
            >
              <Image
                className={styles.msgAvatar}
                src={avatar}
                mode="aspectFill"
                onError={(e) => console.error('[Chat] Message avatar error:', e)}
              />
              <View className={styles.msgContent}>
                <Text className={styles.msgTime}>
                  {formatDate(msg.timestamp).slice(11, 16)}
                </Text>
                {msg.type === 'image' ? (
                  <Image
                    src={msg.content}
                    mode="widthFix"
                    style={{ maxWidth: 400, borderRadius: 16 }}
                    onError={(e) => console.error('[Chat] Message image error:', e)}
                  />
                ) : (
                  <View
                    className={classnames(
                      styles.bubble,
                      isMe ? styles.textMe : styles.textOther
                    )}
                    onClick={() => {
                      console.log('[Chat] Long press bubble:', msg.content);
                    }}
                  >
                    <Text>{msg.content}</Text>
                  </View>
                )}
                {isMe && (
                  <Text className={styles.msgStatus}>
                    {msg.isRead ? '✓✓ 已读' : '✓ 已发送'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className={styles.quickReplies}>
        {quickReplies.map((text, idx) => (
          <View
            key={idx}
            className={styles.quickReplyItem}
            onClick={() => handleQuickReply(text)}
          >
            <Text>{text}</Text>
          </View>
        ))}
      </View>

      <View className={styles.inputBar}>
        <View className={styles.toolBtn} onClick={() => handleToolBtn('image')}>
          <Text>🖼️</Text>
        </View>
        <View className={styles.toolBtn} onClick={() => handleToolBtn('report')}>
          <Text>📍</Text>
        </View>
        <View className={styles.inputWrap}>
          <Textarea
            className={styles.inputField}
            placeholder="输入消息..."
            placeholderStyle="color: #86909C"
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            onConfirm={handleSend}
            confirmType="send"
            maxlength={500}
            autoHeight
            adjustPosition
            cursorSpacing={10}
          />
        </View>
        <Button
          className={classnames(styles.sendBtn, !inputText.trim() && styles.disabled)}
          onClick={handleSend}
        >
          <Text>发送</Text>
        </Button>
      </View>
    </View>
  );
};

export default ChatPage;
