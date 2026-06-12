import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const TEST_SPEC_DIR = resolve(import.meta.dirname, "..", ".test-specs");
const TEST_SPEC_FILE = resolve(TEST_SPEC_DIR, "spec.oui");

async function writeAndVerifySpec(spec: string) {
  await writeFile(TEST_SPEC_FILE, spec, "utf-8");
  const content = await readFile(TEST_SPEC_FILE, "utf-8");
  expect(content).toBe(spec);
  return content;
}

describe("Spec Stress Tests - Basic Components", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
  });

  it("simple text content", async () => {
    await writeAndVerifySpec(
      `root = Stack([text])\ntext = TextContent("Hello World")`
    );
  });

  it("text with markdown", async () => {
    await writeAndVerifySpec(
      `root = Stack([text])\ntext = TextContent("# Title\\n\\n**Bold** and *italic* text\\n\\n- List item 1\\n- List item 2")`
    );
  });

  it("text with size variants", async () => {
    await writeAndVerifySpec(
      `root = Stack([s, d, l, sh, lh])\ns = TextContent("Small", "small")\nd = TextContent("Default")\nl = TextContent("Large", "large")\nsh = TextContent("Small Heavy", "small-heavy")\nlh = TextContent("Large Heavy", "large-heavy")`
    );
  });

  it("card with header", async () => {
    await writeAndVerifySpec(
      `root = Stack([card])\ncard = Card([header, body])\nheader = CardHeader("Dashboard", "Welcome back")\nbody = TextContent("This is the main content area.")`
    );
  });

  it("card variants", async () => {
    await writeAndVerifySpec(
      `root = Stack([c1, c2, c3])\nc1 = Card([TextContent("Elevated")], "card")\nc2 = Card([TextContent("Recessed")], "sunk")\nc3 = Card([TextContent("Clear")], "clear")`
    );
  });

  it("nested stacks - row and column", async () => {
    await writeAndVerifySpec(
      `root = Stack([row])\nrow = Stack([col1, col2, col3], "row", "l")\ncol1 = Card([TextContent("Column 1")])\ncol2 = Card([TextContent("Column 2")])\ncol3 = Card([TextContent("Column 3")])`
    );
  });

  it("callout variants", async () => {
    await writeAndVerifySpec(
      `root = Stack([c1, c2, c3, c4])\nc1 = Callout("info", "Info", "This is informational")\nc2 = Callout("warning", "Warning", "Be careful")\nc3 = Callout("error", "Error", "Something went wrong")\nc4 = Callout("success", "Success", "Operation completed")`
    );
  });

  it("code block", async () => {
    await writeAndVerifySpec(
      `root = Stack([title, code])\ntitle = TextContent("Code Example")\ncode = CodeBlock("typescript", "function hello(name: string): string {\\n  return \\"Hello, \\" + name;\\n}")`
    );
  });

  it("separator", async () => {
    await writeAndVerifySpec(
      `root = Stack([a, sep, b])\na = TextContent("Above")\nsep = Separator()\nb = TextContent("Below")`
    );
  });

  it("markdown renderer with variant", async () => {
    await writeAndVerifySpec(
      `root = Stack([md])\nmd = MarkDownRenderer("## Markdown\\n\\nThis is rendered markdown with **formatting**.", "card")`
    );
  });
});

describe("Spec Stress Tests - Tables", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
  });

  it("simple table", async () => {
    await writeAndVerifySpec(
      `root = Stack([tbl])\ntbl = Table([Col("Name", ["Alice", "Bob", "Charlie"]), Col("Age", [30, 25, 35], "number")])`
    );
  });

  it("table with many columns", async () => {
    await writeAndVerifySpec(
      `root = Stack([title, tbl])\ntitle = TextContent("Employee Directory", "large-heavy")\ntbl = Table([nameCol, deptCol, roleCol, salaryCol, startCol])\nnameCol = Col("Name", ["Alice", "Bob", "Charlie", "Diana", "Eve"])\ndeptCol = Col("Department", ["Engineering", "Design", "Engineering", "Marketing", "Sales"])\nroleCol = Col("Role", ["Senior Dev", "Lead Designer", "Junior Dev", "VP Marketing", "Account Exec"])\nsalaryCol = Col("Salary", [150000, 130000, 85000, 160000, 95000], "number")\nstartCol = Col("Start Date", ["2020-01-15", "2019-06-01", "2023-03-10", "2018-11-20", "2022-08-05"])`
    );
  });

  it("table with 100 rows", async () => {
    const names = Array.from({ length: 100 }, (_, i) => `User_${i}`);
    const values = Array.from({ length: 100 }, (_, i) => i * 10);
    const statuses = Array.from({ length: 100 }, (_, i) => i % 2 === 0 ? "active" : "inactive");
    await writeAndVerifySpec(
      `root = Stack([tbl])\ntbl = Table([Col("Name", ${JSON.stringify(names)}), Col("Value", ${JSON.stringify(values)}, "number"), Col("Status", ${JSON.stringify(statuses)})])`
    );
  });
});

describe("Spec Stress Tests - Charts", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
  });

  it("bar chart - single series", async () => {
    await writeAndVerifySpec(
      `root = Stack([title, chart])\ntitle = TextContent("Monthly Revenue", "large-heavy")\nchart = BarChart(["Jan", "Feb", "Mar", "Apr", "May", "Jun"], [s1])\ns1 = Series("Revenue", [12000, 15000, 18000, 14000, 21000, 19000])`
    );
  });

  it("bar chart - multiple series grouped", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = BarChart(["Q1", "Q2", "Q3", "Q4"], [s1, s2, s3], "grouped")\ns1 = Series("Product A", [120, 150, 180, 200])\ns2 = Series("Product B", [90, 110, 140, 160])\ns3 = Series("Product C", [60, 80, 100, 130])`
    );
  });

  it("bar chart - stacked", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = BarChart(["Mon", "Tue", "Wed", "Thu", "Fri"], [s1, s2], "stacked", "Day", "Hours")\ns1 = Series("Work", [8, 7, 9, 8, 6])\ns2 = Series("Break", [1, 1.5, 1, 1, 2])`
    );
  });

  it("line chart - natural curve", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = LineChart(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], [s1, s2], "natural")\ns1 = Series("2024", [10, 15, 13, 17, 20, 25, 30, 28, 22, 18, 14, 12])\ns2 = Series("2025", [12, 18, 16, 20, 24, 29, 35, 32, 26, 21, 17, 15])`
    );
  });

  it("area chart", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = AreaChart(["Week 1", "Week 2", "Week 3", "Week 4"], [s1, s2], "natural")\ns1 = Series("Users", [1000, 1500, 2200, 3100])\ns2 = Series("Sessions", [2500, 3800, 5500, 7200])`
    );
  });

  it("pie chart", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = PieChart(["Chrome", "Firefox", "Safari", "Edge", "Other"], [65, 12, 10, 8, 5], "donut")`
    );
  });

  it("radar chart", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = RadarChart(["Speed", "Reliability", "Comfort", "Safety", "Efficiency"], [s1, s2])\ns1 = Series("Car A", [80, 90, 70, 95, 85])\ns2 = Series("Car B", [70, 85, 90, 80, 75])`
    );
  });

  it("horizontal bar chart", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = HorizontalBarChart(["Python", "JavaScript", "TypeScript", "Go", "Rust"], [s1])\ns1 = Series("Popularity", [92, 88, 76, 65, 58])`
    );
  });

  it("scatter chart", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = ScatterChart([ds1, ds2], "Height (cm)", "Weight (kg)")\nds1 = ScatterSeries("Male", [Point(170, 70), Point(175, 80), Point(180, 85), Point(165, 65), Point(185, 90)])\nds2 = ScatterSeries("Female", [Point(160, 55), Point(165, 60), Point(155, 50), Point(170, 65), Point(162, 58)])`
    );
  });

  it("radial chart", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = RadialChart(["Complete", "In Progress", "Pending"], [75, 45, 20])`
    );
  });

  it("single stacked bar", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = SingleStackedBarChart(["Frontend", "Backend", "DevOps", "Design"], [35, 30, 20, 15])`
    );
  });
});

describe("Spec Stress Tests - Forms", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
  });

  it("simple form with input", async () => {
    await writeAndVerifySpec(
      `root = Stack([form])\nform = Form("login", btns, [emailField, passField])\nemailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))\npassField = FormControl("Password", Input("password", "Enter password", "password", { required: true, minLength: 8 }))\nbtns = Buttons([Button("Sign In", Action([@ToAssistant("login")]), "primary")])`
    );
  });

  it("form with all input types", async () => {
    await writeAndVerifySpec(
      `root = Stack([form])\nform = Form("all-inputs", btns, [f1, f2, f3, f4, f5, f6, f7, f8])\nf1 = FormControl("Name", Input("name", "Your name", "text", { required: true }))\nf2 = FormControl("Email", Input("email", "you@example.com", "email", { email: true }))\nf3 = FormControl("Bio", TextArea("bio", "Tell us about yourself", 4))\nf4 = FormControl("Country", Select("country", [SelectItem("us", "United States"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")], "Choose..."))\nf5 = FormControl("Start Date", DatePicker("start", "single"))\nf6 = FormControl("Budget", Slider("budget", "continuous", 0, 10000, 500))\nf7 = FormControl("Interests", CheckBoxGroup("interests", [CheckBoxItem("Tech", "Technology news", "tech"), CheckBoxItem("Sports", "Sports updates", "sports")]))\nf8 = FormControl("Priority", RadioGroup("priority", [RadioItem("Low", "Not urgent", "low"), RadioItem("High", "Urgent", "high")], "low"))\nbtns = Buttons([Button("Submit", Action([@ToAssistant("submit")]), "primary"), Button("Cancel", Action([@ToAssistant("cancel")]), "secondary")])`
    );
  });

  it("form with validation rules", async () => {
    await writeAndVerifySpec(
      `root = Stack([form])\nform = Form("validated", btns, [f1, f2, f3, f4])\nf1 = FormControl("Username", Input("username", "3-20 chars", "text", { required: true, minLength: 3, maxLength: 20 }), "Must be 3-20 characters")\nf2 = FormControl("Website", Input("url", "https://...", "url", { url: true }))\nf3 = FormControl("Age", Input("age", "18+", "number", { required: true, min: 18, max: 120 }))\nf4 = FormControl("Phone", Input("phone", "+1...", "text", { pattern: "^\\\\+[0-9]{10,15}$" }))\nbtns = Buttons([Button("Register", Action([@ToAssistant("register")]), "primary")])`
    );
  });

  it("switch group", async () => {
    await writeAndVerifySpec(
      `root = Stack([card])\ncard = Card([header, switches])\nheader = CardHeader("Notification Settings")\nswitches = SwitchGroup("notifications", [SwitchItem("Email notifications", "Receive updates via email", "email", true), SwitchItem("SMS alerts", "Get text message alerts", "sms"), SwitchItem("Push notifications", "Browser push notifications", "push", true)], "card")`
    );
  });
});

describe("Spec Stress Tests - Layout Components", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
  });

  it("tabs with mixed content", async () => {
    await writeAndVerifySpec(
      `root = Stack([tabs])\ntabs = Tabs([tab1, tab2, tab3])\ntab1 = TabItem("overview", "Overview", [TextContent("## Overview\\n\\nThis is the main overview section.")])\ntab2 = TabItem("chart", "Analytics", [BarChart(["Mon", "Tue", "Wed"], [Series("Views", [100, 150, 120])])])\ntab3 = TabItem("table", "Data", [Table([Col("Day", ["Mon", "Tue", "Wed"]), Col("Views", [100, 150, 120], "number")])])`
    );
  });

  it("accordion", async () => {
    await writeAndVerifySpec(
      `root = Stack([acc])\nacc = Accordion([a1, a2, a3])\na1 = AccordionItem("faq1", "What is OpenUI?", [TextContent("OpenUI is a generative UI framework.")])\na2 = AccordionItem("faq2", "How does it work?", [TextContent("LLMs generate OpenUI Lang specs that render as React components.")])\na3 = AccordionItem("faq3", "Is it free?", [TextContent("Yes, OpenUI is open source.")])`
    );
  });

  it("steps component", async () => {
    await writeAndVerifySpec(
      `root = Stack([title, steps])\ntitle = TextContent("Getting Started", "large-heavy")\nsteps = Steps([StepsItem("Install", "Run npm install @openuidev/react-ui"), StepsItem("Configure", "Set up your component library"), StepsItem("Generate", "Use an LLM to generate UI specs"), StepsItem("Render", "Display the UI in your app")])`
    );
  });

  it("grid layout with wrap", async () => {
    await writeAndVerifySpec(
      `root = Stack([grid])\ngrid = Stack([c1, c2, c3, c4, c5, c6], "row", "m", "start", "start", true)\nc1 = Card([TextContent("Card 1")])\nc2 = Card([TextContent("Card 2")])\nc3 = Card([TextContent("Card 3")])\nc4 = Card([TextContent("Card 4")])\nc5 = Card([TextContent("Card 5")])\nc6 = Card([TextContent("Card 6")])`
    );
  });

  it("deeply nested layout", async () => {
    await writeAndVerifySpec(
      `root = Stack([header, body, footer])\nheader = Card([CardHeader("My App", "v1.0.0")])\nbody = Stack([sidebar, main], "row", "l")\nsidebar = Card([TextContent("## Navigation\\n\\n- Home\\n- About\\n- Contact")])\nmain = Stack([topRow, content])\ntopRow = Stack([kpi1, kpi2, kpi3], "row", "m")\nkpi1 = Card([TextContent("Users", "small"), TextContent("1,234", "large-heavy")])\nkpi2 = Card([TextContent("Revenue", "small"), TextContent("$45,678", "large-heavy")])\nkpi3 = Card([TextContent("Growth", "small"), TextContent("+12%", "large-heavy")])\ncontent = Card([TextContent("Main content area with detailed information.")])\nfooter = Card([TextContent("© 2025 My App", "small")], "sunk")`
    );
  });
});

describe("Spec Stress Tests - Complex Dashboards", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
  });

  it("full analytics dashboard", async () => {
    const spec = `root = Stack([header, kpis, charts, tableSection])
header = CardHeader("Analytics Dashboard", "Last 30 days")
kpis = Stack([kpi1, kpi2, kpi3, kpi4], "row", "m")
kpi1 = Card([TextContent("Total Users", "small"), TextContent("12,453", "large-heavy")])
kpi2 = Card([TextContent("Active Sessions", "small"), TextContent("3,891", "large-heavy")])
kpi3 = Card([TextContent("Conversion Rate", "small"), TextContent("4.2%", "large-heavy")])
kpi4 = Card([TextContent("Revenue", "small"), TextContent("$128,900", "large-heavy")])
charts = Stack([chartLeft, chartRight], "row", "l")
chartLeft = Card([CardHeader("Traffic Trend"), LineChart(months, [s1, s2], "natural")])
chartRight = Card([CardHeader("Traffic Sources"), PieChart(sources, sourceValues, "donut")])
months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
s1 = Series("Organic", [4000, 4500, 5200, 4800, 6100, 7000])
s2 = Series("Paid", [2000, 2200, 2800, 3100, 3500, 4000])
sources = ["Direct", "Organic", "Social", "Referral", "Email"]
sourceValues = [30, 35, 15, 12, 8]
tableSection = Card([CardHeader("Top Pages"), tbl])
tbl = Table([Col("Page", ["/home", "/pricing", "/docs", "/blog", "/about"]), Col("Views", [45000, 32000, 28000, 21000, 15000], "number"), Col("Bounce Rate", ["32%", "45%", "28%", "52%", "38%"])])`;
    await writeAndVerifySpec(spec);
  });

  it("CRM dashboard with mixed components", async () => {
    const spec = `root = Stack([header, content])
header = Card([CardHeader("Sales CRM", "Q4 2025")])
content = Stack([leftCol, rightCol], "row", "l")
leftCol = Stack([pipeline, recentDeals])
pipeline = Card([CardHeader("Pipeline"), BarChart(stages, [dealSeries], "grouped")])
stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed"]
dealSeries = Series("Deals", [45, 32, 18, 12, 8])
recentDeals = Card([CardHeader("Recent Deals"), dealsTable])
dealsTable = Table([Col("Company", ["Acme Corp", "TechStart", "BigCo", "SmallBiz", "MegaCorp"]), Col("Value", [50000, 25000, 150000, 8000, 300000], "number"), Col("Stage", ["Proposal", "Lead", "Closed", "Qualified", "Negotiation"])])
rightCol = Stack([stats, activities])
stats = Card([CardHeader("This Month"), Stack([stat1, stat2, stat3])])
stat1 = TextContent("**New Leads:** 127")
stat2 = TextContent("**Deals Closed:** 8")
stat3 = TextContent("**Revenue:** $433,000")
activities = Card([CardHeader("Activity Feed"), TextContent("- Called Acme Corp re: proposal\\n- Email sent to TechStart\\n- Meeting scheduled with BigCo\\n- Follow-up with MegaCorp\\n- Demo for SmallBiz completed")])`;
    await writeAndVerifySpec(spec);
  });

  it("form + chart + table combined", async () => {
    const spec = `root = Stack([filterForm, results])
filterForm = Card([CardHeader("Filters"), form])
form = Form("filters", filterBtns, [dateField, categoryField])
dateField = FormControl("Date Range", DatePicker("dateRange", "range"))
categoryField = FormControl("Category", Select("category", [SelectItem("all", "All"), SelectItem("tech", "Technology"), SelectItem("health", "Healthcare"), SelectItem("finance", "Finance")], "Select category"))
filterBtns = Buttons([Button("Apply", Action([@ToAssistant("apply filters")]), "primary"), Button("Reset", Action([@ToAssistant("reset")]), "tertiary")])
results = Stack([chartCard, tableCard])
chartCard = Card([CardHeader("Trend"), AreaChart(["W1", "W2", "W3", "W4", "W5", "W6"], [Series("Revenue", [12000, 14500, 13800, 16200, 18000, 21000]), Series("Costs", [8000, 8500, 9200, 9000, 9800, 10500])], "natural")])
tableCard = Card([CardHeader("Details"), Table([Col("Week", ["W1", "W2", "W3", "W4", "W5", "W6"]), Col("Revenue", [12000, 14500, 13800, 16200, 18000, 21000], "number"), Col("Costs", [8000, 8500, 9200, 9000, 9800, 10500], "number"), Col("Profit", [4000, 6000, 4600, 7200, 8200, 10500], "number")])])`; 
    await writeAndVerifySpec(spec);
  });

  it("state variables and conditional rendering", async () => {
    const spec = `$showDetails = false
$selectedTab = "overview"
root = Stack([header, toggleBtn, content])
header = TextContent("# Interactive Dashboard", "large-heavy")
toggleBtn = Buttons([Button("Toggle Details", Action([@Set($showDetails, true)]), "secondary")])
content = $showDetails ? Card([TextContent("Detailed view is active"), Table([Col("Metric", ["CPU", "Memory", "Disk"]), Col("Usage", [72, 85, 45], "number")])]) : Card([TextContent("Click toggle to see details")])`;
    await writeAndVerifySpec(spec);
  });

  it("modal with form", async () => {
    const spec = `$showModal = false
root = Stack([header, openBtn, modal])
header = TextContent("# User Management", "large-heavy")
openBtn = Buttons([Button("Add User", Action([@Set($showModal, true)]), "primary")])
modal = Modal("Add New User", $showModal, [modalForm], "md")
modalForm = Form("addUser", modalBtns, [nameField, emailField, roleField])
nameField = FormControl("Full Name", Input("name", "John Doe", "text", { required: true }))
emailField = FormControl("Email", Input("email", "john@example.com", "email", { required: true, email: true }))
roleField = FormControl("Role", Select("role", [SelectItem("admin", "Admin"), SelectItem("editor", "Editor"), SelectItem("viewer", "Viewer")], "Select role", { required: true }))
modalBtns = Buttons([Button("Save", Action([@ToAssistant("save user"), @Set($showModal, false)]), "primary"), Button("Cancel", Action([@Set($showModal, false)]), "secondary")])`;
    await writeAndVerifySpec(spec);
  });

  it("maximum complexity - kitchen sink", async () => {
    const spec = `$activeSection = "dashboard"
$showCreateModal = false
$filterStatus = "all"
root = Stack([nav, main])
nav = Card([Stack([logo, navBtns], "row", "l", "center", "between")], "sunk")
logo = TextContent("**Enterprise App**", "large-heavy")
navBtns = Buttons([Button("Dashboard", Action([@Set($activeSection, "dashboard")])), Button("Analytics", Action([@Set($activeSection, "analytics")])), Button("Settings", Action([@Set($activeSection, "settings")]))])
main = Stack([topBar, dashboard, createModal])
topBar = Stack([TextContent("Welcome back, Admin"), Buttons([Button("+ Create", Action([@Set($showCreateModal, true)]), "primary")])], "row", "m", "center", "between")
dashboard = Stack([kpiRow, chartsRow, tableSection])
kpiRow = Stack([kpi1, kpi2, kpi3, kpi4, kpi5], "row", "m")
kpi1 = Card([TextContent("Users", "small"), TextContent("45,231", "large-heavy")])
kpi2 = Card([TextContent("Orders", "small"), TextContent("8,492", "large-heavy")])
kpi3 = Card([TextContent("Revenue", "small"), TextContent("$2.4M", "large-heavy")])
kpi4 = Card([TextContent("Growth", "small"), TextContent("+18.2%", "large-heavy")])
kpi5 = Card([TextContent("Satisfaction", "small"), TextContent("4.8/5", "large-heavy")])
chartsRow = Stack([leftChart, middleChart, rightChart], "row", "m")
leftChart = Card([CardHeader("Revenue Trend"), LineChart(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], [Series("2024", [180, 200, 220, 210, 250, 280, 310, 290, 320, 350, 380, 420]), Series("2025", [220, 250, 270, 260, 300, 340, 380, 360, 400, 440, 480, 520])], "natural")])
middleChart = Card([CardHeader("Category Split"), PieChart(["Electronics", "Clothing", "Food", "Books", "Other"], [35, 25, 20, 12, 8], "donut")])
rightChart = Card([CardHeader("Performance"), RadarChart(["Speed", "Quality", "Support", "Price", "Features"], [Series("Us", [90, 85, 88, 70, 92]), Series("Competitor", [75, 80, 72, 85, 78])])])
tableSection = Card([CardHeader("Recent Orders"), filterRow, ordersTable])
filterRow = Stack([FormControl("Status", Select("status", [SelectItem("all", "All"), SelectItem("pending", "Pending"), SelectItem("shipped", "Shipped"), SelectItem("delivered", "Delivered")]))], "row")
ordersTable = Table([Col("Order ID", ["ORD-001", "ORD-002", "ORD-003", "ORD-004", "ORD-005", "ORD-006", "ORD-007", "ORD-008"]), Col("Customer", ["Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince", "Eve Wilson", "Frank Miller", "Grace Lee", "Henry Ford"]), Col("Amount", [299, 549, 129, 899, 449, 199, 749, 349], "number"), Col("Status", ["Delivered", "Shipped", "Pending", "Delivered", "Shipped", "Pending", "Delivered", "Shipped"])])
createModal = Modal("Create Order", $showCreateModal, [createForm], "lg")
createForm = Form("createOrder", createBtns, [custField, productField, qtyField, notesField])
custField = FormControl("Customer", Input("customer", "Customer name", "text", { required: true }))
productField = FormControl("Product", Select("product", [SelectItem("laptop", "Laptop Pro"), SelectItem("phone", "SmartPhone X"), SelectItem("tablet", "Tablet Air"), SelectItem("watch", "Smart Watch")], "Select product", { required: true }))
qtyField = FormControl("Quantity", Slider("quantity", "discrete", 1, 100, 1))
notesField = FormControl("Notes", TextArea("notes", "Special instructions...", 3))
createBtns = Buttons([Button("Create Order", Action([@ToAssistant("create order"), @Set($showCreateModal, false)]), "primary"), Button("Cancel", Action([@Set($showCreateModal, false)]), "secondary")])`;
    await writeAndVerifySpec(spec);
    expect(spec.length).toBeGreaterThan(3000);
  });
});

describe("Spec Stress Tests - Edge Cases", () => {
  beforeAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
    await mkdir(TEST_SPEC_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_SPEC_DIR)) await rm(TEST_SPEC_DIR, { recursive: true });
  });

  it("escaped quotes in strings", async () => {
    await writeAndVerifySpec(
      `root = Stack([text])\ntext = TextContent("He said \\"hello\\" and she said \\"goodbye\\"")`
    );
  });

  it("newlines in strings", async () => {
    await writeAndVerifySpec(
      `root = Stack([text])\ntext = TextContent("Line 1\\nLine 2\\nLine 3\\n\\nParagraph 2")`
    );
  });

  it("empty arrays", async () => {
    await writeAndVerifySpec(
      `root = Stack([])`
    );
  });

  it("numeric edge values in chart", async () => {
    await writeAndVerifySpec(
      `root = Stack([chart])\nchart = BarChart(["Zero", "Negative", "Large", "Decimal"], [Series("Values", [0, -50, 999999, 3.14159])])`
    );
  });

  it("very long string content", async () => {
    const longText = "A".repeat(5000);
    await writeAndVerifySpec(
      `root = Stack([text])\ntext = TextContent("${longText}")`
    );
  });

  it("many components at same level", async () => {
    const items = Array.from({ length: 50 }, (_, i) => `t${i}`);
    const defs = items.map(name => `${name} = TextContent("Item ${name}")`);
    await writeAndVerifySpec(
      `root = Stack([${items.join(", ")}])\n${defs.join("\n")}`
    );
  });

  it("deeply nested cards", async () => {
    await writeAndVerifySpec(
      `root = Stack([level1])\nlevel1 = Card([TextContent("Level 1"), level2])\nlevel2 = Card([TextContent("Level 2"), level3])\nlevel3 = Card([TextContent("Level 3"), level4])\nlevel4 = Card([TextContent("Level 4"), level5])\nlevel5 = Card([TextContent("Level 5 - deepest")])`
    );
  });

  it("multiple state variables", async () => {
    await writeAndVerifySpec(
      `$count = 0\n$name = ""\n$isActive = true\n$items = ["a", "b", "c"]\n$config = { theme: "dark", lang: "en" }\nroot = Stack([TextContent("State test")])`
    );
  });

  it("rapid sequential writes", async () => {
    for (let i = 0; i < 20; i++) {
      await writeFile(TEST_SPEC_FILE, `root = Stack([t])\nt = TextContent("Iteration ${i}")`, "utf-8");
    }
    const final = await readFile(TEST_SPEC_FILE, "utf-8");
    expect(final).toContain("Iteration 19");
  });
});
