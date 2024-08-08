import React, {useEffect, useState} from 'react';
import { Button, Input, Table, Modal, Form, InputNumber, Typography, Popconfirm, message,Select, DatePicker,Radio, Tag } from 'antd';
import { PiExport } from "react-icons/pi";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { LuSave } from "react-icons/lu";
import { TiCancel } from "react-icons/ti";
import { AiOutlineDelete } from "react-icons/ai";
import { createproduct, deleteproduct, updateproduct } from '../firebase/data-tables/products';
import { TimestampJs } from '../js-files/time-stamp';
const { Search } = Input;
const { RangePicker } = DatePicker;
import dayjs from 'dayjs';
import { createProduction, updateProduction } from '../firebase/data-tables/production';
import jsonToExcel from '../js-files/json-to-excel';
import { createUsedmaterial } from '../firebase/data-tables/usedmaterial';
import { createDelivery } from '../firebase/data-tables/delivery';

export default function Delivery({ datas, deliveryUpdateMt,usedmaterialUpdateMt }) {

  //states
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [form4] = Form.useForm();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [data, setData] = useState([]);
 

  // side effect
  useEffect(() => {
    setData(datas.delivery.filter(data => data.isdeleted === false).map((item, index) => ({ ...item,sno:index+1, key: item.id || index })));
  }, [datas]);

  // search
  const [searchText, setSearchText] = useState('');
  const onSearchEnter = (value, _e) => {
    setSearchText(value);
  }
  const onSearchChange = (e) => {
    if(e.target.value === ''){
      setSearchText('');
    }
  }

  const createNewProject = async (values) => {
   await createproduct({ 
     ...values, 
     createddate: TimestampJs(), 
     updateddate: '', 
     isdeleted: false 
   });
   form.resetFields();
   deliveryUpdateMt();
   setIsModalOpen(false);
 };

 const columns = [
   {
     title: 'S.No',
     key: 'sno',
     width: 70,
     render: (_, __, index) => index + 1,
     filteredValue: [searchText],
     onFilter: (value, record) => {
       return(
         String(record.productname).toLowerCase().includes(value.toLowerCase()) ||
         String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
         String(record.flavour).toLowerCase().includes(value.toLowerCase()) ||
         String(record.productperpack).toLowerCase().includes(value.toLowerCase()) ||
         String(record.price).toLowerCase().includes(value.toLowerCase()) 
       )
     },
   },
   {
     title: 'Date',
     dataIndex: 'date',
     key: 'date',
     editable: false,
   },
   {
    title: 'Customer Name',
    dataIndex: 'customername',
    key: 'customername',
    editable: false,
  },
   {
     title: 'Product',
     dataIndex: 'productname',
     key: 'productname',
     editable: false,
   },
   {
     title: 'Flavor',
     dataIndex: 'flavour',
     key: 'flavour',
     editable: false,
   },
   {
     title: 'Quantity',
     dataIndex: 'quantity',
     key: 'quantity',
     editable: false,
     width: 120,
   },
   {
    title: 'Packs',
    dataIndex: 'numberofpacks',
    key: 'numberofpacks',
    editable: true,
    width: 160,
  },
   {
    title: 'Payment Status',
    dataIndex: 'paymentstatus',
    key: 'paymentstatus',
    editable: true,
    width: 160,
    sorter: (a, b) => a.paymentstatus.localeCompare(b.paymentstatus),
    showSorterTooltip: {target: 'sorter-icon'},
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    editable: true,
    width: 160,
  },
   {
     title: 'Action',
     dataIndex: 'operation',
     fixed:'right',
     width:110,
     render: (_, record) => {
       const editable = isEditing(record);
       return editable ? (
         <span className='flex gap-x-1 justify-center items-center'>
         <Typography.Link 
           onClick={() => save(
            record
             )}
           style={{
             marginRight: 8,
           }}
         >
           <LuSave size={17}/>
         </Typography.Link>
         <Popconfirm  title="Sure to cancel?" onConfirm={cancel}>
         <TiCancel size={20} className='text-red-500 cursor-pointer hover:text-red-400' />
         </Popconfirm>
       </span>
       ) : (
<span className='flex gap-x-3 justify-center items-center'>
<Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
 <MdOutlineModeEditOutline size={20} />
  </Typography.Link>
  <Popconfirm className={`${editingKey !== '' ? 'cursor-not-allowed': 'cursor-pointer'} `} title="Sure to delete?" onConfirm={() => deleteProduct(record)} disabled={editingKey !== ''}>
   <AiOutlineDelete className={`${editingKey !== ''  ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`} size={19}/>
  </Popconfirm>
</span>
       );
     },
   },
 ];

 const EditableCell = ({
   editing,
   dataIndex,
   title,
   inputType,
   record,
   index,
   children,
   ...restProps
 }) => {
   const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
   return (
     <td {...restProps}>
       {editing ? (
         <Form.Item
           name={dataIndex}
           style={{
             margin: 0,
           }}
           rules={[
             {
               required: true,
               message: false,
             },
           ]}
         >
           {inputNode}
         </Form.Item>
       ) : (
         children
       )}
     </td>
   );
 };
 const isEditing = (record) => record.key === editingKey;
 const edit = (record) => { form.setFieldsValue({ ...record,});setEditingKey(record.key);};
 const mergedColumns = columns.map((col) => {
   if (!col.editable) {
     return col;
   }
   return {
     ...col,
     onCell: (record) => ({
       record,
       inputType: col.dataIndex === 'numberofpacks' ? 'number' : 'text',
       dataIndex: col.dataIndex,
       title: col.title,
       editing: isEditing(record),
     }),
   };
 });
 const cancel = () => {setEditingKey('')};

 //update method
 const save = async (key) => {
   try {
     const row = await form.validateFields();
     const newData = [...data];
     const index = newData.findIndex((item) => key.id === item.key);
     if (index != null &&
       row.numberofpacks === key.numberofpacks  
       ) {
       message.open({type: 'info',content: 'No changes made',});
       setEditingKey('');
     } else {
       await updateProduction(key.id,{numberofpacks:row.numberofpacks,updateddate: TimestampJs()},);
       await deliveryUpdateMt();
       message.open({type: 'success',content: 'Updated Successfully',});
       setEditingKey('');
     }
   } catch (errInfo) {
     console.log('Validate Failed:', errInfo);
   }
 };


 // selection
 const [selectedRowKeys, setSelectedRowKeys] = useState([]);
 const onSelectChange = (newSelectedRowKeys) => {
     newSelectedRowKeys.length === 0 ? setEditingKey('') :setEditingKey('hi');
   if (newSelectedRowKeys.length > 0 ) {
     const selectTableData = data.filter(item => newSelectedRowKeys.includes(item.key));
   }
   setSelectedRowKeys(newSelectedRowKeys);
 };
 const rowSelection = {
   selectedRowKeys,
   columnWidth:50,
   onChange: onSelectChange,
   selections: [
     Table.SELECTION_ALL,
     Table.SELECTION_INVERT,
     Table.SELECTION_NONE,
     {
       key: 'odd',
       text: 'Select Odd Row',
       onSelect: (changeableRowKeys) => {
         let newSelectedRowKeys = [];
         newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
           if (index % 2 !== 0) {
             return false;
           }
           return true;
         });
         setSelectedRowKeys(newSelectedRowKeys);
       },
     },
     {
       key: 'even',
       text: 'Select Even Row',
       onSelect: (changeableRowKeys) => {
         let newSelectedRowKeys = [];
         newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
           if (index % 2 !== 0) {
             return true;
           }
           return false;
         });
         setSelectedRowKeys(newSelectedRowKeys);
       },
     },
   ],
 };


   // Table Hight Auto Adjustment (***Do not tounch this code*** ) //
   const [tableHeight, setTableHeight] = useState(window.innerHeight - 200); // Initial height adjustment
   useEffect(() => {
     // Function to calculate and update table height
     const updateTableHeight = () => {
       const newHeight = window.innerHeight - 100; // Adjust this value based on your layout needs
       setTableHeight(newHeight);
     };
     // Set initial height
     updateTableHeight();
     // Update height on resize and fullscreen change
     window.addEventListener('resize', updateTableHeight);
     document.addEventListener('fullscreenchange', updateTableHeight);
     // Cleanup event listeners on component unmount
     return () => {
       window.removeEventListener('resize', updateTableHeight);
       document.removeEventListener('fullscreenchange', updateTableHeight);
     };
   }, []);

   // delete
   const deleteProduct = async (data) => {
     //await deleteproduct(data.id);
     console.log(data);
     const {id,...newData} = data;
     await updateProduction(id,{isdeleted: true,deleteddate: TimestampJs()});
     deliveryUpdateMt();
     message.open({type: 'success',content: 'Deleted Successfully',});
   };
   
   const columns2 = [
    // {
    //   title: 'S.No',
    //   dataIndex: 'sno',
    //   key: 'sno',
    //   width: 70,
    // },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 800,
      editable: false,
    },
    {
      title: 'Product',
      dataIndex: 'productname',
      key: 'productname',
      editable: true,
    },
    {
      title: 'Flavor',
      dataIndex: 'flavour',
      key: 'flavour',
      editable: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      width: 120,
    },
    {
      title: 'Packs',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: true,
      width: 120,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 200,
      editable: false,
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed:'right',
      width:110,
      render: (_, record) => {
       return (<Popconfirm className={`${editingKey !== '' ? 'cursor-not-allowed': 'cursor-pointer'} `} title="Sure to delete?" onConfirm={() => removeTemProduct(record)} disabled={editingKey !== ''}>
       <AiOutlineDelete className={`${editingKey !== ''  ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`} size={19}/>
      </Popconfirm>);
      },
    },
  ];

  const [option,setOption] = useState({
    customer:[],
    customerstatus:true,
    flavour:[],
    flavourstatus:true,
    product:[],
    productvalue:'',
    quantity:[],
    quantitystatus:true,
    tempproduct:[],
   });

  //product initial value
  useEffect(()=>{
    const productOp = datas.product.filter((item,i,s) => item.isdeleted === false && s.findIndex(item2 => item2.productname === item.productname) === i).map(data => ({lable:data.productname,value:data.productname}));
    setOption(pre => ({...pre,product:productOp}));
    const optionscustomers = datas.customers.filter(item => item.isdeleted === false).map(item => ({label:item.customername,value:item.customername}));
    setOption(pre => ({...pre,customer:optionscustomers}));
  },[]);

  const customerOnchange = async(value,i) =>{
    setOption(pre => ({...pre,customerstatus:false}));
  }
  
  //product onchange value
  const productOnchange = async (value, i) => {
    form2.resetFields(['flavour']);
    form2.resetFields(['quantity']);
    form2.resetFields(['numberofpacks']);
    const flavourOp = await Array.from(
      new Set(datas.product
          .filter(item => item.isdeleted === false && item.productname === value)
          .map(data => data.flavour))
    ).map(flavour => ({ label: flavour, value: flavour }));
    await setOption(pre => ({ ...pre, flavourstatus: false, flavour: flavourOp, productvalue: value,quantitystatus:true }));
  };

  //flavour onchange value
  const flavourOnchange = async (value, i) => {
    form2.resetFields(['quantity']);
    form2.resetFields(['numberofpacks']);
    const quantityOp = await Array.from(new Set(datas.product.filter(item => item.isdeleted === false && item.flavour === value && item.productname === option.productvalue))).map(q => ({ label: q.quantity +' ' + q.unit, value: q.quantity +' ' + q.unit}));
    await setOption(pre => ({ ...pre, quantitystatus: false, quantity: quantityOp }));
  };
  
  // create add tem product
  const [count,setCount] = useState(0);
   const createTemDeliveryMt = async (values) => {
    setCount(count+1);
    const formattedDate = values.date ? values.date.format('DD-MM-YYYY') : '';
    const newProduct = { ...values,key:count, date: formattedDate, createddate: TimestampJs() };
    const checkExsit = option.tempproduct.some(item => item.customername === newProduct.customername && item.productname === newProduct.productname && item.flavour === newProduct.flavour && item.quantity === newProduct.quantity && item.numberofpacks === newProduct.numberofpacks && item.date === newProduct.date);
    
    const checkSamePacks = option.tempproduct.some(item => item.customername === newProduct.customername && item.productname === newProduct.productname && item.flavour === newProduct.flavour && item.quantity === newProduct.quantity && item.numberofpacks !== newProduct.numberofpacks && item.date === newProduct.date && item.key !== newProduct.key);
    
    const temVales = {...values,date:formattedDate};
    //const dbCheck = datas.productions.some(item => item.productname === temVales.productname && item.flavour === temVales.flavour && item.quantity === temVales.quantity && item.date === temVales.date);
    if(checkExsit){
      message.open({type: 'warning',content: 'Product is already added',});
      return;
    }
     else if (checkSamePacks) {
      message.open({type: 'warning',content: 'Product is already added',});
      return;
     }
    //  else if(dbCheck){
    //   message.open({type: 'warning',content: 'Product is already added',});
    //   return;
    //  }
    else{
      setOption(pre => ({...pre,tempproduct:[...pre.tempproduct,newProduct]}));
      deliveryUpdateMt();
      //form2.resetFields();
    }
  };

  // remove temp product
  const removeTemProduct = (key) => {
    console.log(key);
    const newTempProduct = option.tempproduct.filter(item => item.key !== key.key);
    setOption(pre => ({...pre,tempproduct:newTempProduct}));
  };

  // add new production
  const addNewDelivery = async(newvalue)=> {
    await option.tempproduct.map(async (item,i)=>{
      let {key,...newProduction} = item;
      await createDelivery({...newProduction,isdeleted:false,...newvalue});
    });
    await deliveryUpdateMt();
    message.open({type: 'success',content: 'Production added successfully',});
    await modelCancel();
  };

  const modelCancel =()=> { 
    setIsModalOpen(false); 
    form2.resetFields();
    setOption(pre => ({...pre,tempproduct:[], flavour:[], flavourstatus:true,quantity:[],quantitystatus:true,customerstatus:true}));
    setCount(0);
    };

    // export
    const exportExcel = async () => {
      const exportDatas = data.filter(item => selectedRowKeys.includes(item.key));
      jsonToExcel(exportDatas,`Production-List-${TimestampJs()}`);
      setSelectedRowKeys([]);
      setEditingKey('');
    };

    // material used
    const columns3 = [
      // {
      //   title: 'S.No',
      //   dataIndex: 'sno',
      //   key: 'sno',
      //   width: 70,
      // },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 150,
        editable: false,
      },
      {
        title: 'Material',
        dataIndex: 'material',
        key: 'material',
        editable: true,
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        editable: true,
      },
      {
        title: 'Action',
        dataIndex: 'operation',
        fixed:'right',
        width:110,
        render: (_, record) => {
         return (<Popconfirm className={`${editingKey !== '' ? 'cursor-not-allowed': 'cursor-pointer'} `} title="Sure to delete?" onConfirm={() => removeTemMaterial(record)} disabled={editingKey !== ''}>
         <AiOutlineDelete className={`${editingKey !== ''  ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`} size={19}/>
        </Popconfirm>);
        },
      },
    ];
    const [form3] = Form.useForm();
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [mtOption,setMtOption] = useState({
      material:[],
      tempproduct:[],
      count:0
    });
    useEffect(()=>{
       const optionsuppliers = datas.suppliers.filter((item,i,self)=> item.isdeleted ===false && i === self.findIndex(d => d.materialname === item.materialname)).map(item => ({label:item.materialname,value:item.materialname}));
       setMtOption(pre => ({...pre,material:optionsuppliers}));
    },[])

    // create material
    const createTemMaterial = async (values)=>{
      setMtOption(pre => ({...pre,count:pre.count+1}));
      const formattedDate = values.date ? values.date.format('DD-MM-YYYY') : '';
      const newMaterial = {...values,date:formattedDate,key:mtOption.count,createddate:TimestampJs(),isdeleted:false,quantity:values.quantity + ' ' + values.unit};
      const checkExsit = mtOption.tempproduct.find(item => item.material === newMaterial.material  && item.date === newMaterial.date);
      const dbcheckExsit = datas.usedmaterials.find(item => item.material === newMaterial.material  && item.date === newMaterial.date);
      if(checkExsit){
        message.open({type: 'warning',content: 'Product is already added',});
        return;
      }
      else if(dbcheckExsit){
        message.open({type: 'warning',content: 'Product is already added',});
        return;
      }
      else{
        setMtOption(pre => ({...pre,tempproduct:[...pre.tempproduct,newMaterial]}));
      }
      
    };

    // remove tem material
    const removeTemMaterial = (key) => {
      const newTempProduct = mtOption.tempproduct.filter(item => item.key !== key.key);
      setMtOption(pre => ({...pre,tempproduct:newTempProduct}));
    };

    // add new material to data base
    const addNewTemMaterial = async()=> {
      mtOption.tempproduct.map(async (item,i)=>{
        let {key,quantity,...newMaterial} = item;
        let quntity = Number(quantity.split(' ')[0]);
        await createUsedmaterial({...newMaterial,quantity:quntity});
      });
     usedmaterialUpdateMt();
     materialModelCancel();
    };

    // model cancel
    const materialModelCancel =()=> {
      setIsMaterialModalOpen(false);
      form3.resetFields();
      setMtOption(pre => ({...pre,tempproduct:[],count:0}));
      };

      const onPriceChange =(value)=>{
console.log(value);
      }

  return (
    <div>
      <ul>
      <li className='flex gap-x-3 justify-between items-center'>
      <Search  allowClear className='w-[40%]' placeholder="Search" onSearch={onSearchEnter} onChange={onSearchChange} enterButton />
      
      <span className='flex gap-x-3 justify-center items-center'>
      <RangePicker />
          <Button onClick={exportExcel} disabled={selectedRowKeys.length === 0}>Export <PiExport /></Button>
          <Button onClick={()=>setIsMaterialModalOpen(true)} type="primary" disabled={editingKey !== ''}>Return <IoMdRemove /></Button>
          <Button disabled={editingKey !== ''} type="primary" onClick={() => {setIsModalOpen(true); form.resetFields()}}>
              Send Delivery <IoMdAdd />
            </Button>
            </span>
      </li>
      <li className='mt-2'>
      <Form form={form} component={false}>
      <Table
              virtual
              components={{
                body: {
                  cell: EditableCell,
                },
              }} 
              dataSource={data}
              columns={mergedColumns}
              pagination={false}
              loading={data.length === 0 ? true : false}
              rowClassName="editable-row"
              scroll={{x:900,y: tableHeight}}
              rowSelection={rowSelection}
            />
            </Form>
      </li>
      </ul>
      
      <Modal
        className='relative'
        title={<div className='flex justify-center py-3'> <h2>Send Delivery</h2> </div>}
        width={1000}
        open={isModalOpen}
        // onOk={addNewDelivery}
        onCancel={modelCancel}
        okButtonProps={{ disabled: true }}
        footer={
        <div>          
        
        
        
        {/* <Form.Item className='mb-3 ' name="price">
         <Radio.Group  buttonStyle="solid">
          <Radio.Button  value="Price">Price</Radio.Button>
          <Radio.Button  value="Margin">{`Margin(%)`}</Radio.Button>
          </Radio.Group>
         </Form.Item> */}
         <section  className='flex gap-x-3 justify-between '>
         <span>
          <p>Total:</p>
         </span>

         <span>
         <Search placeholder="Margin Amount" allowClear enterButton={<>Enter</>} onSearch={onPriceChange} style={{ width: 200,}}/>
         </span>

       
        <Form
        
        disabled={option.tempproduct.length > 0 ? false:true}
        form={form4}
        initialValues={{price: 'Price',paymentstatus:'Unpaid'}}
        onFinish={addNewDelivery}
        >
        <span className='flex gap-x-3 m-0 justify-center items-center'>
        <Form.Item  name="paymentstatus">
         <Radio.Group  buttonStyle="solid">
          <Radio.Button  value="Paid">PAID</Radio.Button>
          <Radio.Button value="Unpaid">UNPAID</Radio.Button>
          </Radio.Group>
         </Form.Item>
        <Form.Item>
        <Button htmlType='submit' type='primary' disabled={option.tempproduct.length > 0 ? false:true} className=' w-fit'>Send</Button>
        </Form.Item>
        </span>
        </Form>
    
        </section>
        
        
        
       
        
        </div>}>
      
      <div className='grid grid-cols-3 gap-x-3'>
      <span className='col-span-1'>
      <Form
          onFinish={createTemDeliveryMt}
          form={form2}
          layout='vertical'
          initialValues={{ date: dayjs()}}
        >
        <Form.Item className='mb-1' name='customername' label="Customer Name" rules={[{ required: true, message: false }]}>
          <Select
            showSearch
            placeholder="Search to Select"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={option.customer}
            onChange={(value,i) => customerOnchange(value,i)}
          />
          </Form.Item>
          <Form.Item className='mb-1' name='productname' label="Product Name" rules={[{ required: true, message: false }]}>
          <Select
            disabled={option.customerstatus}
            showSearch
            placeholder="Search to Select"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={option.product}
            onChange={(value,i) => productOnchange(value,i)}
          />
          </Form.Item>
          <Form.Item className='mb-1' name='flavour' label="Flavour" rules={[{ required: true, message: false }]}>
          <Select
          disabled={option.flavourstatus}
          onChange={(value,i) => flavourOnchange(value,i)}
            showSearch
            placeholder="Search to Select"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={option.flavour}
          />
          </Form.Item>
          <Form.Item className='mb-1 w-full' name='quantity' label="Quantity" rules={[{ required: true, message: false }]}>
          <Select
            disabled={option.quantitystatus}
            showSearch
            placeholder="Search to Select"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={option.quantity}
          />
          </Form.Item>

          <Form.Item className='mb-3' name='numberofpacks' label="Number of Packs" rules={[{ required: true, message: false }]}>
          <InputNumber className='w-full' />
          </Form.Item>

          <Form.Item className='mb-3 absolute top-8' name='date' label="" rules={[{ required: true, message: false }]}>
          <DatePicker  format={"DD/MM/YY"} />
          </Form.Item>

          <Form.Item className='mb-3 w-full'>
           <Button className='w-full' type="primary" htmlType="submit">Add To List</Button>
         </Form.Item>
        {/* <Button disabled={option.tempproduct.length > 0 ? false:true} onClick={addNewDelivery} className=' w-full'>Add</Button> */}
        </Form>
      </span>
      <span className='col-span-2'>
        <Table 
        columns={columns2}
        dataSource={option.tempproduct}
        pagination={{pageSize:4}}
        />
      </span>
      </div>
      </Modal>
      
      {/* material used model */}
      <Modal
        className='relative'
        title={<div className='flex  justify-center py-3'> <h2>Add Products</h2> </div>}
        width={1000}
        open={isMaterialModalOpen}
        onCancel={materialModelCancel}
        okButtonProps={{ disabled: true }}
        footer={<Button type='primary' disabled={mtOption.tempproduct.length > 0 ? false:true} onClick={addNewTemMaterial} className=' w-fit'>Add</Button>}
      >
      <div className='grid grid-cols-3 gap-x-3'>
      
      <span className='col-span-1 '>
      <Form
          onFinish={createTemMaterial}
          form={form3}
          layout='vertical'
          initialValues={{ date: dayjs() }}
        >
          <Form.Item name='material' label="Material Name" rules={[{ required: true, message: false }]}>
          <Select
            showSearch
            placeholder="Search to Select"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={mtOption.material}
            onChange={(value,i) => productOnchange(value,i)}
          />
          </Form.Item>
                  
         <span className='flex gap-x-2 '>
         <Form.Item className='mb-1 w-full' name='quantity' label="Quantity" rules={[{ required: true, message: false }]}>
          <InputNumber className='w-full'/>
          </Form.Item>

          <Form.Item className='' name='unit' label="Unit" rules={[{ required: true, message: false }]}>
          <Select
          onChange={(value,i) => flavourOnchange(value,i)}
            showSearch
            placeholder="Search to Select"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={[{label:'Liter',value:'Liter',},{label:'MM',value:'MM'},{label:'GM',value:'GM'},{label:'KG',value:'KG'}]}
          />
          </Form.Item>
         </span>

          <Form.Item className=' absolute top-8' name='date' label="" rules={[{ required: true, message: false }]}>
          <DatePicker  format={"DD/MM/YY"} />
          </Form.Item>

          <Form.Item className=' w-full'>
           <Button className='w-full' type="primary" htmlType="submit">Add To List</Button>
         </Form.Item>
        {/* <Button disabled={option.tempproduct.length > 0 ? false:true} onClick={addNewDelivery} className=' w-full'>Add</Button> */}
        </Form>
      </span>
      <span className='col-span-2'>
        <Table 
        columns={columns3}
        dataSource={mtOption.tempproduct}
        pagination={{pageSize:4}}
        />
      </span>
      </div>
      </Modal>
    </div>
  )
}
