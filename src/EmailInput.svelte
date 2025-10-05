<script lang="ts">
  let { email = $bindable() }: { email: string } = $props();

  const focusOnVisible = (node: HTMLElement) => {
    const observer = new IntersectionObserver(
      (entries) => {
        const someIntersecting = entries.some((entry) => entry.isIntersecting);
        if (someIntersecting) {
          node.focus();
        }
      },
      { threshold: 1.0 },
    );
    observer.observe(node);
    return {
      destroy() {
        observer.disconnect();
      },
    };
  };
  let completion = $derived(/^[12][0-9]{6}$/.test(email) ? "@apps.nsd.org" : "");
</script>

<div class="wrapper">
  <input
    type="email"
    placeholder="Email"
    bind:value={email}
    class="focus-inset"
    use:focusOnVisible
    onkeydown={(e) => {
      if (!completion) return;
      if (e.key != "ArrowRight") return;

      email += completion;

      (e.currentTarget.parentElement?.nextElementSibling as HTMLElement | null)?.focus();
    }}
  />
  {#if completion}
    <span>
      <div class="key">→</div>
      {completion}
    </span>
  {/if}
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    position: relative;
  }
  input {
    height: 3rem;
    padding: 0 0.75rem;
    border-radius: var(--m3-util-rounding-medium);
    background-color: rgb(var(--m3-scheme-surface-container));
    color: rgb(var(--m3-scheme-on-surface));
    width: 100%;
    box-sizing: border-box;
  }
  span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    position: absolute;
    top: 50%;
    right: 1rem;
    translate: 0 -50%;
    color: rgb(var(--m3-scheme-on-surface-variant));
    pointer-events: none;
    .key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      border-radius: var(--m3-util-rounding-extra-small);
      border: solid 1px rgb(var(--m3-scheme-on-surface-variant));
    }
  }
</style>
