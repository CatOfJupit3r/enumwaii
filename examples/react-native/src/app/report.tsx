import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ReportForm } from "../components/report-form";
import {
  describeReportPriority,
  type NewFieldReport,
} from "../domain/dispatch";

export default function ReportScreen(): React.JSX.Element {
  const [reports, setReports] = useState<readonly NewFieldReport[]>([]);

  function addReport(report: NewFieldReport): void {
    setReports((current) => [report, ...current].slice(0, 3));
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.page}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>NATIVE FORM BOUNDARY</Text>
        <Text style={styles.heading}>
          Report raw input. Store owned values.
        </Text>
        <Text style={styles.copy}>
          React Native TextInput always produces strings. The priority remains a
          draft until strict parsing succeeds.
        </Text>
      </View>

      <ReportForm onSubmit={addReport} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accepted this session</Text>
        {reports.length === 0 ? (
          <Text style={styles.empty}>
            Valid reports will appear here with their branded priority.
          </Text>
        ) : (
          reports.map((report, index) => {
            const priority = describeReportPriority(report.priority);
            return (
              <View
                key={`${report.summary}-${index}`}
                style={styles.reportCard}
              >
                <View style={styles.reportTopline}>
                  <Text style={styles.reportSummary}>{report.summary}</Text>
                  <Text style={[styles.priority, { color: priority.accent }]}>
                    {priority.label}
                  </Text>
                </View>
                <Text style={styles.reportNotes}>
                  {report.notes || "No additional notes"}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <Link href="/boundary?stage=ARCHIVED" asChild>
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [
            styles.link,
            { opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Text style={styles.linkText}>Try a malformed deep link →</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 24,
    padding: 20,
    paddingBottom: 48,
  },
  hero: {
    gap: 10,
    paddingVertical: 8,
  },
  eyebrow: {
    color: "#b25031",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heading: {
    maxWidth: 580,
    color: "#143129",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
    letterSpacing: -0.8,
  },
  copy: {
    maxWidth: 600,
    color: "#65736f",
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#18362d",
    fontSize: 19,
    fontWeight: "900",
  },
  empty: {
    borderWidth: 1,
    borderColor: "#d5dfdb",
    borderStyle: "dashed",
    borderRadius: 16,
    color: "#697773",
    fontSize: 13,
    lineHeight: 19,
    padding: 18,
  },
  reportCard: {
    gap: 7,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  reportTopline: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  reportSummary: {
    flex: 1,
    color: "#17362d",
    fontSize: 15,
    fontWeight: "800",
  },
  priority: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  reportNotes: {
    color: "#697773",
    fontSize: 13,
    lineHeight: 19,
  },
  link: {
    alignSelf: "flex-start",
    borderRadius: 12,
    backgroundColor: "#e2ebe7",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  linkText: {
    color: "#24483e",
    fontSize: 13,
    fontWeight: "800",
  },
});
