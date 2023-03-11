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



    import {
    AddrX,
    ERC20ABI,
    IDAO20ABI,
    IODAOABI,
    IinstanceDAOABI,
    IMember1155ABI,
    IMembraneABI,
  } from "./chainData/abi/ABIS";

    import { ethers, utils } from "ethers";
    import { onMount } from "svelte";
    import { constants } from "buffer";

    import { MoneriumClient } from '@monerium/sdk'
    import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";



let isOnMountLoading;

let WLWbalance;
let allOrders


export let data;

const doM = async () => {
    const client = new MoneriumClient();
    const authClient = await client.auth(data.placeholder);

    allOrders = await client.getOrders();
    allOrders = JSON.stringify(allOrders);
    console.log(allOrders)
}


  onMount( async () => {
    isOnMountLoading = true;
let isLoggedIn = sessionStorage.getItem("loggedIn");

const firebaseConfig = {
    apiKey: data.fbk,
    authDomain: "walllaw-sepa.firebaseapp.com",
    projectId: "walllaw-sepa",
    storageBucket: "walllaw-sepa.appspot.com",
    messagingSenderId: "133865257036",
    appId: "1:133865257036:web:86d6a5ebccd5dbf36f5ce9",
    measurementId: "G-7HL106JLPZ"
  };


    // let allapps = getApps();
    // let app;
    // if ( allapps.length == 0) {
    //     const app = initializeApp(firebaseConfig);
    // }

    const app = initializeApp(firebaseConfig);

// Initialize Firebase
 const db = getFirestore(app);
//  const auth = getAuth(app);

 console.log("dbapp name", db.app.name)
if (isLoggedIn == "true") {

  
    await defaultEvmStores.setProvider();




}

isOnMountLoading= false;

})



</script>



{#if isOnMountLoading}
Loading...
{:else}


    <div class="container {isOnMountLoading ? " d-none" : " "}">


        <button class="btn btn-info" on:click={doM}> do monerium stuff</button>
        <br>
        {allOrders} 
        {data.name}
    </div>

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

    
    /* font-family: 'Domine', serif;
font-family: 'Lustria', serif; */


</style>
