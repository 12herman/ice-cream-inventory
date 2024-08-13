// src/components/NavBar.js
import React, {useEffect, useState} from 'react';
import IceCreamLogo from '../assets/img/33456902_6600_7_04.jpg'
import { LiaHandHoldingUsdSolid } from "react-icons/lia";
import { TbIceCream } from "react-icons/tb";
import { Modal, Button, Input, Form, InputNumber, Select, DatePicker, Table , Popconfirm, message, Tag} from 'antd';
const { TextArea } = Input;
import dayjs from 'dayjs';
import { AiOutlineDelete } from 'react-icons/ai'
import { count } from 'firebase/firestore';
import { formatToRupee } from '../js-files/formate-to-rupee';
import { TimestampJs } from '../js-files/time-stamp';

export default function NavBar({ navPages,setNavPages,datas }) {

  const [isSpendingModalOpen, setIsSpendingModalOpen] = useState(false);
  const [spendingForm] = Form.useForm();
  

  const handleSpendingFinish = (values) => {
    console.log('Spending Data:', values);
    setIsSpendingModalOpen(false);
    spendingForm.resetFields();
  };


  //1) quick sale
  const [isQuickSale, setIsQuickSale] = useState(
    { 
      model:false,
      temdata:[],
      proption:[],
      flaveroption:[],
      quntityoption:[],
      flavervalue:'',
      flavourinputstatus:true,
      quantityinputstatus:true,
      count:0,
      dataloading:true,
      total:0,
      date:dayjs().format('DD/MM/YYYY'),
      margin:0,
      billamount:0
    });
  
  const [quickSaleForm] = Form.useForm();
  const [quickSaleForm2] = Form.useForm()
  // tem table column
  const temTableCl = [
    // {
    //   title: 'S.No',
    //   dataIndex: 'sno',
    //   key: 'sno',
    //   width: 70,
    // },
    // {
    //   title: 'Date',
    //   dataIndex: 'date',
    //   key: 'date',
    //   width: 300,
    //   editable: false
    // },
    {
      title: <span className='text-[0.7rem]'>Product</span>,
      dataIndex: 'productname',
      key: 'productname',
      editable: true,
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Flavor</span>,
      dataIndex: 'flavour',
      key: 'flavour',
      editable: true,
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Quantity</span>,
      dataIndex: 'quantity2',
      key: 'quantity2',
      editable: true,
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: true,
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    
    {
      title: <span className='text-[0.7rem]'> Piece Price</span>,
      dataIndex: 'price',
      key: 'price',
      editable: false,
      render:(text) => <span className='text-[0.7rem]'>{formatToRupee(text,true)}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Price</span>,
      dataIndex: 'multiprtotalpr',
      key: 'multiprtotalpr',
      render:(text) => <span className='text-[0.7rem]'>{formatToRupee(text,true) }</span>
    },
    {
      title: <span className='text-[0.7rem]'>Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      render: (_,record) => {
        return (
          <Popconfirm
            className={`'cursor-pointer'} `}
            title="Sure to delete?"
            onConfirm={() => removeTemProduct(record)}
          >
            <AiOutlineDelete
              className={'text-red-500 cursor-pointer hover:text-red-400'}
              size={19}
            />
          </Popconfirm>
        )
      }
    }
  ];

  useEffect(()=>{
    const productData =datas.product.filter((item, i, s) =>item.isdeleted === false && s.findIndex((item2) => item2.productname === item.productname) === i)
    .map((data) => ({ lable: data.productname, value: data.productname }))
    setIsQuickSale(pre => ({...pre,proption:productData}));
  },[isQuickSale.dataloading]);

  const productOnchange = async (value)=>{
    const flavourData = await Array.from( new Set(datas.product
      .filter((item) => item.isdeleted === false && item.productname === value)
      .map((data) => data.flavour)))
      .map((flavour) => ({ label: flavour, value: flavour }));
      setIsQuickSale(pre => ({...pre,flaveroption:flavourData,flavervalue:value,flavourinputstatus:false,quantityinputstatus:true}));
      quickSaleForm.resetFields(['quantity']);
      quickSaleForm.resetFields(['flavour']);
      quickSaleForm.resetFields(['numberofpacks']);
  };

  const flavourOnchange = async (value)=>{
    const quantityData = await Array.from( new Set( datas.product.filter((item) =>item.isdeleted === false && item.flavour === value && item.productname === isQuickSale.flavervalue))).map((q) => ({ label: q.quantity + ' ' + q.unit, value: q.quantity + ' ' + q.unit }));
    setIsQuickSale(pre=>({...pre,quntityoption:quantityData,quantityinputstatus:false}));
    quickSaleForm.resetFields(['quantity']);
    quickSaleForm.resetFields(['numberofpacks']);
  };

  const QuickSaleTemAdd = async (values,i) => {
    
    let existingDataCheck = isQuickSale.temdata.filter((item) => item.productname === values.productname && item.flavour === values.flavour && item.quantity === Number(values.quantity.split(' ')[0]) && item.unit === values.quantity.split(' ')[1]);
    if (existingDataCheck.length > 0) return message.open({ type: 'warning', content: 'This product is already existing in the list' });

    setIsQuickSale(pre=>({...pre,count:isQuickSale.count+1}))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : '';
    const inputDatas = {...values,date:formattedDate,sno:isQuickSale.count,quantity:Number(values.quantity.split(' ')[0]),unit:values.quantity.split(' ')[1]};
    const temdata = datas.product.filter( pr => pr.productname === inputDatas.productname && pr.isdeleted === false && pr.flavour === inputDatas.flavour && pr.quantity === inputDatas.quantity && pr.unit === inputDatas.unit).map(data => ({...data,numberofpacks: inputDatas.numberofpacks,quantity2:values.quantity,sno:isQuickSale.count,multiprtotalpr: values.numberofpacks * data.price}));
    
    setIsQuickSale(pre =>({...pre,temdata:[...pre.temdata,...temdata]}))
    const alltemdata = [...isQuickSale.temdata,...temdata];
    const totalMultiprTotalPr = alltemdata.reduce((acc, curr) => { return acc + (curr.multiprtotalpr || 0)}, 0);
    setIsQuickSale(pre => ({...pre,total:totalMultiprTotalPr}));
  };

  const removeTemProduct =(data)=>{
    const deletedData = isQuickSale.temdata.filter(item => item.sno !== data.sno);
    setIsQuickSale(pre => ({...pre,temdata:deletedData}));
    const totalMultiprTotalPr = deletedData.reduce((acc, curr) => { return acc + (curr.multiprtotalpr || 0)}, 0);
    setIsQuickSale(pre => ({...pre,total:totalMultiprTotalPr}));
  };

  const qickSaledateChange = (value)=>{
    quickSaleForm.resetFields(['productname'])
    quickSaleForm.resetFields(['quantity']);
      quickSaleForm.resetFields(['flavour']);
      quickSaleForm.resetFields(['numberofpacks']);
    setIsQuickSale(pre =>({...pre,temdata:[],count:0,total:0, date:value === null ? "" : value.format('DD/MM/YYYY')}));
  }; 

  const quicksaleMt = ()=>{
    const ItemsData = isQuickSale.temdata.map(data => ({id:data.id,numberofpacks:data.numberofpacks})) 
    console.log(
      { 
        customername:'Quick Sale',
        items:ItemsData,
        billamount:isQuickSale.billamount,
        margin:isQuickSale.margin,
        partialamount:0,
        paymentstatus:'Paid',
        total:isQuickSale.total,
        type:'quick sale',
        isdeleted:false,
        createddate:TimestampJs(),
        date:isQuickSale.date
      });
  };

  const marginMt = (value)=>{
    let marginCal = isQuickSale.total * value.marginvalue / 100;
    let marignAn = isQuickSale.total - marginCal;
    setIsQuickSale(pre => ({...pre,margin:value.marginvalue,billamount:marignAn})); 
  }

  return (
    <nav className='border-r-2 h-screen col-span-2 relative'>
      <ul>
       <li className='flex flex-col justify-center items-center gap-y-1 my-8'><img className='w-14 rounded-full' src={IceCreamLogo}/><span className='font-medium text-[0.9rem]'>Ice Cream</span></li>
        {navPages.pages.map((page, i) => (
            <li key={i} className={`${page === navPages.currentpage ? 'text-white bg-blue-500 rounded-r-full':''} cursor-pointer px-2 py-2 flex items-center gap-x-2`} onClick={() => setNavPages(pre =>({...pre,currentpage:page,pagecount:i}))}>
                <span >{navPages.icons[i]}</span>
                <span>{page}</span>
            </li>
        ))}
      </ul>
      <Button className='flex justify-center items-center gap-x-2 bg-blue-500 text-white p-1 w-[95%] rounded-md absolute bottom-16 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-blue-400' onClick={() => {setIsQuickSale(pre => ({...pre,model:true,dataloading: !isQuickSale.dataloading,temdata:[],count:0,total:0,date:dayjs().format('DD/MM/YYYY'),margin:0,billamount:0})); quickSaleForm.resetFields();}}><TbIceCream size={25}/><span>Quick Sale</span></Button>
      <Button className='flex justify-center items-center gap-x-2 bg-blue-500 text-white p-1 w-[95%] rounded-md absolute bottom-5 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-blue-400' onClick={() => { setIsSpendingModalOpen(true); spendingForm.resetFields(); }}><LiaHandHoldingUsdSolid size={25}/><span>Spending</span></Button>
    {/* quick sale */}
      <Modal
      className='relative'
      footer={
       <div className='flex justify-between items-center'>
        <Form 
        disabled={isQuickSale.temdata.length > 0 ? false :true}
        onFinish={marginMt}
        className='flex gap-x-2'
        form={quickSaleForm2}>
        <Form.Item name='marginvalue' rules={[{ required: true, message: false }]}><InputNumber min={0} max={100} className='w-full' prefix={<span>Margin(%)</span>} /></Form.Item>
        <Form.Item><Button type='primary' htmlType="submit">Enter</Button> </Form.Item>
        </Form>
      <Button onClick={quicksaleMt} disabled={isQuickSale.temdata.length > 0 ? false : true} type='primary'>Quick Sale</Button>
       </div>
      }
        width={1000}
        title={<div className='flex  justify-center py-3'> <h1>QUICK SALE</h1> </div>}
        open={isQuickSale.model}
        onOk={() => quickSaleForm.submit()}
        onCancel={() => { 
          setIsQuickSale(pre =>({...pre,model:false,temdata:[],count:0,total:0,date:dayjs().format('DD/MM/YYYY'),margin:0,billamount:0}));
          quickSaleForm.resetFields(); 
        }}
        >

        <div className='grid grid-cols-6 gap-x-2'>
        <Form
        className='col-span-2'
          form={quickSaleForm}
          layout="vertical"
          onFinish={QuickSaleTemAdd}
          initialValues={{ date: dayjs() }}
        >
          <Form.Item
            className='mb-1'
            name="productname"
            label="Product Name"
            rules={[{ required: true, message: false }]}
          >
            <Select
            onChange={productOnchange}
              showSearch
              placeholder="Search to Select"
              options={isQuickSale.proption}
            />
          </Form.Item>

          <Form.Item
          className='mb-1'
            name="flavour"
            label="Flavour"
            rules={[{ required: true, message: false }]}
          >
            <Select
            disabled={isQuickSale.flavourinputstatus}
            onChange={flavourOnchange}
              showSearch
              placeholder="Search to Select"
              options={isQuickSale.flaveroption}
            />
          </Form.Item>

          <Form.Item
          className='mb-1'
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: false }]}
          >
             <Select
             disabled={isQuickSale.quantityinputstatus}
              showSearch
              placeholder="Search to Select"
              options={isQuickSale.quntityoption}
            />
          </Form.Item>

          <Form.Item
                className="mb-3"
                name="numberofpacks"
                label="Number of Packs"
                rules={[{ required: true, message: false }]}
              >
                <InputNumber className="w-full" />
              </Form.Item>

          <Form.Item className='mb-3 absolute top-8' name='date' label="" rules={[{ required: true, message: false }]}>
          <DatePicker onChange={qickSaledateChange} format={"DD/MM/YY"} />
          </Form.Item>

          <Form.Item className="mb-3 w-full">
                <Button className="w-full" type="primary" htmlType="submit">
                  Add To List
                </Button>
              </Form.Item>
        </Form>

        <Table
        columns={temTableCl}
        pagination={{ pageSize: 4 }}
        className='col-span-4'
        dataSource={isQuickSale.temdata}
        />
        </div>
      
        <span className={`absolute top-8 right-10 ${isQuickSale.margin === 0 ? 'hidden' :'block' }`}>
          <Tag color='blue'>MRP Amount: {formatToRupee(isQuickSale.total)}</Tag>
          <Tag color='orange'>Margin:{isQuickSale.margin} %</Tag>
          <Tag color='green'>Net Amount:  <span className='text-sm'>{isQuickSale.billamount}</span></Tag>
        </span>
      </Modal>

      <Modal
        title={<div className='flex  justify-center py-3'> <h1>SPENDING</h1> </div>}
        open={isSpendingModalOpen}
        onOk={() => spendingForm.submit()}
        onCancel={() => { 
          setIsSpendingModalOpen(false); 
          spendingForm.resetFields(); 
        }}
      >
        <Form
          form={spendingForm}
          layout="vertical"
          onFinish={handleSpendingFinish}
          initialValues={{ date: dayjs() }}
        >
   
         <Form.Item className='mb-3 absolute top-8' name='date' label="" rules={[{ required: true, message: false }]}>
          <DatePicker  format={"DD/MM/YY"} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Person"
            rules={[{ required: true, message: 'Please select the category!' }]}
          >
            <Select>
              <Select.Option value="Owner">Owner</Select.Option>
              <Select.Option value="Employee">Employee</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>

          
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please input the amount!' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name="expenseName"
            label="Description"
            rules={[{ required: true, message: 'Please input the expense name!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

        </Form>
      </Modal>
    </nav>
  );
}
