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
      { reference: "num-gotchas", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-blockers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
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
          children: [new TextRun({ text: "INTERNAL — Cere Network", size: 18, color: "999999", font: "Arial", italics: true })]
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
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("DDC + DAC: Implementation Report & Secure A2A Roadmap")] }),
        new Paragraph({ spacing: { after: 100 }, children: [
          new TextRun({ text: "Martijn Broersma — February 2, 2026", size: 22, color: "666666", italics: true })
        ]}),
        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "Hands-on testing of DDC storage and DAC verification with Clawdbot, documenting what works, what broke, and what's needed for secure agent-to-agent data exchange.", size: 22, color: "555555" })
        ]}),

        // SECTION 1: WHAT WE DID
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. What We Did")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("On the evening of February 1st, we ran a live integration test: connecting Clawdbot (our AI agent running locally) directly to Cere's DDC Mainnet to store and retrieve data, then mapped the full DAC verification path through Notion documentation.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 DDC Mainnet — Live Store & Read")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Connected to DDC Mainnet ", bold: true }), new TextRun("using Mart's wallet (5DSxCB...)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Stored data on Bucket 1229 ", bold: true }), new TextRun("(public bucket) — a \"hello world\" message from Clawdbot")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Read data back by CID ", bold: true }), new TextRun("— verified round-trip works")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Discovered undocumented CDN gateway: ", bold: true }),
          new TextRun("cdn.ddc-dragon.com (not in any docs)")
        ]}),
        new Paragraph({ spacing: { before: 120, after: 120 }, children: [
          new TextRun({ text: "Live proof — CID on mainnet:", bold: true })
        ]}),
        new Paragraph({ spacing: { after: 60 }, indent: { left: 360 }, children: [
          new TextRun({ text: "CID: ", bold: true, size: 20 }),
          new TextRun({ text: "baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu", size: 20, font: "Courier New" })
        ]}),
        new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [
          new TextRun({ text: "Browser: ", bold: true, size: 20 }),
          new ExternalHyperlink({
            link: "https://cdn.ddc-dragon.com/1229/baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu",
            children: [new TextRun({ text: "cdn.ddc-dragon.com/1229/baebb4...", style: "Hyperlink", size: 20 })]
          })
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.2 Gap Analysis — Notion Deep Dive")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("Systematically reviewed all internal Notion documentation (Project Source of Truth, DAC wikis, ADRs, SDK docs) to assess what's production-ready vs. spec-only vs. missing.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.3 Strategic White Paper")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("Synthesized research on the A2A landscape (Google A2A, ERC-8004, Moltbook phenomenon, Salesforce A2A) into a strategic document positioning Cere/CEF as the trustless substrate for the agentic era.")
        ]}),

        // SECTION 2: WHAT WORKS TODAY
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. What Works Today")] }),

        new Table({
          columnWidths: [2800, 1400, 4160],
          rows: [
            new TableRow({ tableHeader: true, children: [
              makeCell("Component", { bold: true, width: 2800, shading: headerFill, color: "FFFFFF", size: 20 }),
              makeCell("Status", { bold: true, width: 1400, shading: headerFill, color: "FFFFFF", size: 20, alignment: AlignmentType.CENTER }),
              makeCell("Notes", { bold: true, width: 4160, shading: headerFill, color: "FFFFFF", size: 20 }),
            ]}),
            new TableRow({ children: [
              makeCell("DDC Storage (unencrypted)", { width: 2800 }),
              makeCell("\u2705 Production", { width: 1400, size: 20 }),
              makeCell("Published to NPM, tested on mainnet. Store + read works.", { width: 4160 }),
            ]}),
            new TableRow({ children: [
              makeCell("Activity SDK", { width: 2800, shading: altRowFill }),
              makeCell("\u2705 Production", { width: 1400, shading: altRowFill, size: 20 }),
              makeCell("@cere-activity-sdk/client on NPM. Captures agent actions.", { width: 4160, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("Agent Runtime (V8)", { width: 2800 }),
              makeCell("\u2705 Production", { width: 1400, size: 20 }),
              makeCell("V8 isolated context, deployed on CEF.", { width: 4160 }),
            ]}),
            new TableRow({ children: [
              makeCell("DAC Verification (Merkle)", { width: 2800, shading: altRowFill }),
              makeCell("\u26A0\uFE0F Undocumented", { width: 1400, shading: altRowFill, size: 20 }),
              makeCell("Works internally. TCA\u2192PHD\u2192EHD documented in Notion. Proto files not published externally.", { width: 4160, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("CDN Gateway (mainnet)", { width: 2800 }),
              makeCell("\uD83D\uDFE1 Hidden", { width: 1400, size: 20 }),
              makeCell("cdn.ddc-dragon.com works but is undocumented. Critical for developer onboarding.", { width: 4160 }),
            ]}),
            new TableRow({ children: [
              makeCell("Client-side Encryption (EDEK)", { width: 2800, shading: altRowFill }),
              makeCell("\u274C Not shipped", { width: 1400, shading: altRowFill, size: 20 }),
              makeCell("ADR written, not implemented. Blocks encrypted delegation.", { width: 4160, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("Key Escrow Service (KES)", { width: 2800 }),
              makeCell("\u274C Spec only", { width: 1400, size: 20 }),
              makeCell("Required for revocable agent access grants. Not built.", { width: 4160 }),
            ]}),
            new TableRow({ children: [
              makeCell("SDK Documentation", { width: 2800, shading: altRowFill }),
              makeCell("\u274C Outdated", { width: 1400, shading: altRowFill, size: 20 }),
              makeCell("Method names don't match actual API. 10 gotchas found in one session.", { width: 4160, shading: altRowFill }),
            ]}),
          ]
        }),

        // SECTION 3: GOTCHAS
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. SDK Issues Encountered (10 Gotchas)")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("During our hands-on session, we hit 10 distinct issues with the DDC SDK. Each is a real developer blocker:")
        ]}),

        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Method names don't match docs ", bold: true }), new TextRun("— SDK exports differ from what documentation describes")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "DdcClient initialization ", bold: true }), new TextRun("— constructor pattern undocumented, had to reverse-engineer from source")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "FileUri vs CID confusion ", bold: true }), new TextRun("— reading data requires FileUri wrapper, not raw CID string")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Bucket ID type ", bold: true }), new TextRun("— must be BigInt (1229n), not Number. No error message, just fails")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "getDeposit() doesn't exist ", bold: true }), new TextRun("— documented but not in the actual SDK")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Signer configuration ", bold: true }), new TextRun("— JsonSigner required but format undocumented")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Network selection ", bold: true }), new TextRun("— mainnet vs testnet config not clearly separated in docs")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "Store response format ", bold: true }), new TextRun("— return type differs from documentation")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 60 }, children: [
          new TextRun({ text: "gRPC-only storage nodes ", bold: true }), new TextRun("— httpUrl in node config is misleading; nodes only listen on gRPC:9090")
        ]}),
        new Paragraph({ numbering: { reference: "num-gotchas", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "No HTTP gateway on mainnet ", bold: true }), new TextRun("— cdn.testnet.cere.network exists for testnet. Mainnet equivalent (cdn.ddc-dragon.com) is undocumented. Devs can't share a browsable link.")
        ]}),

        // SECTION 4: WHAT'S MISSING FOR SECURE A2A
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. What's Missing for Secure Agent-to-Agent (A2A)")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("Unencrypted agent data exchange works TODAY. But for production-grade A2A where agents handle sensitive data with scoped, revocable permissions, the following gaps must be closed:")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Client-Side Encryption (EDEK)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "What: ", bold: true }), new TextRun("Data encrypted on-device before it touches the network. Storage nodes only see opaque blobs.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Status: ", bold: true }), new TextRun("ADR written (Notion: 2f0d800083d6804b). NOT implemented.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Impact: ", bold: true }), new TextRun("Without this, all DDC data is transparent. No privacy guarantees for agent-processed data.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Key Escrow Service (KES)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "What: ", bold: true }), new TextRun("Service that enables revocable, scoped, time-limited access grants for agents. User encrypts DEK, creates AccessGrant for agent's pubkey.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Status: ", bold: true }), new TextRun("Spec only. Not built.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Impact: ", bold: true }), new TextRun("Critical for multi-agent workflows. Without KES, you can't delegate+revoke access. Agent B can't temporarily access Agent A's data with guarantees.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.3 DAC Verification — Public Proto Files")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "What: ", bold: true }), new TextRun("Proto file paths for TCA/PHD/EHD so developers can independently reconstruct and verify Merkle proofs.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Status: ", bold: true }), new TextRun("Exists internally (extensive Notion docs). NOT published externally.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Impact: ", bold: true }), new TextRun("Developers hit a wall at the \"verify\" step. Forced to \"trust Cere\" instead of verifying independently. Undermines the core value proposition.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.4 SDK Documentation Overhaul")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "What: ", bold: true }), new TextRun("Accurate method names, parameter types, working examples that match the actual SDK API.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Status: ", bold: true }), new TextRun("Outdated. 10 gotchas found in a single session.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Impact: ", bold: true }), new TextRun("Every external developer will hit these same issues. First impression = broken.")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.5 HTTP Gateway (Mainnet)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "What: ", bold: true }), new TextRun("Documented, public HTTP endpoint for browsing DDC content by CID.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Status: ", bold: true }), new TextRun("cdn.ddc-dragon.com works but is completely undocumented. Devs can't discover it.")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Impact: ", bold: true }), new TextRun("\"I stored data but I can't share a link\" is a terrible developer experience.")
        ]}),

        // SECTION 5: COMPETITIVE CONTEXT
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Why This Matters — A2A Competitive Landscape")] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun("The A2A space is fragmenting fast. Each paradigm solves one slice but fails to address the full stack:")
        ]}),

        new Table({
          columnWidths: [1800, 1800, 2000, 2360],
          rows: [
            new TableRow({ tableHeader: true, children: [
              makeCell("Paradigm", { bold: true, width: 1800, shading: headerFill, color: "FFFFFF", size: 19 }),
              makeCell("Example", { bold: true, width: 1800, shading: headerFill, color: "FFFFFF", size: 19 }),
              makeCell("Focus", { bold: true, width: 2000, shading: headerFill, color: "FFFFFF", size: 19 }),
              makeCell("Limitation", { bold: true, width: 2360, shading: headerFill, color: "FFFFFF", size: 19 }),
            ]}),
            new TableRow({ children: [
              makeCell("Enterprise A2A", { width: 1800 }),
              makeCell("Google A2A", { width: 1800 }),
              makeCell("Interop within firewalls", { width: 2000 }),
              makeCell("Web2 identity, assumes high trust", { width: 2360 }),
            ]}),
            new TableRow({ children: [
              makeCell("Crypto-Native", { width: 1800, shading: altRowFill }),
              makeCell("ERC-8004", { width: 1800, shading: altRowFill }),
              makeCell("On-chain identity & registry", { width: 2000, shading: altRowFill }),
              makeCell("No high-perf data plane", { width: 2360, shading: altRowFill }),
            ]}),
            new TableRow({ children: [
              makeCell("Tool-Centric", { width: 1800 }),
              makeCell("MCP", { width: 1800 }),
              makeCell("Tool connectivity", { width: 2000 }),
              makeCell("No security/state, tool squatting risk", { width: 2360 }),
            ]}),
            new TableRow({ children: [
              makeCell("Holistic Trustless", { width: 1800, shading: altRowFill, bold: true }),
              makeCell("Cere/CEF", { width: 1800, shading: altRowFill, bold: true }),
              makeCell("Data + Compute + Verification", { width: 2000, shading: altRowFill, bold: true }),
              makeCell("Gaps in encryption & docs (this report)", { width: 2360, shading: altRowFill }),
            ]}),
          ]
        }),

        new Paragraph({ spacing: { before: 200, after: 120 }, children: [
          new TextRun({ text: "Cere/CEF's core loop: ", bold: true }),
          new TextRun("Run (Compute) \u2192 Remember (DDC) \u2192 Prove (DAC) \u2192 Pay/Get Paid (Protocol). No other stack covers all four.")
        ]}),

        // SECTION 6: RECOMMENDED NEXT STEPS
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Recommended Next Steps")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Immediate (this week)")] }),
        new Paragraph({ numbering: { reference: "num-steps", level: 0 }, children: [
          new TextRun({ text: "Document cdn.ddc-dragon.com ", bold: true }), new TextRun("as the mainnet HTTP gateway (1 hour fix)")
        ]}),
        new Paragraph({ numbering: { reference: "num-steps", level: 0 }, children: [
          new TextRun({ text: "Fix SDK documentation ", bold: true }), new TextRun("for the 10 gotchas identified (2-3 days)")
        ]}),
        new Paragraph({ numbering: { reference: "num-steps", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Publish DAC .proto files ", bold: true }), new TextRun("so developers can verify proofs independently")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Short-term (2-4 weeks)")] }),
        new Paragraph({ numbering: { reference: "num-blockers", level: 0 }, children: [
          new TextRun({ text: "Ship EDEK (client-side encryption) ", bold: true }), new TextRun("— unblocks encrypted storage flows")
        ]}),
        new Paragraph({ numbering: { reference: "num-blockers", level: 0 }, children: [
          new TextRun({ text: "Build KES (Key Escrow Service) ", bold: true }), new TextRun("— unblocks delegated agent access")
        ]}),
        new Paragraph({ numbering: { reference: "num-blockers", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Create \"Hello World\" for DAC verification ", bold: true }), new TextRun("— store \u2192 process \u2192 verify in <30 min")
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Medium-term (1-2 months)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Delegated AuthTokens — scoped, time-limited, revocable agent access")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Agent-to-agent data exchange on CEF with full encryption + verification")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun("Developer alpha: end-to-end \"zero to proof\" in <30 minutes")
        ]}),

        // SECTION 7: ARTIFACTS
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. All Artifacts & References")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Documents Created")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "DDC Agent Data Exchange \u2014 Implementation Report (Fred + Bren): ", bold: true }),
          new ExternalHyperlink({ link: "https://docs.google.com/document/d/1tNcOl4BWXz8SWchWK2kTpESNmWkDD5An/edit", children: [new TextRun({ text: "Google Doc", style: "Hyperlink" })] })
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun({ text: "Trustless A2A Data Layer \u2014 The Moltbook Moment (White Paper): ", bold: true }),
          new ExternalHyperlink({ link: "https://docs.google.com/document/d/1L3QaguNnxkHcCCEs-1N74jMnKei-fefM/edit", children: [new TextRun({ text: "Google Doc", style: "Hyperlink" })] })
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [
          new TextRun({ text: "Live DDC Proof (CID on mainnet): ", bold: true }),
          new ExternalHyperlink({ link: "https://cdn.ddc-dragon.com/1229/baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu", children: [new TextRun({ text: "Browser Link", style: "Hyperlink" })] })
        ]}),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Internal Notion References")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Project Source of Truth (2f1d800083d6807f8b83f0db3615179e)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("ADR: Encrypted Data Access (2f0d800083d6804ba77fe09e9d0beb2f)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("DAC & Inspection Wiki (128d800083d680b2b6cbfb8fa99a8b0d)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("DAC Aggregation Walkthrough TCA\u2192EHD (24cd8000)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Agent Developer Guide (2a3d800083d680cc901ae2c1c8e36509)")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 120 }, children: [new TextRun("CEF AI Enterprise G2M Wiki (21cd800083d68003a0aed0b2c9e641d3)")] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("External Research Sources")] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new ExternalHyperlink({ link: "https://ethereum-magicians.org/t/erc-8004-trustless-agents/25098", children: [new TextRun({ text: "ERC-8004: Trustless Agents", style: "Hyperlink" })] }),
          new TextRun(" \u2014 Ethereum Magicians / Oasis Protocol")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new ExternalHyperlink({ link: "https://www.salesforce.com/blog/agent-to-agent-interaction/", children: [new TextRun({ text: "Building Trust into A2A Interaction", style: "Hyperlink" })] }),
          new TextRun(" \u2014 Salesforce")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Moltbook press coverage \u2014 The Verge, Complex, Business Today, ANI News")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new ExternalHyperlink({ link: "https://www.youtube.com/watch?v=BOpzs5AGU50", children: [new TextRun({ text: "A2A in 30 Minutes", style: "Hyperlink" })] }),
          new TextRun(" \u2014 YouTube (Lo\u00EFc Magnette)")
        ]}),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
          new TextRun("Cere internal: Amit Deck, CEF Positioning Oct '25, Enterprise CEF Sept '25, Software 3.0 doc")
        ]}),

        // CLOSING
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          spacing: { before: 200 },
          shading: { fill: "F0F4F8", type: ShadingType.CLEAR },
          children: [
            new TextRun({ text: "  Bottom line: ", bold: true, size: 24 }),
            new TextRun({ text: "Unencrypted agent data exchange works on DDC today. For secure, production-grade A2A with encrypted delegation, we need EDEK + KES + published proto files. The foundation is solid \u2014 the gaps are known and scoped.", size: 24 })
          ]
        }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/martijnbroersma/clawd/DDC-DAC-Implementation-Report.docx", buffer);
  console.log("Done: DDC-DAC-Implementation-Report.docx");
});
