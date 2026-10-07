import 'server-only';
import {createHmac} from 'node:crypto';

export function hashIp(address:string):string|null{
 const salt=process.env.IP_HASH_SALT;
 if(!salt||!address||address==='unknown')return null;
 return createHmac('sha256',salt).update(address).digest('hex');
}
