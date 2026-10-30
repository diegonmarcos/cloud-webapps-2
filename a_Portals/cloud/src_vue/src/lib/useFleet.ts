import { ref } from 'vue'
import type { ServiceSection, TreeService } from './types'
// ponytail: static import bundled by vite-plugin-singlefile; file is a symlink to 1_front-configs/dist/
import fleetJson from '../data/cloud-fleet-declared.json'

const SUBGROUP_ICON: Record<string, string> = {
  'Security': '🔐', 'Network': '🌐', 'Observability': '📊', 'APIs-MCPs': '🔌',
  'Productivity': '⚙️', 'AI-Agents': '🤖', 'Communications': '💬', 'Finance': '💰',
  'Databases': '🗄️', 'Data': '📦', 'Media': '🎬', 'Vault': '🔑', 'News': '📰',
}

const PROVIDER_ICON: Record<string, string> = {
  'oci': '🟠', 'gcp': '🔵', 'vast': '⚡', 'aws': '🟡', 'cf': '🟧',
}

const PROVIDER_LABEL: Record<string, string> = {
  'oci': 'Oracle Cloud', 'gcp': 'Google Cloud', 'vast': 'Vast.ai', 'aws': 'AWS', 'cf': 'Cloudflare',
}

function iconFor(subgroup: string): string {
  return SUBGROUP_ICON[subgroup] ?? '📦'
}

export function useFleet() {
  const serviceSections = ref<ServiceSection[]>([])
  const treeServices = ref<TreeService[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  function load() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloud = (fleetJson as any).cloud

      // --- serviceSections: group infra-apps + user-apps by subgroup ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allContainers: any[] = [
        ...cloud.fleet.containers['infra-apps'],
        ...cloud.fleet.containers['user-apps'],
      ]
      const bySubgroup = new Map<string, typeof allContainers>()
      for (const c of allContainers) {
        const grp: string = c.subgroup ?? 'Other'
        if (!bySubgroup.has(grp)) bySubgroup.set(grp, [])
        bySubgroup.get(grp)!.push(c)
      }
      serviceSections.value = [...bySubgroup.entries()].map(([title, svcs]) => ({
        title,
        services: svcs.map(s => ({
          id: s.id as string,
          name: s.name as string,
          description: s.vm as string,
          url: (s.public_url as string) ?? '',
          status: 'online' as const,
          icon: iconFor(title),
        })),
      }))

      // --- treeServices: providers → VMs → services ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allVMs: any[] = [
        ...cloud.fleet.vms['vm-x86'],
        ...cloud.fleet.vms['vm-arm'],
      ]
      const byProvider = new Map<string, typeof allVMs>()
      for (const vm of allVMs) {
        const prefix: string = (vm.id as string).split('-')[0]
        if (!byProvider.has(prefix)) byProvider.set(prefix, [])
        byProvider.get(prefix)!.push(vm)
      }
      treeServices.value = [...byProvider.entries()].map(([prefix, vms]) => {
        const pLabel = PROVIDER_LABEL[prefix] ?? prefix.toUpperCase()
        return {
          id: 'prov-' + prefix,
          type: 'vps' as const,
          label: pLabel,
          title: pLabel,
          icon: PROVIDER_ICON[prefix] ?? '☁️',
          config: prefix,
          status: 'online' as const,
          siblings: vms.map(vm => ([{
            id: vm.id as string,
            type: 'vm' as const,
            title: (vm.alias ?? vm.id) as string,
            icon: '🖥️',
            config: (vm.arch ?? '') as string,
            subtitle: (vm.ip ?? '') as string,
            status: 'online' as const,
            children: allContainers
              .filter(c => c.vm === vm.id)
              .map(c => ({
                id: c.id as string,
                type: 'service' as const,
                title: c.name as string,
                icon: iconFor(c.subgroup as string),
                port: c.port ? `:${c.port}` : undefined,
                status: 'online' as const,
                clickable: !!c.public_url,
                url: (c.public_url ?? '') as string,
              })),
          }])),
        } as TreeService
      })
    } catch (e) {
      error.value = String(e)
    }
    loading.value = false
  }

  return { serviceSections, treeServices, loading, error, load }
}
