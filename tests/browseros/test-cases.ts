export interface Assertion {
  type: "text-visible" | "text-not-visible" | "element-count" | "api-response";
  text?: string;
  selector?: string;
  count?: number;
  endpoint?: string;
  field?: string;
  value?: unknown;
}

export interface TestCase {
  name: string;
  spec: string;
  library?: string;
  assertions: Assertion[];
}

export const testCases: TestCase[] = [
  {
    name: "empty state shows placeholder",
    spec: "",
    assertions: [
      { type: "text-visible", text: "Waiting for spec" },
    ],
  },
  {
    name: "basic text renders",
    spec: 'root = Stack([t])\nt = TextContent("Hello E2E")',
    assertions: [
      { type: "text-visible", text: "Hello E2E" },
      { type: "text-not-visible", text: "Waiting for spec" },
    ],
  },
  {
    name: "card with header renders",
    spec: 'root = Stack([card])\ncard = Card([header, body])\nheader = CardHeader("Dashboard", "Welcome")\nbody = TextContent("Content here")',
    assertions: [
      { type: "text-visible", text: "Dashboard" },
      { type: "text-visible", text: "Welcome" },
      { type: "text-visible", text: "Content here" },
    ],
  },
  {
    name: "table renders with data",
    spec: 'root = Stack([tbl])\ntbl = Table([Col("Name", ["Alice", "Bob"]), Col("Score", [95, 87], "number")])',
    assertions: [
      { type: "text-visible", text: "Alice" },
      { type: "text-visible", text: "Bob" },
      { type: "text-visible", text: "95" },
    ],
  },
  {
    name: "bar chart renders",
    spec: 'root = Stack([chart])\nchart = BarChart(["Mon", "Tue", "Wed"], [Series("Views", [100, 200, 150])])',
    assertions: [
      { type: "text-visible", text: "Mon" },
      { type: "text-visible", text: "Views" },
    ],
  },
  {
    name: "form renders inputs",
    spec: 'root = Stack([form])\nform = Form("test", btns, [f1, f2])\nf1 = FormControl("Name", Input("name", "Enter name"))\nf2 = FormControl("Email", Input("email", "you@example.com", "email"))\nbtns = Buttons([Button("Submit", Action([@ToAssistant("submit")]), "primary")])',
    assertions: [
      { type: "text-visible", text: "Name" },
      { type: "text-visible", text: "Email" },
      { type: "text-visible", text: "Submit" },
    ],
  },
  {
    name: "spec update replaces content",
    spec: 'root = Stack([t])\nt = TextContent("Version Two")',
    assertions: [
      { type: "text-visible", text: "Version Two" },
    ],
  },
  {
    name: "complex dashboard renders",
    spec: `root = Stack([header, kpis, chart])
header = CardHeader("Dashboard", "E2E Test")
kpis = Stack([kpi1, kpi2], "row", "m")
kpi1 = Card([TextContent("Users", "small"), TextContent("1,234", "large-heavy")])
kpi2 = Card([TextContent("Revenue", "small"), TextContent("$56K", "large-heavy")])
chart = Card([BarChart(["Q1", "Q2", "Q3"], [Series("Sales", [10, 20, 30])])])`,
    assertions: [
      { type: "text-visible", text: "Dashboard" },
      { type: "text-visible", text: "1,234" },
      { type: "text-visible", text: "$56K" },
      { type: "text-visible", text: "Q1" },
    ],
  },
  {
    name: "error boundary on invalid component",
    spec: 'root = Stack([item])\nitem = FakeComponent("broken")',
    assertions: [
      { type: "text-visible", text: "FakeComponent" },
    ],
  },
  {
    name: "recovery from error",
    spec: 'root = Stack([t])\nt = TextContent("Recovered")',
    assertions: [
      { type: "text-visible", text: "Recovered" },
      { type: "text-not-visible", text: "Render Error" },
    ],
  },
  {
    name: "callout renders",
    spec: 'root = Stack([c])\nc = Callout("success", "Done", "Operation completed")',
    assertions: [
      { type: "text-visible", text: "Done" },
      { type: "text-visible", text: "Operation completed" },
    ],
  },
  {
    name: "tabs render",
    spec: 'root = Stack([tabs])\ntabs = Tabs([tab1, tab2])\ntab1 = TabItem("t1", "Overview", [TextContent("Overview content")])\ntab2 = TabItem("t2", "Details", [TextContent("Details content")])',
    assertions: [
      { type: "text-visible", text: "Overview" },
      { type: "text-visible", text: "Details" },
    ],
  },
  {
    name: "library info endpoint returns correct id",
    spec: "",
    assertions: [
      { type: "api-response", endpoint: "/api/library-info", field: "id", value: "openui-default" },
    ],
  },
  {
    name: "kanban board renders all columns",
    spec: `root = Stack([board], "row", "m")
board = Stack([col1, col2, col3], "row", "m")
col1 = Card([TextContent("To Do", "large-heavy"), Card([TextContent("Task 1")], "sunk")])
col2 = Card([TextContent("In Progress", "large-heavy"), Card([TextContent("Task 2")], "sunk")])
col3 = Card([TextContent("Done", "large-heavy"), Card([TextContent("Task 3")], "sunk")])`,
    assertions: [
      { type: "text-visible", text: "To Do" },
      { type: "text-visible", text: "In Progress" },
      { type: "text-visible", text: "Done" },
      { type: "text-visible", text: "Task 1" },
    ],
  },
];
