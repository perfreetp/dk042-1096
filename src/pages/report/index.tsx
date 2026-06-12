import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, ScrollView, Textarea, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { reportReasons } from '@/data/user';
import { itemsData } from '@/data/items';

const MAX_DESC = 500;
const MAX_EVIDENCE = 6;

const ReportPage: React.FC = () => {
  const routerParams = Taro.useRouter().params;
  const targetItemId = routerParams.itemId || '1';
  const targetType = routerParams.type || 'item';

  const targetItem = useMemo(() => {
    return itemsData.find(i => i.id === targetItemId) || itemsData[0];
  }, [targetItemId]);

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [contact, setContact] = useState<string>('138****8888');
  const [submitting, setSubmitting] = useState(false);

  const descCount = description.length;
  const descCountClass = classnames(
    styles.wordCount,
    descCount >= MAX_DESC * 0.8 && descCount < MAX_DESC && styles.nearLimit,
    descCount >= MAX_DESC && styles.overLimit
  );

  const isFormValid = selectedReason && description.trim().length >= 10;

  const handleAddEvidence = () => {
    if (evidenceImages.length >= MAX_EVIDENCE) {
      Taro.showToast({ title: `最多上传${MAX_EVIDENCE}张图片`, icon: 'none' });
      return;
    }
    console.log('[Report] Adding evidence image');
    Taro.chooseImage({
      count: MAX_EVIDENCE - evidenceImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('[Report] ChooseImage success:', res.tempFilePaths.length, 'images');
        const newImages = res.tempFilePaths.slice(0, MAX_EVIDENCE - evidenceImages.length);
        setEvidenceImages(prev => [...prev, ...newImages]);
      },
      fail: (err) => {
        console.error('[Report] ChooseImage failed:', err);
        const mockImgs = [
          'https://picsum.photos/id/101/300/300',
          'https://picsum.photos/id/102/300/300',
          'https://picsum.photos/id/103/300/300'
        ];
        const remaining = MAX_EVIDENCE - evidenceImages.length;
        const toAdd = mockImgs.slice(0, Math.min(2, remaining));
        setEvidenceImages(prev => [...prev, ...toAdd]);
        Taro.showToast({ title: `已添加${toAdd.length}张图片`, icon: 'success' });
      }
    });
  };

  const handleRemoveEvidence = (index: number) => {
    console.log('[Report] Removing evidence at index:', index);
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDescInput = (e: any) => {
    const value = e.detail.value || '';
    if (value.length <= MAX_DESC) {
      setDescription(value);
    } else {
      setDescription(value.slice(0, MAX_DESC));
      Taro.showToast({ title: '最多输入500字', icon: 'none' });
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (!selectedReason) {
        Taro.showToast({ title: '请选择举报原因', icon: 'none' });
        return;
      }
      if (description.trim().length < 10) {
        Taro.showToast({ title: '请至少输入10个字符描述', icon: 'none' });
        return;
      }
      return;
    }

    try {
      setSubmitting(true);
      console.log('[Report] Submitting report:', {
        targetType,
        targetItemId: targetItem.id,
        reasonId: selectedReason,
        reasonText: reportReasons.find(r => r.id === selectedReason)?.text,
        evidenceCount: evidenceImages.length,
        descLength: description.length,
        contact
      });

      await new Promise(resolve => setTimeout(resolve, 1200));

      Taro.showModal({
        title: '举报提交成功',
        content: '我们已收到您的举报，管理员将在24小时内进行核实处理，处理结果会通过站内消息通知您。',
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#52C41A',
        success: () => {
          setTimeout(() => {
            Taro.navigateBack().catch(() => {
              Taro.switchTab({ url: '/pages/mine/index' });
            });
          }, 300);
        }
      });
    } catch (err) {
      console.error('[Report] Submit error:', err);
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY style={{ flex: 1 }}>
        <View className={styles.targetCard}>
          <Image
            className={styles.targetImage}
            src={targetItem.images[0]}
            mode="aspectFill"
            onError={(e) => console.error('[Report] Target image error:', e)}
          />
          <View className={styles.targetInfo}>
            <Text className={styles.targetTitle}>{targetItem.title}</Text>
            <View className={styles.targetSub}>
              <Text>被举报人：</Text>
              <Text>{targetItem.ownerName}</Text>
              <Text>{targetItem.ownerBuilding}</Text>
            </View>
            <View className={styles.targetSub}>
              <Text>举报类型：</Text>
              <Text className={styles.targetTag}>
                {targetType === 'item' ? '物品违规' : targetType === 'user' ? '用户违规' : '交易纠纷'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon} />
            <Text className={styles.sectionTitle}>举报原因</Text>
            <Text className={styles.sectionRequired}>*</Text>
          </View>
          <View className={styles.reasonTags}>
            {reportReasons.map(reason => (
              <View
                key={reason.id}
                className={classnames(styles.reasonTag, selectedReason === reason.id && styles.active)}
                onClick={() => setSelectedReason(reason.id)}
              >
                <Text>{reason.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon} />
            <Text className={styles.sectionTitle}>上传证据</Text>
          </View>
          <View className={styles.evidenceGrid}>
            {evidenceImages.map((img, idx) => (
              <View key={idx} className={styles.evidenceItem}>
                <Image
                  className={styles.evidenceImg}
                  src={img}
                  mode="aspectFill"
                  onError={(e) => console.error('[Report] Evidence image error:', e)}
                />
                <View className={styles.evidenceDelete} onClick={() => handleRemoveEvidence(idx)}>
                  <Text>×</Text>
                </View>
              </View>
            ))}
            {evidenceImages.length < MAX_EVIDENCE && (
              <View className={styles.evidenceUpload} onClick={handleAddEvidence}>
                <Text className={styles.uploadIcon}>📷</Text>
                <Text className={styles.uploadText}>添加图片</Text>
              </View>
            )}
          </View>
          <Text className={styles.uploadCount}>
            已上传 {evidenceImages.length}/{MAX_EVIDENCE} 张
          </Text>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon} />
            <Text className={styles.sectionTitle}>详细描述</Text>
            <Text className={styles.sectionRequired}>*</Text>
          </View>
          <View className={styles.descWrap}>
            <Textarea
              className={styles.descTextarea}
              placeholder="请详细描述违规情况，包括时间、地点、经过等信息（至少10个字符）..."
              placeholderStyle="color: #86909C"
              value={description}
              onInput={handleDescInput}
              maxlength={MAX_DESC}
              autoHeight={false}
            />
            <Text className={descCountClass}>{descCount}/{MAX_DESC}</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon} />
            <Text className={styles.sectionTitle}>联系方式</Text>
          </View>
          <View className={styles.contactWrap}>
            <Text className={styles.contactIcon}>📱</Text>
            <Input
              className={styles.contactInput}
              placeholder="请输入手机号或微信号，方便管理员联系"
              placeholderStyle="color: #86909C"
              value={contact}
              onInput={(e) => setContact(e.detail.value)}
              type="text"
            />
          </View>
        </View>

        <View className={styles.tips}>
          <View className={styles.tipsTitle}>
            <Text>⚠️</Text>
            <Text>温馨提示</Text>
          </View>
          <Text>1. 请确保举报内容真实有效，恶意举报将扣除信用分</Text>
          <Text>{'\n'}2. 管理员将在24小时内核实处理，请耐心等待</Text>
          <Text>{'\n'}3. 如有紧急情况，请联系物业：400-888-8888</Text>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.submitBtn, !isFormValid && styles.disabled)}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交举报'}
        </Button>
      </View>
    </View>
  );
};

export default ReportPage;
