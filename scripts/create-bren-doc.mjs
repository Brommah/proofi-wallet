import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
         HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
         LevelFormat, PageBreak, Header, Footer, PageNumber, ExternalHyperlink } from 'docx';
import { writeFileSync } from 'fs';

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const headerShading = { fill: "1a1a2e", type: ShadingType.CLEAR };
const altRowShading = { fill: "F8F9FA", type: ShadingType.CLEAR };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: "333333" } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 52, bold: true, color: "1a1a2e", font: "Arial" },
        paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.LEFT } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "1a1a2e", font: "Arial" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "2d2d5e", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, color: "444444", font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-main", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "gotchas", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "INTERNAL — Cere/CEF Engineering", size: 18, color: "999999", italics: true })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" }), new TextRun({ text: " of ", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "999999" })]
      })] })
    },
    children: [
      // === TITLE ===
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("DDC Agent Data Exchange — Implementation Report")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Implementation Guide & SDK Gotchas", size: 26, color: "666666" })] }),
      new Paragraph({ spacing: { after: 300 }, children: [
        new TextRun({ text: "Date: ", bold: true }), new TextRun("2026-02-01  |  "),
        new TextRun({ text: "For: ", bold: true }), new TextRun("Fred, Bren  |  "),
        new TextRun({ text: "Status: ", bold: true }), new TextRun("Battle-tested on Mainnet"),
      ] }),

      // === OVERVIEW ===
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Overview")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("This guide covers setting up agent-to-agent data exchange on Cere's DDC (Decentralized Data Cloud) Mainnet. It documents "),
        new TextRun({ text: "every issue encountered during actual implementation", bold: true }),
        new TextRun(", including SDK bugs, undocumented API behavior, and workarounds."),
      ] }),

      // Status table
      new Table({
        columnWidths: [3120, 2080, 4160],
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        rows: [
          new TableRow({ tableHeader: true, children: [
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: headerShading, children: [new Paragraph({ children: [new TextRun({ text: "Component", bold: true, color: "FFFFFF", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: headerShading, children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true, color: "FFFFFF", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 4160, type: WidthType.DXA }, shading: headerShading, children: [new Paragraph({ children: [new TextRun({ text: "Notes", bold: true, color: "FFFFFF", size: 20 })] })] }),
          ] }),
          ...[ 
            ["DDC Storage (store/read)", "✅ Working", "Mainnet, bucket 1229"],
            ["Activity SDK", "✅ Working", "NPM published"],
            ["Agent Runtime (V8)", "✅ Working", "50K ops/sec on Dragon One"],
            ["Client-side Encryption", "❌ Not shipped", "ADR 'Proposed' only"],
            ["Key Escrow Service", "❌ Not deployed", "Blocks delegated access"],
            ["DAC Verification", "⚠️ Undocumented", ".proto files not published"],
            ["HTTP Gateway (Mainnet)", "❌ Does not exist", "Can't view CIDs in browser"],
          ].map((row, i) => new TableRow({ children: row.map((cell, j) => 
            new TableCell({ borders: cellBorders, width: { size: [3120, 2080, 4160][j], type: WidthType.DXA }, 
              shading: i % 2 === 0 ? altRowShading : undefined,
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })] })
          ) }))
        ]
      }),

      // === QUICK SETUP ===
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Quick Setup")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Install SDK")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [new TextRun({ text: "npm install @cere-ddc-sdk/ddc-client", font: "Courier New", size: 20 })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Wallet Setup")] }),
      new Paragraph({ numbering: { reference: "steps", level: 0 }, children: [new TextRun("Export your Cere wallet as JSON keystore from developer portal")] }),
      new Paragraph({ numbering: { reference: "steps", level: 0 }, children: [new TextRun("Save as .secrets/cere-wallet.json")] }),
      new Paragraph({ numbering: { reference: "steps", level: 0 }, children: [new TextRun("Create .secrets/.env with: CERE_WALLET_PASSWORD=your_password")] }),
      new Paragraph({ numbering: { reference: "steps", level: 0 }, children: [new TextRun("Add .secrets/ to .gitignore")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Working Imports")] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
        new TextRun({ text: "import { DdcClient, MAINNET, JsonSigner, File, Tag, FileUri }", font: "Courier New", size: 19 }),
      ] }),
      new Paragraph({ shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, children: [
        new TextRun({ text: "  from '@cere-ddc-sdk/ddc-client';", font: "Courier New", size: 19 }),
      ] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun({ text: "These are the only imports needed for store/read operations.", italics: true, color: "666666" }),
      ] }),

      // === WORKING CODE ===
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Complete Working Code")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("This code is tested and working on Cere DDC Mainnet as of 2026-02-01.")] }),

      // Code block
      ...[
        '// ddc-exchange.mjs — Store and Read on DDC Mainnet',
        'import { DdcClient, MAINNET, JsonSigner, File, Tag, FileUri }',
        "  from '@cere-ddc-sdk/ddc-client';",
        "import { readFileSync } from 'fs';",
        '',
        '// === CONFIG ===',
        "const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));",
        "const password = 'YOUR_PASSWORD'; // or read from .env",
        'const BUCKET_ID = 1229n; // Note: BigInt required (n suffix)',
        '',
        '// === CONNECT ===',
        'const signer = new JsonSigner(walletJson, { passphrase: password });',
        'const client = await DdcClient.create(signer, MAINNET);',
        '// ^ Second arg is preset directly, NOT { clusterAddress: MAINNET }',
        '',
        '// === STORE ===',
        'const data = JSON.stringify({',
        "  type: 'agent-message',",
        "  from: 'your-agent-name',",
        '  timestamp: new Date().toISOString(),',
        "  content: 'Your message here'",
        '});',
        '',
        'const file = new File(Buffer.from(data), { // Buffer required, not string',
        '  tags: [new Tag("type", "agent-message")]',
        '});',
        '',
        'const result = await client.store(BUCKET_ID, file);',
        'console.log("CID:", result.cid.toString());',
        '',
        '// === READ ===',
        "const fileUri = new FileUri(BUCKET_ID, 'baebb4i...'); // CID as string",
        'const response = await client.read(fileUri);',
        '// response.body is async iterable, NOT response itself',
        'const chunks = [];',
        'for await (const chunk of response.body) chunks.push(chunk);',
        "const content = Buffer.concat(chunks).toString('utf-8');",
        '',
        'await client.disconnect();',
      ].map(line => new Paragraph({
        spacing: { before: 0, after: 0 },
        shading: { fill: "1a1a2e", type: ShadingType.CLEAR },
        children: [new TextRun({ text: line || ' ', font: "Courier New", size: 18, color: "E0E0E0" })]
      })),

      // === GOTCHAS ===
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("⚠️ SDK Gotchas & Known Issues")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("These are real issues encountered during implementation. "),
        new TextRun({ text: "Each one cost debugging time.", bold: true }),
        new TextRun(" The fixes below are verified working."),
      ] }),

      // Gotcha 1
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1. @polkadot/util version warnings (IGNORE)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Symptom:", bold: true }), new TextRun(" ~15 warnings about multiple @polkadot/util versions on every run.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Impact:", bold: true }), new TextRun(" None. Everything works. The SDK has conflicting polkadot dependency versions.")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Fix:", bold: true }), new TextRun(" Ignore, or pipe output through: "), new TextRun({ text: "grep -v 'multiple versions'", font: "Courier New", size: 20 })] }),

      // Gotcha 2
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2. DdcClient.create() — Signer format")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Symptom:", bold: true }), new TextRun(" 'Unable to match provided value to a secret URI' or 'Cannot read properties of undefined'")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Cause:", bold: true }), new TextRun(" Passing raw JSON string or Polkadot KeyringPair instead of JsonSigner.")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "❌ WRONG: ", bold: true, color: "CC0000" }), new TextRun({ text: "DdcClient.create(jsonString, MAINNET)", font: "Courier New", size: 20 })] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "❌ WRONG: ", bold: true, color: "CC0000" }), new TextRun({ text: "DdcClient.create(keyringPair, MAINNET)", font: "Courier New", size: 20 })] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "✅ CORRECT: ", bold: true, color: "008800" }), new TextRun({ text: "DdcClient.create(new JsonSigner(json, {passphrase}), MAINNET)", font: "Courier New", size: 20 })] }),

      // Gotcha 3
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3. DdcClient.create() — Second argument")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Symptom:", bold: true }), new TextRun(" 'Cannot read properties of undefined (reading isReady)'")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "❌ WRONG: ", bold: true, color: "CC0000" }), new TextRun({ text: "DdcClient.create(signer, { clusterAddress: MAINNET })", font: "Courier New", size: 20 })] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "✅ CORRECT: ", bold: true, color: "008800" }), new TextRun({ text: "DdcClient.create(signer, MAINNET)", font: "Courier New", size: 20 })] }),

      // Gotcha 4
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4. client.read() — Needs FileUri")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Symptom:", bold: true }), new TextRun(" 'uri argument is neither FileUri or DagNodeUri'")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "❌ WRONG: ", bold: true, color: "CC0000" }), new TextRun({ text: "client.read(bucketId, cid)", font: "Courier New", size: 20 })] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "✅ CORRECT: ", bold: true, color: "008800" }), new TextRun({ text: "client.read(new FileUri(BUCKET_ID, cidString))", font: "Courier New", size: 20 })] }),

      // Gotcha 5
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5. client.read() response — NOT async iterable")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Symptom:", bold: true }), new TextRun(" 'reader is not async iterable'")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Cause:", bold: true }), new TextRun(" The response object has a .body property that is the async iterable, not the response itself.")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "❌ WRONG: ", bold: true, color: "CC0000" }), new TextRun({ text: "for await (const chunk of response) { ... }", font: "Courier New", size: 20 })] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "✅ CORRECT: ", bold: true, color: "008800" }), new TextRun({ text: "for await (const chunk of response.body) { ... }", font: "Courier New", size: 20 })] }),

      // Gotcha 6
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6. getDeposit() — Broken on mainnet")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Symptom:", bold: true }), new TextRun(" 'clusterLedger is not a function'")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Cause:", bold: true }), new TextRun(" SDK/mainnet pallet API mismatch. getBalance() works fine. Just skip getDeposit().")] }),

      // Gotcha 7-9
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7. Blockchain connection takes 5-10 seconds")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("DdcClient.create() connects to wss://rpc.mainnet.cere.network/ws. Set minimum 30s timeout. Don't assume instant connection.")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8. Bucket ID must be BigInt")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "❌ WRONG: ", bold: true, color: "CC0000" }), new TextRun({ text: "const BUCKET_ID = 1229;", font: "Courier New", size: 20 })] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "✅ CORRECT: ", bold: true, color: "008800" }), new TextRun({ text: "const BUCKET_ID = 1229n;  // note the 'n' suffix", font: "Courier New", size: 20 })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("9. File constructor needs Buffer")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "❌ WRONG: ", bold: true, color: "CC0000" }), new TextRun({ text: 'new File("hello")', font: "Courier New", size: 20 })] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [new TextRun({ text: "✅ CORRECT: ", bold: true, color: "008800" }), new TextRun({ text: 'new File(Buffer.from("hello"))', font: "Courier New", size: 20 })] }),

      // Gotcha 10
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("10. No HTTP Gateway for Mainnet — Cannot view CIDs in browser")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Symptom:", bold: true }), new TextRun(" Testnet docs reference cdn.testnet.cere.network for browser-viewable URLs. No mainnet equivalent exists.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "What we tried:", bold: true })] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [new TextRun({ text: "cdn.mainnet.cere.network", font: "Courier New", size: 20 }), new TextRun(" — DNS does not resolve")] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [new TextRun({ text: "storage.mainnet.cere.network", font: "Courier New", size: 20 }), new TextRun(" — DNS does not resolve")] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [new TextRun("Direct storage node URLs (storage-*.ddc-dragon.com) — Connection timeout. Nodes use gRPC only, not HTTP.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Impact: ", bold: true, color: "CC0000" }), new TextRun("Critical DX gap. Cannot share a clickable link to DDC content. The 'share via URL' quickstart docs are testnet-only. Mainnet requires SDK.")] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "FFE8E8", type: ShadingType.CLEAR }, children: [
        new TextRun({ text: "This is arguably the biggest DX gap. ", bold: true }),
        new TextRun("If you can't show someone a URL, the 'decentralized storage' value prop is invisible. Every competitor (IPFS, Arweave, Filecoin) has browser gateways. Mainnet needs cdn.mainnet.cere.network deployed."),
      ] }),

      // === WHAT'S NOT WORKING ===
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("🚫 What's NOT Working Yet")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Do not attempt these features. They will fail.", bold: true, color: "CC0000" })] }),
      
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [new TextRun({ text: "Client-side encryption (EDEK)", bold: true }), new TextRun(" — ADR is 'Proposed', code not implemented")] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [new TextRun({ text: "EncryptionGrant / delegated access", bold: true }), new TextRun(" — not shipped, blocks trustless agent-to-agent")] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [new TextRun({ text: "Key Escrow Service (KES)", bold: true }), new TextRun(" — not deployed anywhere")] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, children: [new TextRun({ text: "DAC Verification with .proto files", bold: true }), new TextRun(" — code exists but proto paths undocumented")] }),
      new Paragraph({ numbering: { reference: "bullet-main", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "getDeposit() API call", bold: true }), new TextRun(" — pallet mismatch on mainnet")] }),

      new Paragraph({ spacing: { after: 200 }, shading: { fill: "FFF3CD", type: ShadingType.CLEAR }, children: [
        new TextRun({ text: "⚠️ Alpha scope = unencrypted store/read only. ", bold: true }),
        new TextRun("This is sufficient for agent-to-agent data exchange as a proof of concept. Encryption comes in Phase 2."),
      ] }),

      // === EXCHANGE ARCHITECTURE ===
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Architecture: Agent-to-Agent Exchange")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("Two agents store and read data from a shared DDC bucket. CIDs are shared via any channel (Telegram, webhook, etc).")] }),

      ...[
        "  Agent A (Mart)                    Agent B (Bren)",
        "       │                                  │",
        "       │ store(bucket, file)               │ store(bucket, file)",
        "       ▼                                  ▼",
        "  ┌──────────────────────────────────────────┐",
        "  │         DDC Mainnet — Bucket 1229         │",
        "  │                                           │",
        "  │  CID-A: baebb4ig...  ←→  CID-B: baebb4ix..│",
        "  │  Tags: type, from, to                     │",
        "  │  DAC: logs every read/write               │",
        "  └──────────────────────────────────────────┘",
        "       │                                  │",
        "       │ read(FileUri(bucket, CID-B))     │ read(FileUri(bucket, CID-A))",
        "       ▼                                  ▼",
        "  Mart reads Bren's data          Bren reads Mart's data",
      ].map(line => new Paragraph({
        spacing: { before: 0, after: 0 },
        shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
        children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "333333" })]
      })),

      // === TEST DATA ===
      new Paragraph({ spacing: { before: 300 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("Test: Read Mart's Message")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("Use this CID to verify your setup works — it contains Claudemart's first message on DDC:")] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [
        new TextRun({ text: "Bucket: ", bold: true }), new TextRun({ text: "1229", font: "Courier New" }),
      ] }),
      new Paragraph({ spacing: { after: 60 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [
        new TextRun({ text: "CID: ", bold: true }), new TextRun({ text: "baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu", font: "Courier New", size: 18 }),
      ] }),
      new Paragraph({ spacing: { after: 200 }, shading: { fill: "E8FFE8", type: ShadingType.CLEAR }, children: [
        new TextRun({ text: "Network: ", bold: true }), new TextRun({ text: "wss://rpc.mainnet.cere.network/ws", font: "Courier New", size: 18 }),
      ] }),
    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('/Users/martijnbroersma/clawd/DDC-Agent-Exchange-Report.docx', buffer);
console.log('✅ Document created: DDC-Agent-Exchange-Guide.docx');
