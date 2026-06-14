import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import library from "../src/renderer";

const warnings: string[] = [];
const originalWarn = console.warn;

beforeEach(() => {
  warnings.length = 0;
  console.warn = (...args: any[]) => { warnings.push(args.join(" ")); };
});

afterEach(() => {
  console.warn = originalWarn;
});

function renderComponent(name: string, props: any): string {
  const comp = (library.components as any)[name];
  if (!comp) throw new Error(`Component "${name}" not found`);
  const renderNode = (node: any) => {
    if (!node || !node.type) return null;
    const childComp = (library.components as any)[node.type];
    if (childComp) {
      return React.createElement(childComp.component, { props: node.props, renderNode });
    }
    return null;
  };
  return renderToString(React.createElement(comp.component, { props, renderNode }));
}

describe("Library Metadata", () => {
  it("exports 41 components", () => {
    expect(Object.keys(library.components).length).toBe(41);
  });

  it("all component names match keys", () => {
    const keys = Object.keys(library.components);
    for (const key of keys) {
      expect((library.components as any)[key].name).toBe(key);
    }
  });

  it("has 4 component groups", () => {
    expect(library.componentGroups.length).toBe(4);
  });

  it("root component is Stack", () => {
    expect(library.root).toBe("Stack");
  });
});

describe("Kumo Imports - Compound Sub-Properties", () => {
  it("Radio.Item exists", async () => {
    const { Radio } = await import("@cloudflare/kumo");
    expect(Radio.Item).toBeDefined();
  });

  it("Breadcrumbs.Link exists", async () => {
    const { Breadcrumbs } = await import("@cloudflare/kumo");
    expect(Breadcrumbs.Link).toBeDefined();
    expect(Breadcrumbs.Current).toBeDefined();
    expect(Breadcrumbs.Separator).toBeDefined();
  });

  it("Collapsible.Root exists", async () => {
    const { Collapsible } = await import("@cloudflare/kumo");
    expect(Collapsible.Root).toBeDefined();
    expect(Collapsible.DefaultTrigger).toBeDefined();
    expect(Collapsible.DefaultPanel).toBeDefined();
  });

  it("DropdownMenu.Trigger exists", async () => {
    const { DropdownMenu } = await import("@cloudflare/kumo");
    expect(DropdownMenu.Trigger).toBeDefined();
    expect(DropdownMenu.Content).toBeDefined();
    expect(DropdownMenu.Item).toBeDefined();
  });

  it("Dialog.Root exists", async () => {
    const { Dialog } = await import("@cloudflare/kumo");
    expect(Dialog.Root).toBeDefined();
    expect(Dialog.Title).toBeDefined();
    expect(Dialog.Description).toBeDefined();
  });
});

describe("Text Component", () => {
  it("renders with default props", () => {
    const html = renderComponent("Text", { children: "Hello" });
    expect(html).toContain("Hello");
    expect(warnings).toHaveLength(0);
  });

  it.each(["xs", "sm", "base", "lg"])("renders size=%s without warning", (size) => {
    const html = renderComponent("Text", { children: "Test", size });
    expect(html).toContain("Test");
    expect(warnings).toHaveLength(0);
  });

  it.each(["normal", "medium", "semibold", "bold"])("renders weight=%s with correct style", (weight) => {
    const html = renderComponent("Text", { children: "W", weight });
    if (weight !== "normal") {
      expect(html).toContain("font-weight");
    }
    expect(warnings).toHaveLength(0);
  });

  it("bold applies font-weight:700", () => {
    const html = renderComponent("Text", { children: "B", weight: "bold" });
    expect(html).toContain("font-weight:700");
  });

  it("semibold applies font-weight:600", () => {
    const html = renderComponent("Text", { children: "S", weight: "semibold" });
    expect(html).toContain("font-weight:600");
  });

  it.each(["default", "subtle", "muted", "accent", "success", "warning", "danger"])("renders color=%s", (color) => {
    const html = renderComponent("Text", { children: "C", color });
    if (color !== "default") {
      expect(html).toContain("color:");
    }
    expect(warnings).toHaveLength(0);
  });
});

describe("Badge Component", () => {
  it.each(["neutral", "info", "success", "warning", "error", "primary", "secondary"])("renders variant=%s without warning", (variant) => {
    const html = renderComponent("Badge", { children: "Tag", variant });
    expect(html).toContain("Tag");
    expect(warnings).toHaveLength(0);
  });

  it("danger maps to error internally", () => {
    const html = renderComponent("Badge", { children: "X", variant: "danger" });
    expect(html).toContain("X");
    expect(warnings).toHaveLength(0);
  });
});

describe("Button Component", () => {
  it.each(["primary", "secondary", "ghost", "destructive", "outline"])("renders variant=%s without warning", (variant) => {
    const html = renderComponent("Button", { children: "Click", variant });
    expect(html).toContain("Click");
    expect(warnings).toHaveLength(0);
  });

  it.each(["xs", "sm", "base", "lg"])("renders size=%s without warning", (size) => {
    const html = renderComponent("Button", { children: "Btn", size });
    expect(html).toContain("Btn");
    expect(warnings).toHaveLength(0);
  });
});

describe("Card Component", () => {
  it("elevated variant has p-6 rounded-xl", () => {
    const html = renderComponent("Card", { children: [], variant: "elevated" });
    expect(html).toContain("p-6");
    expect(html).toContain("rounded-xl");
  });

  it("outlined variant has p-5 rounded-lg", () => {
    const html = renderComponent("Card", { children: [], variant: "outlined" });
    expect(html).toContain("p-5");
    expect(html).toContain("rounded-lg");
  });

  it("ghost variant has p-4 rounded-lg", () => {
    const html = renderComponent("Card", { children: [], variant: "ghost" });
    expect(html).toContain("p-4");
    expect(html).toContain("rounded-lg");
  });
});

describe("Callout Component", () => {
  it.each([
    ["info", "ℹ"],
    ["success", "✓"],
    ["warning", "⚠"],
    ["danger", "✕"],
  ])("variant=%s shows icon=%s", (variant, icon) => {
    const html = renderComponent("Callout", { variant, title: "Title", description: "Desc" });
    expect(html).toContain(icon);
    expect(html).toContain("Title");
    expect(html).toContain("Desc");
  });
});

describe("Code Component", () => {
  it.each([
    ["javascript", "ts"],
    ["js", "ts"],
    ["typescript", "ts"],
    ["json", "jsonc"],
    ["sh", "bash"],
    ["shell", "bash"],
  ])("maps lang=%s to %s", (input, expected) => {
    renderComponent("Code", { lang: input, code: "x" });
    expect(warnings).toHaveLength(0);
  });

  it.each(["ts", "tsx", "bash", "css", "jsonc"])("valid lang=%s passes through", (lang) => {
    renderComponent("Code", { lang, code: "code" });
    expect(warnings).toHaveLength(0);
  });
});

describe("Input Component", () => {
  it.each(["text", "email", "password", "number", "url"])("renders type=%s", (type) => {
    const html = renderComponent("Input", { name: "field", placeholder: "ph", type });
    expect(html).toContain('type="' + type + '"');
    expect(html).toContain("aria-label");
    expect(warnings).toHaveLength(0);
  });
});

describe("Link Component", () => {
  it.each(["inline", "current", "plain"])("renders variant=%s without warning", (variant) => {
    const html = renderComponent("Link", { children: "Click", href: "/test", variant });
    expect(html).toContain("Click");
    expect(warnings).toHaveLength(0);
  });
});

describe("Loader Component", () => {
  it.each(["sm", "base", "lg"])("renders size=%s without warning", (size) => {
    renderComponent("Loader", { size });
    expect(warnings).toHaveLength(0);
  });
});

describe("ClipboardText Component", () => {
  it.each(["sm", "base", "lg"])("renders size=%s without warning", (size) => {
    const html = renderComponent("ClipboardText", { text: "secret", size });
    expect(html).toContain("secret");
    expect(warnings).toHaveLength(0);
  });
});

describe("Empty Component", () => {
  it.each(["sm", "base", "lg"])("renders size=%s without warning", (size) => {
    const html = renderComponent("Empty", { title: "Nothing", description: "Empty", size });
    expect(html).toContain("Nothing");
    expect(warnings).toHaveLength(0);
  });
});

describe("LinkButton Component", () => {
  it.each(["primary", "secondary", "ghost", "destructive", "outline"])("renders variant=%s", (variant) => {
    const html = renderComponent("LinkButton", { children: "Go", href: "/x", variant });
    expect(html).toContain("Go");
    expect(html).toContain("/x");
    expect(warnings).toHaveLength(0);
  });
});

describe("Simple Components", () => {
  it("Textarea renders textarea element", () => {
    const html = renderComponent("Textarea", { name: "bio", placeholder: "Write...", rows: 4 });
    expect(html).toContain("<textarea");
    expect(html).toContain("Write...");
    expect(warnings).toHaveLength(0);
  });

  it("Switch renders with label", () => {
    const html = renderComponent("Switch", { name: "toggle", label: "Enable" });
    expect(html).toContain("Enable");
    expect(warnings).toHaveLength(0);
  });

  it("Checkbox renders with label", () => {
    const html = renderComponent("Checkbox", { name: "agree", label: "Accept" });
    expect(html).toContain("Accept");
    expect(warnings).toHaveLength(0);
  });

  it("Label renders text", () => {
    const html = renderComponent("Label", { children: "Name" });
    expect(html).toContain("Name");
  });

  it("Label with showOptional renders (optional)", () => {
    const html = renderComponent("Label", { children: "Bio", showOptional: true });
    expect(html).toContain("optional");
  });

  it("Separator renders hr", () => {
    const html = renderComponent("Separator", {});
    expect(html).toContain("<hr");
  });

  it("Skeleton renders multiple skeleton-line divs", () => {
    const html = renderComponent("Skeleton", { count: 5 });
    const matches = html.match(/skeleton-line/g);
    expect(matches?.length).toBe(5);
  });

  it("Meter renders with value", () => {
    const html = renderComponent("Meter", { value: 75, max: 100, label: "CPU" });
    expect(html).toContain("CPU");
    expect(warnings).toHaveLength(0);
  });

  it("SensitiveInput renders", () => {
    const html = renderComponent("SensitiveInput", { name: "key", placeholder: "Enter key" });
    expect(html).toContain("Enter key");
    expect(warnings).toHaveLength(0);
  });

  it("Pagination renders", () => {
    const html = renderComponent("Pagination", { totalPages: 10, page: 3 });
    expect(html).toContain("pagination");
    expect(warnings).toHaveLength(0);
  });

  it("DatePicker renders calendar", () => {
    const html = renderComponent("DatePicker", { name: "date", label: "Start" });
    expect(html).toContain("rdp-root");
    expect(warnings).toHaveLength(0);
  });
});

describe("Compound Components", () => {
  it("RadioGroup renders items", () => {
    const items = [
      { type: "RadioItem", props: { value: "a", label: "Option A" } },
      { type: "RadioItem", props: { value: "b", label: "Option B" } },
    ];
    const html = renderComponent("RadioGroup", { name: "choice", items, defaultValue: "a" });
    expect(html).toContain("Option A");
    expect(html).toContain("Option B");
    expect(html).toContain("radiogroup");
    expect(warnings).toHaveLength(0);
  });

  it("Breadcrumbs renders links and current", () => {
    const items = [
      { type: "BreadcrumbItem", props: { label: "Home", href: "/" } },
      { type: "BreadcrumbItem", props: { label: "Current" } },
    ];
    const html = renderComponent("Breadcrumbs", { items });
    expect(html).toContain("Home");
    expect(html).toContain("Current");
    expect(html).toContain("breadcrumb");
    expect(warnings).toHaveLength(0);
  });

  it("Collapsible renders trigger text", () => {
    const html = renderComponent("Collapsible", { title: "More Info", children: [] });
    expect(html).toContain("More Info");
    expect(warnings).toHaveLength(0);
  });

  it("DropdownMenu renders trigger", () => {
    const items = [
      { type: "MenuItem", props: { label: "Edit" } },
      { type: "MenuItem", props: { label: "Delete" } },
    ];
    const html = renderComponent("DropdownMenu", { trigger: "Actions", items });
    expect(html).toContain("Actions");
    expect(warnings).toHaveLength(0);
  });

  it("Dialog renders title and description", () => {
    const html = renderComponent("Dialog", { title: "Confirm", description: "Are you sure?", children: [] });
    expect(html).toContain("Confirm");
    expect(html).toContain("Are you sure?");
    expect(warnings).toHaveLength(0);
  });

  it("Tabs renders tab labels", () => {
    const items = [
      { type: "TabItem", props: { value: "t1", label: "Tab One", content: [] } },
      { type: "TabItem", props: { value: "t2", label: "Tab Two", content: [] } },
    ];
    const html = renderComponent("Tabs", { items });
    expect(html).toContain("Tab One");
    expect(html).toContain("Tab Two");
    expect(warnings).toHaveLength(0);
  });

  it("Field renders label and hint", () => {
    const html = renderComponent("Field", { label: "Email", hint: "Enter valid email", children: [] });
    expect(html).toContain("Email");
    expect(warnings).toHaveLength(0);
  });

  it("Table renders headers and data", () => {
    const columns = [
      { type: "TableColumn", props: { label: "Name", data: ["Alice", "Bob"] } },
      { type: "TableColumn", props: { label: "Age", data: ["30", "25"] } },
    ];
    const html = renderComponent("Table", { columns });
    expect(html).toContain("Name");
    expect(html).toContain("Alice");
    expect(html).toContain("Bob");
    expect(html).toContain("Age");
  });

  it("Select renders options", () => {
    const items = [
      { type: "SelectItem", props: { value: "us", label: "United States" } },
      { type: "SelectItem", props: { value: "eu", label: "Europe" } },
    ];
    const html = renderComponent("Select", { name: "region", items, placeholder: "Choose..." });
    expect(html).toContain("United States");
    expect(html).toContain("Europe");
    expect(html).toContain("Choose...");
  });
});

describe("Stack Component", () => {
  it("renders row direction", () => {
    const html = renderComponent("Stack", { children: [], direction: "row", gap: "md" });
    expect(html).toContain("flex-direction:row");
    expect(html).toContain("gap:1rem");
  });

  it("renders column direction", () => {
    const html = renderComponent("Stack", { children: [], direction: "column", gap: "lg" });
    expect(html).toContain("flex-direction:column");
    expect(html).toContain("gap:1.5rem");
  });

  it.each([
    ["none", "0"],
    ["xs", "0.25rem"],
    ["sm", "0.5rem"],
    ["md", "1rem"],
    ["lg", "1.5rem"],
    ["xl", "2rem"],
  ])("gap=%s renders %s", (gap, expected) => {
    const html = renderComponent("Stack", { children: [], direction: "row", gap });
    expect(html).toContain(`gap:${expected}`);
  });
});
