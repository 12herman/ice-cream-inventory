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
import { IoMdAdd } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import {
  createRawmaterial,
  updateRawmaterial,
  deleteRawmaterial
} from '../firebase/data-tables/rawmaterial'
import { TimestampJs } from '../js-files/time-stamp'
import { updateStorage } from '../firebase/data-tables/storage'
import dayjs from 'dayjs'
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

  // side effect
  useEffect(() => {
    const filteredMaterials = datas.rawmaterials
      .filter((data) => !data.isdeleted && isWithinRange(data.date))
      .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    setData(filteredMaterials)
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

  const createAddMaterial = async (values) => {
  
 if(form.getFieldValue('partialamount') === 0){
  return message.open({type: 'warning',content: 'Please enter a valid amount',});
 }
 else{
    const { date, ...otherValues } = values
    const formattedDate = date ? dayjs(date).format('DD/MM/YYYY') : null
    await createRawmaterial({
      ...otherValues,
      date: formattedDate,
      createddate: TimestampJs(),
      isdeleted: false
    })
    const existingMaterial = datas.storage.find(
      (storageItem) =>
        storageItem.materialname === otherValues.materialname && storageItem.category === 'Material List'
    )
    if (existingMaterial) {
      await updateStorage(existingMaterial.id, {
        quantity: existingMaterial.quantity + otherValues.quantity
      })
      storageUpdateMt();
    }
    form.resetFields()
    rawmaterialUpdateMt()
    setIsModalOpen(false);
    setRadioBtn({status:true,value:''})
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
      key: 'date',
      editable: false
    },
    {
      title: 'Supplier',
      dataIndex: 'suppliername',
      key: 'suppliername',
      editable: true
    },
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname',
      editable: true
    },
    // {
    //   title: 'Location',
    //   dataIndex: 'location',
    //   key: 'location',
    //   editable: true,
    // },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      width: 120,
      render: (_, record) => {
        return record.quantity + ' ' + record.unit
      }
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      editable: true,
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      editable: true,
      width: 160,
      sorter: (a, b) => a.paymentstatus.localeCompare(b.paymentstatus),
      showSorterTooltip: { target: 'sorter-icon' },
      render: text => <Tag color={text === 'Paid' ? 'green' : text === 'Partial' ? 'yellow' : 'red'}>{text}</Tag>
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
            <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>
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
  };

  const [radioBtn,setRadioBtn] = useState({
    status:true,
    value:'',
    partialamount:0
  });

  const radioOnchange = (e) => {
    setRadioBtn(pre =>({...pre,status:false,value:e.target.value}))
    form.setFieldsValue({ partialamount: 0 })
  };

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
            <Button>
              Export <PiExport />
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setIsModalOpen(true)
                form.resetFields()
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
              loading={data.length === 0 ? true : false}
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
            {' '}
            <h1>ADD MATERIAL</h1>{' '}
          </div>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        okButtonProps={{disabled:radioBtn.status}}
        onCancel={() => {
          setIsModalOpen(false);
          setRadioBtn({status:true,value:''})
          form.resetFields()
        }}
      >
        <Form
          onFinish={createAddMaterial}
          form={form}
          layout="vertical"
          initialValues={{ date: dayjs() }}
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
                new Set(datas.suppliers.map((supplier) => supplier.suppliername))
              ).map((suppliername, index) => ({
                value: suppliername,
                label: suppliername,
                key: index
              }))}
              onChange={(value) => setSelectedSupplierName(value)}
            />
          </Form.Item>

          <Form.Item
            className="mb-3 absolute top-8"
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
              <InputNumber className="w-full" />
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
            ]}>
            <InputNumber className="w-full" />
          </Form.Item>

          <Form.Item
            className="mb-1"
            name="paymentstatus"
            label="Status"
            rules={[{ required: true, message: false }]}>
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
              { required: radioBtn.value === 'Partial' || form.getFieldValue('partialamount') === 0 ? true : false , message: false },
              { type: 'number', message: false }
            ]}>
            <InputNumber formatter={value => `${value}`} disabled={radioBtn.value === 'Partial' ? false : true} className="w-full" />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  )
}
