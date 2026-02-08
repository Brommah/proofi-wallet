# Parse Granola Export for Action Items

You are processing an export from the Granola meeting notes app. Extract all action items, decisions, and follow-ups.

## Granola Export Format

Granola exports typically include:
- Meeting title and date
- Participant list
- AI-generated summary
- Full transcript or notes
- Sometimes pre-extracted action items (verify and enhance these)

## Special Handling for Granola

1. **Use the summary** as primary source - it's pre-filtered for relevance
2. **Cross-reference with transcript** for context and missed items
3. **Preserve participant names** as listed in the export
4. **Trust but verify** any pre-extracted actions - add missing owners/dates

## Input

{{#if json}}
Granola JSON export:
```json
{{notes}}
```
{{else}}
Granola export:
{{notes}}
{{/if}}

## Output Format

Same as standard extraction:

```markdown
# Action Items: [Meeting Title from Granola]
Date: [Date from Granola]
Participants: [From Granola participant list]
Source: Granola Export

## Action Items

- [ ] **[Task]** @[Owner] 📅 [Due]
  - Context: [From summary/transcript]
  - Priority: [Inferred]

## Decisions

- ✅ [Decision]

## Follow-ups

- [ ] **[Task]** @[Owner] 📅 [Date]

## Meeting Summary

[Include Granola's summary if useful]
```

Extract all items, even if Granola already identified some - you may find additional ones.
