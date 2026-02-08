const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, PageBreak
} = require("docx");

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const headerFill = { fill: "1a1a2e", type: ShadingType.CLEAR };
const altRowFill = { fill: "F7F7FA", type: ShadingType.CLEAR };

function makeCell(text, opts = {}) {
  const { bold, width, shading, color, size, alignment } = opts;
  return new TableCell({
    borders: cellBorders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shading || undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: alignment || AlignmentType.LEFT,
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
        run: { size: 48, bold: true, color: "1a1a2e", font: "Arial" },
        paragraph: { spacing: { before: 0, after: 200 } } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "1a1a2e", font: "Arial" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "333355", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, color: "555577", font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-hr", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-legal", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-actions", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-infra", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "CONFIDENTIAL \u2014 Internal Only", size: 18, color: "CC0000", font: "Arial", italics: true, bold: true })]
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
        // TITLE
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Week Start \u2014 February 2, 2026")] }),
        new Paragraph({ spacing: { after: 100 }, children: [
          new TextRun({ text: "Prepared by Martijn Broersma", size: 22, color: "666666", italics: true })
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "Three tracks: HR/Recruiting, Infrastructure/Hackathon, Legal/Cayman. Extracted from Fred calls Jan 30, Jan 31, Feb 1.", size: 22, color: "555555" })
        ]}),

        // ============================================
        // PART 1: HR / CHARLIE SYNC
        // ============================================
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Part 1: HR / Recruiting \u2014 Weekstart with Fred, Valery & Lynn")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Agenda")] }),

        // 1. Lynn Dashboard
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("1. Lynn Dashboard Onboarding")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Lynn must be the primary daily user of the candidate dashboard. No one else.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Walk through: what she sees, what she does, what escalates to Fred")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Once Lynn is on the hook and running \u2192 Val comes in to check and verify")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Fred: ", bold: true }), new TextRun("\"Dashboard must be enforced to Lynn. Not anyone else.\"")
        ]}),

        // 2. Valery Interview Script
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("2. Valery Interview Script")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Val needs to iterate on standardized interview template and deliver")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("After Lynn is running: Val checks/verifies, bridges exceptions")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Fred: ", bold: true }), new TextRun("\"Make it clear she needs to iterate and get something out of that.\"")
        ]}),

        // 3. Pipeline Status
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3. Pipeline Status")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "17 candidates in queue: ", bold: true }), new TextRun("3\u00D7 CEO Interview, 5\u00D7 HM CV Screening, 4\u00D7 ASE, 1\u00D7 Trial")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Fred\u2019s weekend feedback processed: ", bold: true }), new TextRun("Yeonseok Kim (enthusiastic yes), Fanley Tseng (pass), Pranav Banuru (pass), Pranav Marla (conditional screen), Udit (yes + validate), Rohit (screen), Pavan (screen w/ drive focus)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("Lynn tagged on all 5 actionable candidates in Notion with specific instructions")
        ]}),

        // 4. AI Scoring
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4. AI Scoring Alignment")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "FA prompt still broken ", bold: true }), new TextRun("(MAE 4.70) \u2014 AI overscores massively where humans give 1-2")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "AI Innovator improving ", bold: true }), new TextRun("(MAE 2.95 \u2192 2.35)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Blockchain solid ", bold: true }), new TextRun("(MAE 1.08)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("Need daily feedback loop: human scores \u2192 compare \u2192 tune prompt")
        ]}),

        // 5. Outbound Targeting
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("5. Outbound Targeting & Candidate Profile")] }),
        new Paragraph({ spacing: { after: 60 }, children: [
          new TextRun({ text: "Fred\u2019s ideal candidate profile (AI roles):", bold: true })
        ]}),
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
          new TextRun("Hustle and drive are critical \u2014 incorporate into scoring")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Fred: ", bold: true }), new TextRun("\"We don\u2019t need recruiters anymore. You\u2019re building a system.\"")
        ]}),

        // 6. System
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("6. System Reliability & Automation")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Everything monitored, nothing slips through cracks")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Automated alerts for escalations (Slack DMs, not group channels)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Fred: ", bold: true }), new TextRun("\"Push, don\u2019t pull. Triggers to DMs for things people need to act on.\"")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("Hook automated interview feedback processing into system")
        ]}),

        // HR Summary actions
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("HR Action Items This Week")] }),
        new Paragraph({ numbering: { reference: "num-hr", level: 0 }, children: [
          new TextRun({ text: "Lynn: ", bold: true }), new TextRun("Get her using the dashboard daily. Walk through workflow.")
        ]}),
        new Paragraph({ numbering: { reference: "num-hr", level: 0 }, children: [
          new TextRun({ text: "Val: ", bold: true }), new TextRun("Deliver iterated interview script/template.")
        ]}),
        new Paragraph({ numbering: { reference: "num-hr", level: 0 }, children: [
          new TextRun({ text: "Mart: ", bold: true }), new TextRun("Follow key candidates all week, ensure system monitoring, nothing slips.")
        ]}),
        new Paragraph({ numbering: { reference: "num-hr", level: 0 }, children: [
          new TextRun({ text: "Mart: ", bold: true }), new TextRun("Improve AI prompts daily with human score feedback.")
        ]}),
        new Paragraph({ numbering: { reference: "num-hr", level: 0 }, children: [
          new TextRun({ text: "Mart: ", bold: true }), new TextRun("Refine outbound targeting based on campaign results.")
        ]}),
        new Paragraph({ numbering: { reference: "num-hr", level: 0 }, spacing: { after: 200 }, children: [
          new TextRun({ text: "Mart: ", bold: true }), new TextRun("Automate interview feedback processing into pipeline.")
        ]}),

        // ============================================
        // PART 2: INFRASTRUCTURE / HACKATHON
        // ============================================
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Part 2: Infrastructure & Hackathon Prep")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Fred\u2019s Vision: The Product")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("Four-part engineering intelligence platform with product-led growth:")
        ]}),
        new Paragraph({ numbering: { reference: "num-infra", level: 0 }, children: [
          new TextRun({ text: "Design & Architect: ", bold: true }), new TextRun("AI that creates connectors, document endpoints, data models, graphs")
        ]}),
        new Paragraph({ numbering: { reference: "num-infra", level: 0 }, children: [
          new TextRun({ text: "Implement: ", bold: true }), new TextRun("Fully autonomous agents or copilots for iterative building")
        ]}),
        new Paragraph({ numbering: { reference: "num-infra", level: 0 }, children: [
          new TextRun({ text: "Eval & Test: ", bold: true }), new TextRun("Acceptance criteria, boundaries, evals before release. Outcome-based + efficiency/efficacy management + cost control")
        ]}),
        new Paragraph({ numbering: { reference: "num-infra", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Real-World Feedback Loop: ", bold: true }), new TextRun("Real-time log feedback, agent efficiency tracking, competing engagement sets. The missing yin to AI\u2019s yang.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Go-To-Market: Product-Led Growth")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Target: anyone running Moltbot/agents \u2192 secure environment where every execution is permitted + traceable")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Data doesn\u2019t leave the environment. Permission at agent level. Every agent traceable.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Model: like Lovable, Manus, Cursor \u2014 PLG to multi-billion valuation without own LLMs")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Fred: ", bold: true }), new TextRun("\"We can get there in six months. But we have to get this shit to work.\"")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "GPU deal: ", bold: true }), new TextRun("~$10K/month Zettabytes MOU, 8x H100 units, dedicated pipeline in Asia. Separate cluster from Dragon One.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Mart\u2019s Focus This Week")] }),
        new Paragraph({ numbering: { reference: "num-actions", level: 0 }, children: [
          new TextRun({ text: "Map Clawdbot/Moltbot onto Cere infrastructure: ", bold: true }), new TextRun("Break down everything \u2014 what maps to DDC, what maps to CEF runtime, where are the gaps")
        ]}),
        new Paragraph({ numbering: { reference: "num-actions", level: 0 }, children: [
          new TextRun({ text: "Front-load this early in the week: ", bold: true }), new TextRun("validate how the puzzle fits before building anything else")
        ]}),
        new Paragraph({ numbering: { reference: "num-actions", level: 0 }, children: [
          new TextRun({ text: "Prepare list for ROB: ", bold: true }), new TextRun("what can we leverage, what\u2019s missing, quick list")
        ]}),
        new Paragraph({ numbering: { reference: "num-actions", level: 0 }, children: [
          new TextRun({ text: "Mac Minis (3x): ", bold: true }), new TextRun("Set up and run something on them. Bring to hackathon. Catch has them in Berlin already.")
        ]}),
        new Paragraph({ numbering: { reference: "num-actions", level: 0 }, children: [
          new TextRun({ text: "Add open-source models: ", bold: true }), new TextRun("Host on DDC as alternative to OpenAI API (DeepSeek, Kimi 2.5, etc.)")
        ]}),
        new Paragraph({ numbering: { reference: "num-actions", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Hackathon topics: ", bold: true }), new TextRun("Security, permissions, persistence, metric aggregation, engagement eval")
        ]}),

        new Paragraph({ spacing: { before: 100, after: 200 }, children: [
          new TextRun({ text: "Barcelona hackathon success = planning done NOW. ", bold: true, color: "CC0000" }),
          new TextRun({ text: "\"The success of every battle is always in the planning stage.\" \u2014 Fred", italics: true })
        ]}),

        // ============================================
        // PART 3: LEGAL / CAYMAN
        // ============================================
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Part 3: Legal / Cayman \u2014 Strategy vs Kenzi")] }),

        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: "Context: ", bold: true }),
          new TextRun("Kenzi is escalating pre-trial (next month). Creating narrative of \u201Cscammy company coming after me.\u201D Using Vivian Liu as proxy complainant. Multiple fronts need coordinated response.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Three Counter-Attack Vectors")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Vector 1: Criminal (Dubai)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("2 lawsuits already filed \u2192 going after Kenzi criminally")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("2 more lawsuits ready but not yet filed")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("If found guilty \u2192 serve sentence \u2192 then civil suits follow")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("Escalation puts more pressure on Dubai prosecutors")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Vector 2: Civil (US)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Suit filed in California \u2192 4-5 inbound contacts after filing")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Counter-suits orchestrated by Rocky + Matt")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("SEC filing for unlicensed broker-dealering planned")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("Criminal angle in US now also possible (Rocky)")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Vector 3: Public Narrative / Counter-PR")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Rocky preparing press release (unified response)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("YouTube explainers + independent published content ($20-50K budget)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Goal: when people search, they see it all comes from Kenzi")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Twitter exposure campaign \u2014 get his name out there with evidence")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Fred: ", bold: true }), new TextRun("\"He needs to be exposed. This is time to really expose them.\"")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Vivian Liu \u2014 Counter-Punch")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Adviser agreement likely never signed. She never did any work.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("33.3M CERE distribution (13 + 20) from soft + master sheet")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Kenzi offered custody of her tokens \u2192 later extracted them \u2192 told her to sue Cere")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Strategy: ", bold: true }), new TextRun("Reach out to her lawyers: \u201CYou\u2019re being used as a pawn by Kenzi. Here\u2019s the evidence.\u201D")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("If she flips on Kenzi \u2192 massive win. If not \u2192 her claim still undermined.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Sandeep Nailwal Pressure")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Bren to reach out to Sandeep")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Message: ", bold: true }), new TextRun("\"Kenzi keeps escalating. Not only will he go to jail, but everything you\u2019ve worked for will be tainted. Your legacy is at stake.\"")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("Sandeep is defendant in federal lawsuit WITH Kenzi (Interdata Network v. Wang, Nailwal, Hu)")
        ]}),

        // Action items table
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Legal Action Items")] }),

        new Table({
          columnWidths: [3200, 1400, 1200, 2560],
          rows: [
            new TableRow({ tableHeader: true, children: [
              makeCell("Action", { bold: true, width: 3200, shading: headerFill, color: "FFFFFF", size: 20 }),
              makeCell("Owner", { bold: true, width: 1400, shading: headerFill, color: "FFFFFF", size: 20 }),
              makeCell("Timing", { bold: true, width: 1200, shading: headerFill, color: "FFFFFF", size: 20 }),
              makeCell("Notes", { bold: true, width: 2560, shading: headerFill, color: "FFFFFF", size: 20 }),
            ]}),
            new TableRow({ children: [
              makeCell("Chain analysis audit", { width: 3200 }),
              makeCell("Mart", { width: 1400 }),
              makeCell("This week", { width: 1200 }),
              makeCell("Chainalysis or similar. Give them wallet trail.", { width: 2560 }),
            ]}),
            new TableRow({ children: [
              makeCell("Vivian\u2019s lawyers outreach", { width: 3200, shading: altRowFill }),
              makeCell("Rocky/Matt", { width: 1400, shading: altRowFill }),
              makeCell("After alignment", { width: 1200, shading: altRowFill }),
              makeCell("\"You\u2019re being used as pawn\"", { width: 2560, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("Check Vivian adviser agreement", { width: 3200 }),
              makeCell("Fred", { width: 1400 }),
              makeCell("ASAP", { width: 1200 }),
              makeCell("Looking in docs", { width: 2560 }),
            ]}),
            new TableRow({ children: [
              makeCell("Affidavit from Canadian contact", { width: 3200, shading: altRowFill }),
              makeCell("Mart", { width: 1400, shading: altRowFill }),
              makeCell("Follow up", { width: 1200, shading: altRowFill }),
              makeCell("Pinged, needs nudge", { width: 2560, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("Bren \u2192 Sandeep outreach", { width: 3200 }),
              makeCell("Bren", { width: 1400 }),
              makeCell("This week", { width: 1200 }),
              makeCell("Legacy pressure angle", { width: 2560 }),
            ]}),
            new TableRow({ children: [
              makeCell("Press release draft", { width: 3200, shading: altRowFill }),
              makeCell("Rocky", { width: 1400, shading: altRowFill }),
              makeCell("Preparing", { width: 1200, shading: altRowFill }),
              makeCell("Unified public response", { width: 2560, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("SEC filing (broker-dealer)", { width: 3200 }),
              makeCell("Rocky/Matt", { width: 1400 }),
              makeCell("Planned", { width: 1200 }),
              makeCell("Unlicensed broker-dealering", { width: 2560 }),
            ]}),
            new TableRow({ children: [
              makeCell("YouTube/PR campaign", { width: 3200, shading: altRowFill }),
              makeCell("Rocky", { width: 1400, shading: altRowFill }),
              makeCell("After strategy align", { width: 1200, shading: altRowFill }),
              makeCell("$20-50K budget. Independent storytelling.", { width: 2560, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("Zach follow-up", { width: 3200 }),
              makeCell("Mart", { width: 1400 }),
              makeCell("After strategy", { width: 1200 }),
              makeCell("Wait for aligned plan first", { width: 2560 }),
            ]}),
          ]
        }),

        // KEY PRINCIPLE
        new Paragraph({ spacing: { before: 300, after: 100 }, children: [] }),
        new Paragraph({
          shading: { fill: "FFF3F0", type: ShadingType.CLEAR },
          spacing: { before: 100, after: 100 },
          children: [
            new TextRun({ text: "  Key Principle: ", bold: true, size: 24, color: "CC0000" }),
            new TextRun({ text: "Everyone (Rocky, Matt, Jenny, Fred, Mart) must fully internalize the evidence and see what we see. Only then can sound strategic decisions be made. ", size: 22 }),
            new TextRun({ text: "\"The whole purpose is that they see what we see, understand what we understand.\" \u2014 Fred", italics: true, size: 22 })
          ]
        }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/martijnbroersma/clawd/Week-Start-Feb2-2026.docx", buffer);
  console.log("Done: Week-Start-Feb2-2026.docx");
});
