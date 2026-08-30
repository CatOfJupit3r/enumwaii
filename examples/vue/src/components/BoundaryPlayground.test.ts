import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { ACCESS_LEVELS } from "../domain/access-control";
import BoundaryPlayground from "./BoundaryPlayground.vue";

describe("BoundaryPlayground", () => {
  it("shows the four persistence fixtures and their policy outcomes", async () => {
    const wrapper = mount(BoundaryPlayground, {
      props: { activeLevel: ACCESS_LEVELS.VIEWER },
    });

    expect(wrapper.text()).toContain("Valid member");
    expect(wrapper.text()).toContain("Nil-only default");
    expect(wrapper.text()).toContain("Invalid-input fallback");

    const wrongShape = wrapper
      .findAll(".fixture-button")
      .find((button) => button.text().includes("Wrong shape"));
    expect(wrongShape).toBeDefined();
    await wrongShape?.trigger("click");

    expect(wrapper.text()).toContain('{ level: "EDITOR" }');
    expect(
      wrapper.find(".policy-card--active .result-pill--accepted").exists(),
    ).toBe(false);
  });

  it("emits only an accepted branded result when applying a fixture", async () => {
    const wrapper = mount(BoundaryPlayground, {
      props: { activeLevel: ACCESS_LEVELS.VIEWER },
    });

    await wrapper.get(".button--primary").trigger("click");

    expect(wrapper.emitted("apply")?.[0]).toEqual([ACCESS_LEVELS.EDITOR]);
  });
});
