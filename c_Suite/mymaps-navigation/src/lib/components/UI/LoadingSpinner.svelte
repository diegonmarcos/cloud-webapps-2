<script lang="ts">
  let { size = 24, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width="2"
  class="loading-spinner"
>
  <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16">
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 12 12"
      to="360 12 12"
      dur="0.8s"
      repeatCount="indefinite"
    />
  </circle>
</svg>

<style>
  .loading-spinner {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
