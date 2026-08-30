import { fireEvent, render } from "@testing-library/react-native";

import { ReportForm } from "../src/components/report-form";
import { StageSelector } from "../src/components/stage-selector";
import { DISPATCH_STAGE, REPORT_PRIORITY } from "../src/domain/dispatch";

describe("React Native interactions", () => {
  test("a native stage control emits an owned enumwaii member", async () => {
    const onSelect = jest.fn();
    const view = await render(
      <StageSelector
        selected={DISPATCH_STAGE.UNASSIGNED}
        onSelect={onSelect}
      />,
    );

    await fireEvent.press(view.getByLabelText("Filter by On site"));

    expect(onSelect).toHaveBeenCalledWith(DISPATCH_STAGE.ON_SITE);
  });

  test("the form rejects raw priority text before accepting a known member", async () => {
    const onSubmit = jest.fn();
    const view = await render(<ReportForm onSubmit={onSubmit} />);

    await fireEvent.changeText(
      view.getByLabelText("Report summary"),
      "Inspect valve",
    );
    await fireEvent.changeText(
      view.getByLabelText("Report priority"),
      "SOMEDAY",
    );
    await fireEvent.press(view.getByText("Validate and queue report"));

    expect(view.getByRole("alert")).toHaveTextContent(
      "Priority must be ROUTINE, IMPORTANT, or URGENT.",
    );
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(
      view.getByLabelText("Report priority"),
      "URGENT",
    );
    await fireEvent.changeText(
      view.getByLabelText("Field notes"),
      "Bring a gauge",
    );
    await fireEvent.press(view.getByText("Validate and queue report"));

    expect(onSubmit).toHaveBeenCalledWith({
      summary: "Inspect valve",
      notes: "Bring a gauge",
      priority: REPORT_PRIORITY.URGENT,
    });
  });
});
