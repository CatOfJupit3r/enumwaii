import { StyleSheet, Text, View } from "react-native";

import {
  describeDispatchStage,
  describeReportPriority,
  nextDispatchStages,
  type DispatchIncident,
} from "../domain/dispatch";

export interface IncidentCardProps {
  readonly incident: DispatchIncident;
}

export function IncidentCard({
  incident,
}: IncidentCardProps): React.JSX.Element {
  const stage = describeDispatchStage(incident.stage);
  const priority = describeReportPriority(incident.priority);
  const next = nextDispatchStages(incident.stage);

  return (
    <View style={styles.card} accessibilityLabel={`${incident.id} incident`}>
      <View style={styles.topline}>
        <Text style={styles.id}>{incident.id}</Text>
        <View style={[styles.priority, { borderColor: priority.accent }]}>
          <Text style={[styles.priorityText, { color: priority.accent }]}>
            {priority.label}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{incident.title}</Text>
      <Text style={styles.location}>{incident.location}</Text>

      <View style={styles.details}>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Operator</Text>
          <Text style={styles.detailValue}>{incident.operator}</Text>
        </View>
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Response</Text>
          <Text style={styles.detailValue}>{incident.responseWindow}</Text>
        </View>
      </View>

      <View style={[styles.stage, { backgroundColor: stage.surface }]}>
        <View style={[styles.dot, { backgroundColor: stage.accent }]} />
        <View style={styles.stageCopy}>
          <Text style={[styles.stageLabel, { color: stage.accent }]}>
            {stage.label}
          </Text>
          <Text style={styles.stageNext}>
            {next.length === 0
              ? "Terminal workflow stage"
              : `Next: ${next
                  .map((candidate) => describeDispatchStage(candidate).label)
                  .join(", ")}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: "#dfe5e2",
    borderRadius: 22,
    backgroundColor: "#ffffff",
    padding: 18,
    shadowColor: "#17362d",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  topline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  id: {
    color: "#65726e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  priority: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#102821",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 25,
  },
  location: {
    color: "#5b6a65",
    fontSize: 14,
    lineHeight: 20,
  },
  details: {
    flexDirection: "row",
    gap: 16,
  },
  detailColumn: {
    flex: 1,
    gap: 3,
  },
  detailLabel: {
    color: "#7b8884",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#263d36",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  stage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  stageCopy: {
    flex: 1,
    gap: 2,
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  stageNext: {
    color: "#55635f",
    fontSize: 12,
  },
});
