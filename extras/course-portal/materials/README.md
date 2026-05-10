# Portal Materials Export

This folder is a copy/export of portal runtime materials. It does not replace the source files that the portal loads.

## Structure
- `MANIFEST.json` is the source of truth for copied files, categories, lessons, topics, and missing source assets.
- `raw-data/` contains a faithful copy of every `data/**/*.js` runtime file.
- `source-assets/lessons/` contains lesson source assets from `lessons/`.
- `by-lesson/` contains generated indexes per lesson.
- `by-topic/` contains generated indexes per topic and subtopic.
- `exam100/` groups Exam100 runtime data and exam-prep references.
- `reference-guides/` groups reference docs and guide runtime data.
- `unclassified-runtime-data/` keeps runtime files that were not classified automatically.

## Counts
- Generated at: 2026-05-09T08:48:58.261Z
- Runtime data files: 122
- Lessons: 29
- Topics: 5
- Unclassified runtime files: 1
- Data scripts referenced by index.html: 118

## Boundaries
- This export is copy-only.
- It excludes `node_modules`, `dist`, QA reports, tests, and full training outputs outside `data/`.
- Missing `sourceAssets` are recorded as `missing` in the manifest instead of being replaced.
