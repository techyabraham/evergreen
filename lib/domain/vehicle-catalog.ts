export const vehicleClasses=[
 {value:'car',label:'Passenger car',vpicType:'car'},
 {value:'suv',label:'SUV / crossover',vpicType:'car'},
 {value:'truck',label:'Truck / pickup',vpicType:'truck'},
 {value:'bus',label:'Bus / minibus',vpicType:'bus'},
 {value:'van',label:'Van / MPV',vpicType:'multipurpose passenger vehicle'},
 {value:'motorcycle',label:'Motorcycle / scooter',vpicType:'motorcycle'},
 {value:'tricycle',label:'Tricycle',vpicType:'motorcycle'},
 {value:'commercial',label:'Heavy / commercial vehicle',vpicType:'truck'},
 {value:'other',label:'Other vehicle',vpicType:null},
] as const;

// Product names from Innoson’s published product-line article and current model pages.
export const innosonModels=[
 'Connect','Caris','G20 Smart','Ikenga','Capa','G5T','G6T','G40','G80',
 '5380','Seriki','6540','6601','6800','6875','6115',
 'Carrier 4WD','Granite 4WD','Ijele 4WD',
 'Medical Ambulance','Garbage Compactor','Fire Truck','Military Vehicle',
];

export function isInnosonMake(value:string){return /^(innoson|ivm)(\b|\s)/i.test(value.trim())||/^(innoson|ivm)$/i.test(value.trim());}
export function vehicleClassLabel(value:string|null|undefined){return vehicleClasses.find(item=>item.value===value)?.label||null;}
