# Cloud Portal Website Structure

> **Source**: `/home/diego/Documents/Git/front-Github_io/a_Cloud/cloud/src_vanilla/`
> **Live URL**: https://cloud.diegonmarcos.com
> **Updated**: 2025-12-26

---

## Pages

| Page | File | Purpose |
|------|------|---------|
| Landing | `index.html` | Animated splash screen with 5-second auto-redirect |
| Products | `products.html` | Main dashboard - service catalog, tree view, features |
| Cloud Control | `cloud_control.html` | Infrastructure monitoring - topology, cost, monitor tabs |
| Architecture | `architecture.html` | Visual architecture diagrams |
| Error | `error.html` | Error page |
| OAuth Callback | `oauth-callback.html` | OAuth2 authentication callback handler |

---

## Navigation Structure

### Level 1: Main Navigation
```
[User] - products.html
[Cloud Control] - cloud_control.html
[Architecture] - architecture.html
```

### Level 2: Page Tabs

**Products Page Tabs:**
- Products (Service Catalog)
- Connect (Cloud Infrastructure Access)
- Features (Cloud Portal Capabilities)

**Cloud Control Page Tabs:**
- Topology (VMs, Services, Containers)
- Cost (Spend, Free Tier, Comparison)
- Monitor (Real-time status, Audit logs)

---

## Products Page Structure

### Products Tab - Service Categories

| Category | Products | Status |
|----------|----------|--------|
| **AI** | Chat Multi-Model, WebIDE | dev |
| **Inbox** | Mail&Cal, Feed | on/dev |
| **Object Files** | Photos, Drive&Suite | on/dev |
| **Media** | Music, Videos&Movies | dev |
| **Me** | Linktree, Maps | on/dev |

### Connect Tab - Cloud Access

| Category | Services | Status |
|----------|----------|--------|
| **Cloud** | Cloud App | on |
| **Security** | VPN, Vault | dev |
| **Developer** | API Endpoints, MCP Tools | dev |

### Features Tab - Capabilities

Lists infrastructure features:
- Multi-page Navigation
- Theme System (Blurred, Dark, Minimalistic)
- Category Filtering
- Responsive Design
- Single-File Build
- Offline Capable

Backend Services:
- Flask REST API, Redis Cache, SQLite, MariaDB
- Mailu SMTP/IMAP, Roundcube Webmail, Rspamd
- Photoprism Gallery, Radicale CalDAV

---

## Tree View Structure (Status Tree)

### IaaS - Self-Hosted VPS Hierarchy

```
Google Cloud [dev]
├── [CLI] gcloud [on]
└── VM: GCloud_microe2Linux_1 [dev]
    ├── Services
    │   └── mail-app [dev], terminal-app [dev], npm-gcloud [dev]
    ├── Data
    │   └── mail-db [dev]
    └── OS: Arch Linux (us-central1-a)

Oracle Cloud [on]
├── [CLI] oci [on]
├── VM: Oracle_Web_Server_1 (130.110.251.193) [on]
│   ├── Services
│   │   └── cloud-app [on], n8n-infra-app [on], cloud-api [on]
│   │       npm-oracle-web [on], git-app [dev], vpn-app [dev], cache-app [hold]
│   ├── Data
│   │   └── n8n-infra-db [on], git-db [dev]
│   └── OS: Ubuntu 22.04
├── VM: Oracle_Services_Serv (129.151.228.66) [on]
│   ├── Services
│   │   └── analytics-app [on], npm-oracle-services [on]
│   ├── Data
│   │   └── analytics-db [on], cloud-db [dev]
│   └── OS: Ubuntu 22.04
└── VM: oci-p-flex_1 (84.235.234.87) [wake]
    ├── Services
    │   └── photoprism-app, radicale-app, redis
    ├── Data
    │   └── photoprism-db
    └── OS: Ubuntu 22.04 Minimal

Generic VPS (TBD) [tbd]
└── VM: Generic_Infra [tbd]
    └── (placeholder for future expansion)
```

---

## Status Badges

| Badge | Meaning | Color |
|-------|---------|-------|
| `on` | Running and accessible | Green |
| `dev` | Under active development | Blue |
| `wake` | Wake-on-Demand (dormant by default) | Cyan |
| `hold` | Waiting for resources | Yellow |
| `tbd` | Planned for future | Gray |

---

## Theme System

Three themes with localStorage persistence:
1. **Blurred** (default) - Glass morphism effects
2. **Dark** - High contrast dark mode
3. **Minimalistic** - Clean, reduced UI

---

## Assets

- `/public/cloud_thumbnail_optimized.jpg` - OG image for social sharing
- `styles.css` - Main stylesheet
- `cloud_data.js` - Dynamic data (from cloud_control.json)
