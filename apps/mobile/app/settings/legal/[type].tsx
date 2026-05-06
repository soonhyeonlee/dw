import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING } from '../../../src/constants/theme';

type LegalType = 'terms' | 'privacy';

const CONTENT: Record<LegalType, { title: string; updatedAt: string; sections: { h: string; b: string }[] }> = {
  terms: {
    title: '이용약관',
    updatedAt: '2026.04.30 시행',
    sections: [
      { h: '제1조 (목적)',
        b: '본 약관은 더블윈(이하 "회사")이 제공하는 캐시백 및 부가 서비스(이하 "서비스") 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.' },
      { h: '제2조 (용어의 정의)',
        b: '"회원"은 본 약관에 동의하고 회사가 정한 절차에 따라 가입한 자를 의미하며, "캐시백"은 제휴 쇼핑몰에서의 결제 금액 일부를 회원에게 적립해 드리는 보상금을 의미합니다.' },
      { h: '제3조 (서비스 제공)',
        b: '회사는 회원에게 제휴 쇼핑몰 경유 캐시백, 환급 신청, 알림 및 관련 부가 서비스를 제공합니다. 일부 서비스는 회사의 정책 또는 제휴사 사정에 따라 변경·중단될 수 있습니다.' },
      { h: '제4조 (회원의 의무)',
        b: '회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 부정한 방법으로 캐시백을 적립하거나 타인의 정보를 도용해서는 안 됩니다. 본 약관 위반 시 회사는 적립을 취소하거나 회원 자격을 제한할 수 있습니다.' },
      { h: '제5조 (캐시백 적립과 취소)',
        b: '캐시백은 제휴 쇼핑몰의 구매 확정 정보가 회사에 전달된 시점에 적립됩니다. 환불·반품·주문 취소 등이 발생하면 해당 캐시백은 자동으로 회수됩니다.' },
      { h: '제6조 (환급)',
        b: '환급은 회원 본인 명의의 계좌로만 가능하며, 최소 환급 금액은 5,000원입니다. 회사는 휴면, 사고, 부정 적립 등 합리적 사유가 있는 경우 환급을 일시 보류할 수 있습니다.' },
      { h: '제7조 (개인정보 보호)',
        b: '회사는 회원의 개인정보를 별도의 개인정보 처리방침에 따라 보호하며, 개인정보 처리방침은 회사 서비스 내에서 상시 확인할 수 있습니다.' },
      { h: '제8조 (책임 제한)',
        b: '회사는 천재지변, 제휴사 시스템 장애 등 회사가 합리적으로 통제할 수 없는 사유로 인해 발생한 손해에 대해 책임을 지지 않습니다.' },
      { h: '제9조 (약관의 변경)',
        b: '회사는 관련 법령을 준수하는 범위에서 본 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 사유를 명시하여 사전에 공지합니다.' },
    ],
  },
  privacy: {
    title: '개인정보 처리방침',
    updatedAt: '2026.04.30 시행',
    sections: [
      { h: '1. 수집하는 개인정보 항목',
        b: '회원가입·서비스 이용 과정에서 이메일, 닉네임, 비밀번호(암호화 저장), 출금 계좌 정보(은행/계좌번호/예금주), 결제 및 주문 식별 정보, 푸시 토큰, 기기 정보가 수집될 수 있습니다.' },
      { h: '2. 개인정보 수집 및 이용 목적',
        b: '회원 식별 및 인증, 캐시백 적립·환급 이행, 서비스 운영·개선, 부정 이용 방지, 고객 문의 응답, 마케팅 정보 제공(동의한 경우)에 한해 이용됩니다.' },
      { h: '3. 보유 및 이용 기간',
        b: '회원 탈퇴 시 즉시 파기되며, 단 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 분리 보관됩니다(예: 전자상거래법에 따른 거래 기록 5년).' },
      { h: '4. 개인정보의 제3자 제공',
        b: '회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 단, 캐시백 적립을 위해 필요한 최소 식별값은 제휴 쇼핑몰에 안전하게 전달될 수 있습니다.' },
      { h: '5. 개인정보 처리 위탁',
        b: '서비스 운영을 위해 결제 대행사, 클라우드 인프라, 푸시 알림 서비스 등 외부 처리자에게 일부 업무를 위탁하며, 위탁 시 개인정보 보호에 관한 법적 의무를 준수합니다.' },
      { h: '6. 회원의 권리',
        b: '회원은 언제든 자신의 개인정보 열람, 수정, 삭제, 처리 정지를 요구할 수 있으며, 마이 > 내 정보 수정 또는 고객센터를 통해 행사할 수 있습니다.' },
      { h: '7. 개인정보 보호책임자',
        b: '개인정보 처리에 관한 문의·민원은 더블윈 고객센터를 통해 접수해 주시기 바랍니다. 회사는 신속히 답변드리겠습니다.' },
      { h: '8. 처리방침의 변경',
        b: '본 처리방침이 변경되는 경우 시행일과 변경 내용을 사전에 공지합니다.' },
    ],
  },
};

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const key = (type === 'privacy' ? 'privacy' : 'terms') as LegalType;
  const { title, updatedAt, sections } = CONTENT[key];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title, headerBackTitle: '뒤로' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docMeta}>{updatedAt}</Text>
        <View style={styles.divider} />
        {sections.map((s, i) => (
          <View key={s.h} style={[styles.section, i === 0 && { marginTop: 0 }]}>
            <Text style={styles.sectionHead}>{s.h}</Text>
            <Text style={styles.sectionBody}>{s.b}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 32 },
  docTitle: { fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  docMeta: { fontSize: 12, color: COLORS.ink[500], marginTop: 6 },
  divider: { height: 1, backgroundColor: COLORS.ink[100], marginVertical: 18 },
  section: { marginTop: 18 },
  sectionHead: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900], marginBottom: 6, letterSpacing: -0.2 },
  sectionBody: { fontSize: 13, color: COLORS.ink[700], lineHeight: 21 },
});
