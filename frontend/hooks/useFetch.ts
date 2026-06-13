import {useState,useEffect} from 'react';

export function useFetch(url:string){
    const [data,setData]=useState<any | null>([]);
    const [error,setError]=useState<string|null>(null);
    const [loading,setLoading]=useState<boolean>(false);
    
    useEffect(()=>{
        let isMounted=true;
        async function getData(url:string){
            try{
                setLoading(true)
                let resp:any=await fetch(url)
                if(!resp.ok){
                    if(isMounted) setError("something went worng");
                    return
                }
                let json:any=await resp.json();
                console.log("json",json.data);
                if(isMounted) setData(json)
            }catch(err:any){
                if(isMounted) setError(err);
            }finally{
                if(isMounted) setLoading(false);
            }
        }
        getData(url)
        return ()=>{
            isMounted=false;
        }
    },[url])
    
    return {
        data,error,loading
    }

}