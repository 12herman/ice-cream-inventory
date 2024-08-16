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
  DatePicker
} from 'antd'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { SolutionOutlined } from '@ant-design/icons'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import jsonToExcel from '../js-files/json-to-excel'
import {
  createEmployee,
  fetchPayDetailsForEmployee,
  updateEmployee,
  updatePayDetailsForEmployee
} from '../firebase/data-tables/employee'
const { Search } = Input
import dayjs from 'dayjs'
import { addDoc, collection, doc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { formatToRupee } from '../js-files/formate-to-rupee'

export default function Employee({ datas, employeeUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])

  // side effect
  useEffect(() => {
    setData(
      datas.employees.length > 0
        ? datas.employees
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
  const createNewProject = async (values) => {
    await createEmployee({
      ...values,
      createddate: TimestampJs(),
      updateddate: '',
      isdeleted: false
    })
    form.resetFields()
    employeeUpdateMt()
    message.open({ type: 'success', content: 'Created Successfully' })
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
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.location).toLowerCase().includes(value.toLowerCase()) ||
          String(record.productperpack).toLowerCase().includes(value.toLowerCase()) ||
          String(record.price).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeename',
      key: 'employeename',
      editable: true,
      sorter: (a, b) => a.employeename.localeCompare(b.employeename),
      showSorterTooltip: { target: 'sorter-icon' }
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      editable: true,
      sorter: (a, b) => a.position.localeCompare(b.position),
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
              onClick={() => {
                setEmployeePay((pre) => ({ ...pre, modal: true, name: record }))
              }}
            >
              Pay
              <MdOutlinePayments />
            </Button>
            <Button
              onClick={async () => {
                let { paydetails, status } = await fetchPayDetailsForEmployee(record.id)
                if (status) {
                  let checkPayData = paydetails.filter((item) => item.isdeleted === false);
                  setEmployeePayDetails((pre) => ({ ...pre, modal: true, data: checkPayData, parentid:record.id }))
                }
              }}
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
            ) : dataIndex === 'position' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="position"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select Position"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'Office Admin', label: 'Office Admin' },
                      { value: 'Worker', label: 'Worker' }
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
  };

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
  });

  const cancel = () => {
    setEditingKeys([])
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields()
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (
        index != null &&
        row.employeename === key.employeename &&
        row.position === key.position &&
        row.location === key.location &&
        row.mobilenumber === key.mobilenumber &&
        row.gender === key.gender
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
      } else {
        await updateEmployee(key.id, { ...row, updateddate: TimestampJs() })
        employeeUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  };

  // selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
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
  }, []);

  // delete
  const deleteProduct = async (data) => {
    // await deleteproduct(data.id);
    const { id, ...newData } = data
    await updateEmployee(id, {
      isdeleted: true,
      // deletedby: 'admin',
      deleteddate: TimestampJs()
    })
    employeeUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  };

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    jsonToExcel(exportDatas, `Employee-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKeys('')
  };

  // employee pay
  const [employeePayForm] = Form.useForm()
  const [employeePay, setEmployeePay] = useState({
    modal: false,
    name: {},
    data: dayjs().format('DD/MMM/YYYY')
  });

  const empPayMt = async (value) => {
    let { date, description, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const empId = employeePay.name.id
    const payData = {
      ...Datas,
      date: formateDate,
      description: description === undefined ? '' : description,
      type: 'pay',
      createddate:TimestampJs(),
      isdeleted:false
    };

    try {
      const employeeDocRef = doc(db, 'employee', empId)
      const payDetailsRef = collection(employeeDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData);
      message.open({ type: 'success', content: 'Pay Added Successfully' })
    } catch (e) {
      console.log(e)
    }
    employeePayForm.resetFields()
    setEmployeePay((pre) => ({ ...pre, modal: false }))
  }

  // employee pay details
  const [employeePayDetails, setEmployeePayDetails] = useState({
    modal: false,
    data: [],
    isedit: [],
    parentid: 0
  });

  const employeePayDetailsColumn = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      render: (_, record, index) => <span>{index + 1}</span>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      editable: true
    },
    {
      title: 'Amount ₹',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <span>{formatToRupee(amount, true)}</span>,
      editable: true
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => {
        let iseditable = isEmpDtailTableEditing(record)
        return !iseditable ? (
          <span className="flex gap-2">
            <Typography.Link
              className="cursor-pointer"
              onClick={() => empDetailTbEdit(record)}
              style={{ marginRight: 8 }}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>

            <Popconfirm onConfirm={()=> payDetailDelete(record)} className="cursor-pointer" title="Sure to delete?">
              <AiOutlineDelete className="text-red-500" size={19} />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-2">
            <Typography.Link
              style={{ marginRight: 8 }}
              onClick={() => payDetailSave(record)}
            >
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => setEmployeePayDetails((pre) => ({ ...pre, isedit: [] })) }
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ];

  const isEmpDtailTableEditing = (record) => {
    return employeePayDetails.isedit.includes(record.id)
  };

  const mergedEmpPayDetailColumn = employeePayDetailsColumn.map((item) => {
    if (!item.editable) {
      return item
    }
    return {
      ...item,
      onCell: (record) => ({
        record,
        dataIndex: item.dataIndex,
        title: item.title,
        editing: isEmpDtailTableEditing(record)
      })
    }
  });

  const empDetailTbEdit = (record) => {
    const date = dayjs(record.date, "DD/MM/YYYY");
    empdetailpayform.setFieldsValue({ ...record,date })
    setEmployeePayDetails((pre) => ({ ...pre, isedit:[record.id]}));
    console.log();
  };

  const EmpPayDetailTableEditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = dataIndex === 'amount' ? <InputNumber /> : <Input />;
    return (
      <td {...restProps}>
        {editing ? (
          dataIndex === 'date' ? (
            <Form.Item
              name="date"
              style={{ margin: 0 }}
              valuePropName="value"
              rules={[{ required: true, message: false }]}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          ) : (
            <Form.Item
              name={dataIndex}
              style={{ margin: 0 }}
              rules={[
                {
                  required: true,
                  message: false,
                },
              ]}
            >
              {inputNode}
            </Form.Item>
          )
        ) : (
          children
        )}
      </td>
    );
  };

  const [empdetailpayform] = Form.useForm();
  // edid cell save
  const payDetailSave = async (value) =>{
    try{
      const row = await empdetailpayform.validateFields();
      const oldData = [...employeePayDetails.data];
      const index = oldData.findIndex((item) => value.id === item.id);
      const existingData = oldData.filter((item) => item.id === value.id)[0];
      const newDatas =({...row,date:row.date.format('DD/MM/YYYY'),updateddate:TimestampJs()});
      if(existingData.amount === row.amount && existingData.description === row.description && existingData.date === row.date.format('DD/MM/YYYY') && index !== null){
          message.open({
            type: 'info',
            content: 'No changes made',
            duration: 2
          });
         setEmployeePayDetails((pre) => ({ ...pre, isedit: [] }))
         return;
      }
      else{
        await updatePayDetailsForEmployee(employeePayDetails.parentid,value.id,newDatas);
        setEmployeePayDetails((pre) => ({ ...pre, isedit: [] }));
        employeeUpdateMt();
        let { paydetails, status } = await fetchPayDetailsForEmployee(employeePayDetails.parentid)
                if (status) {
                  let checkPayData = paydetails.filter((item) => item.isdeleted === false);
                  setEmployeePayDetails((pre) => ({ ...pre, data: checkPayData }))
                }
        message.open({ type: 'success',content: 'Payment Data updated successfully'});
      } 
    }catch(e){console.log(e)}
  };

  // delete row
  const payDetailDelete = async(value)=>{
    console.log(value.id,employeePayDetails.parentid);
    await updatePayDetailsForEmployee(employeePayDetails.parentid,value.id,{isdeleted:true,updateddate:TimestampJs()});
    employeeUpdateMt();
    let { paydetails, status } = await fetchPayDetailsForEmployee(employeePayDetails.parentid)
        if (status) {
            let checkPayData = paydetails.filter((item) => item.isdeleted === false);
            setEmployeePayDetails((pre) => ({ ...pre, data: checkPayData }))
            }
        message.open({ type: 'success',content: 'Payment Data deleted successfully'});
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
                form.setFieldsValue({ gender: 'Male', position: 'Worker' })
              }}
            >
              New Employee <IoMdAdd />
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
        title="New Employee"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}>
        <Form
          initialValues={{ gender: 'Male', position: 'Worker' }}
          onFinish={createNewProject}
          form={form}
          layout="vertical"
        >
          <Form.Item
            className="mb-1"
            name="employeename"
            label="Employee Name"
            rules={[{ required: true, message: false }]}
          >
            <Input />
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

          <Form.Item
            className="mb-1"
            name="position"
            label="Position"
            rules={[{ required: true, message: false }]}
          >
            <Radio.Group>
              <Radio value={'Office Admin'}>Office Admin</Radio>
              <Radio value={'Worker'}>Worker</Radio>
            </Radio.Group>
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
            name="location"
            label="Location"
            rules={[{ required: true, message: false }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={employeePay.modal}
        onCancel={() => {
          setEmployeePay((pre) => ({ ...pre, modal: false }))
          employeePayForm.resetFields();
        }}
        onOk={() => employeePayForm.submit()}
      >
        <span className="block w-full text-center mb-7 text-2xl font-bold">PAY</span>
        <span className="w-full text-center block text-sm font-medium uppercase">
          {employeePay.name.employeename}
        </span>
        <Form
          onFinish={empPayMt}
          form={employeePayForm}
          initialValues={{ date: dayjs() }}
          layout="vertical"
        >
          <Form.Item
            className="mb-1"
            name="amount"
            label="Amount"
            rules={[{ required: true, message: false }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            className="mb-1"
            name="description"
            label="Description"
            //rules={[{ required: true, message: false }]}
          >
            <Input placeholder="Write the description" />
          </Form.Item>

          <Form.Item
            className=" absolute top-5"
            name="date"
            label=""
            rules={[{ required: true, message: false }]}
          >
            <DatePicker format={'DD/MM/YY'} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-center w-full block pb-5">PAY DETAILS</span>}
        open={employeePayDetails.modal}
        footer={null}
        pagination={{pageSize: 5}}
        width={1000}
        onCancel={() => {
          setEmployeePayDetails((pre) => ({ ...pre, modal: false, data: [],isedit:[] }));
        }}
      >
        <Form form={empdetailpayform} component={false}>
          <Table
            pagination={{ pageSize: 5 }}
            columns={mergedEmpPayDetailColumn}
            components={{
              body: {
                cell: EmpPayDetailTableEditableCell
              }
            }}
            dataSource={employeePayDetails.data}
          />
        </Form>
      </Modal>
    </div>
  )
}
