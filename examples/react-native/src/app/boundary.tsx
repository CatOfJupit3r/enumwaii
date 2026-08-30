import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  describeDispatchStage,
  inspectStageBoundary,
  type StageBoundaryDecision,
} from "../domain/dispatch";
import { useStagePreference } from "../hooks/use-stage-preference";

function DecisionCard({
  title,
  decision,
}: {
  readonly title: string;
  readonly decision: StageBoundaryDecision;
}): React.JSX.Element {
  const accent = decision.accepted ? "#1f6a52" : "#a83246";
  return (
    <View style={[styles.decision, { borderColor: accent }]}>
      <View style={styles.decisionTopline}>
        <Text style={styles.decisionTitle}>{title}</Text>
        <Text style={[styles.decisionSource, { color: accent }]}>
          {decision.source.toUpperCase()}
        </Text>
      </View>
      {decision.accepted ? (
        <Text style={styles.decisionValue}>
          {describeDispatchStage(decision.stage).label} · {decision.stage}
        </Text>
      ) : null}
      <Text style={styles.decisionCopy}>{decision.explanation}</Text>
    </View>
  );
}

export default function BoundaryScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{
    stage?: string | string[];
  }>();
  const report = inspectStageBoundary(params.stage);
  const preference = useStagePreference();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.page}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>EXPO ROUTER · ASYNCSTORAGE</Text>
        <Text style={styles.heading}>
          Every mobile edge is a data boundary.
        </Text>
        <Text style={styles.copy}>
          Query parameters can be missing, malformed, or repeated. Persisted
          values can outlive an old app version. Neither enters domain state
          without a declared policy.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deep-link query</Text>
        <View style={styles.inputCard}>
          <Text style={styles.inputKind}>
            {report.input.kind.toUpperCase()}
          </Text>
          <Text style={styles.inputValue}>{report.input.display}</Text>
        </View>
        <View style={styles.scenarios}>
          <Link href="/boundary?stage=ON_SITE" asChild>
            <Pressable style={styles.scenario} accessibilityRole="link">
              <Text style={styles.scenarioText}>Valid</Text>
            </Pressable>
          </Link>
          <Link href="/boundary?stage=ARCHIVED" asChild>
            <Pressable style={styles.scenario} accessibilityRole="link">
              <Text style={styles.scenarioText}>Malformed</Text>
            </Pressable>
          </Link>
          <Link href="/boundary" asChild>
            <Pressable style={styles.scenario} accessibilityRole="link">
              <Text style={styles.scenarioText}>Missing</Text>
            </Pressable>
          </Link>
          <Link href="/boundary?stage=DISPATCHED&stage=ON_SITE" asChild>
            <Pressable style={styles.scenario} accessibilityRole="link">
              <Text style={styles.scenarioText}>Repeated</Text>
            </Pressable>
          </Link>
        </View>
        <DecisionCard title="Nil-only default" decision={report.defaultOnly} />
        <DecisionCard title="Explicit recovery" decision={report.recovery} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Persistence hydration</Text>
        <View style={styles.storageCard}>
          <View style={styles.storageTopline}>
            <Text style={styles.storageSource}>
              {preference.loading
                ? "HYDRATING"
                : preference.source.toUpperCase()}
            </Text>
            <Text style={styles.storageValue}>{preference.stage}</Text>
          </View>
          <Text style={styles.storageRaw}>
            AsyncStorage raw value: {preference.raw ?? "null"}
          </Text>
          <Text style={styles.storageNotice}>{preference.notice}</Text>
          {preference.error === null ? null : (
            <Text accessibilityRole="alert" style={styles.storageError}>
              {preference.error}
            </Text>
          )}
        </View>

        <View style={styles.storageActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void preference.writeRaw("RESOLVED")}
            style={styles.storageAction}
          >
            <Text style={styles.storageActionText}>Write valid string</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void preference.writeRaw("ARCHIVED")}
            style={styles.storageAction}
          >
            <Text style={styles.storageActionText}>Corrupt stored value</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void preference.reset()}
            style={styles.storageAction}
          >
            <Text style={styles.storageActionText}>Remove preference</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 30,
    padding: 20,
    paddingBottom: 48,
  },
  hero: {
    gap: 10,
    borderRadius: 24,
    backgroundColor: "#f0e9fa",
    padding: 22,
  },
  eyebrow: {
    color: "#6d4a9e",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heading: {
    color: "#2a2040",
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -0.7,
  },
  copy: {
    color: "#655b74",
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#17362d",
    fontSize: 20,
    fontWeight: "900",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#192c27",
    padding: 14,
  },
  inputKind: {
    color: "#95c7b7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  inputValue: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  scenarios: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scenario: {
    borderWidth: 1,
    borderColor: "#c7d3ce",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  scenarioText: {
    color: "#34534a",
    fontSize: 12,
    fontWeight: "800",
  },
  decision: {
    gap: 6,
    borderLeftWidth: 4,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  decisionTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  decisionTitle: {
    color: "#1e3b32",
    fontSize: 14,
    fontWeight: "800",
  },
  decisionSource: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  decisionValue: {
    color: "#344c45",
    fontSize: 13,
    fontWeight: "700",
  },
  decisionCopy: {
    color: "#6a7874",
    fontSize: 12,
    lineHeight: 18,
  },
  storageCard: {
    gap: 7,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 17,
  },
  storageTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  storageSource: {
    color: "#6f4da0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  storageValue: {
    color: "#233e36",
    fontSize: 13,
    fontWeight: "900",
  },
  storageRaw: {
    color: "#364c45",
    fontSize: 12,
    fontWeight: "700",
  },
  storageNotice: {
    color: "#6b7975",
    fontSize: 12,
    lineHeight: 18,
  },
  storageError: {
    color: "#a12f42",
    fontSize: 12,
    fontWeight: "700",
  },
  storageActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  storageAction: {
    borderRadius: 12,
    backgroundColor: "#e2eae7",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  storageActionText: {
    color: "#2b4b42",
    fontSize: 12,
    fontWeight: "800",
  },
});
