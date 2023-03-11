<script>
  import {
    defaultEvmStores,
    connected,
    provider,
    chainId,
    chainData,
    signer,
    signerAddress,
    contracts,
  } from "svelte-ethers-store";
  import { ethers } from "ethers";
  import { element, onMount } from "svelte/internal";

  import {
    AddrX,
    ERC20ABI,
    IDAO20ABI,
    IODAOABI,
    IinstanceDAOABI,
    IMember1155ABI,
    IMembraneABI,

  } from "./chainData/abi/ABIS";



  let loading;

   const logIn = async () => {
    const p = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await p.send("eth_requestAccounts", []);
    const signer = p.getSigner();
    defaultEvmStores.setProvider(p);
    sessionStorage.setItem("loggedIn", "true");
    console.log(signerAddress);
  };

   const logOut = async () => {
    sessionStorage.setItem("loggedIn", "false");
    defaultEvmStores.disconnect();
    // defaultEvmStores.setProvider(null);
    location.reload();
  };

  onMount(async () => {

    // add a test to return in SSR context
    let isLoggedIn = sessionStorage.getItem("loggedIn");
    if (isLoggedIn == "true") {
      await defaultEvmStores.setProvider();
      let chainAddr = AddrX[$chainId];


      await defaultEvmStores.attachContract(
        "WALLtoken",
        chainAddr.WALLtoken,
        WALLtokenABI
      );





      await defaultEvmStores.attachContract("ODAO", chainAddr.ODAO, IODAOABI);

      await defaultEvmStores.attachContract(
        "MEMBERregistry",
        chainAddr.MEMBERregistry,
        IMember1155ABI
      );

      loading = false;
  }});


  let prevElement;



</script>



{#if loading}


<div class="container container-loading">
  
</div>

{:else}

  {#if $signerAddress}
  <div class="container">
    <slot />
  </div>
  {:else}
  <div class="container">
    <br>
    <br>
    <div class="title text-center">
      <br>
      <h1 class="blendin">\   |  | | | | |  |  |  /</h1>
      <h1 class="title-walllaw">WalllaW</h1>
      <h3 class="title-walllaw">explorer</h3>
    </div>
    <div class="row">
      <div class="col-4"></div>

      <div class="col-4 text-center">
        <br>
        
        <button type="button" class="btn btn-outline-gold " on:click={logIn} > 
          <br>
          <br>
          Wallet In 
          <br>
          <br>
          <br>
          <br>
          <br>

        
        </button>
      </div>
      <div class="col-4">

      </div>

    </div>
  </div>

  {/if}

{/if}






<style>


  :root {
        --main-gold: #FFDE4F;
        --main-blue: #1e51da;
        --main-green: #2cc0a6;
        --main-light: #c8ccc2;
        --main-peach: #dec5a0;
        --main-red: #cc403a;
        --dark-grey: #222323;
        --main-black: #101011;
    }

    .btn-outline-gold {
      border: 1px solid;
      border-color: var(--main-light);
      color: var(--main-light)
    }

    .btn-outline-gold:hover {
      color:var(--main-gold);
      border-color: var(--main-gold);

    }


    h1.title-walllaw {
      color: var(--main-light);
      font-size: 60px;
      font-family: 'Domine', serif;
    }

    h3.title-walllaw {
      color: var(--main-light);
      font-size: 40px;
      font-family: 'Lustria', serif;
    }

    .blendin {
      color: #181A1B;
      color: var(--main-light);
      font-size: 60px;
      font-family: 'Domine', serif;
    }
    
    /* font-family: 'Domine', serif;
font-family: 'Lustria', serif; */


</style>
