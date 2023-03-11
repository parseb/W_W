

//     // import { MoneriumClient } from '@monerium/sdk'
//     import {BANK_CLIENT_ID}  from '$env/static/private'
//     import {BANK_SECRET}  from '$env/static/private'
// import { init } from 'svelte/internal';

// const MoneriumClient = require('@monerium/sdk').MoneriumClient;


// const intClient = async () => {
//     let client = new MoneriumClient();
//     await client.auth({
//   client_id: BANK_CLIENT_ID,
//   client_secret: BANK_SECRET
// })  
//     BANK = client;

//     return client;
// }

//     let BANK = await intClient();

//     const getAllTransactions = async () => {
//         if (! BANK ) BANK = await intClient();
//         let transactions = await BANK.getOrders()
//         return transactions;
//     }


    
    


// /** @type {import('@sveltejs/kit').Handle} */
// export async function handle({ event, resolve }) {
//     if (event.url.pathname.startsWith('/bank')) {
        
//         if (event.url.pathname.includes("getAllTransactions")) {
//             let t =  await getAllTransactions();
//             return t;
//         }


//     //   return new Response('custom response');
//     }
   
//     // const response = await resolve(event);
//     return response;
//   }