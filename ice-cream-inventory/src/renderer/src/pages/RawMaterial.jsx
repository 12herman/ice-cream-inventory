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
  Tag,
  Spin
} from 'antd'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { IoMdRemove } from 'react-icons/io'
import { AiOutlineDelete } from 'react-icons/ai'
import { createRawmaterial, updateRawmaterial } from '../firebase/data-tables/rawmaterial'
import { TimestampJs } from '../js-files/time-stamp'
import { updateStorage } from '../firebase/data-tables/storage'
import dayjs from 'dayjs'
import { getSupplierById } from '../firebase/data-tables/supplier'
const { Search } = Input
const { RangePicker } = DatePicker

export default function RawMaterial({ datas, rawmaterialUpdateMt, storageUpdateMt }) {
  //states
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState('')
  const [data, setData] = useState([])
  const [selectedSupplierName, setSelectedSupplierName] = useState(null)
  const [materials, setMaterials] = useState([])
  const [dateRange, setDateRange] = useState([null, null])
  const [usedmaterialform] = Form.useForm()
  const [usedMaterialModal, setUsedMaterialModal] = useState(false)
  const [isMaterialTbLoading, setIsMaterialTbLoading] = useState(true)

  const [isLoadMaterialUsedModal, setIsLoadMaterialUsedModal] = useState(false)
  // side effect
  useEffect(() => {
    const fetchData = async () => {
      setIsMaterialTbLoading(true)

      const filteredMaterials = await Promise.all(
        datas.rawmaterials
          .filter((data) => !data.isdeleted && isWithinRange(data.date))
          .map(async (item, index) => {
            let suppliername = '-'
            let materialname = item.materialname || '-'
            if (item.type === 'Added') {
              const result = await getSupplierById(item.supplierid)
              suppliername = result.supplier.suppliername
              materialname = result.supplier.materialname
            }
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              suppliername: suppliername,
              materialname: materialname
            }
          })
      )
      setData(filteredMaterials)
      setIsMaterialTbLoading(false)
    }
    fetchData()
  }, [datas.rawmaterials, dateRange])

  const isWithinRange = (date) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return true
    }
    const dayjsDate = dayjs(date, 'DD/MM/YYYY')
    return (
      dayjsDate.isSame(dateRange[0], 'day') ||
      dayjsDate.isSame(dateRange[1], 'day') ||
      (dayjsDate.isAfter(dayjs(dateRange[0])) && dayjsDate.isBefore(dayjs(dateRange[1])))
    )
  }

  // Dropdown select
  useEffect(() => {
    if (selectedSupplierName) {
      const filteredMaterials = datas.suppliers
        .filter((supplier) => supplier.suppliername === selectedSupplierName)
        .map((supplier) => ({
          value: supplier.materialname,
          label: supplier.materialname,
          key: supplier.id
        }))
      setMaterials(filteredMaterials)
      form.resetFields(['materialname', 'quantity', 'unit', 'price', 'paymentstatus'])
    } else {
      setMaterials([])
    }
  }, [selectedSupplierName, datas.suppliers])

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

  const [isLoadingModal,setIsLoadingModal] = useState(false)
  
  const createAddMaterial = async (values) => {
    setIsLoadingModal(true);
    try{

      if (form.getFieldValue('partialamount') === '0') {
        return message.open({ type: 'warning', content: 'Please enter a valid amount' })
      } else {
        
        const { date, materialname, suppliername, ...otherValues } = await values
        const formattedDate = date ? dayjs(date).format('DD/MM/YYYY') : null
        const findSupplierId = await datas.suppliers.find(
          (supplier) =>
            supplier.materialname === materialname && supplier.suppliername === suppliername
        ).id
  
        await createRawmaterial({
          supplierid: findSupplierId,
          ...otherValues,
          date: formattedDate,
          partialamount:otherValues.partialamount === undefined ? 0 : otherValues.partialamount,
          createddate: TimestampJs(),
          isdeleted: false,
          type: 'Added'
        });

        const existingMaterial = await datas.storage.find(
          (storageItem) =>
            storageItem.materialname === otherValues.materialname &&
            storageItem.category === 'Material List'
        )
        if (existingMaterial) {
          await updateStorage(existingMaterial.id, {
            quantity: existingMaterial.quantity + otherValues.quantity
          })
          storageUpdateMt();
        }
        form.resetFields()
        rawmaterialUpdateMt()
        setIsModalOpen(false)
        setRadioBtn({ status: true, value: '' })
      }
    }catch(error){
      console.log(error)
    }
    finally{
      setIsLoadingModal(false)
    }
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
          String(record.suppliername).toLowerCase().includes(value.toLowerCase()) ||
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
          String(record.price).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'createddate',
      sorter: (a, b) => {
        const format = 'DD/MM/YYYY,HH:mm'
        const dateA = dayjs(a.createddate, format);
        const dateB = dayjs(b.createddate, format);
        return dateB.isAfter(dateA) ? -1 : 1;
      },
      defaultSortOrder: 'descend',
      width: 115,
    },
    {
      title: 'Supplier',
      dataIndex: 'suppliername',
      key: 'suppliername',
      // width: 150,
      editable: true
    },
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname',
      // width: 150,
      editable: true
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
       width: 120,
      render: (_, record) => {
        return record.quantity + ' ' + record.unit
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      editable: true,
       width: 120
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      editable: false,
       width: 80,
      sorter: (a, b) => a.type.localeCompare(b.type),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text) => <Tag color={text === 'Added' ? 'green' : 'red'}>{text}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      editable: false,
       width: 140,
      sorter: (a, b) => a.paymentstatus.localeCompare(b.paymentstatus),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text,record) => (
        <span className='flex gap-x-0'><Tag color={text === 'Paid' ? 'green' : text === 'Partial' ? 'yellow' : 'red'}>{text} </Tag> {text === 'Partial' ? <Tag color='blue'>{record.partialamount}</Tag> : null}</span>
      )
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
            {/* <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link> */}
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
    const inputNode = inputType === 'number' ? <InputNumber /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <>
            {dataIndex === 'quantity' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="quantity"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber className="w-full" />
                </Form.Item>
                <Form.Item
                  name="unit"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    showSearch
                    placeholder="Select"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'gm', label: 'GM' },
                      { value: 'mm', label: 'MM' },
                      { value: 'kg', label: 'KG' }
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
  };
  



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
        inputType:
          col.dataIndex === 'quantity' ||
          col.dataIndex === 'productperpack' ||
          col.dataIndex === 'price'
            ? 'number'
            : 'text',
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
      if (
        index != null &&
        row.flavour === key.flavour &&
        row.productname === key.productname &&
        row.quantity === key.quantity &&
        row.productperpack === key.productperpack &&
        row.price === key.price
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKey('')
      } else {
        await updateRawmaterial(key.id, { ...row, updateddate: TimestampJs() })
        rawmaterialUpdateMt()
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
      console.log(selectTableData)
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
    //await deleteProjects(data.id);
    const { id, ...newData } = data
    await updateRawmaterial(id, { isdeleted: true, deletedby: 'admin', deleteddate: TimestampJs() })
    rawmaterialUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  const [radioBtn, setRadioBtn] = useState({
    status: true,
    value: '',
    partialamount: 0
  })

  const radioOnchange = (e) => {
    setRadioBtn((pre) => ({ ...pre, status: false, value: e.target.value }))
    form.setFieldsValue({ partialamount: 0 })
  }

  // material used
  const usedmaterialcolumns = [
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname',
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
  ]

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
  const createUsedMaterial = async (values) => {
    setMtOption((pre) => ({ ...pre, count: pre.count + 1 }))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    const newMaterial = {
      ...values,
      date: formattedDate,
      key: mtOption.count,
      createddate: TimestampJs(),
      isdeleted: false,
      quantity: values.quantity + ' ' + values.unit
    }
    console.log(mtOption.tempproduct, newMaterial)
    
    const checkExist = mtOption.tempproduct.find((item) => item.materialname === newMaterial.materialname && item.date === newMaterial.date)

    const dbcheckExsit = datas.rawmaterials.find(
      (item) => item.materialname === newMaterial.materialname && item.date === newMaterial.date
    )
    if (checkExist) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (dbcheckExsit) {
      message.open({ type: 'warning', content: 'Product is alreadyy added' })
      return
    } else {
      setMtOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newMaterial] }))
    }
  }

  // remove tem material
  const removeTemMaterial = (key) => {
    const newTempProduct = mtOption.tempproduct.filter((item) => item.key !== key.key)
    setMtOption((pre) => ({ ...pre, tempproduct: newTempProduct }))
  }

  // add new material to data base
  const addNewTemMaterial = async () => {
    setIsLoadMaterialUsedModal(true);
    try{
    
    mtOption.tempproduct.map(async (item) => {
      let { key, quantity, ...newMaterial } = item
      let quantityNumber = Number(quantity.split(' ')[0])
      await createRawmaterial({
        ...newMaterial,
        quantity: quantityNumber,
        type: 'Used',
        paymentstatus: 'Used'
      })
      const existingMaterial = datas.storage.find(
        (storageItem) =>
          storageItem.materialname === newMaterial.materialname &&
          storageItem.category === 'Material List'
      )
      if (existingMaterial) {
        await updateStorage(existingMaterial.id, {
          quantity: existingMaterial.quantity - quantityNumber
        })
        storageUpdateMt()
      }
    })
   await rawmaterialUpdateMt()
    materialModelCancel()
    message.open({ type: 'success', content: 'Added Successfully' });
  } 
    catch (error) {
      console.log(error)
    }
    finally {
     await setIsLoadMaterialUsedModal(false);
    }
  }

  // model cancel
  const materialModelCancel = () => {
    setUsedMaterialModal(false)
    usedmaterialform.resetFields()
    setMtOption((pre) => ({ ...pre, tempproduct: [], count: 0 }))
  }

  
  return (
    <div>
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
            <RangePicker onChange={(dates) => setDateRange(dates)} />
            <Button disabled={editingKey === ''}>
              Export <PiExport />
            </Button>
            <Button
              onClick={() => setUsedMaterialModal(true)}
              type="primary"
              disabled={editingKey !== ''}
            >
              Material Used <IoMdRemove />
            </Button>
            <Button
            disabled={editingKey !== ''}
              type="primary"
              onClick={() => {
                setIsModalOpen(true)
                form.resetFields();
                // form.setFields({paymentstatus:'Paid'})
              }}
            >
              Add Material <IoMdAdd />
            </Button>
          </span>
        </li>
        <li className="mt-2">
          <Form form={form} component={false} initialValues={{ date: dayjs() }}>
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
              loading={isMaterialTbLoading}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
            />
          </Form>
        </li>
      </ul>

      <Modal
        title={
          <div className="flex  justify-center py-3">
            <h1>ADD MATERIAL</h1>
          </div>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: isLoadingModal }}
        onCancel={() => {
          setIsModalOpen(false)
          setRadioBtn({ status: true, value: '' })
          form.resetFields()
        }}
      >
      <Spin spinning={isLoadingModal}>
        <Form
          onFinish={createAddMaterial}
          form={form}
          layout="vertical"
          initialValues={{ date: dayjs(),paymentstatus: 'Paid'}}
        >
          <Form.Item
            className="mb-0"
            name="suppliername"
            label="Supplier Name"
            rules={[{ required: true, message: false }]}
          >
            <Select
              showSearch
              placeholder="Select"
              optionFilterProp="label"
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '')
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? '').toLowerCase())
              }
              options={Array.from(
                new Map(
                  datas.suppliers.map((supplier) => [supplier.suppliername, supplier])
                ).values()
              ).map((supplier, index) => {
                return {
                  value: supplier.suppliername,
                  label: supplier.suppliername,
                  key: index
                }
              })}
              onChange={(value) => setSelectedSupplierName(value)}
            />
          </Form.Item>

          <Form.Item
            className="mb-3 absolute top-[-3rem]"
            name="date"
            label=""
            rules={[{ required: true, message: false }]}
          >
            <DatePicker format={'DD/MM/YY'} />
          </Form.Item>

          <Form.Item
            className="mb-0"
            name="materialname"
            label="Material Name"
            rules={[{ required: true, message: false }]}
          >
            <Select
              showSearch
              placeholder="Select"
              optionFilterProp="label"
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? '')
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? '').toLowerCase())
              }
              options={materials}
            />
          </Form.Item>

          <span className="flex gap-x-2">
            <Form.Item
              className="mb-0 w-full"
              name="quantity"
              label="Quantity"
              rules={[
                { required: true, message: false },
                { type: 'number', message: false }
              ]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item
              className="mb-0"
              name="unit"
              label="Unit"
              rules={[{ required: true, message: false }]}
            >
              <Select
                showSearch
                placeholder="Select"
                optionFilterProp="label"
                filterSort={(optionA, optionB) =>
                  (optionA?.label ?? '')
                    .toLowerCase()
                    .localeCompare((optionB?.label ?? '').toLowerCase())
                }
                options={[
                  {
                    value: 'gm',
                    label: 'GM'
                  },
                  {
                    value: 'ml',
                    label: 'Ml'
                  },
                  {
                    value: 'kg',
                    label: 'KG'
                  },
                  {
                    value: 'lt',
                    label: 'LT'
                  }
                ]}
              />
            </Form.Item>
          </span>

          {/* <Form.Item className='mb-0' name='productperpack' label="Product Per Pack" rules={[{ required: true, message: false }, { type: 'number', message: false }]}>
            <InputNumber className='w-full' />
          </Form.Item> */}

          <Form.Item
            className="mb-0"
            name="price"
            label="Price"
            rules={[
              { required: true, message: false },
              { type: 'number', message: false }
            ]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            className="mb-1"
            name="paymentstatus"
            label="Status"
            rules={[{ required: true, message: false }]}
          >
            <Radio.Group buttonStyle="solid" onChange={radioOnchange}>
              <Radio.Button value="Paid">PAID</Radio.Button>
              <Radio.Button value="Unpaid">UNPAID</Radio.Button>
              <Radio.Button value="Partial">PARTIAL</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            className="mb-0"
            name="partialamount"
            label="Partial Amount"
            rules={[
              {
                required:
                  radioBtn.value === 'Partial' || form.getFieldValue('partialamount') === 0
                    ? true
                    : false,
                message: false
              },
              { type: 'number', message: false }
            ]}
          >
            <InputNumber
              formatter={(value) => `${value}`}
              disabled={radioBtn.value === 'Partial' ? false : true}
              className="w-full"
            />
          </Form.Item>
        </Form>
        </Spin>
      </Modal>

      {/* material used model */}
      <Modal
        className="relative"
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h2>MATERIAL USED</h2>{' '}
          </div>
        }
        width={1000}
        open={usedMaterialModal}
        onCancel={materialModelCancel}
        okButtonProps={{ disabled: true }}
        footer={
          <Button
            type="primary"
            disabled={mtOption.tempproduct.length > 0 && !isLoadMaterialUsedModal ? false : true}
            onClick={addNewTemMaterial}
            className=" w-fit"
          >
            Add
          </Button>
        }
      >
      <Spin spinning={isLoadMaterialUsedModal}>
        <div className="grid grid-cols-4 gap-x-3">
          <span className="col-span-1 ">
            <Form
              onFinish={createUsedMaterial}
              form={usedmaterialform}
              layout="vertical"
              initialValues={{ date: dayjs() }}
            >
              <Form.Item
                name="materialname"
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
                />
              </Form.Item>

              <span className="flex gap-x-2 ">
                <Form.Item
                  className="mb-1 w-full"
                  name="quantity"
                  label="Quantity"
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>

                <Form.Item
                  className=""
                  name="unit"
                  label="Unit"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    showSearch
                    placeholder="Select"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { label: 'GM', value: 'GM' },
                      { label: 'KG', value: 'KG' },
                      { label: 'LI', value: 'LI' },
                      { label: 'MI', value: 'MI' },
                    ]}
                  />
                </Form.Item>
              </span>

              <Form.Item
                className=" absolute top-[-3rem]"
                name="date"
                label=""
                rules={[{ required: true, message: false }]}
              >
                <DatePicker format={'DD/MM/YYYY'} />
              </Form.Item>

              <Form.Item className=" w-full">
                <Button className="w-full" type="primary" htmlType="submit">
                  Add To List
                </Button>
              </Form.Item>
            </Form>
          </span>
          <span className="col-span-3">
            <Table
              virtual
              columns={usedmaterialcolumns}
              dataSource={mtOption.tempproduct}
              pagination={{ pageSize: 4 }}
              scroll={{ x: false, y: false }}
            />
          </span>
        </div>
        </Spin>
      </Modal>
    </div>
  )
}
