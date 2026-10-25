<script lang="ts">
  import '../styles/globals.scss';

  let { children } = $props();
</script>

<div class="app">
  {@render children()}
</div>
