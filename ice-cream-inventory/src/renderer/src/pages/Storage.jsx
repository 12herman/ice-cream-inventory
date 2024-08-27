import React, { useState, useEffect } from 'react'
import {
  Input,
  Button,
  Table,
  Segmented,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Typography,
  message
} from 'antd'
import { MdAccessAlarm } from 'react-icons/md'
import { LiaUndoAltSolid } from 'react-icons/lia'
import { LuMilk, LuIceCream } from 'react-icons/lu'
import { TimestampJs } from '../js-files/time-stamp'
import { updateStorage } from '../firebase/data-tables/storage'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { AiOutlineDelete } from 'react-icons/ai'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { useForm } from 'antd/es/form/Form'
const { Search } = Input

export default function Storage({ datas, storageUpdateMt }) {
  const [form] = Form.useForm()
  const [ediablefForm] = Form.useForm()
  const [data, setData] = useState([])
  const [selectedSegment, setSelectedSegment] = useState('Material List')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [editingKeys, setEditingKeys] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  useEffect(() => {
    setTableLoading(true)
    const rawData = datas.storage.filter((data) => data.category === selectedSegment)
    setData(rawData)
    setTableLoading(false)
  }, [datas, selectedSegment])

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

  const setAlert = async (values) => {
    if (editingRecordId) {
      await updateStorage(editingRecordId, {
        alertcount: values.alertcount,
        updateddate: TimestampJs()
      })
    }
    form.resetFields()
    storageUpdateMt()
    setEditingRecordId(null)
    setIsModalVisible(false)
  }

  const resetStorage = async (values) => {
    if (values.category === 'Material List') {
      await updateStorage(values.id, {
        quantity: 0,
        updateddate: TimestampJs()
      })
    } else {
      await updateStorage(values.id, {
        numberofpacks: 0,
        updateddate: TimestampJs()
      })
    }
    storageUpdateMt()
  }

  const showModal = (record) => {
    form.setFieldsValue({
      materialname: record.materialname || 'N/A',
      productname: record.productname || 'N/A',
      flavour: record.flavour || 'N/A',
      quantity: record.quantity || 'N/A',
      alertcount: record.alertcount || undefined
    })
    setEditingRecordId(record.id)
    setIsModalVisible(true)
  }

  const onSegmentChange = (value) => {
    setEditingKeys([])
    setSelectedSegment(value)
    setSearchText('')
  }

  // const materialColumns = [
  //   {
  //     title: 'S.No',
  //     key: 'sno',
  //     width: 70,
  //     render: (_, __, index) => index + 1,
  //     filteredValue: [searchText],
  //     onFilter: (value, record) => {
  //       return (
  //         String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
  //         String(record.quantity).toLowerCase().includes(value.toLowerCase())
  //       )
  //     }
  //   },
  //   {
  //     title: 'Material',
  //     dataIndex: 'materialname',
  //     key: 'materialname',
  //     sorter: (a, b) => a.materialname.localeCompare(b.materialname),
  //     showSorterTooltip: { target: 'sorter-icon' },
  //     editable: true,
  //   },
  //   {
  //     title: 'Quantity',
  //     dataIndex: 'quantity',
  //     key: 'quantity',
  //     editable: true,
  //   },
  //   {
  //     title: 'Alert Count',
  //     dataIndex: 'alertcount',
  //     key: 'alertcount',
  //     editable: true,
  //   },
  //   {
  //     title: 'Action',
  //     dataIndex: 'operation',
  //     fixed: 'right',
  //     width:230,
  //     render: (_, record) => {
  //       let editable = isEditing(record);
  //       return editable ? (
  //         <span className="flex gap-x-1 items-center">
  //           <Typography.Link
  //             onClick={
  //               // save(record)
  //               setEditingKeys([])
  //             }
  //             style={{
  //               marginRight: 8
  //             }}
  //           >
  //             <LuSave size={17} />
  //           </Typography.Link>
  //           <Popconfirm title="Sure to cancel?" onConfirm={setEditingKeys([])}>
  //             <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
  //           </Popconfirm>
  //         </span>
  //       ) : (
  //         <span className="flex gap-x-3  items-center">
  //           <Typography.Link
  //             onClick={() => edit(record)}
  //           >
  //             <MdOutlineModeEditOutline size={20} />
  //           </Typography.Link>
  //           <Popconfirm
  //             className={`${editingKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'} `}
  //             title="Sure to delete?"
  //             onConfirm={() => deleteProduct(record)}
  //           >
  //             <AiOutlineDelete
  //               className={`${editingKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
  //               size={19}
  //             />
  //           </Popconfirm>
  //         </span>
  //       )
  //     }
  //   }
  //   // {
  //   //   title: 'Action',
  //   //   dataIndex: 'operation',
  //   //   fixed: 'right',
  //   //   width: 150,
  //   //   render: (_, record) => (
  //   //     <>
  //   //       <Button
  //   //         onClick={() => showModal(record)}
  //   //         style={{ color: record.quantity < record.alertcount ? 'red' : 'default' }}
  //   //       >
  //   //         <MdAccessAlarm />
  //   //       </Button>
  //   //       <Popconfirm
  //   //         title="Are you sure to reset?"
  //   //         onConfirm={() => resetStorage(record)}
  //   //         okText="Yes"
  //   //         cancelText="No"
  //   //       >
  //   //         <Button className="ml-2">
  //   //           <LiaUndoAltSolid />
  //   //         </Button>
  //   //       </Popconfirm>
  //   //     </>
  //   //   )
  //   // }
  // ];

  const materialColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase())
        )
      },
      editable: false
    },
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname',
      sorter: (a, b) => a.materialname.localeCompare(b.materialname),
      showSorterTooltip: { target: 'sorter-icon' },
      editable: false
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true
    },
    {
      title: 'Alert Count',
      dataIndex: 'alertcount',
      key: 'alertcount',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <span className="flex gap-x-1 items-center">
            <Typography.Link onClick={() => storageSave(record)} style={{ marginRight: 8 }}>
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-3 items-center">
            <Typography.Link disabled={editingKeys.length !== 0} onClick={() => edit(record)}>
              <MdOutlineModeEditOutline size={19} />
            </Typography.Link>
            {/* <Popconfirm
              disabled={editingKeys.length !== 0}
              className={`${editingKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              title="Sure to delete?"
              onConfirm={() => console.log(record.id)}
            >
              <AiOutlineDelete
              className={`${editingKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm> */}
          </span>
        )
      }
    }
  ]

  const productColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.productname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.flavour).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
          String(record.alertcount).toLowerCase().includes(value.toLowerCase()) ||
          String(record.numberofpacks).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Product',
      dataIndex: 'productname',
      key: 'productname',
      sorter: (a, b) => a.productname.localeCompare(b.productname),
      showSorterTooltip: { target: 'sorter-icon' }
    },
    {
      title: 'Flavor',
      dataIndex: 'flavour',
      key: 'flavour',
      sorter: (a, b) => a.flavour.localeCompare(b.flavour),
      showSorterTooltip: { target: 'sorter-icon' }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'Box',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_, record) => {
        const quotient = Math.floor(record.numberofpacks / record.productperpack);
        const remainder = record.numberofpacks % record.productperpack;
        return `${quotient} Box , ${remainder} Piece`;
      }
    },
    {
      title: 'Packs',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      sorter: (a, b) => (Number(a.numberofpacks) || 0) - (Number(b.numberofpacks) || 0),
      showSorterTooltip: { target: 'sorter-icon' },
      editable: true
    },
    {
      title: 'Alert Count',
      dataIndex: 'alertcount',
      key: 'alertcount',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <span className="flex gap-x-1 items-center">
            <Typography.Link onClick={() => storageSave(record)} style={{ marginRight: 8 }}>
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-3 items-center">
            <Typography.Link disabled={editingKeys.length !== 0} onClick={() => edit(record)}>
              <MdOutlineModeEditOutline size={19} />
            </Typography.Link>
            {/* <Popconfirm
              disabled={editingKeys.length !== 0}
              className={`${editingKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              title="Sure to delete?"
              onConfirm={() => console.log(record.id)}
            >
              <AiOutlineDelete
              className={`${editingKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm> */}
          </span>
        )
      }
      // render: (_, record) => (
      //   <>
      //     <Button
      //       onClick={() => showModal(record)}
      //       style={{ color: record.numberofpacks < record.alertcount ? 'red' : 'default' }}
      //     >
      //       <MdAccessAlarm />
      //     </Button>
      //     <Popconfirm
      //       title="Are you sure to reset?"
      //       onConfirm={() => resetStorage(record)}
      //       okText="Yes"
      //       cancelText="No"
      //     >
      //     <Button className="ml-2">
      //       <LiaUndoAltSolid />
      //     </Button>
      //     </Popconfirm>
      //   </>
      // )
    }
  ]

  const columns = selectedSegment === 'Material List' ? materialColumns : productColumns
  const edit = (record) => {
    ediablefForm.setFieldsValue({ ...record })
    setEditingKeys([record.id])
  }

  const isEditing = (record) => {
    return editingKeys.includes(record.id)
  }

  const mergedColumns = columns.map((item) => {
    if (!item.editable) {
      return item
    }
    return {
      ...item,
      onCell: (record) => ({
        record,
        inputType: item.dataIndex,
        dataIndex: item.dataIndex,
        title: item.title,
        editing: isEditing(record)
      })
    }
  })

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
    const inputNode =
      dataIndex === 'quantity' || dataIndex === 'alertcount' ? <InputNumber /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: false
              }
            ]}
          >
            {inputNode}
            {/* <InputNumber /> */}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    )
  }

  const cancel = () => {
    setEditingKeys([])
  }

  const storageSave = async (record) => {
    try {
      const row = await ediablefForm.validateFields()
      if (selectedSegment === 'Material List') {
        const exsitingData = await datas.storage.some(
          (item) =>
            item.id === record.id &&
            item.quantity === row.quantity &&
            item.alertcount === row.alertcount
        )
        if (exsitingData) {
          message.open({
            type: 'info',
            content: 'Data already exists',
            duration: 2
          })
          setEditingKeys([])
        } else {
          setTableLoading(true)
          await updateStorage(record.id, {
            alertcount: row.alertcount,
            quantity: row.quantity,
            updateddate: TimestampJs()
          })
          storageUpdateMt()
          setEditingKeys([])
          setTableLoading(false)
        }
      } else {
        const exsitingData = await datas.storage.some(
          (item) =>
            item.id === record.id &&
            item.numberofpacks === row.numberofpacks &&
            item.alertcount === row.alertcount
        )
        if (exsitingData) {
          message.open({
            type: 'info',
            content: 'Data already exists',
            duration: 2
          })
          setEditingKeys([])
        } else {
          setTableLoading(true)
          await updateStorage(record.id, {
            alertcount: row.alertcount,
            numberofpacks: row.numberofpacks,
            updateddate: TimestampJs()
          })
          storageUpdateMt()
          setEditingKeys([])
          setTableLoading(false)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div>
      <ul>
        <li className="flex gap-x-3 justify-between items-center">
          <Search
            placeholder="Search"
            className="w-[30%]"
            onSearch={onSearchEnter}
            onChange={onSearchChange}
            enterButton
          />

          <Segmented
            options={[
              {
                label: (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <LuMilk />
                    <span>Material List</span>
                  </div>
                ),
                value: 'Material List'
              },
              {
                label: (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <LuIceCream />
                    <span>Product List</span>
                  </div>
                ),
                value: 'Product List'
              }
            ]}
            onChange={onSegmentChange}
            value={selectedSegment}
          />
        </li>

        <li className="mt-2">
          <Form form={ediablefForm} component={false}>
            <Table
              virtual
              columns={mergedColumns}
              components={{ body: { cell: EditableCell } }}
              dataSource={data}
              // loading={data.length === 0}
              loading={tableLoading}
              pagination={false}
              scroll={{ x: false, y: false }}
              rowKey="id"
            />
          </Form>
        </li>
      </ul>

      <Modal
        title="Set Alert"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form onFinish={setAlert} form={form} layout="vertical">
          {selectedSegment === 'Material List' && (
            <>
              <Form.Item name="materialname" label="Material">
                <Input disabled />
              </Form.Item>
              <Form.Item name="alertcount" label="Alert Count" rules={[{ required: true }]}>
                <InputNumber className="w-full" />
              </Form.Item>
            </>
          )}
          {selectedSegment === 'Product List' && (
            <>
              <Form.Item name="productname" label="Product">
                <Input disabled />
              </Form.Item>
              <Form.Item name="flavour" label="Flavor">
                <Input disabled />
              </Form.Item>
              <Form.Item name="quantity" label="Quantity">
                <Input disabled />
              </Form.Item>
              <Form.Item name="alertcount" label="Alert Count" rules={[{ required: true }]}>
                <InputNumber className="w-full" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
