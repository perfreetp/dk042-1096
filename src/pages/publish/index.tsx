import React, { useState } from 'react';
import { View, Text, Input, Textarea, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ItemCategory } from '@/types';
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

const depositPresets = [0, 20, 50, 100, 200];

const PublishPage: React.FC = () => {
  const addItem = useAppStore(state => state.addItem);

  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('tools');
  const [quantity, setQuantity] = useState('1');
  const [deposit, setDeposit] = useState('50');
  const [availableTime, setAvailableTime] = useState('周末全天');
  const [pickupLocation, setPickupLocation] = useState('');
  const [wearDesc, setWearDesc] = useState('');

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

  const handleSubmit = () => {
    console.log('[Publish] Submit form:', {
      images, title, description, category, quantity,
      deposit, availableTime, pickupLocation, wearDesc
    });

    if (!title.trim()) {
      Taro.showToast({ title: '请输入物品名称', icon: 'none' });
      return;
    }
    if (images.length === 0) {
      Taro.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }
    if (!pickupLocation.trim()) {
      Taro.showToast({ title: '请填写取还地点', icon: 'none' });
      return;
    }

    const quantityClean = (quantity || '').trim();
    if (!quantityClean) {
      Taro.showToast({ title: '请填写数量', icon: 'none' });
      return;
    }
    const quantityNum = parseInt(quantityClean, 10);
    if (!quantityNum || quantityNum <= 0 || isNaN(quantityNum)) {
      Taro.showToast({ title: '数量必须大于0', icon: 'none' });
      return;
    }
    if (quantityNum > 99) {
      Taro.showToast({ title: '数量不能超过99件', icon: 'none' });
      return;
    }

    const depositClean = (deposit || '').trim();
    let depositNum = 0;
    if (depositClean) {
      depositNum = parseFloat(depositClean);
      if (isNaN(depositNum) || depositNum < 0) {
        Taro.showToast({ title: '押金不能为负数', icon: 'none' });
        return;
      }
      if (depositNum > 9999) {
        Taro.showToast({ title: '押金不能超过9999元', icon: 'none' });
        return;
      }
    }

    const finalQuantity = Math.floor(quantityNum);
    const finalDeposit = Math.round(depositNum * 100) / 100;

    console.log('[Publish] Validated:', { finalQuantity, finalDeposit });

    Taro.showLoading({ title: '发布中...', mask: true });

    try {
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
        success: () => {
          Taro.switchTab({ url: '/pages/home/index' }).catch(() => {});
        }
      });
    } catch (err) {
      console.error('[Publish] Error:', err);
      Taro.hideLoading();
      Taro.showToast({ title: '发布失败，请重试', icon: 'none' });
    }
  };

  const handleCategoryClick = (key: string) => {
    setCategory(key as ItemCategory);
  };

  const handlePresetDeposit = (amount: number) => {
    setDeposit(amount.toString());
  };

  return (
    <View className={styles.page}>
      <View className={styles.formCard}>
        <View className={styles.sectionTitle}>
          <View className={styles.titleIcon}></View>
          <Text>物品照片</Text>
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
                <Text>{amount === 0 ? '免押' : `¥${amount}`}</Text>
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
        <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={handleReset}>
          重置
        </Button>
        <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleSubmit}>
          立即发布
        </Button>
      </View>
    </View>
  );
};

export default PublishPage;
