import { createLibrary, defineComponent, type ComponentRenderProps } from "@openuidev/lang-core";
import { z } from "zod/v4";
import React from "react";
import { Button, Text, Badge, Surface, Input, Switch, Checkbox, Code, ClipboardText, Empty, Grid, Label, LayerCard, Link, Loader, Meter, SensitiveInput, Textarea, Radio, Collapsible, Breadcrumbs, Pagination, LinkButton, SkeletonLine, Field, Tooltip, TooltipProvider, DropdownMenu, Dialog, DatePicker } from "@cloudflare/kumo";

function KumoStack({ props, renderNode }: ComponentRenderProps) {
  const { children, direction = "column", gap = "md", align, justify } = props as any;
  const gapMap: Record<string, string> = { none: "0", xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" };
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return (
    <div style={{
      display: "flex",
      flexDirection: direction === "row" ? "row" : "column",
      gap: gapMap[gap] || "0.75rem",
      alignItems: align || "stretch",
      justifyContent: justify || "flex-start",
      width: "100%",
    }}>
      {rendered}
    </div>
  );
}

function KumoCard({ props, renderNode }: ComponentRenderProps) {
  const { children, variant = "elevated" } = props as any;
  const classMap: Record<string, string> = { elevated: "p-6 rounded-xl", outlined: "p-5 rounded-lg", ghost: "p-4 rounded-lg" };
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return <Surface className={classMap[variant] || classMap.elevated}>{rendered}</Surface>;
}

function KumoText({ props }: ComponentRenderProps) {
  const { children, size = "base", weight, color } = props as any;
  const weightMap: Record<string, string> = { normal: "400", medium: "500", semibold: "600", bold: "700" };
  const colorMap: Record<string, string> = { default: "inherit", subtle: "var(--kumo-color-text-subtle, #6b7280)", muted: "var(--kumo-color-text-muted, #9ca3af)", accent: "var(--kumo-color-text-accent, #2563eb)", success: "var(--kumo-color-text-success, #16a34a)", warning: "var(--kumo-color-text-warning, #d97706)", danger: "var(--kumo-color-text-danger, #dc2626)" };
  const style: any = {};
  if (weight && weight !== "normal") style.fontWeight = weightMap[weight] || weight;
  if (color && color !== "default") style.color = colorMap[color] || color;
  return <Text size={size} style={style}>{children}</Text>;
}

function KumoButton({ props }: ComponentRenderProps) {
  const { children, variant = "primary", size = "base" } = props as any;
  return <Button variant={variant} size={size}>{children}</Button>;
}

function KumoBadge({ props }: ComponentRenderProps) {
  const { children, variant = "neutral" } = props as any;
  const variantMap: Record<string, string> = { danger: "error" };
  return <Badge variant={variantMap[variant] || variant}>{children}</Badge>;
}

function KumoBanner({ props }: ComponentRenderProps) {
  const { variant, title, description } = props as any;
  const colors: Record<string, any> = { info: { bg: "#eff6ff", border: "#bfdbfe", icon: "ℹ" }, success: { bg: "#f0fdf4", border: "#bbf7d0", icon: "✓" }, warning: { bg: "#fffbeb", border: "#fde68a", icon: "⚠" }, danger: { bg: "#fef2f2", border: "#fecaca", icon: "✕" } };
  const c = colors[variant] || colors.info;
  return (
    <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", border: `1px solid ${c.border}`, background: c.bg, display: "flex", gap: "0.5rem" }}>
      <span>{c.icon}</span>
      <div><div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{title}</div>{description && <div style={{ fontSize: "0.875rem", marginTop: "0.25rem", opacity: 0.8 }}>{description}</div>}</div>
    </div>
  );
}

function KumoTabs({ props, renderNode }: ComponentRenderProps) {
  const { items } = props as any;
  if (!items || !Array.isArray(items)) return null;
  const [active, setActive] = React.useState(items[0]?.props?.value);
  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-kumo-line, #e5e7eb)", gap: "0" }}>
        {items.map((item: any) => (
          <button key={item.props.value} onClick={() => setActive(item.props.value)} style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, border: "none", background: "none", cursor: "pointer", borderBottom: active === item.props.value ? "2px solid var(--color-kumo-brand, #2563eb)" : "2px solid transparent", color: active === item.props.value ? "var(--color-kumo-brand, #2563eb)" : "var(--color-kumo-subtle, #6b7280)" }}>{item.props.label}</button>
        ))}
      </div>
      <div style={{ padding: "1rem 0" }}>
        {items.filter((item: any) => item.props.value === active).map((item: any) => (
          <div key={item.props.value}>
            {Array.isArray(item.props.content) ? item.props.content.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function KumoTabItem() { return null; }

function KumoTable({ props }: ComponentRenderProps) {
  const { columns } = props as any;
  if (!columns || !Array.isArray(columns)) return null;
  const cols = columns.map((c: any) => c.props || c);
  const rowCount = cols[0]?.data?.length || 0;
  const thStyle = { padding: "0.625rem 1rem", textAlign: "left" as const, borderBottom: "1px solid var(--color-kumo-line, #e5e7eb)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-kumo-subtle, #6b7280)" };
  const tdStyle = { padding: "0.625rem 1rem", borderBottom: "1px solid var(--color-kumo-line, #f3f4f6)", fontSize: "0.875rem" };
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{cols.map((col: any, i: number) => <th key={i} style={thStyle}>{col.label}</th>)}</tr></thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, rowIdx) => (
          <tr key={rowIdx}>{cols.map((col: any, colIdx: number) => <td key={colIdx} style={tdStyle}>{col.data?.[rowIdx]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

function KumoTableColumn() { return null; }

function KumoSelect({ props }: ComponentRenderProps) {
  const { name, items, placeholder } = props as any;
  if (!items || !Array.isArray(items)) return null;
  return (
    <select name={name} style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-kumo-line, #e5e7eb)", fontSize: "0.875rem", background: "var(--color-kumo-control, #fff)", width: "100%" }}>
      {placeholder && <option value="" disabled selected>{placeholder}</option>}
      {items.map((item: any) => {
        const p = item.props || item;
        return <option key={p.value} value={p.value}>{p.label}</option>;
      })}
    </select>
  );
}

function KumoSelectItem() { return null; }

function KumoInput({ props }: ComponentRenderProps) {
  const { name, placeholder, type = "text" } = props as any;
  return <Input name={name} placeholder={placeholder} type={type} aria-label={name} />;
}

function KumoSwitch({ props }: ComponentRenderProps) {
  const { name, label, defaultChecked } = props as any;
  return <Switch name={name} label={label} defaultChecked={defaultChecked} />;
}

function KumoCheckbox({ props }: ComponentRenderProps) {
  const { name, label, defaultChecked } = props as any;
  return <Checkbox name={name} label={label} defaultChecked={defaultChecked} />;
}

function KumoSeparator() {
  return <hr style={{ border: "none", borderTop: "1px solid var(--color-kumo-line, #e5e7eb)", margin: "0.5rem 0" }} />;
}

function KumoCode({ props }: ComponentRenderProps) {
  const { lang, code } = props as any;
  const langMap: Record<string, string> = { javascript: "ts", js: "ts", typescript: "ts", json: "jsonc", sh: "bash", shell: "bash" };
  return <Code lang={langMap[lang] || lang} code={code} />;
}

function KumoClipboardText({ props }: ComponentRenderProps) {
  const { text, size } = props as any;
  return <ClipboardText text={text} size={size} />;
}

function KumoEmpty({ props }: ComponentRenderProps) {
  const { title, description, size } = props as any;
  return <Empty title={title} description={description} size={size} />;
}

function KumoGrid({ props, renderNode }: ComponentRenderProps) {
  const { children, gap, variant } = props as any;
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return <Grid gap={gap} variant={variant}>{rendered}</Grid>;
}

function KumoLabel({ props }: ComponentRenderProps) {
  const { children, showOptional } = props as any;
  return <Label showOptional={showOptional}>{children}</Label>;
}

function KumoLayerCard({ props, renderNode }: ComponentRenderProps) {
  const { children } = props as any;
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return <LayerCard className="p-4">{rendered}</LayerCard>;
}

function KumoLink({ props }: ComponentRenderProps) {
  const { children, href, variant } = props as any;
  return <Link href={href} variant={variant}>{children}</Link>;
}

function KumoLoader({ props }: ComponentRenderProps) {
  const { size } = props as any;
  return <Loader size={size} />;
}

function KumoMeter({ props }: ComponentRenderProps) {
  const { value, max = 100, label, showValue = true } = props as any;
  return <Meter value={value} max={max} label={label} showValue={showValue} />;
}

function KumoSensitiveInput({ props }: ComponentRenderProps) {
  const { name, placeholder, label } = props as any;
  return <SensitiveInput name={name} placeholder={placeholder} aria-label={label || name} />;
}

function KumoTextarea({ props }: ComponentRenderProps) {
  const { name, placeholder, rows = 3 } = props as any;
  return <Textarea name={name} placeholder={placeholder} rows={rows} aria-label={name} />;
}

function KumoRadioGroup({ props }: ComponentRenderProps) {
  const { name, items, defaultValue } = props as any;
  if (!items || !Array.isArray(items)) return null;
  const options = items.map((item: any) => item.props || item);
  return (
    <Radio name={name} defaultValue={defaultValue || options[0]?.value}>
      {options.map((opt: any) => <Radio.Item key={opt.value} value={opt.value} label={opt.label} />)}
    </Radio>
  );
}

function KumoRadioItem() { return null; }

function KumoTooltip({ props, renderNode }: ComponentRenderProps) {
  const { content, children } = props as any;
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return (
    <TooltipProvider>
      <Tooltip content={content}>{rendered}</Tooltip>
    </TooltipProvider>
  );
}

function KumoCollapsible({ props, renderNode }: ComponentRenderProps) {
  const { title, children } = props as any;
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return (
    <Collapsible.Root>
      <Collapsible.DefaultTrigger>{title}</Collapsible.DefaultTrigger>
      <Collapsible.DefaultPanel>{rendered}</Collapsible.DefaultPanel>
    </Collapsible.Root>
  );
}

function KumoBreadcrumbs({ props }: ComponentRenderProps) {
  const { items } = props as any;
  if (!items || !Array.isArray(items)) return null;
  const crumbs = items.map((item: any) => item.props || item);
  return (
    <Breadcrumbs>
      {crumbs.map((crumb: any, i: number) => (
        <React.Fragment key={i}>
          {i > 0 && <Breadcrumbs.Separator />}
          {crumb.href ? <Breadcrumbs.Link href={crumb.href}>{crumb.label}</Breadcrumbs.Link> : <Breadcrumbs.Current>{crumb.label}</Breadcrumbs.Current>}
        </React.Fragment>
      ))}
    </Breadcrumbs>
  );
}

function KumoBreadcrumbItem() { return null; }

function KumoPagination({ props }: ComponentRenderProps) {
  const { totalPages, page = 1 } = props as any;
  return <Pagination totalPages={totalPages} page={page} />;
}

function KumoLinkButton({ props }: ComponentRenderProps) {
  const { children, href, variant = "primary" } = props as any;
  return <LinkButton href={href} variant={variant}>{children}</LinkButton>;
}

function KumoSkeleton({ props }: ComponentRenderProps) {
  const { count = 3 } = props as any;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
      {Array.from({ length: count }, (_, i) => <SkeletonLine key={i} />)}
    </div>
  );
}

function KumoField({ props, renderNode }: ComponentRenderProps) {
  const { label, hint, children } = props as any;
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return <Field label={label} hint={hint}>{rendered}</Field>;
}

function KumoDropdownMenu({ props }: ComponentRenderProps) {
  const { trigger, items } = props as any;
  if (!items || !Array.isArray(items)) return null;
  const menuItems = items.map((item: any) => item.props || item);
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {menuItems.map((item: any, i: number) => (
          item.separator ? <DropdownMenu.Separator key={i} /> : <DropdownMenu.Item key={i}>{item.label}</DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

function KumoMenuItem() { return null; }

function KumoDialog({ props, renderNode }: ComponentRenderProps) {
  const { title, description, children } = props as any;
  const rendered = Array.isArray(children) ? children.map((c: any, i: number) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : null;
  return (
    <div style={{ border: "1px solid var(--color-kumo-line, #e5e7eb)", borderRadius: "0.75rem", padding: "1.5rem", background: "var(--color-kumo-base, #fff)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <Dialog.Root open={true}>
        <Dialog.Title>{title}</Dialog.Title>
        {description && <Dialog.Description>{description}</Dialog.Description>}
        <div style={{ marginTop: "1rem" }}>{rendered}</div>
      </Dialog.Root>
    </div>
  );
}

function KumoDatePicker({ props }: ComponentRenderProps) {
  const { name, label } = props as any;
  return <DatePicker name={name} label={label} />;
}

const StackDef = defineComponent({ name: "Stack", props: z.object({ children: z.array(z.any()), direction: z.enum(["row", "column"]).optional(), gap: z.enum(["none", "xs", "sm", "md", "lg", "xl"]).optional(), align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(), justify: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional() }), description: "Flex container with direction and gap", component: KumoStack });
const CardDef = defineComponent({ name: "Card", props: z.object({ children: z.array(z.any()), variant: z.enum(["elevated", "outlined", "ghost"]).optional() }), description: "Elevated container using Surface", component: KumoCard });
const TextDef = defineComponent({ name: "Text", props: z.object({ children: z.string(), size: z.enum(["xs", "sm", "base", "lg"]).optional(), weight: z.enum(["normal", "medium", "semibold", "bold"]).optional(), color: z.enum(["default", "subtle", "muted", "accent", "success", "warning", "danger"]).optional() }), description: "Text block with size and weight", component: KumoText });
const ButtonDef = defineComponent({ name: "Button", props: z.object({ children: z.string(), variant: z.enum(["primary", "secondary", "ghost", "destructive", "outline"]).optional(), size: z.enum(["xs", "sm", "base", "lg"]).optional() }), description: "Interactive button", component: KumoButton });
const BadgeDef = defineComponent({ name: "Badge", props: z.object({ children: z.string(), variant: z.enum(["neutral", "info", "success", "warning", "danger", "error", "primary", "secondary"]).optional(), size: z.enum(["xs", "sm", "base", "lg"]).optional() }), description: "Small label for status", component: KumoBadge });
const CalloutDef = defineComponent({ name: "Callout", props: z.object({ variant: z.enum(["info", "success", "warning", "danger"]), title: z.string(), description: z.string().optional() }), description: "Alert banner", component: KumoBanner });
const TableDef = defineComponent({ name: "Table", props: z.object({ columns: z.array(z.any()) }), description: "Data table", component: KumoTable });
const TableColumnDef = defineComponent({ name: "TableColumn", props: z.object({ label: z.string(), data: z.any(), type: z.enum(["string", "number", "action"]).optional() }), description: "Column for Table", component: KumoTableColumn });
const InputDef = defineComponent({ name: "Input", props: z.object({ name: z.string(), placeholder: z.string().optional(), type: z.enum(["text", "email", "password", "number", "url"]).optional() }), description: "Text input field", component: KumoInput });
const SelectDef = defineComponent({ name: "Select", props: z.object({ name: z.string(), items: z.array(z.any()), placeholder: z.string().optional() }), description: "Dropdown select", component: KumoSelect });
const SelectItemDef = defineComponent({ name: "SelectItem", props: z.object({ value: z.string(), label: z.string() }), description: "Option for Select", component: KumoSelectItem });
const TabsDef = defineComponent({ name: "Tabs", props: z.object({ items: z.array(z.any()) }), description: "Tabbed container", component: KumoTabs });
const TabItemDef = defineComponent({ name: "TabItem", props: z.object({ value: z.string(), label: z.string(), content: z.array(z.any()) }), description: "Tab panel", component: KumoTabItem });
const SwitchDef = defineComponent({ name: "Switch", props: z.object({ name: z.string(), label: z.string(), defaultChecked: z.boolean().optional() }), description: "Toggle switch", component: KumoSwitch });
const CheckboxDef = defineComponent({ name: "Checkbox", props: z.object({ name: z.string(), label: z.string(), defaultChecked: z.boolean().optional() }), description: "Checkbox toggle", component: KumoCheckbox });
const SeparatorDef = defineComponent({ name: "Separator", props: z.object({ orientation: z.enum(["horizontal", "vertical"]).optional() }), description: "Visual divider", component: KumoSeparator });
const CodeDef = defineComponent({ name: "Code", props: z.object({ lang: z.string(), code: z.string() }), description: "Syntax-highlighted code block", component: KumoCode });
const ClipboardTextDef = defineComponent({ name: "ClipboardText", props: z.object({ text: z.string(), size: z.enum(["sm", "base", "lg"]).optional() }), description: "Read-only text with copy-to-clipboard button", component: KumoClipboardText });
const EmptyDef = defineComponent({ name: "Empty", props: z.object({ title: z.string(), description: z.string().optional(), size: z.enum(["sm", "base", "lg"]).optional() }), description: "Placeholder for empty states", component: KumoEmpty });
const GridDef = defineComponent({ name: "Grid", props: z.object({ children: z.array(z.any()), gap: z.enum(["none", "xs", "sm", "md", "lg", "xl"]).optional(), variant: z.string().optional() }), description: "Responsive CSS grid layout", component: KumoGrid });
const LabelDef = defineComponent({ name: "Label", props: z.object({ children: z.string(), showOptional: z.boolean().optional() }), description: "Form field label", component: KumoLabel });
const LayerCardDef = defineComponent({ name: "LayerCard", props: z.object({ children: z.array(z.any()) }), description: "Nested elevation card container", component: KumoLayerCard });
const LinkDef = defineComponent({ name: "Link", props: z.object({ children: z.string(), href: z.string(), variant: z.enum(["inline", "current", "plain"]).optional() }), description: "Clickable hyperlink", component: KumoLink });
const LoaderDef = defineComponent({ name: "Loader", props: z.object({ size: z.enum(["sm", "base", "lg"]).optional() }), description: "Animated loading spinner", component: KumoLoader });
const MeterDef = defineComponent({ name: "Meter", props: z.object({ value: z.number(), max: z.number().optional(), label: z.string().optional(), showValue: z.boolean().optional() }), description: "Progress bar showing measured value", component: KumoMeter });
const SensitiveInputDef = defineComponent({ name: "SensitiveInput", props: z.object({ name: z.string(), placeholder: z.string().optional(), label: z.string().optional() }), description: "Masked password/secret input with reveal toggle", component: KumoSensitiveInput });
const TextareaDef = defineComponent({ name: "Textarea", props: z.object({ name: z.string(), placeholder: z.string().optional(), rows: z.number().optional() }), description: "Multiline text input", component: KumoTextarea });
const RadioGroupDef = defineComponent({ name: "RadioGroup", props: z.object({ name: z.string(), items: z.array(z.any()), defaultValue: z.string().optional() }), description: "Radio button group", component: KumoRadioGroup });
const RadioItemDef = defineComponent({ name: "RadioItem", props: z.object({ value: z.string(), label: z.string() }), description: "Option for RadioGroup", component: KumoRadioItem });
const TooltipDef = defineComponent({ name: "Tooltip", props: z.object({ content: z.string(), children: z.array(z.any()) }), description: "Hover tooltip around content", component: KumoTooltip });
const CollapsibleDef = defineComponent({ name: "Collapsible", props: z.object({ title: z.string(), children: z.array(z.any()) }), description: "Expandable/collapsible section", component: KumoCollapsible });
const BreadcrumbsDef = defineComponent({ name: "Breadcrumbs", props: z.object({ items: z.array(z.any()) }), description: "Navigation breadcrumb trail", component: KumoBreadcrumbs });
const BreadcrumbItemDef = defineComponent({ name: "BreadcrumbItem", props: z.object({ label: z.string(), href: z.string().optional() }), description: "Item in Breadcrumbs", component: KumoBreadcrumbItem });
const PaginationDef = defineComponent({ name: "Pagination", props: z.object({ totalPages: z.number(), page: z.number().optional() }), description: "Page navigation controls", component: KumoPagination });
const LinkButtonDef = defineComponent({ name: "LinkButton", props: z.object({ children: z.string(), href: z.string(), variant: z.enum(["primary", "secondary", "ghost", "destructive", "outline"]).optional() }), description: "Button styled as a link", component: KumoLinkButton });
const SkeletonDef = defineComponent({ name: "Skeleton", props: z.object({ count: z.number().optional() }), description: "Loading placeholder lines", component: KumoSkeleton });
const FieldDef = defineComponent({ name: "Field", props: z.object({ label: z.string(), hint: z.string().optional(), children: z.array(z.any()) }), description: "Form field wrapper with label and hint", component: KumoField });
const DropdownMenuDef = defineComponent({ name: "DropdownMenu", props: z.object({ trigger: z.string(), items: z.array(z.any()) }), description: "Action menu triggered by button", component: KumoDropdownMenu });
const MenuItemDef = defineComponent({ name: "MenuItem", props: z.object({ label: z.string(), separator: z.boolean().optional() }), description: "Item in DropdownMenu", component: KumoMenuItem });
const DialogDef = defineComponent({ name: "Dialog", props: z.object({ title: z.string(), description: z.string().optional(), children: z.array(z.any()).optional() }), description: "Modal dialog panel", component: KumoDialog });
const DatePickerDef = defineComponent({ name: "DatePicker", props: z.object({ name: z.string(), label: z.string().optional() }), description: "Calendar date picker", component: KumoDatePicker });

const library = createLibrary({
  components: [StackDef, CardDef, TextDef, ButtonDef, BadgeDef, CalloutDef, TableDef, TableColumnDef, InputDef, SelectDef, SelectItemDef, TabsDef, TabItemDef, SwitchDef, CheckboxDef, SeparatorDef, CodeDef, ClipboardTextDef, EmptyDef, GridDef, LabelDef, LayerCardDef, LinkDef, LoaderDef, MeterDef, SensitiveInputDef, TextareaDef, RadioGroupDef, RadioItemDef, TooltipDef, CollapsibleDef, BreadcrumbsDef, BreadcrumbItemDef, PaginationDef, LinkButtonDef, SkeletonDef, FieldDef, DropdownMenuDef, MenuItemDef, DialogDef, DatePickerDef],
  componentGroups: [
    { name: "Layout", components: ["Stack", "Card", "LayerCard", "Grid", "Tabs", "TabItem", "Separator", "Collapsible", "Dialog"] },
    { name: "Content", components: ["Text", "Badge", "Callout", "Code", "ClipboardText", "Empty", "Label", "Link", "Loader", "Breadcrumbs", "BreadcrumbItem", "Tooltip", "Skeleton"] },
    { name: "Data", components: ["Table", "TableColumn", "Meter", "Pagination"] },
    { name: "Forms", components: ["Button", "LinkButton", "Input", "Textarea", "SensitiveInput", "Select", "SelectItem", "RadioGroup", "RadioItem", "Switch", "Checkbox", "Field", "DropdownMenu", "MenuItem", "DatePicker"] },
  ],
  root: "Stack",
});

export default library;
