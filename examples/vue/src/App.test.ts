import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App.vue";
import { ACCESS_LEVELS, ACCESS_POLICY } from "./domain/access-control";

describe("access console invitation flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("adds a native-form submission to the recent invitation queue", async () => {
    const wrapper = mount(App);

    await wrapper
      .get('#invite input[name="email"]')
      .setValue("operator@studio.dev");
    await wrapper
      .get('#invite select[name="level"]')
      .setValue(ACCESS_LEVELS.VIEWER);
    await wrapper.get("#invite form").trigger("submit");

    expect(wrapper.get(".invitation-ledger__heading strong").text()).toBe("1");
    expect(wrapper.get(".invitation-list").text()).toContain(
      "operator@studio.dev",
    );
    expect(wrapper.get(".invitation-list").text()).toContain("Viewer access");

    wrapper.unmount();
  });

  it("parses the native policy select before updating branded state", async () => {
    const wrapper = mount(App);

    await wrapper
      .get<HTMLSelectElement>(".policy-select select")
      .setValue(ACCESS_POLICY.FALLBACK);

    expect(wrapper.get(".session-card__level strong").text()).toBe("Guest");

    wrapper.unmount();
  });
});
