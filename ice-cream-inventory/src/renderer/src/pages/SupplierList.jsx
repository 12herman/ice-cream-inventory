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
  Tag
} from 'antd'
import { SolutionOutlined } from '@ant-design/icons'
import { IoMdAdd } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { PiExport } from 'react-icons/pi'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import { createSupplier, updateSupplier } from '../firebase/data-tables/supplier'
import { createStorage } from '../firebase/data-tables/storage'
import jsonToExcel from '../js-files/json-to-excel'
import { addDoc, collection, doc, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import dayjs from 'dayjs'
import { formatToRupee } from '../js-files/formate-to-rupee'
const { Search, TextArea } = Input

export default function SupplierList({ datas, supplierUpdateMt, storageUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])
  const [payForm] = Form.useForm()
  const [isPayModelOpen, setIsPayModelOpen] = useState(false)
  const [isPayDetailsModelOpen, setIsPayDetailsModelOpen] = useState(false)
  const [supplierPayId, setSupplierPayId] = useState(null)
  const [payDetailsData, setPayDetailsData] = useState([])

  // side effect
  useEffect(() => {
    setData(
      datas.suppliers.length > 0
        ? datas.suppliers
            .filter((data) => data.isdeleted === false)
            .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
        : []
    )
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

  // create new project
  const createNewSupplier = async (values) => {
    const materialExists = datas.storage.find(
      (storageItem) => storageItem.materialname === values.materialname
    )
    await createSupplier({
      ...values,
      createddate: TimestampJs(),
      updateddate: '',
      isdeleted: false
    })
    if (!materialExists) {
      await createStorage({
        materialname: values.materialname,
        alertcount: 0,
        quantity: 0,
        category: 'Material List',
        createddate: TimestampJs()
      })
      storageUpdateMt()
    }
    form.resetFields()
    supplierUpdateMt()
    setIsModalOpen(false)
  }

  const showPayModal = (record) => {
    payForm.setFieldValue({
      amount: record.amount || 'N/A',
      description: record.description || 'N/A'
    })
    setSupplierPayId(record.id)
    setIsPayModelOpen(true)
  }

  const supplierPay = async (value) => {
    let { date, description, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const payData = { ...Datas, date: formateDate, description: description || '' }
    try {
      const customerDocRef = doc(db, 'supplier', supplierPayId)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData)
    } catch (e) {
      console.log(e)
    }
    payForm.resetFields()
    setSupplierPayId(null)
    setIsPayModelOpen(false)
  }

  const showPayDetailsModal = async (record) => {
    try {
      const customerDocRef = doc(db, 'supplier', record.id)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      const payDetailsSnapshot = await getDocs(payDetailsRef)
      const payDetails = payDetailsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }));
      const rawmaterialsRef = datas.rawmaterials.filter((item) => item.isdeleted === false && item.supplierid === record.id);
      const combainData = payDetails.concat(rawmaterialsRef);
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
      render:(text,record,index)=>index+1
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => {
        const dateA = dayjs(a.date, 'DD/MM/YYYY');
        const dateB = dayjs(b.date, 'DD/MM/YYYY');
        return dateA.isAfter(dateB) ? 1 : -1;
      },
      defaultSortOrder: 'descend'
    },
    {
      title: 'Material Name',
      dataIndex: 'materialname',
      key: 'materialname',
      render:(text,record)=> {
        if(record.supplierid !== undefined){
          let materialName = datas.suppliers.find(data => data.id === record.supplierid).materialname;
          return materialName
        }
        else{
          return '-'
        }
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render:(text,record)=>record.quantity !== undefined ? record.quantity+' '+record.unit : '-'
    },
    {
      title: 'Amount',
      dataIndex: 'price',
      key: 'price',
      render:(text,record)=> record.price === undefined ? formatToRupee(record.amount,true) : formatToRupee(record.price,true)
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      render:(text,record)=> record.paymentstatus === undefined ? <Tag color='green'>Pay</Tag> : record.paymentstatus === 'Paid' ? <Tag color='green'>Paid</Tag> : record.paymentstatus === 'Unpaid' ? <Tag color='red'>UnPaid</Tag> : record.paymentstatus === 'Partial' ? <span className='flex items-center'><Tag color='yellow'>Partial</Tag> <Tag color='blue' className=' text-[0.7rem]'>{formatToRupee(record.partialamount,true)}</Tag></span> : <></>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render:(text,record)=>record.description === undefined ? '-' : record.description
    },

  ]

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.location).toLowerCase().includes(value.toLowerCase()) ||
          String(record.productperpack).toLowerCase().includes(value.toLowerCase()) ||
          String(record.price).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Supplier Name',
      dataIndex: 'suppliername',
      key: 'suppliername',
      editable: true,
      sorter: (a, b) => a.suppliername.localeCompare(b.suppliername),
      showSorterTooltip: { target: 'sorter-icon' }
    },
    {
      title: 'Material Name',
      dataIndex: 'materialname',
      key: 'materialname',
      editable: true,
      sorter: (a, b) => a.materialname.localeCompare(b.materialname),
      showSorterTooltip: { target: 'sorter-icon' }
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      editable: true,
      sorter: (a, b) => a.location.localeCompare(b.location),
      showSorterTooltip: { target: 'sorter-icon' }
    },
    {
      title: 'Mobile Number',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber',
      editable: true,
      width: 180
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width:230,
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
            <Button onClick={() => showPayModal(record)}>
              Pay
              <MdOutlinePayments />
            </Button>
            <Button onClick={() => showPayDetailsModal(record)}>
              <SolutionOutlined />
            </Button>
            <Typography.Link
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              onClick={() => edit(record)}
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
        row.materialname === key.materialname &&
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
  };

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
  }, []);

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
                form.setFieldsValue({ gender: 'Male' })
              }}
            >
              New Supplier <IoMdAdd />
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
              loading={data.length >= 0 ? false : true}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
            />
          </Form>
        </li>
      </ul>

      <Modal
        title="New Supplier"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
      >
        <Form
          initialValues={{ gender: 'Male' }}
          onFinish={createNewSupplier}
          form={form}
          layout="vertical"
        >
          <Form.Item
            className="mb-1"
            name="suppliername"
            label="Supplier Name"
            rules={[{ required: true, message: false }]}
          >
            <Input className="w-full" />
          </Form.Item>

          <Form.Item
            className="mb-1"
            name="location"
            label="location"
            rules={[{ required: true, message: false }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            className="mb-1"
            name="materialname"
            label="Material Name"
            rules={[{ required: true, message: false }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            className="mb-1 w-full"
            name="mobilenumber"
            label="Mobile Number"
            rules={[
              { required: true, message: false },
              { type: 'number', message: false }
            ]}
          >
            <InputNumber className="w-full" />
          </Form.Item>

          <Form.Item
            className="mb-1"
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
      </Modal>

      <Modal
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h1>PAY</h1>{' '}
          </div>
        }
        open={isPayModelOpen}
        onCancel={() => setIsPayModelOpen(false)}
        onOk={() => payForm.submit()}
      >
        <Form
          onFinish={supplierPay}
          form={payForm}
          initialValues={{ date: dayjs() }}
          layout="vertical"
        >
          {/* <Form.Item name="customername" label="Customer Name">
            <Input disabled />
          </Form.Item> */}
          <Form.Item
            className="mb-1"
            name="amount"
            label="Amount"
            rules={[{ required: true, message: false }]}
          >
            <InputNumber min={0} className="w-full" placeholder="Amount" />
          </Form.Item>
          <Form.Item className="mb-1" name="description" label="Description">
            <TextArea rows={4} placeholder="Write the description" />
          </Form.Item>
          <Form.Item
            className=" absolute top-5"
            name="date"
            label=""
            rules={[{ required: true, message: false }]}
          >
            <DatePicker format={'DD/MM/YYYY'} />
          </Form.Item>
        </Form>
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
          scroll={{ x: false, y: historyHeight }}
        />
      </Modal>
    </div>
  )
}
