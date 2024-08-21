// src/components/NavBar.js
import React, {useEffect, useState} from 'react';
import IceCreamLogo from '../assets/img/33456902_6600_7_04.jpg'
import { LiaHandHoldingUsdSolid } from "react-icons/lia";
import { TbIceCream } from "react-icons/tb";
import { Modal, Button, Input, Form, InputNumber, Select, DatePicker, Table , Popconfirm, message, Tag, Radio, Typography} from 'antd';
const { TextArea } = Input;
import dayjs from 'dayjs';
import { AiOutlineDelete } from 'react-icons/ai'
import { addDoc, collection, count, doc } from 'firebase/firestore';
import { formatToRupee } from '../js-files/formate-to-rupee';
import { TimestampJs } from '../js-files/time-stamp';
import { db } from '../firebase/firebase';
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
export default function NavBar({ navPages,setNavPages,datas,deliveryUpdateMt }) {

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
      billamount:0,
      marginstate:false,
      paymentstatus:'Paid',
      customeroption:[],
      editingKeys:[],
    });
  
  const [quickSaleForm] = Form.useForm();
  const [quickSaleForm2] = Form.useForm();
  const [quickSaleForm3] = Form.useForm();
  const [form] = Form.useForm();

  const [editingKey, setEditingKey] = useState('')
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
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Flavor</span>,
      dataIndex: 'flavour',
      key: 'flavour',
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      render:(text) => <span className='text-[0.7rem]'>{formatToRupee(text,true) }</span>
    },
    {
      title: <span className='text-[0.7rem]'>Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: true,
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Piece Price</span>,
      dataIndex: 'productprice',
      key: 'productprice',
    
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
  
    {
      title: <span className="text-[0.7rem]">MRP</span>,
      dataIndex: 'mrp',
      key: 'mrp',
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Margin</span>,
      dataIndex: 'margin',
      key: 'margin',
      editable: true,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Price</span>,
      dataIndex: 'price',
      key: 'price',
      render:(text) => <span className='text-[0.7rem]'>{formatToRupee(text,true) }</span>
    },
    {
      title: <span className='text-[0.7rem]'>Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      render: (_,record) => {
       
          let iseditable = isEditionTemp(record)
        return !iseditable ? (
         <span className='flex gap-x-2'>
        
         <MdOutlineModeEditOutline className='text-pink-500 cursor-pointer' size={19} onClick={()=>temTbEdit(record)}/>
           <Popconfirm
            className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
            title="Sure to delete?"
            onConfirm={() => removeTemProduct(record)}
            disabled={editingKey !== ''}
          >
            <AiOutlineDelete className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`} size={19}/>
          </Popconfirm>
         </span>
        ) : 
        <span className='flex gap-x-2'>
        <Typography.Link
              style={{ marginRight: 8 }}
              onClick={() => tempSingleMargin(record)}
            >
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => setIsQuickSale((pre) => ({ ...pre, editingKeys: [] })) }
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
        </span>
        
      }
    }
  ];

  useEffect(()=>{
    const productData =datas.product.filter((item, i, s) =>item.isdeleted === false && s.findIndex((item2) => item2.productname === item.productname) === i)
    .map((data) => ({ lable: data.productname, value: data.productname }))
    
    const customersData = datas.customers
      .filter((item) => item.isdeleted === false)
      .map((item) => ({ label: item.customername, value: item.customername }))
      setIsQuickSale(pre => ({...pre,proption:productData,customeroption:customersData}));
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
   
    console.log(Number(values.quantity.split(' ')[0]));
    let existingDataCheck = isQuickSale.temdata.filter((item) => item.productname === values.productname && item.flavour === values.flavour && item.quantity === values.quantity );
    
    if (existingDataCheck.length > 0) {
      return message.open({ type: 'warning', content: 'This product is already existing in the list' })
    };

    setIsQuickSale(pre=>({...pre,count:isQuickSale.count+1}))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : '';
    const inputDatas = {...values,date:formattedDate,sno:isQuickSale.count,quantity:Number(values.quantity.split(' ')[0]),unit:values.quantity.split(' ')[1]};

    const temdata = datas.product.filter( pr => pr.productname === inputDatas.productname && pr.isdeleted === false && pr.flavour === inputDatas.flavour && pr.quantity === inputDatas.quantity && pr.unit === inputDatas.unit).map(data => ({...data,numberofpacks: inputDatas.numberofpacks,quantity:values.quantity,sno:isQuickSale.count,mrp: values.numberofpacks * data.price,margin:0,productprice:data.price,price:values.numberofpacks * data.price,key:isQuickSale.count}));
    
    setIsQuickSale(pre =>({...pre,temdata:[...pre.temdata,...temdata]}))
    const alltemdata = [...isQuickSale.temdata,...temdata];
    const totalMultiprTotalPr = alltemdata.reduce((acc, curr) => { return acc + (curr.mrp || 0)}, 0);
    setIsQuickSale(pre => ({...pre,total:totalMultiprTotalPr,marginstate:false,paymentstatus:''}));
    quickSaleForm2.resetFields();
    quickSaleForm3.resetFields();
  };

  const removeTemProduct =(data)=>{
    const deletedData = isQuickSale.temdata.filter(item => item.sno !== data.sno);
    setIsQuickSale(pre => ({...pre,temdata:deletedData}));
    const totalMultiprTotalPr = deletedData.reduce((acc, curr) => { return acc + (curr.mrp || 0)}, 0);
    setIsQuickSale(pre => ({...pre,total:totalMultiprTotalPr,marginstate:false,paymentstatus:''}));
    quickSaleForm2.resetFields();
    quickSaleForm3.resetFields();
  };

  const qickSaledateChange = (value)=>{
    quickSaleForm.resetFields(['productname'])
    quickSaleForm.resetFields(['quantity']);
      quickSaleForm.resetFields(['flavour']);
      quickSaleForm.resetFields(['numberofpacks']);
    setIsQuickSale(pre =>({...pre,temdata:[],count:0,total:0, date:value === null ? "" : value.format('DD/MM/YYYY')}));
  }; 

  const quicksaleMt = async ()=>{
    setIsQuickSale(pre => ({...pre,model:false}));
    let qickSaleForm3Value = quickSaleForm3.getFieldsValue();
    if((qickSaleForm3Value.paymentstatus ==='Partial') === (qickSaleForm3Value.customername === '' || 
      qickSaleForm3Value.customername === undefined || 
      qickSaleForm3Value.customername === null ||
      qickSaleForm3Value.partialamount === undefined ||
      qickSaleForm3Value.partialamount === null ||
      qickSaleForm3Value.partialamount === ""))
    {
      message.open({ type: 'warning', content: 'Please fill the required fields' });
      return quickSaleForm3.submit()
    }
    else{
      const productItems = await isQuickSale.temdata.map(data => ({id:data.id,numberofpacks:data.numberofpacks,margin:data.margin}));
      const newDelivery = { 
          customerid: qickSaleForm3Value.customername === '' || qickSaleForm3Value.customername === undefined || qickSaleForm3Value.customername === null ?  'Quick Sale' : qickSaleForm3Value.customername,
          billamount:isQuickSale.billamount,
          // margin:isQuickSale.margin,
          partialamount:qickSaleForm3Value.partialamount === undefined || qickSaleForm3Value.partialamount === null ? 0 : qickSaleForm3Value.partialamount ,
          paymentstatus:qickSaleForm3Value.paymentstatus,
          total:isQuickSale.total,
          type:'quick',
          isdeleted:false,
          createddate:TimestampJs(),
          date:isQuickSale.date
        };
      try{
        const deliveryCollectionRef = collection(db, 'delivery');
      const deliveryDocRef = await addDoc(deliveryCollectionRef, newDelivery);
      const itemsCollectionRef = collection(deliveryDocRef, 'items');
      for (const item of productItems) {
        await addDoc(itemsCollectionRef, item);
      }
        message.open({ type: 'success', content:  "Production added successfully"} );
        await deliveryUpdateMt();
        setIsQuickSale(pre =>({...pre,model:false,temdata:[],count:0,total:0,date:dayjs().format('DD/MM/YYYY'),margin:0,billamount:0}));
        quickSaleForm.resetFields(); 
      } 
      catch (error) {console.log(error)}
  }
  };

  const marginMt = (value)=>{
    let marginCal = isQuickSale.total * value.marginvalue / 100;
    let marignAn = isQuickSale.total - marginCal;

    let newData = isQuickSale.temdata.map(data =>  ({...data,margin:value.marginvalue,price: data.mrp - (data.mrp * value.marginvalue / 100)}));

    setIsQuickSale(pre => ({...pre,margin:value.marginvalue,billamount:marignAn,marginstate:true,temdata:newData})); 
  };

  // const customerOnchange = (value)=>{
  //   console.log(value);
  // }

  // spending
  const [isSpendingModalOpen, setIsSpendingModalOpen] = useState({model:false,parentid:'',employeeoption:[]});
  const [spendingForm] = Form.useForm();
  
useEffect(()=>{
let employeeOtSet = datas.employees.filter(data=> data.isdeleted === false).map(data =>({label:data.employeename,value:data.id}));
setIsSpendingModalOpen(pre =>({...pre,employeeoption:employeeOtSet}));
},[!isSpendingModalOpen.model]);

// sepending method 
  const handleSpendingFinish = async (values) => {
    const {empid,...spendDatas} =values;
    const newSpendingData = {
      ...spendDatas,
      createddate:TimestampJs(),
      isdeleted:false,
      description:spendDatas.description === '' || spendDatas.description === undefined || spendDatas.description === null ? '' : spendDatas.description,
      type:'spend',
      date:dayjs(spendDatas.date).format('DD/MM/YYYY'),
    };
    try{
      const employeeDocRef = doc(db, 'employee', empid);
      const payDetialsRef = collection(employeeDocRef,'paydetails');
      await addDoc(payDetialsRef,newSpendingData);
      setIsSpendingModalOpen(pre =>({...pre,model:false}));
    spendingForm.resetFields();
    message.open({ type: 'success', content:  "Spending added successfully"} );
    }
    catch(error){console.log(error)}
  };


  const EditableCellTem =({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  })=>{
    const inputNode = inputType === 'number' ? <InputNumber size='small' className='w-[4rem]' min={0}/> : <InputNumber size='small' className='w-[4rem]' min={1}/>
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{
              margin: 0
            }}
            rules={[
              {
                required: true,
                message: false
              }
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    )
  };

  const isEditionTemp = (re) => {
  return isQuickSale.editingKeys.includes(re.key);
  };

  const tempMergedColumns = temTableCl.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'margin' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditionTemp(record)
      })
    }
  });

  const temTbEdit =(re)=>{
    form.setFieldsValue({ ...re });
    console.log(re.key);
    setIsQuickSale(pre=>({...pre,editingKeys:[re.key]}));
  };

  const cancelTemTable =() => { setIsQuickSale(pre=>({...pre,editingKeys:[]}))};

  const tempSingleMargin = async (data) => {
    try {
      
      const row = await form.validateFields();
      const oldtemDatas = isQuickSale.temdata;
     
      // Check if the margin already exists for the same key
      const checkDatas = oldtemDatas.some((item) => item.key === data.key && item.margin === row.margin && item.numberofpacks === row.numberofpacks );
      
      if (checkDatas) {
        message.open({ type: 'info', content: 'Already exists' });
      }
      else{
        message.open({ type: 'success', content: 'Updated successfully' });
      }
      // Update the item in the array while maintaining the order
      const updatedTempproduct = oldtemDatas.map((item) => {
        if (item.key === data.key) {
          let mrpData = (item.productprice * row.numberofpacks);
          return {
            ...item,
            numberofpacks: row.numberofpacks,
            margin: row.margin,
            mrp:item.productprice * row.numberofpacks,
            price: mrpData - mrpData * (row.margin / 100),
          };
        }
        return item;
      });

    const totalAmounts = updatedTempproduct.reduce((acc, item) => {
  return acc + item.price;
}, 0);

const mrpAmount = updatedTempproduct.reduce((acc,item)=>{ return acc + item.mrp}, 0);

setIsQuickSale(pre=>({...pre,billamount:totalAmounts,total:mrpAmount,editingKeys: [],temdata:updatedTempproduct,marginstate:true}));
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <nav className='border-r-2 h-screen col-span-2 relative'>
      <ul>
       <li className='flex flex-col justify-center items-center gap-y-1 my-8'><img className='w-14 rounded-full' src={IceCreamLogo}/><span className='font-medium text-[0.9rem]'>Ice Cream</span></li>
        {navPages.pages.map((page, i) => (
            <li key={i} className={`${page === navPages.currentpage ? 'text-white bg-pink-500 rounded-r-full':''} cursor-pointer px-2 py-2 flex items-center gap-x-2`} onClick={() => setNavPages(pre =>({...pre,currentpage:page,pagecount:i}))}>
                <span >{navPages.icons[i]}</span>
                <span>{page}</span>
            </li>
        ))}
      </ul>

      <Button className='flex justify-center items-center gap-x-2 bg-pink-500 text-white p-1 w-[95%] rounded-md absolute bottom-16 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-pink-400' onClick={() => {setIsQuickSale(pre => ({...pre,model:true,dataloading: !isQuickSale.dataloading,temdata:[],count:0,total:0,date:dayjs().format('DD/MM/YYYY'),margin:0,billamount:0,marginstate:false,paymentstatus:''})); quickSaleForm.resetFields(); quickSaleForm2.resetFields();quickSaleForm3.resetFields();}}><TbIceCream size={25}/><span>Quick Sale</span></Button>
      <Button className='flex justify-center items-center gap-x-2 bg-pink-500 text-white p-1 w-[95%] rounded-md absolute bottom-6 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-pink-400' onClick={() => { setIsSpendingModalOpen(pre =>({...pre,model:true})); spendingForm.resetFields(); }}><LiaHandHoldingUsdSolid size={25}/><span>Spending</span></Button>
      <span className='flex justify-center items-center gap-x-2 text-pink-500 absolute bottom-1 w-[100%] text-xs font-bold'>Version : 1.0</span>
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
        <Form.Item className='mb-0' name='marginvalue' rules={[{ required: true, message: false }]}><InputNumber min={0} max={100} className='w-full' prefix={<span>Margin(%)</span>} /></Form.Item>
        <Form.Item className='mb-0'><Button type='primary' htmlType="submit">Enter</Button> </Form.Item>
        </Form>

        <Form 
        form={quickSaleForm3}
        layout="vertical"
        initialValues={{paymentstatus:"Paid"}} 
        className='flex gap-x-2 justify-center items-center'>
        <Form.Item name="paymentstatus" className='mb-0'>
            <Radio.Group disabled={isQuickSale.marginstate ? false : true} buttonStyle="solid" onChange={(e)=>{setIsQuickSale(pre =>({...pre,paymentstatus:e.target.value}));quickSaleForm3.resetFields(['partialamount']); quickSaleForm3.resetFields(['customername']);}}>
              <Radio.Button value="Paid">PAID</Radio.Button>
              <Radio.Button value="Unpaid">UNPAID</Radio.Button>
              <Radio.Button value="Partial">PARTIAL</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item rules={[{ required: true, message: false }]} className='mb-0' name="partialamount">
            <InputNumber  placeholder='Amount' min={0} disabled={isQuickSale.paymentstatus === 'Partial' ? false :true}/>
          </Form.Item>
          <Form.Item
                 className="mb-0"
                name="customername"
                //label="Customer Name"
                rules={[{ required: true, message: false }]}
              >
              <Input   placeholder='Enter the name' disabled={isQuickSale.paymentstatus === 'Partial' ? false :true}/>
                {/* <Select
                disabled={isQuickSale.paymentstatus === 'Partial' ? false :true}
                  showSearch
                  placeholder="Customer Name"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={isQuickSale.customeroption}
                  onChange={(value, i) => customerOnchange(value, i)}
                /> */}
              </Form.Item>
        </Form>
      <Button onClick={quicksaleMt} disabled={isQuickSale.marginstate ? false : true} type='primary'>Sale</Button>
       </div>
      }
        width={1200}
        title={<div className='flex  justify-center py-3'> <h1>QUICK SALE</h1> </div>}
        open={isQuickSale.model}
        onOk={() => quickSaleForm.submit()}
        onCancel={() => { 
          setIsQuickSale(pre =>({...pre,model:false,temdata:[],count:0,total:0,date:dayjs().format('DD/MM/YYYY'),margin:0,billamount:0}));
          quickSaleForm.resetFields(); 
        }}
        >

        <div className='grid grid-cols-4 gap-x-2'>
        <Form
        className='col-span-1'
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
        <Form form={form} component={false}>
        <Table
        virtual
        columns={tempMergedColumns}
        components={{body: {cell: EditableCellTem}}}
        pagination={{ pageSize: 4 }}
        className='col-span-3'
        dataSource={isQuickSale.temdata}
        scroll={{ x:false, y: false }}
        />
        </Form>
        </div>
      
        <span className={`absolute top-8 right-10 ${isQuickSale.marginstate === false ? 'hidden' :'block' }`}>
          <Tag color='blue'>MRP Amount: <span className='text-sm'>{formatToRupee(isQuickSale.total)}</span></Tag>
          {/* <Tag color='orange'>Margin: <span className='text-sm'>{isQuickSale.margin}</span>%</Tag> */}
          <Tag color='green'>Net Amount:  <span className='text-sm'>{formatToRupee(isQuickSale.billamount)}</span></Tag>
        </span>
      </Modal>

     {/* spendingModal */}
      <Modal
      centered
        title={<div className='flex  justify-center py-3'> <h1>SPENDING</h1> </div>}
        open={isSpendingModalOpen.model}
        onOk={() => spendingForm.submit()}
        onCancel={() => { 
          setIsSpendingModalOpen(pre =>({...pre,model:false})); 
          spendingForm.resetFields(); 
        }}
      >
        <Form
          form={spendingForm}
          layout="vertical"
          onFinish={handleSpendingFinish}
          initialValues={{ date: dayjs() }}
        >
         <Form.Item className='absolute top-8' name='date' label="" rules={[{ required: true, message: false }]}>
          <DatePicker  format={"DD/MM/YY"} />
          </Form.Item>

          <Form.Item
          className='mb-1'
            name="empid"
            label="Person"
            rules={[{ required: true, message: false }]}
          >
            <Select
             showSearch
             placeholder="Search to Select"
            options={isSpendingModalOpen.employeeoption}
            filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            className='mb-1'
            rules={[{ required: true, message: false }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            className='mb-1'
          >
            <TextArea rows={4} />
          </Form.Item>

        </Form>
      </Modal>
    </nav>
  );
}
