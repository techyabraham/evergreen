export type FeeState='known'|'not_applicable'|'unknown';
export type FeeRow={type:'agency'|'agreement_legal'|'caution_deposit'|'service_charge'|'other';label?:string;state:FeeState;amount?:number;percentOfRent?:number;frequency?:'one_time'|'year'|'month';refundable?:boolean;note?:string};
export type Rent={amount:number;period:'year'|'month';advanceMonths?:number};
export type FeeLine={type:FeeRow['type'];label:string;display:{kind:'amount';amount:number;frequency:'one_time'|'year'|'month';refundable?:boolean;note?:string}|{kind:'not_applicable'}|{kind:'contact'}};
export function resolveFees(rent:Rent|null,rows:FeeRow[]){
 const required:FeeRow['type'][]=['agency','agreement_legal','caution_deposit','service_charge'];
 const byType=new Map(rows.map(row=>[row.type,row]));
 const lines:FeeLine[]=[];
 const missingRequired:FeeRow['type'][]=[];
 const excludedRecurring:string[]=[];
 const rentDueUpfront=rent?(rent.period==='year'?rent.amount:rent.advanceMonths?rent.amount*rent.advanceMonths:null):null;
 let total=rentDueUpfront;
 for(const type of required){
  const row=byType.get(type);
  if(!row){if(required.includes(type))missingRequired.push(type);lines.push({type,label:typeLabel(type),display:{kind:'contact'}});continue;}
  const label=row.label||typeLabel(type);
  if(row.state==='unknown'){if(required.includes(type))missingRequired.push(type);lines.push({type,label,display:{kind:'contact'}});continue;}
  if(row.state==='not_applicable'){lines.push({type,label,display:{kind:'not_applicable'}});continue;}
  const base=rentDueUpfront??0;
  const amount=row.amount??Math.round(base*(row.percentOfRent??0)/100);
  lines.push({type,label,display:{kind:'amount',amount,frequency:row.frequency??'one_time',refundable:row.refundable,note:row.note}});
  if(type==='service_charge'&&row.frequency==='month'){excludedRecurring.push(`${label} (monthly)`);continue;}
  if(required.includes(type)&&total!==null)total+=amount;
  if(type==='other'&&(row.frequency==='year'||row.frequency==='one_time')&&total!==null)total+=amount;
 }
 for(const row of rows.filter(row=>row.type==='other')){
  const label=row.label||typeLabel(row.type);
  if(row.state==='unknown'){lines.push({type:row.type,label,display:{kind:'contact'}});continue;}
  if(row.state==='not_applicable'){lines.push({type:row.type,label,display:{kind:'not_applicable'}});continue;}
  const amount=row.amount??Math.round((rentDueUpfront??0)*(row.percentOfRent??0)/100);
  lines.push({type:row.type,label,display:{kind:'amount',amount,frequency:row.frequency??'one_time',refundable:row.refundable,note:row.note}});
  if((row.frequency==='year'||row.frequency==='one_time')&&total!==null)total+=amount;
  if(row.frequency==='month')excludedRecurring.push(`${label} (monthly)`);
 }
 return {lines,rentDueUpfront,upfrontTotal:missingRequired.length||total===null?null:total,excludedRecurring,missingRequired:[...new Set(missingRequired)]};
}
function typeLabel(type:FeeRow['type']):string{return type==='agency'?'Agency fee':type==='agreement_legal'?'Agreement/legal fee':type==='caution_deposit'?'Caution deposit':type==='service_charge'?'Service charge':'Other fee';}
