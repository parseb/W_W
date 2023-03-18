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
  import {
    AddrX,
    IMember1155ABI,
      IODAOABI,
      IMembraneABI,
    IinstanceDAOABI,
    ERC20ABI,
  } from "../routes/chainData/abi/ABIS";

  
  

  import {
    PUBLIC_IPFS_PROJECT_ID,
    PUBLIC_IPFS_API_KEY,
  } from "$env/static/public";
  import { create } from "ipfs-http-client";
  import { Buffer } from "buffer";


  const auth =
  "Basic " +
  Buffer.from(PUBLIC_IPFS_PROJECT_ID + ":" + PUBLIC_IPFS_API_KEY).toString(
    "base64"
  );

/* Create an instance of the client */
const client = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
  timeout: "1m",
});

export const getIPFSdata = async (ipfsHash) => {
  await client.get(ipfsHash).then((result, err) => {
    return result ? result.text() : err;
  });
};

export const saveMembraneToIPFS = async (membraneJSON) => {
  return client.add(membraneJSON).then((result, err) => {
    return result ? result : err;
  });
};



  export const getTsymb = async (addr) => {
    if (ethers.utils.isAddress(addr)) {
      let given20 = new ethers.Contract(addr, ERC20ABI, $provider);
      let symb = await given20.symbol();
      return symb;
  }
}

  export const getTokenSymbol = async () => {
    if (ethers.utils.isAddress(createNewRootAddr)) {
      erc20Symbol = await getTsymb(createNewRootAddr);
    }
  };

  export const getTokenSymbolLoop = async (addr, id) => {
    if (ethers.utils.isAddress(addr)) {
      console.log(addr, id);
      let elem = document.getElementById(`${id}-mtoken`);
      let given20 = new ethers.Contract(addr, ERC20ABI, $provider);
      let erc20Symbol = await given20.symbol();
      elem.value = erc20Symbol;
    }
  };

  export const createDAO = async () => {
    await defaultEvmStores.attachContract(
        "ODAO",
        AddrX[chainId].ODAO,
          IODAOABI
      );
    notifications.info("Transaction sent", 4000);
    let success = await $contracts.ODAO.createDAO(createNewRootAddr);
    if (success)
      () => {
        notifications.success(`DAO Created.`, 3000);
      };
  };

  export const createSubDAO = async () => {
    await defaultEvmStores.attachContract(
        "ODAO",
        AddrX[chainId].ODAO,
          IODAOABI
      );
    notifications.info("Transaction sent", 4000);
    let success = await $contracts.ODAO.createSubDAO( membraneID, createSubDAOAddress);
    if (success)
      () => {
        notifications.success(`DAO Created.`, 3000);
      };
  };

  export const validateDAO = async () => {
    let parentDAOAddrrr = document.getElementById("parentDAOAddr");

    let isAddr = ethers.utils.isAddress(createSubDAOAddress);
    let isDAO;
    if (isAddr) {
      isDAO = await $contracts.ODAO.isDAO(createSubDAOAddress);
    }
    if (isDAO) {
      parentDAOAddrrr.classList.replace("color-red", "color-green");
    } else {
      parentDAOAddrrr.classList.replace("color-green", "color-red");
    }
  };

  export const validateIsMembrane = async (mID) => {
    await defaultEvmStores.attachContract(
        "MembraneRegistry",
        AddrX[chainId].MembraneRegistry,
        IMembraneABI
      );
    let toUseMembrane = document.getElementById("toUseMembrane");
    mID = mID.toString()
    let isM = await $contracts.MembraneRegistry.isMembrane(mID);
    console.log(`is ${mID} membrane: ${isM}`);
    if (isM) {
      toUseMembrane.classList.replace("color-red", "color-green");
    } else {
      toUseMembrane.classList.replace("color-green", "color-red");
    }
  };


  let returnedValueOfNewMembrane;

  export const createMembrane = async () => {
    let newMtkns = [];
    let newMAmts = [];
    let avatar = "";

    newMTokens.forEach((x) => {
      newMtkns.push(x.tokenAddress);
      console.log(x.reqBalance);

      let IsERC721;

      try {
        let given20 = new ethers.Contract(x.tokenAddress, ERC20ABI, $provider);
        async () => {
          IsERC721 = await given20.ownerOf(1);
        };
      } catch (e) {
        IsERC721 = false;
      }

      if (IsERC721) {
        newMAmts.push(b.toString());
      } else {
        newMAmts.push(
          ethers.utils.parseUnits(x.reqBalance.toString(), "ether")
        );
      }
      console.log(newMAmts);
    });

    console.log(`saved membrane data: ${JSON.stringify(newMipfsObj)}`);
    newMipfsObj.description = newMipfsObj.description.slice(0, 279);
    let path = await saveMembraneToIPFS(JSON.stringify(newMipfsObj));

    console.log(path.path);

    await defaultEvmStores.attachContract(
        "MembraneRegistry",
        AddrX[chainId].MembraneRegistry,
        IMembraneABI
      );

    let success = await $contracts.MembraneRegistry.createMembrane(
      newMtkns,
      newMAmts,
      path.path
    );
    console.log(success);
   ////// fix this to use event.

    let rc = await success.wait(); // 0ms, as tx is already confirmed
    let event = rc.events.find(event => event.event === 'CreatedMembrane');
    let [id, meta_] = event.args;   
    console.log(id, meta_);
    returnedValueOfNewMembrane = id;
  };

  let mintMembershipAddress;
  let isEforM = false;
  let gotMembrane;
  let isMintDAO =false;
let MembraneRegistry;
let ODAO;
let Member1155;

  const initContracts = async (provider) => { 
    let chainId = provider.network.chainId;
    MembraneRegistry = new ethers.Contract(AddrX[chainId].MembraneRegistry, IMembraneABI, provider); 
    ODAO = new ethers.Contract(AddrX[chainId].ODAO, IODAOABI, provider); 
    Member1155 = new ethers.Contract(AddrX[chainId].MEMBERregistry, IMember1155ABI, provider);


  }

  export const isEligibleForMembership = async (daoAddr, provider) => {
    let chainId = provider.network.chainId;
    
    await initContracts(provider);


    isMintDAO = false;
    gotMembrane = await MembraneRegistry.getInUseMembraneOfDAO(daoAddr);
    let isDAO = await ODAO.isDAO(daoAddr); 
    isMintDAO = isDAO && ( gotMembrane[0].length == 0 );

    console.log(gotMembrane);
    return isMintDAO;
  }

export const hasSufficientBalance = async (address, amount) => {
  let given20 = new ethers.Contract(address, ERC20ABI, $provider);
  let balance = await given20.balanceOf($signerAddress);
  isEforM = ( balance >= amount );
  console.log()
  return ( balance >= amount );
}


  export const mintMembership = async (addr) => {
    let D = new ethers.Contract(addr, IinstanceDAOABI, $signer);
    await D.mintMembershipToken($signerAddress);
  }

  let selectedD;
  let selectedIsEndpoint = "selected address is endpoint";
  let indecisions = [];
  let userpreference;
  let indecisions222 = [];
  let instance;
  let inflationTo;
  let membraneTo;
  let uriTo;
  let currentSelectedInflation;
  let currentSelectedMembrane;
  let currentSelectedURI;
  let currentSelectedPerSec;
  let currentSelectedParent;
  let newUri;
  let newMembrane;
  let newInflation;

  let baseID;
  let baseInflationRate;
  let baseInflationPerDay;
  let instantiatedAt;
  let parentDAO;
  let memberNr;
  let tlp;

  let wrapParentAmt;
  let isParentAmtApproved = false;
  let wrapRootAmt;
  let isRootAmtApproved = false;
  let rootTokenAddress;
  let currentSelectedRootBalance;
  let currentSelectedRootTokenSymbol;
  let selectedInternalTokenAddress;
  let qtyApprovedforWrap;
  let vRedistri;
  let redistributeVals = [];
  let redistriValSumOver100 = false;
  let subDAOsOfSelected = [];

  let totalSupplyOfSelectedInternal;
  let selectedInternalTBalance;
  let memberships = [];
  let endpointsOfUser;

  export const cleanIndecisionLog = async () => {
    let D = new ethers.Contract(selectedD, IinstanceDAOABI, $signer);
    await D.cleanIndecisionLog();
  };

  export const getInternalTokenBalanceOfD = async (addr) => {
    console.log(`getting balance of ${addr}`);
    let D = new ethers.Contract(addr, IinstanceDAOABI, $signer);

    let internalTaddr = await D.internalTokenAddress();
    let endPtoken = new ethers.Contract(internalTaddr, ERC20ABI, $provider);
    let internalBalance = endPtoken.balanceOf(addr);
    return internalBalance;
  };

  export const getBaseTokenBalanceOfD = async (addr) => {
    console.log(`getting balance of ${addr}`);
    let D = new ethers.Contract(addr, IinstanceDAOABI, $signer);

    let parentTaddr = await D.baseTokenAddress();
    let parentT = new ethers.Contract(parentTaddr, ERC20ABI, $provider);
    let parentBalance = parentT.balanceOf(addr);
    return parentBalance;
  };

  export const createEndpoint = async () => {
    console.log(`creating endpoint with: ${selectedD} ${$signerAddress} `);
    await $contracts.ODAO.createSubDAO($signerAddress, selectedD);
  };

  export const trickleFeed = async (endpointAddr) => {
    console.log("trickleFeeding", endpointAddr);
    let D = new ethers.Contract(endpointAddr, IinstanceDAOABI, $signer);
    await D.feedMe();
  };

  export const withdrawEndpoint = async (endpointAddr) => {
    alert(
      `I am withdrawing from your in-dao abstracted bag ${endpointAddr} to your bag ${$signerAddress}`
    );
    let D = new ethers.Contract(endpointAddr, IinstanceDAOABI, $signer);
    let amt = await getBaseTokenBalanceOfD(endpointAddr);
    await D.withdrawBurn(amt);
  };

  export const getEndpointsOfUser = async () => {
    endpointsOfUser = await $contracts.Member1155.getEndpointsOf(
      $signerAddress
    );
    console.log(`endpoints of user: ${endpointsOfUser} `);
  };

  export const submitRedistriVals = async () => {
    let D = new ethers.Contract(selectedD, IinstanceDAOABI, $signer);
    let t = await D.populateTransaction.distributiveSignal(redistributeVals);
    console.log(t.gasLimit, t.gasPrice);
    await $signer.sendTransaction(t);
  };

  export const getSelectedInternalTBalance = async () => {
    let instance = new ethers.Contract(
      selectedInternalTokenAddress,
      ERC20ABI,
      $provider
    );
    selectedInternalTBalance = await instance.balanceOf($signerAddress);
    totalSupplyOfSelectedInternal = await instance.totalSupply();
  };

  export const setRedistriVals = async () => {
    let D = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    let vals = await D.getUserReDistribution($signerAddress);
    console.log(redistributeVals);
    return vals;
  };

  export const pushRedistriVal = async () => {
    let sum = 0;
    redistributeVals.forEach((x) => {
      sum += x;
    });
    redistriValSumOver100 = sum != 100;
    console.log(redistributeVals);
    console.log(sum);
  };

  export const fetchSubDAOs = async () => {
    subDAOsOfSelected = await $contracts.ODAO.getDAOsOfToken(
      selectedInternalTokenAddress
    );
    redistributeVals = await setRedistriVals();
    if (redistributeVals.length == 0)
      redistributeVals = Array(subDAOsOfSelected.length).fill(0);
  };

  export const submitWrap = async () => {
    let instance = new ethers.Contract(
      selectedInternalTokenAddress,
      DAO20abi,
      $signer
    );
    await instance.wrapMint(wrapRootAmt);
  };

  export const approveWrap = async () => {
    let instance = new ethers.Contract(rootTokenAddress, ERC20ABI, $signer);
    await instance.approve(selectedInternalTokenAddress, wrapRootAmt);
  };

  export const fromRootChanged = async () => {
    let D = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    let rootTokenAddress = await getRootToken();
    let instance = new ethers.Contract(rootTokenAddress, ERC20ABI, $provider);
    qtyApprovedforWrap = await instance.allowance(
      $signerAddress,
      selectedInternalTokenAddress
    );

    isParentAmtApproved = qtyApprovedforWrap >= wrapParentAmt;
  };

  export const getRootToken = async () => {
    let tlp = await getTLP();
    let rootAddrD = tlp.length == 1 ? selectedD : tlp[tlp.length - 1];
    let instance = new ethers.Contract(rootAddrD, IinstanceDAOABI, $provider);
    rootTokenAddress = await instance.baseTokenAddress();
    let instance2 = new ethers.Contract(rootTokenAddress, ERC20ABI, $provider);
    currentSelectedRootBalance = await instance2.balanceOf($signerAddress);
    currentSelectedRootTokenSymbol = await instance2.symbol();
    return rootTokenAddress;
  };

  export const getTLP = async () => {
    tlp = await $contracts.ODAO.getTrickleDownPath(selectedD);
    console.log({ tlp: tlp });
    return tlp;
  };

  export const isNotEndpoint = async (d) => {


    if (d) {
      let instance = new ethers.Contract(d, IinstanceDAOABI, $provider);
      let endpoint = await instance.endpoint();
      console.log(endpoint);
      return endpoint != ethers.constants.AddressZero;
    }

  };

  export const getBaseID = async () => {
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    baseID = await instance.baseID();
    return baseID;
  };

  export const getInflationRate = async () => {
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    baseInflationRate = await instance.baseInflationRate();
    return baseInflationRate;
  };

  export const setInternalTokenAddress = async () => {
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    selectedInternalTokenAddress = await instance.internalTokenAddress();
  };

  export const getInflationPerDay = async () => {
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    baseInflationPerDay = await instance.baseInflationPerSec();
    baseInflationPerDay = baseInflationPerDay * 86400;
  };

  export const getInstantiatedAt = async () => {
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    instantiatedAt = await instance.instantiatedAt();
    return instantiatedAt;
  };

  export const getParentDAO = async () => {
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    parentDAO = await instance.parentDAO();
    return parentDAO;
  };

  export const getMemberNr = async () => {
    memberNr = await $contracts.Member1155.howManyTotal(baseID);
    return memberNr;
  };

  export const setSelectedDAO = async (d) => {
    let isDAO = await $contracts.ODAO.isDAO(d);
    if (isDAO) selectedD = d;
    console.log(selectedD, "isDAO? ", isDAO);
    // await getActiveIndecisions(); 
    console.log("active indecisions fetching - suspended - indexing needed")
    currentSelectedInflation = await getCurrentInflation();
    currentSelectedMembrane = await getCurrentMembrane();
    currentSelectedURI = await getCurrentUri();
    await setInternalTokenAddress();
    await getBaseID();
    await getInflationRate();
    await getInstantiatedAt();
    await getParentDAO();
    await getMemberNr();
    await getInflationPerDay();

    await getTLP();
    await getRootToken();
    await fetchSubDAOs();
    await getSelectedInternalTBalance();
    await getEndpointsOfUser();
  };



  export  const isMembrane = async (n) => {
    let isMembrane = await $contracts.MembraneRegistry.isMembrane(n);
    return isMembrane;
  };

  export  const typeOfIndecision = async (num) => {
    if (num < 100) return `Inflation to (${num})`;
    if (await isMembrane(num)) return `Membrane to (${num})`;
    return `Change URI to ${num.toHexString}`;
  };

  export  const getCurrentInflation = async () => {
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $provider);
    return await instance.baseInflationRate();
  };

  export const getCurrentMembrane = async () => {
    return await $contracts.MembraneRegistry.inUseMembraneId(selectedD);
  };

  export  const getCurrentUri = async () => {
    let u = await $contracts.Member1155.getUriOf(selectedD);
    return u;
  };

  export const supportChange = async (itemNr) => {
    console.log(`supporting change with id ${itemNr}`);

    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $signer);
    let returnedId;
    if (itemNr < 100) {
      returnedId = await instance.signalInflation(itemNr);
    } else if (await isMembrane(itemNr)) {
      returnedId = await instance.changeMembrane(itemNr);
    } else {
      returnedId = await instance.changeUri(ethers.utils.toUtf8Bytes(itemNr));
    }

    if (returnedId == itemNr) alert("membrane changed");
    console.log(`support expressed for change ${returnedId} -> ${itemNr}`);
  };

  export const assertInflation = async () => {
    console.log("assert uri", newInflation);
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $signer);
    return await instance.signalInflation(newInflation);
  };
  export const assertMembrane = async () => {
    console.log("assert membrane", newMembrane);
    let isM = await isMembrane(newMembrane);
    console.log(`givent is membrane? :   ${isM}`);
    let instance = new ethers.Contract(selectedD, IinstanceDAOABI, $signer);
    
    let t = await instance.populateTransaction.changeMembrane(newMembrane);
    console.log(t.gasLimit, t.gasPrice);
    await $signer.sendTransaction(t);

  };



  
