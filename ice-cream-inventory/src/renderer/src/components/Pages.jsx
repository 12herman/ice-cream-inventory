import React from 'react'
import Home from '../pages/Home'
import Product from '../pages/Product'
import RawMaterials from '../pages/RawMaterials'
import Storage from '../pages/Storage'
import Production from '../pages/Production'
import Delivery from '../pages/Delivery'
import SupplierList from '../pages/SupplierList'
import CustomerList from '../pages/CustomerList'

export default function Pages({navPages,datas,projectUpdateMt,supplierUpdateMt}) {
    const PageLists = [
        <Home datas={datas}/>,
        <Product datas={datas} projectUpdateMt={projectUpdateMt}/>,
        <RawMaterials datas={datas}/>,
        <Storage datas={datas}/>,
        <Production datas={datas}/>,
        <Delivery datas={datas}/>,
        <SupplierList datas={datas} supplierUpdateMt={supplierUpdateMt}/>,
        <CustomerList datas={datas}/>,
    ];
  return (
    <div className="col-span-6 lg:col-span-10 p-2 overflow-y-hidden" style={{height: '100vh'}}>
    {PageLists[navPages.pagecount]}
    </div>
  )
}
