// src/App.js
import { Button } from "antd";
import NavBar from "./components/NavBar";
import { useEffect, useState } from "react";

// react icons
import { GoHome } from "react-icons/go";
import { FiInbox } from "react-icons/fi";
import { FiShoppingBag } from "react-icons/fi";
import { MdOutlineStorage } from "react-icons/md";
import { MdOutlineWater } from "react-icons/md";
import { TbTruckDelivery } from "react-icons/tb";
import { FaRegRectangleList } from "react-icons/fa6";
import { MdOutlineSettings } from "react-icons/md";
import Pages from "./components/Pages";
import { getProjects } from "./firebase/data-tables/products";
import { getSupplier } from "./firebase/data-tables/supplier";
import { getCustomer } from "./firebase/data-tables/customer";
import { getRawmaterial } from "./firebase/data-tables/rawmaterial";
import { getDelivery } from "./firebase/data-tables/delivery";
import { getEmployee } from "./firebase/data-tables/employee";
import { getProduction } from "./firebase/data-tables/production";

const App =() =>{
  
  // nav state
  const [navPages, setNavPages] = useState({
    pages: ['Home', 'Product', 'Raw Material', 'Storage', 'Production', 'Delivery', 'Supplier List', 'Customer List','Employee List'],
    icons:[<GoHome size={19}/>, <FiInbox size={17}/>,<FiShoppingBag size={17}/>,<MdOutlineStorage size={17}/>,<MdOutlineWater size={17}/>,<TbTruckDelivery size={17}/>,<FaRegRectangleList size={17}/>,<FaRegRectangleList size={17}/>,<FaRegRectangleList size={17}/>],
    currentpage: 'Home',
    pagecount:0
  });

  // theme
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const [datas,setDatas] = useState({
    projects:[],
    projectupdatestaus:false,
    suppliers:[],
    supplierupdatestaus:false,
    customers:[],
    customerupdatestaus:false,
    rawmaterials:[],
    rawmaterialupdatestaus:false,
    delivery:[],
    deliveryupdatestaus:false,
    employees:[],
    employeeupdatestaus:false,
    productions:[],
    productionupdatestaus:false,
  });

  const projectUpdateMt =()=> setDatas(pre => ({...pre, projectupdatestaus:!pre.projectupdatestaus}));
  const supplierUpdateMt =()=> setDatas(pre => ({...pre, supplierupdatestaus:!pre.supplierupdatestaus}));
  const customerUpdateMt =()=> setDatas(pre => ({...pre, customerupdatestaus:!pre.customerupdatestaus}));
  const rawmaterialUpdateMt =()=> setDatas(pre => ({...pre, rawmaterialupdatestaus:!pre.rawmaterialupdatestaus}));
  const deliveryUpdateMt =()=> setDatas(pre => ({...pre, deliveryupdatestaus:!pre.deliveryupdatestaus}));
  const employeeUpdateMt =()=> setDatas(pre => ({...pre, employeeupdatestaus:!pre.employeeupdatestaus}));
  const productionUpdateMt =()=> setDatas(pre => ({...pre, productionupdatestaus:!pre.productionupdatestaus}));
  // get table datas 'project list'
  useEffect(()=>{
    const fetchData = async()=>{
      const {projects,status} = await getProjects();

      if(status){
        setDatas(pre => ({...pre, projects}));
      } 
    };
    fetchData();
  },[datas.projectupdatestaus])

  // get table datas 'supplier list'
  useEffect(()=>{
    const fetchData = async()=>{
      const {supplier,status} = await getSupplier();
      if(status){
        setDatas(pre => ({...pre, supplier}));
      }
    };
    fetchData();
  },[datas.supplierupdatestaus])

  // get table datas 'customer list'
 useEffect(()=>{
  const fetchData = async()=>{
    const {customer,status} = await getCustomer();
    if(status){
      setDatas(pre => ({...pre, customer}));
    }
  }
  fetchData();
 },[datas.customerupdatestaus])

 // get table datas 'raw material list'
 useEffect(()=>{
  const fetchData = async()=>{
    const {status,rawmaterial} = await getRawmaterial();
    if(status){
      setDatas(pre => ({...pre, rawmaterial}));
    }
  }
  fetchData();
 },[datas.rawmaterialupdatestaus])

 // get table datas 'delivery list'
 useEffect(()=>{
    const fetchData = async()=>{
      const {status,delivery} = await getDelivery();
      if(status){
        setDatas(pre => ({...pre, delivery}));
      }
    }
    fetchData();
  },[datas.deliveryupdatestaus]);

  // get table datas 'employee list'
  useEffect(()=>{
    const fetchData= async()=>{
      const {status,employee} = await getEmployee();
      if(status){
        setDatas(pre => ({...pre, employee}));
      }
    }
    fetchData();
  },[datas.employeeupdatestaus])

  // get table datas 'production list'
  useEffect(()=>{
    const fetchData = async ()=>{
      const {status,production} = await getProduction();
      if(status){
        setDatas(pre => ({...pre, production}));
      }
    }
    fetchData();
  },[datas.productionupdatestaus])
  return (
    <main className="grid grid-cols-8 lg:grid-cols-12 w-full h-screen">
    {/* <Button onClick={toggleDarkMode}>Dark</Button> */}
      <NavBar navPages={navPages} setNavPages={setNavPages} />
      <Pages 
      datas={datas} 
      projectUpdateMt={projectUpdateMt} 
      supplierUpdateMt={supplierUpdateMt}
      customerUpdateMt={customerUpdateMt}
      rawmaterialUpdateMt={rawmaterialUpdateMt}
      deliveryUpdateMt={deliveryUpdateMt}
      employeeUpdateMt={employeeUpdateMt}
      productionUpdateMt={productionUpdateMt}
      navPages={navPages}
      />
    </main>
  );
}

export default App;
