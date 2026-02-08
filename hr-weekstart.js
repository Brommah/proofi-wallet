const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, PageBreak
} = require("docx");

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const headerFill = { fill: "1a1a2e", type: ShadingType.CLEAR };
const altRowFill = { fill: "F7F7FA", type: ShadingType.CLEAR };

function makeCell(text, opts = {}) {
  const { bold, width, shading, color, size } = opts;
  return new TableCell({
    borders: cellBorders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shading || undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, bold: !!bold, size: size || 20, font: "Arial", color: color || "333333" })]
    })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 44, bold: true, color: "1a1a2e", font: "Arial" },
        paragraph: { spacing: { before: 0, after: 200 } } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: "1a1a2e", font: "Arial" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: "333355", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-actions", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "INTERNAL \u2014 HR/Charlie Team", size: 18, color: "999999", font: "Arial", italics: true })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", size: 18, color: "999999" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" }),
          new TextRun({ text: " of ", size: 18, color: "999999" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "999999" })
        ]
      })] })
    },
    children: [
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("HR / Recruiting \u2014 Week Start")] }),
      new Paragraph({ spacing: { after: 60 }, children: [
        new TextRun({ text: "February 2, 2026 \u2014 Prepared by Martijn Broersma", size: 22, color: "666666", italics: true })
      ]}),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun({ text: "Extracted from Fred meetings Jan 30, Jan 31, and Feb 1. Agenda for weekstart with Fred, Valery & Lynn.", size: 22, color: "555555" })
      ]}),

      // SECTION 1: FRED'S DIRECTIVES
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Fred\u2019s Key Directives")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1. Lynn = Primary Dashboard User")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Dashboard must be enforced to Lynn. Not anyone else.")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Once Lynn is on the hook and knows what to do \u2192 Val comes in to check and verify")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Lynn needs to own the daily process end-to-end")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun({ text: "Fred: ", bold: true, italics: true }), new TextRun({ text: "\"Dashboard must be enforced to Lynn. Not anyone else.\"", italics: true })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2. Valery\u2019s Role")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Val needs to iterate on the interviewing script and deliver something")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Val checks/verifies after Lynn is running")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun({ text: "Fred: ", bold: true, italics: true }), new TextRun({ text: "\"Bridge whatever exceptions that need to happen.\"", italics: true })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3. Mart\u2019s Two Priorities")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun({ text: "Outbound + Filters: ", bold: true }), new TextRun("\"How do we know who we\u2019re looking for? How do we know someone fits?\" \u2014 targeting needs refinement, already decent enough, just need to run campaigns and look at results")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun({ text: "Automated Interview Feedback: ", bold: true }), new TextRun("Hook into system that processes interview feedback automatically. Make sure it\u2019s used and enforced to Lynn.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4. Candidate Profile (AI Roles)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Veteran who doesn\u2019t put up with BS, built substantial/robust systems at scale")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Consumer app architects or lead devs who built at scale")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Mid-level who builds good apps end-to-end, fast")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Hustle/drive is critical \u2014 incorporate into scoring prompt")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun({ text: "Fred: ", bold: true, italics: true }), new TextRun({ text: "\"We don\u2019t need recruiters anymore. You\u2019re building a system.\"", italics: true })
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5. Key Candidates")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Follow up on key candidates all week, make sure system works, nothing slips through cracks, gets to Fred ASAP")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [
        new TextRun("Improve prompts daily with feedback from sessions")
      ]}),

      // SECTION 2: WEEKSTART AGENDA
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Weekstart Agenda \u2014 Fred, Valery & Lynn")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1. Lynn Dashboard Onboarding")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Is Lynn using the dashboard daily? What\u2019s blocking her?")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Walk through the workflow: what she sees, what she does, what escalates to Fred")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun({ text: "Success criteria: ", bold: true }), new TextRun("Lynn independently uses the system every day this week without being prompted")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2. Valery Interview Script")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Status on standardized interview template")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("What iteration is it on? What feedback has been incorporated?")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun({ text: "Success criteria: ", bold: true }), new TextRun("Working template delivered and tested on at least 2 candidates this week")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3. Pipeline Status")] }),
      new Table({
        columnWidths: [4200, 1200, 3960],
        rows: [
          new TableRow({ tableHeader: true, children: [
            makeCell("Stage", { bold: true, width: 4200, shading: headerFill, color: "FFFFFF" }),
            makeCell("Count", { bold: true, width: 1200, shading: headerFill, color: "FFFFFF" }),
            makeCell("Key Names", { bold: true, width: 3960, shading: headerFill, color: "FFFFFF" }),
          ]}),
          new TableRow({ children: [
            makeCell("CEO Interview", { width: 4200 }),
            makeCell("3", { width: 1200 }),
            makeCell("Yeonseok Kim (\u2705 enthusiastic yes), Fanley (\u274C pass), Pranav B (\u274C pass)", { width: 3960 }),
          ]}),
          new TableRow({ children: [
            makeCell("HM CV Screening", { width: 4200, shading: altRowFill }),
            makeCell("5", { width: 1200, shading: altRowFill }),
            makeCell("Pranav Marla (conditional screen), Udit (yes + validate), Rohit (screen), Pavan (screen w/ drive focus)", { width: 3960, shading: altRowFill }),
          ]}),
          new TableRow({ children: [
            makeCell("Initial Evaluation Call", { width: 4200 }),
            makeCell("~6", { width: 1200 }),
            makeCell("Candidates needing scheduling with Val/Sergey", { width: 3960 }),
          ]}),
          new TableRow({ children: [
            makeCell("ASE", { width: 4200, shading: altRowFill }),
            makeCell("4", { width: 1200, shading: altRowFill }),
            makeCell("Under automated screening evaluation", { width: 3960, shading: altRowFill }),
          ]}),
          new TableRow({ children: [
            makeCell("Trial Period", { width: 4200 }),
            makeCell("1", { width: 1200 }),
            makeCell("Karthik", { width: 3960 }),
          ]}),
        ]
      }),
      new Paragraph({ spacing: { before: 80, after: 120 }, children: [
        new TextRun({ text: "Note: ", bold: true }), new TextRun("Fred\u2019s weekend feedback has been processed. Lynn tagged on all 5 actionable candidates in Notion with specific instructions.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4. AI Scoring Alignment")] }),
      new Table({
        columnWidths: [2400, 1200, 1200, 4560],
        rows: [
          new TableRow({ tableHeader: true, children: [
            makeCell("Role", { bold: true, width: 2400, shading: headerFill, color: "FFFFFF" }),
            makeCell("MAE", { bold: true, width: 1200, shading: headerFill, color: "FFFFFF" }),
            makeCell("Trend", { bold: true, width: 1200, shading: headerFill, color: "FFFFFF" }),
            makeCell("Action Needed", { bold: true, width: 4560, shading: headerFill, color: "FFFFFF" }),
          ]}),
          new TableRow({ children: [
            makeCell("AI Innovator", { width: 2400 }),
            makeCell("2.35", { width: 1200 }),
            makeCell("\u2193 Improving \u2705", { width: 1200 }),
            makeCell("Continue monitoring. Decent alignment.", { width: 4560 }),
          ]}),
          new TableRow({ children: [
            makeCell("Blockchain", { width: 2400, shading: altRowFill }),
            makeCell("1.08", { width: 1200, shading: altRowFill }),
            makeCell("Stable \u2705", { width: 1200, shading: altRowFill }),
            makeCell("Best aligned role. No action needed.", { width: 4560, shading: altRowFill }),
          ]}),
          new TableRow({ children: [
            makeCell("Founder\u2019s Associate", { width: 2400 }),
            makeCell("4.70", { width: 1200 }),
            makeCell("Broken \u274C", { width: 1200 }),
            makeCell("AI overscores massively (gives 6-8 where humans give 1-2). Prompt needs FA-specific recalibration.", { width: 4560 }),
          ]}),
          new TableRow({ children: [
            makeCell("Principal", { width: 2400, shading: altRowFill }),
            makeCell("2.00", { width: 1200, shading: altRowFill }),
            makeCell("Low sample", { width: 1200, shading: altRowFill }),
            makeCell("Only 2 candidates. Not meaningful yet.", { width: 4560, shading: altRowFill }),
          ]}),
        ]
      }),
      new Paragraph({ spacing: { before: 80, after: 120 }, children: [
        new TextRun({ text: "Required: ", bold: true }), new TextRun("Daily feedback loop \u2014 human scores \u2192 compare \u2192 tune prompt. Focus on FA recalibration this week.")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5. Outbound Targeting")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Current campaign results \u2014 what\u2019s working, what\u2019s not")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Fred wants to see results from filters + campaigns this week")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
        new TextRun("Score aggregation by source (which JD/channel works best)")
      ]}),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6. System Reliability")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Everything monitored, nothing slips through cracks")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun("Automated alerts working? Any gaps in notifications?")
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [
        new TextRun({ text: "Push > Pull: ", bold: true }), new TextRun("Triggers to DMs for things people need to act on, not group channels")
      ]}),

      // ACTION ITEMS
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Action Items This Week")] }),

      new Table({
        columnWidths: [1200, 5000, 3160],
        rows: [
          new TableRow({ tableHeader: true, children: [
            makeCell("Owner", { bold: true, width: 1200, shading: headerFill, color: "FFFFFF" }),
            makeCell("Action", { bold: true, width: 5000, shading: headerFill, color: "FFFFFF" }),
            makeCell("Due", { bold: true, width: 3160, shading: headerFill, color: "FFFFFF" }),
          ]}),
          new TableRow({ children: [
            makeCell("Lynn", { width: 1200, bold: true }),
            makeCell("Use dashboard daily. Own the daily candidate triage process.", { width: 5000 }),
            makeCell("Starting this week", { width: 3160 }),
          ]}),
          new TableRow({ children: [
            makeCell("Lynn", { width: 1200, bold: true, shading: altRowFill }),
            makeCell("Follow up on 5 tagged candidates (Yeonseok, Pranav M, Udit, Rohit, Pavan)", { width: 5000, shading: altRowFill }),
            makeCell("This week", { width: 3160, shading: altRowFill }),
          ]}),
          new TableRow({ children: [
            makeCell("Val", { width: 1200, bold: true }),
            makeCell("Deliver iterated interview script/template. Test on 2+ candidates.", { width: 5000 }),
            makeCell("By Friday", { width: 3160 }),
          ]}),
          new TableRow({ children: [
            makeCell("Val", { width: 1200, bold: true, shading: altRowFill }),
            makeCell("Check and verify Lynn\u2019s work. Bridge exceptions.", { width: 5000, shading: altRowFill }),
            makeCell("Ongoing", { width: 3160, shading: altRowFill }),
          ]}),
          new TableRow({ children: [
            makeCell("Mart", { width: 1200, bold: true }),
            makeCell("Follow key candidates all week. Ensure system monitoring. Nothing slips.", { width: 5000 }),
            makeCell("Daily", { width: 3160 }),
          ]}),
          new TableRow({ children: [
            makeCell("Mart", { width: 1200, bold: true, shading: altRowFill }),
            makeCell("Improve AI prompts daily with human score feedback. Focus: FA recalibration.", { width: 5000, shading: altRowFill }),
            makeCell("Daily", { width: 3160, shading: altRowFill }),
          ]}),
          new TableRow({ children: [
            makeCell("Mart", { width: 1200, bold: true }),
            makeCell("Refine outbound targeting. Run campaigns, measure results by source.", { width: 5000 }),
            makeCell("This week", { width: 3160 }),
          ]}),
          new TableRow({ children: [
            makeCell("Mart", { width: 1200, bold: true, shading: altRowFill }),
            makeCell("Automate interview feedback processing into pipeline.", { width: 5000, shading: altRowFill }),
            makeCell("This week", { width: 3160, shading: altRowFill }),
          ]}),
          new TableRow({ children: [
            makeCell("Mart", { width: 1200, bold: true }),
            makeCell("Walk Lynn through dashboard and workflow.", { width: 5000 }),
            makeCell("Monday/Tuesday", { width: 3160 }),
          ]}),
        ]
      }),

      new Paragraph({ spacing: { before: 300 }, children: [] }),
      new Paragraph({
        shading: { fill: "F0F4F8", type: ShadingType.CLEAR },
        spacing: { before: 100, after: 100 },
        children: [
          new TextRun({ text: "  Goal for this week: ", bold: true, size: 24 }),
          new TextRun({ text: "Lynn running the dashboard independently. Val delivering interview template. AI prompts calibrated with daily feedback. System monitoring on autopilot. Fred only sees hot candidates that need his decision.", size: 22 })
        ]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/martijnbroersma/clawd/HR-Weekstart-Feb2-2026.docx", buffer);
  console.log("Done: HR-Weekstart-Feb2-2026.docx");
});
