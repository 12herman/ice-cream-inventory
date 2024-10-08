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
  Tooltip
} from 'antd'
import { debounce } from 'lodash'
import { SolutionOutlined } from '@ant-design/icons'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import jsonToExcel from '../js-files/json-to-excel'
import {
  createCustomer,
  updateCustomer,
  getCustomerPayDetailsById
} from '../firebase/data-tables/customer'
import { addDoc, collection, doc, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import dayjs from 'dayjs'
import { formatToRupee } from '../js-files/formate-to-rupee'
const { Search, TextArea } = Input
import { PiWarningCircleFill } from 'react-icons/pi'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import { truncateString } from '../js-files/letter-length-sorting'

export default function CustomerList({ datas, customerUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])
  const [payForm] = Form.useForm()
  const [isPayModelOpen, setIsPayModelOpen] = useState(false)
  const [isPayDetailsModelOpen, setIsPayDetailsModelOpen] = useState(false)
  const [customerPayId, setCustomerPayId] = useState(null)
  const [payDetailsData, setPayDetailsData] = useState([])
  const [isVehicleNoDisabled, setIsVehicleNoDisabled] = useState(true)
  const [customerTbLoading, setCustomerTbLoading] = useState(true)
  const [totalReturnAmount, setTotalReturnAmount] = useState(0)
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0)
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0)
  const [totalBalanceAmount, setTotalBalanceAmount] = useState(0)

  // side effect
  useEffect(() => {
    setCustomerTbLoading(true)
    const filteredData = datas.customers
      .filter((data) => data.isdeleted === false)
      .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    setData(filteredData)
    setCustomerTbLoading(false)
  }, [datas])

  // search
  const [searchText, setSearchText] = useState('')
  const onSearchEnter = (value, _e) => {
    setSearchText(value.trim())
  }
  const onSearchChange = (e) => {
    if (e.target.value === '') {
      setSearchText('')
    }
  }

  const [isNewCustomerLoading, setIsNewCustomerLoading] = useState(false)
  // create new project
  const createNewProject = async (values) => {
    setIsNewCustomerLoading(true)
    try {
      await createCustomer({
        ...values,
        gstin: values.gstin || '',
        vehicleorfreezerno: values.vehicleorfreezerno || '',
        createddate: TimestampJs(),
        updateddate: '',
        isdeleted: false
      })
      customerUpdateMt()
      message.open({ type: 'success', content: 'Customer Added Successfully' })
    } catch (error) {
      message.open({ type: 'error', content: 'Failed to add customer' })
    } finally {
      form.resetFields()
      setIsModalOpen(false)
      setIsNewCustomerLoading(false)
      setCustomerOnchange({
        customername: '',
        payamount: ''
      })
    }
  }

  const showPayModal = (record) => {
    setCustomerName(record.customername)
    payForm.resetFields()
    setCustomerPayId(record.id)
    setIsPayModelOpen(true)
  }

  const [isCustomerPayLoading, setIsCustomerPayLoading] = useState(false)
  const customerPay = async (value) => {
    setIsCustomerPayLoading(true)
    let { date, description, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const payData = {
      ...Datas,
      collectiontype:'customer',
      date: formateDate,
      customerid:customerPayId,
      description: description || '',
      type: 'Payment',
      createddate: TimestampJs()
    }
    try {
      const customerDocRef = doc(db, 'customer', customerPayId)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData)
      message.open({ type: 'success', content: 'Pay Added Successfully' })
    } catch (e) {
      console.log(e)
    } finally {
      payForm.resetFields()
      setCustomerPayId(null)
      setIsPayModelOpen(false)
      setIsCustomerPayLoading(false)
      setCustomerOnchange({
        customername: '',
        payamount: ''
      })
    }
  }

  const [customerName,setCustomerName] = useState('');
  const showPayDetailsModal = async (record) => {
    
    setCustomerName(record.customername)
    try {
      const payDetailsResponse = await getCustomerPayDetailsById(record.id)
      let payDetails = []
      if (payDetailsResponse.status === 200) {
        payDetails = payDetailsResponse.paydetails
      }
      const deliveryDocRef = await datas.delivery.filter(
        (item) => item.isdeleted === false && item.customerid === record.id
      ).map(data=>({...data,customername:record.customername}))

      const combinedData = payDetails.concat(deliveryDocRef)
      let sortedData = await latestFirstSort(combinedData)
      setPayDetailsData(sortedData)
      
      const totalPurchase = combinedData.reduce((total, item) => {
        if (item.type === 'order') {
          return total + (Number(item.billamount) || 0)
        }
        return total
      }, 0)
      setTotalPurchaseAmount(totalPurchase)

      const totalReturn = combinedData.reduce((total, item) => {
        if (item.type === 'return') {
          return total + (Number(item.billamount) || 0)
        }
        return total
      }, 0)
      setTotalReturnAmount(totalReturn)

      const totalPayment = combinedData.reduce((total, item) => {
        if (item.type === 'order') {
          if (item.paymentstatus === 'Paid') {
            return total + (Number(item.billamount) || 0)
          } else if (item.paymentstatus === 'Partial'){
            return total + (Number(item.partialamount) || 0)
          }
        } else if (item.type === 'Payment') {
          return total + (Number(item.amount) || 0)
        }
        return total
      }, 0)
      setTotalPaymentAmount(totalPayment)

      const totalBalance = combinedData.reduce((total, item) => {
        const billAmount = Number(item.billamount) || 0
        const partialAmount = Number(item.partialamount) || 0
        const paymentAmount = Number(item.amount) || 0
        if (item.type === 'order') {
          if (item.paymentstatus === 'Unpaid') {
            return total + billAmount
          } else if (item.paymentstatus === 'Partial') {
            return total + (billAmount - partialAmount)
          }
        } else if (item.type === 'return') {
          return total - billAmount
        } else if (item.type === 'Payment') {
          return total - paymentAmount
        }
        return total
      }, 0)
      setTotalBalanceAmount(totalBalance)
      
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
      width: 50,
      render: (record, _, i) => <span>{i + 1}</span>
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
      title: 'Amount',
      dataIndex: 'amount',
      key: 'payment',
      render: (_, record) => {
        if (record.amount !== undefined) {
          if (record.type === 'Payment') {
            return formatToRupee(record.amount, true);
          } 
        }else {
          return formatToRupee(record.billamount, true);
        }
        return null;
      },
      width: 120
    },
    {
      title: 'Spend',
      dataIndex: 'amount',
      key: 'spend',
      render: (_, record) => {
        if (record.amount !== undefined && record.type === 'Spend') {
            return formatToRupee(record.amount, true);
        }
        return null;
      },
      width: 100
    },
    {
      title: 'Advance',
      dataIndex: 'amount',
      key: 'advance',
      render: (_, record) => {
        if (record.amount !== undefined) {
          if (record.type === 'Advance') {
            return formatToRupee(record.amount, true);
          }
        }
      },
      width: 100
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (_, record) => {
        return record.type === undefined ? (
          <Tag color="green">Pay</Tag>
        ) : record.type === 'order' ? (
          <Tag color="green">Order</Tag>
        ) : record.type === 'return' ? (
          <Tag color="red">Return</Tag>
        ) : (
          <></>
        )
      },
      width: 90
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      render: (_, record) => {
        return record.paymentstatus === undefined ? (
          <>
            <Tag color="cyan">{record.paymentmode}</Tag>
            <span>-</span>
          </>
        ) : record.paymentstatus === 'Paid' ? (
          <span className="flex items-center">
            <Tag color="green">Paid</Tag>
            {record.paymentmode && <Tag color="cyan">{record.paymentmode}</Tag>}
          </span>
        ) : record.paymentstatus === 'Unpaid' ? (
          <Tag color="red">UnPaid</Tag>
        ) : record.paymentstatus === 'Partial' ? (
          <span className="flex  items-center">
            <Tag color="yellow">Partial</Tag>{' '}
            <Tag color="blue" className="text-[0.7rem]">
              {formatToRupee(record.partialamount, true)}
            </Tag>
            {record.paymentmode && <Tag color="cyan">{record.paymentmode}</Tag>}
          </span>
        ) : (
          <></>
        )
      },
      width: 170
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_, record) => {
        return record.description === undefined ? <span>-</span> : record.description
      }
    }
  ]

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.customername).toLowerCase().includes(value.toLowerCase()) ||
          String(record.transport).toLowerCase().includes(value.toLowerCase()) ||
          String(record.location).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.gstin).toLowerCase().includes(value.toLowerCase()) ||
          String(record.vehicleorfreezerno).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Customer',
      dataIndex: 'customername',
      key: 'customername',
      editable: true,
      sorter: (a, b) => a.customername.localeCompare(b.customername),
      showSorterTooltip: { target: 'sorter-icon' },
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Transport',
      dataIndex: 'transport',
      key: 'transport',
      editable: true,
      sorter: (a, b) => a.transport.localeCompare(b.transport),
      showSorterTooltip: { target: 'sorter-icon' },
      width: 139
    },
    {
      title: 'Mobile',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber',
      editable: true,
      width: 136
    },
    {
      title: 'Number',
      dataIndex: 'vehicleorfreezerno',
      key: 'vehicleorfreezerno',
      editable: true,
      render: (text,record)=>{
        return text.length > 12 ? <Tooltip title={text}>{truncateString(text,12)}</Tooltip> : text
      }
    },
    {
      title: 'GSTIN ',
      dataIndex: 'gstin',
      key: 'gstin',
      width: 140,
      editable: true,
      render: (text,record)=>{
        return text.length > 10 ? <Tooltip title={text}>{truncateString(text,10)}</Tooltip> : text
      }
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      editable: true,
      sorter: (a, b) => a.location.localeCompare(b.location),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text,record)=>{
        return text.length > 10 ? <Tooltip title={text}>{truncateString(text,10)}</Tooltip> : text
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
          <span className="flex gap-x-2 justify-center items-center">
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
              onClick={() => edit(record)}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>
            <Popconfirm
            placement='left'
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
    const inputNode = dataIndex === 'mobilenumber' ? <InputNumber type="number" /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <>
            {dataIndex === 'transport' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="transport"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select transport"
                    optionFilterProp="label"
                    options={[
                      { value: 'Self', label: 'Self' },
                      { value: 'Company', label: 'Company' },
                      { value: 'Freezer Box', label: 'Freezer Box' },
                      { value: 'Mini Box', label: 'Mini Box' }
                    ]}
                  />
                </Form.Item>
              </span>
            ) : dataIndex === 'mobilenumber' ? (
              <Form.Item
                name="mobilenumber"
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
                <InputNumber maxLength={10} type="number" />
              </Form.Item>
            ) : (
              <Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[
                  {
                    required:
                      dataIndex === 'customername' ||
                      dataIndex === 'transport' ||
                      dataIndex === 'mobilenumber' ||
                      dataIndex === 'location'
                        ? true
                        : false,
                    message: false,
                    whitespace: true
                  }
                ]}
              >
                <Input />
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
      setCustomerTbLoading(true)
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (
        index != null &&
        row.customername === key.customername &&
        row.transport === key.transport &&
        row.location === key.location &&
        row.vehicleorfreezerno === key.vehicleorfreezerno &&
        row.mobilenumber === key.mobilenumber &&
        row.gstin === key.gstin
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
      } else {
        await updateCustomer(key.id, { ...row, updateddate: TimestampJs() })
        customerUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    } finally {
      setCustomerTbLoading(false)
    }
  }

  // selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const onSelectChange = (newSelectedRowKeys) => {
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

  // delete
  const deleteProduct = async (data) => {
    // await deleteproduct(data.id);
    const { id, ...newData } = data
    await updateCustomer(id, {
      isdeleted: true,
      // deletedby: 'admin',
      deleteddate: TimestampJs()
    })
    customerUpdateMt();
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    jsonToExcel(exportDatas, `Customer-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKeys('')
  }

  const handleTransportChange = (value) => {
    if (value === 'Self') {
      setIsVehicleNoDisabled(true)
    } else {
      setIsVehicleNoDisabled(false)
    }
  }

  // warning modal methods
  const [isCloseWarning, setIsCloseWarning] = useState(false)
  const [customerOnchange, setCustomerOnchange] = useState({
    customername: '',
    payamount: ''
  })

  const warningModalOk = () => {
    setIsModalOpen(false)
    form.resetFields()
    setIsCloseWarning(false)
    setCustomerOnchange({
      customername: '',
      payamount: ''
    })
    setIsPayModelOpen(false)
  }

  const customerOnchangeMt = debounce((e, input) => {
    if (input === 'customername') {
      setCustomerOnchange({
        customername: e.target.value,
        payamount: ''
      })
    } else {
      setCustomerOnchange({
        customername: '',
        payamount: e
      })
    }
  }, 200)

  return (
    <div>
      <Modal
        zIndex={1001}
        width={300}
        centered={true}
        title={
          <span className="flex gap-x-1 justify-center items-center">
            <PiWarningCircleFill className="text-yellow-500 text-xl" /> Warning
          </span>
        }
        open={isCloseWarning}
        onOk={warningModalOk}
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
                setIsModalOpen(true)
                form.resetFields()
                form.setFieldsValue({ transport: 'Self' })
              }}
            >
              New Customer <IoMdAdd />
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
              loading={customerTbLoading}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
            />
          </Form>
        </li>
      </ul>

      <Modal
        maskClosable={
          customerOnchange.customername === '' ||
          customerOnchange.customername === undefined ||
          customerOnchange.customername === null
            ? true
            : false
        }
        centered={true}
        title={<span className="flex justify-center">NEW CUSTOMER</span>}
        open={isModalOpen}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: isNewCustomerLoading }}
        onCancel={() => {
          if (
            customerOnchange.customername === '' ||
            customerOnchange.customername === undefined ||
            customerOnchange.customername === null
          ) {
            setIsModalOpen(false)
            form.resetFields()
            setCustomerOnchange({
              customername: '',
              payamount: ''
            })
          } else {
            setIsCloseWarning(true)
          }
        }}
      >
        <Spin spinning={isNewCustomerLoading}>
          <Form
            initialValues={{ transport: 'Self' }}
            onFinish={createNewProject}
            form={form}
            layout="vertical"
            onValuesChange={(changedValues) => {
              if (changedValues.transport) {
                handleTransportChange(changedValues.transport)
              }
            }}
          >
            <Form.Item
              className="mb-2"
              name="customername"
              label="Customer Name"
              rules={[{ required: true, message: false }]}
            >
              <Input
                onChange={(e) => customerOnchangeMt(e, 'customername')}
                placeholder="Enter the Customer Name"
              />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="transport"
              label="Transport Type"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group>
                <Radio value={'Self'}>Self</Radio>
                <Radio value={'Company'}>Company</Radio>
                <Radio value={'Freezer Box'}>Freezer Box</Radio>
                <Radio value={'Mini Box'}>Mini Box</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="vehicleorfreezerno"
              label="Vehicle No / Freezer No"
              rules={[{ required: false, message: 'Vehicle or Freezer No is required' }]}
            >
              <Input
                className="w-full"
                disabled={isVehicleNoDisabled}
                placeholder="Enter the Vehicle / Box Number"
              />
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
              <InputNumber className="w-full" type="number" placeholder="Enter the Mobile Number" />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="gstin"
              label="GSTIN"
              rules={[{ required: false, message: false }]}
            >
              <Input placeholder="Enter the GST Number" />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="location"
              label="Address"
              rules={[{ required: true, message: false }]}
            >
              <TextArea rows={4} placeholder="Enter the Address / Location" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        centered={true}
        maskClosable={
          customerOnchange.payamount === '' ||
          customerOnchange.payamount === undefined ||
          customerOnchange.payamount === null
            ? true
            : false
        }
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h1 className='text-xl font-bold'>{customerName}</h1>{' '}
          </div>
        }
        open={isPayModelOpen}
        onCancel={() => {
          if (
            customerOnchange.payamount === '' ||
            customerOnchange.payamount === undefined ||
            customerOnchange.payamount === null
          ) {
            setIsPayModelOpen(false)
          } else {
            setIsCloseWarning(true)
          }
        }}
        onOk={() => payForm.submit()}
        okButtonProps={{ disabled: isCustomerPayLoading }}
      >
        <Spin spinning={isCustomerPayLoading}>
          <Form
            onFinish={customerPay}
            form={payForm}
            initialValues={{ date: dayjs(), paymentmode: 'Cash' }}
            layout="vertical"
          >
            <Form.Item
              className="mb-1"
              name="amount"
              label="Amount"
              rules={[{ required: true, message: false }]}
            >
              <InputNumber
                onChange={(e) => customerOnchangeMt(e, 'payamount')}
                min={0}
                type="number"
                className="w-full"
                placeholder="Enter the Amount"
              />
            </Form.Item>
            <Form.Item className="mb-1" name="description" label="Description">
              <TextArea rows={4} placeholder="Write the Description" />
            </Form.Item>
            <Form.Item
              className=" absolute top-[-3rem]"
              name="date"
              label=""
              rules={[{ required: true, message: false }]}
            >
              <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
            </Form.Item>

            <Form.Item
              className="mb-0"
              name="paymentmode"
              label="Payment Mode"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group size="small">
                <Radio value="Cash">Cash</Radio>
                <Radio value="Card">Card</Radio>
                <Radio value="UPI">UPI</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={<div>
        <Tag className='absolute left-12' color='blue'>{customerName}</Tag>
          <span className="text-center w-full block pb-1">PAY DETAILS</span>
        </div>}
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
        <div className="flex justify-between mt-2 font-semibold">
          <div>Order: {totalPurchaseAmount.toFixed(2)}</div>
          <div>Return: {totalReturnAmount.toFixed(2)}</div>
          <div>Payment: {totalPaymentAmount.toFixed(2)}</div>
          <div>Balance: {totalBalanceAmount.toFixed(2)}</div>
        </div>
      </Modal>
    </div>
  )
}
