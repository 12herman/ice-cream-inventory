
import React, { useEffect, useState } from 'react';
import { Button, Input, Table, Modal, Form, InputNumber, Typography, Popconfirm, message, Select, Radio } from 'antd';
import { PiExport } from "react-icons/pi";
import { IoMdAdd } from "react-icons/io";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { LuSave } from "react-icons/lu";
import { TiCancel } from "react-icons/ti";
import { AiOutlineDelete } from "react-icons/ai";
import { MdOutlinePayments } from "react-icons/md";
import { createproduct, deleteproduct, updateproduct } from '../firebase/data-tables/products';
import { TimestampJs } from '../js-files/time-stamp';
import jsonToExcel from '../js-files/json-to-excel';
import { createSupplier, updateSupplier } from '../firebase/data-tables/supplier';
import { createEmployee, updateEmployee } from '../firebase/data-tables/employee';
const { Search } = Input;

export default function Employee({ datas, employeeUpdateMt }) {
  // states
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKeys, setEditingKeys] = useState([]);
  const [data, setData] = useState([]);

  // side effect
  useEffect(() => {
    setData(datas.employees.length > 0 ?  datas.employees.filter(data => data.isdeleted === false).map((item, index) => ({ ...item,sno:index+1, key: item.id || index })):[]);
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

  // create new project 
  const createNewProject = async (values) => {
    await createEmployee({ 
      ...values, 
      createddate: TimestampJs(), 
      updateddate: '', 
      isdeleted: false 
    });
    form.resetFields();
    employeeUpdateMt();
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 70,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return(
          String(record.sno).toLowerCase().includes(value.toLowerCase()) ||
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.location).toLowerCase().includes(value.toLowerCase()) ||
          String(record.productperpack).toLowerCase().includes(value.toLowerCase()) ||
          String(record.price).toLowerCase().includes(value.toLowerCase()) 
        )
      },
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeename',
      key: 'employeename',
      editable: true,
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      editable: true,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      editable: true,
    },
    {
      title: 'Mobile Number',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber',
      editable: true,
      width: 180,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      editable: true,
    },
    {
      title: 'Operation',
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
            }}>
            <LuSave size={17}/>
          </Typography.Link>
          <Popconfirm  title="Sure to cancel?" onConfirm={cancel}>
          <TiCancel size={20} className='text-red-500 cursor-pointer hover:text-red-400' />
          </Popconfirm>
        </span>
        ) : (
        <span className='flex gap-x-3 justify-center items-center'>
        <Typography.Link disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0} onClick={() => edit(record)}>
          <MdOutlineModeEditOutline size={20} />
          </Typography.Link>
          <Popconfirm disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0} className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'cursor-not-allowed': 'cursor-pointer'} `} title="Sure to delete?" onConfirm={() => deleteProduct(record)} >
            <AiOutlineDelete className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0  ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`} size={19}/>
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
          <>
            { dataIndex === 'gender' ? 
              <span className='flex gap-x-1'>
                <Form.Item
                  name="gender"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select Gender"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                    ]}
                  />
                </Form.Item>
              </span>
            : dataIndex === 'position' ? 
            <span className='flex gap-x-1'>
                <Form.Item
                  name="position"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select Position"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'Office Admin', label: 'Office Admin' },
                      { value: 'Worker', label: 'Worker' },
                    ]}
                  />
                </Form.Item>
              </span>
            :<Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
                {inputNode}
              </Form.Item>
            }
          </>
        ) : (
          children
        )}
      </td>
    );
  };

  const isEditing = (record) => editingKeys.includes(record.key);

  const edit = (record) => { 
    form.setFieldsValue({ ...record });
    setEditingKeys([record.key]);
  };

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'mobilenumber' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const cancel = () => {
    setEditingKeys([]);
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex((item) => key.id === item.key);
      if (index != null &&
        row.employeename === key.employeename && 
        row.position === key.position && 
        row.location === key.location && 
        row.mobilenumber === key.mobilenumber && 
        row.gender === key.gender) {
        message.open({type: 'info',content: 'No changes made',});
        setEditingKeys([]);
      } else {
        await updateEmployee(key.id,{...row,updateddate: TimestampJs()},);
        employeeUpdateMt();
        message.open({type: 'success',content: 'Updated Successfully',});
        setEditingKeys([]);
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  // selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
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
            if (index % 2 === 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  // Table Height Auto Adjustment (***Do not touch this code***)
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
    // await deleteproduct(data.id);
    const {id,...newData} = data;
    await updateEmployee(id,{isdeleted: true,
      // deletedby: 'admin',
      deleteddate: TimestampJs()});
    employeeUpdateMt();
    message.open({type: 'success',content: 'Deleted Successfully',});
  };

  // export
  const payMt = async () => {
    // const exportDatas = data.filter(item => selectedRowKeys.includes(item.key));
    // jsonToExcel(exportDatas,`Supplier-List-${TimestampJs()}`);
  }

  return (
    <div>
      <ul>
        <li className='flex gap-x-3 justify-between items-center'>
          <Search  allowClear className='w-[50%]' placeholder="input search text" onSearch={onSearchEnter} onChange={onSearchChange} enterButton />
          <span className='flex gap-x-3 justify-center items-center'>
            <Button disabled={editingKeys.length !== 0 ||  selectedRowKeys.length === 0} onClick={payMt}>Pay <MdOutlinePayments /></Button>
            <Button disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0} type="primary" onClick={() => {setIsModalOpen(true); form.resetFields(); form.setFieldsValue({gender: 'Male',position:'Worker'});}}>
              New Employee <IoMdAdd />
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
              loading={data.length >= 0 ? false : true}
              rowClassName="editable-row"
              scroll={{x:900,y: tableHeight}}
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
          setIsModalOpen(false); 
          form.resetFields(); 
        }}
      >
        <Form
          initialValues={{ gender: 'Male',position:'Worker'}} 
          onFinish={createNewProject}
          form={form}
          layout='vertical'
        >
          <Form.Item className='mb-1' name='employeename' label="Employee Name" rules={[{ required: true, message: false }]}>
            <Input />
          </Form.Item>

          <Form.Item className='mb-1' name='gender' label="Gender" rules={[{ required: true, message: false }]}>
          <Radio.Group>
            <Radio value={'Male'}>Male</Radio>
            <Radio value={'Female'}>Female</Radio>
          </Radio.Group>
          </Form.Item>
  
          <Form.Item className='mb-1' name='position' label="Position" rules={[{ required: true, message: false }]}>
          <Radio.Group>
            <Radio value={'Office Admin'}>Office Admin</Radio>
            <Radio value={'Worker'}>Worker</Radio>
          </Radio.Group>
          </Form.Item>

          <Form.Item className='mb-1 w-full' name='mobilenumber' label="Mobile Number" rules={[{ required: true, message: false },{ type: 'number', message: false }]}>
            <InputNumber className='w-full' />
          </Form.Item>

          <Form.Item className='mb-1' name='location' label="Location" rules={[{ required: true, message: false }]}>
            <Input />
          </Form.Item>
         
        </Form>
      </Modal>
    </div>
  );
}


