import { list } from '@vercel/blob';

async function main(){
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  console.log('token present?', !!token);
  try{
    const res = await list({ token, limit: 1 });
    console.log('list result:', res);
  }catch(err){
    console.error('list error:');
    console.error(err && err.message ? err.message : err);
    if(err && err.code) console.error('code:', err.code);
  }
}

main();
