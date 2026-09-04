import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App.vue";
import { ACCESS_LEVELS } from "./domain/access-control";

describe("Crewboard members settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("opens with six teammates and a live Viewer permission preview", () => {
    const wrapper = mount(App);

    expect(wrapper.findAll(".member-row")).toHaveLength(6);
    expect(wrapper.get(".permission-matrix h2").text()).toBe("Viewer");
    expect(wrapper.findAll('.matrix-row[data-granted="true"]')).toHaveLength(1);

    wrapper.unmount();
  });

  it("updates a member through a parsed role event and previews permissions", async () => {
    const wrapper = mount(App);
    const role = wrapper.findAll<HTMLSelectElement>(".member-role-select")[3]!;

    await role.setValue(ACCESS_LEVELS.EDITOR);

    expect(role.element.value).toBe(ACCESS_LEVELS.EDITOR);
    expect(wrapper.get(".permission-matrix h2").text()).toBe("Editor");
    expect(wrapper.findAll('.matrix-row[data-granted="true"]')).toHaveLength(3);

    wrapper.unmount();
  });

  it("adds a native-form submission to the invitation queue", async () => {
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

  it("explains an unknown viewing role from the URL", () => {
    window.history.replaceState({}, "", "/?as=SUPERADMIN");
    const wrapper = mount(App);

    expect(wrapper.get(".boundary-notice").text()).toContain(
      "showing as Viewer",
    );

    wrapper.unmount();
  });
});
