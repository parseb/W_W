<script>
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let open = false;
  export let showBackdrop = true;
  export let onClosed;
  export let title = "Modal title";

  const modalClose = (data) => {
    open = false;
    if (onClosed) {
      onClosed(data);
    }
  };
</script>

{#if open}
  <div
    class="modal"
    id="sampleModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="sampleModalLabel"
    aria-hidden={false}
  >
    <div class="container">
      <div
        class="modal-dialog"
        role="document"
        in:fly={{ y: -50, duration: 300 }}
        out:fly={{ y: -50, duration: 300, easing: quintOut }}
      >
        <div class="modal-content">
          <div class="top part">
            <div class="container">
              <div class="row">
                <div class="col-10" />
                <div class="col-2">
                  <button
                    class="btn btn-outline-close float-end"
                    data-dismiss="modal"
                    aria-label="Close"
                    on:click={() => modalClose("close")}
                  >
                    <b> <i class="bi bi-x-circle" /></b>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <slot />
        </div>
      </div>
    </div>
  </div>
  {#if showBackdrop}
    <div class="modal-backdrop show" transition:fade={{ duration: 150 }} />
  {/if}
{/if}

<style>
  .btn-outline-close {
    font-size: larger;
  }
  .modal {
    display: block;
  }
</style>
