import { create } from 'zustand';
import { itemsData } from '@/data/items';
import { borrowRecordsData } from '@/data/borrowRecords';
import { contactsData, currentUser as currentUserData } from '@/data/user';
import type { Item, BorrowRecord, Contact, User } from '@/types';
import { generateId } from '@/utils';

interface AppState {
  items: Item[];
  borrowRecords: BorrowRecord[];
  contacts: Contact[];
  currentUser: User;
  frozenDeposits: number;

  addItem: (item: Omit<Item, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar' | 'ownerBuilding' | 'status' | 'borrowCount' | 'createdAt'> & { images: string[] }) => void;
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  getFavoriteItems: () => Item[];
  getMyItems: () => Item[];
  getMyBorrowingRecords: () => BorrowRecord[];
  getMyLendingRecords: () => BorrowRecord[];

  createBorrowRecord: (params: {
    itemId: string;
    quantity: number;
    pickupTime: string;
    expectedReturnTime: string;
  }) => { success: boolean; message: string; record?: BorrowRecord };

  cancelBorrowRecord: (recordId: string) => void;
  confirmPickup: (recordId: string) => void;
  confirmReturn: (recordId: string) => void;
  requestExtend: (recordId: string, days: number) => void;
  addRating: (recordId: string, rating: number, comment: string) => void;
  addDamageNote: (recordId: string, note: string) => void;

  addContact: (contact: Omit<Contact, 'id'>) => void;
  getOrCreateContact: (userId: string, userData: Partial<Contact>) => Contact;
}

const useAppStore = create<AppState>((set, get) => ({
  items: itemsData,
  borrowRecords: borrowRecordsData,
  contacts: contactsData,
  currentUser: currentUserData,
  frozenDeposits: 130,

  addItem: (itemData) => {
    console.log('[Store] Adding new item:', itemData.title);
    const state = get();
    const newItem: Item = {
      ...itemData,
      id: generateId(),
      ownerId: state.currentUser.id,
      ownerName: state.currentUser.name,
      ownerAvatar: state.currentUser.avatar,
      ownerBuilding: state.currentUser.building,
      status: 'available',
      borrowCount: 0,
      isFavorite: false,
      isTop: false,
      createdAt: new Date().toISOString().split('T')[0],
      tags: itemData.tags || []
    };
    set((state) => ({
      items: [newItem, ...state.items]
    }));
    console.log('[Store] Item added with id:', newItem.id);
  },

  toggleFavorite: (itemId) => {
    console.log('[Store] Toggle favorite:', itemId);
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    }));
  },

  isFavorite: (itemId) => {
    const state = get();
    const item = state.items.find((i) => i.id === itemId);
    return !!item?.isFavorite;
  },

  getFavoriteItems: () => {
    const state = get();
    return state.items.filter((item) => item.isFavorite);
  },

  getMyItems: () => {
    const state = get();
    return state.items.filter((item) => item.ownerId === state.currentUser.id);
  },

  getMyBorrowingRecords: () => {
    const state = get();
    return state.borrowRecords.filter((r) => r.borrowerId === state.currentUser.id);
  },

  getMyLendingRecords: () => {
    const state = get();
    return state.borrowRecords.filter((r) => r.lenderId === state.currentUser.id);
  },

  createBorrowRecord: (params) => {
    console.log('[Store] Creating borrow record:', params);
    const state = get();
    const item = state.items.find((i) => i.id === params.itemId);

    if (!item) {
      console.error('[Store] Item not found:', params.itemId);
      return { success: false, message: '物品不存在' };
    }

    if (item.status === 'maintenance') {
      return { success: false, message: '物品正在维护中，暂时无法预约' };
    }

    if (item.availableQuantity < params.quantity) {
      return { success: false, message: '可借数量不足' };
    }

    if (item.ownerId === state.currentUser.id) {
      return { success: false, message: '不能预约自己发布的物品' };
    }

    const newRecord: BorrowRecord = {
      id: generateId(),
      itemId: item.id,
      itemTitle: item.title,
      itemImage: item.images[0],
      borrowerId: state.currentUser.id,
      borrowerName: state.currentUser.name,
      borrowerAvatar: state.currentUser.avatar,
      lenderId: item.ownerId,
      lenderName: item.ownerName,
      quantity: params.quantity,
      deposit: item.deposit * params.quantity,
      pickupTime: params.pickupTime,
      expectedReturnTime: params.expectedReturnTime,
      status: 'pending_pickup',
      statusText: '待取件',
      extendCount: 0,
      isPickupConfirmed: false,
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      borrowRecords: [newRecord, ...state.borrowRecords],
      items: state.items.map((i) =>
        i.id === params.itemId
          ? {
              ...i,
              availableQuantity: i.availableQuantity - params.quantity,
              status: i.availableQuantity - params.quantity <= 0 ? 'reserved' : i.status
            }
          : i
      ),
      frozenDeposits: state.frozenDeposits + item.deposit * params.quantity
    }));

    console.log('[Store] Borrow record created:', newRecord.id);
    return { success: true, message: '预约成功', record: newRecord };
  },

  cancelBorrowRecord: (recordId) => {
    console.log('[Store] Cancel borrow record:', recordId);
    const state = get();
    const record = state.borrowRecords.find((r) => r.id === recordId);
    if (!record) return;

    if (record.status !== 'pending_pickup') {
      console.warn('[Store] Cannot cancel record in status:', record.status);
      return;
    }

    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? { ...r, status: 'cancelled', statusText: '已取消' }
          : r
      ),
      items: state.items.map((i) =>
        i.id === record.itemId
          ? {
              ...i,
              availableQuantity: i.availableQuantity + record.quantity,
              status: 'available'
            }
          : i
      ),
      frozenDeposits: Math.max(0, state.frozenDeposits - record.deposit)
    }));
    console.log('[Store] Record cancelled');
  },

  confirmPickup: (recordId) => {
    console.log('[Store] Confirm pickup:', recordId);
    const state = get();
    const record = state.borrowRecords.find((r) => r.id === recordId);
    if (!record || record.status !== 'pending_pickup') return;

    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? { ...r, status: 'borrowing', statusText: '借用中', isPickupConfirmed: true }
          : r
      ),
      items: state.items.map((i) =>
        i.id === record.itemId
          ? { ...i, status: 'lent', borrowCount: i.borrowCount + 1 }
          : i
      )
    }));
    console.log('[Store] Pickup confirmed');
  },

  confirmReturn: (recordId) => {
    console.log('[Store] Confirm return:', recordId);
    const state = get();
    const record = state.borrowRecords.find((r) => r.id === recordId);
    if (!record || record.status !== 'borrowing' && record.status !== 'overdue') return;

    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'returned',
              statusText: '已归还',
              actualReturnTime: new Date().toISOString()
            }
          : r
      ),
      items: state.items.map((i) =>
        i.id === record.itemId
          ? {
              ...i,
              availableQuantity: i.availableQuantity + record.quantity,
              status: 'available'
            }
          : i
      ),
      frozenDeposits: Math.max(0, state.frozenDeposits - record.deposit)
    }));
    console.log('[Store] Return confirmed');
  },

  requestExtend: (recordId, days) => {
    console.log('[Store] Request extend:', recordId, days, 'days');
    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? {
              ...r,
              hasExtendRequest: true,
              extendCount: r.extendCount + 1
            }
          : r
      )
    }));
  },

  addRating: (recordId, rating, comment) => {
    console.log('[Store] Add rating:', recordId, rating, comment);
    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? { ...r, rating, comment }
          : r
      )
    }));
  },

  addDamageNote: (recordId, note) => {
    console.log('[Store] Add damage note:', recordId);
    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? { ...r, damageNote: note }
          : r
      )
    }));
  },

  addContact: (contactData) => {
    console.log('[Store] Add contact:', contactData.name);
    const newContact: Contact = {
      ...contactData,
      id: generateId()
    };
    set((state) => ({
      contacts: [newContact, ...state.contacts]
    }));
    return newContact;
  },

  getOrCreateContact: (userId, userData) => {
    const state = get();
    let contact = state.contacts.find((c) => c.userId === userId);
    if (contact) return contact;

    const newContact: Contact = {
      id: generateId(),
      userId,
      name: userData.name || '邻居',
      avatar: userData.avatar || 'https://picsum.photos/id/1005/200/200',
      building: userData.building || '',
      roomNumber: userData.roomNumber || '',
      phone: userData.phone,
      lastMessage: '',
      lastTime: '',
      unreadCount: 0
    };

    set((state) => ({
      contacts: [newContact, ...state.contacts]
    }));

    console.log('[Store] Created new contact:', newContact.name);
    return newContact;
  }
}));

export default useAppStore;
