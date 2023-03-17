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

    import Modal from './components/Modal.svelte';

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

    import { MoneriumClient } from "@monerium/sdk";
    import { initializeApp, getApps } from "firebase/app";
    import {
        getFirestore,
        collection,
        addDoc,
        query,
        doc,
        getDoc,
        setDoc,
        updateDoc,
    } from "firebase/firestore";



    import * as onChain from "$lib/odaos";

    let isOnMountLoading;

    let WLWbalance;
    let allOrders;
    let currentUserData;
    let db;
    let aliases;
    let Memberships = [];
    let selectedOx;
    let selected0xName;
    let ORGdata;
    let orgDataLoading;

    export let data;

    const doM = async () => {
        const client = new MoneriumClient();
        const authClient = await client.auth(data.placeholder);

        allOrders = await client.getOrders();
        allOrders = JSON.stringify(allOrders);
        console.log(allOrders);
    };

    // const client = new MoneriumClient()

    const init = async () => {
        const firebaseConfig = {
            apiKey: data.fbk,
            authDomain: "walllaw-sepa.firebaseapp.com",
            projectId: "walllaw-sepa",
            storageBucket: "walllaw-sepa.appspot.com",
            messagingSenderId: "133865257036",
            appId: "1:133865257036:web:86d6a5ebccd5dbf36f5ce9",
        };
        const app = initializeApp(firebaseConfig);

        return app;
    };

    const getCurrentUserData = async () => {
        let currentUserRef = doc(db, "users", $signerAddress);
        currentUserData = await getDoc(currentUserRef);
        currentUserData = currentUserData.data();
        return currentUserData;
    }

    const setAddrName = async (addrValue, newName) => {
        if (! currentUserData) currentUserData = await getCurrentUserData();
        let currentUserRef = doc(db, "users", $signerAddress);
        currentUserData.aliases[addrValue] = newName;
        currentUserData = currentUserData;

        await updateDoc(currentUserRef, currentUserData);
        let newDoc = await getDoc(currentUserRef);
        console.log("alias set or updated for ", addrValue, "as ", newName);
    };

    const getNameFormAddress = async (givenAddr) => {
        if (! currentUserData) currentUserData = await getCurrentUserData();
        let name = ( currentUserData.aliases[givenAddr]  ? currentUserData.aliases[givenAddr] : givenAddr);
        console.log("name", name)
        return name;
    }

    const getmemberships = async () => {
        let MRaddress = AddrX[$chainId].MEMBERregistry;
        let MemberRegistry = new ethers.Contract(
            MRaddress,
            IMember1155ABI,
            $provider
        );
        let ReadMemberRegistry = MemberRegistry.connect($provider);
        let activeMemberships = await ReadMemberRegistry.getActiveMembershipsOf(
            $signerAddress
        );
        console.log("memberships ", activeMemberships)
        return activeMemberships;
    }

    onMount(async () => {
        isOnMountLoading = true;
        let timestamp = Date.now();

        let isLoggedIn = sessionStorage.getItem("loggedIn");

        const app = getApps().length == 0 ? await init() : getApps[0];
        db = getFirestore(app);

        if (isLoggedIn == "true") {
            await defaultEvmStores.setProvider();

            const currentUserRef = doc(db, "users", $signerAddress);
            const currentUser = await getDoc(currentUserRef);
            currentUserData = currentUser.data();

            if (currentUser.exists()) {
                console.log("user exists ", currentUser);
            } else {
                const docData = {
                    address: $signerAddress,
                    lastAt: Date.now(),
                };

                await setDoc(doc(db, "users", $signerAddress), {
                    address: $signerAddress,
                    since: timestamp,
                    lastAt: timestamp,
                    declaredHashes: {
                        timestamp: "hashofdeclaredaroudnat%%%%%%%time",
                    },
                    aliases: {
                        "0x0000000000000": "0x|zero address",
                        "0xaaa": "AAAnameaddr",
                    },
                });
            }
        }

        isOnMountLoading = false;

        setAddrName(
            String(ethers.constants.AddressZero),
            "addr0000",
            currentUserData
        );

        // Memberships = await getmemberships();
        // Memberships = Memberships.length == 0 ? false : Memberships
        Memberships = ["AAAAA", "BBBBB", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"];

    });

    let showPopup = false;
    let showPopupAddM = false;
    let showPopupInvest = false;

const onShowPopup = (id) => {
    if (id == 'invest') showPopupInvest = true;
    if (id =='addM' ) showPopupAddM = true;
}

const onPopupClose = (id) => {
    if (id == 'invest') showPopupInvest = false;
    if (id =='addM' ) showPopupAddM = false;
}

    const logOut = async () => {
        sessionStorage.setItem("loggedIn", "false");
        defaultEvmStores.disconnect();
        location.reload();
    };

    const setCurrentOrgData = async (orgAddr) => {
           orgDataLoading = true;
           console.log("setting current org data");
           orgDataLoading = false;
    }

    const selectedOrg = async (selectedDaoAddress) => {
        selectedOx = selectedDaoAddress;
        await setCurrentOrgData(selectedDaoAddress);
        selected0xName = await getNameFormAddress(selectedDaoAddress);
        
    }




</script>

{#if isOnMountLoading}
    Loading...
{:else}
    <div class="container {isOnMountLoading ? ' d-none' : ' '}">
        <br />
        <div class="row row-top">
            <div class="col-11">
                <div class="chain-data">
                    <span class="signerAddress">
                        {#if $signerAddress}
                            {$signerAddress}
                        {:else}
                            <span class="userAddress">
                                {ethers.constants.AddressZero}
                            </span>
                        {/if}
                    </span>
                    <span> I am @ </span>
                    {#if $chainId}
                        {#if AddrX[$chainId]}
                            <span class="chainName">
                                <span class="text network-name">
                                    {$chainData.name}<span class="chainid">
                                        : {$chainData.chainId}</span
                                    >
                                </span>
                            </span>
                        {:else}
                            <span class="unsupportedChainName">
                                -- <b> Unsupported </b> Chain {$chainData.name}<span
                                    class="chainid"
                                >
                                    : {$chainData.chainId}</span
                                > ---
                            </span>
                        {/if}
                    {/if}
                </div>
            </div>
            <div class="col-1">
                <div class="inOurbtn">
                    {#if $signerAddress}
                        <button class="btn logOutbtn" on:click={logOut}>
                            exit <i class="bi bi-escape" />
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <div classs="container container-main">
        <div class="container-select-view">
            <div class="row">     
                <div class="col-5">
                    <div class="dao-selector">
                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle orgSelector"  type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                {#if selectedOx}
                                    { selected0xName }
                                {:else}
                                { Memberships  ? "Select Organisation" : "no memberships" }  
                                {/if}
       
                            </button>
                            <ul class="dropdown-menu">
                                {#each Memberships as dao }
                                <li class="dao-select-item"><a class="dropdown-item" on:click={selectedOrg(dao)}>{dao}</a></li>
                                {/each}
                            </ul>
                          </div>
                          <br>
                    </div>
                </div>
                <div class="col-3">
                    <button class="btn btn-add-entity"   on:click={() => { onShowPopup('addM')} } >
                        <i class="bi bi-building-add">
                            Add Entity Membership
                        </i>
                    </button>         
                </div>
                <div class="col-2">
                    <button class="btn btn-add-entity" disabled  on:click={()=> {alert("disabled in explorer")}} >
                        <i class="bi bi-plus-circle">
                            New Organisation 
                        </i>
                    </button>  
                </div>
                <div class="col-2">
                    <button class="btn btn-add-entity"   on:click={ () => { onShowPopup('invest')}} >
                        <i class="bi bi-currency-euro">
                            Invest                  
                        </i>
                    </button>         
                </div>
            </div>
          </div>
          <div class="container">
            <Modal open={showPopupAddM} provider={$provider} signer={$signer}  onClosed={() => onPopupClose('addM')} >
            <div class="container container-popslot">
                <div class="row">
                    <div class="col-12">
                       abccc zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzzzzzzzz zzzzzzzzzzzzzzzzzzz
                    </div>
                </div>
            </div>
            </Modal>
          </div>
          <div class="container">
            <Modal open={showPopupInvest} provider={$provider} signer={$signer}  onClosed={() => onPopupClose('invest')} >
            <div class="container container-popslot">
                <div class="row">
                    <div class="col-12">
Invest ttttttttttttttttttt ttttttttttttttttttttttttttttttttttyyyyytttttttttttttttttttttttttttttttt0x0x0x 123
                    </div>
                </div>
            </div>
            </Modal>
          </div>

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



    .btn-add-entity {
        border: 1px solid;
        border-color: var(--main-green); 
        color: var(--main-peach);
    }

    .btn-add-entity:hover {
        color: var(--main-green);
    }

    .row-top {
        color: var(--main-peach);
        font-family: "domine";
        font-weight: 50;
    }

    .logOutbtn {
        font-weight: 900;
        font-family: "domine";
    }
    .chainid {
        opacity: 20%;
    }

    .signerAddress {
        opacity: 20%;
    }

    .container-select-view {
        border: 1px solid;
        border-radius: 10px;
        padding: 10px 10px 10px 10px;
        border-color: var(--main-blue);
    }


    .orgSelector {
        border: 1px solid;
        border-color: --main-green;
        margin: 5px 5px 5px 5px;
        background-color: rgba(1,1,1,0.1);
        
    }

    .orgSelector:hover {
        border: 1px solid;
        border-color: var(--main-green);
    }

    .dropdown-menu {
        background-color: rgba(171, 146, 146, 0.1);
    }

    .dao-select-item {
        background-color: rgba(1, 1, 1, 0.1);

    }

    .dropdown-item:hover {
        border: 1px solid;
        background-color: rgba(171, 146, 146, 0.1);
        border-color: var(--main-green);
        color: var(--main-green);

    }

    /* font-family: 'Domine', serif;
font-family: 'Lustria', serif; */
</style>
