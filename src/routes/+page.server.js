import {BANK_CLIENT_ID}  from '$env/static/private'
import {BANK_SECRET}  from '$env/static/private'
import {FBKEY} from '$env/static/private'
// import { MoneriumClient } from '@monerium/sdk'

// const client = new MoneriumClient();


export const load = async () => {
  



  return { placeholder: {
    client_id: BANK_CLIENT_ID,
    client_secret: BANK_SECRET
  },
    fbk: FBKEY
  }
    
  }

