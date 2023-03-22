
import {CHIADO_PVK, GNO_PVK}  from '$env/static/private'
import ethers from 'ethers';
import { ABstractA, AddrX, ERC20ABI } from '../chainData/abi/ABIS';


const RPC = {
    // '10200': "https://rpc.chiadochain.net"
    '10200': "http://127.0.0.1:8545",
    '100': "https://rpc.gnosischain.com"
}




// export function GET({ url }) {
//     let num = JSON.stringify( toString(url.searchParams.get('min') ?? '0') );

//     return new Response(num);
// }

// function depositFor(
//     address forWho_,
//     address toWhere_,
//     uint256 amount_,
//     string memory transferData_,
//     bytes memory signature_
// ) external onlyAutorized 


 export const GET = async ({url}) => {



    // `/invest/?chainid=${$chainId}&forwho=${$signerAddress}&towhere=${investment.targetorg}
    // &data=${investment.data}&signature=${investment.signature}`

    let chainID = url.searchParams.get('chainid');
    let forWho = url.searchParams.get('forwho');
    let toWhere = url.searchParams.get('towhere');
    let signeddata = url.searchParams.get('data');
    let signature = url.searchParams.get('signature');
    let internaltoken = url.searchParams.get('internaltoken');

    let amount =  String(parseInt(signeddata.split("X")[1]));
    amount = String(ethers.utils.parseUnits(amount, 'ether'))
    let asGas = String(parseInt( signeddata.split("X")[2]));
    let providedNonce = String(parseInt(signeddata.split("X")[3]));

    console.log(`${chainID} - ${forWho} - ${toWhere} =$internal t - ${internaltoken}`);


    let RPC_URL = RPC[String(chainID)];

    let WalletPVK = {
        100: GNO_PVK,
        10200: CHIADO_PVK
    }

    // if (! RPC_URL) throw error(422, 'No RPC for provided Chain ID');
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    await provider.ready;
    console.log('got provider', provider);

    // if(! ( ethers.utils.isAddress(forWho) && ethers.utils.isAddress(toWhere) && ethers.utils.isAddress(internaltoken) ) )  throw error(422, 'Bad Address Provided'); 

    /// @todo verify sig
    // const verifySigner = ethers.utils.recoverAddress(hashMessage(message),value)

    let Wallet = new ethers.Wallet(WalletPVK[chainID], provider); /// not bad not terrible
    console.log('got Wallet', Wallet);


    const AA = new ethers.Contract(
        AddrX[chainID].AbstractA,
        ABstractA,
        Wallet
    );  
    
    const EURtoken = new ethers.Contract(
        AddrX[chainID].EUR,
        ERC20ABI,
        Wallet
    );  

    let iniNonce = await AA.getNonceOfUser(forWho);
    let internalB = await Wallet.getBalance();
    let addr =  Wallet.address;
    console.log('1', {nonce: iniNonce, internalBalance: String(internalB), relayerAddress: addr});

    console.log('amount to approve',amount );
    
    // let approveEURTtx = await EURtoken.approve(internaltoken, amount); 
    // console.log("approved?", approveEURTtx);

    let approveEURTtx = await EURtoken.approve(AddrX[chainID].AbstractA, amount); 
    console.log("approved?", approveEURTtx);

    internalB = await Wallet.getBalance();
    addr =  Wallet.address;
    console.log('2', {nonce: iniNonce, internalBalance: String(internalB), relayerAddress: addr});

    
    let tx = await Wallet.sendTransaction({
        to: forWho,
        value: String(ethers.utils.parseUnits(asGas, 'ether')),
      });

    console.log(tx);
    console.log(forWho,toWhere,amount, iniNonce,signeddata,signature);

    tx = await AA.populateTransaction.depositFor(forWho,toWhere,amount, iniNonce,signeddata,signature);
    // tx.gasPrice = String( await provider.getGasPrice() * 2);

    // console.log(tx);

    /////@APPPROOOOOVEEESSS

    tx = await Wallet.sendTransaction(tx);
    console.log("tx result ", tx);
    // // num = (num.length > 0 ) ?  parseInt(num) 
    return new Response(JSON.stringify(tx));
}