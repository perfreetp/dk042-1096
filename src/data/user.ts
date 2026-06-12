import type { User, Contact } from '@/types';

export const currentUser: User = {
  id: 'me',
  name: '张小明',
  avatar: 'https://picsum.photos/id/1001/200/200',
  building: '3栋',
  unit: '1单元',
  roomNumber: '602',
  creditScore: 98,
  phone: '138****8888'
};

export const myItemsIds = ['2', '6'];

export const myBorrowingIds = ['br1', 'br2'];

export const myLendingIds = ['br3', 'br6'];

export const contactsData: Contact[] = [
  {
    id: 'c1',
    userId: 'u1',
    name: '李先生',
    avatar: 'https://picsum.photos/id/1005/200/200',
    building: '3栋',
    roomNumber: '1单元1201',
    lastMessage: '梯子随时可以来取哦',
    lastTime: '2小时前',
    unreadCount: 0
  },
  {
    id: 'c2',
    userId: 'u8',
    name: '周先生',
    avatar: 'https://picsum.photos/id/1025/200/200',
    building: '6栋',
    roomNumber: '1单元1108',
    lastMessage: '好的，下午3点我在家',
    lastTime: '昨天',
    unreadCount: 1
  },
  {
    id: 'c3',
    userId: 'u5',
    name: '刘女士',
    avatar: 'https://picsum.photos/id/91/200/200',
    building: '2栋',
    roomNumber: '2单元505',
    lastMessage: '清洁机已收到，感谢！',
    lastTime: '3天前',
    unreadCount: 0
  },
  {
    id: 'c4',
    userId: 'u2',
    name: '王女士',
    avatar: 'https://picsum.photos/id/1012/200/200',
    building: '5栋',
    roomNumber: '2单元203',
    lastMessage: '明天上午来取打蛋器~',
    lastTime: '今天 09:15',
    unreadCount: 2
  }
];

export const reportReasons = [
  { id: '1', text: '物品与描述不符' },
  { id: '2', text: '物品损坏未标注' },
  { id: '3', text: '到期不归还' },
  { id: '4', text: '拒绝退回押金' },
  { id: '5', text: '态度恶劣/不友好' },
  { id: '6', text: '虚假信息/诈骗' },
  { id: '7', text: '其他原因' }
];

export const chatMessagesData = [
  {
    id: 'm1',
    senderId: 'u8',
    content: '你好，羽毛球拍我想预约明天下午可以吗？',
    type: 'text' as const,
    timestamp: '2026-06-12 09:15:00',
    isRead: true
  },
  {
    id: 'm2',
    senderId: 'me',
    content: '可以的，下午3点后我都在家',
    type: 'text' as const,
    timestamp: '2026-06-12 09:16:00',
    isRead: true
  },
  {
    id: 'm3',
    senderId: 'u8',
    content: '好的，下午3点我在家',
    type: 'text' as const,
    timestamp: '2026-06-12 09:20:00',
    isRead: true
  },
  {
    id: 'm4',
    senderId: 'me',
    content: '对了，取的时候带好押金80元哈，归还后会退的',
    type: 'text' as const,
    timestamp: '2026-06-12 09:21:00',
    isRead: true
  }
];
