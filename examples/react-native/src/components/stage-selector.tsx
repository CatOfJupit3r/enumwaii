import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import {
  describeDispatchStage,
  DISPATCH_STAGE_VALUES,
  type DispatchStage,
} from "../domain/dispatch";

export interface StageSelectorProps {
  readonly selected: DispatchStage;
  readonly onSelect: (stage: DispatchStage) => void;
}

export function StageSelector({
  selected,
  onSelect,
}: StageSelectorProps): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
      accessibilityRole="tablist"
    >
      {DISPATCH_STAGE_VALUES.map((stage) => {
        const metadata = describeDispatchStage(stage);
        const active = stage === selected;

        return (
          <Pressable
            key={stage}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter by ${metadata.label}`}
            onPress={() => onSelect(stage)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: active ? metadata.accent : metadata.surface,
                borderColor: metadata.accent,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                { color: active ? "#ffffff" : metadata.accent },
              ]}
            >
              {metadata.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: {
    gap: 10,
    paddingRight: 20,
  },
  option: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});
