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

// import {
//     getIPFSdata, saveMembraneToIPFS, getTsymb, getTokenSymbol, getTokenSymbolLoop,  createDAO, createSubDAO, validateDAO, validateIsMembrane, createMembrane,
//      hasSufficientBalance, mintMembership, cleanIndecisionLog, getInternalTokenBalanceOfD, getBaseTokenBalanceOfD,
//       createEndpoint, trickleFeed, withdrawEndpoint, getEndpointsOfUser, submitRedistriVals, getSelectedInternalTBalance,
//        setRedistriVals, pushRedistriVal, fetchSubDAOs, submitWrap, approveWrap, fromRootChanged, getRootToken,
//         getTLP, isNotEndpoint, getInflationRate, setInternalTokenAddress, getInflationPerDay,
//          getInstantiatedAt, getParentDAO, getMemberNr, isMembrane, typeOfIndecision, getCurrentInflation,
//            getCurrentMembrane, getCurrentUri, supportChange, assertInflation, assertMembrane 
// } from "$lib/odaos";

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
import { getFirestore, collection, addDoc, query, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import * as onChain from "$lib/odaos"



let isOnMountLoading;

let WLWbalance;
let allOrders
let currentUserData;
let db;
let aliases;

export let data;

const doM = async () => {
    const client = new MoneriumClient();
    const authClient = await client.auth(data.placeholder);

    allOrders = await client.getOrders();
    allOrders = JSON.stringify(allOrders);
    console.log(allOrders)
}

// const client = new MoneriumClient()


  




const init = async () => {
    const firebaseConfig = {
    apiKey: data.fbk,
    authDomain: "walllaw-sepa.firebaseapp.com",
    projectId: "walllaw-sepa",
    storageBucket: "walllaw-sepa.appspot.com",
    messagingSenderId: "133865257036",
    appId: "1:133865257036:web:86d6a5ebccd5dbf36f5ce9"
  };
const app = initializeApp(firebaseConfig);

return app;
}

const setAddrName = async (addrValue, newName) => {

        let currentUserRef = doc(db, "users", $signerAddress);

        currentUserData.aliases[addrValue] = newName;
        currentUserData = currentUserData;

        await updateDoc(currentUserRef, currentUserData);
        let newDoc =  await getDoc(currentUserRef);
        console.log("alias set or updated for ", addrValue, "as ", newName );
        }

  onMount( async () => {
    isOnMountLoading = true;
    let timestamp =  Date.now();

let isLoggedIn = sessionStorage.getItem("loggedIn");


 const app =  getApps().length == 0 ? await init() : getApps[0];
 db = getFirestore(app);




    if (isLoggedIn == "true") {
        await defaultEvmStores.setProvider();

        const currentUserRef =  doc(db, "users", $signerAddress);
const currentUser = await getDoc(currentUserRef);
currentUserData =  currentUser.data();



    if (currentUser.exists()) {
        console.log("user exists ", currentUser);

    } else {

        const docData = {
            address: $signerAddress,
            lastAt: Date.now()
        };
    
        await setDoc(doc(db, "users",  $signerAddress), {
  address: $signerAddress,
  since: timestamp,
  lastAt: timestamp,
  declaredHashes:{ timestamp: "hashofdeclaredaroudnat%%%%%%%time" },
  aliases: {"0x0000000000000": "0x|zero address","0xaaa":"AAAnameaddr"}

});

    }}

isOnMountLoading= false;


setAddrName(String(ethers.constants.AddressZero), "addr0000", currentUserData);


  console.log($chainId)

  let MRaddress = AddrX[$chainId].MEMBERregistry;
  let  MemberRegistry = new ethers.Contract( MRaddress, IMember1155ABI, $provider);
  let ReadMemberRegistry = MemberRegistry.connect($provider);
  let activeMemberships = await ReadMemberRegistry.getActiveMembershipsOf($signerAddress)
  console.log("active memberships of: ", $signerAddress, activeMemberships);


})


const logOut = async () => {
    sessionStorage.setItem("loggedIn", "false");
    defaultEvmStores.disconnect();
    // defaultEvmStores.setProvider(null);
    location.reload();
  };




</script>



{#if isOnMountLoading}
Loading...
{:else}


    <div class="container {isOnMountLoading ? " d-none" : " "}">
        <br>
        <div class="row row-top">
            <div class="col-11">                  
                <div class="chain-data">
                    <span class="signerAddress">
                        {#if $signerAddress}
                          {$signerAddress}
                        {:else}
                         <span class="userAddress"> {ethers.constants.AddressZero} </span>
                        {/if}
                      </span>
                    <span> I am @ </span> 
                    {#if $chainId}
                        {#if AddrX[$chainId] } 
                    <span class="chainName">
                        <span class="text network-name"> {$chainData.name}<span class="chainid"> : {$chainData.chainId}</span>  </span> 
                    </span>
                        {:else}
                        <span class="unsupportedChainName">
                        -- <b> Unsupported </b> Chain {$chainData.name}<span class="chainid"> : {$chainData.chainId}</span>  --- 
                        </span>
                        {/if}
                    {/if}
                </div>
            </div>
            <div class="col-1">
                <div class="inOurbtn">
                    {#if $signerAddress}
                      <button class="btn logOutbtn" on:click={logOut}> exit <i class="bi bi-escape"></i> </button>
                    {/if}
                  </div>
            </div>
          </div>

        <br>
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
    .row-top {
        color: var(--main-peach);
        font-family: 'domine';
        font-weight: 50;
    }

    .logOutbtn {
        font-weight: 900;
        font-family: 'domine';
    }
    .chainid {
        opacity: 20%;
    }

    .signerAddress {
        opacity: 20%;
    }
    
    /* font-family: 'Domine', serif;
font-family: 'Lustria', serif; */


</style>
