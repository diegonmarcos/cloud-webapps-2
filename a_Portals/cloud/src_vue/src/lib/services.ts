import type { ServiceSection, TreeService } from './types';

export const icons = {
  analytics: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  sync: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  n8n: '<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>',
  oracle: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  gcloud: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  server: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><circle cx="12" cy="10" r="3" fill="currentColor"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  proxy: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  firewall: '<rect x="5" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 15 4-4-4-4"/><line x1="13" y1="15" x2="17" y2="15"/>',
  dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  cards: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  tree: '<path d="M12 2v6"/><path d="M12 8L6 14"/><path d="M12 8l6 6"/><circle cx="12" cy="2" r="2"/><circle cx="6" cy="16" r="2"/><circle cx="18" cy="16" r="2"/><path d="M6 18v4"/><path d="M18 18v4"/>',
  architecture: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  ai: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
};

export const serviceSections: ServiceSection[] = [
  {
    title: 'Services',
    services: [
      {
        id: 'analytics',
        name: 'Matomo Analytics',
        description: 'analytics.diegonmarcos.com',
        url: 'https://analytics.diegonmarcos.com',
        status: 'online',
        icon: icons.analytics,
      },
      {
        id: 'sync',
        name: 'Syncthing',
        description: 'sync.diegonmarcos.com',
        url: 'https://sync.diegonmarcos.com',
        status: 'online',
        icon: icons.sync,
      },
      {
        id: 'n8n',
        name: 'n8n Orchestrator',
        description: 'n8n.diegonmarcos.com',
        url: 'https://n8n.diegonmarcos.com',
        status: 'online',
        icon: icons.n8n,
      },
    ],
  },
  {
    title: 'VPS',
    services: [
      {
        id: 'vps-oracle',
        name: 'Oracle Cloud',
        description: 'Console & OCI CLI',
        url: 'https://cloud.oracle.com/',
        status: 'online',
        icon: icons.oracle,
        cliInstall: 'bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"',
        cliConnect: 'oci compute instance list --compartment-id $OCI_COMPARTMENT_ID',
      },
      {
        id: 'vps-gcloud',
        name: 'Google Cloud',
        description: 'Console & gcloud CLI',
        url: 'https://console.cloud.google.com/',
        status: 'online',
        icon: icons.gcloud,
        cliInstall: 'curl https://sdk.cloud.google.com | bash && exec -l $SHELL && gcloud init',
        cliConnect: 'gcloud compute instances list',
      },
    ],
  },
  {
    title: 'VMs',
    services: [
      {
        id: 'vm-webserver1',
        name: 'Oracle/web-server-1',
        description: 'Matomo, Syncthing, NPM',
        url: 'ssh://ubuntu@130.110.251.193',
        status: 'online',
        icon: icons.server,
        sshCommand: 'ssh ubuntu@130.110.251.193',
        proxyUrl: 'http://130.110.251.193:81',
        firewallUrl: 'https://cloud.oracle.com/networking/vcns',
      },
      {
        id: 'vm-servicesserver1',
        name: 'Oracle/services-server-1',
        description: 'n8n Orchestrator, NPM',
        url: 'ssh://ubuntu@129.151.228.66',
        status: 'online',
        icon: icons.server,
        sshCommand: 'ssh ubuntu@129.151.228.66',
        proxyUrl: 'http://129.151.228.66:81',
        firewallUrl: 'https://cloud.oracle.com/networking/vcns',
      },
      {
        id: 'vm-arch1',
        name: 'GCloud/Arch1',
        description: 'arch-server',
        url: 'ssh://user@pending',
        status: 'pending',
        icon: icons.server,
        sshCommand: 'ssh user@[pending]',
      },
    ],
  },
  {
    title: 'Under Development',
    services: [
      {
        id: 'mail',
        name: 'Mail Server',
        description: 'SMTP / IMAP',
        url: '#pending',
        status: 'pending',
        icon: icons.mail,
      },
      {
        id: 'terminal',
        name: 'Web Terminal',
        description: 'Browser-based SSH',
        url: '#pending',
        status: 'pending',
        icon: icons.terminal,
      },
      {
        id: 'dashboard',
        name: 'DevOps Dashboard',
        description: 'Monitoring & Metrics',
        url: '#pending',
        status: 'pending',
        icon: icons.dashboard,
      },
    ],
  },
];


export const treeServices: TreeService[] = [
  {
    id: 'iaas-vps',
    type: 'section',
    label: 'VPS IaaS (Raw)',
    icon: '☁️', // Placeholder, will replace with proper icons
    title: 'VPS IaaS (Raw)',
    children: [
      {
        id: 'oracle-cloud',
        type: 'vps',
        title: 'Oracle Cloud',
        icon: '🟠',
        status: 'online',
        config: 'Always Free',
        expanded: true,
        siblings: [
          [ // web-server-1 Column
            {
              id: 'vm-webserver1',
              type: 'vm',
              title: 'web-server-1',
              icon: '🖥️',
              config: 'ARM64 A1.Micro',
              status: 'online',
              expanded: true,
              children: [
                { id: 'os-webserver1', type: 'os', title: 'Ubuntu 24.04', icon: '🐧', subtitle: '130.110.251.193', expanded: true,
                  children: [
                    { id: 'service-analytics', type: 'service', title: 'Matomo', icon: '📊', port: ':8080', status: 'online', clickable: true, url: 'https://analytics.diegonmarcos.com' },
                    { id: 'service-syncthing', type: 'service', title: 'Syncthing', icon: '🔄', port: ':8384', status: 'online', clickable: true, url: 'https://sync.diegonmarcos.com' },
                    { id: 'service-nginx-proxy-web1', type: 'service', title: 'Nginx Proxy', icon: '🔀', port: ':80,:443,:81', status: 'online' },
                    { id: 'service-mariadb', type: 'service', title: 'MariaDB', icon: '🗄️', port: ':3306', status: 'online' },
                  ]
                },
              ]
            }
          ],
          [ // services-server-1 Column
            {
              id: 'vm-servicesserver1',
              type: 'vm',
              title: 'services-server-1',
              icon: '🖥️',
              config: 'ARM64 A1.Micro',
              status: 'online',
              expanded: true,
              children: [
                { id: 'os-servicesserver1', type: 'os', title: 'Ubuntu 24.04', icon: '🐧', subtitle: '129.151.228.66', expanded: true,
                  children: [
                    { id: 'service-n8n', type: 'service', title: 'n8n Orchestrator', icon: '⚙️', port: ':5678', status: 'online', clickable: true, url: 'https://n8n.diegonmarcos.com' },
                    { id: 'service-nginx-proxy-services1', type: 'service', title: 'Nginx Proxy', icon: '🔀', port: ':80,:443,:81', status: 'online' },
                  ]
                },
              ]
            }
          ],
          [ // VPS Flex Column (Pending)
            {
              id: 'vm-vps-flex',
              type: 'vm',
              title: 'VPS Flex',
              icon: '🖥️',
              config: 'ARM64 24GB RAM',
              status: 'pending',
              expanded: true,
              children: [
                { id: 'os-vps-flex', type: 'os', title: 'Ubuntu TBD', icon: '🐧', status: 'pending' },
              ]
            }
          ],
          [ // Planned Column
            {
              id: 'container-planned-services',
              type: 'container',
              title: 'Planned Services',
              icon: '⏳',
              expanded: true,
              children: [
                { id: 'service-mail', type: 'service', title: 'Mail Server', icon: '📧', status: 'pending', clickable: true, url: '#pending' },
              ]
            }
          ]
        ]
      }
    ]
  },
  {
    id: 'google-cloud',
    type: 'vps',
    title: 'Google Cloud',
    icon: '🔵',
    status: 'online',
    config: 'Active',
    expanded: true,
    siblings: [
      [ // Arch VM Column
        {
          id: 'vm-arch1',
          type: 'vm',
          title: 'Arch1',
          icon: '🖥️',
          config: 'e2-micro',
          status: 'pending',
          expanded: true,
          children: [
            { id: 'os-arch1', type: 'os', title: 'Arch Linux', icon: '🐧', status: 'pending' },
          ]
        }
      ]
    ]
  },
  {
    id: 'paas-app-host',
    type: 'section',
    label: 'PaaS - Managed App Host',
    icon: '🚂',
    title: 'PaaS - Managed App Host',
    children: [
      {
        id: 'hugging-face',
        type: 'vps',
        title: 'Hugging Face',
        icon: '🤗',
        config: 'Spaces',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-gradio-apps', type: 'service', title: 'Gradio Apps', icon: '🚀', status: 'pending' }
          ]
        ]
      },
      {
        id: 'koyeb-railway-render',
        type: 'vps',
        title: 'Koyeb / Railway / Render',
        icon: '🚂',
        config: 'App Hosting',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-container-apps', type: 'service', title: 'Container Apps', icon: '📦', status: 'pending' }
          ]
        ]
      }
    ]
  },
  {
    id: 'faas-agent-logic-host',
    type: 'section',
    label: 'FaaS - Agent Logic Host (Serverless GPU)',
    icon: '⚡',
    title: 'FaaS - Agent Logic Host (Serverless GPU)',
    children: [
      {
        id: 'google-cloud-serverless',
        type: 'vps',
        title: 'Google Cloud',
        icon: '🔵',
        config: 'Functions',
        status: 'online',
        expanded: true,
        siblings: [
          [
            { id: 'service-cloud-function', type: 'service', title: 'Cloud Function', icon: '⚡', status: 'online' },
            { id: 'service-pubsub', type: 'service', title: 'Pub/Sub', icon: '📨', status: 'online' },
            { id: 'service-budget-alert', type: 'service', title: 'Budget Alert', icon: '💰', status: 'online' },
          ]
        ]
      },
      {
        id: 'modal',
        type: 'vps',
        title: 'Modal',
        icon: '⚡',
        config: 'Serverless GPU',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-gpu-functions', type: 'service', title: 'GPU Functions', icon: '🎮', status: 'pending' }
          ]
        ]
      },
      {
        id: 'beam-runpod',
        type: 'vps',
        title: 'Beam / RunPod',
        icon: '☁️',
        config: 'Serverless',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-gpu-inference', type: 'service', title: 'GPU Inference', icon: '🎮', status: 'pending' }
          ]
        ]
      }
    ]
  },
  {
    id: 'maas-the-brain',
    type: 'section',
    label: 'MaaS - The Brain / API (Inference)',
    icon: '🧠',
    title: 'MaaS - The Brain / API (Inference)',
    children: [
      {
        id: 'hugging-face-serverless-api',
        type: 'vps',
        title: 'Hugging Face',
        icon: '🤗',
        config: 'Serverless API',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-inference-api', type: 'service', title: 'Inference API', icon: '🧠', status: 'pending' }
          ]
        ]
      },
      {
        id: 'groq',
        type: 'vps',
        title: 'Groq',
        icon: '⚡',
        config: 'LPU Inference',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-fast-llm-api', type: 'service', title: 'Fast LLM API', icon: '🚀', status: 'pending' }
          ]
        ]
      },
      {
        id: 'together-ai-openrouter',
        type: 'vps',
        title: 'Together AI / OpenRouter',
        icon: '🔀',
        config: 'Multi-Model',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-llm-router', type: 'service', title: 'LLM Router', icon: '🧠', status: 'pending' }
          ]
        ]
      }
    ]
  },
  {
    id: 'aas-agent-sandbox',
    type: 'section',
    label: 'AaaS - Agent Sandbox (Agent Infra)',
    icon: '🤖',
    title: 'AaaS - Agent Sandbox (Agent Infra)',
    children: [
      {
        id: 'e2b',
        type: 'vps',
        title: 'E2B',
        icon: '📦',
        config: 'Code Execution',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-sandboxed-runtime', type: 'service', title: 'Sandboxed Runtime', icon: '🔒', status: 'pending' }
          ]
        ]
      },
      {
        id: 'relevance-ai',
        type: 'vps',
        title: 'Relevance AI',
        icon: '🦾',
        config: 'Agent Platform',
        status: 'pending',
        expanded: true,
        siblings: [
          [
            { id: 'service-ai-agents', type: 'service', title: 'AI Agents', icon: '🤖', status: 'pending' }
          ]
        ]
      }
    ]
  }
];
