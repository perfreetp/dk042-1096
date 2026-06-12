export interface User {
  id: string;
  name: string;
  avatar: string;
  building: string;
  unit: string;
  roomNumber: string;
  creditScore: number;
  phone?: string;
}

export type ItemCategory = 'tools' | 'outdoor' | 'cleaning' | 'kitchen' | 'entertainment' | 'sports' | 'other';

export type ItemStatus = 'available' | 'reserved' | 'lent' | 'maintenance' | 'offline';

export interface Item {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: ItemCategory;
  categoryName: string;
  quantity: number;
  availableQuantity: number;
  deposit: number;
  availableTime: string;
  pickupLocation: string;
  wearDesc?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerBuilding: string;
  status: ItemStatus;
  isFavorite?: boolean;
  isTop?: boolean;
  borrowCount: number;
  tags: string[];
  createdAt: string;
}

export type BorrowStatus = 'pending_pickup' | 'borrowing' | 'returned' | 'overdue' | 'cancelled';

export interface BorrowRecord {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  borrowerId: string;
  borrowerName: string;
  borrowerAvatar: string;
  borrowerBuilding?: string;
  lenderId: string;
  lenderName: string;
  lenderAvatar?: string;
  lenderBuilding?: string;
  quantity: number;
  deposit: number;
  pickupTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  status: BorrowStatus;
  statusText: string;
  damageNote?: string;
  rating?: number;
  comment?: string;
  extendCount: number;
  hasExtendRequest?: boolean;
  isPickupConfirmed?: boolean;
  isReturnReminded?: boolean;
  createdAt: string;
}

export interface Building {
  id: string;
  name: string;
  unitCount: number;
  itemCount: number;
  activeUsers: number;
  distance: string;
  image: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  building: string;
  roomNumber: string;
  phone?: string;
  lastMessage?: string;
  lastTime?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'system';
  timestamp: string;
  isRead: boolean;
}

export interface Rule {
  id: string;
  title: string;
  content: string;
  icon: string;
}

export interface ReportReason {
  id: string;
  text: string;
}

export const categoryMap: Record<ItemCategory, string> = {
  tools: '工具设备',
  outdoor: '户外露营',
  cleaning: '清洁用品',
  kitchen: '厨房用具',
  entertainment: '娱乐影音',
  sports: '运动健身',
  other: '其他物品'
};

export const statusMap: Record<ItemStatus, { text: string; color: string }> = {
  available: { text: '可借', color: '#52C41A' },
  reserved: { text: '已预约', color: '#FAAD14' },
  lent: { text: '已借出', color: '#FF4D4F' },
  maintenance: { text: '维护中', color: '#86909C' },
  offline: { text: '已下架', color: '#BF5EE0' }
};

export const borrowStatusMap: Record<BorrowStatus, { text: string; color: string }> = {
  pending_pickup: { text: '待取件', color: '#FAAD14' },
  borrowing: { text: '借用中', color: '#1677FF' },
  returned: { text: '已归还', color: '#52C41A' },
  overdue: { text: '已逾期', color: '#FF4D4F' },
  cancelled: { text: '已取消', color: '#86909C' }
};

export function formatDeposit(amount: number): string {
  if (!amount && amount !== 0) return '¥0';
  const num = Math.round(Number(amount) * 100) / 100;
  if (Number.isInteger(num)) {
    return `¥${num}`;
  }
  return `¥${num.toFixed(2)}`;
}
