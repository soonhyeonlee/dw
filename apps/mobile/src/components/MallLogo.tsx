import React, { useState } from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';
import { COLORS } from '../constants/theme';
import { mallLogoSource, type MallLike } from '../lib/mallLogo';

/**
 * 쇼핑몰 로고 박스. 실제 브랜드 로고(번들/파비콘)를 표시하고,
 * 없거나 로드 실패 시 브랜드 컬러 배경 + 첫 글자로 폴백.
 */
export function MallLogo({
  mall,
  size,
  radius,
  style,
}: {
  mall: MallLike;
  size: number;
  radius: number;
  style?: ViewStyle;
}) {
  const [failed, setFailed] = useState(false);
  const source = mallLogoSource(mall);
  const useImg = !!source && !failed;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: useImg ? COLORS.white : mall.color || COLORS.ink[600],
          borderWidth: useImg ? 1 : 0,
          borderColor: COLORS.ink[100],
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {useImg ? (
        <Image
          source={source}
          style={{ width: size * 0.64, height: size * 0.64 }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text
          style={{
            fontSize: Math.round(size * 0.4),
            fontWeight: '800',
            color: COLORS.white,
            letterSpacing: -0.5,
          }}
        >
          {(mall.name || '?').slice(0, 1)}
        </Text>
      )}
    </View>
  );
}
