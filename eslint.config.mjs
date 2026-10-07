import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
const config=[...nextCoreWebVitals,...nextTypescript,
  {ignores:['.next/**','node_modules/**','next-env.d.ts','playwright-report/**','test-results/**']},
  {files:['**/*.{ts,tsx,js,jsx}'],rules:{
    'no-restricted-imports':['error',{paths:[{name:'@/lib/security/service-client',message:'Service-role Supabase access is limited to lib/data/public-submissions.ts.'}]}],
    'no-restricted-syntax':['error',{selector:"CallExpression[callee.property.name='select'][arguments.0.value='*']",message:'Select explicit columns; site_settings intentionally withholds private columns.'}],
  }},
  {files:['lib/data/public-submissions.ts'],rules:{'no-restricted-imports':'off'}},
];
export default config;
