import type { Building, Rule } from '@/types';

export const buildingsData: Building[] = [
  {
    id: 'b1',
    name: '1栋',
    unitCount: 4,
    itemCount: 18,
    activeUsers: 32,
    distance: '50m',
    image: 'https://picsum.photos/id/787/400/300'
  },
  {
    id: 'b2',
    name: '2栋',
    unitCount: 3,
    itemCount: 12,
    activeUsers: 25,
    distance: '80m',
    image: 'https://picsum.photos/id/1082/400/300'
  },
  {
    id: 'b3',
    name: '3栋',
    unitCount: 4,
    itemCount: 24,
    activeUsers: 45,
    distance: '100m',
    image: 'https://picsum.photos/id/3/400/300'
  },
  {
    id: 'b4',
    name: '4栋',
    unitCount: 3,
    itemCount: 15,
    activeUsers: 28,
    distance: '150m',
    image: 'https://picsum.photos/id/787/400/300'
  },
  {
    id: 'b5',
    name: '5栋',
    unitCount: 4,
    itemCount: 21,
    activeUsers: 38,
    distance: '200m',
    image: 'https://picsum.photos/id/1082/400/300'
  }
];

export const rulesData: Rule[] = [
  {
    id: 'r1',
    title: '按时归还',
    content: '请在约定时间内归还物品，延期请提前申请延期',
    icon: '⏰'
  },
  {
    id: 'r2',
    title: '爱护物品',
    content: '请爱护借用物品，如有损坏需照价赔偿',
    icon: '🤝'
  },
  {
    id: 'r3',
    title: '押金制度',
    content: '押金在物品完好归还后24小时内原路退回',
    icon: '💰'
  },
  {
    id: 'r4',
    title: '实名借还',
    content: '所有借还记录可追溯，请邻居们互相信任',
    icon: '🪪'
  }
];
