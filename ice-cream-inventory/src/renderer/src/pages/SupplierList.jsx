import React, { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Table,
  Modal,
  Form,
  InputNumber,
  Typography,
  Popconfirm,
  message,
  Select,
  Radio,
  DatePicker,
  Tag,
  Spin,
  Card,
  List,
  Space,
  Popover,
  Empty
} from 'antd'
import { MdProductionQuantityLimits } from "react-icons/md";
import { IoCloseCircle } from "react-icons/io5";
import { SolutionOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { IoMdAdd } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { PiExport } from 'react-icons/pi'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import { addNewMaterialItem, getOneMaterialDetailsById, getMaterialDetailsById, updateMaterialItsms, updateSupplier } from '../firebase/data-tables/supplier'
import { createStorage, updateStorage } from '../firebase/data-tables/storage'
import jsonToExcel from '../js-files/json-to-excel'
import { addDoc, collection, doc, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import dayjs from 'dayjs'
import { formatToRupee } from '../js-files/formate-to-rupee'
import { PiWarningCircleFill } from 'react-icons/pi'
const { Search, TextArea } = Input
import { debounce } from 'lodash'
import { areArraysEqual } from '../js-files/compare-two-array-of-object';
import { getMissingIds } from '../js-files/missing-id';


export default function SupplierList({ datas, supplierUpdateMt, storageUpdateMt }) {
  // states
  const [form] = Form.useForm();
  const [expantableform] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])
  const [payForm] = Form.useForm()
  const[materialForm] = Form.useForm();
  const [isPayModelOpen, setIsPayModelOpen] = useState(false)
  const [isPayDetailsModelOpen, setIsPayDetailsModelOpen] = useState(false)
  const [supplierPayId, setSupplierPayId] = useState(null)
  const [payDetailsData, setPayDetailsData] = useState([])
  const [supplierTbLoading, setSupplierTbLoading] = useState(true)

  // side effect
  useEffect(() => {
    setSupplierTbLoading(true)
    const filteredData = datas.suppliers
      .filter((data) => data.isdeleted === false)
      .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    // setData(filteredData)
   
  async function fetchMaterialItems(){
    let getAlldatas = await Promise.all(filteredData.map(async data=>{
      let {materials,status} = await getMaterialDetailsById(data.id);
      return ({...data,item:materials.filter(data=> data.isdeleted === false)})
    }))
    setData(getAlldatas);
   }
    fetchMaterialItems()
    
    setSupplierTbLoading(false)
  }, [datas])

  // search
  const [searchText, setSearchText] = useState('')
  const onSearchEnter = (value, _e) => {
    setSearchText(value)
  }
  const onSearchChange = (e) => {
    if (e.target.value === '') {
      setSearchText('')
    }
  }

  const [supplierModalLoading, setSupplierModalLoading] = useState(false)
  // create new project
  const createNewSupplier = async (values) => {

    if (values.material.length === 0) {
      return message.open({ type: 'info', content: 'Add one material' })
    }

    const { material, ...value } = values

    const supplierDatas = {
      ...value,
      createddate: TimestampJs(),
      updateddate: '',
      isdeleted: false
    }

    setSupplierModalLoading(true)
    try {
      const supplierCollectionRef = collection(db, 'supplier')
      const supplierDocRef = await addDoc(supplierCollectionRef, supplierDatas)
      const materialCollectionRef = await collection(supplierDocRef, 'materialdetails')
      for (const materialItem of material) {
        await addDoc(materialCollectionRef, {...materialItem,isdeleted:false,createddate:TimestampJs()})
      
        const materialExists = datas.storage.find(
          (storageItem) => storageItem.materialname === materialItem.materialname && storageItem.category === 'Material List' && storageItem.unit === materialItem.unit
        )
        if (!materialExists) {
          await createStorage({
            materialname: materialItem.materialname,
            unit: materialItem.unit,
            alertcount: 0,
            quantity: 0,
            category: 'Material List',
            createddate: TimestampJs()
          })
          storageUpdateMt()
        }
      }

      form.resetFields()
      supplierUpdateMt()
      message.open({ type: 'success', content: 'Supplier Added Successfully' })
    } catch (e) {
      console.log(e)
    } finally {
      setSupplierOnchangeValue('')
      setSupplierModalLoading(false)
      setIsModalOpen(false)
    }
  }

  const showPayModal = (record) => {
    payForm.resetFields()
    setSupplierPayId(record.id)
    setIsPayModelOpen(true)
  }

  const [payModalLoading, setPayModalLoading] = useState(false)
  const supplierPay = async (value) => {
    setPayModalLoading(true)
    let { date, description, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const payData = { ...Datas, date: formateDate, description: description || '' }
    try {
      const customerDocRef = doc(db, 'supplier', supplierPayId)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData)
    } catch (e) {
      console.log(e)
    } finally {
      payForm.resetFields()
      setSupplierPayId(null)
      setIsPayModelOpen(false)
      setPayModalLoading(false)
      setAmountOnchangeValue('')
    }
  }

  const showPayDetailsModal = async (record) => {
    try {
      const customerDocRef = doc(db, 'supplier', record.id)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      const payDetailsSnapshot = await getDocs(payDetailsRef)
      const payDetails = payDetailsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }))
      const rawmaterialsRef = datas.rawmaterials.filter(
        (item) => item.isdeleted === false && item.supplierid === record.id
      )
      const rawmaterialNameRef = await Promise.all(
        rawmaterialsRef.map(async (material) => {
          const materialName = await getOneMaterialDetailsById(material.supplierid, material.materialid)
          return{
            ...material,
            materialname: materialName.material.materialname,
            unit: materialName.material.unit
          }
        })
      )
      const combainData = payDetails.concat(rawmaterialNameRef)
      setPayDetailsData(combainData)
    } catch (e) {
      console.log(e)
    }
    setIsPayDetailsModelOpen(true)
  }

  const payDetailsColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (text, record, index) => <span>{index + 1}</span>,
      width: 50
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => {
        const dateA = dayjs(a.date, 'DD/MM/YYYY')
        const dateB = dayjs(b.date, 'DD/MM/YYYY')
        return dateA.isAfter(dateB) ? 1 : -1
      },
      defaultSortOrder: 'descend',
      width: 115
    },
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname',
      render: (text) => text ? text : '-'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text, record) =>
        record.quantity !== undefined ? record.quantity + ' ' + record.unit : '-',
      width: 100
    },
    {
      title: 'Amount',
      dataIndex: 'price',
      key: 'price',
      render: (text, record) =>
        record.price === undefined
          ? formatToRupee(record.amount, true)
          : formatToRupee(record.price, true),
      width: 130
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      render: (text, record) =>
        record.paymentstatus === undefined ? (
          <Tag color="green">Pay</Tag>
        ) : record.paymentstatus === 'Paid' ? (
          <Tag color="green">Paid</Tag>
        ) : record.paymentstatus === 'Unpaid' ? (
          <Tag color="red">UnPaid</Tag>
        ) : record.paymentstatus === 'Partial' ? (
          <span className="flex items-center">
            <Tag color="yellow">Partial</Tag>{' '}
            <Tag color="blue" className=" text-[0.7rem]">
              {formatToRupee(record.partialamount, true)}
            </Tag>
          </span>
        ) : (
          <></>
        ),
      width: 139
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text, record) => (record.description === undefined ? '-' : record.description)
    }
  ];

  const [openPopoverRow, setOpenPopoverRow] = useState(null);
  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.suppliername).toLowerCase().includes(value.toLowerCase()) ||
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.location).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.gender).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Supplier',
      dataIndex: 'suppliername',
      key: 'suppliername',
      editable: true,
      sorter: (a, b) => a.suppliername.localeCompare(b.suppliername),
      showSorterTooltip: { target: 'sorter-icon' },
      defaultSortOrder: 'ascend'
    },
    // {
    //   title: 'Material',
    //   dataIndex: 'materialname',
    //   key: 'materialname',
    //   editable: true,
    //   sorter: (a, b) => a.materialname.localeCompare(b.materialname),
    //   showSorterTooltip: { target: 'sorter-icon' }
    // },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      editable: true,
      sorter: (a, b) => a.location.localeCompare(b.location),
      showSorterTooltip: { target: 'sorter-icon' }
    },
    {
      title: 'Mobile',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber',
      editable: true,
      width: 136
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      editable: true,
      width: 83
    },
    {
      title: "Material",
      dataIndex: 'material',
      key: 'material',
      width: 80,
      render: (_, record) => {
        return (
          <>
            <Button onClick={() => handlePopoverClick(record.id)} className="h-[1.7rem]">
            <MdProductionQuantityLimits/>
            </Button>
            <Popover
              content={<div>
              {
                record.item.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : record.item.map((data,i)=>{
                return <span>{i+1}.{data.materialname} {'-'} {data.unit}<br/> </span>
              })
             }
                <IoCloseCircle color='red' size={20} className='absolute right-2 top-2 cursor-pointer' onClick={() => setOpenPopoverRow(null)}/>
              </div>}
              title="Material"
              trigger="click"
              open={openPopoverRow === record.id} // Open only for the clicked row
              onOpenChange={(visible) => handlePopoverOpenChange(visible, record.id)}
            >
            </Popover>
          </>
        );
      }
    },
    
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 230,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <span className="flex gap-x-1 justify-center items-center">
            <Typography.Link
              onClick={() => save(record)}
              style={{
                marginRight: 8
              }}
            >
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-3 justify-center items-center">
            <Button
              className="py-0 text-[0.7rem] h-[1.7rem]"
              onClick={() => showPayModal(record)}
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
            >
              Pay
              <MdOutlinePayments />
            </Button>
            <Button
              className="py-0 text-[0.7rem] h-[1.7rem]"
              onClick={() => showPayDetailsModal(record)}
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
            >
              <SolutionOutlined />
            </Button>
            <Typography.Link
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              onClick={() => {
                // edit(record)
                editSupplier(record);
              }}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>
            <Popconfirm
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => deleteProduct(record)}
            >
              <AiOutlineDelete
                className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        )
      }
    }
  ];

  const [editSupplierModal,setEditSupplierModal] = useState(false);
  const [editBtnData,setEditBtnData] = useState({});
  const editSupplier = async (record) => {
    setEditBtnData(record);
    setEditSupplierModal(true)
    // Set the form fields with the correct values from the record
    await form.setFieldsValue({
      suppliername: record.suppliername,
      gender: record.gender,
      location: record.location,
      mobilenumber: record.mobilenumber,
      material: record.item
      // Ensure materialdetails is an array of objects with the expected structure
    });
  
    // Open the modal after setting the form values
    await setIsModalOpen(true);
  };
  
  const updateSupllierMt = async()=>{

    let {id,...olddata} = editBtnData;
    let supplerId = id
    let {material,...newdata} = form.getFieldValue();

    let compareArrObj = await areArraysEqual(material,olddata.item)
    let missingIds = await getMissingIds(olddata.item,material)
    
    if(olddata.gender === newdata.gender && olddata.location === newdata.location && olddata.mobilenumber === newdata.mobilenumber && olddata.suppliername === newdata.suppliername && material.length === olddata.item.length && compareArrObj){
      message.open({content:'No changes found', type:'info'})
    }
    else{
      let newMaterialItems = material.filter(item => !item.hasOwnProperty('id'));
      let updatedMaterialItems = material.filter(item => item.hasOwnProperty('id'));
      setSupplierModalLoading(true);
      // update supplier
      await updateSupplier(supplerId,{...newdata,updateddate:TimestampJs()});
      
      // update items
      if(updatedMaterialItems.length === material.length && compareArrObj === false){
        for(const items of updatedMaterialItems){
          const {id,createddate,isdeleted,...newupdateddata} = items;
          const itemId = id;
          await updateMaterialItsms(supplerId,itemId,{...newupdateddata,updateddate:TimestampJs()})
          
          const materialExists = datas.storage.find(
            (storageItem) => storageItem.materialname === items.materialname && storageItem.category === 'Material List' && storageItem.unit === items.unit
          )
          if (!materialExists) {
            await createStorage({
              materialname: items.materialname,
              unit: items.unit,
              alertcount: 0,
              quantity: 0,
              category: 'Material List',
              createddate: TimestampJs()
            })
            await storageUpdateMt()
          }
        }
      };

      // add new items 
      if(newMaterialItems.length > 0){
        for(const items of newMaterialItems){
          const {id,createddate,isdeleted,...newupdateddata} = items;
          await addNewMaterialItem(supplerId,{...newupdateddata,updateddate:TimestampJs(),isdeleted:false})
        
          const materialExists = datas.storage.find(
            (storageItem) => storageItem.materialname === newupdateddata.materialname && storageItem.category === 'Material List' && storageItem.unit === newupdateddata.unit
          )
          if (!materialExists) {
            await createStorage({
              materialname: newupdateddata.materialname,
              unit: newupdateddata.unit,
              alertcount: 0,
              quantity: 0,
              category: 'Material List',
              createddate: TimestampJs()
            })
            await storageUpdateMt()
          }
        
        }
      };
      
      // delete the items
      if(missingIds.length > 0){
        missingIds.map(async id=>{
          await updateMaterialItsms(supplerId,id,{isdeleted:true,updateddate:TimestampJs()})
        })
      }

      await supplierUpdateMt()
      setIsCloseWarning(false)
      setIsModalOpen(false)
      form.resetFields()
      setSupplierOnchangeValue('')
      setIsPayModelOpen(false)
      setIsCloseWarning(false)
      setAmountOnchangeValue('')
      await setSupplierModalLoading(false)
      await message.open({content:'Updated successfully', type:'success'})
    }
  }


  const handlePopoverClick = (id) => {
    setOpenPopoverRow(id); // Set the ID of the row whose Popover is open
  };

  const handlePopoverOpenChange = (visible, id) => {
    if (visible) {
      setOpenPopoverRow(id); // Open Popover for this row
    } else {
      setOpenPopoverRow(null); // Close the Popover
    }
  };

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

    const inputNode = inputType === 'number' ? <InputNumber /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <>
            {dataIndex === 'gender' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="gender"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select Gender"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' }
                    ]}
                  />
                </Form.Item>
              </span>
            ) : (
              <Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
                {inputNode}
              </Form.Item>
            )}
          </>
        ) : (
          children
        )}
      </td>
    )
  }

  const isEditing = (record) => editingKeys.includes(record.key)

  const edit = (record) => {
    form.setFieldsValue({ ...record })
    setEditingKeys([record.key])
  }

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'mobilenumber' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record)
      })
    }
  })

  const cancel = () => {
    setEditingKeys([])
  }

  const save = async (key) => {
    try {
      const row = await form.validateFields()
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (
        index != null &&
        row.suppliername === key.suppliername &&
        // row.materialname === key.materialname &&
        row.location === key.location &&
        row.mobilenumber === key.mobilenumber &&
        row.gender === key.gender
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
      } else {
        await updateSupplier(key.id, { ...row, updateddate: TimestampJs() })
        supplierUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  };

  const handleRowClick = (record) => {
    setAddNewMaterial(pre => ({...pre,popover:true}))
    console.log( record.id);
  };

  // useEffect(()=>{
  //   const fatchData =()=>{
  //     let {materials,status} =  getMaterialDetailsById(record.id);
  //   }
  // },[])
  const [editExpandTablekey,setEditExpandTableKey] = useState([]);
  const expandableTable = [
    {
      title:'S.No',
      key:'sno',
      render:(text,record,i)=> <span>{i+1}</span>,
      width:50,
      editable:false,
    },
    {
      title:'Material',
      dataIndex:'materialname',
      key:'materialname',
      render:(text)=> <span>{text}</span>,
      editable:true,
    },
    {
      title:'Unit',
      key:'unit',
      dataIndex:'unit',
      render:(text)=> <span>{text}</span>,
      width:100,
      editable:true,
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const editable = isEditingExpandTable(record)
        return editable ? (
          <span className="flex gap-x-1 justify-center items-center">
            <Typography.Link
              onClick={() => ExpandTableSave(record)}
              style={{
                marginRight: 8
              }}
            >
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={()=> {setEditExpandTableKey([]); setEditingKeys([])}}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-3 justify-center items-center">
            <Typography.Link
              disabled={editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0}
              onClick={() => editExpandTable(record)}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>
            <Popconfirm
              disabled={editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0}
              className={`${editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => deleteExpantableTableMaterial(record)}
            >
              <AiOutlineDelete
                className={`${editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        )
      }
    }
  ];

const deleteExpantableTableMaterial =async (record)=>{
  setSupplierTbLoading(true)
await updateMaterialItsms(expandTableSupplierId,record.id,{  isdeleted:true,updateddate: TimestampJs()});
setSupplierTbLoading(false)
}

  const expandableEditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {

     const inputNode = inputType === 'number' ? <InputNumber /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <>
            {dataIndex === 'unit' ? (
                <Form.Item
                  name="unit"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Units"
                    options={[
                              { label: 'GM', value: 'gm' },
                              { label: 'KG', value: 'kg' },
                              { label: 'LT', value: 'lt' },
                              { label: 'ML', value: 'ml' },
                              { label: 'Box', value: 'box' },
                              { label: 'Piece', value: 'piece' }
                            ]}
                  />
                </Form.Item>
            
            ) : (
              <Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
               {inputNode}
              </Form.Item>
            )}
          </>
        ) : (
          children
        )}
      </td>
    )
  };

  const isEditingExpandTable = (record) => editExpandTablekey.includes(record.id);

  const editExpandTable = (record) => {
    setEditingKeys([record.id])
    expantableform.setFieldsValue({ ...record })
    setEditExpandTableKey([record.id])
  };

  const mergedColumnsExpandTable = expandableTable.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'mobilenumber' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditingExpandTable(record)
      })
    }
  });

  const [expandTableSupplierId,setExpandTableSupplierId] = useState('');
  const [addNewMaterial,setAddNewMaterial] = useState({
    modal: false,
    spin:false,
    closewarning:false,
    popover:false
  });
  const expandableProps = {
    expandedRowRender: (record) => {
      setExpandTableSupplierId(record.id);
      return <div className='w-[71%] mx-auto relative'>
      <span className='flex justify-end items-center mb-1'><Button className='mb-1' type='primary' onClick={()=>setAddNewMaterial(pre=>({...pre,modal:true}))}>Add</Button></span>
      <Form form={expantableform} component={false} > 
      <Table 
      virtual 
      components={{
        body:{
          cell:expandableEditableCell
          }
          }} 
      pagination={false}
      columns={mergedColumnsExpandTable} 
      dataSource={record.item.filter(data=> data.isdeleted === false)}
      rowClassName="editable-row"
      scroll={{ x: 200,y:200}}
      /></Form>
      </div> 
    }
  }

  const ExpandTableSave = async (key) => {
    try {
      const row = await expantableform.validateFields()
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (
        index != null &&
        row.materialname === key.materialname &&
        row.unit === key.unit 
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
        setEditExpandTableKey([])
      } else {
        setSupplierTbLoading(true)
        // console.log(expandTableSupplierId);
        // console.log(key.id, { ...row, updateddate: TimestampJs() });
        await updateMaterialItsms(expandTableSupplierId,key.id,{ ...row, updateddate: TimestampJs() })
        // await updateSupplier(key.id, { ...row, updateddate: TimestampJs() })
        supplierUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
        setEditExpandTableKey([]);
        setSupplierTbLoading(false)
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  };

  // selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys)
  };

  const rowSelection = {
    selectedRowKeys,
    columnWidth: 50,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: 'odd',
        text: 'Select Odd Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = []
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false
            }
            return true
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      },
      {
        key: 'even',
        text: 'Select Even Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = []
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 === 0) {
              return false
            }
            return true
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      }
    ]
  }

  // Table Height Auto Adjustment (***Do not touch this code***)
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 100 // Adjust this value based on your layout needs
      setTableHeight(newHeight)
    }
    // Set initial height
    updateTableHeight()
    // Update height on resize and fullscreen change
    window.addEventListener('resize', updateTableHeight)
    document.addEventListener('fullscreenchange', updateTableHeight)
    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('resize', updateTableHeight)
      document.removeEventListener('fullscreenchange', updateTableHeight)
    }
  }, [])

  // delete
  const deleteProduct = async (data) => {
    // await deleteproduct(data.id);
    const { id, ...newData } = data
    await updateSupplier(id, {
      isdeleted: true,
      // deletedby: 'admin',
      deleteddate: TimestampJs()
    })
    //supplierUpdateMt();
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    jsonToExcel(exportDatas, `Supplier-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKeys('')
  }

  const [historyHeight, setHistoryHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 300 // Adjust this value based on your layout needs
      setHistoryHeight(newHeight)
    }
    // Set initial height
    updateTableHeight()
    // Update height on resize and fullscreen change
    window.addEventListener('resize', updateTableHeight)
    document.addEventListener('fullscreenchange', updateTableHeight)
    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('resize', updateTableHeight)
      document.removeEventListener('fullscreenchange', updateTableHeight)
    }
  }, [])

  // warning close btns methods
  const [supplierOnchangeValue, setSupplierOnchangeValue] = useState('')
  const productOnchange = debounce((value) => {
    setSupplierOnchangeValue(value)
  }, 200)

  const [amountOnchangeValue, setAmountOnchangeValue] = useState('')
  const amountOnchange = debounce((value) => {
    setAmountOnchangeValue(value)
  }, 200)

  const [isCloseWarning, setIsCloseWarning] = useState(false)

  const warningModalOk = (value) => {
     if(value === 'newsupplier'){
      setIsCloseWarning(false)
      setIsModalOpen(false)
      form.resetFields()
      setSupplierOnchangeValue('')
  
      setIsPayModelOpen(false)
      setIsCloseWarning(false)
      setAmountOnchangeValue('')
     }else{
      console.log('material');
      
     }
    
  }

  useEffect(() => {
    if (isModalOpen) {
      // Ensure there's at least one material field when the modal opens
      const currentMaterials = form.getFieldValue('material') || []
      if (currentMaterials.length === 0) {
        form.setFieldsValue({
          material: [{ materialname: '', unit: '' }]
        })
      }
    }

    if(addNewMaterial.modal){
      const currentMaterials = materialForm.getFieldValue('material') || []
      if (currentMaterials.length === 0) {
        materialForm.setFieldsValue({
          material: [{ materialname: '', unit: '' }]
        })
      }
    }
  }, [isModalOpen, form, addNewMaterial.modal, materialForm]);

  const addNewMaterialMt =()=>{
    if(materialForm.getFieldValue().material.length === 0){
      message.open({type:'info',content:'Add one material'})
    }
  };

  return (
    <div className='relative'>
    {/* <div className='absolute right-[20rem] '>
    <Popover
      
      content={<a >Close</a>}
      title="Title"
      trigger="click"
      open={addNewMaterial.popover}
      // onCancel={()=> setAddNewMaterial(pre=>({...pre,popover:false}))}
      onOpenChange={()=> setAddNewMaterial(pre=>({...pre,popover:false}))}
    >
      
    </Popover>
    </div> */}
    
      <Modal
        zIndex={1001}
        centered={true}
        width={300}
        title={
          <span className="flex gap-x-1 justify-center items-center">
            <PiWarningCircleFill className="text-yellow-500 text-xl" /> Warning
          </span>
        }
        open={isCloseWarning}
        onOk={()=>warningModalOk('newsupplier')}
        onCancel={() => setIsCloseWarning(false)}
        okText="ok"
        cancelText="Cancel"
        className="center-buttons-modal"
      >
        <p className="text-center">Are your sure to Cancel</p>
      </Modal>
      <ul>
        <li className="flex gap-x-3 justify-between items-center">
          <Search
            allowClear
            className="w-[30%]"
            placeholder="Search"
            onSearch={onSearchEnter}
            onChange={onSearchChange}
            enterButton
          />
          <span className="flex gap-x-3 justify-center items-center">
            <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length === 0}
              onClick={exportExcel}
            >
              Export <PiExport />
            </Button>
            <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              type="primary"
              onClick={() => {
                setEditSupplierModal(false)
                setIsModalOpen(true)
                form.resetFields()
                form.setFieldsValue({ gender: 'Male' })
              }}
            >
              New Supplier <IoMdAdd />
            </Button>
          </span>
        </li>

        <li className="mt-2 ">
       
          <Form form={form} component={false} >
            <Table
              // className="expandtables"
              virtual
              components={{
                body: {
                  cell: EditableCell
                }
              }}
              dataSource={data}
              columns={mergedColumns}
              pagination={false}
              loading={supplierTbLoading}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
              // onRow={(record) => ({
              //   onClick: () => handleRowClick(record), // Capture row click event
              //     })}
              // expandable={expandableProps}
            />
          </Form>
        

        {/* <div>
        <Form form={expantableform} component={false} > 
      <Table 
      virtual 
      components={{
        body:{
          cell:expandableEditableCell
          }
          }} 
      pagination={false}
      columns={mergedColumnsExpandTable} 
      // dataSource={record.item.filter(data=> data.isdeleted === false)}
      rowClassName="editable-row"
      scroll={{ x: 300,y:200}}
      /></Form>
        </div> */}
        </li>
      </ul>

      <Modal
        centered={true}
        maskClosable={
          form.getFieldValue('suppliername') === undefined ||
          form.getFieldValue('suppliername') === null ||
          form.getFieldValue('suppliername') === ''
            ? true
            : false
        }
        title={<span className="flex justify-center">{editSupplierModal ? 'UPDATE SUPPLIER' : 'NEW SUPPLIER'}</span>}
        open={isModalOpen}
        okText={editSupplierModal ? 'Update': 'Add'}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: supplierModalLoading }}
        onCancel={() => {
          if (
            form.getFieldValue('suppliername') === undefined ||
            form.getFieldValue('suppliername') === null ||
            form.getFieldValue('suppliername') === ''
          ) {
            setIsModalOpen(false)
            form.resetFields()
          } else {
            setIsCloseWarning(true) // Assuming you have this state handler for close warning
          }
        }}
      >
        <Spin spinning={supplierModalLoading}>
          <Form
            initialValues={{ gender: 'Male' }}
            onFinish={editSupplierModal ? updateSupllierMt : createNewSupplier}
            form={form}
            layout="vertical"
          >
            <Form.Item
              className="mb-2"
              name="suppliername"
              label="Supplier Name"
              rules={[{ required: true, message: false }]}
            >
              <Input className="w-full" placeholder="Enter the Supplier Name" />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="location"
              label="Location"
              rules={[{ required: true, message: false }]}
            >
              <Input placeholder="Enter the Location" />
            </Form.Item>

            <Form.Item label="Material" className="mb-0">
              <Form.List name="material">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex items-center gap-x-2 relative">
                        {/* Input field for Material Name */}
                        <Form.Item
                          className="w-[70%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'materialname']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Input placeholder="Material Name" />
                        </Form.Item>

                        {/* Select for Units */}
                        <Form.Item
                          className="w-[23%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'unit']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Select
                            placeholder="Units"
                            options={[
                              { label: 'GM', value: 'gm' },
                              { label: 'KG', value: 'kg' },
                              { label: 'LT', value: 'lt' },
                              { label: 'ML', value: 'ml' },
                              { label: 'Box', value: 'box' },
                              { label: 'Piece', value: 'piece' }
                            ]}
                          />
                        </Form.Item>

                        <MinusCircleOutlined
                          className="absolute top-[40%] right-1 -translate-y-1/2"
                          onClick={() => remove(name)}
                        />
                      </div>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Material
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item
              className="mb-2 w-full"
              name="mobilenumber"
              label="Mobile Number"
              rules={[
                { required: true, message: false },
                { type: 'number', message: false }
              ]}
            >
              <InputNumber
                type="number"
                className="w-full"
                min={0}
                placeholder="Enter the Mobile Number"
              />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="gender"
              label="Gender"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group>
                <Radio value={'Male'}>Male</Radio>
                <Radio value={'Female'}>Female</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        centered={true}
        maskClosable={
          amountOnchangeValue === '' ||
          amountOnchangeValue === null ||
          amountOnchangeValue === undefined
            ? true
            : false
        }
        title={
          <div className="flex  justify-center py-3">
            <h1>PAY</h1>
          </div>
        }
        open={isPayModelOpen}
        onCancel={() => {
          if (
            amountOnchangeValue === '' ||
            amountOnchangeValue === null ||
            amountOnchangeValue === undefined
          ) {
            setIsPayModelOpen(false)
            setSupplierOnchangeValue('')
          } else {
            setIsCloseWarning(true)
          }
        }}
        okButtonProps={{ disabled: payModalLoading }}
        onOk={() => payForm.submit()}
      >
        <Spin className="relative" spinning={payModalLoading}>
          <Form
            onFinish={supplierPay}
            form={payForm}
            initialValues={{ date: dayjs() }}
            layout="vertical"
          >
            <Form.Item
              className=" absolute top-[-3rem]"
              name="date"
              label=""
              rules={[{ required: true, message: false }]}
            >
              <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
            </Form.Item>
            <Form.Item
              rules={[{ required: true, message: false }]}
              className="mb-1"
              name="amount"
              label="Amount"
            >
              <InputNumber
                onChange={(e) => amountOnchange(e)}
                min={0}
                className="w-full"
                type="number"
                placeholder="Enter the Amount"
              />
            </Form.Item>
            <Form.Item className="mb-1" name="description" label="Description">
              <TextArea rows={4} placeholder="Write the Description" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={<span className="text-center w-full block pb-5">PAY DETAILS</span>}
        open={isPayDetailsModelOpen}
        footer={null}
        width={1000}
        onCancel={() => {
          setIsPayDetailsModelOpen(false)
        }}
      >
        <Table
          virtual
          pagination={false}
          columns={payDetailsColumns}
          dataSource={payDetailsData}
          rowKey="id"
          scroll={{ y: historyHeight }}
        />
      </Modal>

      <Modal title={<span className='block text-center'>New Material</span>} onOk={()=>materialForm.submit()} okText='Add' centered open={addNewMaterial.modal} 
      onCancel={()=>{ 
        materialForm.resetFields(); 
        setAddNewMaterial(pre=>({...pre,modal:false}))
        }}>
        <Spin spinning={addNewMaterial.spin}>
          <Form form={materialForm} layout="vertical" onFinish={addNewMaterialMt}>  
            <Form.Item label="Material" className="mb-0">
              <Form.List name="material">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex items-center gap-x-2 relative">
                        {/* Input field for Material Name */}
                        <Form.Item
                          className="w-[70%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'materialname']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Input onChange={()=> setAddNewMaterial(pre=>({}))} placeholder="Material Name" />
                        </Form.Item>

                        {/* Select for Units */}
                        <Form.Item
                          className="w-[23%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'unit']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Select
                            placeholder="Units"
                            options={[
                              { label: 'GM', value: 'gm' },
                              { label: 'KG', value: 'kg' },
                              { label: 'LT', value: 'lt' },
                              { label: 'ML', value: 'ml' },
                              { label: 'Box', value: 'box' },
                              { label: 'Piece', value: 'piece' }
                            ]}
                          />
                        </Form.Item>

                        <MinusCircleOutlined
                          className="absolute top-[40%] right-1 -translate-y-1/2"
                          onClick={() => remove(name)}
                        />
                      </div>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Material
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>



    </div>
  )
}
