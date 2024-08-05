import React, {useEffect, useState} from 'react';
import { Button, Input, Table, Modal, Form, InputNumber, Typography, Popconfirm, message,Select, DatePicker } from 'antd';
import { PiExport } from "react-icons/pi";
import { IoMdAdd } from "react-icons/io";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { LuSave } from "react-icons/lu";
import { TiCancel } from "react-icons/ti";
import { AiOutlineDelete } from "react-icons/ai";
import { createProjects, deleteProjects, updateProjects } from '../firebase/data-tables/products';
import { TimestampJs } from '../js-files/time-stamp';
const { Search } = Input;
const { RangePicker } = DatePicker;

export default function RawMaterial({ datas, projectUpdateMt }) {

   //states
   const [form] = Form.useForm();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingKey, setEditingKey] = useState('');
   const [data, setData] = useState([]);
 
   // side effect
   useEffect(() => {
     setData(datas.projects.filter(data => data.isdeleted === false).map((item, index) => ({ ...item,sno:index+1, key: item.id || index })));
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
    await createProjects({ 
      ...values, 
      // createdby: 'admin', 
      createddate: TimestampJs(), 
      // updatedby: '', 
      updateddate: '', 
      isdeleted: false 
    });
    form.resetFields();
    projectUpdateMt();
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
      dataIndex: 'createddate',
      key: 'createddate',
      editable: false,
    },
    {
      title: 'Material',
      dataIndex: 'productname',
      key: 'productname',
      editable: true,
    },
    {
      title: 'Supplier',
      dataIndex: 'productname',
      key: 'productname',
      editable: true,
    },
    {
      title: 'Location',
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
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      editable: true,
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'productperpack',
      key: 'productperpack',
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
        inputType: col.dataIndex === 'quantity' || col.dataIndex === 'productperpack' || col.dataIndex === 'price' ? 'number' : 'text',
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
        row.flavour === key.flavour && 
        row.productname === key.productname && 
        row.quantity === key.quantity && 
        row.productperpack === key.productperpack && 
        row.price === key.price) {
        message.open({type: 'info',content: 'No changes made',});
        setEditingKey('');
      } else {
        await updateProjects(key.id,{...row,updateddate: TimestampJs()},);
        projectUpdateMt();
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
      console.log(selectTableData);
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
      //await deleteProjects(data.id);
      const {id,...newData} = data;
      await updateProjects(id,{isdeleted: true,deletedby: 'admin',deleteddate: TimestampJs()});
      projectUpdateMt();
      message.open({type: 'success',content: 'Deleted Successfully',});
    };

  return (
    <div>
      <ul>
      <li className='flex gap-x-3 justify-between items-center'>
      <Search  allowClear className='w-[40%]' placeholder="Search" onSearch={onSearchEnter} onChange={onSearchChange} enterButton />
      <span className='flex gap-x-3 justify-center items-center'>
      <RangePicker />
          <Button>Export <PiExport /></Button>
          <Button type="primary" onClick={() => {setIsModalOpen(true); form.resetFields()}}>
              Add Material <IoMdAdd />
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
        title="Products"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => { 
          setIsModalOpen(false); 
          form.resetFields(); 
        }}
      >
      <Form
          onFinish={createNewProject}
          form={form}
          layout='vertical'
        >
          <Form.Item className='mb-0' name='productname' label="Product Name" rules={[{ required: true, message: false }]}>
            <Input />
          </Form.Item>

          <span className='flex gap-x-2'>
          <Form.Item className='mb-0 w-full' name='quantity' label="Quantity" rules={[{ required: true, message: false }, { type: 'number', message: false }]}>
            <InputNumber className='w-full' />
          </Form.Item>

          <Form.Item className='mb-0' name='mesurment' label="Mesurment" rules={[{ required: true, message: false }]}>
          <Select
            showSearch
            
            placeholder="Search to Select"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={[
              {
                value: 'gm',
                label: 'GM',
              },
              {
                value: 'mm',
                label: 'MM',
              },
              {
                value: 'kg',
                label: 'KG',
              }
            ]}
          />
          </Form.Item>
          </span>

          <Form.Item className='mb-0' name='flavour' label="Flavour" rules={[{ required: true, message: false }]}>
            <Input />
          </Form.Item>

          <Form.Item className='mb-0' name='productperpack' label="Product Per Pack" rules={[{ required: true, message: false }, { type: 'number', message: false }]}>
            <InputNumber className='w-full' />
          </Form.Item>

          <Form.Item className='mb-0' name='price' label="Price" rules={[{ required: true, message: false }, { type: 'number', message: false }]}>
            <InputNumber className='w-full' />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  )
}
