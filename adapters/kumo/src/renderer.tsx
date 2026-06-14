import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod/v4";
import React from "react";
import { Button } from "@cloudflare/kumo";
import { Text } from "@cloudflare/kumo";
import { Badge } from "@cloudflare/kumo";
import { Surface } from "@cloudflare/kumo";
import { Banner } from "@cloudflare/kumo";
import { Input } from "@cloudflare/kumo";
import { Switch } from "@cloudflare/kumo";
import { Checkbox } from "@cloudflare/kumo";
import { Tabs } from "@cloudflare/kumo";
import { Table } from "@cloudflare/kumo";
import { Select } from "@cloudflare/kumo";

function KumoStack({ children, direction = "column", gap = "md", align, justify }: any) {
  const gapMap: Record<string, string> = { none: "0", xs: "0.25rem", sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem" };
  return (
    <div style={{
      display: "flex",
      flexDirection: direction === "row" ? "row" : "column",
      gap: gapMap[gap] || "0.75rem",
      alignItems: align || "stretch",
      justifyContent: justify || "flex-start",
      width: "100%",
    }}>
      {children}
    </div>
  );
}

function KumoCard({ children, variant = "elevated" }: any) {
  return <Surface className={variant === "elevated" ? "p-4" : "p-4"}>{children}</Surface>;
}

function KumoBanner({ variant, title, description }: any) {
  return <Banner variant={variant}><Banner.Title>{title}</Banner.Title>{description && <Banner.Description>{description}</Banner.Description>}</Banner>;
}

function KumoTabs({ items }: any) {
  if (!items || !Array.isArray(items)) return null;
  return (
    <Tabs defaultValue={items[0]?.props?.value}>
      <Tabs.List>
        {items.map((item: any) => (
          <Tabs.Trigger key={item.props.value} value={item.props.value}>{item.props.label}</Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item: any) => (
        <Tabs.Content key={item.props.value} value={item.props.value}>
          {item.props.content}
        </Tabs.Content>
      ))}
    </Tabs>
  );
}

function KumoTabItem({ value, label, content }: any) {
  return null;
}

function KumoTable({ columns }: any) {
  if (!columns || !Array.isArray(columns)) return null;
  const cols = columns.map((c: any) => c.props || c);
  const rowCount = cols[0]?.data?.length || 0;
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          {cols.map((col: any, i: number) => (
            <Table.ColumnHeader key={i}>{col.label}</Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {Array.from({ length: rowCount }, (_, rowIdx) => (
          <Table.Row key={rowIdx}>
            {cols.map((col: any, colIdx: number) => (
              <Table.Cell key={colIdx}>{col.data?.[rowIdx]}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function KumoTableColumn({ label, data, type }: any) {
  return null;
}

function KumoSelect({ name, items, placeholder }: any) {
  if (!items || !Array.isArray(items)) return null;
  return (
    <Select name={name}>
      <Select.Trigger placeholder={placeholder || "Select..."} />
      <Select.Content>
        {items.map((item: any) => {
          const props = item.props || item;
          return <Select.Item key={props.value} value={props.value}>{props.label}</Select.Item>;
        })}
      </Select.Content>
    </Select>
  );
}

function KumoSelectItem({ value, label }: any) {
  return null;
}

function KumoSeparator() {
  return <hr style={{ border: "none", borderTop: "1px solid var(--color-kumo-line, #e5e7eb)", margin: "0.5rem 0" }} />;
}

const StackDef = defineComponent({ name: "Stack", props: z.object({ children: z.array(z.any()), direction: z.enum(["row", "column"]).optional(), gap: z.enum(["none", "xs", "sm", "md", "lg", "xl"]).optional(), align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(), justify: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional() }), description: "Flex container with direction and gap", component: KumoStack });
const CardDef = defineComponent({ name: "Card", props: z.object({ children: z.array(z.any()), variant: z.enum(["elevated", "outlined", "ghost"]).optional() }), description: "Elevated container using Surface", component: KumoCard });
const TextDef = defineComponent({ name: "Text", props: z.object({ children: z.string(), size: z.enum(["xs", "sm", "md", "lg", "xl", "2xl"]).optional(), weight: z.enum(["normal", "medium", "semibold", "bold"]).optional(), color: z.enum(["default", "subtle", "muted", "accent", "success", "warning", "danger"]).optional() }), description: "Text block with size and weight", component: Text });
const ButtonDef = defineComponent({ name: "Button", props: z.object({ children: z.string(), variant: z.enum(["primary", "secondary", "ghost", "destructive", "outline"]).optional(), size: z.enum(["xs", "sm", "base", "lg"]).optional() }), description: "Interactive button", component: Button });
const BadgeDef = defineComponent({ name: "Badge", props: z.object({ children: z.string(), variant: z.enum(["neutral", "info", "success", "warning", "danger"]).optional(), size: z.enum(["sm", "md"]).optional() }), description: "Small label for status", component: Badge });
const CalloutDef = defineComponent({ name: "Callout", props: z.object({ variant: z.enum(["info", "success", "warning", "danger"]), title: z.string(), description: z.string().optional() }), description: "Alert banner", component: KumoBanner });
const TableDef = defineComponent({ name: "Table", props: z.object({ columns: z.array(z.any()) }), description: "Data table", component: KumoTable });
const TableColumnDef = defineComponent({ name: "TableColumn", props: z.object({ label: z.string(), data: z.any(), type: z.enum(["string", "number", "action"]).optional() }), description: "Column for Table", component: KumoTableColumn });
const InputDef = defineComponent({ name: "Input", props: z.object({ name: z.string(), placeholder: z.string().optional(), type: z.enum(["text", "email", "password", "number", "url"]).optional() }), description: "Text input field", component: Input });
const SelectDef = defineComponent({ name: "Select", props: z.object({ name: z.string(), items: z.array(z.any()), placeholder: z.string().optional() }), description: "Dropdown select", component: KumoSelect });
const SelectItemDef = defineComponent({ name: "SelectItem", props: z.object({ value: z.string(), label: z.string() }), description: "Option for Select", component: KumoSelectItem });
const TabsDef = defineComponent({ name: "Tabs", props: z.object({ items: z.array(z.any()) }), description: "Tabbed container", component: KumoTabs });
const TabItemDef = defineComponent({ name: "TabItem", props: z.object({ value: z.string(), label: z.string(), content: z.array(z.any()) }), description: "Tab panel", component: KumoTabItem });
const SwitchDef = defineComponent({ name: "Switch", props: z.object({ name: z.string(), label: z.string(), defaultChecked: z.boolean().optional() }), description: "Toggle switch", component: Switch });
const CheckboxDef = defineComponent({ name: "Checkbox", props: z.object({ name: z.string(), label: z.string(), defaultChecked: z.boolean().optional() }), description: "Checkbox toggle", component: Checkbox });
const SeparatorDef = defineComponent({ name: "Separator", props: z.object({ orientation: z.enum(["horizontal", "vertical"]).optional() }), description: "Visual divider", component: KumoSeparator });

const library = createLibrary({
  components: [StackDef, CardDef, TextDef, ButtonDef, BadgeDef, CalloutDef, TableDef, TableColumnDef, InputDef, SelectDef, SelectItemDef, TabsDef, TabItemDef, SwitchDef, CheckboxDef, SeparatorDef],
  componentGroups: [
    { name: "Layout", components: ["Stack", "Card", "Tabs", "TabItem", "Separator"] },
    { name: "Content", components: ["Text", "Badge", "Callout"] },
    { name: "Data", components: ["Table", "TableColumn"] },
    { name: "Forms", components: ["Button", "Input", "Select", "SelectItem", "Switch", "Checkbox"] },
  ],
  root: "Stack",
});

export default library;
