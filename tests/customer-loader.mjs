export async function resolve(specifier,context,next){
 if(specifier==='next/headers'||specifier==='next/navigation')return next(specifier+'.js',context);
 try{return await next(specifier,context);}catch(error){if(specifier.startsWith('.')&&!/\.[a-z]+$/.test(specifier))return next(specifier+'.js',context);throw error;}
}
