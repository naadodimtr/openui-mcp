import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SPECS_DIR = join(import.meta.dir, "..", "tests", "e2e", "specs");

if (!existsSync(SPECS_DIR)) mkdirSync(SPECS_DIR, { recursive: true });

const { openuiLibrary } = await import("@openuidev/react-ui/genui-lib");

const specGenerators: Record<string, (name: string) => string | null> = {
  Stack: () => `root = Stack([TextContent("Stack test")])`,
  Card: () => `root = Stack([card])\ncard = Card([TextContent("Card content")])`,
  CardHeader: () => `root = Stack([card])\ncard = Card([CardHeader("Title", "Subtitle")])`,
  TextContent: () => `root = Stack([t])\nt = TextContent("Text content test", "large")`,
  MarkDownRenderer: () => `root = Stack([md])\nmd = MarkDownRenderer("**Bold** and *italic*", "card")`,
  Callout: () => `root = Stack([c])\nc = Callout("info", "Info Title", "Info description")`,
  TextCallout: () => `root = Stack([c])\nc = TextCallout("warning", "Warning", "Be careful")`,
  CodeBlock: () => `root = Stack([c])\nc = CodeBlock("javascript", "const x = 1;")`,
  Image: () => null,
  ImageBlock: () => null,
  ImageGallery: () => null,
  Table: () => `root = Stack([t])\nt = Table([Col("A", ["x", "y"]), Col("B", [1, 2], "number")])`,
  Col: () => null,
  BarChart: () => `root = Stack([c])\nc = BarChart(["A", "B"], [Series("S1", [10, 20])])`,
  LineChart: () => `root = Stack([c])\nc = LineChart(["A", "B", "C"], [Series("S1", [10, 20, 15])], "natural")`,
  AreaChart: () => `root = Stack([c])\nc = AreaChart(["A", "B"], [Series("S1", [10, 20])], "natural")`,
  RadarChart: () => `root = Stack([c])\nc = RadarChart(["X", "Y", "Z"], [Series("S1", [80, 60, 90])])`,
  HorizontalBarChart: () => `root = Stack([c])\nc = HorizontalBarChart(["A", "B"], [Series("S1", [30, 50])])`,
  PieChart: () => `root = Stack([c])\nc = PieChart(["Slice1", "Slice2"], [60, 40], "donut")`,
  RadialChart: () => `root = Stack([c])\nc = RadialChart(["A", "B"], [70, 30])`,
  SingleStackedBarChart: () => `root = Stack([c])\nc = SingleStackedBarChart(["A", "B", "C"], [40, 35, 25])`,
  ScatterChart: () => `root = Stack([c])\nc = ScatterChart([ScatterSeries("Data", [Point(1, 2), Point(3, 4)])])`,
  Series: () => null,
  ScatterSeries: () => null,
  Point: () => null,
  Slice: () => null,
  Form: () => `root = Stack([f])\nf = Form("test", Buttons([Button("Go")]), [FormControl("Name", Input("name", "Enter"))])`,
  FormControl: () => null,
  Label: () => `root = Stack([l])\nl = Label("Test Label")`,
  Input: () => null,
  TextArea: () => null,
  Select: () => null,
  SelectItem: () => null,
  DatePicker: () => null,
  Slider: () => null,
  CheckBoxGroup: () => null,
  CheckBoxItem: () => null,
  RadioGroup: () => null,
  RadioItem: () => null,
  SwitchGroup: () => `root = Stack([s])\ns = SwitchGroup("prefs", [SwitchItem("Option A", "Description", "a", true), SwitchItem("Option B", "Description", "b")])`,
  SwitchItem: () => null,
  Button: () => `root = Stack([b])\nb = Buttons([Button("Click Me", Action([@ToAssistant("clicked")]), "primary")])`,
  Buttons: () => null,
  TagBlock: () => `root = Stack([t])\nt = TagBlock(["tag1", "tag2", "tag3"])`,
  Tag: () => null,
  Tabs: () => `root = Stack([t])\nt = Tabs([TabItem("a", "Tab A", [TextContent("Content A")]), TabItem("b", "Tab B", [TextContent("Content B")])])`,
  TabItem: () => null,
  Accordion: () => `root = Stack([a])\na = Accordion([AccordionItem("s1", "Section 1", [TextContent("Content 1")]), AccordionItem("s2", "Section 2", [TextContent("Content 2")])])`,
  AccordionItem: () => null,
  Steps: () => `root = Stack([s])\ns = Steps([StepsItem("Step 1", "Do this"), StepsItem("Step 2", "Then that")])`,
  StepsItem: () => null,
  Carousel: () => null,
  Separator: () => `root = Stack([TextContent("Above"), Separator(), TextContent("Below")])`,
  Modal: () => null,
};

let generated = 0;
let skipped = 0;

for (const [name] of Object.entries(openuiLibrary.components || {})) {
  const generator = specGenerators[name];
  if (generator) {
    const spec = generator(name);
    if (spec) {
      writeFileSync(join(SPECS_DIR, `${name}.oui`), spec, "utf-8");
      generated++;
    } else {
      skipped++;
    }
  } else {
    const fallback = `root = Stack([TextContent("${name} component test")])`;
    writeFileSync(join(SPECS_DIR, `${name}.oui`), fallback, "utf-8");
    generated++;
  }
}

console.log(`Generated ${generated} E2E spec files, skipped ${skipped} sub-components`);
