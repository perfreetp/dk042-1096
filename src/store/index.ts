import { create } from 'zustand';
import { itemsData } from '@/data/items';
import { borrowRecordsData } from '@/data/borrowRecords';
import { contactsData, currentUser as currentUserData } from '@/data/user';
import type { Item, BorrowRecord, Contact, User } from '@/types';
import { generateId, validateDateTime, formatDate } from '@/utils';
import Taro from '@tarojs/taro';

const STORAGE_KEY = 'neighbor_share_app_state_v1';

interface PersistState {
  items: Item[];
  borrowRecords: BorrowRecord[];
  contacts: Contact[];
  frozenDeposits: number;
}

interface AppState {
  items: Item[];
  borrowRecords: BorrowRecord[];
  contacts: Contact[];
  currentUser: User;
  frozenDeposits: number;

  _loaded: boolean;

  _hydrate: () => void;
  _persist: () => void;

  addItem: (item: Omit<Item, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar' | 'ownerBuilding' | 'status' | 'borrowCount' | 'createdAt'> & { images: string[] }) => void;
  updateItem: (itemId: string, updates: Partial<Omit<Item, 'id' | 'ownerId' | 'borrowCount' | 'createdAt'>>) => { success: boolean; message: string };
  offlineItem: (itemId: string) => { success: boolean; message: string };
  onlineItem: (itemId: string) => { success: boolean; message: string };
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

  addContact: (contact: Omit<Contact, 'id'>) => Contact;
  getOrCreateContact: (userId: string, userData: Partial<Contact>) => Contact;
}

const useAppStore = create<AppState>((set, get) => ({
  items: itemsData,
  borrowRecords: borrowRecordsData,
  contacts: contactsData,
  currentUser: currentUserData,
  frozenDeposits: 130,
  _loaded: false,

  _hydrate: () => {
    try {
      const raw = Taro.getStorageSync(STORAGE_KEY);
      if (raw && typeof raw === 'string' && raw.length > 0) {
        const parsed = JSON.parse(raw) as PersistState;
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          console.log('[Store] Hydrated from storage, items count:', parsed.items.length);
          set({
            items: parsed.items,
            borrowRecords: parsed.borrowRecords || borrowRecordsData,
            contacts: parsed.contacts || contactsData,
            frozenDeposits: typeof parsed.frozenDeposits === 'number' ? parsed.frozenDeposits : 130,
            _loaded: true
          });
          return;
        }
      }
      console.log('[Store] No valid persisted state, using default data');
      set({ _loaded: true });
    } catch (err) {
      console.error('[Store] Hydrate error:', err);
      set({ _loaded: true });
    }
  },

  _persist: () => {
    try {
      const state = get();
      const toSave: PersistState = {
        items: state.items,
        borrowRecords: state.borrowRecords,
        contacts: state.contacts,
        frozenDeposits: state.frozenDeposits
      };
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.error('[Store] Persist error:', err);
    }
  },

  addItem: (itemData) => {
    console.log('[Store] Adding new item:', itemData.title);
    const state = get();
    if (!state._loaded) state._hydrate();

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const quantitySafe = Math.max(1, Math.min(99, Math.floor(itemData.quantity || 1)));
    const depositNum = Number((itemData as any).deposit ?? 0);
    if (isNaN(depositNum) || depositNum <= 0) {
      console.error('[Store] addItem rejected: deposit <= 0 or invalid', depositNum);
      return;
    }
    const depositSafe = Math.round(depositNum * 100) / 100;
    if (depositSafe <= 0) {
      console.error('[Store] addItem rejected: depositSafe <= 0 after rounding');
      return;
    }
    const availQtySafe = Math.max(0, Math.min(quantitySafe, Math.floor((itemData as any).availableQuantity ?? quantitySafe)));

    const newItem: Item = {
      ...itemData,
      id: generateId(),
      ownerId: state.currentUser.id,
      ownerName: state.currentUser.name,
      ownerAvatar: state.currentUser.avatar,
      ownerBuilding: state.currentUser.building,
      status: availQtySafe > 0 ? 'available' : 'reserved',
      quantity: quantitySafe,
      availableQuantity: availQtySafe,
      deposit: depositSafe,
      borrowCount: 0,
      isFavorite: false,
      isTop: false,
      createdAt: dateStr,
      tags: itemData.tags || []
    };
    set((state) => ({
      items: [newItem, ...state.items]
    }));
    get()._persist();
    console.log('[Store] Item added with id:', newItem.id);
  },

  updateItem: (itemId, updates) => {
    console.log('[Store] Update item:', itemId, updates);
    const state = get();
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: '物品不存在' };
    if (item.ownerId !== state.currentUser.id) {
      return { success: false, message: '只能编辑自己的物品' };
    }

    const lentCount = Math.max(0, item.quantity - item.availableQuantity);
    let newQuantity = item.quantity;
    let newAvailQty = item.availableQuantity;
    if (typeof updates.quantity === 'number') {
      if (updates.quantity < lentCount) {
        return { success: false, message: `已有${lentCount}件借出，总数量不能少于${lentCount}件` };
      }
      newQuantity = Math.max(1, Math.min(99, Math.floor(updates.quantity)));
      newAvailQty = Math.max(0, Math.min(newQuantity - lentCount, newQuantity));
    }
    if (typeof updates.availableQuantity === 'number') {
      const maxAvail = newQuantity - lentCount;
      newAvailQty = Math.max(0, Math.min(maxAvail, Math.floor(updates.availableQuantity)));
    }

    let newDeposit = item.deposit;
    if (typeof updates.deposit === 'number') {
      if (isNaN(updates.deposit) || updates.deposit <= 0) {
        return { success: false, message: '押金必须大于0元' };
      }
      newDeposit = Math.round(updates.deposit * 100) / 100;
      if (newDeposit <= 0) {
        return { success: false, message: '押金必须大于0元' };
      }
    }

    let newStatus = item.status;
    if (updates.status) {
      newStatus = updates.status;
    } else if (item.status !== 'offline' && item.status !== 'maintenance') {
      newStatus = newAvailQty > 0 ? 'available' : 'reserved';
    }

    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              ...updates,
              quantity: newQuantity,
              availableQuantity: newAvailQty,
              deposit: newDeposit,
              status: newStatus
            }
          : i
      )
    }));
    get()._persist();
    return { success: true, message: '修改成功' };
  },

  offlineItem: (itemId) => {
    console.log('[Store] Offline item:', itemId);
    const state = get();
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: '物品不存在' };
    if (item.ownerId !== state.currentUser.id) {
      return { success: false, message: '只能操作自己的物品' };
    }
    const lentCount = item.quantity - item.availableQuantity;
    if (lentCount > 0) {
      return { success: false, message: `还有${lentCount}件物品未归还，暂时无法下架` };
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, status: 'offline' } : i
      )
    }));
    get()._persist();
    return { success: true, message: '已下架' };
  },

  onlineItem: (itemId) => {
    console.log('[Store] Online item:', itemId);
    const state = get();
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: '物品不存在' };
    if (item.ownerId !== state.currentUser.id) {
      return { success: false, message: '只能操作自己的物品' };
    }
    const newStatus = item.availableQuantity > 0 ? 'available' : 'reserved';
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, status: newStatus } : i
      )
    }));
    get()._persist();
    return { success: true, message: '已重新上架' };
  },

  toggleFavorite: (itemId) => {
    console.log('[Store] Toggle favorite:', itemId);
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    }));
    get()._persist();
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
    if (item.status === 'offline') {
      return { success: false, message: '物品已下架，暂时无法预约' };
    }
    if (item.ownerId === state.currentUser.id) {
      return { success: false, message: '不能预约自己发布的物品' };
    }

    const rawQty = Number(params.quantity);
    if (!rawQty || isNaN(rawQty) || rawQty <= 0 || !Number.isFinite(rawQty)) {
      return { success: false, message: '请填写正确的借用数量' };
    }
    const qty = Math.floor(rawQty);
    if (qty !== rawQty) {
      return { success: false, message: '借用数量必须为整数' };
    }
    if (qty > item.availableQuantity) {
      return { success: false, message: `库存不足，仅剩${item.availableQuantity}件可借` };
    }

    const pickupCheck = validateDateTime(params.pickupTime || '', '取件时间');
    if (!pickupCheck.valid) return { success: false, message: pickupCheck.message! };

    const returnCheck = validateDateTime(params.expectedReturnTime || '', '归还时间');
    if (!returnCheck.valid) return { success: false, message: returnCheck.message! };

    if (returnCheck.date!.getTime() <= pickupCheck.date!.getTime()) {
      return { success: false, message: '归还时间必须晚于取件时间' };
    }

    const normalizedPickup = formatDate(pickupCheck.date!.toISOString());
    const normalizedReturn = formatDate(returnCheck.date!.toISOString());

    const depositSafe = Math.max(0, Math.round(item.deposit * qty * 100) / 100);

    const newRecord: BorrowRecord = {
      id: generateId(),
      itemId: item.id,
      itemTitle: item.title,
      itemImage: item.images[0],
      borrowerId: state.currentUser.id,
      borrowerName: state.currentUser.name,
      borrowerAvatar: state.currentUser.avatar,
      borrowerBuilding: state.currentUser.building,
      lenderId: item.ownerId,
      lenderName: item.ownerName,
      lenderAvatar: item.ownerAvatar,
      lenderBuilding: item.ownerBuilding,
      quantity: qty,
      deposit: depositSafe,
      pickupTime: normalizedPickup,
      expectedReturnTime: normalizedReturn,
      status: 'pending_pickup',
      statusText: '待取件',
      extendCount: 0,
      isPickupConfirmed: false,
      createdAt: new Date().toISOString()
    };

    const newAvailQty = Math.max(0, item.availableQuantity - qty);

    set((state) => ({
      borrowRecords: [newRecord, ...state.borrowRecords],
      items: state.items.map((i) =>
        i.id === params.itemId
          ? {
              ...i,
              availableQuantity: newAvailQty,
              status: newAvailQty <= 0 ? 'reserved' : i.status
            }
          : i
      ),
      frozenDeposits: Math.round((state.frozenDeposits + depositSafe) * 100) / 100
    }));
    get()._persist();

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
              availableQuantity: Math.min(i.quantity, i.availableQuantity + record.quantity),
              status: 'available'
            }
          : i
      ),
      frozenDeposits: Math.max(0, state.frozenDeposits - record.deposit)
    }));
    get()._persist();
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
          ? { ...i, status: 'lent', borrowCount: (i.borrowCount || 0) + 1 }
          : i
      )
    }));
    get()._persist();
    console.log('[Store] Pickup confirmed');
  },

  confirmReturn: (recordId) => {
    console.log('[Store] Confirm return:', recordId);
    const state = get();
    const record = state.borrowRecords.find((r) => r.id === recordId);
    if (!record) return;
    if (record.status !== 'borrowing' && record.status !== 'overdue') return;

    const actualReturn = new Date();
    const actualReturnStr = `${actualReturn.getFullYear()}-${String(actualReturn.getMonth() + 1).padStart(2, '0')}-${String(actualReturn.getDate()).padStart(2, '0')} ${String(actualReturn.getHours()).padStart(2, '0')}:${String(actualReturn.getMinutes()).padStart(2, '0')}`;

    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'returned',
              statusText: '已归还',
              actualReturnTime: actualReturnStr
            }
          : r
      ),
      items: state.items.map((i) =>
        i.id === record.itemId
          ? {
              ...i,
              availableQuantity: Math.min(i.quantity, i.availableQuantity + record.quantity),
              status: 'available'
            }
          : i
      ),
      frozenDeposits: Math.max(0, state.frozenDeposits - record.deposit)
    }));
    get()._persist();
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
              extendCount: (r.extendCount || 0) + 1
            }
          : r
      )
    }));
    get()._persist();
  },

  addRating: (recordId, rating, comment) => {
    console.log('[Store] Add rating:', recordId, rating, comment);
    const ratingSafe = Math.max(1, Math.min(5, Math.floor(rating)));
    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === recordId
          ? { ...r, rating: ratingSafe, comment: comment || undefined }
          : r
      )
    }));
    get()._persist();
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
    get()._persist();
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
    get()._persist();
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
      building: userData.building || '未知楼栋',
      roomNumber: userData.roomNumber || '',
      phone: userData.phone,
      lastMessage: '',
      lastTime: '',
      unreadCount: 0
    };

    set((state) => ({
      contacts: [newContact, ...state.contacts]
    }));
    get()._persist();

    console.log('[Store] Created new contact:', newContact.name);
    return newContact;
  }
}));

export default useAppStore;
