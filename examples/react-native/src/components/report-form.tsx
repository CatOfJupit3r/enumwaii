import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  describeReportPriority,
  REPORT_PRIORITY_VALUES,
  validateFieldReport,
  type NewFieldReport,
} from "../domain/dispatch";

export interface ReportFormProps {
  readonly onSubmit: (report: NewFieldReport) => void;
}

export function ReportForm({ onSubmit }: ReportFormProps): React.JSX.Element {
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [priorityInput, setPriorityInput] = useState("IMPORTANT");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function submit(): void {
    const result = validateFieldReport({
      summary,
      notes,
      priority: priorityInput,
    });

    if (!result.success) {
      setConfirmation(null);
      setError(result.message);
      return;
    }

    onSubmit(result.report);
    setError(null);
    setConfirmation(
      `${describeReportPriority(result.report.priority).label} report accepted.`,
    );
    setSummary("");
    setNotes("");
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>Summary</Text>
        <TextInput
          accessibilityLabel="Report summary"
          value={summary}
          onChangeText={setSummary}
          placeholder="What needs attention?"
          placeholderTextColor="#8c9894"
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Wire-format priority</Text>
        <Text style={styles.hint}>
          This text is external input until enumwaii validates it on submit.
        </Text>
        <TextInput
          accessibilityLabel="Report priority"
          value={priorityInput}
          onChangeText={setPriorityInput}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <View style={styles.suggestions}>
          {REPORT_PRIORITY_VALUES.map((priority) => {
            const metadata = describeReportPriority(priority);
            return (
              <Pressable
                key={priority}
                accessibilityRole="button"
                accessibilityLabel={`Use ${metadata.label} priority`}
                onPress={() => setPriorityInput(priority)}
                style={({ pressed }) => [
                  styles.suggestion,
                  { borderColor: metadata.accent, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text
                  style={[styles.suggestionText, { color: metadata.accent }]}
                >
                  {metadata.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Field notes</Text>
        <TextInput
          accessibilityLabel="Field notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional context for dispatch"
          placeholderTextColor="#8c9894"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[styles.input, styles.notes]}
        />
      </View>

      {error === null ? null : (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      {confirmation === null ? null : (
        <Text accessibilityRole="alert" style={styles.confirmation}>
          {confirmation}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={submit}
        style={({ pressed }) => [
          styles.submit,
          { opacity: pressed ? 0.78 : 1 },
        ]}
      >
        <Text style={styles.submitText}>Validate and queue report</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
    borderWidth: 1,
    borderColor: "#dce4e0",
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#18332b",
    fontSize: 14,
    fontWeight: "800",
  },
  hint: {
    color: "#697773",
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#cbd7d2",
    borderRadius: 14,
    backgroundColor: "#f8fbf9",
    color: "#102821",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notes: {
    minHeight: 108,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestion: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "800",
  },
  error: {
    borderRadius: 12,
    backgroundColor: "#fee9ec",
    color: "#9e293b",
    fontSize: 13,
    fontWeight: "700",
    padding: 12,
  },
  confirmation: {
    borderRadius: 12,
    backgroundColor: "#dff5eb",
    color: "#176047",
    fontSize: 13,
    fontWeight: "700",
    padding: 12,
  },
  submit: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#173f34",
    paddingHorizontal: 18,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
