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

    import Modal from "./components/Modal.svelte";

    import {
        getIPFSdata,
        saveMembraneToIPFS,
        // getTsymb,
        getTokenSymbol,
        getTokenSymbolLoop,
        createDAO,
        createSubDAO,
        validateDAO,
        validateIsMembrane,
        createMembrane,
        // hasSufficientBalance,
        // mintMembership,
        cleanIndecisionLog,
        getInternalTokenBalanceOfD,
        getBaseTokenBalanceOfD,
        createEndpoint,
        trickleFeed,
        withdrawEndpoint,
        getEndpointsOfUser,
        submitRedistriVals,
        getSelectedInternalTBalance,
        setRedistriVals,
        pushRedistriVal,
        fetchSubDAOs,
        submitWrap,
        approveWrap,
        fromRootChanged,
        getRootToken,
        getTLP,
        isNotEndpoint,
        getInflationRate,
        setInternalTokenAddress,
        getInflationPerDay,
        getInstantiatedAt,
        getParentDAO,
        getMemberNr,
        isMembrane,
        typeOfIndecision,
        getCurrentInflation,
        getCurrentMembrane,
        getCurrentUri,
        supportChange,
        assertInflation,
        assertMembrane,
        // isEligibleForMembership,
    } from "$lib/odaos";

    import {
        AddrX,
        ERC20ABI,
        IDAO20ABI,
        IODAOABI,
        IinstanceDAOABI,
        IMember1155ABI,
        IMembraneABI,
        ABstractA,
        DAO20Fact,
    } from "./chainData/abi/ABIS";

    import Graph from "./components/NetworkGraphSvelteSVG.svelte";

    import { ethers, getDefaultProvider, utils } from "ethers";
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
        increment,
    } from "firebase/firestore";

    import * as onChain from "$lib/odaos";
    import { parseEther } from "ethers/lib/utils";
    import { Jellyfish } from "svelte-loading-spinners";

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

    let mintMembershipAddress;
    let isEforM;
    let gotMembrane;
    let isMintDAO;
    let investInAddr;
    let isInvestable;
    let amountToInvest;
    let amtGas;
    let investmentInProgress;
    let sepaDATA;
    let lastAt;
    let currentUserNonce;
    let currentInternalTInvest;
    let isM;
    let activeIStep;
    let currentInvest = { status: 1 };
    let displayData = { nodes: [], links: [] };

    export let data;

    /// huh
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

    const isDAO = async (addrToCheck) => {
        let isD = await $contracts.ODAO.isDAO(addrToCheck);
        return isD;
    };

    const seTlastAt = async (instance) => {
        let isD = await isDAO(instance);
        if (isD) {
            let Dinstance = new ethers.Contract(
                instance,
                IinstanceDAOABI,
                $signer
            );
            lastAt = await Dinstance.lastAt();
        }
    };

    /// huh
    const doM = async () => {
        const client = new MoneriumClient();
        const authClient = await client.auth(data.placeholder);

        allOrders = await client.getOrders();
        allOrders = JSON.stringify(allOrders);
        console.log(allOrders);
    };

    const getCurrentUserData = async () => {
        let currentUserRef = doc(db, "users", $signerAddress);
        currentUserData = await getDoc(currentUserRef);
        currentUserData = currentUserData.data();
        return currentUserData;
    };

    const setAddrName = async (addrValue, newName) => {
        if (!currentUserData) currentUserData = await getCurrentUserData();
        let currentUserRef = doc(db, "users", $signerAddress);
        currentUserData.aliases[addrValue] = newName;
        currentUserData = currentUserData;

        await updateDoc(currentUserRef, currentUserData);
        let newDoc = await getDoc(currentUserRef);
        console.log("alias set or updated for ", addrValue, "as ", newName);
    };

    const getNameFormAddress = async (givenAddr) => {
        if (!currentUserData) currentUserData = await getCurrentUserData();
        let name = currentUserData.aliases[givenAddr]
            ? currentUserData.aliases[givenAddr]
            : givenAddr;
        console.log("name", name);
        return name;
    };

    const getmemberships = async () => {
        let MemberRegistry = new ethers.Contract(
            AddrX[$chainId].MEMBERregistry,
            IMember1155ABI,
            $signer
        );
        // let ReadMemberRegistry = await MemberRegistry.connect($provider);
        let activeMemberships = await MemberRegistry.getActiveMembershipsOf(
            $signerAddress
        );
        console.log("memberships ", activeMemberships);
        return activeMemberships;
    };

    const initContracts = async (provider) => {
        if (!provider) await defaultEvmStores.setProvider();
        await defaultEvmStores.attachContract(
            "MembraneRegistry",
            AddrX[$chainId].MembraneRegistry,
            IMembraneABI
        );
        await defaultEvmStores.attachContract(
            "Member1155",
            AddrX[$chainId].MEMBERregistry,
            IMember1155ABI
        );
        await defaultEvmStores.attachContract(
            "ODAO",
            AddrX[$chainId].ODAO,
            IODAOABI
        );
        await defaultEvmStores.attachContract(
            "AbstractA",
            AddrX[$chainId].AbstractA,
            ABstractA
        );
    };

    const getTsymb = async (addr) => {
        if (ethers.utils.isAddress(addr)) {
            let given20 = new ethers.Contract(addr, ERC20ABI, $provider);
            let symb = await given20.symbol();
            return symb;
        }
    };

    const hasSufficientBalance = async (address, amount) => {
        amount = ethers.utils.formatEther(amount);
        let given20 = new ethers.Contract(address, ERC20ABI, $provider);
        let balance = await given20.balanceOf($signerAddress);
        isEforM =
            isEforM == undefined
                ? balance >= amount
                : isEforM && balance >= amount;
        console.log("amount ", String(amount));
        console.log("balance", String(balance));
        console.log(
            "sufficient??? ",
            isEforM,
            balance >= amount,
            balance,
            amount
        );
        return balance >= amount;
    };

    onMount(async () => {
        isOnMountLoading = true;
        let timestamp = Date.now();

        let isLoggedIn = sessionStorage.getItem("loggedIn");

        const app = getApps().length == 0 ? await init() : getApps[0];
        db = getFirestore(app);

        if (isLoggedIn == "true") {
            let p = await defaultEvmStores.setProvider();
            await initContracts(p);
            await getCurrentNonce();

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

        let m = await getmemberships();
        Memberships = m.length == 0 ? ["no valid memberships found"] : m;
    });

    let showPopup = false;
    let showPopupAddM = false;
    let showPopupInvest = false;

    const onShowPopup = (id) => {
        if (id == "invest") {
            showPopupInvest = true;
            resetInvest();
        }
        if (id == "addM") showPopupAddM = true;
    };

    const onPopupClose = (id) => {
        if (id == "invest") showPopupInvest = false;
        if (id == "addM") showPopupAddM = false;
    };

    const logOut = async () => {
        sessionStorage.setItem("loggedIn", "false");
        defaultEvmStores.disconnect();
        location.reload();
    };

    const addNodeToDD = async (nodeaddr, parentAddr, dD) => {
        // let source, target, type, baseB, internalB, members;
        let nodeInstance = new ethers.Contract(
            nodeaddr,
            IinstanceDAOABI,
            $provider
        );

        parentAddr = parentAddr ? parentAddr : ethers.constants.AddressZero; 
        let isEndpoint = await nodeInstance.endpoint();
        isEndpoint = isEndpoint == nodeInstance ? 2 : 1;
        let baseTaddr = await nodeInstance.baseTokenAddress();
        let internalTaddr = await nodeInstance.internalTokenAddress();
        console.log(baseTaddr);
        let baseT = new ethers.Contract(baseTaddr, ERC20ABI, $provider);

        let baseTokenBalance = await baseT.balanceOf(nodeaddr);
        let baseTTotalS = await baseT.totalSupply();
        let baseTpercent = (baseTokenBalance / baseTTotalS) * 100;

        let internalT = new ethers.Contract(internalTaddr, ERC20ABI, $provider);
        let internalTokenBalance = await internalT.balanceOf(internalTaddr);


        let members = await $contracts.Member1155.getctiveMembersOf(
            nodeaddr
        );
        let membrane = await $contracts.MembraneRegistry.getInUseMembraneOfDAO(
            nodeaddr
        );

        displayData.nodes.push({
            id: nodeaddr,
            group: isEndpoint,
            baseToken: baseTaddr,
            internalToken: internalTaddr,
            baseBalance:  ethers.utils.formatEther(baseTokenBalance),
            internalBalance: ethers.utils.formatEther(internalTokenBalance),
            baseShare: baseTpercent,
        });

        displayData.links.push({
            source: nodeaddr,
            target: parentAddr,
            group: 1,
        });

        return displayData;

    };

    const setDisplayDataForRoot = async (addrI) => {
        let Dinstance = new ethers.Contract(addrI, IinstanceDAOABI, $provider);
        let onChainLastAt = await Dinstance.lastAt();
        if ("dbLastAt" != onChainLastAt) {
            console.log("I need to update db");
        }
        let tlp = await $contracts.ODAO.getTrickleDownPath(addrI);
        console.log("top level path", tlp);

        let daoFactoryAddr = await $contracts.ODAO.DAO20FactoryAddr();
        let Dfact = new ethers.Contract(daoFactoryAddr, DAO20Fact, $provider);

        let displayData = { nodes: [], links: [] };


        if  (tlp.length == 1) {
            console.log("no meaninfgul path", tlp);
            displayData = addNodeToDD(addrI, ethers.constants.ZeroAddress);
            return displayData;
        }

        let root = tlp[1];
        console.log("root dao", root);
        
        let rootInstance = new ethers.Contract(
            root,
            IinstanceDAOABI,
            $provider
        );
        let internalT = await rootInstance.internalTokenAddress();
        let Ds0 = await Dfact.getDAOsOfToken(internalT);

        let nodeCount = Ds0.length;

        if (tlp.length > 2) {
            /// @todo bft-time-constraint limited depth. endpoint up maybe.
            Ds0.forEach(async (D0) => {
                let Instance = new ethers.Contract(
                    D0,
                    IinstanceDAOABI,
                    $provider
                );
                let iToken = await Instance.internalTokenAddress();
                let subDs = await Dfact.getDAOsOfToken(iToken);

                subDs.forEach(async (sD1) => {
                    let Instance2 = new ethers.Contract(
                        sD1,
                        IinstanceDAOABI,
                        $provider
                    );

                    addNodeToDD(sD1, D0);
                });

                addNodeToDD(D0, root);
            });
        }

        
        displayData = displayData;
        return displayData;
    };

    const setCurrentOrgData = async (orgAddr) => {
        console.log("setting current org data");
        let gNode = {
            id: ethers.constants.AddressZero,
            group: 2,
            baseToken: '1',
            internalToken: '2',
            baseBalance: '3',
            internalBalance: '4',
            baseShare: '5',
        }

        let gLink = {
            source: gNode.id,
            target: orgAddr,
            group: 1,
        }

        displayData = { nodes: [], links: [] };

        displayData = await setDisplayDataForRoot(orgAddr);
        displayData.nodes.push(gNode);
        displayData.links.push(gLink);
        console.log("selected org, got display data", displayData);

        orgDataLoading = false;
        return displayData;
    };

    const selectedOrg = async (selectedDaoAddress) => {
        selectedOx = selectedDaoAddress;
        orgDataLoading = true;
        selected0xName = await getNameFormAddress(selectedDaoAddress);
        if (!selected0xName) selected0xName = selectedDaoAddress;
        
        displayData = await setCurrentOrgData(selectedDaoAddress);
        console.log(displayData)
    };

    const isEligibleForMembership = async () => {
        if (!$chainId) await initContracts($provider);
        await initContracts($provider);
        isMintDAO = false;

        gotMembrane = await $contracts.MembraneRegistry.getInUseMembraneOfDAO(
            mintMembershipAddress
        );
        let isD = await isDAO(mintMembershipAddress);

        isMintDAO = isD && gotMembrane[0].length > 0;
    };

    const isMemberOf = async (whatInstance) => {
        if (await isDAO(whatInstance)) {
            let instance = new ethers.Contract(
                whatInstance,
                IinstanceDAOABI,
                $provider
            );
            isM = await instance.isMember($signerAddress);
            return isM;
        } else {
            return false;
        }
    };

    const successTransaction = async () => {
        isM = true;
    };

    const mintMembership = async (addr) => {
        let Dinstance = new ethers.Contract(addr, IinstanceDAOABI, $signer);
        let tx = await Dinstance.mintMembershipToken($signerAddress);

        console.log(tx);
        console.log(tx.wait(1));
        tx.wait(1).then(() => {
            successTransaction();
        });
    };

    const addrSlice = (inAddr) => {
        inAddr = inAddr ? inAddr : "             ";
        return inAddr.slice(2, 6) + inAddr.slice(-4);
    };

    const investUpdate = async () => {
        isInvestable = false;
        await seTlastAt(investInAddr);
        if (ethers.utils.isAddress(investInAddr))
            isInvestable = await isDAO(investInAddr);
    };

    const resetInvest = async () => {
        await seTlastAt(investInAddr);

        currentInvest = {
            status: 1,
        };

        investmentInProgress = false;
        isInvestable = false;
        investInAddr = "";
        amountToInvest = 0;
        amtGas = 0;
    };

    const getCurrentNonce = async () => {
        currentUserNonce = await $contracts.AbstractA.getNonceOfUser(
            $signerAddress
        );
        console.log(currentUserNonce);
        return currentUserNonce;
    };

    const setInternalTInvest = async () => {
        let Dinstance = new ethers.Contract(
            investInAddr,
            IinstanceDAOABI,
            $signer
        );
        currentInternalTInvest = await Dinstance.internalTokenAddress();
    };

    const setSEPAdata = async () => {
        await seTlastAt(investInAddr);
        await getCurrentNonce();
        await setInternalTInvest();

        let n = await $contracts.AbstractA.getNonceOfUser($signerAddress);
        console.log(n);
        sepaDATA = `${addrSlice($signerAddress)}${addrSlice(
            investInAddr
        )}X${amountToInvest}X${amtGas}X${n}`;
    };

    const saveInvestment = async (investment) => {
        let newInvestment = await setDoc(
            doc(db, "investments", investment.signature),
            {
                userAddress: $signerAddress,
                signature: investment.signature,
                status: investment.status,
                data: investment.data,
                instance: investment.targetorg,
            }
        );

        console.log("investment saved", newInvestment);
    };

    const executeInvestment = async (investment, order) => {
        console.log("executing investment");
        const sepa = investment.data.split("X");
        const requestURL = `/invest/?chainid=${$chainId}&forwho=${$signerAddress}&towhere=${investment.targetorg}&data=${investment.data}&signature=${investment.signature}&internaltoken=${currentInternalTInvest}`;
        console.log(requestURL);
        const res = await fetch(requestURL);
        if (res.ok) {
            console.log("got execute investment response: ", res);
            return 3; /// success
        } else {
            console.error("error", res.status, res);
            resetInvest();
        }
    };

    const signInitInvest = async () => {
        investmentInProgress = isInvestable;
        await setSEPAdata();
        console.log("sepa data : ", sepaDATA);

        let signedSEPA = await $signer.signMessage(sepaDATA);
        console.log("sepa data : ", signedSEPA);

        currentInvest = {
            data: sepaDATA,
            signature: signedSEPA,
            status: 2,
            targetorg: investInAddr,
        };

        const client = new MoneriumClient();
        const authClient = await client.auth(data.placeholder);

        let Idb = await saveInvestment(currentInvest);
        let orders;
        let lenOrders;

        let intervalID = setInterval(async () => {
            currentInvest.status = 2;
            orders = await client.getOrders({ memo: sepaDATA });

            console.log("setintervalorders", orders);

            if (orders && orders.length > 0) {
                lenOrders = orders.length > 0;
                console.log(client, sepaDATA);

                if (lenOrders) {
                    if (orders[0].meta.state != "pending") {
                        console.log(orders[0]);
                        let expectedAmt = String(
                            parseInt(currentInvest.data.split("X")[1]) +
                                parseInt(currentInvest.data.split("X")[2])
                        );
                        let gotAmt = orders[0].meta.receivedAmount;
                        console.log(
                            expectedAmt,
                            gotAmt,
                            currentInvest.data.split("X")[1],
                            currentInvest.data.split("X")[2]
                        );
                        if (expectedAmt == gotAmt) {
                            clearInterval(intervalID);

                            currentInvest = {
                                data: sepaDATA,
                                signature: signedSEPA,
                                status: 3,
                                targetorg: investInAddr,
                            };

                            Idb = await saveInvestment(currentInvest);
                            console.log({
                                currentInvest: currentInvest,
                                Idb: Idb,
                                orders: orders,
                            });

                            currentInvest.status = await executeInvestment(
                                currentInvest,
                                orders[0]
                            );

                            Idb = await saveInvestment(currentInvest);
                        } else {
                            console.log(
                                "something went wrong",
                                currentInvest,
                                orders
                            );
                            alert(
                                "Something Went Wrong. Contact Support 0-800-support"
                            );
                            clearInterval(intervalID);
                        }
                        console.log(
                            "Yay! Tnvestment executed successfully",
                            currentInvest
                        );
                    }
                }
            }
            console.log("Waiting...");
        }, 5000);
    };
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
                <div class="col-4">
                    <div class="dao-selector">
                        <div class="dropdown">
                            <button
                                class="btn btn-secondary dropdown-toggle orgSelector"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                {#if selectedOx}
                                    {selected0xName}
                                {:else}
                                    {Memberships
                                        ? "Select Organisation"
                                        : "no memberships"}
                                {/if}
                            </button>
                            <ul class="dropdown-menu">
                                {#each Memberships as dao}
                                    <li class="dao-select-item">
                                        <a
                                            class="dropdown-item"
                                            on:click={selectedOrg(dao)}>{dao}</a
                                        >
                                    </li>
                                {/each}
                            </ul>
                        </div>
                        <br />
                    </div>
                </div>
                <div class="col-2">
                    <button
                        class="btn btn-add-entity"
                        on:click={() => {
                            onShowPopup("addM");
                        }}
                    >
                        <i class="bi bi-building-add"> Add Membership </i>
                    </button>
                </div>
                <div class="col-2">
                    <button
                        class="btn btn-new-org center-block"
                        disabled
                        on:click={() => {
                            alert("disabled in explorer");
                        }}
                    >
                        <i class="bi bi-plus-circle"> New Organisation </i>
                    </button>
                </div>
                <div class="col-2 center-block text-center">
                    <button
                        class="btn btn-invest"
                        on:click={() => {
                            onShowPopup("invest");
                        }}><i class="bi bi-currency-euro">Invest</i></button
                    >
                </div>
                <div class="col-2">
                    <div class="form-check form-switch">
                        <label
                            class="form-check-label switch-text"
                            for="flexSwitchCheckDisabled">Gassless mode</label
                        >
                        <input
                            class="form-check-input switch-body"
                            type="checkbox"
                            role="switch"
                            id="flexSwitchCheckDisabled"
                            disabled
                        />
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <Modal
                open={showPopupAddM}
                title="Add Membership"
                class="modalMain"
                provider={$provider}
                signer={$signer}
                onClosed={() => onPopupClose("addM")}
            >
                <div class="container container-popslot">
                    <div class="row">
                        <div class="col-12">
                            <!-- ADD Membership Form-->

                            <form>
                                <div class="form-group">
                                    <label
                                        for="mint-membership-for-dao"
                                        class="form-label"
                                        >I seek the membership of:</label
                                    >
                                    <div class="row">
                                        <div class="col-12">
                                            <input
                                                type="text"
                                                bind:value={mintMembershipAddress}
                                                on:input={isEligibleForMembership}
                                                class="form-control"
                                                id="inputFieldPopup"
                                                placeholder="address of DAO you want to mint membership 0x"
                                            />
                                        </div>
                                    </div>
                                    <div class="row">
                                        <small
                                            id="input-purpose"
                                            class="form-text text-muted"
                                        >
                                            address of DAO you want to mint
                                            membership for
                                        </small>
                                    </div>
                                    {#if gotMembrane}
                                        {#if gotMembrane[0].length == 0}
                                            {"Not a WalllaW instance"}
                                        {/if}
                                        {#each gotMembrane[0] as membraneTokenAddr}
                                            <div class="row">
                                                <div class="col-4">symbol</div>
                                                <div class="col-6">
                                                    required balance
                                                </div>
                                                <div class="col-2">
                                                    satisfied
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-4">
                                                    {#await getTsymb(membraneTokenAddr) then symb}
                                                        <b> {symb} </b>
                                                    {/await}
                                                </div>
                                                <div class="col-6">
                                                    {gotMembrane[1][
                                                        gotMembrane[0].indexOf(
                                                            membraneTokenAddr
                                                        )
                                                    ]}
                                                </div>
                                                <div class="col-2">
                                                    {#await hasSufficientBalance(membraneTokenAddr, gotMembrane[1][gotMembrane[0].indexOf(membraneTokenAddr)]) then X}
                                                        {#if X}
                                                            <!-- {hasSufficientBalance(membraneTokenAddr, gotMembrane[1][gotMembrane[0].indexOf(membraneTokenAddr)])} -->
                                                            <i
                                                                class="bi bi-check2-circle color-green"
                                                            />
                                                        {:else}
                                                            <i
                                                                class="bi bi-x-circle-fill color-red"
                                                            />
                                                        {/if}
                                                    {/await}
                                                </div>
                                            </div>
                                        {/each}
                                    {/if}
                                    <br />
                                </div>

                                {#if gotMembrane}
                                    {#await isMemberOf(mintMembershipAddress) then isM}
                                        {#if !isM}
                                            {#if isEforM}
                                                <div
                                                    on:click={() =>
                                                        mintMembership(
                                                            mintMembershipAddress
                                                        )}
                                                    class="btn btn-mint {!isEforM &&
                                                    !isMintDAO
                                                        ? 'd-none'
                                                        : ''}"
                                                >
                                                    mint membership
                                                </div>
                                            {/if}
                                        {:else}
                                            <br />
                                            <b class="already-member-text">
                                                Already Member 👏
                                            </b>
                                        {/if}
                                    {/await}
                                {/if}
                            </form>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
        <div class="container">
            <Modal
                open={showPopupInvest}
                title="Invest"
                class="modalMain"
                provider={$provider}
                signer={$signer}
                onClosed={() => onPopupClose("invest")}
            >
                <div class="container container-popslot">
                    <br />
                    <div class="form-group">
                        <div class="row">
                            <div class="col-6 float-start">
                                <div class="form-label">Organization</div>
                                <div class="row">
                                    <div class="col-10">
                                        <input
                                            type="text"
                                            bind:value={investInAddr}
                                            on:input={investUpdate}
                                            class="form-control"
                                            id="inputFieldPopup"
                                            placeholder="address of Entity you want to invest in"
                                        />
                                    </div>
                                    <div class="col-2 text-center center ">
                                        {#if isInvestable}
                                            <i
                                                class="bi bi-check2-circle color-green bi-invest"
                                            />
                                        {:else}
                                            <i
                                                class="bi bi-x-circle-fill color-red bi-invest"
                                            />
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="col-3">
                                <div class="form-label">Investment</div>

                                <input
                                    type="number"
                                    min="0"
                                    bind:value={amountToInvest}
                                    class="form-control"
                                    id="inputFieldPopup"
                                    placeholder="€ investment amount"
                                />
                            </div>

                            <div class="col-3">
                                <div class="form-label">
                                    Gas Refil (optional)
                                </div>

                                <input
                                    type="number"
                                    min="0"
                                    bind:value={amtGas}
                                    default="0"
                                    class="form-control"
                                    id="inputFieldPopup"
                                    placeholder="€ 0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <br />
                    <div class="col-6">
                        <div class="invest instructions">
                            <br />
                            <!-- <p class="instr-title">Steps</p> -->
                            <b
                                class="step {currentInvest.status == 1
                                    ? 'step-active'
                                    : ''}"
                            >
                                Step 1 Complete and sign the form
                            </b><br />
                            <b
                                class="step {currentInvest.status == 2
                                    ? 'step-active'
                                    : ''}"
                            >
                                Step 2 Send a SEPA transfer with memo -></b
                            > <br />
                            <b
                                class="step {currentInvest.status == 3
                                    ? 'step-active'
                                    : ''}"
                            >
                                Step 3 Investment Complete 🎉</b
                            >
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="row">
                            <div class="col-10">
                                <br />
                                <input
                                    type="text"
                                    class="form-control sepa-data-field {currentInvest.status ==
                                    2
                                        ? 'highl-sepa'
                                        : ''}"
                                    value={isInvestable
                                        ? `${addrSlice(
                                              $signerAddress
                                          )}${addrSlice(
                                              investInAddr
                                          )}X${amountToInvest}X${amtGas}X${currentUserNonce}`
                                        : "I [addr] invest in [Org.] [amount] [gas] [transaction nr.]"}
                                    on:change={setSEPAdata}
                                    id="inputFieldPopup"
                                    readOnly
                                    placeholder="SEPA description"
                                    readonly
                                />
                                <div class="text text-field-expl">
                                    <br />
                                    <b> Transaction data constituted as as: </b>
                                    <br />
                                    * first and last 4 characters of your and target
                                    organisation addresses
                                    <b>{addrSlice($signerAddress)}</b><i>X</i><b
                                        >{addrSlice(investInAddr)}</b
                                    ><br />
                                    + investment amount <b>{amountToInvest}</b>
                                    <br />
                                    + gas deposit value <b>{amtGas}</b> <br />
                                    + transaction nr. (nonce)
                                    <b>{currentUserNonce}</b>
                                </div>
                            </div>
                            <div class="col-2">
                                <br />
                                <button
                                    class="btn btn-outline btn-copy"
                                    on:click={() => {
                                        alert(
                                            "Copy button is unavailable outside normal working hours.\nPlease proceed to copy manually.\nThank you for your understanding!"
                                        );
                                    }}
                                >
                                    <i class="bi bi-clipboard bi-copy" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-2">
                            <br />
                            <div class="row">
                                <div class="col-12 btn-invest-col">
                                    {#if investmentInProgress}
                                        <button
                                            class="btn btn-sign-reset"
                                            on:click={resetInvest}
                                        >
                                            Reset
                                        </button>
                                    {:else}
                                        <button
                                            class="btn btn-sign-invest"
                                            on:click={signInitInvest}
                                        >
                                            <b> Sign Investment </b>
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    </div>

    <div class="container container-graph">
        {#if orgDataLoading}
            <div class="row">
                <div class="col-5" />
                <div class="col-2">
                    <br />
                    <br />
                    <Jellyfish
                        size="260"
                        color="#dec5a0"
                        unit="px"
                        duration="1s"
                    />
                </div>
                <div class="col-5" />
            </div>
        {:else if !selectedOx}
            <div class="row">
                <div class="col-3" />
                <div class="col-6">
                    <br />
                    <br />
                    <h1 class="no-org text text-center">
                        No Organization Selected
                    </h1>
                </div>
                <div class="col-4" />
            </div>
            <div class="row">
                <br>
                <br>
                <div class="col-3" />
                <div class="col-6" >
                    <br>
                    <br>
                <hr class="separator" />
                <br>
                <br>
                    <h1 class="no-org text text-center"> No New Events</h1>
            </div>
                <div class="col-3" />

            </div>
        {:else}
            <div class="row">
                {#if displayData.nodes.length > 0}
                    <div class="chart">
                        {#key displayData }
                        <Graph graph={displayData} />
                        {/key}
                    </div>
                {:else}
                    <div class="row">
                        <div class="col-5" />
                        <div class="col-2">
                            <br />
                            <br />
                            <Jellyfish
                                size="260"
                                color="#dec5a0"
                                unit="px"
                                duration="1s"
                            />
                        </div>
                        <div class="col-5" />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

<style>
    .btn-invest-col {
        margin-top: 8px;
    }

    :root {
        --main-blue: #1e51da;
        --main-green: #2cc0a6;
        --main-light: #c8ccc2;
        --main-peach: #dec5a0;
        --main-red: #cc403a;
        --dark-grey: #222323;
        --main-black: #101011;
    }

    .already-member-text {
        color: var(--main-green);
    }

    /* .instr-title {
        font-weight:950;
        font-size: 24px;

    } */

    .text-field-expl {
        font-size: 18px;
    }

    .no-org {
    }

    hr.separator {
        color: var(--main-blue);
        height: 2px;
    }

    .form-label {
        font-weight: 900;
        font-size: 18px;
        color: var(--main-peach);
    }

    .step {
        font-weight: 250px;
        font-size: 16px;
    }

    .step-active {
        color: var(--main-peach);
        font-weight: 300px;
        font-size: 20px;
    }

    .sepa-data-field {
        display: block;
    }

    .highl-sepa {
        border-width: 6px;
        border-color: var(--main-peach);
        font-weight: bolder;
    }

    .color-green {
        color: var(--main-green);
        font-weight: bolder;
    }

    .color-red {
        color: var(--main-peach);
    }

    .btn-copy {
        font-size: large;
        border: 1px solid var(--main-black);
    }

    .btn-sign-invest {
        border: 1px solid;
        border-color: var(--main-green);
        color: var(--main-peach);
    }

    .btn-mint {
        border: 1px solid;
        border-color: var(--main-green);
        color: var(--main-peach);
    }

    .btn-mint:hover {
        color: var(--main-green);
        font-family: "domine";
        border-color: var(--main-light);
    }

    .btn-sign-invest:hover {
        color: var(--main-green);
        font-family: "domine";
        border-color: var(--main-light);
    }

    .btn-sign-reset {
        border: 1px solid;
        border-color: var(--main-peach);
        color: var(--main-green);
    }

    .modalMain {
        width: 1000px;
    }

    .bi-invest {
        font-size: x-large;
    }

    .switch-text {
        color: var(--main-peach);
        font-family: "domine";
        font-weight: 50;
        font-size: large;
    }

    .switch-text:hover {
        color: var(--main-light);
    }

    .form-switch {
        padding-top: 8px;
    }
    .switch-body:hover {
        border-color: var(--main-grey);
    }

    .btn-add-entity {
        float: right;
        border: 1px solid;
        border-color: var(--main-green);
        color: var(--main-peach);
    }

    .btn-new-org {
        float: right;
        border: 1px solid;
        border-color: var(--main-green);
        color: var(--main-peach);
    }

    .btn-invest {
        float: right;
        border: 1px solid;
        border-color: var(--main-green);
        color: var(--main-peach);
    }

    .btn-add-entity:hover {
        color: var(--main-green);
    }

    .btn-invest:hover {
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
        background-color: rgba(1, 1, 1, 0.1);
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
