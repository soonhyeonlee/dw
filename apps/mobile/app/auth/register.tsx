import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getAssociations, getPartners, type RegisterData } from '../../src/api/auth';

type MemberType = 'association' | 'partner' | 'user';

const STEPS = ['유형 선택', '기본 정보', '소속 선택', '완료'];

const MEMBER_TYPES: { type: MemberType; icon: string; title: string; desc: string }[] = [
  { type: 'association', icon: '🏢', title: '협회', desc: '협회 관계자로 가입합니다.\n파트너와 일반회원을 관리할 수 있습니다.' },
  { type: 'partner', icon: '🤝', title: '파트너', desc: '소상공인·학원 관장 등으로 가입합니다.\n소속 협회를 선택하고 일반회원에게 혜택을 제공합니다.' },
  { type: 'user', icon: '👤', title: '일반회원', desc: '일반 사용자로 가입합니다.\n쇼핑 캐시백과 지역 혜택을 받을 수 있습니다.' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: 회원 유형
  const [memberType, setMemberType] = useState<MemberType>('user');

  // Step 2: 기본 정보
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: 협회 전용
  const [associationName, setAssociationName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');

  // Step 2: 파트너 전용
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // Step 3: 소속 선택
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentList, setParentList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  // Step 3에서 목록 로드
  useEffect(() => {
    if (step === 2 && needsParentSelection()) {
      loadParentList();
    }
  }, [step]);

  const needsParentSelection = () => {
    return memberType === 'partner' || memberType === 'user';
  };

  const loadParentList = async () => {
    setLoadingList(true);
    try {
      if (memberType === 'partner') {
        const data = await getAssociations();
        setParentList(data);
      } else if (memberType === 'user') {
        const data = await getPartners();
        setParentList(data);
      }
    } catch {
      setParentList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const filteredList = parentList.filter((item) => {
    const name = memberType === 'partner'
      ? item.associationName || item.nickname
      : item.businessName || item.nickname;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalSteps = needsParentSelection() ? 4 : 3;
  const currentStep = needsParentSelection() ? step : (step >= 2 ? step + 1 : step);

  const validateStep1 = () => true;

  const validateStep2 = () => {
    if (!email || !password || !nickname) {
      Alert.alert('알림', '필수 항목을 모두 입력해주세요');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('알림', '비밀번호는 8자 이상이어야 합니다');
      return false;
    }
    if (memberType === 'association' && !associationName) {
      Alert.alert('알림', '협회명을 입력해주세요');
      return false;
    }
    if (memberType === 'partner' && !businessName) {
      Alert.alert('알림', '상호명을 입력해주세요');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;

    // 협회는 소속 선택 불필요 → 바로 가입
    if (step === 1 && memberType === 'association') {
      handleRegister();
      return;
    }

    // 소속 선택 단계에서 다음 → 가입
    if (step === 2) {
      handleRegister();
      return;
    }

    setStep(step + 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const data: RegisterData = {
        email,
        password,
        nickname,
        phone: phone || undefined,
        memberType,
        parentId: parentId || undefined,
        associationName: associationName || undefined,
        businessNumber: businessNumber || undefined,
        businessName: businessName || undefined,
        businessCategory: businessCategory || undefined,
        businessAddress: businessAddress || undefined,
      };

      await register(data);
      setStep(needsParentSelection() ? 3 : 2);
    } catch (e: any) {
      Alert.alert('가입 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  const getMemberTypeLabel = (type: MemberType) => {
    return MEMBER_TYPES.find((m) => m.type === type)?.title || '';
  };

  // ============ RENDER ============

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.stepLabel}>STEP {step + 1}/{totalSteps}</Text>
    </View>
  );

  const renderStep0 = () => (
    <>
      <Text style={styles.title}>회원 유형을 선택해주세요</Text>
      <Text style={styles.subtitle}>가입 후에도 변경할 수 있습니다</Text>

      <View style={styles.cardList}>
        {MEMBER_TYPES.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[styles.card, memberType === item.type && styles.cardSelected]}
            onPress={() => setMemberType(item.type)}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, memberType === item.type && styles.cardTitleSelected]}>
                {item.title}
              </Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            {memberType === item.type && <Text style={styles.cardCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {memberType === 'association' && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>ℹ️  협회 기능은 추후 변경될 수 있습니다</Text>
        </View>
      )}
    </>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.title}>기본 정보를 입력해주세요</Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>이메일 *</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor={COLORS.gray[400]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>비밀번호 *</Text>
          <TextInput
            style={styles.input}
            placeholder="8자 이상 영문, 숫자, 특수문자 조합"
            placeholderTextColor={COLORS.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>비밀번호 확인 *</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 다시 입력해주세요"
            placeholderTextColor={COLORS.gray[400]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>닉네임 *</Text>
          <TextInput
            style={styles.input}
            placeholder="2~12자 한글, 영문, 숫자"
            placeholderTextColor={COLORS.gray[400]}
            value={nickname}
            onChangeText={setNickname}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>휴대폰 번호</Text>
          <TextInput
            style={styles.input}
            placeholder="010-0000-0000"
            placeholderTextColor={COLORS.gray[400]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {memberType === 'association' && (
          <>
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>협회 정보</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>협회명 *</Text>
              <TextInput
                style={styles.input}
                placeholder="협회 이름을 입력하세요"
                placeholderTextColor={COLORS.gray[400]}
                value={associationName}
                onChangeText={setAssociationName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>사업자등록번호</Text>
              <TextInput
                style={styles.input}
                placeholder="000-00-00000"
                placeholderTextColor={COLORS.gray[400]}
                value={businessNumber}
                onChangeText={setBusinessNumber}
                keyboardType="number-pad"
              />
            </View>
          </>
        )}

        {memberType === 'partner' && (
          <>
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>사업장 정보</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>상호명 *</Text>
              <TextInput
                style={styles.input}
                placeholder="상호명을 입력하세요"
                placeholderTextColor={COLORS.gray[400]}
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>업종</Text>
              <TextInput
                style={styles.input}
                placeholder="학원, 소상공인, 체육 등"
                placeholderTextColor={COLORS.gray[400]}
                value={businessCategory}
                onChangeText={setBusinessCategory}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>사업장 주소</Text>
              <TextInput
                style={styles.input}
                placeholder="주소를 입력하세요"
                placeholderTextColor={COLORS.gray[400]}
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
            </View>
          </>
        )}
      </View>
    </>
  );

  const renderStep2 = () => {
    const isPartner = memberType === 'partner';
    const searchPlaceholder = isPartner ? '협회 이름으로 검색' : '파트너 이름으로 검색';
    const titleText = isPartner ? '소속 협회를 선택해주세요' : '소속 파트너를 선택해주세요';
    const subtitleText = '선택하지 않아도 가입이 가능합니다';

    return (
      <>
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loadingList ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const name = isPartner
                ? item.associationName || item.nickname
                : item.businessName || item.nickname;
              const sub = isPartner
                ? ''
                : item.businessCategory ? `${item.businessCategory}` : '';
              const isSelected = parentId === item.id;

              return (
                <TouchableOpacity
                  style={[styles.listItem, isSelected && styles.listItemSelected]}
                  onPress={() => setParentId(isSelected ? null : item.id)}
                >
                  <View>
                    <Text style={[styles.listItemName, isSelected && styles.listItemNameSelected]}>
                      {name}
                    </Text>
                    {sub ? <Text style={styles.listItemSub}>{sub}</Text> : null}
                  </View>
                  {isSelected && <Text style={styles.listItemCheck}>✓</Text>}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery ? '검색 결과가 없습니다' : '등록된 항목이 없습니다'}
              </Text>
            }
          />
        )}

        <TouchableOpacity onPress={() => { setParentId(null); handleRegister(); }}>
          <Text style={styles.skipText}>소속 없이 가입하기</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <Text style={styles.completeIcon}>🎉</Text>
      <Text style={styles.completeTitle}>가입을 축하합니다!</Text>
      <Text style={styles.completeSubtitle}>
        {getMemberTypeLabel(memberType)} 회원으로 가입되었습니다
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>가입 정보</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>회원유형</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
            {getMemberTypeLabel(memberType)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>이메일</Text>
          <Text style={styles.summaryValue}>{email}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>닉네임</Text>
          <Text style={styles.summaryValue}>{nickname}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.primaryBtnText}>홈으로 이동</Text>
      </TouchableOpacity>
    </View>
  );

  const isComplete = (needsParentSelection() && step === 3) || (!needsParentSelection() && step === 2);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        {!isComplete && (
          <View style={styles.header}>
            {step > 0 && (
              <TouchableOpacity onPress={() => setStep(step - 1)}>
                <Text style={styles.backBtn}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>회원가입</Text>
            <View style={{ width: 28 }} />
          </View>
        )}

        {!isComplete && renderProgressBar()}

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && !isComplete && renderStep2()}
        {isComplete && renderComplete()}

        {/* Next Button */}
        {!isComplete && step !== 2 && (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? '처리 중...' : step === 1 && memberType === 'association' ? '가입하기' : '다음'}
            </Text>
          </TouchableOpacity>
        )}

        {step === 2 && !isComplete && (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? '처리 중...' : parentId ? '선택 완료 · 가입하기' : '건너뛰기'}
            </Text>
          </TouchableOpacity>
        )}

        {!isComplete && (
          <Text style={styles.terms}>
            가입 시 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
            <Text style={styles.termsLink}>개인정보 처리방침</Text>에 동의합니다
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.xl, paddingBottom: SPACING.xxxl },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  backBtn: { fontSize: 24, color: COLORS.gray[900] },
  headerTitle: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.gray[900] },

  // Progress
  progressContainer: { marginBottom: SPACING.xxl },
  progressBg: { height: 4, backgroundColor: COLORS.gray[200], borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  stepLabel: { fontSize: FONT.sizes.xs, fontWeight: '600', color: COLORS.primary, marginTop: SPACING.xs },

  // Titles
  title: { fontSize: FONT.sizes.xxl, fontWeight: '800', color: COLORS.secondary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT.sizes.md, color: COLORS.gray[500], marginBottom: SPACING.xxl },

  // Card list (Step 1)
  cardList: { gap: SPACING.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#FFF5F0',
  },
  cardIcon: { fontSize: 32, marginRight: SPACING.lg },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.gray[900], marginBottom: 4 },
  cardTitleSelected: { color: COLORS.primary },
  cardDesc: { fontSize: FONT.sizes.sm, color: COLORS.gray[500], lineHeight: 18 },
  cardCheck: { fontSize: 20, fontWeight: '700', color: COLORS.primary },

  notice: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
  },
  noticeText: { fontSize: FONT.sizes.sm, color: COLORS.gray[500] },

  // Form (Step 2)
  form: { gap: SPACING.lg },
  field: { gap: SPACING.xs },
  label: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.gray[700] },
  input: {
    height: 52,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT.sizes.md,
    color: COLORS.gray[900],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  sectionDivider: { marginTop: SPACING.md, marginBottom: SPACING.xs },
  sectionTitle: { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.primary },

  // Search & List (Step 3)
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginBottom: SPACING.lg,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT.sizes.md, color: COLORS.gray[900] },
  list: { maxHeight: 360 },
  listItem: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFF5F0',
  },
  listItemName: { fontSize: FONT.sizes.md, color: COLORS.gray[900] },
  listItemNameSelected: { fontWeight: '600', color: COLORS.primary },
  listItemSub: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], marginTop: 2 },
  listItemCheck: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  emptyText: { textAlign: 'center', color: COLORS.gray[400], marginTop: SPACING.xxl, fontSize: FONT.sizes.md },
  skipText: {
    textAlign: 'center',
    color: COLORS.gray[500],
    fontSize: FONT.sizes.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // Complete (Step 4)
  completeContainer: { alignItems: 'center', paddingTop: 60 },
  completeIcon: { fontSize: 64, marginBottom: SPACING.xxl },
  completeTitle: { fontSize: FONT.sizes.xxl + 2, fontWeight: '800', color: COLORS.secondary, marginBottom: SPACING.sm },
  completeSubtitle: { fontSize: FONT.sizes.lg, color: COLORS.gray[500], marginBottom: SPACING.xxxl },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  summaryTitle: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.gray[500], marginBottom: SPACING.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  summaryLabel: { fontSize: FONT.sizes.sm, color: COLORS.gray[500] },
  summaryValue: { fontSize: FONT.sizes.md, fontWeight: '600', color: COLORS.gray[900] },

  // Buttons
  primaryBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.white },

  terms: {
    fontSize: FONT.sizes.xs,
    color: COLORS.gray[400],
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
  },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
});
