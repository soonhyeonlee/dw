---
name: rn-sticky-header-breaks-direct-child-flex
description: React Native ScrollView stickyHeaderIndices 가 직접 자식의 flex layout 무시 — wrapper View 패턴으로 우회
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ce1e35b7-226b-4c47-9ebe-bc85b3a041cd
---

React Native ScrollView 에 `stickyHeaderIndices` 를 쓰면 지정된 인덱스의 **직접 자식 View** 의 일부 style props 가 무시됨. 특히 `flexDirection: 'row'`, `gap`, `height` 등 layout 계열은 적용 안 되지만 `backgroundColor`, `width: '25%'` 같은 일부 props 는 적용. 결과적으로 가로 row 가 세로로 쌓이거나 명시 높이가 무시되는 등 layout 망가짐.

**Why:** 2026-05-29 세션에서 홈 폴더탭 4개(쇼핑/번개장터/우리지역/여행)가 가로 한 줄 대신 세로로 쌓여 디버깅. 디버그 색(`magenta`/`cyan`) + 명시 `height: 60` + `width: 25%` 로 격리해서 어느 props 가 무시되는지 가시화. `stickyHeaderIndices` 빼면 정상 가로 → 다시 넣고 wrapper View 패턴 적용하면 sticky + 가로 양립.

**How to apply:** ScrollView 에 sticky 헤더 두려면 **반드시 wrapper View 로 감싸기**:

```jsx
<ScrollView stickyHeaderIndices={[2]}>
  <Hero />        {/* 0 */}
  <PromoBanner /> {/* 1 */}
  {/* 2 — sticky 자식. 안쪽 View 에 실제 flex layout */}
  <View onLayout={captureY}>
    <View style={styles.tabBar}> {/* flexDirection: row 등 여기에 */}
      {tabs}
    </View>
  </View>
  {content}
</ScrollView>
```

- 바깥 wrapper 는 단순 컨테이너 (style 없거나 backgroundColor 정도만)
- 안쪽 View 에 flexDirection/gap/height/justifyContent 등 모든 layout 명시
- `onLayout` 으로 y 좌표 캡처할 거면 wrapper 에 (sticky 적용 시 직접 자식의 y 가 곧 wrapper 의 y)

관련: [[project-session-2026-05-29]] (이 패턴 첫 적용)
