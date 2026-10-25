/* MyMail — data-driven configuration
 * All UI content is rendered from this file.
 * Edit here, not in index.html.
 *
 * Page structure: TITLE → USER → CONFIG → DEV
 */
const MYMAIL = {
  branding: {
    name: "MyMail",
    tagline: "Secure private email infrastructure",
  },

  primaryEmail: "me@diegonmarcos.com",

  // ════════════════════════════════════════════════════
  // USER — access points, accounts, auth
  // ════════════════════════════════════════════════════

  user: {
    frontends: [
      { label: "SnappyMail", href: "https://mail.diegonmarcos.com/snappy", css: "qb-webmail", icon: "mail", desc: "Webmail client" },
      { label: "SnappyMail (direct)", href: "https://webmail.diegonmarcos.com", css: "qb-webmail", icon: "mail", desc: "Direct access" },
    ],
    backends: [
      { label: "Stalwart Admin", href: "https://mail.diegonmarcos.com/stalwart", css: "qb-stalwart", icon: "shield", desc: "Admin + JMAP" },
      { label: "Stalwart (direct)", href: "https://mail-stalwart.diegonmarcos.com", css: "qb-stalwart", icon: "shield", desc: "Direct subdomain" },
      { label: "Maddy Server", href: "https://mail.diegonmarcos.com/maddy", css: "qb-maddy", icon: "gear", desc: "Primary MTA (info)" },
    ],
    apis: [
      { label: "mail-mcp", href: "https://mcp.diegonmarcos.com/mail-mcp/mcp", css: "qb-mcp", icon: "code", desc: "MCP Streamable HTTP" },
      { label: "C3 API", href: "https://api.diegonmarcos.com/c3-api", css: "qb-api", icon: "terminal", desc: "REST — health, debug" },
      { label: "Resend API", href: "https://api.resend.com", css: "qb-resend", icon: "activity", desc: "Transactional sending" },
    ],
    accounts: [
      { addr: "me@diegonmarcos.com", tags: ["maddy", "stalwart"] },
      { addr: "no-reply@diegonmarcos.com", tags: ["maddy", "resend"] },
      { addr: "admin@diegonmarcos.com", tags: ["stalwart"] },
    ],
    auth: [
      { label: "Authelia SSO", id: "authelia-sso", prefix: "https://auth.diegonmarcos.com/authelia/?rd=", icon: "lock", active: true },
      { label: "Authelia 2FA", id: "authelia-2fa", prefix: "https://auth.diegonmarcos.com/authelia/?rd=", icon: "shield-check" },
    ],
  },

  // ════════════════════════════════════════════════════
  // CONFIG — client settings, domains, security
  // ════════════════════════════════════════════════════

  config: {
    servers: {
      maddy: {
        label: "Maddy (primary)",
        host: "mail.diegonmarcos.com",
        ports: [
          { label: "IMAP", value: "993", proto: "SSL/TLS", hint: "Receive mail. Implicit TLS." },
          { label: "SMTP", value: "465", proto: "SSL/TLS", hint: "Send mail. Implicit TLS." },
          { label: "Submission", value: "587", proto: "STARTTLS", hint: "STARTTLS. Use if your client lacks port 465." },
          { label: "JMAP / Admin", value: null, proto: "N/A", disabled: true },
        ],
      },
      stalwart: {
        label: "Stalwart (shadow)",
        host: "mail-stalwart.diegonmarcos.com",
        ports: [
          { label: "IMAP", value: "2993", proto: "SSL/TLS" },
          { label: "SMTP", value: "2465", proto: "SSL/TLS" },
          { label: "Submission", value: "2587", proto: "STARTTLS" },
          { label: "JMAP / Admin", value: "2443", proto: "HTTPS" },
        ],
      },
    },
    calendar: {
      host: "cal.diegonmarcos.com",
      port: "5232",
      label: "Calendar / Contacts Server",
    },
    sendingDomains: [
      { domain: "diegonmarcos.com", tag: "maddy", desc: "Primary" },
      { domain: "mails.diegonmarcos.com", tag: "resend", desc: "Transactional" },
    ],
    pgp: {
      fingerprint: "A597 D379 58A5 3FE1 EDA8 C4FF FA31 9D63 749E 3F19",
      fingerprintRaw: "A597D37958A53FE1EDA8C4FFFA319D63749E3F19",
      algorithm: "Ed25519 / cv25519",
      expires: "2028-03-01",
      downloadFile: "public-key.asc",
    },
    dns: {
      "diegonmarcos.com": [
        { label: "MX", values: ["22 route1.mx.cloudflare.net", "85 route2.mx.cloudflare.net", "97 route3.mx.cloudflare.net"] },
        { label: "DMARC", values: ["p=reject; sp=reject", "rua=postmaster@"] },
        { label: "SPF", full: true, values: ["v=spf1 ip4:130.110.251.193 include:_spf.mx.cloudflare.net include:amazonses.com include:eu.rp.oracleemaildelivery.com -all"] },
        { label: "DKIM (selector: default)", full: true, values: ["v=DKIM1; k=rsa; p=MIIBIjANBgkq...DAQAB"] },
      ],
      "mails.diegonmarcos.com (Resend)": [
        { label: "MX", values: ["None (send-only)"] },
        { label: "DKIM (selector: resend)", values: ["RSA-1024"] },
      ],
    },
  },

  // ════════════════════════════════════════════════════
  // DEV — infrastructure, URLs, flow, ports
  // ════════════════════════════════════════════════════

  dev: {
    mailFlow: {
      inbound: [
        { label: "Internet", css: "fn-ext" },
        { label: "CF Email Routing", css: "fn-cf" },
        { label: "CF Worker", css: "fn-cf" },
        { label: "smtp-proxy :8080", css: "fn-proxy" },
        { label: "Maddy :25", css: "fn-maddy" },
      ],
      inboundShadow: { label: "Stalwart", css: "fn-stalwart" },
      outbound: [
        { label: "Maddy :465/:587", css: "fn-maddy" },
        { label: "OCI Relay :587", css: "fn-relay" },
        { label: "Recipient MX", css: "fn-ext" },
      ],
    },
    urls: {
      "Public HTTPS (Caddy L7)": [
        { url: "mail.diegonmarcos.com", desc: "Mail hub (this page)" },
        { url: "mail.diegonmarcos.com/snappy", desc: "SnappyMail via hub" },
        { url: "mail.diegonmarcos.com/maddy", desc: "Maddy info via hub" },
        { url: "mail.diegonmarcos.com/stalwart", desc: "Stalwart via hub" },
        { url: "webmail.diegonmarcos.com", desc: "SnappyMail (direct)" },
        { url: "smtp.diegonmarcos.com", desc: "smtp-proxy" },
        { url: "mail-stalwart.diegonmarcos.com", desc: "Stalwart (direct)" },
      ],
      "Private (.app WireGuard)": [
        { url: "snappymail.app", port: ":8888" },
        { url: "smtp-proxy.app", port: ":8080" },
        { url: "stalwart.app", port: ":2443" },
        { url: "maddy.app", port: "TCP only" },
        { url: "mail-mcp.app", port: ":3103" },
      ],
      "Service APIs (native)": [
        { url: "mail-stalwart.diegonmarcos.com/api/", desc: "Stalwart Admin REST" },
        { url: "mail-stalwart.diegonmarcos.com/.well-known/jmap", desc: "Stalwart JMAP" },
        { url: "webmail.diegonmarcos.com/?admin", desc: "SnappyMail Admin" },
        { url: "smtp.diegonmarcos.com", desc: "smtp-proxy (HTTP\u2192SMTP)" },
      ],
      "Platform APIs (cloud)": [
        { url: "mcp.diegonmarcos.com/mail-mcp/mcp", desc: "mail-mcp MCP" },
        { url: "api.diegonmarcos.com/c3-api", desc: "C3 REST API" },
        { url: "api.resend.com", desc: "Resend API (transactional)" },
      ],
      "L4 TCP Passthrough (Caddy)": [
        { port: ":993", url: "IMAPS \u2192 Maddy" },
        { port: ":465", url: "SMTPS \u2192 Maddy" },
        { port: ":587", url: "Submission \u2192 Maddy" },
        { port: ":2993", url: "IMAPS \u2192 Stalwart" },
        { port: ":2465", url: "SMTPS \u2192 Stalwart" },
        { port: ":2587", url: "Submission \u2192 Stalwart" },
        { port: ":2443", url: "HTTPS \u2192 Stalwart JMAP" },
      ],
    },
  },

  footer: [
    { label: "Linktree", href: "https://linktree.diegonmarcos.com", shimmer: true, icon: "globe" },
    { label: "Cloud", href: "https://cloud.diegonmarcos.com", icon: "cloud" },
  ],
};
