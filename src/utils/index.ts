export function formatDate(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function formatDateShort(date: string): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return formatDateShort(dateStr);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDeposit(amount: number): string {
  if (!amount && amount !== 0) return '¥0';
  const num = Math.round(Number(amount) * 100) / 100;
  if (Number.isInteger(num)) {
    return `¥${num}`;
  }
  return `¥${num.toFixed(2)}`;
}

export interface DateTimeValidationResult {
  valid: boolean;
  message?: string;
  date?: Date;
}

const DATETIME_REGEX = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}[ T]\d{1,2}:\d{1,2}(:\d{1,2})?$/;

export function validateDateTime(value: string, fieldLabel: string = '时间'): DateTimeValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, message: `请填写${fieldLabel}` };
  }
  const trimmed = value.trim();
  if (!DATETIME_REGEX.test(trimmed)) {
    return { valid: false, message: `${fieldLabel}格式不正确，应为：YYYY-MM-DD HH:MM` };
  }
  const normalized = trimmed.replace(/\//g, '-').replace('T', ' ');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    return { valid: false, message: `${fieldLabel}不是合法的日期时间` };
  }
  const [datePart] = normalized.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  if (
    d.getFullYear() !== year ||
    d.getMonth() + 1 !== month ||
    d.getDate() !== day
  ) {
    return { valid: false, message: `${fieldLabel}不是合法的日期（如 2 月 30 日无效）` };
  }
  return { valid: true, date: d };
}
