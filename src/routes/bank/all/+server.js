
// import {BANK_CLIENT_ID}  from '$env/static/private'
// import {BANK_SECRET}  from '$env/static/private'

//     import { MoneriumClient } from "@monerium/sdk";

//     const monerium = new MoneriumClient();


//     const doM = async () => {
//         const MC =  await monerium.auth({ 
//             client_id: BANK_CLIENT_ID,
//             client_secret: BANK_SECRET 
//         });

//         allOrders = await MC.getOrders();
//         allOrders = JSON.stringify(allOrders);
//         console.log(allOrders);
//         return allOrders;
//     };


//     export const GET = async ( params ) => {

//         console.log("got /bank/all get requiest");

//         let allTransfers =  await doM();

//         return new Response( JSON.stringify({"a":"22223124"}) , { status: 200})
    
//         }