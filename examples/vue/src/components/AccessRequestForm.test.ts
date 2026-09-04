import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { ACCESS_LEVELS } from "../domain/access-control";
import AccessRequestForm from "./AccessRequestForm.vue";

describe("AccessRequestForm", () => {
  it("omits Owner from the invitation-safe role options", () => {
    const wrapper = mount(AccessRequestForm);
    const values = wrapper
      .findAll("select option")
      .map((option) => option.attributes("value"));

    expect(values).toContain(ACCESS_LEVELS.EDITOR);
    expect(values).not.toContain(ACCESS_LEVELS.OWNER);
  });

  it("keeps invalid native draft values outside the emitted domain event", async () => {
    const wrapper = mount(AccessRequestForm);

    await wrapper.get('input[name="email"]').setValue("not-an-email");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.text()).toContain("Enter a valid email address.");
    expect(wrapper.text()).toContain("Choose one of the owned access levels.");
    expect(wrapper.emitted("created")).toBeUndefined();
  });

  it("emits a trimmed invitation with a parsed branded level and resets", async () => {
    const wrapper = mount(AccessRequestForm);

    await wrapper.get('input[name="email"]').setValue("  alex@studio.dev  ");
    await wrapper.get('select[name="level"]').setValue(ACCESS_LEVELS.EDITOR);
    await wrapper
      .get('textarea[name="note"]')
      .setValue("  Needs access for launch review.  ");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("created")?.[0]).toEqual([
      {
        email: "alex@studio.dev",
        level: ACCESS_LEVELS.EDITOR,
        note: "Needs access for launch review.",
      },
    ]);
    expect(wrapper.text()).toContain("ready for Editor access");
    expect(
      wrapper.get<HTMLInputElement>('input[name="email"]').element.value,
    ).toBe("");
    expect(
      wrapper.get<HTMLSelectElement>('select[name="level"]').element.value,
    ).toBe("");
  });
});

it("rejects an Owner role injected into the invitation form", async () => {
  const wrapper = mount(AccessRequestForm);
  await wrapper.get('input[name="email"]').setValue("alex@studio.dev");
  const select = wrapper.get<HTMLSelectElement>('select[name="level"]');
  const injected = document.createElement("option");
  injected.value = ACCESS_LEVELS.OWNER;
  select.element.append(injected);
  await select.setValue(ACCESS_LEVELS.OWNER);
  await wrapper.get("form").trigger("submit");
  expect(wrapper.emitted("created")).toBeUndefined();
  expect(wrapper.text()).toContain("Choose one of the owned access levels.");
});
