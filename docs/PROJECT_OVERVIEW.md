# TravelSplit iOS — Project Overview & Documentation Map

> Auto-generated and maintained by **Documentation Agent**. Last refreshed: `2026-08-19T00:53:17.573Z`.

---

## 📚 Complete Documentation Index

| Document | Purpose & Contents |
| :--- | :--- |
| **[Architecture Documentation](./ARCHITECTURE.md)** | System layers, presentation HIG structure, data flow, and synchronization. |
| **[Core Mathematical Engines](./CORE_ENGINES.md)** | Exact formulas for Equal, Exact, %, Shares, Itemized Bill with tax/tip, and Greedy Bipartite Debt Minimization. |
| **[API & Convex Reference](./API_AND_CONVEX_REFERENCE.md)** | Express REST API endpoints, parameters, responses, and Convex serverless schema/functions. |
| **[RBAC & Security Guide](./RBAC_SECURITY.md)** | Role permissions matrix (Owner, Editor, Viewer) and access control enforcement. |
| **[Codebase Inventory & Index](./CODEBASE_INDEX.md)** | Automated file index with lines of code and symbol mappings. |

---

## 🛠️ Automated Documentation Agent
This codebase includes an automated documentation scanner in `scripts/doc-agent.ts`.
Whenever you commit changes or trigger CI/CD, the agent scans the codebase, re-computes code metrics, updates file mappings, and refreshes the documentation suite automatically!

To run manually:
```bash
npm run doc-agent
```
