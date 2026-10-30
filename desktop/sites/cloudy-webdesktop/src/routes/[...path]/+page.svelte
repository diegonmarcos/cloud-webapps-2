<script lang="ts">
  // The desktop shell (#1321, plan E.3): permanent left rail (the SuperApp island's sections, same order), a top island
  // with the trail and search, the navigation pane (the app's or section's declared tree) and the content: the Cloud apps
  // grid, a suite app in an in-shell window, or the mobile page itself embedded.
  import { Icon, Window } from '@cloudy/ui';
  let { data } = $props();
  const v = $derived(data.view);
  let query = $state('');
  const groups = $derived(v.content.kind === 'home'
    ? v.content.groups.map((g) => ({ ...g, tiles: g.tiles.filter((t) => !query.trim() || t.label.toLowerCase().includes(query.trim().toLowerCase())) })).filter((g) => g.tiles.length)
    : []);
</script>

<svelte:head><title>{v.title}</title></svelte:head>

<Window />
<div class="desk" class:has-tree={v.tree.length > 0} data-testid="desk">
  <nav class="rail" aria-label="Sections" data-testid="desk-rail">
    {#each v.rail as r (r.id)}
      <a class="rail-item" class:on={r.selected} href={r.href} aria-current={r.selected ? 'page' : undefined} data-id={r.id}>
        <Icon name={r.icon} size={24} /><span>{r.label}</span>
      </a>
    {/each}
  </nav>

  <header class="island" data-testid="desk-island">
    <ol class="trail" data-testid="desk-trail">
      {#each v.crumbs as c, i (i)}<li>{#if c.href}<a href={c.href}>{c.label}</a>{:else}<span aria-current="page">{c.label}</span>{/if}</li>{/each}
    </ol>
    {#if v.content.kind === 'home'}
      <input class="search" type="search" placeholder="Search apps" aria-label="Search apps" bind:value={query} data-testid="desk-search" />
    {:else}
      <a class="mobile-link" href={v.content.mobileHref} data-testid="desk-mobile-link">Mobile view</a>
    {/if}
  </header>

  {#if v.tree.length}
    <nav class="tree" aria-label={v.treeTitle} data-testid="desk-tree">
      <h2>{v.treeTitle}</h2>
      {#each v.tree as t (t.id)}
        <a class="node" class:on={t.selected} class:head={t.depth === 0} style="--depth:{t.depth}" href={t.href} aria-current={t.selected ? 'page' : undefined}>
          {#if t.icon}<Icon name={t.icon} size={18} />{/if}<span>{t.label}</span>
        </a>
      {/each}
    </nav>
  {/if}

  <main class="content" data-testid="desk-content" data-kind={v.content.kind}>
    {#if v.content.kind === 'home'}
      <div class="groups">
        {#each groups as g (g.title)}
          <section class="group" data-group={g.title}>
            <h2>{g.title}</h2>
            <div class="tiles">
              {#each g.tiles as t (t.id)}
                {#if t.href}
                  <a class="tile" href={t.href} target={t.external ? '_blank' : undefined} rel={t.external ? 'noopener' : undefined}><Icon name={t.icon} size={32} /><span>{t.label}</span></a>
                {:else}
                  <span class="tile off" title="Opens on the phone"><Icon name={t.icon} size={32} /><span>{t.label}</span></span>
                {/if}
              {/each}
            </div>
          </section>
        {:else}
          <p class="none">No app matches “{query}”.</p>
        {/each}
      </div>
    {:else if v.content.kind === 'suite'}
      <section class="win" data-testid="desk-window" data-src={v.content.src}>
        <header class="win-bar"><Icon name={v.content.icon} size={18} /><span>{v.content.title}</span><a href={v.content.src} target="_blank" rel="noopener">Open</a></header>
        <iframe src={v.content.src} title={v.content.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" referrerpolicy="strict-origin" allow="fullscreen"></iframe>
      </section>
    {:else}
      <iframe class="mobile" src={v.content.src} title={v.title} data-testid="desk-mobile" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerpolicy="strict-origin"></iframe>
    {/if}
  </main>
</div>

<style>
  .desk { position: relative; z-index: 1; height: 100dvh; display: grid; grid-template-columns: 88px 0 1fr; grid-template-rows: 64px 1fr; gap: 12px; padding: 12px; box-sizing: border-box; color: var(--role-text-primary); font-family: var(--type-family-sans); }
  .desk.has-tree { grid-template-columns: 88px 280px 1fr; }
  .rail { grid-row: 1 / 3; display: flex; flex-direction: column; gap: 4px; padding: 8px 0; border-radius: 24px; background: color-mix(in srgb, var(--role-surface) 82%, transparent); border: 1px solid var(--role-hairline); }
  .rail-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; margin: 0 8px; border-radius: 16px; color: var(--role-text-secondary); text-decoration: none; font-size: 12px; }
  .rail-item.on { background: var(--role-surface-selected); color: var(--role-text-primary); font-weight: 600; }
  .island { grid-column: 2 / 4; display: flex; align-items: center; gap: 16px; padding: 0 20px; border-radius: 32px; background: color-mix(in srgb, var(--role-surface) 82%, transparent); border: 1px solid var(--role-hairline); }
  .desk:not(.has-tree) .island { grid-column: 3; }
  .trail { display: flex; gap: 8px; list-style: none; margin: 0; padding: 0; flex: 1; min-width: 0; font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; }
  .trail li + li::before { content: '/'; margin-right: 8px; color: var(--role-text-secondary); }
  .trail a { color: var(--role-text-secondary); text-decoration: none; }
  .search { width: 320px; height: 36px; border-radius: 18px; border: 1px solid var(--role-hairline); background: var(--role-surface); color: var(--role-text-primary); padding: 0 16px; font: inherit; font-size: 14px; }
  .mobile-link { color: var(--role-accent); text-decoration: none; font-size: 14px; }
  .tree { grid-row: 2; overflow-y: auto; padding: 12px 8px; border-radius: 24px; background: color-mix(in srgb, var(--role-surface) 82%, transparent); border: 1px solid var(--role-hairline); }
  .tree h2 { margin: 4px 12px 12px; font-size: 18px; }
  .node { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 12px 0 calc(12px + var(--depth) * 16px); border-radius: 12px; color: var(--role-text-secondary); text-decoration: none; font-size: 14px; }
  .node.head { color: var(--role-text-primary); font-weight: 600; }
  .node.on { background: var(--role-surface-selected); color: var(--role-text-primary); }
  .content { grid-row: 2; grid-column: 3; position: relative; min-width: 0; overflow: auto; border-radius: 24px; }
  .groups { display: flex; flex-direction: column; gap: 20px; padding: 4px; }
  .group h2 { margin: 0 0 10px 4px; font-size: 15px; color: var(--role-text-secondary); font-weight: 600; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 10px; }
  .tile { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 8px; border-radius: 20px; background: color-mix(in srgb, var(--role-surface) 82%, transparent); border: 1px solid var(--role-hairline); color: var(--role-text-primary); text-decoration: none; font-size: 13px; text-align: center; }
  .tile:hover { background: var(--role-surface-selected); }
  .tile.off { opacity: 0.55; }
  .none { color: var(--role-text-secondary); }
  .win { position: absolute; inset: 0; display: flex; flex-direction: column; border-radius: 24px; overflow: hidden; border: 1px solid var(--role-hairline); background: #000; }
  .win-bar { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 16px; background: linear-gradient(90deg, var(--role-surface-selected), var(--role-surface)); font-size: 14px; font-weight: 600; }
  .win-bar a { margin-left: auto; color: var(--role-accent); text-decoration: none; font-weight: 400; }
  .win iframe { flex: 1; border: 0; width: 100%; }
  iframe.mobile { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 24px; background: transparent; }
</style>
