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
  DatePicker,
  Radio,
  Tag
} from 'antd'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd, IoMdRemove } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { createproduct, deleteproduct, getproduct, updateproduct } from '../firebase/data-tables/products'
import { TimestampJs } from '../js-files/time-stamp'
const { Search } = Input
const { RangePicker } = DatePicker
import dayjs from 'dayjs'
import { createProduction, updateProduction } from '../firebase/data-tables/production'
import jsonToExcel from '../js-files/json-to-excel'
import { createUsedmaterial } from '../firebase/data-tables/usedmaterial'
import { createDelivery, fetchItemsForDelivery } from '../firebase/data-tables/delivery'
import {formatToRupee} from '../js-files/formate-to-rupee'
import { addDoc, collection, Firestore } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { FaClipboardList } from "react-icons/fa";
import Item from 'antd/es/list/Item'
import { TbFileDownload } from "react-icons/tb";

export default function Delivery({ datas, deliveryUpdateMt, usedmaterialUpdateMt }) {
  //states
  const [form] = Form.useForm()
  const [form2] = Form.useForm()
  const [form4] = Form.useForm()
  const [dateRange, setDateRange] = useState([null, null]);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState('')
  const [data, setData] = useState([])

  // side effect
  useEffect(() => {
    setData(
      datas.delivery
        .filter((data) => !data.isdeleted && isWithinRange(data.date))
        .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    )
  }, [datas, dateRange]);

  const isWithinRange = (date) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return true;
    }
    const dayjsDate = dayjs(date, 'DD/MM/YYYY');
    return (
      dayjsDate.isSame(dateRange[0], 'day') ||
      dayjsDate.isSame(dateRange[1], 'day') ||
      dayjsDate.isAfter(dayjs(dateRange[0])) && dayjsDate.isBefore(dayjs(dateRange[1]))
    );
  };

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

  const createNewOrder = async (values) => {
    await createproduct({
      ...values,
      createddate: TimestampJs(),
      updateddate: '',
      isdeleted: false
    })
    form.resetFields()
    deliveryUpdateMt()
    setIsModalOpen(false)
  }



  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.date).toLowerCase().includes(value.toLowerCase()) ||
          String(record.customername).toLowerCase().includes(value.toLowerCase()) ||
          String(record.productname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
          String(record.flavour).toLowerCase().includes(value.toLowerCase()) ||
          String(record.paymentstatus).toLowerCase().includes(value.toLowerCase()) ||
          String(record.price).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      editable: false,
      //render: text => dayjs(text).format('DD/MM/YY'),
      //width: 150
    },
    {
      title: 'Customer',
      dataIndex: 'customername',
      key: 'customername',
      editable: false
    },
    // {
    //   title: 'Product',
    //   dataIndex: 'productname',
    //   key: 'productname',
    //   editable: false
    // },
    // {
    //   title: 'Flavor',
    //   dataIndex: 'flavour',
    //   key: 'flavour',
    //   editable: false
    // },
    // {
    //   title: 'Quantity',
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   editable: false
    // },
    // {
    //   title: 'Peice Price',
    //   dataIndex: 'productprice',
    //   key: 'productprice',
    // },
    // {
    //   title: 'Packs',
    //   dataIndex: 'numberofpacks',
    //   key: 'numberofpacks',
    //   // editable: true
    // },
    {
      title: 'Price ₹',
      dataIndex: 'billamount',
      key: 'billamount',
      // editable: true,
      render: text =>  <span>{formatToRupee(text,true)}</span>
    },
    
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      editable: true,
      sorter: (a, b) => a.type.localeCompare(b.type),
      showSorterTooltip: { target: 'sorter-icon' },
      render: text => text === 'return' ? <Tag color='red'>Return</Tag> : <Tag color='green'>Order</Tag>
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      editable: true,
      sorter: (a, b) => a.paymentstatus.localeCompare(b.paymentstatus),
      showSorterTooltip: { target: 'sorter-icon' },
      render: text => text === 'Paid' ? <Tag color='green'>Paid</Tag> : text === 'Partial' ?   <Tag color='yellow'>Partial</Tag> : <Tag color='red'>Unpaid</Tag>
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
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
          
           <FaClipboardList onClick={()=> editingKey !== '' ? console.log('Not Clickable') : onOpenDeliveryBill(record)} size={17} className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer text-green-500'}`} />
            {/* <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link> */}
            <TbFileDownload size={19} className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 cursor-pointer hover:text-blue-400'}`}/>
            <Popconfirm
              className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => deleteProduct(record)}
              disabled={editingKey !== ''}
            >
              <AiOutlineDelete
                className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
           
          </span>
        )
      }
    }
  ]

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
            {
            dataIndex === 'paymentstatus' 
            ? <Form.Item
                  name="paymentstatus"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select Payment Status"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'Unpaid', label: 'Unpaid' },
                      { value: 'Paid', label: 'Paid' },
                    ]}
                  />
                </Form.Item> 
            : <Form.Item
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
            }
          </>
        ) : (
          children
        )}
      </td>
    )
  }
  const isEditing = (record) => record.key === editingKey
  const edit = (record) => {
    form.setFieldsValue({ ...record })
    setEditingKey(record.key)
  }
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
        onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'numberofpacks' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record)
      })
    }
  })
  const cancel = () => {
    setEditingKey('')
  }

  //update method
  const save = async (key) => {
    try {
      const row = await form.validateFields()
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (index != null && row.numberofpacks === key.numberofpacks) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKey('')
      } else {
        await updateProduction(key.id, {
          numberofpacks: row.numberofpacks,
          updateddate: TimestampJs()
        })
        await deliveryUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKey('')
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  }

  // selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const onSelectChange = (newSelectedRowKeys) => {
    newSelectedRowKeys.length === 0 ? setEditingKey('') : setEditingKey('hi')
    if (newSelectedRowKeys.length > 0) {
      const selectTableData = data.filter((item) => newSelectedRowKeys.includes(item.key))
    }
    setSelectedRowKeys(newSelectedRowKeys)
  }
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
            if (index % 2 !== 0) {
              return true
            }
            return false
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      }
    ]
  }

  // Table Hight Auto Adjustment (***Do not tounch this code*** ) //
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
    //await deleteproduct(data.id);
    console.log(data)
    const { id, ...newData } = data
    await updateProduction(id, { isdeleted: true, deleteddate: TimestampJs() })
    deliveryUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  const columns2 = [
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
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      width: 80,
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: true,
      width: 80,
      render:(text) => <span className='text-[0.7rem]'>{text}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Piece Price</span>,
      dataIndex: 'productprice',
      key: 'productprice',
      width: 100,
      render:(text) => <span className='text-[0.7rem]'>{text }</span>
    },
    {
      title: <span className='text-[0.7rem]'>Price</span>,
      dataIndex: 'price',
      key: 'price',
      width: 80,
      editable: false,
      render:(text) => <span className='text-[0.7rem]'>{formatToRupee(text,true)}</span>
    },
    {
      title: <span className='text-[0.7rem]'>Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      width: 50,
      render: (_, record) => {
        return (
          <Popconfirm
            className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
            title="Sure to delete?"
            onConfirm={() => removeTemProduct(record)}
            disabled={editingKey !== ''}
          >
            <AiOutlineDelete
              className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
              size={19}
            />
          </Popconfirm>
        )
      }
    }
  ]

  const [option, setOption] = useState({
    customer: [],
    customerstatus: true,
    flavour: [],
    flavourstatus: true,
    product: [],
    productvalue: '',
    quantity: [],
    quantitystatus: true,
    tempproduct: []
  })

  //product initial value
  useEffect(() => {
    const productOp = datas.product
      .filter(
        (item, i, s) =>
          item.isdeleted === false &&
          s.findIndex((item2) => item2.productname === item.productname) === i
      )
      .map((data) => ({ lable: data.productname, value: data.productname }))
    setOption((pre) => ({ ...pre, product: productOp }))
    const optionscustomers = datas.customers
      .filter((item) => item.isdeleted === false)
      .map((item) => ({ label: item.customername, value: item.customername }))
    setOption((pre) => ({ ...pre, customer: optionscustomers }))
  }, []);

   // deliver date onchange
  const sendDeliveryDateOnchange =(value, i)=>{
    form2.resetFields(['customername'])
    form2.resetFields(['productname'])
    form2.resetFields(['flavour'])
    form2.resetFields(['quantity'])
    form2.resetFields(['numberofpacks'])
    setOption((pre) => ({ ...pre, customerstatus: false,tempproduct:[]}));
    setTotalAmount(0)
    setMarginValue({amount:0,discount:0,percentage:0})
    form5.resetFields(['marginvalue'])
  };
  // customer onchange value
  const customerOnchange = async (value, i) => {
    form2.resetFields(['productname'])
    form2.resetFields(['flavour'])
    form2.resetFields(['quantity'])
    form2.resetFields(['numberofpacks'])
    setOption((pre) => ({ ...pre, customerstatus: false,tempproduct:[]}));
    setTotalAmount(0)
    form5.resetFields(['marginvalue'])
    setMarginValue({amount:0,discount:0,percentage:0})
  }

  //product onchange value
  const productOnchange = async (value, i) => {
    form2.resetFields(['flavour'])
    form2.resetFields(['quantity'])
    form2.resetFields(['numberofpacks'])
    form5.resetFields(['marginvalue'])
    setMarginValue({amount:0,discount:0,percentage:0})
    const flavourOp = await Array.from( new Set(datas.product
          .filter((item) => item.isdeleted === false && item.productname === value)
          .map((data) => data.flavour)))
          .map((flavour) => ({ label: flavour, value: flavour }))
    
    await setOption((pre) => ({
      ...pre,
      flavourstatus: false,
      flavour: flavourOp,
      productvalue: value,
      quantitystatus: true
    }))
  }

  //flavour onchange value
  const flavourOnchange = async (value, i) => {
    form2.resetFields(['quantity'])
    form2.resetFields(['numberofpacks'])
    form5.resetFields(['marginvalue'])
    setMarginValue({amount:0,discount:0,percentage:0})
    const quantityOp = await Array.from(
      new Set(
        datas.product.filter(
          (item) =>
            item.isdeleted === false &&
            item.flavour === value &&
            item.productname === option.productvalue
        )
      )
    ).map((q) => ({ label: q.quantity + ' ' + q.unit, value: q.quantity + ' ' + q.unit }))
    await setOption((pre) => ({ ...pre, quantitystatus: false, quantity: quantityOp }))
  }

  // create add tem product
  const [count, setCount] = useState(0);
  const [totalamount, setTotalAmount] = useState(0);
  const createTemDeliveryMt = async (values) => {
    setCount(count + 1)
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : '';
    let [quantityvalue,units] = values.quantity.split(' ');
    const findPrice = await datas.product.find(item => item.isdeleted === false && item.productname === values.productname && item.flavour === values.flavour && item.quantity === Number(quantityvalue) && item.unit === units).price;
    const newProduct = { ...values, key: count, date: formattedDate, createddate: TimestampJs(),price:findPrice * values.numberofpacks,productprice:findPrice };
    const checkExsit = option.tempproduct.some(
      (item) =>
        item.customername === newProduct.customername &&
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.numberofpacks === newProduct.numberofpacks &&
        item.date === newProduct.date
    )
    const checkSamePacks = option.tempproduct.some(
      (item) =>
        item.customername === newProduct.customername &&
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.numberofpacks !== newProduct.numberofpacks &&
        item.date === newProduct.date &&
        item.key !== newProduct.key
    )
    //const dbCheck = datas.delivery.some(item => item.isdeleted === false && item.customername ===newProduct.customername && item.productname === newProduct.productname && item.flavour === newProduct.flavour && item.date === newProduct.date && newProduct.quantity === item.quantity );
    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (checkSamePacks) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    }
    // else if (dbCheck){
    //   message.open({ type: 'warning', content: 'Product is already added' })
    //   return
    // }
    else {
      setTotalAmount( pre => pre + (findPrice * values.numberofpacks));
      setOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newProduct] }));
      deliveryUpdateMt();
      setMarginValue(
        {amount:0,
        discount:0,
        percentage:0,
        paymentstaus:'Unpaid'
      });
      form5.resetFields(['marginvalue']);
      form4.resetFields(['partialamount']);
      form4.setFieldsValue({paymentstatus:'Unpaid'})
      //form2.resetFields();
    }
  }

  // remove temp product
  const removeTemProduct = (key) => {
    const newTempProduct = option.tempproduct.filter((item) => item.key !== key.key);
    newTempProduct.length <= 0 ? setTotalAmount(0) : setTotalAmount(pre => pre - key.price)
    setOption((pre) => ({ ...pre, tempproduct: newTempProduct }));
    setMarginValue({amount:0,discount:0,percentage:0});
    form4.setFieldsValue({paymentstatus:'Unpaid'})
  }

  // add new delivery
  const addNewDelivery = async () => {
    // Filter product datas
    let findPr = datas.product.filter(pr =>
      option.tempproduct.find(temp =>
        temp.productname === pr.productname &&
        temp.flavour === pr.flavour &&
        pr.quantity == temp.quantity.split(' ')[0] &&
        pr.unit === temp.quantity.split(' ')[1]
      )
    );

    // List
    let productItems = findPr.map(pr => {
      let matchingTempProduct = option.tempproduct.find(temp =>
        temp.productname === pr.productname &&
        temp.flavour === pr.flavour &&
        pr.quantity == temp.quantity.split(' ')[0] &&
        pr.unit === temp.quantity.split(' ')[1]
      );
      return {
        id: pr.id,
        numberofpacks: matchingTempProduct.numberofpacks
      };
    });
    // Partial amount (value)
    let { partialamount } = form4.getFieldsValue();
    // Create delivery new
    const newDelivery = {
      customername: option.tempproduct[0].customername,
      date: option.tempproduct[0].date,
      total: totalamount,
      billamount: marginValue.amount,
      paymentstatus: marginValue.paymentstaus,
      margin: marginValue.percentage,
      partialamount: partialamount,
      isdeleted: false,
      type: returnDelivery.state === true ? 'return' : 'order',
      createddate: TimestampJs(),
    };
    try {
      //Create new delivery document
      const deliveryCollectionRef = collection(db, 'delivery');
      const deliveryDocRef = await addDoc(deliveryCollectionRef, newDelivery);
      const itemsCollectionRef = collection(deliveryDocRef, 'items');
      for (const item of productItems) {
        await addDoc(itemsCollectionRef, item);

        const existingProduct = datas.storage.find(
          (storageItem) =>
            storageItem.productname === item.productname && storageItem.category === 'Product List'
        )
        console.log(existingProduct, returnDelivery.state)
        if(existingProduct){
        if (returnDelivery.state === true) {
          await updateStorage(existingProduct.id, {
            numberofpacks: existingProduct.numberofpacks + item.numberofpacks
          })
        }else{
          await updateStorage(existingProduct.id, {
            numberofpacks: existingProduct.numberofpacks - item.numberofpacks
          })
        }
        storageUpdateMt();
      }
      }
      message.open({ type: 'success', content: returnDelivery.state === true ? "Production return successfully" : "Production added successfully"} );
      await deliveryUpdateMt();
      await modelCancel();
    } catch (error) {
      // Handle errors
      console.error('Error adding delivery: ', error);
      message.open({ type: 'error', content: 'Error adding production' });
    }
  };

  // model close
  const modelCancel = () => {
    setIsModalOpen(false)
    form2.resetFields()
    form5.resetFields(['marginvalue'])
    setOption((pre) => ({
      ...pre,
      tempproduct: [],
      flavour: [],
      flavourstatus: true,
      quantity: [],
      quantitystatus: true,
      customerstatus: true
    }))
    setCount(0)
    setTotalAmount(0)
    setMarginValue({amount:0,discount:0,percentage:0});
    form4.setFieldsValue({paymentstatus:'Unpaid'})
  };

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    jsonToExcel(exportDatas, `Production-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKey('')
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
      editable: false
    },
    {
      title: 'Material',
      dataIndex: 'material',
      key: 'material',
      editable: true
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        return (
          <Popconfirm
            className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
            title="Sure to delete?"
            onConfirm={() => removeTemMaterial(record)}
            disabled={editingKey !== ''}
          >
            <AiOutlineDelete
              className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
              size={19}
            />
          </Popconfirm>
        )
      }
    }
  ];

  const [form3] = Form.useForm()
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [mtOption, setMtOption] = useState({
    material: [],
    tempproduct: [],
    count: 0
  })
  useEffect(() => {
    const optionsuppliers = datas.suppliers
      .filter(
        (item, i, self) =>
          item.isdeleted === false &&
          i === self.findIndex((d) => d.materialname === item.materialname)
      )
      .map((item) => ({ label: item.materialname, value: item.materialname }))
    setMtOption((pre) => ({ ...pre, material: optionsuppliers }))
  }, [])

  // create material
  const createTemMaterial = async (values) => {
    setMtOption((pre) => ({ ...pre, count: pre.count + 1 }))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    const newMaterial = {
      ...values,
      date: formattedDate,
      key: mtOption.count,
      createddate: TimestampJs(),
      isdeleted: false,
      quantity: values.quantity + ' ' + values.unit
    };

    const checkExsit = mtOption.tempproduct.find((item) => item.material === newMaterial.material && item.date === newMaterial.date);

    const dbcheckExsit = datas.usedmaterials.find((item) => item.material === newMaterial.material && item.date === newMaterial.date);

    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (dbcheckExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else {
      setMtOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newMaterial] }));
      // form5.resetFields();
      // form4.resetFields(['partialamount']);
      // setMarginValue({amount:0,discount:0,percentage:0, paymentstaus:''})
    }
  }

  // remove tem material
  const removeTemMaterial = (key) => {
    const newTempProduct = mtOption.tempproduct.filter((item) => item.key !== key.key)
    setMtOption((pre) => ({ ...pre, tempproduct: newTempProduct }))
  }

  // add new material to data base
  const addNewTemMaterial = async () => {
    mtOption.tempproduct.map(async (item, i) => {
      let { key, quantity, ...newMaterial } = item
      let quntity = Number(quantity.split(' ')[0])
      await createUsedmaterial({ ...newMaterial, quantity: quntity })
    })
    usedmaterialUpdateMt();
    materialModelCancel();
  }

  // model cancel
  const materialModelCancel = () => {
    setIsMaterialModalOpen(false)
    form3.resetFields()
    setMtOption((pre) => ({ ...pre, tempproduct: [], count: 0 }))
  }

  const [form5] = Form.useForm();
  const [marginValue,setMarginValue] = useState(
                            {amount:0,
                            discount:0,
                            percentage:0,
                            paymentstaus:'',
                            particalAmount:0,
                          });
  const onPriceChange = (value) => {
   let marginamount = totalamount * (value.marginvalue / 100);
    let finalamounts = totalamount - marginamount
    setMarginValue(pre =>({...pre,amount:finalamounts,percentage:value.marginvalue,discount:marginamount}));
    //form5.resetFields(['marginvalue'])
  }

  const radioOnchange =(e)=>{
    setMarginValue(pre => ({...pre,paymentstaus:e.target.value}));
    form4.resetFields(['partialamount']);
  }

  // Ref for get items collections


  
  const deliveryColumns=[
    {
    title: 'S.No',
    key: 'sno',
    dataIndex: 'sno',
    width: 20,
    },
    {
      title: 'Product Name',
      key: 'productname',
      dataIndex: 'productname',
      width: 70,
      },
      {
        title: 'Flavour',
        key: 'flavour',
        dataIndex: 'flavour',
        width: 70,
      },
      {
        title: 'Quantity',
        key: 'quantity',
        dataIndex: 'quantity',
        width: 70,
      },
      {
        title: 'Peice Amount',
        key: 'price',
        dataIndex: 'price',
        width: 70,
        render:text => <span>{formatToRupee(text,true)}</span>
      },
      {
        title: 'Number of Packs',
        key: 'numberofpacks',
        dataIndex: 'numberofpacks',
        width: 70,
      },
      {
        title: 'Amount',
        key: 'producttotalamount',
        dataIndex: 'producttotalamount',
        width: 70,
        render:text => <span>{formatToRupee(text,true)}</span>
      },
  ];

  const [deliveryBill,setDeliveryBill] = useState({
    model:false,
    loading:false,
    state:false,
    data:[],
    prdata: {
      id:'',
      supplierid:'',
      supplier:'',
      date:''
    },
    open:false
  });

  useEffect(() => {
    const getItems = async () => {
      if(deliveryBill.prdata.id !== ''){
      setDeliveryBill(pre => ({...pre,loading:true}));
      const { items, status } = await fetchItemsForDelivery(deliveryBill.prdata.id);
      if (status === 200) {
        let prData = datas.product.filter((item,i) => items.find((item2) => item.id === item2.id))
        let prItems = prData.map((pr,i) =>{
          let matchingData = items.find((item,i) => item.id === pr.id);
          
          return {
            sno:i+1,
            ...pr,
            quantity: pr.quantity + ' ' + pr.unit ,
            numberofpacks: matchingData.numberofpacks,
            producttotalamount: matchingData.numberofpacks * pr.price 
          }
        });
      setDeliveryBill(pre => ({...pre,data:{items:prItems,...deliveryBill.prdata}}));
      }
      setDeliveryBill(pre => ({...pre,loading:false}));
    };
  }
    getItems();
  }, [deliveryBill.open]);

  const onOpenDeliveryBill=(data)=>{
    setDeliveryBill(pre => ({...pre,model:true,prdata:data,open:!deliveryBill.open}));
  };

  // return
  const [returnDelivery,setReturnDelivery] = useState({
      state:false,
  }); 

  return (
    <div>
      <ul>
        <li className="flex gap-x-3 justify-between items-center">
        
          <Search
            allowClear
            className="w-[40%]"
            placeholder="Search"
            onSearch={onSearchEnter}
            onChange={onSearchChange}
            enterButton
          />
          

          <span className="flex gap-x-3 justify-center items-center">
            <RangePicker onChange={(dates) => setDateRange(dates)} />
            <Button onClick={exportExcel} disabled={selectedRowKeys.length === 0}>Export <PiExport /></Button>
            <Button onClick={() => {setIsModalOpen(true); form.resetFields(); setReturnDelivery(pre => ({...pre,state:true})) }} type="primary" disabled={editingKey !== ''}> Return <IoMdRemove /> </Button>
            <Button
              disabled={editingKey !== ''}
              type="primary"
              onClick={() => {
                setIsModalOpen(true)
                setReturnDelivery(pre => ({...pre,state:false}))
                form.resetFields()
              }}
            >
              Place Order <IoMdAdd />
            </Button>
          </span>
        </li>
        <li className="mt-2">
          <Form form={form} component={false}>
            <Table
              virtual
              components={{
                body: {
                  cell: EditableCell
                }
              }}
              dataSource={data}
              columns={mergedColumns}
              pagination={false}
              loading={data.length === 0 ? true : false}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
            />
          </Form>
        </li>
      </ul>

      <Modal
      centered
        className="relative"
        title={
          <div className="flex justify-center py-3">
            <h2>{ returnDelivery.state === true ? "RETURN"  :"PLACE ORDER"}</h2>
          </div>
        }
        width={1100}
        open={isModalOpen}
        // onOk={addNewDelivery}
        onCancel={modelCancel}
        okButtonProps={{ disabled: true }}
        footer={
          <div> 
            <section className="flex gap-x-3 justify-between ">
              <span className= { `${returnDelivery.state === true ? 'invisible' : ''}`}>
              <Form className='flex gap-x-1' disabled={option.tempproduct.length > 0 ? false : true} form={form5} onFinish={onPriceChange}>
            <Form.Item name='marginvalue' rules={[{ required: true, message: false }]}>
            <InputNumber min={0} max={100} className='w-full' prefix={<span>Margin(%)</span>} />
            </Form.Item>
            <Form.Item>
              <Button type='primary' htmlType="submit">Enter</Button>
            </Form.Item>
          </Form>
              </span>

              <Form
              className={`${returnDelivery.state === true ? 'hidden' : ''}`}
                disabled={marginValue.amount === 0   ? true  :  false}
                form={form4}
                initialValues={{partialamount:0, price: 'Price', paymentstatus: 'Unpaid' }}
                onFinish={addNewDelivery}
              >
                <span className="flex gap-x-3 m-0 justify-center items-center">
                  <Form.Item name="paymentstatus">
                    <Radio.Group disabled={marginValue.amount === 0 ? true : false} buttonStyle="solid" onChange={radioOnchange}>
                      <Radio.Button value="Paid">PAID</Radio.Button>
                      <Radio.Button value="Unpaid">UNPAID</Radio.Button>
                      <Radio.Button value="Partial">PARTIAL</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item name="partialamount">
                    <InputNumber disabled={marginValue.paymentstaus === 'Partial' ? false :true}/>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      htmlType="submit"
                      type="primary"
                      className=" w-fit"
                    >
                      ORDER
                    </Button>
                  </Form.Item>
                </span>
              </Form>

              <Form
              className={`${returnDelivery.state === true ? '' : 'hidden'}`}
                disabled={option.tempproduct.length <= 0   ? true  :  false}
                form={form4}
                initialValues={{partialamount:0, price: 'Price', paymentstatus: 'Unpaid' }}
                onFinish={addNewDelivery}
              >
                <span className="flex gap-x-3 m-0 justify-center items-center">
                  <Form.Item name="paymentstatus">
                    <Radio.Group disabled={option.tempproduct.length <= 0 ? true : false} buttonStyle="solid" onChange={radioOnchange}>
                      <Radio.Button value="Paid">PAID</Radio.Button>
                      <Radio.Button value="Unpaid">UNPAID</Radio.Button>
                      <Radio.Button value="Partial">PARTIAL</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item name="partialamount">
                    <InputNumber disabled={marginValue.paymentstaus === 'Partial' ? false :true}/>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      htmlType="submit"
                      type="primary"
                      className=" w-fit"
                    >
                       {returnDelivery.state === true ? "RETURN"  :"ORDER"}
                    </Button>
                  </Form.Item>
                </span>
              </Form>
            </section>
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-x-3">
          <span className="col-span-1">
            <Form
              onFinish={createTemDeliveryMt}
              form={form2}
              layout="vertical"
              initialValues={{ date: dayjs() }}
            >
              <Form.Item
                className="mb-1"
                name="customername"
                label="Customer Name"
                rules={[{ required: true, message: false }]}
              >
                <Select
                  showSearch
                  placeholder="Search to Select"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={option.customer}
                  onChange={(value, i) => customerOnchange(value, i)}
                />
              </Form.Item>
              <Form.Item
                className="mb-1"
                name="productname"
                label="Product Name"
                rules={[{ required: true, message: false }]}
              >
                <Select
                  disabled={option.customerstatus}
                  showSearch
                  placeholder="Search to Select"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={option.product}
                  onChange={(value, i) => productOnchange(value, i)}
                />
              </Form.Item>
              <Form.Item
                className="mb-1"
                name="flavour"
                label="Flavour"
                rules={[{ required: true, message: false }]}
              >
                <Select
                  disabled={option.flavourstatus}
                  onChange={(value, i) => flavourOnchange(value, i)}
                  showSearch
                  placeholder="Search to Select"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={option.flavour}
                />
              </Form.Item>
              <Form.Item
                className="mb-1 w-full"
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: false }]}
              >
                <Select
                  disabled={option.quantitystatus}
                  showSearch
                  placeholder="Search to Select"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={option.quantity}
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

              <Form.Item
                className="mb-3 absolute top-8"
                name="date"
                label=""
                rules={[{ required: true, message: false }]}
                
              >
                <DatePicker onChange={(value, i) => sendDeliveryDateOnchange(value, i)} format={'DD/MM/YY'} />
              </Form.Item>

              <Form.Item className="mb-3 w-full">
                <Button className="w-full" type="primary" htmlType="submit">
                  Add To List
                </Button>
              </Form.Item>
              {/* <Button disabled={option.tempproduct.length > 0 ? false:true} onClick={addNewDelivery} className=' w-full'>Add</Button> */}
            </Form>
          </span>
          <span className="col-span-2">
            <Table
              columns={columns2}
              dataSource={option.tempproduct}
              pagination={{ pageSize: 4 }}
            />
          </span>
        </div>

        <span className={`absolute top-8 right-10 ${marginValue.amount === 0 ? 'hidden' :'block' }`}>
          <Tag color='blue'>MRP Amount: {formatToRupee(totalamount)}</Tag>
          {/* <Tag color='yellow'>Discount Amount: {formatToRupee(marginValue.discount)}</Tag> */}
          <Tag color='orange'>Margin: {marginValue.percentage}%</Tag>
          <Tag color='green'>Net Amount: <span className='text-sm'>{formatToRupee(marginValue.amount)}</span></Tag>
        </span>
      </Modal>

      {/* material used model */}
      <Modal
        className="relative"
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h2>Add Products</h2>{' '}
          </div>
        }
        width={1000}
        open={isMaterialModalOpen}
        onCancel={materialModelCancel}
        okButtonProps={{ disabled: true }}
        footer={
          <Button
            type="primary"
            disabled={mtOption.tempproduct.length > 0 ? false : true}
            onClick={addNewTemMaterial}
            className=" w-fit"
          >
            Add
          </Button>
        }
      >
        <div className="grid grid-cols-3 gap-x-3">
          <span className="col-span-1 ">
            <Form
              onFinish={createTemMaterial}
              form={form3}
              layout="vertical"
              initialValues={{ date: dayjs() }}
            >
              <Form.Item
                name="material"
                label="Material Name"
                rules={[{ required: true, message: false }]}
              >
                <Select
                  showSearch
                  placeholder="Search to Select"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={mtOption.material}
                  onChange={(value, i) => productOnchange(value, i)}
                />
              </Form.Item>

              <span className="flex gap-x-2 ">
                <Form.Item
                  className="mb-1 w-full"
                  name="quantity"
                  label="Quantity"
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber className="w-full" />
                </Form.Item>

                <Form.Item
                  className=""
                  name="unit"
                  label="Unit"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    onChange={(value, i) => flavourOnchange(value, i)}
                    showSearch
                    placeholder="Search to Select"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { label: 'Liter', value: 'Liter' },
                      { label: 'MM', value: 'MM' },
                      { label: 'GM', value: 'GM' },
                      { label: 'KG', value: 'KG' }
                    ]}
                  />
                </Form.Item>
              </span>

              <Form.Item
                className=" absolute top-8"
                name="date"
                label=""
                rules={[{ required: true, message: false }]}
              >
                <DatePicker format={'DD/MM/YY'} />
              </Form.Item>

              <Form.Item className=" w-full">
                <Button className="w-full" type="primary" htmlType="submit">
                  Add To List
                </Button>
              </Form.Item>
              {/* <Button disabled={option.tempproduct.length > 0 ? false:true} onClick={addNewDelivery} className=' w-full'>Add</Button> */}
            </Form>
          </span>
          <span className="col-span-2">
            <Table
              columns={columns3}
              dataSource={mtOption.tempproduct}
              pagination={{ pageSize: 4 }}
            />
          </span>
        </div>
      </Modal>
      
      {/* Delivery bill model */}
      <Modal className='relative' width={1000} title={<span className='w-full flex justify-center items-center text-sm py-2'>DELIVERED ON {deliveryBill.data.date === undefined ? 0 : deliveryBill.data.date} </span>}  footer={false} open={deliveryBill.model} onCancel={() => setDeliveryBill(pre => ({...pre, model: false }))}>
        <Table
        columns={deliveryColumns}
        dataSource={deliveryBill.data.items}
        loading={deliveryBill.loading}
        />
        {/* <span>Partialamount Amount: <Tag className='text-[1.1rem]' color='orange'>{formatToRupee(deliveryBill.data.partialamount === undefined ? 0 : deliveryBill.data.partialamount)}</Tag></span> */}
        <span>Total Amount: <Tag className='text-[1.1rem]' color='yellow'>{formatToRupee(deliveryBill.data.total === undefined ? 0 : deliveryBill.data.total)}</Tag></span>
        <span>Margin: <Tag className='text-[1.1rem]' color='blue'>{deliveryBill.data.margin === undefined ? 0 : deliveryBill.data.margin}%</Tag></span>
        <span>Billing Amount: <Tag className='text-[1.1rem]' color='green'>{formatToRupee(deliveryBill.data.billamount === undefined ? 0 : deliveryBill.data.billamount )}</Tag></span>
      </Modal>
    </div>
  )
}
