<script>
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let open = false;
  export let showBackdrop = true;
  export let onClosed;
  export let title = "";

  export let provider;
  export let signer;

  const modalClose = (data) => {
    open = false;
    if (onClosed) {
      onClosed(data);
    }
  };
</script>

{#if open}
  <div
    class="modal modal-xl"
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
                <div class="col-10" >
                  <span class="module-name">
                    { title }
                  </span>
                </div>
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
          <div class="row contentRow">
            <slot />
          </div>
          <br>
        </div>

      </div>
    </div>
  </div>
  {#if showBackdrop}
    <div class="modal-backdrop show" transition:fade={{ duration: 150 }} />
  {/if}
{/if}

<style>
:root {
        --main-blue: #1e51da;
        --main-green: #2cc0a6;
        --main-light: #c8ccc2;
        --main-peach: #dec5a0;
        --main-red: #cc403a;
        --dark-grey: #222323;
        --main-black: #101011;
    }

  .btn-outline-close {
    font-size: larger;
  }
  .modal {
    margin-top: 4%;
    display: block;
    
  }

  .contentRow {
    margin: 0 auto;
    width: 1000px;
  }

  .modal-content {
    background-color: var(--main-red);
    opacity: 85%;
  }

.module-name {
  font-family: 'domine';
  font-size: 200%;
  color: rgba(200, 204, 194, 0.36);
  
}

.bi.bi-x-circle:hover {
  color: var(--main-light);
}


</style>
