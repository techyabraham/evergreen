export function normalizePhone(raw:string,defaultCountry:'NG'='NG'):string|null{
 let value=raw.trim();if(!value)return null;
 value=value.replace(/[().\s-]/g,'');if(value.startsWith('00'))value=`+${value.slice(2)}`;
 if(!/^\+?\d+$/.test(value))return null;
 let digits=value.replace(/^\+/,'');
 if(value.startsWith('+')){
  if(digits.startsWith('234')&&digits.length===14&&digits[3]==='0')digits=`234${digits.slice(4)}`;
  if(digits.startsWith('234')&&/^234[789]\d{9}$/.test(digits))return digits;
  if(digits.startsWith('234')&&/^234[1-9]\d{7,9}$/.test(digits))return digits;
  if(digits.startsWith('44')&&digits.length===12&&/^447\d{9}$/.test(digits))return digits;
  if(digits.startsWith('1')&&digits.length===11&&/^1\d{10}$/.test(digits))return digits;
  return null;
 }
 if(defaultCountry==='NG'){
  if(digits.startsWith('00234'))digits=digits.slice(2);
  if(digits.startsWith('2340')&&digits.length===14)digits=`234${digits.slice(4)}`;
  if(digits.startsWith('0')&&digits.length===11)digits=`234${digits.slice(1)}`;
  if(digits.length===10&&/^[789]\d{9}$/.test(digits))digits=`234${digits}`;
  return /^234[789]\d{9}$/.test(digits)||/^2341\d{7,9}$/.test(digits)?digits:null;
 }
 return null;
}
