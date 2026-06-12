import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ItemCategory, Item } from '@/types';
import { categoryMap } from '@/types';
import useAppStore from '@/store';

const categoryOptions = [
  { key: 'tools', name: '工具设备', icon: '🔧' },
  { key: 'outdoor', name: '户外露营', icon: '🏕️' },
  { key: 'cleaning', name: '清洁用品', icon: '🧹' },
  { key: 'kitchen', name: '厨房用具', icon: '🍳' },
  { key: 'entertainment', name: '娱乐影音', icon: '🎬' },
  { key: 'sports', name: '运动健身', icon: '⚽' },
  { key: 'other', name: '其他物品', icon: '📦' }
];

const timeOptions = [
  '全天可借',
  '工作日白天',
  '工作日晚间',
  '周末全天',
  '节假日',
  '提前预约'
];

const depositPresets = [10, 20, 50, 100, 200];

const PublishPage: React.FC = () => {
  const routerParams = Taro.useRouter().params;
  const editItemId = routerParams.itemId || '';

  const items = useAppStore(state => state.items);
  const addItem = useAppStore(state => state.addItem);
  const updateItem = useAppStore(state => state.updateItem);
  const offlineItem = useAppStore(state => state.offlineItem);
  const onlineItem = useAppStore(state => state.onlineItem);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('tools');
  const [quantity, setQuantity] = useState('1');
  const [deposit, setDeposit] = useState('50');
  const [availableTime, setAvailableTime] = useState('周末全天');
  const [pickupLocation, setPickupLocation] = useState('');
  const [wearDesc, setWearDesc] = useState('');

  useEffect(() => {
    if (editItemId) {
      const found = items.find(i => i.id === editItemId);
      if (found) {
        console.log('[Publish] Enter edit mode for item:', found.id, found.title);
        setIsEditMode(true);
        setEditItem(found);
        setImages(found.images);
        setTitle(found.title);
        setDescription(found.description);
        setCategory(found.category);
        setQuantity(String(found.quantity));
        setDeposit(String(found.deposit));
        setAvailableTime(found.availableTime);
        setPickupLocation(found.pickupLocation);
        setWearDesc(found.wearDesc || '');
        Taro.setNavigationBarTitle({ title: '编辑物品' }).catch(() => {});
      } else {
        Taro.showToast({ title: '物品不存在', icon: 'none' });
      }
    }
  }, [editItemId, items]);

  const lentCount = editItem ? Math.max(0, editItem.quantity - editItem.availableQuantity) : 0;

  const handleChooseImage = () => {
    if (images.length >= 6) {
      Taro.showToast({ title: '最多上传6张图片', icon: 'none' });
      return;
    }
    console.log('[Publish] Choose image triggered');
    const mockImage = `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/600`;
    setImages([...images, mockImage]);
    Taro.showToast({ title: '添加成功', icon: 'success' });
  };

  const handleDeleteImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleReset = () => {
    if (isEditMode && editItem) {
      setImages(editItem.images);
      setTitle(editItem.title);
      setDescription(editItem.description);
      setCategory(editItem.category);
      setQuantity(String(editItem.quantity));
      setDeposit(String(editItem.deposit));
      setAvailableTime(editItem.availableTime);
      setPickupLocation(editItem.pickupLocation);
      setWearDesc(editItem.wearDesc || '');
      Taro.showToast({ title: '已恢复', icon: 'success' });
    } else {
      setImages([]);
      setTitle('');
      setDescription('');
      setCategory('tools');
      setQuantity('1');
      setDeposit('50');
      setAvailableTime('周末全天');
      setPickupLocation('');
      setWearDesc('');
      Taro.showToast({ title: '已重置', icon: 'success' });
    }
  };

  const handleQuantityChange = (e: any) => {
    const val = e.detail.value || '';
    const cleaned = val.replace(/[^\d]/g, '');
    if (!cleaned) {
      setQuantity('');
      return;
    }
    const num = parseInt(cleaned, 10);
    if (num > 99) {
      setQuantity('99');
      Taro.showToast({ title: '数量最多99件', icon: 'none' });
      return;
    }
    if (isEditMode && lentCount > 0 && num < lentCount) {
      Taro.showToast({ title: `已有${lentCount}件借出，不能少于${lentCount}`, icon: 'none' });
      return;
    }
    setQuantity(cleaned);
  };

  const handleDepositChange = (e: any) => {
    const val = e.detail.value || '';
    const cleaned = val.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    if (cleaned) {
      const num = parseFloat(cleaned);
      if (num > 9999) {
        setDeposit('9999');
        Taro.showToast({ title: '押金最多9999元', icon: 'none' });
        return;
      }
    }
    setDeposit(cleaned);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入物品名称', icon: 'none' });
      return false;
    }
    if (images.length === 0) {
      Taro.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return false;
    }
    if (!pickupLocation.trim()) {
      Taro.showToast({ title: '请填写取还地点', icon: 'none' });
      return false;
    }

    const quantityClean = (quantity || '').trim();
    if (!quantityClean) {
      Taro.showToast({ title: '请填写数量', icon: 'none' });
      return false;
    }
    const quantityNum = parseInt(quantityClean, 10);
    if (!quantityNum || quantityNum <= 0 || isNaN(quantityNum)) {
      Taro.showToast({ title: '数量必须大于0', icon: 'none' });
      return false;
    }
    if (quantityNum > 99) {
      Taro.showToast({ title: '数量不能超过99件', icon: 'none' });
      return false;
    }
    if (isEditMode && lentCount > 0 && quantityNum < lentCount) {
      Taro.showToast({ title: `已有${lentCount}件借出，不能少于${lentCount}件`, icon: 'none' });
      return false;
    }

    const depositClean = (deposit || '').trim();
    if (depositClean === '' || depositClean === '.') {
      Taro.showToast({ title: '请填写押金（必须大于0）', icon: 'none' });
      return false;
    }
    const depositNum = parseFloat(depositClean);
    if (isNaN(depositNum)) {
      Taro.showToast({ title: '押金格式不正确', icon: 'none' });
      return false;
    }
    if (depositNum <= 0) {
      Taro.showToast({ title: '押金必须大于0元', icon: 'none' });
      return false;
    }
    if (depositNum > 9999) {
      Taro.showToast({ title: '押金不能超过9999元', icon: 'none' });
      return false;
    }
    if (depositClean.startsWith('.') || depositClean.endsWith('.')) {
      Taro.showToast({ title: '押金格式不正确', icon: 'none' });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    console.log('[Publish] Submit form:', { isEditMode, images, title, deposit });

    if (!validateForm()) return;

    const quantityNum = parseInt(quantity, 10);
    const depositNum = parseFloat(deposit);
    const finalQuantity = Math.floor(quantityNum);
    const finalDeposit = Math.round(depositNum * 100) / 100;

    console.log('[Publish] Validated:', { finalQuantity, finalDeposit });

    Taro.showLoading({ title: isEditMode ? '保存中...' : '发布中...', mask: true });

    try {
      if (isEditMode && editItem) {
        const result = updateItem(editItem.id, {
          title: title.trim(),
          description: description.trim() || '暂无描述',
          images,
          category,
          categoryName: categoryMap[category],
          quantity: finalQuantity,
          deposit: finalDeposit,
          availableTime,
          pickupLocation: pickupLocation.trim(),
          wearDesc: wearDesc.trim() || undefined
        });
        Taro.hideLoading();
        if (result.success) {
          Taro.showModal({
            title: '修改成功',
            content: '物品信息已更新，各页面会同步展示最新内容。',
            showCancel: false,
            confirmText: '好的',
            confirmColor: '#52C41A',
            success: () => {
              Taro.navigateBack().catch(() => {
                Taro.switchTab({ url: '/pages/mine/index' }).catch(() => {});
              });
            }
          });
        } else {
          Taro.showToast({ title: result.message, icon: 'none' });
        }
      } else {
        addItem({
          title: title.trim(),
          description: description.trim() || '暂无描述',
          images,
          category,
          categoryName: categoryMap[category],
          quantity: finalQuantity,
          availableQuantity: finalQuantity,
          deposit: finalDeposit,
          availableTime,
          pickupLocation: pickupLocation.trim(),
          wearDesc: wearDesc.trim() || undefined,
          tags: []
        });

        Taro.hideLoading();
        Taro.showModal({
          title: '发布成功',
          content: '您的物品已成功发布，邻居们可以看到啦！',
          showCancel: false,
          confirmText: '好的',
          confirmColor: '#52C41A',
          success: () => {
            Taro.switchTab({ url: '/pages/home/index' }).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.error('[Publish] Error:', err);
      Taro.hideLoading();
      Taro.showToast({ title: isEditMode ? '保存失败' : '发布失败，请重试', icon: 'none' });
    }
  };

  const handleOffline = () => {
    if (!editItem) return;
    Taro.showModal({
      title: '确认下架',
      content: '下架后邻居将无法搜索和预约此物品，确认下架吗？',
      confirmColor: '#BF5EE0',
      success: (res) => {
        if (res.confirm) {
          const result = offlineItem(editItem.id);
          Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
          if (result.success) {
            setTimeout(() => {
              Taro.navigateBack().catch(() => {});
            }, 800);
          }
        }
      }
    });
  };

  const handleOnline = () => {
    if (!editItem) return;
    const result = onlineItem(editItem.id);
    Taro.showToast({ title: result.message, icon: result.success ? 'success' : 'none' });
    if (result.success) {
      setTimeout(() => {
        Taro.navigateBack().catch(() => {});
      }, 800);
    }
  };

  const handleCategoryClick = (key: string) => {
    setCategory(key as ItemCategory);
  };

  return (
    <View className={styles.page}>
      <View className={styles.formCard}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleIcon}></View>
          <Text>物品照片</Text>
          {isEditMode && editItem && (
            <Text style={{ marginLeft: 'auto', fontSize: 24, color: '#86909C' }}>
              {lentCount > 0 && `${lentCount}件借出中`}
            </Text>
          )}
        </View>
        <View className={styles.uploadGrid}>
          {images.map((img, index) => (
            <View key={index} className={styles.uploadItem}>
              <Image
                className={styles.uploadedImage}
                src={img}
                mode="aspectFill"
              />
              <View
                className={styles.deleteBtn}
                onClick={() => handleDeleteImage(index)}
              >
                <Text>✕</Text>
              </View>
            </View>
          ))}
          {images.length < 6 && (
            <View className={styles.uploadBtn} onClick={handleChooseImage}>
              <Text className={styles.uploadIcon}>+</Text>
              <Text className={styles.uploadText}>添加图片</Text>
            </View>
          )}
        </View>
        <View className={styles.uploadTip}>
          💡 建议上传清晰的多角度照片，最多6张，第一张将作为封面
        </View>
      </View>

      <View className={styles.formCard}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleIcon}></View>
          <Text>基本信息</Text>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.label}>
            <Text className={styles.required}>*</Text>
            <Text>物品名称</Text>
          </View>
          <View className={styles.inputWrap}>
            <Input
              className={styles.textInput}
              placeholder="请输入物品名称，如：家用铝合金梯"
              placeholderClass={styles.textInput}
              value={title}
              onInput={e => setTitle(e.detail.value)}
              maxlength={50}
            />
          </View>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.label}>
            <Text className={styles.required}>*</Text>
            <Text>物品描述</Text>
          </View>
          <View className={styles.textareaWrap}>
            <Textarea
              className={styles.textarea}
              placeholder="详细描述物品的功能、状态、注意事项等，帮助邻居更好地了解~"
              placeholderClass={styles.textarea}
              value={description}
              onInput={e => setDescription(e.detail.value)}
              maxlength={300}
            />
          </View>
          <View className={styles.charCount}>
            <Text>{description.length}/300</Text>
          </View>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.label}>
            <Text className={styles.required}>*</Text>
            <Text>物品分类</Text>
          </View>
          <View className={styles.categoryGrid}>
            {categoryOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.categoryItem, category === opt.key && styles.active)}
                onClick={() => handleCategoryClick(opt.key)}
              >
                <Text className={styles.categoryIcon}>{opt.icon}</Text>
                <Text className={styles.categoryText}>{opt.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formCard}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleIcon}></View>
          <Text>借还设置</Text>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.rowInputs}>
            <View>
              <View className={styles.label}>
                <Text className={styles.required}>*</Text>
                <Text>数量（件）</Text>
                {isEditMode && lentCount > 0 && (
                  <Text style={{ fontSize: 22, color: '#FAAD14', marginLeft: 8 }}>
                    （最少{lentCount}）
                  </Text>
                )}
              </View>
              <View className={styles.inputWrap}>
                <Text className={styles.inputIcon}>📦</Text>
                <Input
                  className={styles.textInput}
                  type="number"
                  value={quantity}
                  onInput={handleQuantityChange}
                />
              </View>
            </View>
            <View>
              <View className={styles.label}>
                <Text className={styles.required}>*</Text>
                <Text>押金（元）</Text>
              </View>
              <View className={styles.inputWrap}>
                <Text className={styles.inputIcon}>💰</Text>
                <Input
                  className={styles.textInput}
                  type="digit"
                  value={deposit}
                  onInput={handleDepositChange}
                  placeholder="1-9999 元，最多 2 位小数"
                  placeholderClass={styles.textInput}
                />
              </View>
            </View>
          </View>
          <View className={styles.depositRow} style={{ marginTop: '24rpx' }}>
            {depositPresets.map(amount => (
              <View
                key={amount}
                className={classnames(styles.depositPreset, deposit === String(amount) && styles.active)}
                onClick={() => {
                  setDeposit(String(amount));
                }}
              >
                <Text>¥{amount}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.label}>
            <Text className={styles.required}>*</Text>
            <Text>可借时段</Text>
          </View>
          <View className={styles.timeTagRow}>
            {timeOptions.map(opt => (
              <View
                key={opt}
                className={classnames(styles.timeTag, availableTime === opt && styles.active)}
                onClick={() => setAvailableTime(opt)}
              >
                <Text>{opt}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.label}>
            <Text className={styles.required}>*</Text>
            <Text>取还地点</Text>
          </View>
          <View className={styles.inputWrap}>
            <Text className={styles.inputIcon}>📍</Text>
            <Input
              className={styles.textInput}
              placeholder="如：3栋1单元602门口鞋柜处"
              placeholderClass={styles.textInput}
              value={pickupLocation}
              onInput={e => setPickupLocation(e.detail.value)}
              maxlength={50}
            />
          </View>
        </View>

        <View className={styles.formGroup}>
          <View className={styles.label}>
            <Text>损耗说明（选填）</Text>
          </View>
          <View className={styles.textareaWrap}>
            <Textarea
              className={styles.textarea}
              placeholder="如果物品有使用痕迹、小瑕疵等，请如实说明，避免纠纷~"
              placeholderClass={styles.textarea}
              value={wearDesc}
              onInput={e => setWearDesc(e.detail.value)}
              maxlength={200}
              style={{ minHeight: '160rpx' }}
            />
          </View>
          <View className={styles.charCount}>
            <Text>{wearDesc.length}/200</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        {isEditMode && editItem && editItem.status !== 'offline' && (
          <Button className={classnames(styles.btn, styles.btnDanger)} onClick={handleOffline}>
            下架
          </Button>
        )}
        {isEditMode && editItem && editItem.status === 'offline' && (
          <Button className={classnames(styles.btn, styles.btnSuccess)} onClick={handleOnline}>
            重新上架
          </Button>
        )}
        <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={handleReset}>
          {isEditMode ? '恢复原值' : '重置'}
        </Button>
        <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleSubmit}>
          {isEditMode ? '保存修改' : '立即发布'}
        </Button>
      </View>
    </View>
  );
};

export default PublishPage;
