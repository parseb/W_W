<script>
    import { onMount } from "svelte";
    import Graph from "./NetworkGraphSvelteSVG.svelte";

  
    import { scaleLinear, scaleOrdinal } from "d3-scale";
    import { zoom, zoomIdentity } from "d3-zoom";
    import { schemeCategory10 } from "d3-scale-chromatic";
    import { select, selectAll } from "d3-selection";
    import { drag } from "d3-drag";
    import { 
      forceSimulation,
      forceLink,
      forceManyBody,
      forceCenter,
    } from "d3-force";

  
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
        getFirestore,
        collection,
        addDoc,
        query,
        getDoc,
        setDoc,
        updateDoc,
        increment,
    } from "firebase/firestore";
  
    import { ethers } from "ethers";
  
    import {
      IMember1155ABI,
      IODAOABI,
      IMembraneABI,
      IinstanceDAOABI,
      ERC20ABI,
      IDAO20ABI,
      DAO20Fact,
    } from "../chainData/abi/ABIS";
  
    import { parseEther } from "ethers/lib/utils";
  
    let d3 = {
      zoom,
      zoomIdentity,
      scaleLinear,
      scaleOrdinal,
      schemeCategory10,
      select,
      selectAll,
      drag,
      forceSimulation,
      forceLink,
      forceManyBody,
      forceCenter,
    };
  
    export let graph;
    export let currentUserData;
    export let doc;
    export let db;
    export let selected0x;
    export let sInfVal;

    let hoveredName;
    let redistriVals;
  
    let svg;
    let width = 800;
    let height = 400;
    const nodeRadius = 5;
  
    const padding = { top: 20, right: 0, bottom: 10, left: 0 };
  
    $: links = graph.links.map((d) => Object.create(d));
    $: nodes = graph.nodes.map((d) => Object.create(d));
  
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10);
  
    let transform = d3.zoomIdentity;
    let simulation;
    let membraneTokenSymbols = [];
    let childrenOfSelected = [];
    let isEndpoint;
    let hP = {loaded: false}
    let newN;
    let selectedMembers = [];
    let selectedSubDs = [];
    let subDs = [];

    let inflationSlideVal;
  
    const getCurrentUserData = async () => {
        let currentUserRef = doc(db, "users", $signerAddress);
        currentUserData = await getDoc(currentUserRef);
        currentUserData = currentUserData.data();
        return currentUserData;
    };

    const getSubDsOf = async (addr) => {
      let instance = new ethers.Contract(
        addr,
            IinstanceDAOABI,
            $provider
        );
        let tokenAddr = await instance.internalTokenAddress();
      let daoFactoryAddr = await $contracts.ODAO.DAO20FactoryAddr();
        let Dfact = new ethers.Contract(daoFactoryAddr, DAO20Fact, $provider);
        let subDs = await Dfact.getDAOsOfToken(tokenAddr);
        return subDs;
    }

    const setAddrName = async (addrValue, newName) => {
        let currentUserRef = doc(db, "users", $signerAddress);
        if (! addrValue) addrValue = hP.id;
        currentUserData.aliases[addrValue] = newName;
        hP.name = newName;
        hP = hP;

        await updateDoc(currentUserRef, currentUserData);
        let newDoc = await getDoc(currentUserRef);
        await getCurrentUserData();
        console.log("alias set or updated for ", addrValue, "as ", newName);
    };

    export const getNameFormAddress = async (givenAddr) => {
        if ( currentUserData.aliases[givenAddr] );
        if (!currentUserData) currentUserData = await getCurrentUserData();
        let name = currentUserData.aliases[givenAddr]
            ? currentUserData.aliases[givenAddr]
            : givenAddr;
        console.log("name", name);
        currentUserData = currentUserData;
        return name;
    };

    const signalInflation = async (newIval) => {
      let instance = new ethers.Contract(
        selected0x,
            IinstanceDAOABI,
            $signer
        );

      let tx= await instance.signalInflation(newIval);
      tx.wait(1).then(() => { alert("inflation changed") })
    }


    onMount( async () => {
      sInfVal ??= 0;
      subDs = await getSubDsOf(selected0x);

      simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3.forceLink(links).id((d) => d.id)
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", simulationUpdate);
  
      d3.select(svg)
        .call(
          d3
            .drag()
            .container(svg)
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        )
        .call(
          d3
            .zoom()
            .scaleExtent([1 / 10, 8])
            .on("zoom", zoomed)
        );
    });
  
    function simulationUpdate() {
      simulation.tick();
      nodes = [...nodes];
      links = [...links];
    }
  
    function zoomed(currentEvent) {
      transform = currentEvent.transform;
      simulationUpdate();
    }
  
    function dragsubject(currentEvent) {
      const node = simulation.find(
        transform.invertX(currentEvent.x),
        transform.invertY(currentEvent.y),
        nodeRadius
      );
      if (node) {
        node.x = transform.applyX(node.x);
        node.y = transform.applyY(node.y);
      }
      return node;
    }

    const editNameVal = async (idAddr, newName) => {
      console.log("saving name change for", hP );
      await setAddrName(idAddr, newName);
      hP.name = newName;

      hP = hP;
    }

    

    const hoveredPoint = async (p) => {
      hoveredName = currentUserData.aliases[p.id]
      if (hP) hP= {}
      if (! hoveredName ) hoveredName = await getNameFormAddress(p.id);
      

      hP = {
        id: p.id,
        name: hoveredName,
        baseBalance:  p.baseBalance,
        internalBalance: p.internalBalance,
        baseShare: p.baseShare,
        loaded: true,
        inflationPerSec: p.inflationPerSec
      }

      hP = hP;

    }
  
    function dragstarted(currentEvent) {
      if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
      currentEvent.subject.fx = transform.invertX(currentEvent.subject.x);
      currentEvent.subject.fy = transform.invertY(currentEvent.subject.y);
    }
  
    function dragged(currentEvent) {
      currentEvent.subject.fx = transform.invertX(currentEvent.x);
      currentEvent.subject.fy = transform.invertY(currentEvent.y);
    }
  
    function dragended(currentEvent) {
      if (!currentEvent.active) simulation.alphaTarget(0);
      currentEvent.subject.fx = null;
      currentEvent.subject.fy = null;
    }
  
    function resize() {
      ({ width, height } = svg.getBoundingClientRect());
    }
  
    let selectedDAOinfo = {
      parent: "Parent DAO",
      parentToken: "$base",
      memberNR: "0",
      membraneTokens: [],
      membraneBalances: [],
      membraneTokenSymbols: [],
    };
  
    let selectedMetadata = "no entity selected";
    let isSelectedAddr = "0xSelected_Address";
  
    const getSelectedBasicInfo = async (addr) => {
      if (  addr == $signerAddress) {
        selectedDAOinfo.parent = "0x0";
        selectedDAOinfo.parentToken = "non-fungible human in identity field of type Self";
        selectedDAOinfo.memberNR = "tbd";
        selectedDAOinfo = selectedDAOinfo;
      } else {
        selectedDAOinfo = selectedDAOinfo;
        let symbs = [];
        let D = new ethers.Contract(addr, IinstanceDAOABI, $provider);
        let endpoint = await D.endpoint();
  
  
  
        let parent = await D.parentDAO();
        let parentToken = await D.baseTokenAddress();
        let memberNr = await $contracts.Member1155.howManyTotal(D.baseID());
        let membrane = await $contracts.MembraneRegistry.getInUseMembraneOfDAO(
          addr
        );
        let membraneId = await $contracts.MembraneRegistry.inUseMembraneId(addr);
  
  
        
        selectedDAOinfo.parent = parent;
        selectedDAOinfo.parentToken = parentToken;
        selectedDAOinfo.memberNR = memberNr;
        selectedDAOinfo.membraneTokens = membrane[0];
        selectedDAOinfo.membraneID = membraneId;
  
        let isEndpoint = ( endpoint != ethers.constants.AddressZero );   
  
  
        if (isEndpoint) {
          selectedDAOinfo.membraneID = "is endpoint";
          selectedDAOinfo.memberNR = "is endpoint";
          selectedMetadata = {}
          selectedMetadata.workspace =  "-- is endpoint --"; 
          selectedMetadata.links =  "-- is endpoint --";
          selectedMetadata.ens =  "-- is endpoint --";
          selectedDAOinfo.membraneID = "endpoint";
          selectedDAOinfo.children = [];
          isEndpoint = true;
  
          let erc20parent = new ethers.Contract( parentToken, ERC20ABI, $provider);
          let balanceInParentToken = await erc20parent.balanceOf(addr); 
  
          selectedDAOinfo.endpointBalance = balanceInParentToken;
          selectedDAOinfo = selectedDAOinfo;
                  console.log("is endpoint")
          return;
        }
  
        if (membrane[0].length == 0) {
          selectedMetadata = {}
          selectedMetadata.workspace =  "-- no membrane --"; 
          selectedMetadata.links =  "-- no membrane --";
          selectedMetadata.ens =  "-- no membrane --";
          selectedDAOinfo = selectedDAOinfo;
          selectedMetadata = selectedMetadata;
          selectedDAOinfo.membraneBalances = [];
          return selectedDAOinfo;
  
  
        }
        let uri = await D.uri();
        await getChildren(addr);
        console.log("membrane of selected dao: ", membrane);
  
  
        // membrane[0].forEach( async (t) => {
        // 	let symb = await getSymbolOfTokenAddr(t);
        // 	symbs.push( symb );
        // 	symbs = symbs
        // } )
        // membraneTokenSymbols = symbs;
        // selectedDAOinfo.membraneTokenSymbols = symbs;
  
        selectedDAOinfo.membraneBalances = membrane[1];
        // selectedDAOinfo.uri = ethers.utils.parseBytes32String(membrane[2]);
        selectedDAOinfo.uri = uri;
        // let metaD =  await getIPFSdata(uri);
        let metaD = await fetch(`https://walllaw.infura-ipfs.io/ipfs/${uri}`);
        selectedDAOinfo.metadata = await metaD.text();
        console.log(selectedDAOinfo.metadata);
        selectedMetadata = JSON.parse(selectedDAOinfo.metadata);
  
  
        selectedDAOinfo = selectedDAOinfo;
      }
    };
  
    const getChildren = async (givenD) => {
      if (isEndpoint) { 
        childrenOfSelected = [];
        return childrenOfSelected;
      }
      let children = [];
      if (
        ethers.utils.isAddress(givenD) &&
        givenD != ethers.constants.AddressZero
      ) {
        let D = new ethers.Contract(givenD, IinstanceDAOABI, $provider);
        let internalT = await D.internalTokenAddress();
        children = await $contracts.ODAO.getDAOsOfToken(internalT);
      }
      childrenOfSelected = children;
    };
  
    let isSelectedId;
    const onSelectedDAO = async (whatIsSelected) => {
      isSelectedAddr = whatIsSelected;
      // await getSelectedBasicInfo(whatIsSelected);
      // let circle = document.getElementById(whatIsSelected);
      // if (isSelectedId)
      //   document.getElementById(isSelectedId).classList.remove("isSelectedNode");
      // circle.classList.add("isSelectedNode");
      // isSelectedId = whatIsSelected;
    };
  
    const getSymbolOfTokenAddr = async (addr) => {
      let T = new ethers.Contract(addr, ERC20ABI, $provider);
      let symb = await T.symbol();
      return symb;
    };
  </script>
  
  <svelte:window on:resize={resize} />
  
  <div class="container">
    <div class="row">
  
      <div class="col-12 col-graph">
        <!-- SVG was here -->
        <svg bind:this={svg} {width} {height}>
          {#each links as link}
            <g stroke="#999" stroke-opacity="0.9">
              <line
                x1={link.source.x}
                y1={link.source.y}
                x2={link.target.x}
                y2={link.target.y}
                transform="translate({transform.x} {transform.y}) scale({transform.k} {transform.k})"
              >
                <title>{link.source.id}</title>
              </line>
            </g>
          {/each}
  
          {#each nodes as point}
            <circle
              class="node node-type{point.group}"
              id={point.id}
              on:click={onSelectedDAO(point.id)}
              on:mouseover={hoveredPoint(point)}
              r={point.id == hP.id ? "10":"7"}
              fill={ ( selected0x == point.id ) ? "white" : colourScale(point.group)}
              cx={point.x}
              cy={point.y}
              transform="translate({transform.x} {transform.y}) scale({transform.k} {transform.k})"
            >
              <title>{point.id} </title>
            </circle>
          {/each}
          <br>
        </svg>
        <div class="mouseover-data">
          {#key hP}
          <h5 class="mod hp-name">name: <b> <input class="hp-name-i" type="text" placeholder={ hoveredName  } bind:value={newN}   on:blur={editNameVal(hP.id, newN)}> </b></h5>
          <h5 class="mod">address: {hP.id}</h5>
          <h5 class="mod">base $: {hP.baseBalance }</h5>
          <h5 class="mod">internal $: {hP.internalBalance }</h5>
          <h5 class="mod">~of base %: {hP.baseShare}</h5>
          <h5 class="mod">inflation per sec: {hP.inflationPerSec }</h5>
          <br>
          {/key}
      </div>
      <br>
        <div class="container action-container">
          
         <br>
         <div class="row">
          <div class="background-repeat">
            {#await getNameFormAddress(selected0x) then addr}  
            <div class="row">
              <div class="col-1"></div>
              <div class="col-10">
                <p class="selected-org">
                  { addr } { addr } { addr } { addr } { addr }  <br>
                  { addr } { addr } { addr } { addr } { addr } <br>
                  { addr } { addr } { addr } { addr } { addr } <br>
                </p>
              </div>
              <div class="col-1"></div>
            </div>
            {/await}
          </div>
          <hr class="redhr" />
          <div class="col-12 buttonSpace">
            <div class="row row-inflation">
              <lable class="input-group igl">Inflation</lable>
              <br>
             <div class="col-3">

              <input class="form-range-success" type=range min=0 max=100 default={sInfVal} bind:value={inflationSlideVal} />
             </div>
             <div class="col-1"><h4 class="slider-val">{inflationSlideVal ? inflationSlideVal : sInfVal }</h4></div>
             <div class="col-5"><h4 class="slider-val"> change inflation from {sInfVal} to <span class="text-red">{inflationSlideVal ? inflationSlideVal : sInfVal}</span></h4></div>
            <div class="col-2"> <button class="btn btn-invest" on:click={signalInflation(inflationSlideVal)}>signal inflation</button> </div>  
           
          </div>
            <hr class="redhr" />

            <div class="row">
              <lable class="input-group igl"> Reallocation </lable>
              <br>
              {#each subDs as sM }
              <div class="col-4"> <span class="entitity-name"> {getNameFormAddress(sM)}</span>  </div>
              <div class="col-4"><input class="form-range-success" type=range min=0 max={100} default={0} bind:value={redistriVals[subDs.indexOf(sM)]} />
              </div>
              <div class="col-4">  </div>
              {/each}
              
            </div>

            <br>
            <br>
          </div>
         </div>
        </div>
      </div>

     
    </div>

  </div>

  <style>

    .text-red {
      color: var(--main-red);
    }

    .form-range-success {
      width:100%;
    }

    .action-container {
      color:#1e51da
    }

    .igl {
      font-size: 36px;
      font-family: 'Domine';
      opacity: 0.9;
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
    .btn-invest:hover {
        color: var(--main-green);
    }
    .btn-invest {
        float: right;
        border: 1px solid;
        border-color: var(--main-green);
        color: var(--main-peach);
    }

    .selected-org {
      opacity: 0.03;
      color: var(--main-light);
      position: absolute;
      z-index: -2;
      font-size: 40px;
      padding-right: 260px;
    }

    .redhr {
      color: var(--main-red) !important;
      min-height: 5px !important;
      height: 3px;
      opacity: 1;
      font-size: 20px;
    }

    .hp-name-i {
      background-color: rgba(0, 0, 0,0);
      border-right:0px;
      border-top: 0px;
      border-bottom: 3px;
      border-color: var(--main-peach);
      border-left: 0px;
      color: var(--main-peach);
    }

    .hp-name-i:hover {
      color:var(--main-light);
    }


    .hp-name-i::placeholder {
      color: var(--main-peach);
      font-weight: 900;
    }

    .mod {
      color: #c8ccc2;
      opacity: 0.28;
    }
    .mouseover-data {
      z-index: 1;
      margin-top:-200px;
      padding-bottom: 10px;
      margin-left: 20px;
      font-family: 'Lustria';
    }

    svg {
      float: center;
      width: 100%;
      height: 60%;
    }
    
    .col-graph {
        padding:10px;
    }
    circle {
      stroke: #fff;
      stroke-width: 1.5;
    }
  
    svg {
      background-color: rgba(34, 35, 35, 0.2);
      
      margin-top: 10px;
    }
  
    circle.isSelectedNode {
      border-color: blue !important;
      border-width: 14px;
      color: blue;
    }
  
    circle:focus {
      fill: pink !important;
      stroke: red !important;
      stroke-width: 1;
    }
  </style>
  