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
  
    import { ethers } from "ethers";
  
    import {
      IMember1155ABI,
      IODAOABI,
      IMembraneABI,
      IinstanceDAOABI,
      ERC20ABI,
      IDAO20ABI,
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
  
    onMount(() => {
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
      await getSelectedBasicInfo(whatIsSelected);
      let circle = document.getElementById(whatIsSelected);
      if (isSelectedId)
        document.getElementById(isSelectedId).classList.remove("isSelectedNode");
      circle.classList.add("isSelectedNode");
      isSelectedId = whatIsSelected;
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
            <g stroke="#999" stroke-opacity="0.6">
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
              r="5"
              fill={colourScale(point.group)}
              cx={point.x}
              cy={point.y}
              transform="translate({transform.x} {transform.y}) scale({transform.k} {transform.k})"
            >
              <title>{point.id} </title>
            </circle>
          {/each}
        </svg>
      </div>
    </div>

  </div>
  
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

    svg {
      float: center;
      width: 100%;
      height: 120%;
    }
    
    .col-graph {
        padding:10px;
    }
    circle {
      stroke: #fff;
      stroke-width: 1.5;
    }
  
    svg {
      background-color: var(--dark-grey);
      opacity: 18%;
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
  