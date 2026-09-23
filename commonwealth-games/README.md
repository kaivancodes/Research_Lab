# Research Labs

A standalone research-workspace frontend for the Commonwealth Games 2030 opinion-analysis project.

## Structure
- `index.html` — main Research Labs interface
- `css/style.css` — restrained dark-blue interface matching the existing Perceptual Hashing research system
- `js/papers-data.js` — 27 research papers/resources, including the supplied graph-based summarization paper
- `js/app.js` — overview, roadmap, papers, GREEN, YELLOW, BLUE and private research workspace
- `Research_Labs_Workspaces.xlsx` — editable research workbook created separately

## Run
Open `index.html` in a browser, or serve the folder with any static HTTP server.

The workspace currently stores notes in browser localStorage. No backend or GitHub repository is modified by this version.

## Research workflow
The roadmap is not a day-by-day plan. It follows the Green → Yellow → Blue academic process:
1. Freeze scope and research question.
2. Read and map literature.
3. Establish the research gap.
4. Design source/data plan.
5. Design pilot protocol.
6. Freeze proposed architecture.
7. Submit GREEN.
8. Collect pilot data.
9. Validate semantic opinion grouping.
10. Automate scalable collection.
11. Run NLP analysis.
12. Run contextual weighting.
13. Run graph summarization.
14. Evaluate.
15. Interpret.
16. Complete YELLOW.
17. Write BLUE last.


### Commonwealth interaction
The Commonwealth Games workspace now uses a collapsible RL sidebar, dedicated paper pages with reading tracking and multi-note storage, previous/next paper navigation, and a separate private workspace accessed with Control + Shift + C. The Research Lab home page does not register the private shortcut.
