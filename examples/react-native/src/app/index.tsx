import { Link } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { IncidentCard } from "../components/incident-card";
import { StageSelector } from "../components/stage-selector";
import {
  describeDispatchStage,
  incidentsAtStage,
  type DispatchStage,
} from "../domain/dispatch";
import { useStagePreference } from "../hooks/use-stage-preference";

export default function FieldDeskScreen(): React.JSX.Element {
  const preference = useStagePreference();
  const stage = describeDispatchStage(preference.stage);
  const incidents = incidentsAtStage(preference.stage);

  function selectStage(next: DispatchStage): void {
    void preference.select(next);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.page}
    >
      <View style={styles.hero}>
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>EXPO · {Platform.OS.toUpperCase()}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LOCAL FIRST</Text>
          </View>
        </View>
        <Text style={styles.heading}>
          The field queue, without string drift.
        </Text>
        <Text style={styles.intro}>
          Native controls emit owned members. Deep links, forms, and persisted
          strings stay unknown until enumwaii validates them.
        </Text>
      </View>

      <View style={styles.navigationRow}>
        <Link href="/report" asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.primaryAction,
              { opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Text style={styles.primaryActionText}>Create field report</Text>
          </Pressable>
        </Link>
        <Link href="/boundary?stage=ON_SITE" asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.secondaryAction,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={styles.secondaryActionText}>Open boundary lab</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.eyebrow}>PERSISTED FILTER</Text>
            <Text style={styles.sectionTitle}>Dispatch stage</Text>
          </View>
          <Text style={styles.count}>{incidents.length}</Text>
        </View>

        <StageSelector selected={preference.stage} onSelect={selectStage} />

        <View style={[styles.persistenceCard, { borderColor: stage.accent }]}>
          <View style={styles.persistenceTopline}>
            <Text style={[styles.persistenceSource, { color: stage.accent }]}>
              {preference.loading
                ? "HYDRATING"
                : preference.source.toUpperCase()}
            </Text>
            <Text style={styles.persistenceValue}>{preference.stage}</Text>
          </View>
          <Text style={styles.persistenceNotice}>{preference.notice}</Text>
          {preference.error === null ? null : (
            <Text accessibilityRole="alert" style={styles.error}>
              {preference.error}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.eyebrow}>{stage.eyebrow.toUpperCase()}</Text>
            <Text style={styles.sectionTitle}>{stage.label} incidents</Text>
          </View>
        </View>
        <Text style={styles.sectionDescription}>{stage.description}</Text>

        {incidents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing in this stage</Text>
            <Text style={styles.emptyCopy}>
              Choose another filter. The selected member remains persisted for
              the next native launch.
            </Text>
          </View>
        ) : (
          incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    gap: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 48,
  },
  hero: {
    gap: 14,
    borderRadius: 28,
    backgroundColor: "#173f34",
    padding: 24,
    overflow: "hidden",
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  kicker: {
    color: "#a8d9c8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#79e0b9",
  },
  liveText: {
    color: "#d8f3e8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  heading: {
    maxWidth: 520,
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 39,
    letterSpacing: -1,
  },
  intro: {
    maxWidth: 560,
    color: "#c2d8d0",
    fontSize: 15,
    lineHeight: 22,
  },
  navigationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryAction: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#d95e36",
    paddingHorizontal: 18,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryAction: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#b9c9c3",
    borderRadius: 15,
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
  },
  secondaryActionText: {
    color: "#24483e",
    fontSize: 14,
    fontWeight: "800",
  },
  section: {
    gap: 14,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: "#6f7f79",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: "#142f27",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  sectionDescription: {
    color: "#61706b",
    fontSize: 14,
    lineHeight: 20,
  },
  count: {
    minWidth: 36,
    borderRadius: 999,
    backgroundColor: "#e0e9e5",
    color: "#294b41",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  persistenceCard: {
    gap: 8,
    borderLeftWidth: 4,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  persistenceTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  persistenceSource: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  persistenceValue: {
    color: "#314841",
    fontSize: 12,
    fontWeight: "800",
  },
  persistenceNotice: {
    color: "#63716d",
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: "#a12f42",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    gap: 6,
    borderWidth: 1,
    borderColor: "#d9e2de",
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 22,
  },
  emptyTitle: {
    color: "#213c34",
    fontSize: 16,
    fontWeight: "800",
  },
  emptyCopy: {
    color: "#697773",
    fontSize: 13,
    lineHeight: 19,
  },
});
